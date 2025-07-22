#!/usr/bin/env node

/**
 * Update Player Mappings
 * Updates player-images.json with newly scraped images
 */

const fs = require('fs');
const path = require('path');

// Load current mapping
const mappingPath = path.join(__dirname, '../src/data/player-images.json');
const currentMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Load scraping results
function loadScrapingResults() {
  const results = [];
  
  // Load FantasyPros results
  const fantasyprosPath = path.join(__dirname, '../tmp/fantasypros-scrape-results.json');
  if (fs.existsSync(fantasyprosPath)) {
    const fantasyprosData = JSON.parse(fs.readFileSync(fantasyprosPath, 'utf8'));
    results.push(...fantasyprosData.successful);
  }
  
  // Load ESPN results (if available)
  const espnPath = path.join(__dirname, '../tmp/espn-scrape-results.json');
  if (fs.existsSync(espnPath)) {
    const espnData = JSON.parse(fs.readFileSync(espnPath, 'utf8'));
    results.push(...espnData.successful);
  }
  
  return results;
}

function updatePlayerMappings() {
  console.log('🔄 Updating player-images.json with scraped images...\n');
  
  const scrapedPlayers = loadScrapingResults();
  console.log(`📊 Found ${scrapedPlayers.length} successfully scraped players`);
  
  let addedCount = 0;
  let updatedCount = 0;
  
  scrapedPlayers.forEach(player => {
    // Generate mapping key (primary key from scraping)
    const key = player.primaryKey || `${player.name.toLowerCase()}-${player.team.toLowerCase()}`;
    
    if (currentMapping[key]) {
      // Update existing entry with image path
      if (!currentMapping[key].imagePath) {
        currentMapping[key].imagePath = player.imagePath;
        currentMapping[key].source = player.source || 'scraped';
        updatedCount++;
        console.log(`   ✅ Updated: ${key} -> ${player.imagePath}`);
      }
    } else {
      // Add new entry
      currentMapping[key] = {
        name: player.name,
        team: player.team,
        position: player.position,
        imagePath: player.imagePath,
        source: player.source || 'scraped',
        rank: player.rank
      };
      addedCount++;
      console.log(`   ➕ Added: ${key} -> ${player.imagePath}`);
    }
    
    // Also try alternative key formats for better matching
    const altKeys = generateAlternativeKeys(player);
    altKeys.forEach(altKey => {
      if (!currentMapping[altKey] && altKey !== key) {
        currentMapping[altKey] = {
          name: player.name,
          team: player.team,
          position: player.position,
          imagePath: player.imagePath,
          source: player.source || 'scraped',
          rank: player.rank
        };
        console.log(`   🔗 Alt mapping: ${altKey} -> ${player.imagePath}`);
      }
    });
  });
  
  // Save updated mapping
  fs.writeFileSync(mappingPath, JSON.stringify(currentMapping, null, 2));
  
  console.log('\n📈 Update Summary:');
  console.log(`➕ Added: ${addedCount} new entries`);
  console.log(`✅ Updated: ${updatedCount} existing entries`);
  console.log(`📊 Total mappings: ${Object.keys(currentMapping).length}`);
  console.log(`📁 Updated: ${mappingPath}`);
  
  return { addedCount, updatedCount, totalMappings: Object.keys(currentMapping).length };
}

function generateAlternativeKeys(player) {
  const keys = [];
  const name = player.name.toLowerCase();
  const team = player.team.toLowerCase();
  
  // Basic variations
  keys.push(`${name}-${team}`);
  
  // Remove suffixes
  const nameNoSuffix = name.replace(/\s(jr\.?|sr\.?|ii|iii|iv)$/g, '').trim();
  if (nameNoSuffix !== name) {
    keys.push(`${nameNoSuffix}-${team}`);
  }
  
  // Remove periods and apostrophes
  const nameClean = name.replace(/[.']/g, '');
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
  
  return [...new Set(keys)];
}

function validateMappings() {
  console.log('\n🔍 Validating updated mappings...\n');
  
  const imageDir = path.join(__dirname, '../public/player-images');
  const imageFiles = new Set(fs.readdirSync(imageDir));
  
  let validMappings = 0;
  let invalidMappings = 0;
  let missingFiles = [];
  
  Object.entries(currentMapping).forEach(([key, player]) => {
    if (player.imagePath) {
      if (imageFiles.has(player.imagePath)) {
        validMappings++;
      } else {
        invalidMappings++;
        missingFiles.push({ key, imagePath: player.imagePath, name: player.name });
      }
    }
  });
  
  console.log(`✅ Valid mappings: ${validMappings}`);
  console.log(`❌ Invalid mappings: ${invalidMappings}`);
  
  if (missingFiles.length > 0 && missingFiles.length <= 5) {
    console.log('\n❌ Missing image files:');
    missingFiles.forEach(file => {
      console.log(`   ${file.name}: ${file.imagePath}`);
    });
  }
  
  return { validMappings, invalidMappings, missingFiles: missingFiles.length };
}

async function main() {
  console.log('🚀 Player Mappings Updater Starting...\n');
  
  const updateResults = updatePlayerMappings();
  const validationResults = validateMappings();
  
  console.log('\n🎯 Final Results:');
  console.log(`📊 Total player mappings: ${updateResults.totalMappings}`);
  console.log(`✅ Valid image mappings: ${validationResults.validMappings}`);
  console.log(`📈 Image coverage: ${Math.round((validationResults.validMappings / updateResults.totalMappings) * 100)}%`);
  
  return { updateResults, validationResults };
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, updatePlayerMappings, validateMappings };