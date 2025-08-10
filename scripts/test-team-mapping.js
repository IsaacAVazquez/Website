#!/usr/bin/env node

/**
 * Test the updated getPlayerImageUrl function with team mapping
 */

const fs = require('fs');
const path = require('path');

// Import the mappings
const playerImagesMapping = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/player-images.json'), 'utf-8'));
const playerTeamUpdates = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/player-team-updates.json'), 'utf-8'));

// Replicate the updated function logic
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

// Test the problematic players
const testPlayers = [
  { name: 'Saquon Barkley', team: 'NYG' }, // Should find PHI
  { name: 'Austin Ekeler', team: 'LAC' },  // Should find WAS
  { name: 'Nick Chubb', team: 'CLE' },     // Should find HOU
  { name: 'Tony Pollard', team: 'DAL' },   // Should find TEN
  { name: 'Josh Jacobs', team: 'LV' },     // Should find GB
  { name: 'Derrick Henry', team: 'TEN' },  // Should find BAL
  { name: 'Davante Adams', team: 'NYJ' },  // Should find LV
  { name: 'Amari Cooper', team: 'BUF' },   // Should find CLE
  
  // Test team defenses
  { name: 'San Francisco 49ers', team: 'SF' },
  { name: 'Miami Dolphins Defense', team: 'MIA' },
  
  // Test players that should work normally
  { name: 'Trevor Lawrence', team: 'JAX' },
  { name: 'C.J. Stroud', team: 'HOU' },
];

console.log('🧪 Testing Updated Player Image Service with Team Mapping:\n');

testPlayers.forEach(player => {
  const result = getPlayerImageUrl(player.name, player.team);
  const teamsToTry = getCorrectTeam(player.name, player.team);
  
  console.log(`${player.name} (${player.team}):`);
  console.log(`  Teams to try: [${teamsToTry.join(', ')}]`);
  console.log(`  Result: ${result ? '✅' : '❌'} -> ${result || 'Not found'}`);
  
  if (result) {
    const imagePath = path.join(__dirname, '../public', result.replace('/player-images/', 'player-images/'));
    const exists = fs.existsSync(imagePath);
    console.log(`  File exists: ${exists ? '✅' : '❌'} ${imagePath}`);
  }
  console.log('');
});

console.log(`📊 Summary:`);
console.log(`- Player team updates: ${Object.keys(playerTeamUpdates).length}`);
console.log(`- Total image mappings: ${Object.keys(playerImagesMapping).length}`);