#!/usr/bin/env node

/**
 * Comprehensive test of all player image functionality
 */

const fs = require('fs');
const path = require('path');

// Import all mappings
const playerImagesMapping = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/player-images.json'), 'utf-8'));
const playerTeamUpdates = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/player-team-updates.json'), 'utf-8'));

// Replicate the complete function logic
function getCorrectTeam(playerName, currentTeam) {
  const playerUpdate = playerTeamUpdates[playerName];
  
  if (playerUpdate) {
    if (currentTeam.toUpperCase() === playerUpdate.oldTeam.toUpperCase()) {
      return [playerUpdate.newTeam, currentTeam];
    }
    if (currentTeam.toUpperCase() === playerUpdate.newTeam.toUpperCase()) {
      return [currentTeam];
    }
    return [playerUpdate.newTeam, playerUpdate.oldTeam, currentTeam];
  }
  
  return [currentTeam];
}

function generateNameVariationsSync(name, team) {
  const cleanName = name.trim();
  const teamUpper = team.toUpperCase();
  
  if (name.toLowerCase().includes('defense') || 
      name.toLowerCase().includes('dst') ||
      name.toLowerCase().includes(teamUpper.toLowerCase())) {
    return [];
  }
  
  const baseVariations = [
    cleanName,
    cleanName.replace(/\./g, ''),
    cleanName.replace(/'/g, ''),
    cleanName.replace(/'/g, ''),
    cleanName.replace(/Jr\.?|Sr\.?|III|IV|V/gi, '').trim(),
    cleanName.replace(/\./g, '').replace(/'/g, '').replace(/'/g, ''),
    cleanName.replace(/\s+/g, ' '),
    cleanName.replace(/\./g, '').replace(/'/g, '').replace(/'/g, '').replace(/\s+/g, ' ').trim(),
    cleanName.replace(/\s[A-Z]\.\s/g, ' '),
    cleanName.replace(/\s[A-Z][a-z]*\s/g, ' '),
  ];
  
  const teamVariations = [teamUpper];
  if (teamUpper === 'WAS') teamVariations.push('WSH');
  if (teamUpper === 'WSH') teamVariations.push('WAS');
  if (teamUpper === 'JAX') teamVariations.push('JAC');
  if (teamUpper === 'JAC') teamVariations.push('JAX');
  if (teamUpper === 'LV') teamVariations.push('LAS', 'OAK');
  if (teamUpper === 'LAS') teamVariations.push('LV');
  if (teamUpper === 'LAC') teamVariations.push('SD');
  if (teamUpper === 'LAR') teamVariations.push('LA');
  
  const allVariations = [];
  
  for (const nameVar of baseVariations) {
    for (const teamVar of teamVariations) {
      const sanitizedName = nameVar.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const sanitizedTeam = teamVar.toLowerCase();
      
      allVariations.push(`${sanitizedName}-${sanitizedTeam}`);
      allVariations.push(`${nameVar}-${teamVar}`.toLowerCase());
      allVariations.push(`${nameVar}-${teamVar.toLowerCase()}`);
    }
    allVariations.push(nameVar.toLowerCase());
  }
  
  allVariations.unshift(`${cleanName}-${teamUpper}`.toLowerCase());
  
  return Array.from(new Set(allVariations)).filter(Boolean);
}

function getPlayerImageUrl(playerName, teamId) {
  if (!playerName || !teamId) return null;
  
  const teamsToTry = getCorrectTeam(playerName, teamId);
  
  for (const team of teamsToTry) {
    const variations = generateNameVariationsSync(playerName, team);
    
    if (variations.length === 0) {
      continue;
    }
    
    for (const variation of variations) {
      const mapped = playerImagesMapping[variation];
      if (mapped) {
        return mapped;
      }
    }
  }
  
  return null;
}

console.log('🔬 COMPREHENSIVE PLAYER IMAGE SERVICE TEST\n');

// Test categories
const testCategories = {
  'Previously 404 Players (Fixed)': [
    { name: 'Saquon Barkley', team: 'NYG' },
    { name: 'Austin Ekeler', team: 'LAC' },
    { name: 'Nick Chubb', team: 'CLE' },
    { name: 'Tony Pollard', team: 'DAL' },
    { name: 'Josh Jacobs', team: 'LV' },
    { name: 'Derrick Henry', team: 'TEN' },
    { name: 'Davante Adams', team: 'NYJ' },
    { name: 'Amari Cooper', team: 'BUF' },
  ],
  'Current Players (Should Work)': [
    { name: 'Trevor Lawrence', team: 'JAX' },
    { name: 'C.J. Stroud', team: 'HOU' },
    { name: 'Bijan Robinson', team: 'ATL' },
    { name: "De'Von Achane", team: 'MIA' },
    { name: 'Jahmyr Gibbs', team: 'DET' },
    { name: 'Saquon Barkley', team: 'PHI' }, // Correct team
  ],
  'Team Defenses (Should Return Null)': [
    { name: 'San Francisco 49ers', team: 'SF' },
    { name: 'Miami Dolphins Defense', team: 'MIA' },
    { name: 'Dallas Cowboys D/ST', team: 'DAL' },
    { name: 'Baltimore Ravens DST', team: 'BAL' },
  ],
  'Edge Cases': [
    { name: 'J.J. McCarthy', team: 'MIN' }, // Periods in name
    { name: "Ja'Marr Chase", team: 'CIN' }, // Apostrophe
    { name: 'Patrick Mahomes II', team: 'KC' }, // Suffix
    { name: '', team: 'KC' }, // Empty name
    { name: 'Some Player', team: '' }, // Empty team
  ]
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Run tests by category
for (const [category, players] of Object.entries(testCategories)) {
  console.log(`\n📋 ${category}:`);
  console.log('─'.repeat(50));
  
  for (const player of players) {
    totalTests++;
    const result = getPlayerImageUrl(player.name, player.team);
    
    // Determine expected outcome
    let shouldPass = true;
    if (category.includes('Team Defenses')) {
      shouldPass = false; // Team defenses should return null
    }
    if (player.name === '' || player.team === '') {
      shouldPass = false; // Empty inputs should return null
    }
    
    const passed = shouldPass ? (result !== null) : (result === null);
    
    if (passed) {
      passedTests++;
      console.log(`  ✅ ${player.name} (${player.team})`);
      if (result) {
        // Check if file exists
        const imagePath = path.join(__dirname, '../public', result.replace('/player-images/', 'player-images/'));
        const exists = fs.existsSync(imagePath);
        console.log(`     -> ${result} ${exists ? '(file exists)' : '(⚠️  file missing)'}`);
      }
    } else {
      failedTests++;
      console.log(`  ❌ ${player.name} (${player.team})`);
      console.log(`     Expected: ${shouldPass ? 'Found' : 'Null'}, Got: ${result || 'Null'}`);
    }
  }
}

// Performance test - check how many mappings are actually used
console.log('\n📊 MAPPING UTILIZATION:');
console.log('─'.repeat(50));

const allImageFiles = fs.readdirSync(path.join(__dirname, '../public/player-images'))
  .filter(file => file.endsWith('.jpg'));

const mappingValues = Object.values(playerImagesMapping);
const mappedFiles = mappingValues.map(path => path.replace('/player-images/', ''));

console.log(`- Total image files: ${allImageFiles.length}`);
console.log(`- Total mappings: ${Object.keys(playerImagesMapping).length}`);
console.log(`- Images with mappings: ${mappedFiles.length}`);
console.log(`- Team updates configured: ${Object.keys(playerTeamUpdates).length}`);

// Find unmapped images
const unmappedImages = allImageFiles.filter(file => !mappedFiles.includes(file));
if (unmappedImages.length > 0) {
  console.log(`\n⚠️  Unmapped images (${unmappedImages.length}):`);
  unmappedImages.slice(0, 5).forEach(file => console.log(`   - ${file}`));
  if (unmappedImages.length > 5) {
    console.log(`   ... and ${unmappedImages.length - 5} more`);
  }
}

// Final summary
console.log('\n🎯 TEST SUMMARY:');
console.log('─'.repeat(50));
console.log(`Total tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (failedTests === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Player image loading is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Review the failures above.');
}