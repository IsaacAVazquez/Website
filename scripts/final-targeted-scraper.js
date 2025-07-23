#!/usr/bin/env node

/**
 * Final Targeted Player Image Scraper
 * Uses proven working patterns to get real player images
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// High priority players that we know need images (not duplicates)
const TARGET_PLAYERS = [
  { name: "De'Von Achane", team: "MIA", position: "RB" },
  { name: "Cameron Ward", team: "TEN", position: "QB" },
  { name: "Dillon Gabriel", team: "CLE", position: "QB" },
  { name: "J.J. McCarthy", team: "MIN", position: "QB" },
  { name: "Michael Penix Jr.", team: "ATL", position: "QB" },
  { name: "Will Howard", team: "PIT", position: "QB" },
  { name: "Joe Milton III", team: "DAL", position: "QB" },
  { name: "A.J. Dillon", team: "PHI", position: "RB" },
  { name: "Aaron Jones Sr.", team: "MIN", position: "RB" },
  { name: "Brian Robinson Jr.", team: "WAS", position: "RB" },
];

const IMAGES_DIR = path.join(__dirname, '../public/player-images');
const RESULTS_FILE = path.join(__dirname, '../tmp/final-scrape-results.json');

// Team website mappings
const TEAM_WEBSITES = {
  'ARI': 'azcardinals.com', 'ATL': 'atlantafalcons.com', 'BAL': 'baltimoreravens.com',
  'BUF': 'buffalobills.com', 'CAR': 'panthers.com', 'CHI': 'chicagobears.com',
  'CIN': 'bengals.com', 'CLE': 'clevelandbrowns.com', 'DAL': 'dallascowboys.com',
  'DEN': 'denverbroncos.com', 'DET': 'detroitlions.com', 'GB': 'packers.com',
  'HOU': 'houstontexans.com', 'IND': 'colts.com', 'JAC': 'jaguars.com',
  'KC': 'chiefs.com', 'LV': 'raiders.com', 'LAC': 'chargers.com',
  'LAR': 'therams.com', 'MIA': 'miamidolphins.com', 'MIN': 'vikings.com',
  'NE': 'patriots.com', 'NO': 'neworleanssaints.com', 'NYG': 'giants.com',
  'NYJ': 'newyorkjets.com', 'PHI': 'philadelphiaeagles.com', 'PIT': 'steelers.com',
  'SF': '49ers.com', 'SEA': 'seahawks.com', 'TB': 'buccaneers.com',
  'TEN': 'titansonline.com', 'WAS': 'commanders.com'
};

// Known duplicate/placeholder sizes to reject
const DUPLICATE_SIZES = [107837, 76955];

function sanitizeName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const request = https.get(url, {
      timeout: 15000,
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
        
        const stats = fs.statSync(filepath);
        
        // Reject small images
        if (stats.size < 5000) {
          fs.unlinkSync(filepath);
          reject(new Error('Image too small (likely placeholder)'));
          return;
        }
        
        // Reject known duplicates
        if (DUPLICATE_SIZES.includes(stats.size)) {
          fs.unlinkSync(filepath);
          reject(new Error(`Rejected known duplicate (${stats.size} bytes)`));
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

async function scrapePlayer(player) {
  const sanitizedName = sanitizeName(player.name);
  const filename = `${player.team.toLowerCase()}-${sanitizedName}.jpg`;
  const filepath = path.join(IMAGES_DIR, filename);
  
  // Skip if exists
  if (fs.existsSync(filepath)) {
    return { player, success: false, reason: 'Image already exists' };
  }
  
  console.log(`🔍 Scraping ${player.name} (${player.team} ${player.position})...`);
  
  // Create multiple name variations
  const nameVariations = [
    player.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    player.name.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    player.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    player.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''),
  ];
  
  // Remove duplicates
  const uniqueNames = [...new Set(nameVariations)];
  
  // Build comprehensive URL list
  const imageUrls = [];
  
  // Team website patterns (highest priority - these work!)
  const teamSite = TEAM_WEBSITES[player.team];
  if (teamSite) {
    uniqueNames.forEach(nameVar => {
      imageUrls.push(
        `https://www.${teamSite}/team/players-roster/${nameVar}/`,
        `https://www.${teamSite}/team/players/${nameVar}/`,
        `https://www.${teamSite}/players/${nameVar}/`,
        `https://www.${teamSite}/roster/${nameVar}/`
      );
    });
  }
  
  // Other proven patterns
  uniqueNames.forEach(nameVar => {
    imageUrls.push(
      // ESPN with various formats
      `https://a.espncdn.com/i/headshots/nfl/players/full/${nameVar}.png`,
      `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${nameVar}.png&w=350&h=254`,
      
      // NFL.com
      `https://static.www.nfl.com/image/private/t_headshot_desktop/league/player/${nameVar}`,
      `https://static.www.nfl.com/image/private/t_headshot_desktop/nfl/player/${nameVar}`,
      
      // FantasyPros (when not blocked)
      `https://images.fantasypros.com/images/nfl/players/400x400/${nameVar}.jpg`,
      
      // Other sources
      `https://www.pro-football-reference.com/req/202107181/images/headshots/${nameVar}.jpg`,
    );
  });
  
  // Try each URL
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

async function main() {
  console.log(`🎯 Final targeted scraping for ${TARGET_PLAYERS.length} players...\n`);
  
  const results = {
    successful: [],
    failed: [],
    total: TARGET_PLAYERS.length
  };
  
  for (const player of TARGET_PLAYERS) {
    const result = await scrapePlayer(player);
    
    if (result.success) {
      results.successful.push(result);
    } else {
      results.failed.push(result);
    }
    
    // Delay between players
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  
  console.log('\n🎉 Final scraping complete!');
  console.log(`📊 Results:`);
  console.log(`   ✅ Successful: ${results.successful.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);
  console.log(`   📊 Success Rate: ${Math.round((results.successful.length / results.total) * 100)}%`);
  console.log(`   📁 Results saved to: ${RESULTS_FILE}`);
  
  if (results.successful.length > 0) {
    console.log('\n✅ Successfully downloaded:');
    results.successful.forEach(r => {
      console.log(`   ${r.player.name} (${r.player.team}) -> ${r.filename} (${Math.round(r.size / 1024)}KB)`);
    });
    
    // Update mapping
    console.log('\n📝 Updating player images mapping...');
    const { spawn } = require('child_process');
    const updateMapping = spawn('node', ['scripts/update-player-images-mapping.js'], { stdio: 'inherit' });
    
    updateMapping.on('close', (code) => {
      console.log(`✅ Mapping update completed with code ${code}`);
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