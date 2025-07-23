#!/usr/bin/env node

/**
 * Final Validation of Player Image Mappings
 * 
 * Validates that the problematic players from the original issue
 * now have correct mappings using the new clean system
 */

const fs = require('fs');
const path = require('path');

function loadMappings() {
  const mappingPath = path.join(__dirname, '../src/data/player-images.json');
  return JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
}

function validateProblematicPlayers() {
  console.log('🔍 FINAL VALIDATION - Checking Previously Problematic Players');
  console.log('═'.repeat(80));
  
  const mappings = loadMappings();
  
  // Updated keys based on our new comprehensive system
  const problematicPlayers = [
    { 
      name: "Ja'Marr Chase", 
      team: 'CIN', 
      key: 'jamarrchase-cin',
      issue: 'Was showing Justin Fields'
    },
    { 
      name: 'Jayden Daniels', 
      team: 'WAS', 
      key: 'jaydendaniels-was',
      issue: 'Was showing Brandon Aiyuk/Garrett Wilson'
    },
    { 
      name: 'Justin Jefferson', 
      team: 'MIN', 
      key: 'justinjefferson-min',
      issue: 'Was showing Travis Etienne'
    },
    { 
      name: 'Amon-Ra St. Brown', 
      team: 'DET', 
      key: 'amon-rastbrown-det',
      issue: 'Was showing JaMarr Chase'
    },
    { 
      name: 'A.J. Brown', 
      team: 'PHI', 
      key: 'ajbrown-phi',
      issue: 'Was showing a Colts player'
    },
    { 
      name: 'Davante Adams', 
      team: 'LAR', 
      key: 'davanteadams-lar',
      issue: 'Was showing Stefon Diggs'
    },
    { 
      name: 'Tyreek Hill', 
      team: 'MIA', 
      key: 'tyreekhill-mia',
      issue: 'Was showing wrong player'
    },
    { 
      name: 'Stefon Diggs', 
      team: 'NE', 
      key: 'stefondiggs-ne',
      issue: 'Image mismatch'
    },
    { 
      name: 'Travis Etienne', 
      team: 'JAC', 
      key: 'travisetiennejr-jac',
      issue: 'Image mismatch'
    },
    { 
      name: 'Josh Allen', 
      team: 'BUF', 
      key: 'joshallen-buf',
      issue: 'Reference player for validation'
    },
    { 
      name: 'Lamar Jackson', 
      team: 'BAL', 
      key: 'lamarjackson-bal',
      issue: 'Reference player for validation'
    }
  ];
  
  const results = {
    fixed: [],
    missing: [],
    fileIssues: []
  };
  
  problematicPlayers.forEach(player => {
    console.log(`\\n🔍 ${player.name} (${player.team})`);
    console.log(`   Previous issue: ${player.issue}`);
    console.log(`   Looking for key: ${player.key}`);
    
    if (mappings[player.key]) {
      const imagePath = mappings[player.key];
      console.log(`   ✅ Mapping found: ${imagePath}`);
      
      // Check if image file exists
      const fullImagePath = path.join(__dirname, '../public', imagePath);
      if (fs.existsSync(fullImagePath)) {
        const stats = fs.statSync(fullImagePath);
        console.log(`   ✅ Image file exists: ${(stats.size / 1024).toFixed(1)}KB`);
        results.fixed.push({
          ...player,
          imagePath,
          fileSize: stats.size
        });
      } else {
        console.log(`   ❌ Image file missing: ${fullImagePath}`);
        results.fileIssues.push(player);
      }
    } else {
      console.log(`   ❌ No mapping found`);
      results.missing.push(player);
    }
  });
  
  return results;
}

function main() {
  try {
    const results = validateProblematicPlayers();
    
    console.log('\\n📊 FINAL VALIDATION RESULTS:');
    console.log('═'.repeat(50));
    console.log(`✅ Successfully Fixed: ${results.fixed.length}`);
    console.log(`❌ Missing Mappings: ${results.missing.length}`);
    console.log(`📁 File Issues: ${results.fileIssues.length}`);
    
    if (results.fixed.length > 0) {
      console.log('\\n🎉 SUCCESSFULLY FIXED PLAYERS:');
      results.fixed.forEach(player => {
        console.log(`  ✅ ${player.name}: ${player.imagePath} (${(player.fileSize / 1024).toFixed(1)}KB)`);
      });
    }
    
    if (results.missing.length > 0) {
      console.log('\\n⚠️ STILL MISSING:');
      results.missing.forEach(player => {
        console.log(`  ❌ ${player.name} (${player.team})`);
      });
    }
    
    if (results.fileIssues.length > 0) {
      console.log('\\n📁 FILE ISSUES:');
      results.fileIssues.forEach(player => {
        console.log(`  📁 ${player.name}: Mapping exists but file missing`);
      });
    }
    
    const successRate = (results.fixed.length / (results.fixed.length + results.missing.length + results.fileIssues.length)) * 100;
    
    console.log('\\n🎯 FINAL ASSESSMENT:');
    console.log('═'.repeat(40));
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 90) {
      console.log('\\n🚀 EXCELLENT! The image mismatch issues have been resolved!');
      console.log('\\n✨ Expected Results:');
      console.log("• Ja'Marr Chase should now show his correct photo (not Justin Fields)");
      console.log('• Jayden Daniels should show his correct photo (not Brandon Aiyuk)');
      console.log('• All other problematic players should display correctly');
      console.log('\\n🎯 Test by visiting the draft tiers page in your application!');
    } else if (successRate >= 70) {
      console.log('\\n✅ GOOD! Most issues have been resolved.');
      console.log('Consider fixing the remaining issues for complete coverage.');
    } else {
      console.log('\\n⚠️ More work needed to resolve all image mismatch issues.');
    }
    
    return results;
    
  } catch (error) {
    console.error('\\n💥 VALIDATION FAILED:', error.message);
    process.exit(1);
  }
}

main();