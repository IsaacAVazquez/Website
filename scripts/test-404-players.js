#!/usr/bin/env node

/**
 * Test Player Image Service for players that were showing 404 errors
 */

const fs = require('fs');
const path = require('path');

// Import the mapping
const mappingPath = path.join(__dirname, '../src/data/player-images.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

// Simulate the sync function logic
function generateNameVariationsSync(name, team) {
  const cleanName = name.trim();
  const teamUpper = team.toUpperCase();
  
  // Handle team defense requests
  if (name.toLowerCase().includes('defense') || 
      name.toLowerCase().includes('dst') ||
      name.toLowerCase().includes(teamUpper.toLowerCase())) {
    return []; // Return empty array for team defenses
  }
  
  // Generate base name variations
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
  
  // Team abbreviation variations
  const teamVariations = [teamUpper];
  if (teamUpper === 'WAS') teamVariations.push('WSH');
  if (teamUpper === 'WSH') teamVariations.push('WAS');
  if (teamUpper === 'JAX') teamVariations.push('JAC');
  if (teamUpper === 'JAC') teamVariations.push('JAX');
  if (teamUpper === 'LV') teamVariations.push('LAS', 'OAK');
  if (teamUpper === 'LAS') teamVariations.push('LV');
  if (teamUpper === 'LAC') teamVariations.push('SD');
  if (teamUpper === 'LAR') teamVariations.push('LA');
  
  // Create all combinations
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

function testPlayerImageUrl(playerName, teamId) {
  if (!playerName || !teamId) return { found: false, path: null, reason: 'Missing name or team' };
  
  const variations = generateNameVariationsSync(playerName, teamId);
  
  if (variations.length === 0) {
    return { found: false, path: null, reason: 'Team defense - no images available' };
  }
  
  // Try each variation
  for (const variation of variations) {
    const mapped = mapping[variation];
    if (mapped) {
      return { found: true, path: mapped, matchedKey: variation };
    }
  }
  
  // Check if we have the player with a different team
  const playerNameLower = playerName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const alternateTeams = [];
  for (const key in mapping) {
    if (key.startsWith(playerNameLower + '-')) {
      const team = key.split('-').pop();
      alternateTeams.push(team.toUpperCase());
    }
  }
  
  return { 
    found: false, 
    path: null, 
    reason: alternateTeams.length > 0 ? `Found with teams: ${alternateTeams.join(', ')}` : 'Not found in mapping'
  };
}

// Test the problematic players from the 404 errors
const problematicPlayers = [
  // Players with old team data
  { name: 'Saquon Barkley', team: 'NYG', correctTeam: 'PHI' },
  { name: 'Austin Ekeler', team: 'LAC', correctTeam: 'WAS' },
  { name: 'Nick Chubb', team: 'CLE', correctTeam: 'HOU' },
  { name: 'Tony Pollard', team: 'DAL', correctTeam: 'TEN' },
  { name: 'Josh Jacobs', team: 'LV', correctTeam: 'GB' },
  { name: 'Derrick Henry', team: 'TEN', correctTeam: 'BAL' },
  { name: 'Aaron Jones', team: 'GB', correctTeam: 'MIN' },
  { name: 'Davante Adams', team: 'NYJ', correctTeam: 'LV' },
  { name: 'Amari Cooper', team: 'BUF', correctTeam: 'CLE' },
  
  // Players that should work with current teams
  { name: 'Trevor Lawrence', team: 'JAX' },
  { name: 'C.J. Stroud', team: 'HOU' },
  { name: 'Anthony Richardson', team: 'IND' },
  
  // Team defenses (should return null)
  { name: 'San Francisco 49ers', team: 'SF' },
  { name: 'Miami Dolphins', team: 'MIA' },
  { name: 'Dallas Cowboys', team: 'DAL' },
];

console.log('🧪 Testing Players with 404 Errors:\n');

problematicPlayers.forEach(player => {
  console.log(`\n=== ${player.name} (${player.team}) ===`);
  
  const result = testPlayerImageUrl(player.name, player.team);
  
  if (result.found) {
    console.log(`✅ FOUND: ${result.path}`);
    // Check if file exists
    const imagePath = path.join(__dirname, '../public', result.path.replace('/player-images/', 'player-images/'));
    const exists = fs.existsSync(imagePath);
    console.log(`   File exists: ${exists ? '✅' : '❌'} ${imagePath}`);
  } else {
    console.log(`❌ NOT FOUND: ${result.reason}`);
    
    // If we have a correct team, test with that
    if (player.correctTeam) {
      console.log(`   🔄 Testing with correct team (${player.correctTeam})...`);
      const correctResult = testPlayerImageUrl(player.name, player.correctTeam);
      if (correctResult.found) {
        console.log(`   ✅ FOUND with correct team: ${correctResult.path}`);
        const imagePath = path.join(__dirname, '../public', correctResult.path.replace('/player-images/', 'player-images/'));
        const exists = fs.existsSync(imagePath);
        console.log(`   File exists: ${exists ? '✅' : '❌'} ${imagePath}`);
      } else {
        console.log(`   ❌ Still not found with correct team: ${correctResult.reason}`);
      }
    }
  }
});

console.log(`\n📊 Summary:`);
console.log(`- Total mappings available: ${Object.keys(mapping).length}`);
console.log(`- Players tested: ${problematicPlayers.length}`);