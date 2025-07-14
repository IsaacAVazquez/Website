#!/usr/bin/env node

/**
 * Comprehensive Player Image Scraper
 * Downloads images for top fantasy football players across all positions
 * Run with: node scripts/comprehensive-player-scraper.js
 */

const fs = require('fs').promises;
const path = require('path');

// Comprehensive list of top fantasy players with ESPN image IDs
const TOP_FANTASY_PLAYERS = {
  'QB': [
    { name: 'Josh Allen', team: 'BUF', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3918298.png' },
    { name: 'Patrick Mahomes', team: 'KC', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3139477.png' },
    { name: 'Lamar Jackson', team: 'BAL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3916387.png' },
    { name: 'Dak Prescott', team: 'DAL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2577417.png' },
    { name: 'Aaron Rodgers', team: 'NYJ', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/8439.png' },
    { name: 'Joe Burrow', team: 'CIN', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4262921.png' },
    { name: 'Justin Herbert', team: 'LAC', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4258173.png' },
    { name: 'Jalen Hurts', team: 'PHI', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4361529.png' },
    { name: 'Tua Tagovailoa', team: 'MIA', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4241479.png' },
    { name: 'Russell Wilson', team: 'PIT', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/14881.png' },
    { name: 'Kirk Cousins', team: 'ATL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/16757.png' },
    { name: 'Anthony Richardson', team: 'IND', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4685760.png' },
    { name: 'C.J. Stroud', team: 'HOU', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4709781.png' },
    { name: 'Kyler Murray', team: 'ARI', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3917792.png' },
    { name: 'Brock Purdy', team: 'SF', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4431299.png' }
  ],
  'RB': [
    { name: 'Christian McCaffrey', team: 'SF', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3116593.png' },
    { name: 'Saquon Barkley', team: 'PHI', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3929630.png' },
    { name: 'Derrick Henry', team: 'BAL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2976499.png' },
    { name: 'Josh Jacobs', team: 'GB', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4040715.png' },
    { name: 'Jonathan Taylor', team: 'IND', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4239993.png' },
    { name: 'Austin Ekeler', team: 'WSH', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3045147.png' },
    { name: 'Nick Chubb', team: 'CLE', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3728390.png' },
    { name: 'Alvin Kamara', team: 'NO', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3116385.png' },
    { name: 'Tony Pollard', team: 'TEN', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4240069.png' },
    { name: 'Joe Mixon', team: 'HOU', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3051926.png' },
    { name: 'Rhamondre Stevenson', team: 'NE', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4361307.png' },
    { name: 'Kenneth Walker III', team: 'SEA', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4426515.png' },
    { name: 'De\'Von Achane', team: 'MIA', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4685493.png' },
    { name: 'Breece Hall', team: 'NYJ', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4432577.png' },
    { name: 'James Cook', team: 'BUF', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4426398.png' }
  ],
  'WR': [
    { name: 'Tyreek Hill', team: 'MIA', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2971618.png' },
    { name: 'Davante Adams', team: 'LV', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2976212.png' },
    { name: 'Stefon Diggs', team: 'HOU', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2976499.png' },
    { name: 'A.J. Brown', team: 'PHI', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4035687.png' },
    { name: 'DeAndre Hopkins', team: 'TEN', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/15847.png' },
    { name: 'Mike Evans', team: 'TB', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/16737.png' },
    { name: 'Cooper Kupp', team: 'LAR', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3116406.png' },
    { name: 'Ja\'Marr Chase', team: 'CIN', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4362887.png' },
    { name: 'Justin Jefferson', team: 'MIN', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4239996.png' },
    { name: 'CeeDee Lamb', team: 'DAL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4240069.png' },
    { name: 'Amon-Ra St. Brown', team: 'DET', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4362628.png' },
    { name: 'DK Metcalf', team: 'SEA', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4040715.png' },
    { name: 'Jaylen Waddle', team: 'MIA', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4361579.png' },
    { name: 'Chris Olave', team: 'NO', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4430747.png' },
    { name: 'Garrett Wilson', team: 'NYJ', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4426395.png' },
    { name: 'Puka Nacua', team: 'LAR', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4685644.png' },
    { name: 'Drake London', team: 'ATL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4426502.png' },
    { name: 'Keenan Allen', team: 'CHI', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/16716.png' },
    { name: 'Calvin Ridley', team: 'TEN', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3929630.png' },
    { name: 'Amari Cooper', team: 'CLE', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2976499.png' }
  ],
  'TE': [
    { name: 'Travis Kelce', team: 'KC', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/15847.png' },
    { name: 'Mark Andrews', team: 'BAL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3728390.png' },
    { name: 'George Kittle', team: 'SF', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3116365.png' },
    { name: 'T.J. Hockenson', team: 'MIN', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4035004.png' },
    { name: 'Kyle Pitts', team: 'ATL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4361307.png' },
    { name: 'Darren Waller', team: 'NYG', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/2576434.png' },
    { name: 'Dallas Goedert', team: 'PHI', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3728390.png' },
    { name: 'Evan Engram', team: 'JAX', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3121427.png' },
    { name: 'Sam LaPorta', team: 'DET', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4685493.png' },
    { name: 'David Njoku', team: 'CLE', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/3116593.png' },
    { name: 'Jake Ferguson', team: 'DAL', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4427359.png' },
    { name: 'Trey McBride', team: 'ARI', imageUrl: 'https://a.espncdn.com/i/headshots/nfl/players/full/4426434.png' }
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
  console.log('🏈 Starting Comprehensive Player Image Download...\n');
  console.log('📝 Downloading top 70+ fantasy players from ESPN\n');
  
  try {
    await ensureDirectories();
    
    const allPlayers = [];
    let totalDownloaded = 0;
    
    for (const [position, players] of Object.entries(TOP_FANTASY_PLAYERS)) {
      console.log(`\n🔄 Downloading ${position} players (${players.length} players)...`);
      
      for (const player of players) {
        const localImagePath = generateLocalImagePath(player.name, player.team);
        const success = await downloadPlayerImage(player.imageUrl, localImagePath);
        
        if (success) totalDownloaded++;
        
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
    
    console.log(`\n🎉 Completed! Downloaded ${totalDownloaded}/${allPlayers.length} player images.`);
    console.log('📁 Images saved to: public/player-images/');
    console.log('📄 Mapping saved to: src/data/player-images.json');
    console.log('\n💡 Coverage includes:');
    console.log(`   - ${TOP_FANTASY_PLAYERS.QB.length} Top QBs`);
    console.log(`   - ${TOP_FANTASY_PLAYERS.RB.length} Top RBs`);
    console.log(`   - ${TOP_FANTASY_PLAYERS.WR.length} Top WRs`);
    console.log(`   - ${TOP_FANTASY_PLAYERS.TE.length} Top TEs`);
    console.log('\n🚀 To test: Navigate to /fantasy-football and see player images!');
    
  } catch (error) {
    console.error('\n❌ Download failed:', error.message);
    process.exit(1);
  }
}

// Run the comprehensive downloader
scrapePlayerImages();