#!/usr/bin/env node

/**
 * Re-scrape images for players affected by duplicate removal
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const playersToRescrape = JSON.parse(fs.readFileSync(path.join(__dirname, 'players-to-rescrape.json'), 'utf-8'));
const mappingPath = path.join(__dirname, '../src/data/player-images.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

// Team name mappings for URL construction
const teamMappings = {
  'ATL': 'atlanta-falcons',
  'HOU': 'houston-texans',
  'CLE': 'cleveland-browns',
  'DAL': 'dallas-cowboys',
  'SEA': 'seattle-seahawks',
  'KC': 'kansas-city-chiefs',
  'TEN': 'tennessee-titans'
};

// Download image from URL
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const outputPath = path.join(__dirname, '../public/player-images', filename);
    
    console.log(`  📥 Downloading: ${url}`);
    
    const request = client.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(outputPath);
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          const stats = fs.statSync(outputPath);
          console.log(`  ✅ Saved: ${filename} (${stats.size.toLocaleString()} bytes)`);
          resolve({ success: true, size: stats.size, filename });
        });
        
        file.on('error', (err) => {
          fs.unlink(outputPath, () => {}); // Delete partial file
          reject(err);
        });
      } else {
        console.log(`  ❌ HTTP ${response.statusCode}: ${url}`);
        resolve({ success: false, statusCode: response.statusCode });
      }
    });
    
    request.on('error', (err) => {
      console.log(`  ❌ Request failed: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      console.log(`  ⏰ Timeout: ${url}`);
      resolve({ success: false, error: 'timeout' });
    });
  });
}

// Generate potential URLs for a player
function generatePlayerUrls(playerName, teamCode, filename) {
  const teamName = teamMappings[teamCode];
  if (!teamName) return [];
  
  // Clean player name for URL formatting
  const cleanName = playerName.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  
  const firstName = playerName.split(' ')[0].toLowerCase();
  const lastName = playerName.split(' ').slice(1).join(' ').toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '-');
  
  return [
    // NFL.com official photos
    `https://static.www.nfl.com/image/private/t_headshot_desktop_2x/${teamCode.toLowerCase()}/${cleanName}-headshot`,
    `https://static.www.nfl.com/image/private/t_headshot_desktop/${teamCode.toLowerCase()}/${cleanName}`,
    
    // ESPN photos
    `https://a.espncdn.com/i/headshots/nfl/players/full/${cleanName}.png`,
    `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${cleanName}.png&w=350&h=254`,
    
    // Team website patterns (examples - these may need specific team research)
    `https://www.${teamName}.com/assets/images/players/${cleanName}.jpg`,
    `https://static.${teamName}.com/assets/images/players/headshots/${cleanName}.jpg`,
    
    // Alternative NFL formats
    `https://static.www.nfl.com/image/private/f_auto,q_auto/${teamCode.toLowerCase()}/${firstName}-${lastName}-headshot`,
    
    // Generic fallbacks with different formats
    `https://www.pro-football-reference.com/req/202101181/images/headshots/${firstName}_${lastName}.jpg`,
  ];
}

// Main scraping function
async function scrapePlayer(player) {
  console.log(`\n🔍 Scraping: ${player.playerName} (${player.team})`);
  
  const urls = generatePlayerUrls(player.playerName, player.team, player.filename);
  console.log(`  Generated ${urls.length} potential URLs`);
  
  for (const url of urls) {
    try {
      const result = await downloadImage(url, player.filename);
      
      if (result.success) {
        // Check if this looks like a real image (not too small)
        if (result.size > 5000) {
          console.log(`  🎉 Success! Downloaded ${player.playerName} image`);
          return { success: true, url, size: result.size };
        } else {
          console.log(`  ⚠️  Image too small (${result.size} bytes), trying next URL`);
          fs.unlinkSync(path.join(__dirname, '../public/player-images', player.filename));
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`  😞 No suitable image found for ${player.playerName}`);
  return { success: false };
}

// Update mapping with new images
function updateMapping(successfulPlayers) {
  const updatedMapping = { ...mapping };
  
  for (const player of successfulPlayers) {
    // Generate mapping key
    const sanitizedName = player.playerName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const sanitizedTeam = player.team.toLowerCase();
    const key = `${sanitizedName}-${sanitizedTeam}`;
    
    updatedMapping[key] = `/player-images/${player.filename}`;
    console.log(`✅ Added to mapping: ${key} -> /player-images/${player.filename}`);
  }
  
  // Save updated mapping
  fs.writeFileSync(mappingPath, JSON.stringify(updatedMapping, null, 2));
  console.log(`📝 Updated mapping file (${Object.keys(updatedMapping).length} total entries)`);
}

// Main execution
async function main() {
  console.log('🔄 RE-SCRAPING MISSING PLAYER IMAGES\n');
  console.log(`Players to scrape: ${playersToRescrape.length}`);
  
  const results = [];
  const successfulPlayers = [];
  
  for (const player of playersToRescrape) {
    const result = await scrapePlayer(player);
    results.push({ player, result });
    
    if (result.success) {
      successfulPlayers.push(player);
    }
    
    // Small delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Update mapping for successful downloads
  if (successfulPlayers.length > 0) {
    updateMapping(successfulPlayers);
  }
  
  // Summary
  console.log('\n📊 SCRAPING RESULTS:');
  console.log('─'.repeat(50));
  console.log(`Total players: ${playersToRescrape.length}`);
  console.log(`✅ Successful: ${successfulPlayers.length}`);
  console.log(`❌ Failed: ${playersToRescrape.length - successfulPlayers.length}`);
  
  if (successfulPlayers.length > 0) {
    console.log('\n✅ Successfully scraped:');
    successfulPlayers.forEach(player => {
      console.log(`  - ${player.playerName} (${player.team})`);
    });
  }
  
  const failedPlayers = results.filter(r => !r.result.success).map(r => r.player);
  if (failedPlayers.length > 0) {
    console.log('\n❌ Failed to scrape:');
    failedPlayers.forEach(player => {
      console.log(`  - ${player.playerName} (${player.team})`);
    });
    
    console.log('\n💡 For failed players, consider:');
    console.log('- Manual download from official team websites');
    console.log('- Alternative sources like Getty Images or AP Photos');
    console.log('- Using existing placeholder or generic player silhouettes');
  }
  
  console.log('\n🎯 Next steps:');
  console.log('1. Test the application to verify images display correctly');
  console.log('2. Run duplicate detection again to ensure no new duplicates');
  console.log('3. Consider manual curation for any remaining failed players');
}

main().catch(console.error);