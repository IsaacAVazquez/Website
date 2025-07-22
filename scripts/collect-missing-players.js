#!/usr/bin/env node

/**
 * Missing Players Collection Script
 * Scrapes current rankings and identifies players missing from our image mapping
 */

const fs = require('fs');
const path = require('path');

// Load current mapping
const mappingPath = path.join(__dirname, '../src/data/player-images.json');
const currentMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Position URLs to scrape
const positions = [
  { pos: 'QB', url: 'https://www.fantasypros.com/nfl/rankings/qb.php' },
  { pos: 'RB', url: 'https://www.fantasypros.com/nfl/rankings/rb.php' },
  { pos: 'WR', url: 'https://www.fantasypros.com/nfl/rankings/wr.php' },
  { pos: 'TE', url: 'https://www.fantasypros.com/nfl/rankings/te.php' },
  { pos: 'K', url: 'https://www.fantasypros.com/nfl/rankings/k.php' },
  { pos: 'DST', url: 'https://www.fantasypros.com/nfl/rankings/dst.php' }
];

async function collectMissingPlayers() {
  console.log('🔍 Collecting missing players from current rankings...\n');
  
  const allMissingPlayers = [];
  const highPriorityPlayers = [];
  
  for (const { pos, url } of positions) {
    console.log(`📊 Checking ${pos} rankings...`);
    
    try {
      const response = await fetch(`http://localhost:3000/api/scrape?url=${encodeURIComponent(url)}&position=${pos}`);
      const data = await response.json();
      
      if (data.players) {
        let positionMissing = 0;
        
        data.players.forEach((player, index) => {
          const variations = generateNameVariations(player.name, player.team);
          
          let foundInMapping = false;
          for (const variation of variations) {
            if (currentMapping[variation] && currentMapping[variation].imagePath) {
              foundInMapping = true;
              break;
            }
          }
          
          if (!foundInMapping) {
            const playerData = {
              name: player.name,
              team: player.team,
              position: pos,
              rank: player.rank || index + 1,
              primaryKey: `${player.name.toLowerCase()}-${player.team.toLowerCase()}`,
              variations: variations.slice(0, 3)
            };
            
            allMissingPlayers.push(playerData);
            positionMissing++;
            
            // High priority: top 20 at each position
            if (player.rank <= 20) {
              highPriorityPlayers.push(playerData);
            }
          }
        });
        
        console.log(`   Missing: ${positionMissing} players`);
      }
    } catch (error) {
      console.log(`   Error scraping ${pos}: ${error.message}`);
    }
  }
  
  console.log('\n📈 Summary');
  console.log('==========');
  console.log(`Total missing players: ${allMissingPlayers.length}`);
  console.log(`High priority (top 20): ${highPriorityPlayers.length}`);
  
  // Save results
  fs.writeFileSync(
    path.join(__dirname, '../tmp/missing-players.json'),
    JSON.stringify({ all: allMissingPlayers, highPriority: highPriorityPlayers }, null, 2)
  );
  
  // Show high priority players
  console.log('\n🚨 High Priority Missing Players (Top 20 each position):');
  console.log('=======================================================');
  
  const priorityByPosition = {};
  highPriorityPlayers.forEach(player => {
    if (!priorityByPosition[player.position]) {
      priorityByPosition[player.position] = [];
    }
    priorityByPosition[player.position].push(player);
  });
  
  for (const [pos, players] of Object.entries(priorityByPosition)) {
    console.log(`\n${pos}:`);
    players.forEach(player => {
      console.log(`  #${player.rank} ${player.name} (${player.team})`);
    });
  }
  
  // Create new mapping entries for high priority players
  console.log('\n🔄 Creating mapping entries for high priority players...');
  const newMappingEntries = {};
  
  highPriorityPlayers.forEach(player => {
    const key = player.primaryKey;
    // Create expected image filename
    const imagePath = `${player.team.toLowerCase()}-${player.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')}.jpg`;
      
    newMappingEntries[key] = {
      name: player.name,
      team: player.team,
      position: player.position,
      imagePath: imagePath,
      rank: player.rank,
      status: 'needs_image'
    };
  });
  
  // Save new mapping entries
  fs.writeFileSync(
    path.join(__dirname, '../tmp/new-player-mappings.json'),
    JSON.stringify(newMappingEntries, null, 2)
  );
  
  console.log(`\n✅ Created ${Object.keys(newMappingEntries).length} new mapping entries`);
  console.log('📁 Saved to tmp/missing-players.json and tmp/new-player-mappings.json');
  
  // Show specific corrections needed
  console.log('\n🔧 Specific Issues Found:');
  console.log('========================');
  
  // Look for key mismatches
  const keyIssues = [];
  Object.keys(currentMapping).forEach(key => {
    const mapping = currentMapping[key];
    if (!mapping.imagePath && mapping.name && mapping.team) {
      keyIssues.push(`${mapping.name} (${mapping.team}) - ${key} missing imagePath`);
    }
  });
  
  keyIssues.forEach(issue => console.log(`  • ${issue}`));
  
  return { allMissingPlayers, highPriorityPlayers, newMappingEntries };
}

// Name variation generator (from validation script)
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
  if (teamUpper === 'WAS') teamVariations.push('WSH');
  if (teamUpper === 'WSH') teamVariations.push('WAS');
  
  const allVariations = [];
  
  for (const nameVar of baseVariations) {
    for (const teamVar of teamVariations) {
      allVariations.push(`${nameVar}-${teamVar}`.toLowerCase());
    }
  }
  
  allVariations.unshift(`${cleanName}-${teamUpper}`.toLowerCase());
  
  return [...new Set(allVariations)].filter(Boolean);
}

// Run the script
if (require.main === module) {
  collectMissingPlayers().catch(console.error);
}

module.exports = { collectMissingPlayers };