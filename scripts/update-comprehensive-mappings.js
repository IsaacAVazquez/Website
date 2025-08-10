#!/usr/bin/env node

/**
 * Update Comprehensive Mappings
 * Updates player-images.json with all newly collected images
 */

const fs = require('fs');
const path = require('path');

// Load current mapping
const mappingPath = path.join(__dirname, '../src/data/player-images.json');
const currentMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Load comprehensive collection results
const resultsPath = path.join(__dirname, '../tmp/comprehensive-image-results.json');
const collectionResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Get current images from directory
function getCurrentImages() {
  const imageDir = path.join(__dirname, '../public/player-images');
  const images = {};
  
  if (fs.existsSync(imageDir)) {
    const files = fs.readdirSync(imageDir);
    files.forEach(file => {
      if (file.endsWith('.jpg') || file.endsWith('.png')) {
        images[file] = true;
      }
    });
  }
  
  return images;
}

function generatePlayerKey(player) {
  return `${player.name.toLowerCase()}-${player.team.toLowerCase()}`;
}

function updateMappingsWithCollectedImages() {
  console.log('🔄 Updating mappings with comprehensive collection results...\n');
  
  const currentImages = getCurrentImages();
  let addedCount = 0;
  let updatedCount = 0;
  
  // Add successful image downloads
  collectionResults.successful.forEach(result => {
    const key = generatePlayerKey(result.player);
    const cleanKey = key.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    
    // Verify the image file actually exists
    if (currentImages[result.filename]) {
      if (currentMapping[cleanKey]) {
        // Update existing entry
        if (!currentMapping[cleanKey].imagePath) {
          currentMapping[cleanKey].imagePath = result.filename;
          currentMapping[cleanKey].source = result.source;
          currentMapping[cleanKey].verified = true;
          updatedCount++;
          console.log(`   ✅ Updated: ${cleanKey} -> ${result.filename}`);
        }
      } else {
        // Add new entry
        currentMapping[cleanKey] = {
          name: result.player.name,
          team: result.player.team,
          position: result.player.position,
          imagePath: result.filename,
          source: result.source,
          verified: true,
          addedBy: 'comprehensive-collector'
        };
        addedCount++;
        console.log(`   ➕ Added: ${cleanKey} -> ${result.filename}`);
      }
      
      // Add alternative key formats
      const altKeys = generateAlternativeKeys(result.player);
      altKeys.forEach(altKey => {
        if (!currentMapping[altKey] && altKey !== cleanKey) {
          currentMapping[altKey] = {
            name: result.player.name,
            team: result.player.team,
            position: result.player.position,
            imagePath: result.filename,
            source: result.source,
            verified: true,
            aliasFor: cleanKey
          };
          console.log(`   🔗 Alt key: ${altKey} -> ${result.filename}`);
        }
      });
    } else {
      console.log(`   ⚠️  Image file missing: ${result.filename}`);
    }
  });
  
  // Handle placeholders (mark as needing images)
  collectionResults.placeholders.forEach(result => {
    const key = generatePlayerKey(result.player);
    const cleanKey = key.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    
    if (!currentMapping[cleanKey]) {
      currentMapping[cleanKey] = {
        name: result.player.name,
        team: result.player.team,
        position: result.player.position,
        status: 'needs_image',
        placeholderType: result.type,
        addedBy: 'comprehensive-collector'
      };
      addedCount++;
      console.log(`   📝 Placeholder: ${cleanKey} (needs image)`);
    }
  });
  
  return { addedCount, updatedCount };
}

function generateAlternativeKeys(player) {
  const keys = [];
  const name = player.name.toLowerCase();
  const team = player.team.toLowerCase();
  
  // Basic variations
  keys.push(`${name}-${team}`);
  
  // Remove common suffixes
  const nameNoSuffix = name.replace(/\s(jr\.?|sr\.?|ii|iii|iv|v)$/g, '').trim();
  if (nameNoSuffix !== name) {
    keys.push(`${nameNoSuffix}-${team}`);
  }
  
  // Remove periods and special characters
  const nameClean = name.replace(/[.']/g, '').replace(/\s+/g, '-');
  if (nameClean !== name) {
    keys.push(`${nameClean}-${team}`);
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
      if (nameClean !== name) {
        keys.push(`${nameClean}-${altTeam}`);
      }
    });
  }
  
  return [...new Set(keys)].filter(Boolean);
}

function validateUpdatedMappings() {
  console.log('\n🔍 Validating updated mappings...\n');
  
  const currentImages = getCurrentImages();
  let validMappings = 0;
  let invalidMappings = 0;
  let needsImageCount = 0;
  
  Object.entries(currentMapping).forEach(([key, player]) => {
    if (player.imagePath) {
      if (currentImages[player.imagePath]) {
        validMappings++;
      } else {
        invalidMappings++;
      }
    } else if (player.status === 'needs_image') {
      needsImageCount++;
    }
  });
  
  return { validMappings, invalidMappings, needsImageCount };
}

function generateCoverageReport() {
  console.log('\n📊 COMPREHENSIVE COVERAGE REPORT');
  console.log('=================================\n');
  
  const currentImages = getCurrentImages();
  const totalMappings = Object.keys(currentMapping).length;
  const validation = validateUpdatedMappings();
  
  console.log('🖼️  IMAGE COLLECTION STATS:');
  console.log(`   📁 Total image files: ${Object.keys(currentImages).length}`);
  console.log(`   📋 Total player mappings: ${totalMappings}`);
  console.log(`   ✅ Valid mappings: ${validation.validMappings}`);
  console.log(`   📝 Need images: ${validation.needsImageCount}`);
  console.log(`   ❌ Invalid mappings: ${validation.invalidMappings}`);
  
  const totalCoverage = Math.round((validation.validMappings / totalMappings) * 100);
  console.log(`   📈 Overall coverage: ${totalCoverage}%\n`);
  
  console.log('🎯 COLLECTION BREAKDOWN:');
  console.log(`   ✅ Real images: ${collectionResults.successful.length}`);
  console.log(`   📝 Placeholders: ${collectionResults.placeholders.length}`);
  console.log(`   ❌ Failed: ${collectionResults.failed ? collectionResults.failed.length : 0}`);
  console.log(`   📈 Success rate: ${Math.round((collectionResults.successful.length / (collectionResults.successful.length + (collectionResults.failed ? collectionResults.failed.length : 0))) * 100)}%\n`);
  
  return {
    totalImages: Object.keys(currentImages).length,
    totalMappings,
    coverage: totalCoverage,
    validMappings: validation.validMappings
  };
}

async function main() {
  console.log('🚀 Comprehensive Mapping Updater Starting...\n');
  
  const updateResults = updateMappingsWithCollectedImages();
  
  // Save updated mappings
  fs.writeFileSync(mappingPath, JSON.stringify(currentMapping, null, 2));
  
  console.log('\n📈 Update Summary:');
  console.log(`➕ Added: ${updateResults.addedCount} new entries`);
  console.log(`✅ Updated: ${updateResults.updatedCount} existing entries`);
  console.log(`📁 Updated: ${mappingPath}`);
  
  const coverageReport = generateCoverageReport();
  
  console.log('✅ Mapping update complete!');
  console.log(`🏈 Total coverage: ${coverageReport.coverage}% (${coverageReport.validMappings}/${coverageReport.totalMappings})`);
  
  return coverageReport;
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, updateMappingsWithCollectedImages };