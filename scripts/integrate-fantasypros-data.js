#!/usr/bin/env node

/**
 * Integrate FantasyPros Data
 * Merges verified fantasypros-scrape-results.json with current player mappings
 * Identifies conflicts, overlaps, and adds verified data
 */

const fs = require('fs');
const path = require('path');

// Load data sources
const fantasyProResultsPath = path.join(__dirname, '../tmp/fantasypros-scrape-results.json');
const currentMappingPath = path.join(__dirname, '../src/data/player-images.json');

function loadFantasyProResults() {
  if (!fs.existsSync(fantasyProResultsPath)) {
    console.log('❌ FantasyPros results file not found');
    return null;
  }
  return JSON.parse(fs.readFileSync(fantasyProResultsPath, 'utf8'));
}

function loadCurrentMapping() {
  if (!fs.existsSync(currentMappingPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(currentMappingPath, 'utf8'));
}

function generatePlayerKey(player) {
  return `${player.name.toLowerCase()}-${player.team.toLowerCase()}`;
}

function generateAlternativeKeys(player) {
  const keys = [];
  const name = player.name.toLowerCase();
  const team = player.team.toLowerCase();
  
  // Basic variations
  keys.push(`${name}-${team}`);
  keys.push(name.replace(/\s+/g, '-') + `-${team}`);
  
  // Remove common suffixes
  const nameNoSuffix = name.replace(/\s(jr\.?|sr\.?|ii|iii|iv|v)$/g, '').trim();
  if (nameNoSuffix !== name) {
    keys.push(`${nameNoSuffix}-${team}`);
  }
  
  // Team abbreviation variations
  const teamVariations = {
    'was': ['wsh'],
    'wsh': ['was'],
    'jac': ['jax'], 
    'jax': ['jac'],
    'lv': ['las'],
    'las': ['lv']
  };
  
  if (teamVariations[team]) {
    teamVariations[team].forEach(altTeam => {
      keys.push(`${name}-${altTeam}`);
      if (nameNoSuffix !== name) {
        keys.push(`${nameNoSuffix}-${altTeam}`);
      }
    });
  }
  
  return [...new Set(keys)].filter(Boolean);
}

function analyzeOverlaps(fantasyProData, currentMapping) {
  console.log('🔍 ANALYZING DATA OVERLAPS');
  console.log('==========================\n');
  
  const successful = fantasyProData.successful || [];
  const skipped = fantasyProData.skipped || [];
  const failed = fantasyProData.failed || [];
  
  console.log(`📊 FantasyPros Data Summary:`);
  console.log(`   ✅ Successful: ${successful.length}`);
  console.log(`   ⏭️  Skipped: ${skipped.length}`);
  console.log(`   ❌ Failed: ${failed.length}`);
  console.log(`   📋 Total: ${successful.length + skipped.length + failed.length}\n`);
  
  let newAdditions = 0;
  let existingUpdates = 0;
  let conflicts = 0;
  
  // Check successful downloads
  successful.forEach(player => {
    const primaryKey = generatePlayerKey(player);
    const altKeys = generateAlternativeKeys(player);
    
    const existsInCurrent = currentMapping[primaryKey] || 
                           altKeys.some(key => currentMapping[key]);
    
    if (existsInCurrent) {
      // Check if it's a conflict (different image)
      const existingEntry = currentMapping[primaryKey] || 
                           altKeys.find(key => currentMapping[key] && currentMapping[key]);
      
      if (existingEntry && existingEntry.imagePath !== player.imagePath) {
        console.log(`   ⚠️  Conflict: ${player.name} (${player.team})`);
        console.log(`      Current: ${existingEntry.imagePath}`);
        console.log(`      FP Data: ${player.imagePath}`);
        conflicts++;
      } else {
        existingUpdates++;
      }
    } else {
      console.log(`   ➕ New: ${player.name} (${player.team}) -> ${player.imagePath}`);
      newAdditions++;
    }
  });
  
  console.log(`\n📈 Integration Summary:`);
  console.log(`   ➕ New additions: ${newAdditions}`);
  console.log(`   🔄 Existing updates: ${existingUpdates}`);
  console.log(`   ⚠️  Conflicts: ${conflicts}`);
  
  return { newAdditions, existingUpdates, conflicts };
}

function integrateFantasyProData(fantasyProData, currentMapping) {
  console.log('\n🔄 INTEGRATING FANTASYPROS DATA');
  console.log('===============================\n');
  
  const successful = fantasyProData.successful || [];
  let addedCount = 0;
  let updatedCount = 0;
  
  successful.forEach(player => {
    const primaryKey = generatePlayerKey(player);
    const cleanKey = primaryKey.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    
    // Add or update main entry
    currentMapping[cleanKey] = {
      name: player.name,
      team: player.team,
      position: player.position,
      imagePath: player.imagePath,
      source: player.source || 'fantasypros',
      verified: true,
      rank: player.rank,
      addedBy: 'fantasypros-integration'
    };
    
    // Add alternative key mappings
    const altKeys = generateAlternativeKeys(player);
    altKeys.forEach(altKey => {
      if (!currentMapping[altKey] && altKey !== cleanKey) {
        currentMapping[altKey] = {
          name: player.name,
          team: player.team,
          position: player.position,
          imagePath: player.imagePath,
          source: player.source || 'fantasypros',
          verified: true,
          rank: player.rank,
          aliasFor: cleanKey
        };
      }
    });
    
    addedCount++;
    console.log(`   ✅ Integrated: ${player.name} (${player.team})`);
  });
  
  console.log(`\n📈 Integration Complete:`);
  console.log(`   ✅ Processed: ${addedCount} players`);
  console.log(`   📁 Total mappings: ${Object.keys(currentMapping).length}`);
  
  return currentMapping;
}

function validateImageFiles(mapping) {
  console.log('\n🔍 VALIDATING IMAGE FILES');
  console.log('=========================\n');
  
  const imageDir = path.join(__dirname, '../public/player-images');
  const imageFiles = new Set();
  
  if (fs.existsSync(imageDir)) {
    fs.readdirSync(imageDir).forEach(file => {
      if (file.endsWith('.jpg') || file.endsWith('.png')) {
        imageFiles.add(file);
      }
    });
  }
  
  let validMappings = 0;
  let invalidMappings = 0;
  let missingImages = [];
  
  Object.entries(mapping).forEach(([key, player]) => {
    if (player.imagePath) {
      if (imageFiles.has(player.imagePath)) {
        validMappings++;
      } else {
        invalidMappings++;
        missingImages.push({ key, player });
      }
    }
  });
  
  console.log(`📊 Validation Results:`);
  console.log(`   ✅ Valid mappings: ${validMappings}`);
  console.log(`   ❌ Invalid mappings: ${invalidMappings}`);
  console.log(`   📁 Total image files: ${imageFiles.size}`);
  
  if (missingImages.length > 0) {
    console.log(`\n⚠️  Missing Images:`);
    missingImages.slice(0, 10).forEach(({ key, player }) => {
      console.log(`   - ${player.name} (${player.team}): ${player.imagePath}`);
    });
    if (missingImages.length > 10) {
      console.log(`   ... and ${missingImages.length - 10} more`);
    }
  }
  
  return { validMappings, invalidMappings, totalFiles: imageFiles.size };
}

function generateCoverageReport(mapping, validation) {
  console.log('\n📊 FINAL COVERAGE REPORT');
  console.log('=========================\n');
  
  const totalMappings = Object.keys(mapping).length;
  const coverage = Math.round((validation.validMappings / totalMappings) * 100);
  
  console.log(`🏈 NFL Player Image Coverage:`);
  console.log(`   📋 Total player mappings: ${totalMappings}`);
  console.log(`   ✅ Valid images: ${validation.validMappings}`);
  console.log(`   📁 Image files on disk: ${validation.totalFiles}`);
  console.log(`   📈 Coverage percentage: ${coverage}%`);
  
  if (coverage < 100) {
    const remaining = totalMappings - validation.validMappings;
    console.log(`\n🎯 To reach 100% coverage:`);
    console.log(`   📝 Need ${remaining} more player images`);
    console.log(`   🚀 Continue with comprehensive-image-collector.js`);
  }
  
  return { totalMappings, validMappings: validation.validMappings, coverage };
}

async function main() {
  try {
    console.log('🚀 FANTASYPROS DATA INTEGRATION');
    console.log('===============================\n');
    
    // Load data
    const fantasyProData = loadFantasyProResults();
    if (!fantasyProData) {
      console.log('❌ Cannot proceed without FantasyPros data');
      return;
    }
    
    const currentMapping = loadCurrentMapping();
    
    // Analyze overlaps
    const analysis = analyzeOverlaps(fantasyProData, currentMapping);
    
    // Integrate data
    const updatedMapping = integrateFantasyProData(fantasyProData, currentMapping);
    
    // Save updated mapping
    fs.writeFileSync(currentMappingPath, JSON.stringify(updatedMapping, null, 2));
    console.log(`\n💾 Updated mapping saved to: ${currentMappingPath}`);
    
    // Validate images
    const validation = validateImageFiles(updatedMapping);
    
    // Generate final report
    const report = generateCoverageReport(updatedMapping, validation);
    
    console.log('\n✅ Integration Complete!');
    console.log(`📈 Coverage improved with verified FantasyPros data`);
    
    return report;
    
  } catch (error) {
    console.error('\n❌ Integration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };