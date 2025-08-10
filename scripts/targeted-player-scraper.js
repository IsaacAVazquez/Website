#!/usr/bin/env node

/**
 * Targeted Player Image Scraper
 * Focuses on specific high-priority players
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// High priority players to get images for
const TARGET_PLAYERS = [
  { name: "De'Von Achane", team: "MIA", position: "RB" },
  { name: "Cameron Ward", team: "TEN", position: "QB" },
  { name: "Dillon Gabriel", team: "CLE", position: "QB" },
  { name: "J.J. McCarthy", team: "MIN", position: "QB" },
  { name: "Michael Penix Jr.", team: "ATL", position: "QB" },
  { name: "Alvin Kamara", team: "NO", position: "RB" },
  { name: "Christian McCaffrey", team: "SF", position: "RB" },
  { name: "Derrick Henry", team: "BAL", position: "RB" },
  // Add more as needed
];

const IMAGES_DIR = path.join(__dirname, '../public/player-images');
const RESULTS_FILE = path.join(__dirname, '../tmp/targeted-scrape-results.json');

// Ensure directories exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

if (!fs.existsSync(path.dirname(RESULTS_FILE))) {
  fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });
}

// Function to download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', reject);
  });
}

// Function to search for player on multiple sources
async function searchPlayer(player) {
  const sanitizedName = player.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const filename = `${player.team.toLowerCase()}-${sanitizedName}.jpg`;
  const filepath = path.join(IMAGES_DIR, filename);
  
  // Skip if image already exists
  if (fs.existsSync(filepath)) {
    return {
      player,
      success: false,
      reason: 'Image already exists',
      filename
    };
  }
  
  console.log(`🔍 Searching for ${player.name} (${player.team} ${player.position})...`);
  
  // Try multiple image sources
  const imageSources = [
    // ESPN headshot
    `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4362628.png&w=350&h=254`,
    // Generic NFL.com style
    `https://static.www.nfl.com/image/private/t_headshot_desktop/league/player/${sanitizedName}`,
    // FantasyPros style
    `https://images.fantasypros.com/images/nfl/players/400x400/${sanitizedName}.jpg`,
    // Sports Illustrated
    `https://www.si.com/.image/ar_1:1%2Cc_fill%2Ccs_srgb%2Cfl_progressive%2Cq_auto:good%2Cw_1200/MTk2ODUwNjY1MjI3NzI4MjYy/${sanitizedName}.jpg`,
  ];
  
  for (const imageUrl of imageSources) {
    try {
      console.log(`   Trying: ${imageUrl}`);
      await downloadImage(imageUrl, filepath);
      
      // Check file size (avoid tiny placeholder images)
      const stats = fs.statSync(filepath);
      if (stats.size < 1000) {
        fs.unlinkSync(filepath);
        throw new Error('Image too small (likely placeholder)');
      }
      
      console.log(`   ✅ Success: ${filename} (${Math.round(stats.size / 1024)}KB)`);
      return {
        player,
        success: true,
        imageUrl,
        filename,
        size: stats.size
      };
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      // Clean up failed download
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
  }
  
  // Try manual/constructed URLs for specific players
  if (player.name === "De'Von Achane") {
    const achaneUrls = [
      'https://www.miamidolphins.com/team/players-roster/devon-achane/',
      'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4569618.png',
      'https://static.www.nfl.com/image/private/t_headshot_desktop/league/player/achane-devon',
    ];
    
    for (const url of achaneUrls) {
      try {
        console.log(`   Special attempt for Achane: ${url}`);
        await downloadImage(url, filepath);
        
        const stats = fs.statSync(filepath);
        if (stats.size > 1000) {
          console.log(`   ✅ Special success: ${filename}`);
          return {
            player,
            success: true,
            imageUrl: url,
            filename,
            size: stats.size
          };
        } else {
          fs.unlinkSync(filepath);
        }
      } catch (error) {
        console.log(`   ❌ Special attempt failed: ${error.message}`);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }
    }
  }
  
  return {
    player,
    success: false,
    reason: 'No valid image found from any source'
  };
}

// Main function
async function main() {
  console.log(`🎯 Targeted scraping for ${TARGET_PLAYERS.length} high-priority players...\n`);
  
  const results = {
    successful: [],
    failed: [],
    total: TARGET_PLAYERS.length
  };
  
  for (const player of TARGET_PLAYERS) {
    const result = await searchPlayer(player);
    
    if (result.success) {
      results.successful.push(result);
    } else {
      results.failed.push(result);
    }
    
    // Small delay between players
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  
  console.log('\n🎉 Targeted scraping complete!');
  console.log(`📊 Results:`);
  console.log(`   ✅ Successful: ${results.successful.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);
  console.log(`   📁 Results saved to: ${RESULTS_FILE}`);
  
  if (results.successful.length > 0) {
    console.log('\n✅ Successfully downloaded:');
    results.successful.forEach(r => {
      console.log(`   ${r.player.name} (${r.player.team}) -> ${r.filename}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed to download:');
    results.failed.forEach(r => {
      console.log(`   ${r.player.name} (${r.player.team}): ${r.reason}`);
    });
  }
}

// Run the scraper
main().catch(console.error);