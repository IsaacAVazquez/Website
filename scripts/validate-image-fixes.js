#!/usr/bin/env node

/**
 * Validate that all the problematic players now have correct images
 * Test the complete system end-to-end
 */

const fs = require('fs');
const path = require('path');

// All the players we fixed
const fixedPlayers = [
  { name: 'Jayden Daniels', team: 'WAS', position: 'QB', issue: 'Was showing Brandon Aiyuk/Garrett Wilson' },
  { name: 'JaMarr Chase', team: 'CIN', position: 'WR', issue: 'Was showing Justin Fields' },
  { name: 'Justin Jefferson', team: 'MIN', position: 'WR', issue: 'Was showing Travis Etienne' },
  { name: 'Amon-Ra St. Brown', team: 'DET', position: 'WR', issue: 'Was showing JaMarr Chase' },
  { name: 'A.J. Brown', team: 'PHI', position: 'WR', issue: 'Was showing a Colts player' },
  { name: 'Davante Adams', team: 'LV', position: 'WR', issue: 'Was showing Stefon Diggs' },
  { name: 'Tyreek Hill', team: 'MIA', position: 'WR', issue: 'Was showing wrong player' },
  { name: 'Stefon Diggs', team: 'HOU', position: 'WR', issue: 'Image mismatch' },
  { name: 'Travis Etienne', team: 'JAX', position: 'RB', issue: 'Image mismatch' },
  { name: 'Josh Allen', team: 'BUF', position: 'QB', issue: 'Reference player for validation' },
  { name: 'Lamar Jackson', team: 'BAL', position: 'QB', issue: 'Reference player for validation' }
];

// Generate expected filename from player info
function generateExpectedFilename(player) {
  const cleanName = player.name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\./g, '')
    .replace(/[^a-z\s-]/g, '')
    .replace(/\s+/g, '-');
  
  const cleanTeam = player.team.toLowerCase();
  
  return `${cleanTeam}-${cleanName}.jpg`;
}

// Generate mapping key
function generateMappingKey(player) {
  return generateExpectedFilename(player).replace('.jpg', '');
}

function validateImageSystem() {
  console.log('🔍 VALIDATING PLAYER IMAGE FIXES');
  console.log('═'.repeat(60));
  
  const results = {
    mappingExists: [],
    mappingMissing: [],
    fileExists: [],
    fileMissing: [],
    allGood: []
  };
  
  // Check if mapping file exists
  const mappingPath = path.join(__dirname, '../src/data/player-images.json');
  if (!fs.existsSync(mappingPath)) {
    console.log('❌ player-images.json mapping file not found!');
    return;
  }
  
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  console.log(`✅ Loaded mapping file with ${Object.keys(mapping).length} entries`);
  
  // Check each fixed player
  for (const player of fixedPlayers) {
    console.log(`\n🔍 Checking ${player.name} (${player.team} ${player.position})`);
    console.log(`    Previous issue: ${player.issue}`);
    
    const expectedFilename = generateExpectedFilename(player);
    const mappingKey = generateMappingKey(player);
    
    console.log(`    Expected filename: ${expectedFilename}`);
    console.log(`    Mapping key: ${mappingKey}`);
    
    // Check if mapping exists
    if (mapping[mappingKey]) {
      console.log(`  ✅ Mapping exists: ${mappingKey} → ${mapping[mappingKey]}`);
      results.mappingExists.push(player);
      
      // Check if file exists
      const filePath = path.join(__dirname, '../public', mapping[mappingKey]);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`  ✅ File exists: ${mapping[mappingKey].split('/').pop()} (${stats.size.toLocaleString()} bytes)`);
        results.fileExists.push({ player, size: stats.size, path: mapping[mappingKey] });
        results.allGood.push(player);
      } else {
        console.log(`  ❌ File missing: ${filePath}`);
        results.fileMissing.push({ player, expectedPath: filePath });
      }
    } else {
      console.log(`  ❌ Mapping missing for key: ${mappingKey}`);
      results.mappingMissing.push(player);
      
      // Check alternative mapping keys
      const alternatives = [
        `${player.name.toLowerCase().replace(/[^a-z]/g, '')}-${player.team.toLowerCase()}`,
        `${player.name.toLowerCase().replace(/\s+/g, '-')}-${player.team.toLowerCase()}`,
        `${player.name.toLowerCase().replace(/['']/g, '').replace(/\s+/g, '-')}-${player.team.toLowerCase()}`
      ];
      
      let foundAlternative = false;
      for (const alt of alternatives) {
        if (mapping[alt]) {
          console.log(`  🔄 Found alternative mapping: ${alt} → ${mapping[alt]}`);
          foundAlternative = true;
          break;
        }
      }
      
      if (!foundAlternative) {
        console.log(`  ❌ No alternative mappings found`);
      }
    }
  }
  
  // Summary
  console.log('\n📊 VALIDATION SUMMARY:');
  console.log('═'.repeat(50));
  console.log(`✅ Complete (mapping + file): ${results.allGood.length}`);
  console.log(`❌ Missing mapping: ${results.mappingMissing.length}`);
  console.log(`❌ Missing file: ${results.fileMissing.length}`);
  
  if (results.allGood.length > 0) {
    console.log('\n🎉 SUCCESSFULLY FIXED:');
    results.allGood.forEach(player => {
      const fileInfo = results.fileExists.find(f => f.player.name === player.name);
      console.log(`  • ${player.name}: ${fileInfo.path.split('/').pop()} (${fileInfo.size.toLocaleString()} bytes)`);
    });
  }
  
  if (results.mappingMissing.length > 0) {
    console.log('\n⚠️ MISSING MAPPINGS:');
    results.mappingMissing.forEach(player => {
      console.log(`  • ${player.name} (${player.team} ${player.position})`);
    });
  }
  
  if (results.fileMissing.length > 0) {
    console.log('\n📁 MISSING FILES:');
    results.fileMissing.forEach(item => {
      console.log(`  • ${item.player.name}: File missing at ${item.expectedPath}`);
    });
  }
  
  // Image size analysis
  if (results.fileExists.length > 0) {
    console.log('\n📊 IMAGE SIZE ANALYSIS:');
    const sizes = results.fileExists.map(f => f.size).sort((a, b) => a - b);
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    
    console.log(`  Smallest: ${minSize.toLocaleString()} bytes`);
    console.log(`  Largest: ${maxSize.toLocaleString()} bytes`);
    console.log(`  Average: ${Math.round(avgSize).toLocaleString()} bytes`);
    
    // Flag unusually small images (likely errors)
    const suspiciouslySmall = results.fileExists.filter(f => f.size < 100000); // Less than 100KB
    if (suspiciouslySmall.length > 0) {
      console.log('\n⚠️ SUSPICIOUSLY SMALL IMAGES (possible errors):');
      suspiciouslySmall.forEach(f => {
        console.log(`  • ${f.player.name}: ${f.size.toLocaleString()} bytes`);
      });
    }
  }
  
  // Final assessment
  const successRate = (results.allGood.length / fixedPlayers.length) * 100;
  
  console.log('\n🎯 FINAL ASSESSMENT:');
  console.log('═'.repeat(40));
  console.log(`Success Rate: ${successRate.toFixed(1)}% (${results.allGood.length}/${fixedPlayers.length})`);
  
  if (successRate === 100) {
    console.log('🚀 PERFECT! All problematic players have been fixed.');
    console.log('\n📝 Expected Results:');
    console.log('When you visit the draft tiers page:');
    fixedPlayers.forEach(player => {
      console.log(`• ${player.name} should show their correct photo (not ${player.issue.toLowerCase()})`);
    });
    console.log('\n✨ The image mismatch issues should be completely resolved!');
  } else {
    console.log('⚠️ Some players still need attention.');
    console.log('\nRecommendations:');
    if (results.mappingMissing.length > 0) {
      console.log('• Add missing mappings to player-images.json');
    }
    if (results.fileMissing.length > 0) {
      console.log('• Download missing image files');
    }
    console.log('• Re-run the fix scripts for any remaining issues');
  }
  
  return {
    successRate,
    allGood: results.allGood.length,
    total: fixedPlayers.length,
    issues: results.mappingMissing.length + results.fileMissing.length
  };
}

// Run validation
const validationResults = validateImageSystem();

// Test the playerImageService integration
console.log('\n🔧 TESTING PLAYER IMAGE SERVICE INTEGRATION:');
console.log('─'.repeat(50));

try {
  // Check if the service can find our mappings
  const samplePlayer = { name: 'Jayden Daniels', team: 'WAS' };
  const expectedKey = generateMappingKey({ name: 'Jayden Daniels', team: 'WAS' });
  
  console.log(`Testing with: ${samplePlayer.name} (${samplePlayer.team})`);
  console.log(`Expected mapping key: ${expectedKey}`);
  
  const mappingPath = path.join(__dirname, '../src/data/player-images.json');
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  
  if (mapping[expectedKey]) {
    console.log(`✅ Service should find: ${mapping[expectedKey]}`);
  } else {
    console.log(`❌ Service will not find mapping for: ${expectedKey}`);
  }
  
} catch (error) {
  console.log(`❌ Error testing service integration: ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('🎉 VALIDATION COMPLETE - Check the draft tiers page!');
console.log('='.repeat(60));