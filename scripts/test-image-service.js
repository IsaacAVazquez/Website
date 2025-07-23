#!/usr/bin/env node

/**
 * Test Player Image Service Functions
 */

const fs = require('fs');
const path = require('path');

// Load mapping
const mappingPath = path.join(__dirname, '../src/data/player-images.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

// Generate name variations (copied from the service)
function generateNameVariations(name, team) {
  const cleanName = name.trim();
  const teamUpper = team.toUpperCase();
  
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
    }
  }
  
  allVariations.unshift(`${cleanName}-${teamUpper}`.toLowerCase());
  
  return Array.from(new Set(allVariations)).filter(Boolean);
}

// Test function
function testPlayerImageUrl(playerName, teamId) {
  if (!playerName || !teamId) return null;
  
  const variations = generateNameVariations(playerName, teamId);
  
  // Try each variation to find a match
  for (const variation of variations) {
    const mapped = mapping[variation];
    if (mapped) {
      return mapped;
    }
  }
  
  return null;
}

// Test players
const testPlayers = [
  { name: 'Saquon Barkley', team: 'PHI' },
  { name: 'Bijan Robinson', team: 'ATL' },  
  { name: "De'Von Achane", team: 'MIA' },
  { name: 'Jahmyr Gibbs', team: 'DET' },
  { name: 'Dillon Gabriel', team: 'CLE' },
  { name: 'J.J. McCarthy', team: 'MIN' }
];

console.log('🧪 Testing Player Image Service Functions:\n');

testPlayers.forEach(player => {
  const result = testPlayerImageUrl(player.name, player.team);
  console.log(`${player.name} (${player.team}): ${result ? '✅' : '❌'} -> ${result || 'Not found'}`);
  
  if (result) {
    // Check if the file actually exists
    const imagePath = path.join(__dirname, '../public', result.replace('/player-images/', 'player-images/'));
    const exists = fs.existsSync(imagePath);
    console.log(`  File exists: ${exists ? '✅' : '❌'} ${imagePath}`);
  }
  console.log('');
});

console.log(`📊 Total mappings available: ${Object.keys(mapping).length}`);