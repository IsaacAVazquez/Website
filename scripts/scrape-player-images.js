#!/usr/bin/env node

/**
 * Script to scrape NFL player images from ESPN
 * Run with: node scripts/scrape-player-images.js
 */

const fs = require('fs').promises;
const path = require('path');

// ESPN team abbreviations mapping
const TEAM_MAPPING = {
  'ARI': 'cardinals', 'ATL': 'falcons', 'BAL': 'ravens', 'BUF': 'bills',
  'CAR': 'panthers', 'CHI': 'bears', 'CIN': 'bengals', 'CLE': 'browns',
  'DAL': 'cowboys', 'DEN': 'broncos', 'DET': 'lions', 'GB': 'packers',
  'HOU': 'texans', 'IND': 'colts', 'JAX': 'jaguars', 'KC': 'chiefs',
  'LV': 'raiders', 'LAC': 'chargers', 'LAR': 'rams', 'MIA': 'dolphins',
  'MIN': 'vikings', 'NE': 'patriots', 'NO': 'saints', 'NYG': 'giants',
  'NYJ': 'jets', 'PHI': 'eagles', 'PIT': 'steelers', 'SF': '49ers',
  'SEA': 'seahawks', 'TB': 'buccaneers', 'TEN': 'titans', 'WAS': 'commanders'
};

const IMAGE_DIR = path.join(process.cwd(), 'public', 'player-images');
const MAPPING_FILE = path.join(process.cwd(), 'src', 'data', 'player-images.json');

async function ensureDirectories() {
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(path.dirname(MAPPING_FILE), { recursive: true });
}

async function scrapeTeamRoster(teamAbbr) {
  const teamName = TEAM_MAPPING[teamAbbr];
  if (!teamName) {
    throw new Error(`Unknown team abbreviation: ${teamAbbr}`);
  }

  const espnUrl = `https://www.espn.com/nfl/team/roster/_/name/${teamAbbr.toLowerCase()}/${teamName}`;
  
  try {
    console.log(`Scraping roster for ${teamAbbr} from ${espnUrl}`);
    
    const response = await fetch(espnUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${teamAbbr} roster: ${response.status}`);
    }

    const html = await response.text();
    return parseRosterHTML(html, teamAbbr);
  } catch (error) {
    console.error(`Error scraping ${teamAbbr} roster:`, error);
    return [];
  }
}

function parseRosterHTML(html, teamAbbr) {
  const players = [];
  
  // Look for player image patterns in ESPN HTML
  const imageRegex = /<img[^>]+data-mptype="playerImage"[^>]+src="([^"]+)"[^>]*>/g;
  const playerLinkRegex = /<a[^>]+href="\/nfl\/player\/_\/id\/\d+\/([^"]+)"[^>]*>([^<]+)<\/a>/g;
  
  let imageMatch;
  const imageUrls = [];
  
  while ((imageMatch = imageRegex.exec(html)) !== null) {
    imageUrls.push(imageMatch[1]);
  }

  let playerMatch;
  let playerIndex = 0;
  
  while ((playerMatch = playerLinkRegex.exec(html)) !== null && playerIndex < imageUrls.length) {
    const playerName = playerMatch[2].trim();
    const imageUrl = imageUrls[playerIndex];
    
    // Extract position from surrounding HTML (this is approximate)
    const position = extractPositionFromContext(html, playerName);
    
    players.push({
      name: playerName,
      team: teamAbbr,
      position: position || 'UNKNOWN',
      imageUrl,
      localImagePath: generateLocalImagePath(playerName, teamAbbr)
    });
    
    playerIndex++;
  }

  return players;
}

function extractPositionFromContext(html, playerName) {
  // Look for position in table cell after player name
  const escapedName = playerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const positionRegex = new RegExp(`${escapedName}.*?<td[^>]*>\\s*(QB|RB|WR|TE|K|DST|DEF)\\s*<`, 'i');
  const match = positionRegex.exec(html);
  return match ? match[1].toUpperCase() : null;
}

function generateLocalImagePath(playerName, teamAbbr) {
  const sanitizedName = playerName.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${teamAbbr.toLowerCase()}-${sanitizedName}.jpg`;
}

async function downloadPlayerImage(imageUrl, localPath) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return false;

    const buffer = await response.arrayBuffer();
    const fullPath = path.join(IMAGE_DIR, localPath);
    
    await fs.writeFile(fullPath, Buffer.from(buffer));
    console.log(`Downloaded: ${localPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to download ${localPath}:`, error);
    return false;
  }
}

async function savePlayerMapping(players) {
  const mapping = players.reduce((acc, player) => {
    const key = `${player.name}-${player.team}`.toLowerCase();
    acc[key] = {
      name: player.name,
      team: player.team,
      position: player.position,
      imagePath: player.localImagePath
    };
    return acc;
  }, {});

  await fs.writeFile(MAPPING_FILE, JSON.stringify(mapping, null, 2));
}

async function scrapePlayerImages() {
  console.log('🏈 Starting NFL player image scraping...\n');
  
  try {
    await ensureDirectories();
    
    const allPlayers = [];
    const teams = Object.keys(TEAM_MAPPING);
    
    for (const team of teams) {
      console.log(`\nScraping ${team}...`);
      const players = await scrapeTeamRoster(team);
      
      // Download images
      for (const player of players) {
        if (player.imageUrl && player.localImagePath) {
          const success = await downloadPlayerImage(player.imageUrl, player.localImagePath);
          if (!success) {
            player.localImagePath = undefined;
          }
        }
      }
      
      allPlayers.push(...players);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save mapping file
    await savePlayerMapping(allPlayers);
    console.log(`\n✅ Completed! Scraped ${allPlayers.length} players from ${teams.length} teams.`);
    console.log('Images saved to: public/player-images/');
    console.log('Mapping saved to: src/data/player-images.json');
    
  } catch (error) {
    console.error('\n❌ Scraping failed:', error.message);
    process.exit(1);
  }
}

// Run the scraper
scrapePlayerImages();