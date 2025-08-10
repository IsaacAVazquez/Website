#!/usr/bin/env node

/**
 * Alternative approach: Use NFL.com or create a simplified fallback
 * Run with: node scripts/alternative-image-scraper.js
 */

const fs = require('fs').promises;
const path = require('path');

// Mock player data for testing the image integration
const MOCK_PLAYERS = {
  'QB': [
    { name: 'Josh Allen', team: 'BUF', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3918298.png' },
    { name: 'Patrick Mahomes', team: 'KC', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3139477.png' },
    { name: 'Lamar Jackson', team: 'BAL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3916387.png' },
    { name: 'Dak Prescott', team: 'DAL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2577417.png' },
    { name: 'Aaron Rodgers', team: 'NYJ', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/8439.png' }
  ],
  'RB': [
    { name: 'Christian McCaffrey', team: 'SF', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3116593.png' },
    { name: 'Ezekiel Elliott', team: 'DAL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3051392.png' },
    { name: 'Derrick Henry', team: 'BAL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2976499.png' },
    { name: 'Saquon Barkley', team: 'PHI', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3929630.png' },
    { name: 'Nick Chubb', team: 'CLE', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3728390.png' }
  ],
  'WR': [
    { name: 'Tyreek Hill', team: 'MIA', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2971618.png' },
    { name: 'Davante Adams', team: 'LV', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2976212.png' },
    { name: 'Stefon Diggs', team: 'HOU', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2976499.png' },
    { name: 'DeAndre Hopkins', team: 'TEN', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/15847.png' },
    { name: 'Mike Evans', team: 'TB', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/16737.png' }
  ],
  'TE': [
    { name: 'Travis Kelce', team: 'KC', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/15847.png' },
    { name: 'Mark Andrews', team: 'BAL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3728390.png' },
    { name: 'George Kittle', team: 'SF', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3116365.png' },
    { name: 'Darren Waller', team: 'NYG', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2576434.png' },
    { name: 'T.J. Hockenson', team: 'MIN', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4035004.png' }
  ]
};

const IMAGE_DIR = path.join(process.cwd(), 'public', 'player-images');
const MAPPING_FILE = path.join(process.cwd(), 'src', 'data', 'player-images.json');

async function ensureDirectories() {
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.mkdir(path.dirname(MAPPING_FILE), { recursive: true });
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
    console.log(`Downloading: ${imageUrl} -> ${localPath}`);
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.log(`Failed to fetch ${imageUrl}: ${response.status}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    const fullPath = path.join(IMAGE_DIR, localPath);
    
    await fs.writeFile(fullPath, Buffer.from(buffer));
    console.log(`✅ Downloaded: ${localPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to download ${localPath}:`, error.message);
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
  console.log(`✅ Saved mapping file with ${Object.keys(mapping).length} players`);
}

async function scrapePlayerImages() {
  console.log('🏈 Starting Alternative Player Image Download...\n');
  console.log('📝 Using ESPN direct image URLs for top fantasy players\n');
  
  try {
    await ensureDirectories();
    
    const allPlayers = [];
    
    for (const [position, players] of Object.entries(MOCK_PLAYERS)) {
      console.log(`\n🔄 Downloading ${position} players...`);
      
      for (const player of players) {
        const localImagePath = generateLocalImagePath(player.name, player.team);
        const success = await downloadPlayerImage(player.imageUrl, localImagePath);
        
        allPlayers.push({
          name: player.name,
          team: player.team,
          position: position,
          imageUrl: player.imageUrl,
          localImagePath: success ? localImagePath : undefined
        });
        
        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Save mapping file
    await savePlayerMapping(allPlayers);
    
    console.log(`\n🎉 Completed! Downloaded images for ${allPlayers.length} top fantasy players.`);
    console.log('📁 Images saved to: public/player-images/');
    console.log('📄 Mapping saved to: src/data/player-images.json');
    console.log('\n💡 To test: Navigate to /fantasy-football and you should see player images!');
    
  } catch (error) {
    console.error('\n❌ Download failed:', error.message);
    process.exit(1);
  }
}

// Run the downloader
scrapePlayerImages();