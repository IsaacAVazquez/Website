#!/usr/bin/env node

/**
 * Batch Player Image Scraper
 * Processes players in batches with rate limiting and multiple sources
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const IMAGES_DIR = path.join(__dirname, '../public/player-images');
const BATCH_SIZE = 10; // Process 10 players at a time
const DELAY_MS = 3000; // 3 second delay between batches
const MAX_PLAYERS = 100; // Limit for this run

// Ensure directories exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Load players without images
function loadPlayersWithoutImages() {
  const playersFile = path.join(__dirname, '../tmp/players-without-images.json');
  if (!fs.existsSync(playersFile)) {
    console.error('❌ Players file not found. Run compile-all-players.js first.');
    process.exit(1);
  }
  
  const allPlayers = JSON.parse(fs.readFileSync(playersFile, 'utf-8'));
  
  // Prioritize by position and source
  const priorityOrder = (player) => {
    let score = 0;
    
    // Position priority (QB=4, RB=3, WR=3, TE=2, K=1, DST=1)
    const positionScores = { 'QB': 4, 'RB': 3, 'WR': 3, 'TE': 2, 'K': 1, 'DST': 1 };
    score += positionScores[player.position] || 0;
    
    // Source priority (overall data is higher priority)
    if (player.source === 'overallData') score += 10;
    
    return score;
  };
  
  return allPlayers
    .sort((a, b) => priorityOrder(b) - priorityOrder(a))
    .slice(0, MAX_PLAYERS);
}

// Function to download image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const request = https.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/webp,image/jpeg,image/png,*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/'
      }
    }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        
        // Check file size and detect known duplicates
        const stats = fs.statSync(filepath);
        
        // Reject images that are too small
        if (stats.size < 1000) {
          fs.unlinkSync(filepath);
          reject(new Error('Image too small (likely placeholder)'));
          return;
        }
        
        // Reject known duplicate/placeholder sizes
        const knownDuplicateSizes = [107837, 76955]; // Ja'Marr Chase duplicate and Yahoo placeholder
        if (knownDuplicateSizes.includes(stats.size)) {
          fs.unlinkSync(filepath);
          reject(new Error(`Rejected known placeholder/duplicate image (${stats.size} bytes)`));
          return;
        }
        
        resolve({ filepath, size: stats.size });
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });
    
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Function to try multiple image sources for a player
async function scrapePlayerImage(player) {
  const sanitizedName = player.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const filename = `${player.team.toLowerCase()}-${sanitizedName}.jpg`;
  const filepath = path.join(IMAGES_DIR, filename);
  
  // Skip if image already exists
  if (fs.existsSync(filepath)) {
    return { player, success: false, reason: 'Image already exists' };
  }
  
  // Different image URL patterns to try
  const imageUrls = [
    // FantasyPros images (most reliable for fantasy players)
    `https://images.fantasypros.com/images/nfl/players/400x400/${sanitizedName}.jpg`,
    `https://images.fantasypros.com/images/nfl/players/250x250/${sanitizedName}.jpg`,
    `https://images.fantasypros.com/images/nfl/players/300x300/${sanitizedName}.jpg`,
    
    // NFL.com images
    `https://static.www.nfl.com/image/private/t_headshot_desktop/league/person/${sanitizedName}`,
    `https://static.www.nfl.com/image/private/t_headshot_desktop/league/player/${sanitizedName}`,
    `https://static.www.nfl.com/image/private/t_headshot_desktop/nfl/player/${sanitizedName}`,
    
    // ESPN alternative patterns (without hardcoded ID)
    `https://a.espncdn.com/i/headshots/nfl/players/full/${sanitizedName}.png`,
    `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${sanitizedName}.png&w=350&h=254`,
    
    // Yahoo Fantasy images
    `https://s.yimg.com/iu/api/res/1.2/player-400x400/${sanitizedName}.jpg`,
    `https://sports.yahoo.com/nfl/players/${sanitizedName}/photo`,
    
    // Sports reference sites
    `https://www.pro-football-reference.com/req/202107181/images/headshots/${sanitizedName}.jpg`,
    
    // Generic/fallback attempts
    `https://img.bleacherreport.net/img/images/photos/003/775/000/${sanitizedName}_crop_exact.jpg`,
  ];
  
  // Add team-specific attempts and name variations
  const teamLower = player.team.toLowerCase();
  
  // Try different name formats
  const nameVariations = [
    sanitizedName,
    player.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    player.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
    player.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''),
  ];
  
  // Add more URL patterns with name variations
  nameVariations.forEach(nameVar => {
    if (nameVar !== sanitizedName) { // Don't duplicate the main attempts
      imageUrls.push(
        `https://images.fantasypros.com/images/nfl/players/400x400/${nameVar}.jpg`,
        `https://static.www.nfl.com/image/private/t_headshot_desktop/league/player/${nameVar}`,
        `https://a.espncdn.com/i/headshots/nfl/players/full/${nameVar}.png`
      );
    }
  });
  
  // Team-specific attempts
  imageUrls.push(
    `https://www.${getTeamWebsite(player.team)}/content/dam/nfl/${teamLower}/photos/players/${sanitizedName}.jpg`,
    `https://static.clubs.nfl.com/${teamLower}/images/players/${sanitizedName}.jpg`
  );
  
  console.log(`🔍 Scraping ${player.name} (${player.team} ${player.position})...`);
  
  for (const [index, imageUrl] of imageUrls.entries()) {
    try {
      console.log(`   Attempt ${index + 1}/${imageUrls.length}: ${imageUrl.substring(0, 60)}...`);
      
      const result = await downloadImage(imageUrl, filepath);
      console.log(`   ✅ Success: ${filename} (${Math.round(result.size / 1024)}KB)`);
      
      return {
        player,
        success: true,
        imageUrl,
        filename,
        size: result.size,
        attemptNumber: index + 1
      };
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      
      // Clean up failed download
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return {
    player,
    success: false,
    reason: 'No valid image found from any source'
  };
}

// Function to get team website domain
function getTeamWebsite(team) {
  const teamSites = {
    'ARI': 'azcardinals.com',
    'ATL': 'atlantafalcons.com',
    'BAL': 'baltimoreravens.com',
    'BUF': 'buffalobills.com',
    'CAR': 'panthers.com',
    'CHI': 'chicagobears.com',
    'CIN': 'bengals.com',
    'CLE': 'clevelandbrowns.com',
    'DAL': 'dallascowboys.com',
    'DEN': 'denverbroncos.com',
    'DET': 'detroitlions.com',
    'GB': 'packers.com',
    'HOU': 'houstontexans.com',
    'IND': 'colts.com',
    'JAC': 'jaguars.com',
    'KC': 'chiefs.com',
    'LV': 'raiders.com',
    'LAC': 'chargers.com',
    'LAR': 'therams.com',
    'MIA': 'miamidolphins.com',
    'MIN': 'vikings.com',
    'NE': 'patriots.com',
    'NO': 'neworleanssaints.com',
    'NYG': 'giants.com',
    'NYJ': 'newyorkjets.com',
    'PHI': 'philadelphiaeagles.com',
    'PIT': 'steelers.com',
    'SF': '49ers.com',
    'SEA': 'seahawks.com',
    'TB': 'buccaneers.com',
    'TEN': 'titansonline.com',
    'WAS': 'commanders.com'
  };
  
  return teamSites[team] || 'nfl.com';
}

// Main batch processing function
async function processBatches(players) {
  const results = {
    successful: [],
    failed: [],
    total: players.length,
    processed: 0
  };
  
  console.log(`🚀 Starting batch scraper for ${players.length} players...\n`);
  
  // Process in batches
  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = players.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(players.length / BATCH_SIZE);
    
    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} players)...\n`);
    
    // Process batch sequentially to avoid overwhelming servers
    for (const player of batch) {
      const result = await scrapePlayerImage(player);
      results.processed++;
      
      if (result.success) {
        results.successful.push(result);
      } else {
        results.failed.push(result);
      }
      
      // Small delay between individual players within batch
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Progress update
    console.log(`\n📊 Progress: ${results.processed}/${players.length} players processed`);
    console.log(`   ✅ Successful: ${results.successful.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}\n`);
    
    // Save interim results
    const resultsFile = path.join(__dirname, '../tmp/batch-scrape-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    // Delay between batches (except for last batch)
    if (i + BATCH_SIZE < players.length) {
      console.log(`⏱️  Waiting ${DELAY_MS}ms before next batch...\n`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  return results;
}

// Main function
async function main() {
  try {
    const players = loadPlayersWithoutImages();
    console.log(`🎯 Loaded ${players.length} priority players to process\n`);
    
    // Show sample of players to be processed
    console.log('🔍 Sample players to process:');
    players.slice(0, 10).forEach((player, i) => {
      console.log(`   ${i + 1}. ${player.name} (${player.team} ${player.position})`);
    });
    console.log(`   ... and ${players.length - 10} more\n`);
    
    const results = await processBatches(players);
    
    // Final summary
    console.log('🎉 Batch scraping complete!');
    console.log(`📊 Final Results:`);
    console.log(`   ✅ Successful: ${results.successful.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);
    console.log(`   📁 Results saved to: tmp/batch-scrape-results.json`);
    
    if (results.successful.length > 0) {
      console.log('\n✅ Successfully downloaded images:');
      results.successful.slice(0, 10).forEach(r => {
        console.log(`   ${r.player.name} (${r.player.team}) -> ${r.filename}`);
      });
      if (results.successful.length > 10) {
        console.log(`   ... and ${results.successful.length - 10} more`);
      }
    }
    
    // Update mapping file if we got new images
    if (results.successful.length > 0) {
      console.log('\n📝 Updating player images mapping...');
      const { spawn } = require('child_process');
      const updateMapping = spawn('node', ['scripts/update-player-images-mapping.js'], { stdio: 'inherit' });
      
      updateMapping.on('close', (code) => {
        console.log(`\n✅ Mapping update completed with code ${code}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the batch scraper
main();