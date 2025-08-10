#!/usr/bin/env node

/**
 * NFL.com Official Roster Scraper
 * Scrapes all 32 NFL team rosters for authoritative player data
 */

const fs = require('fs');
const path = require('path');

// NFL team data with official abbreviations and roster URLs
const NFL_TEAMS = [
  { abbrev: 'ARI', name: 'Arizona Cardinals', slug: 'cardinals' },
  { abbrev: 'ATL', name: 'Atlanta Falcons', slug: 'falcons' },
  { abbrev: 'BAL', name: 'Baltimore Ravens', slug: 'ravens' },
  { abbrev: 'BUF', name: 'Buffalo Bills', slug: 'bills' },
  { abbrev: 'CAR', name: 'Carolina Panthers', slug: 'panthers' },
  { abbrev: 'CHI', name: 'Chicago Bears', slug: 'bears' },
  { abbrev: 'CIN', name: 'Cincinnati Bengals', slug: 'bengals' },
  { abbrev: 'CLE', name: 'Cleveland Browns', slug: 'browns' },
  { abbrev: 'DAL', name: 'Dallas Cowboys', slug: 'cowboys' },
  { abbrev: 'DEN', name: 'Denver Broncos', slug: 'broncos' },
  { abbrev: 'DET', name: 'Detroit Lions', slug: 'lions' },
  { abbrev: 'GB', name: 'Green Bay Packers', slug: 'packers' },
  { abbrev: 'HOU', name: 'Houston Texans', slug: 'texans' },
  { abbrev: 'IND', name: 'Indianapolis Colts', slug: 'colts' },
  { abbrev: 'JAX', name: 'Jacksonville Jaguars', slug: 'jaguars' },
  { abbrev: 'KC', name: 'Kansas City Chiefs', slug: 'chiefs' },
  { abbrev: 'LV', name: 'Las Vegas Raiders', slug: 'raiders' },
  { abbrev: 'LAC', name: 'Los Angeles Chargers', slug: 'chargers' },
  { abbrev: 'LAR', name: 'Los Angeles Rams', slug: 'rams' },
  { abbrev: 'MIA', name: 'Miami Dolphins', slug: 'dolphins' },
  { abbrev: 'MIN', name: 'Minnesota Vikings', slug: 'vikings' },
  { abbrev: 'NE', name: 'New England Patriots', slug: 'patriots' },
  { abbrev: 'NO', name: 'New Orleans Saints', slug: 'saints' },
  { abbrev: 'NYG', name: 'New York Giants', slug: 'giants' },
  { abbrev: 'NYJ', name: 'New York Jets', slug: 'jets' },
  { abbrev: 'PHI', name: 'Philadelphia Eagles', slug: 'eagles' },
  { abbrev: 'PIT', name: 'Pittsburgh Steelers', slug: 'steelers' },
  { abbrev: 'SF', name: 'San Francisco 49ers', slug: '49ers' },
  { abbrev: 'SEA', name: 'Seattle Seahawks', slug: 'seahawks' },
  { abbrev: 'TB', name: 'Tampa Bay Buccaneers', slug: 'buccaneers' },
  { abbrev: 'TEN', name: 'Tennessee Titans', slug: 'titans' },
  { abbrev: 'WAS', name: 'Washington Commanders', slug: 'commanders' }
];

async function scrapeNFLRosters() {
  console.log('🏈 Starting NFL.com roster scraper...\n');
  console.log(`📊 Scraping all ${NFL_TEAMS.length} NFL team rosters\n`);
  
  const allPlayers = [];
  const scrapingResults = {
    successful: [],
    failed: [],
    totalPlayers: 0,
    teamsProcessed: 0
  };
  
  for (let i = 0; i < Math.min(3, NFL_TEAMS.length); i++) { // Test with first 3 teams
    const team = NFL_TEAMS[i];
    console.log(`[${i + 1}/${NFL_TEAMS.length}] ${team.name} (${team.abbrev})...`);
    
    try {
      const teamPlayers = await scrapeTeamRoster(team);
      
      if (teamPlayers.length > 0) {
        allPlayers.push(...teamPlayers);
        scrapingResults.successful.push({
          team: team.abbrev,
          playerCount: teamPlayers.length
        });
        console.log(`   ✅ Found ${teamPlayers.length} players`);
      } else {
        scrapingResults.failed.push({
          team: team.abbrev,
          reason: 'No players found'
        });
        console.log(`   ❌ No players found`);
      }
      
      scrapingResults.teamsProcessed++;
      
    } catch (error) {
      scrapingResults.failed.push({
        team: team.abbrev,
        reason: error.message
      });
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Be respectful to NFL.com
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  scrapingResults.totalPlayers = allPlayers.length;
  
  // Save comprehensive database
  const outputPath = path.join(__dirname, '../tmp/nfl-master-database.json');
  const masterData = {
    metadata: {
      scrapedAt: new Date().toISOString(),
      totalPlayers: allPlayers.length,
      totalTeams: NFL_TEAMS.length,
      successfulTeams: scrapingResults.successful.length,
      failedTeams: scrapingResults.failed.length
    },
    players: allPlayers,
    scrapingResults
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(masterData, null, 2));
  
  console.log('\n📊 NFL Roster Scraping Complete!');
  console.log('================================');
  console.log(`✅ Successfully scraped: ${scrapingResults.successful.length} teams`);
  console.log(`❌ Failed to scrape: ${scrapingResults.failed.length} teams`);
  console.log(`👥 Total players found: ${allPlayers.length}`);
  console.log(`📁 Saved to: ${outputPath}\n`);
  
  // Show sample of players found
  if (allPlayers.length > 0) {
    console.log('🌟 Sample players found:');
    allPlayers.slice(0, 10).forEach(player => {
      console.log(`   ${player.name} (#${player.jersey}) - ${player.position} - ${player.team}`);
    });
  }
  
  return masterData;
}

async function scrapeTeamRoster(team) {
  const players = [];
  
  // Try multiple NFL.com URL patterns
  const urlPatterns = [
    `https://www.nfl.com/teams/${team.slug}/roster`,
    `https://www.nfl.com/teams/${team.slug}/roster/`,
    `https://www.nfl.com/teams/${team.abbrev.toLowerCase()}/roster`,
    `https://www.nfl.com/teams/${team.name.toLowerCase().replace(/\\s+/g, '-')}/roster`
  ];
  
  for (const url of urlPatterns) {
    try {
      console.log(`     🔍 Trying: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      if (!response.ok) {
        console.log(`     ⚠️  HTTP ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      const teamPlayers = parseNFLRosterHTML(html, team);
      
      if (teamPlayers.length > 0) {
        console.log(`     ✅ Found ${teamPlayers.length} players via ${url}`);
        return teamPlayers;
      }
      
    } catch (error) {
      console.log(`     ❌ Failed: ${error.message}`);
      continue;
    }
  }
  
  // If NFL.com fails, try alternative approach with ESPN
  console.log(`     🔄 Trying ESPN fallback...`);
  return await scrapeESPNTeamRoster(team);
}

function parseNFLRosterHTML(html, team) {
  const players = [];
  
  try {
    // Multiple parsing strategies for NFL.com roster pages
    const parsingPatterns = [
      // Pattern 1: Table-based roster
      {
        name: 'table-roster',
        playerRegex: /<tr[^>]*class="[^"]*roster[^"]*"[^>]*>(.*?)<\/tr>/gis,
        namePattern: /class="[^"]*player[^"]*name[^"]*"[^>]*>([^<]+)/i,
        positionPattern: /class="[^"]*position[^"]*"[^>]*>([^<]+)/i,
        jerseyPattern: /#(\d+)/,
        imagePattern: /src="([^"]*headshot[^"]*\.(jpg|png))"/i
      },
      
      // Pattern 2: Card-based roster
      {
        name: 'card-roster',
        playerRegex: /<div[^>]*class="[^"]*player[^"]*card[^"]*"[^>]*>(.*?)<\/div>/gis,
        namePattern: /class="[^"]*name[^"]*"[^>]*>([^<]+)/i,
        positionPattern: /class="[^"]*pos[^"]*"[^>]*>([^<]+)/i,
        jerseyPattern: /#(\d+)/,
        imagePattern: /src="([^"]*headshot[^"]*\.(jpg|png))"/i
      },
      
      // Pattern 3: List-based roster
      {
        name: 'list-roster',
        playerRegex: /<li[^>]*class="[^"]*roster[^"]*"[^>]*>(.*?)<\/li>/gis,
        namePattern: /<h[3-6][^>]*>([^<]+)/i,
        positionPattern: /Position:\s*([A-Z]{1,3})/i,
        jerseyPattern: /#(\d+)/,
        imagePattern: /src="([^"]*\.(jpg|png))"/i
      }
    ];
    
    for (const pattern of parsingPatterns) {
      let match;
      let playerCount = 0;
      
      while ((match = pattern.playerRegex.exec(html)) !== null && playerCount < 100) {
        const playerHTML = match[1];
        
        const nameMatch = playerHTML.match(pattern.namePattern);
        const positionMatch = playerHTML.match(pattern.positionPattern);
        const jerseyMatch = playerHTML.match(pattern.jerseyPattern);
        const imageMatch = playerHTML.match(pattern.imagePattern);
        
        if (nameMatch && positionMatch) {
          const player = {
            name: cleanPlayerName(nameMatch[1]),
            position: normalizePosition(positionMatch[1]),
            jersey: jerseyMatch ? parseInt(jerseyMatch[1]) : null,
            team: team.abbrev,
            teamName: team.name,
            imageUrl: imageMatch ? normalizeImageUrl(imageMatch[1]) : null,
            source: `nfl.com-${pattern.name}`,
            nflId: extractNFLPlayerId(playerHTML),
            profileUrl: extractPlayerProfileUrl(playerHTML)
          };
          
          // Basic validation
          if (isValidPlayer(player)) {
            players.push(player);
            playerCount++;
          }
        }
      }
      
      if (players.length > 0) {
        console.log(`     📝 Used parsing pattern: ${pattern.name}`);
        break;
      }
    }
    
  } catch (error) {
    console.log(`     ⚠️  HTML parsing error: ${error.message}`);
  }
  
  return players;
}

async function scrapeESPNTeamRoster(team) {
  const players = [];
  
  try {
    // ESPN team roster URL
    const espnUrl = `https://www.espn.com/nfl/team/roster/_/name/${team.abbrev.toLowerCase()}`;
    console.log(`     🔍 ESPN fallback: ${espnUrl}`);
    
    const response = await fetch(espnUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Parse ESPN roster table
      const rosterRegex = /<tr[^>]*class="[^"]*Table__TR[^"]*"[^>]*>(.*?)<\/tr>/gis;
      let match;
      let playerCount = 0;
      
      while ((match = rosterRegex.exec(html)) !== null && playerCount < 100) {
        const rowHTML = match[1];
        
        // Extract player data from ESPN table row
        const nameMatch = rowHTML.match(/<a[^>]*>([^<]+)<\/a>/);
        const cellsMatch = rowHTML.match(/<td[^>]*>([^<]+)<\/td>/g);
        
        if (nameMatch && cellsMatch && cellsMatch.length >= 3) {
          const player = {
            name: cleanPlayerName(nameMatch[1]),
            jersey: extractJerseyNumber(cellsMatch[0]),
            position: normalizePosition(cellsMatch[1] || ''),
            team: team.abbrev,
            teamName: team.name,
            imageUrl: null, // ESPN images require separate lookup
            source: 'espn-roster',
            profileUrl: extractESPNPlayerUrl(rowHTML)
          };
          
          if (isValidPlayer(player)) {
            players.push(player);
            playerCount++;
          }
        }
      }
    }
  } catch (error) {
    console.log(`     ❌ ESPN fallback failed: ${error.message}`);
  }
  
  return players;
}

// Utility functions
function cleanPlayerName(name) {
  return name.trim()
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizePosition(position) {
  const posMap = {
    'QB': 'QB', 'QUARTERBACK': 'QB',
    'RB': 'RB', 'RUNNING BACK': 'RB', 'FB': 'RB', 'FULLBACK': 'RB',
    'WR': 'WR', 'WIDE RECEIVER': 'WR',
    'TE': 'TE', 'TIGHT END': 'TE',
    'K': 'K', 'KICKER': 'K', 'PK': 'K',
    'DEF': 'DST', 'DEFENSE': 'DST', 'DST': 'DST'
  };
  
  const cleanPos = position.toUpperCase().trim();
  return posMap[cleanPos] || cleanPos;
}

function normalizeImageUrl(url) {
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return 'https://www.nfl.com' + url;
  return url;
}

function isValidPlayer(player) {
  return player.name && 
         player.name.length > 2 && 
         player.position && 
         !player.name.includes('undefined') &&
         !player.name.includes('null');
}

function extractJerseyNumber(cellHTML) {
  const match = cellHTML.match(/>(\d+)</);
  return match ? parseInt(match[1]) : null;
}

function extractNFLPlayerId(html) {
  const match = html.match(/player\/(\d+)/);
  return match ? match[1] : null;
}

function extractPlayerProfileUrl(html) {
  const match = html.match(/href="([^"]*player[^"]*)"/) || html.match(/href="([^"]*profile[^"]*)"/);
  return match ? normalizeImageUrl(match[1]) : null;
}

function extractESPNPlayerUrl(html) {
  const match = html.match(/href="([^"]*player[^"]*)"/);
  return match ? 'https://www.espn.com' + match[1] : null;
}

async function main() {
  console.log('🚀 NFL Master Database Creator Starting...\n');
  
  const results = await scrapeNFLRosters();
  
  console.log('✅ NFL roster scraping complete!');
  console.log(`🏈 Master database created with ${results.players.length} players`);
  
  return results;
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, scrapeNFLRosters, scrapeTeamRoster };