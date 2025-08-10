#!/usr/bin/env node

/**
 * Clean Player Image Mappings
 * 
 * This script fixes the duplicate/conflicting mappings in player-images.json by:
 * 1. Loading the comprehensive fantasy-player-mappings.json
 * 2. Extracting only valid, accurate mappings 
 * 3. Replacing player-images.json with clean data
 * 4. Validating that problematic players now have correct images
 */

const fs = require('fs');
const path = require('path');

// Load comprehensive mappings
function loadComprehensiveMappings() {
  const mappingPath = path.join(__dirname, '../src/data/fantasy-player-mappings.json');
  if (!fs.existsSync(mappingPath)) {
    throw new Error('Comprehensive mappings not found. Run download-player-images.js first.');
  }
  
  const data = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  console.log(`✅ Loaded comprehensive mappings: ${data.players.length} players`);
  return data;
}

// Extract clean mappings from comprehensive data
function extractCleanMappings(comprehensiveData) {
  console.log('🧹 Extracting clean mappings...');
  
  const cleanMappings = {};
  let validMappings = 0;
  let skippedMappings = 0;
  
  comprehensiveData.players.forEach(player => {
    // Only include players with valid local image paths
    if (player.localImagePath && player.mappingKey) {
      const imagePath = path.join(__dirname, '../public', player.localImagePath);
      
      // Verify the image file actually exists
      if (fs.existsSync(imagePath)) {
        cleanMappings[player.mappingKey] = player.localImagePath;
        validMappings++;
      } else {
        console.log(`⚠️ Image file missing: ${player.localImagePath} for ${player.fantasyName}`);
        skippedMappings++;
      }
    } else {
      skippedMappings++;
    }
  });
  
  console.log(`✅ Extracted ${validMappings} valid mappings`);
  console.log(`⏭️ Skipped ${skippedMappings} invalid/missing mappings`);
  
  return cleanMappings;
}

// Backup existing mappings
function backupExistingMappings() {
  const existingPath = path.join(__dirname, '../src/data/player-images.json');
  const backupPath = path.join(__dirname, `../src/data/player-images-backup-${Date.now()}.json`);
  
  if (fs.existsSync(existingPath)) {
    fs.copyFileSync(existingPath, backupPath);
    console.log(`📋 Created backup: ${backupPath}`);
    return backupPath;
  }
  
  return null;
}

// Save clean mappings
function saveCleanMappings(cleanMappings) {
  const outputPath = path.join(__dirname, '../src/data/player-images.json');
  
  // Sort mappings alphabetically for consistency
  const sortedMappings = {};
  Object.keys(cleanMappings)
    .sort()
    .forEach(key => {
      sortedMappings[key] = cleanMappings[key];
    });
  
  fs.writeFileSync(outputPath, JSON.stringify(sortedMappings, null, 2));
  console.log(`💾 Saved clean mappings: ${outputPath}`);
  console.log(`📊 Total mappings: ${Object.keys(sortedMappings).length}`);
  
  return outputPath;
}

// Validate specific problematic players
function validateProblematicPlayers(cleanMappings) {
  console.log('\\n🔍 Validating previously problematic players...');
  
  const problematicPlayers = [
    { name: "Ja'Marr Chase", team: 'CIN', key: 'jamarrchase-cin', expectedImage: 'cin-jamarrchase.jpg' },
    { name: 'Jayden Daniels', team: 'WAS', key: 'jaydendaniels-was', expectedImage: 'was-jaydendaniels.jpg' },
    { name: 'Justin Jefferson', team: 'MIN', key: 'justinjefferson-min', expectedImage: 'min-justinjefferson.jpg' },
    { name: 'Amon-Ra St. Brown', team: 'DET', key: 'amon-rastbrown-det', expectedImage: 'det-amon-rastbrown.jpg' },
    { name: 'A.J. Brown', team: 'PHI', key: 'ajbrown-phi', expectedImage: 'phi-ajbrown.jpg' },
    { name: 'Davante Adams', team: 'LAR', key: 'davanteadams-lar', expectedImage: 'la-davanteadams.jpg' },
    { name: 'Tyreek Hill', team: 'MIA', key: 'tyreekhill-mia', expectedImage: 'mia-tyreekhill.jpg' },
    { name: 'Stefon Diggs', team: 'HOU', key: 'stefondiggs-hou', expectedImage: 'hou-stefon-diggs.jpg' },
    { name: 'Travis Etienne', team: 'JAC', key: 'travisetiennejr-jac', expectedImage: 'jax-travisetienne.jpg' },
    { name: 'Josh Allen', team: 'BUF', key: 'joshallen-buf', expectedImage: 'buf-joshallen.jpg' },
    { name: 'Lamar Jackson', team: 'BAL', key: 'lamarjackson-bal', expectedImage: 'bal-lamarjackson.jpg' }
  ];
  
  const results = {
    fixed: [],
    missing: [],
    stillWrong: []
  };
  
  problematicPlayers.forEach(player => {
    console.log(`\\n🔍 Checking ${player.name} (${player.team}):`);
    console.log(`   Looking for key: ${player.key}`);
    
    if (cleanMappings[player.key]) {
      const mappedImage = cleanMappings[player.key];
      console.log(`   ✅ Found mapping: ${mappedImage}`);
      
      // Check if the image file exists
      const imagePath = path.join(__dirname, '../public', mappedImage);
      if (fs.existsSync(imagePath)) {
        const stats = fs.statSync(imagePath);
        console.log(`   ✅ Image file exists: ${(stats.size / 1024).toFixed(1)}KB`);
        results.fixed.push(player);
      } else {
        console.log(`   ❌ Image file missing: ${imagePath}`);
        results.missing.push(player);
      }
    } else {
      console.log(`   ❌ No mapping found for key: ${player.key}`);
      
      // Try alternative keys
      const alternativeKeys = [
        player.name.toLowerCase().replace(/[^a-z]/g, '') + '-' + player.team.toLowerCase(),
        player.name.toLowerCase().replace(/\\s+/g, '-') + '-' + player.team.toLowerCase(),
        player.name.toLowerCase().replace(/['']/g, '').replace(/\\s+/g, '-') + '-' + player.team.toLowerCase()
      ];
      
      let foundAlternative = false;
      alternativeKeys.forEach(altKey => {
        if (cleanMappings[altKey]) {
          console.log(`   🔄 Found alternative: ${altKey} -> ${cleanMappings[altKey]}`);
          foundAlternative = true;
        }
      });
      
      if (!foundAlternative) {
        results.missing.push(player);
      }
    }
  });
  
  return results;
}

// Check for old conflicting mappings
function checkForConflicts(cleanMappings) {
  console.log('\\n🔍 Checking for potential conflicts...');
  
  const imageUsage = {};
  const conflicts = [];
  
  // Count how many keys point to each image
  Object.entries(cleanMappings).forEach(([key, imagePath]) => {
    if (!imageUsage[imagePath]) {
      imageUsage[imagePath] = [];
    }
    imageUsage[imagePath].push(key);
  });
  
  // Find images used by multiple keys
  Object.entries(imageUsage).forEach(([imagePath, keys]) => {
    if (keys.length > 1) {
      conflicts.push({
        image: imagePath,
        keys: keys,
        count: keys.length
      });
    }
  });
  
  if (conflicts.length > 0) {
    console.log(`⚠️ Found ${conflicts.length} potential conflicts:`);
    conflicts.forEach(conflict => {
      console.log(`   ${conflict.image} used by ${conflict.count} keys:`);
      conflict.keys.forEach(key => console.log(`     - ${key}`));
    });
  } else {
    console.log('✅ No conflicts found - each image has unique mappings');
  }
  
  return conflicts;
}

async function main() {
  console.log('🧹 CLEANING PLAYER IMAGE MAPPINGS');
  console.log('═'.repeat(60));
  
  try {
    // Step 1: Load comprehensive mappings
    const comprehensiveData = loadComprehensiveMappings();
    
    // Step 2: Extract clean mappings
    const cleanMappings = extractCleanMappings(comprehensiveData);
    
    // Step 3: Backup existing mappings
    const backupPath = backupExistingMappings();
    
    // Step 4: Save clean mappings
    const outputPath = saveCleanMappings(cleanMappings);
    
    // Step 5: Validate problematic players
    const validationResults = validateProblematicPlayers(cleanMappings);
    
    // Step 6: Check for conflicts
    const conflicts = checkForConflicts(cleanMappings);
    
    // Summary
    console.log('\\n📊 CLEANUP SUMMARY:');
    console.log('═'.repeat(50));
    console.log(`✅ Total clean mappings: ${Object.keys(cleanMappings).length}`);
    console.log(`✅ Previously problematic players fixed: ${validationResults.fixed.length}`);
    console.log(`❌ Still missing mappings: ${validationResults.missing.length}`);
    console.log(`⚠️ Potential conflicts: ${conflicts.length}`);
    
    if (backupPath) {
      console.log(`📋 Original mappings backed up to: ${path.basename(backupPath)}`);
    }
    
    if (validationResults.fixed.length > 0) {
      console.log('\\n🎉 SUCCESSFULLY FIXED PLAYERS:');
      validationResults.fixed.forEach(player => {
        const mapping = cleanMappings[player.key];
        console.log(`  ✅ ${player.name}: ${mapping}`);
      });
    }
    
    if (validationResults.missing.length > 0) {
      console.log('\\n⚠️ STILL MISSING MAPPINGS:');
      validationResults.missing.forEach(player => {
        console.log(`  ❌ ${player.name} (${player.team})`);
      });
    }
    
    // File size comparison
    if (backupPath) {
      const oldSize = fs.statSync(backupPath).size;
      const newSize = fs.statSync(outputPath).size;
      console.log(`\\n📊 File size: ${oldSize} bytes -> ${newSize} bytes (${newSize > oldSize ? '+' : ''}${newSize - oldSize})`);
    }
    
    console.log('\\n✨ Player image mappings cleanup completed!');
    console.log('\\n🎯 NEXT STEPS:');
    console.log('1. Test the application to verify images are correct');
    console.log("2. Check that Ja'Marr Chase now shows his correct image");
    console.log('3. Verify all previously problematic players are fixed');
    
    return {
      success: true,
      totalMappings: Object.keys(cleanMappings).length,
      fixed: validationResults.fixed.length,
      missing: validationResults.missing.length,
      conflicts: conflicts.length
    };
    
  } catch (error) {
    console.error('\\n💥 CLEANUP FAILED:', error.message);
    console.log('\\nTroubleshooting:');
    console.log('• Ensure fantasy-player-mappings.json exists');
    console.log('• Check file permissions for player-images.json');
    console.log('• Verify image files exist in public/player-images/');
    process.exit(1);
  }
}

main().catch(console.error);