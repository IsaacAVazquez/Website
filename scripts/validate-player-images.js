#!/usr/bin/env node

/**
 * Player Images Validation Script
 * Checks for missing player images across all position data
 */

const fs = require('fs');
const path = require('path');

// Position data files
const positionFiles = [
  'qbData.ts', 'rbData.ts', 'wrData.ts', 'teData.ts', 'kData.ts', 'dstData.ts'
];

// Load player images mapping
const mappingPath = path.join(__dirname, '../src/data/player-images.json');
const playerImagesMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

console.log('🔍 Player Images Validation Report');
console.log('================================\n');

let totalPlayersChecked = 0;
let totalPlayersWithImages = 0;
const missingImages = [];

// Check each position
positionFiles.forEach(file => {
  const filePath = path.join(__dirname, '../src/data', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  console.log(`📊 Checking ${file}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract player data using regex
    const playerMatches = content.match(/{\s*id:[\s\S]*?}/g);
    
    if (!playerMatches) {
      console.log(`   No players found in ${file}`);
      return;
    }

    let positionPlayersWithImages = 0;
    
    playerMatches.forEach(playerBlock => {
      // Extract name and team
      const nameMatch = playerBlock.match(/name:\s*['"](.*?)['"]/);
      const teamMatch = playerBlock.match(/team:\s*['"](.*?)['"]/);
      
      if (nameMatch && teamMatch) {
        const name = nameMatch[1];
        const team = teamMatch[1];
        
        totalPlayersChecked++;
        
        // Generate key variations like the service does
        const variations = generateNameVariations(name, team);
        let foundImage = false;
        
        for (const variation of variations) {
          if (playerImagesMapping[variation]) {
            foundImage = true;
            totalPlayersWithImages++;
            positionPlayersWithImages++;
            break;
          }
        }
        
        if (!foundImage) {
          missingImages.push({
            name,
            team,
            position: file.replace('Data.ts', '').toUpperCase(),
            variations: variations.slice(0, 3) // Show first 3 variations tried
          });
        }
      }
    });
    
    console.log(`   ✅ ${positionPlayersWithImages} players have images`);
    console.log(`   ❌ ${playerMatches.length - positionPlayersWithImages} players missing images\n`);
    
  } catch (error) {
    console.log(`   Error processing ${file}: ${error.message}`);
  }
});

// Summary
console.log('📈 Summary');
console.log('=========');
console.log(`Total players checked: ${totalPlayersChecked}`);
console.log(`Players with images: ${totalPlayersWithImages}`);
console.log(`Players missing images: ${missingImages.length}`);
console.log(`Coverage: ${Math.round((totalPlayersWithImages / totalPlayersChecked) * 100)}%\n`);

// Show missing players
if (missingImages.length > 0) {
  console.log('❌ Players Missing Images:');
  console.log('=========================');
  
  missingImages.forEach(player => {
    console.log(`${player.name} (${player.team}) - ${player.position}`);
    console.log(`   Tried: ${player.variations.join(', ')}`);
  });
}

// Name variation generator (simplified version)
function generateNameVariations(name, team) {
  const cleanName = name.trim();
  const teamUpper = team.toUpperCase();
  
  const baseVariations = [
    cleanName,
    cleanName.replace(/\./g, ''),
    cleanName.replace(/'/g, ''),
    cleanName.replace(/Jr\.?|Sr\.?|III|IV|V/gi, '').trim(),
    cleanName.replace(/\s+/g, ' '),
  ];
  
  const teamVariations = [teamUpper];
  if (teamUpper === 'JAX') teamVariations.push('JAC');
  if (teamUpper === 'JAC') teamVariations.push('JAX');
  
  const allVariations = [];
  
  for (const nameVar of baseVariations) {
    for (const teamVar of teamVariations) {
      // Try the format used in player-images.json: "TEAM Name"
      allVariations.push(`${teamVar} ${nameVar}`);
      // Also try lowercase hyphenated format
      allVariations.push(`${nameVar}-${teamVar}`.toLowerCase());
    }
  }
  
  // Add primary variation
  allVariations.unshift(`${teamUpper} ${cleanName}`);
  allVariations.unshift(`${cleanName}-${teamUpper}`.toLowerCase());
  
  return [...new Set(allVariations)].filter(Boolean);
}