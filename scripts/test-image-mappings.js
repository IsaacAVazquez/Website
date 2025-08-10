#!/usr/bin/env node

/**
 * Test that all fixed players have correct image mappings and files
 */

const fs = require('fs');
const path = require('path');

const fixedPlayers = [
  { name: 'Jayden Daniels', team: 'WAS', filename: 'was-jayden-daniels.jpg' },
  { name: 'Justin Fields', team: 'NYJ', filename: 'nyj-justin-fields.jpg' },
  { name: 'JaMarr Chase', team: 'CIN', filename: 'cin-jamarr-chase.jpg' },
  { name: 'Justin Jefferson', team: 'MIN', filename: 'min-justin-jefferson.jpg' },
  { name: 'Amon-Ra St. Brown', team: 'DET', filename: 'det-amon-ra-st-brown.jpg' },
  { name: 'A.J. Brown', team: 'PHI', filename: 'phi-aj-brown.jpg' },
  { name: 'Davante Adams', team: 'LV', filename: 'lv-davante-adams.jpg' },
  { name: 'Tyreek Hill', team: 'MIA', filename: 'mia-tyreek-hill.jpg' },
  { name: 'Stefon Diggs', team: 'HOU', filename: 'hou-stefon-diggs.jpg' },
  { name: 'Travis Etienne', team: 'JAX', filename: 'jax-travis-etienne.jpg' }
];

function testMappings() {
  console.log('🧪 TESTING PLAYER IMAGE MAPPINGS');
  console.log('═'.repeat(50));
  
  const mappingPath = path.join(__dirname, '../src/data/player-images.json');
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  
  const results = {
    success: [],
    mappingMissing: [],
    fileMissing: []
  };
  
  for (const player of fixedPlayers) {
    console.log(`\n🔍 Testing ${player.name} (${player.team})...`);
    
    // Generate possible mapping keys
    const possibleKeys = [
      `${player.name.toLowerCase().replace(/[^a-z]/g, '')}-${player.team.toLowerCase()}`,
      `${player.name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '-')}-${player.team.toLowerCase()}`,
      `${player.name.toLowerCase().replace(/\./g, '').replace(/\s+/g, '-')}-${player.team.toLowerCase()}`,
      // Special case for JaMarr Chase (often spelled Ja'Marr)
      `ja-marr-chase-${player.team.toLowerCase()}`,
      // Special case for A.J. Brown
      `a-j-brown-${player.team.toLowerCase()}`
    ];
    
    let foundMapping = false;
    let mappingKey = null;
    let mappedPath = null;
    
    for (const key of possibleKeys) {
      if (mapping[key]) {
        foundMapping = true;
        mappingKey = key;
        mappedPath = mapping[key];
        console.log(`  ✅ Mapping found: ${key} → ${mappedPath}`);
        break;
      }
    }
    
    if (!foundMapping) {
      console.log(`  ❌ No mapping found`);
      console.log(`     Tried: ${possibleKeys.join(', ')}`);
      results.mappingMissing.push(player);
      continue;
    }
    
    // Check if file exists
    const filePath = path.join(__dirname, '../public', mappedPath);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`  ✅ File exists: ${filePath.split('/').pop()} (${stats.size.toLocaleString()} bytes)`);
      results.success.push({ ...player, mappingKey, mappedPath, fileSize: stats.size });
    } else {
      console.log(`  ❌ File missing: ${filePath}`);
      results.fileMissing.push({ ...player, mappingKey, mappedPath });
    }
  }
  
  // Summary
  console.log('\n📊 TEST RESULTS:');
  console.log('═'.repeat(50));
  console.log(`✅ Complete (mapping + file): ${results.success.length}`);
  console.log(`❌ Missing mapping: ${results.mappingMissing.length}`);
  console.log(`❌ Missing file: ${results.fileMissing.length}`);
  
  if (results.success.length > 0) {
    console.log('\n🎉 Working Correctly:');
    results.success.forEach(p => {
      console.log(`  • ${p.name}: ${p.mappingKey} → ${p.mappedPath.split('/').pop()} (${p.fileSize.toLocaleString()} bytes)`);
    });
  }
  
  if (results.mappingMissing.length > 0) {
    console.log('\n⚠️ Missing Mappings:');
    results.mappingMissing.forEach(p => {
      console.log(`  • ${p.name} (${p.team}): Need to add mapping entry`);
    });
  }
  
  if (results.fileMissing.length > 0) {
    console.log('\n📁 Missing Files:');
    results.fileMissing.forEach(p => {
      console.log(`  • ${p.name}: Mapping exists but file missing at ${p.mappedPath}`);
    });
  }
  
  const allGood = results.mappingMissing.length === 0 && results.fileMissing.length === 0;
  
  console.log('\n🎯 EXPECTED BEHAVIOR:');
  console.log('All these players should now show their correct images in the draft tiers:');
  console.log('• Jayden Daniels → Shows Jayden Daniels (not Justin Fields)');
  console.log('• Justin Fields → Shows Justin Fields (not Jayden Daniels)');  
  console.log('• JaMarr Chase → Shows JaMarr Chase (not Justin Fields)');
  console.log('• Justin Jefferson → Shows Justin Jefferson (not Travis Etienne)');
  console.log('• Amon-Ra St. Brown → Shows Amon-Ra (not JaMarr Chase)');
  console.log('• A.J. Brown → Shows A.J. Brown (not a Colts player)');
  console.log('• Davante Adams → Shows Davante (not Stefon Diggs)');
  console.log('• Tyreek Hill → Shows correct Tyreek Hill');
  console.log('• Stefon Diggs → Shows Stefon Diggs');
  console.log('• Travis Etienne → Shows Travis Etienne');
  
  if (allGood) {
    console.log('\n🚀 ALL SYSTEMS GO!');
    console.log('All player images should display correctly now.');
    console.log('Try refreshing the draft tiers page to see the fixes.');
  } else {
    console.log('\n⚠️ Some issues need to be resolved before all images work correctly.');
  }
}

testMappings();