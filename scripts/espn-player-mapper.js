#!/usr/bin/env node

/**
 * ESPN Player ID Mapper
 * Maps our player data to ESPN player IDs for image collection
 */

const fs = require('fs');
const path = require('path');

// Load our missing players data
const missingPlayersPath = path.join(__dirname, '../tmp/missing-players.json');
const missingPlayersData = JSON.parse(fs.readFileSync(missingPlayersPath, 'utf8'));

// ESPN API endpoints for player data
const ESPN_BASE_URL = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl';
const ESPN_PLAYERS_URL = `${ESPN_BASE_URL}/seasons/2024/players`;

// Team name mappings between our data and ESPN
const teamMappings = {
  'WAS': 'WSH',
  'WSH': 'WAS', 
  'JAX': 'JAC',
  'JAC': 'JAX',
  'LV': 'LAS',
  'LAS': 'LV'
};

async function fetchEspnPlayers() {
  console.log('🔍 Fetching ESPN player data using alternative endpoints...\n');
  
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    const allPlayers = {};
    
    // Try ESPN's sports API endpoint instead
    const espnSportsUrl = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/teams';
    
    console.log('📊 Fetching NFL teams and rosters...');
    
    try {
      const teamsResponse = await fetch(espnSportsUrl, { headers });
      
      if (!teamsResponse.ok) {
        console.log(`   ⚠️  Failed to fetch teams: ${teamsResponse.status}`);
        // Fallback to direct player scraping
        return await fetchPlayersByGuessing();
      }
      
      const teamsData = await teamsResponse.json();
      
      if (teamsData && teamsData.items) {
        let totalPlayers = 0;
        
        // Process first few teams as a test
        for (let i = 0; i < Math.min(5, teamsData.items.length); i++) {
          const team = teamsData.items[i];
          console.log(`   Processing team: ${team.displayName}`);
          
          try {
            const rosterUrl = `${team.$ref}/roster`;
            const rosterResponse = await fetch(rosterUrl, { headers });
            
            if (rosterResponse.ok) {
              const rosterData = await rosterResponse.json();
              
              if (rosterData && rosterData.items) {
                rosterData.items.forEach(athlete => {
                  if (athlete.displayName && athlete.position) {
                    const position = mapEspnPosition(athlete.position.abbreviation);
                    const teamAbbrev = getTeamAbbrevFromName(team.displayName);
                    
                    if (position && teamAbbrev) {
                      const key = `${athlete.displayName.toLowerCase()}-${teamAbbrev.toLowerCase()}`;
                      
                      allPlayers[key] = {
                        espnId: athlete.id,
                        name: athlete.displayName,
                        team: teamAbbrev,
                        position: position,
                        athleteId: athlete.id
                      };
                      
                      totalPlayers++;
                    }
                  }
                });
              }
            }
          } catch (error) {
            console.log(`     Error processing team roster: ${error.message}`);
          }
          
          // Add small delay to be respectful
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`   ✅ Found ${totalPlayers} total players from ${Math.min(5, teamsData.items.length)} teams`);
      }
    } catch (error) {
      console.log(`   ❌ Error with sports API: ${error.message}`);
      return await fetchPlayersByGuessing();
    }
    
    return allPlayers;
    
  } catch (error) {
    console.error('Error fetching ESPN players:', error);
    return await fetchPlayersByGuessing();
  }
}

async function fetchPlayersByGuessing() {
  console.log('🎯 Trying direct player ID guessing method...\n');
  
  // We'll generate potential ESPN player IDs based on common patterns
  // and test them with image URLs
  const allPlayers = {};
  
  // Sample high-priority players to test image URL patterns
  const samplePlayers = [
    { name: 'Josh Allen', team: 'BUF', testIds: [3139477, 4035004, 2579520] },
    { name: 'Lamar Jackson', team: 'BAL', testIds: [3916387, 4040715, 3051392] },
    { name: 'Patrick Mahomes', team: 'KC', testIds: [3139477, 3916387, 2330272] },
    { name: 'Saquon Barkley', team: 'PHI', testIds: [3051392, 4035004, 3042519] }
  ];
  
  console.log('Testing ESPN image URL patterns with known players...');
  
  for (const player of samplePlayers) {
    for (const testId of player.testIds) {
      // Test different ESPN image URL patterns
      const imagePatterns = [
        `https://a.espncdn.com/i/headshots/nfl/players/full/${testId}.png`,
        `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${testId}.png&h=200&w=200`,
        `https://a.espncdn.com/i/headshots/college-football/players/full/${testId}.png`
      ];
      
      for (const imageUrl of imagePatterns) {
        try {
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`   ✅ Found image for ${player.name}: ID ${testId}`);
            const key = `${player.name.toLowerCase()}-${player.team.toLowerCase()}`;
            allPlayers[key] = {
              espnId: testId,
              name: player.name,
              team: player.team,
              position: 'QB', // Guess based on sample
              imageUrl: imageUrl,
              imagePattern: imageUrl.includes('combiner') ? 'combiner' : 'direct'
            };
            break;
          }
        } catch (error) {
          // Ignore fetch errors, continue testing
        }
      }
      
      // Add delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  console.log(`   Found ${Object.keys(allPlayers).length} working image URLs`);
  return allPlayers;
}

function mapEspnPosition(espnPos) {
  const positionMap = {
    'QB': 'QB',
    'RB': 'RB', 
    'WR': 'WR',
    'TE': 'TE',
    'K': 'K',
    'DEF': 'DST'
  };
  return positionMap[espnPos] || null;
}

function getTeamAbbrevFromName(teamName) {
  const teamNameMap = {
    'Atlanta Falcons': 'ATL',
    'Buffalo Bills': 'BUF',
    'Chicago Bears': 'CHI',
    'Cincinnati Bengals': 'CIN',
    'Cleveland Browns': 'CLE',
    'Dallas Cowboys': 'DAL',
    'Denver Broncos': 'DEN',
    'Detroit Lions': 'DET',
    'Green Bay Packers': 'GB',
    'Tennessee Titans': 'TEN',
    'Indianapolis Colts': 'IND',
    'Kansas City Chiefs': 'KC',
    'Las Vegas Raiders': 'LV',
    'Los Angeles Rams': 'LAR',
    'Miami Dolphins': 'MIA',
    'Minnesota Vikings': 'MIN',
    'New England Patriots': 'NE',
    'New Orleans Saints': 'NO',
    'New York Giants': 'NYG',
    'New York Jets': 'NYJ',
    'Philadelphia Eagles': 'PHI',
    'Arizona Cardinals': 'ARI',
    'Pittsburgh Steelers': 'PIT',
    'Los Angeles Chargers': 'LAC',
    'San Francisco 49ers': 'SF',
    'Seattle Seahawks': 'SEA',
    'Tampa Bay Buccaneers': 'TB',
    'Washington Commanders': 'WAS',
    'Carolina Panthers': 'CAR',
    'Jacksonville Jaguars': 'JAX',
    'Baltimore Ravens': 'BAL',
    'Houston Texans': 'HOU'
  };
  
  return teamNameMap[teamName] || null;
}

function getPlayerPosition(playerData) {
  // ESPN position ID mappings
  const positionIds = {
    1: 'QB',
    2: 'RB', 
    3: 'WR',
    4: 'TE',
    5: 'K',
    16: 'DST'
  };
  
  if (playerData.defaultPositionId) {
    return positionIds[playerData.defaultPositionId] || 'UNKNOWN';
  }
  
  // Fallback to eligible slots
  if (playerData.eligibleSlots && playerData.eligibleSlots.length > 0) {
    const firstSlot = playerData.eligibleSlots[0];
    return positionIds[firstSlot] || 'UNKNOWN';
  }
  
  return 'UNKNOWN';
}

function getTeamAbbreviation(playerData) {
  // ESPN team ID to abbreviation mapping (partial - extend as needed)
  const teamIds = {
    1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL', 7: 'DEN', 8: 'DET',
    9: 'GB', 10: 'TEN', 11: 'IND', 12: 'KC', 13: 'LV', 14: 'LAR', 15: 'MIA', 16: 'MIN',
    17: 'NE', 18: 'NO', 19: 'NYG', 20: 'NYJ', 21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC',
    25: 'SF', 26: 'SEA', 27: 'TB', 28: 'WSH', 29: 'CAR', 30: 'JAX', 33: 'BAL', 34: 'HOU'
  };
  
  if (playerData.proTeamId && teamIds[playerData.proTeamId]) {
    return teamIds[playerData.proTeamId];
  }
  
  return null;
}

function mapPlayersToEspn(espnPlayers, missingPlayers) {
  console.log('\n🔗 Mapping missing players to ESPN IDs...\n');
  
  const mappedPlayers = [];
  const unmappedPlayers = [];
  
  missingPlayers.forEach(player => {
    const variations = generateNameVariations(player.name, player.team);
    let mapped = false;
    
    for (const variation of variations) {
      if (espnPlayers[variation]) {
        mappedPlayers.push({
          ...player,
          espnId: espnPlayers[variation].espnId,
          espnData: espnPlayers[variation],
          mappedKey: variation
        });
        mapped = true;
        break;
      }
    }
    
    if (!mapped) {
      unmappedPlayers.push({
        ...player,
        triedVariations: variations.slice(0, 5)
      });
    }
  });
  
  console.log(`✅ Successfully mapped: ${mappedPlayers.length} players`);
  console.log(`❌ Could not map: ${unmappedPlayers.length} players`);
  
  return { mappedPlayers, unmappedPlayers };
}

function generateNameVariations(name, team) {
  const cleanName = name.trim();
  const teamUpper = team.toUpperCase();
  
  // Generate team variations
  const teamVariations = [teamUpper];
  if (teamMappings[teamUpper]) {
    teamVariations.push(teamMappings[teamUpper]);
  }
  
  // Generate name variations
  const nameVariations = [
    cleanName,
    cleanName.replace(/\./g, ''), // Remove periods
    cleanName.replace(/'/g, ''), // Remove apostrophes
    cleanName.replace(/Jr\.?|Sr\.?|III|IV|V/gi, '').trim(), // Remove suffixes
    cleanName.replace(/\s[A-Z]\.\s/g, ' '), // Remove middle initials
    cleanName.replace(/\s+/g, ' ').trim(), // Normalize spaces
  ];
  
  // Create all combinations
  const allVariations = [];
  for (const nameVar of nameVariations) {
    for (const teamVar of teamVariations) {
      allVariations.push(`${nameVar.toLowerCase()}-${teamVar.toLowerCase()}`);
    }
  }
  
  return [...new Set(allVariations)].filter(Boolean);
}

async function main() {
  console.log('🚀 ESPN Player ID Mapper Starting...\n');
  
  // Fetch ESPN player data
  const espnPlayers = await fetchEspnPlayers();
  console.log(`\n📊 Total ESPN players found: ${Object.keys(espnPlayers).length}`);
  
  // Map our missing players to ESPN
  const { mappedPlayers, unmappedPlayers } = mapPlayersToEspn(
    espnPlayers, 
    missingPlayersData.highPriority || missingPlayersData.all.slice(0, 100)
  );
  
  // Save results
  const outputPath = path.join(__dirname, '../tmp/espn-player-mappings.json');
  const output = {
    mappedPlayers,
    unmappedPlayers,
    espnPlayers: Object.keys(espnPlayers).length,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log('\n📁 Results saved to tmp/espn-player-mappings.json');
  
  // Show sample mapped players
  if (mappedPlayers.length > 0) {
    console.log('\n✅ Sample successful mappings:');
    mappedPlayers.slice(0, 5).forEach(player => {
      console.log(`   ${player.name} (${player.team}) -> ESPN ID: ${player.espnId}`);
    });
  }
  
  // Show sample unmapped players
  if (unmappedPlayers.length > 0) {
    console.log('\n❌ Sample unmapped players:');
    unmappedPlayers.slice(0, 5).forEach(player => {
      console.log(`   ${player.name} (${player.team})`);
      console.log(`      Tried: ${player.triedVariations.slice(0, 3).join(', ')}`);
    });
  }
  
  return output;
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, fetchEspnPlayers, mapPlayersToEspn };