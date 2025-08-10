#!/usr/bin/env node

/**
 * Fix specific player image mismatches
 * These players have correct data but wrong image files
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Players with mismatched images
const playersToFix = [
  {
    name: 'Jayden Daniels',
    team: 'WAS',
    filename: 'was-jayden-daniels.jpg',
    searchTerms: ['Jayden Daniels Commanders', 'Jayden Daniels Washington']
  },
  {
    name: 'Justin Fields',
    team: 'NYJ',
    filename: 'nyj-justin-fields.jpg', 
    searchTerms: ['Justin Fields Jets', 'Justin Fields New York Jets']
  },
  {
    name: 'Kyler Murray',
    team: 'ARI',
    filename: 'ari-kyler-murray.jpg',
    searchTerms: ['Kyler Murray Cardinals', 'Kyler Murray Arizona']
  },
  {
    name: 'Kirk Cousins',
    team: 'ATL',
    filename: 'atl-kirk-cousins.jpg',
    searchTerms: ['Kirk Cousins Falcons', 'Kirk Cousins Atlanta']
  }
];

// NFL team headshot URL patterns to try
const urlPatterns = [
  // NFL.com pattern
  (name, team) => {
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    const teamCode = team.toLowerCase();
    return `https://static.www.nfl.com/image/private/w_200,h_200,c_fill/league/players/${cleanName}`;
  },
  
  // ESPN pattern  
  (name, team) => {
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    return `https://a.espncdn.com/i/headshots/nfl/players/full/${cleanName}.png`;
  },
  
  // Alternative format
  (name, team) => {
    const firstName = name.split(' ')[0].toLowerCase();
    const lastName = name.split(' ')[1].toLowerCase();
    return `https://www.pro-football-reference.com/req/202107181/images/headshots/${lastName[0]}/${lastName}${firstName[0]}${firstName[1]}01.jpg`;
  }
];

// Manual backup URLs for known players (high quality sources)
const manualUrls = {
  'Jayden Daniels': [
    'https://www.pro-football-reference.com/req/202107181/images/headshots/d/DaniJa00.jpg',
    'https://static.www.nfl.com/image/private/w_200,h_200,c_fill/league/players/daniels-jayden',
    'https://a.espncdn.com/i/headshots/nfl/players/full/4360438.png'
  ],
  'Justin Fields': [
    'https://www.pro-football-reference.com/req/202107181/images/headshots/f/FielJu00.jpg', 
    'https://static.www.nfl.com/image/private/w_200,h_200,c_fill/league/players/fields-justin',
    'https://a.espncdn.com/i/headshots/nfl/players/full/4241478.png'
  ],
  'Kyler Murray': [
    'https://www.pro-football-reference.com/req/202107181/images/headshots/m/MurrKy00.jpg',
    'https://static.www.nfl.com/image/private/w_200,h_200,c_fill/league/players/murray-kyler',
    'https://a.espncdn.com/i/headshots/nfl/players/full/3917792.png'
  ],
  'Kirk Cousins': [
    'https://www.pro-football-reference.com/req/202107181/images/headshots/c/CousKi00.jpg',
    'https://static.www.nfl.com/image/private/w_200,h_200,c_fill/league/players/cousins-kirk', 
    'https://a.espncdn.com/i/headshots/nfl/players/full/14880.png'
  ]
};

// Download image from URL
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, '../public/player-images', filename);
    
    console.log(`  📥 Trying: ${url}`);
    
    const request = https.get(url, { timeout: 10000 }, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(outputPath);
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          const stats = fs.statSync(outputPath);
          
          // Check if image is reasonable size (> 5KB, < 1MB)
          if (stats.size > 5000 && stats.size < 1000000) {
            console.log(`  ✅ Downloaded: ${filename} (${stats.size.toLocaleString()} bytes)`);
            resolve({ success: true, size: stats.size, filename });
          } else {
            fs.unlink(outputPath, () => {});
            reject(new Error(`Invalid image size: ${stats.size} bytes`));
          }
        });
        
        file.on('error', (err) => {
          fs.unlink(outputPath, () => {});
          reject(err);
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    request.on('error', reject);
  });
}

// Try multiple URLs for a player until one works
async function tryDownloadPlayer(player) {
  console.log(`\n🔄 Fixing ${player.name} (${player.team})...`);
  
  // Backup current file
  const originalPath = path.join(__dirname, '../public/player-images', player.filename);
  const backupPath = path.join(__dirname, '../public/player-images', `backup-${player.filename}`);
  
  if (fs.existsSync(originalPath)) {
    fs.copyFileSync(originalPath, backupPath);
    console.log(`  📋 Backed up original image`);
  }
  
  // Try manual URLs first (most reliable)
  if (manualUrls[player.name]) {
    for (const url of manualUrls[player.name]) {
      try {
        const result = await downloadImage(url, player.filename);
        console.log(`  🎯 Success with manual URL!`);
        return result;
      } catch (error) {
        console.log(`  ❌ Manual URL failed: ${error.message}`);
      }
    }
  }
  
  // Try generated URL patterns
  for (const pattern of urlPatterns) {
    try {
      const url = pattern(player.name, player.team);
      const result = await downloadImage(url, player.filename);
      console.log(`  🎯 Success with pattern URL!`);
      return result;
    } catch (error) {
      console.log(`  ❌ Pattern failed: ${error.message}`);
    }
  }
  
  // Restore backup if all failed
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, originalPath);
    console.log(`  🔄 Restored original image (no better option found)`);
  }
  
  throw new Error(`All download attempts failed for ${player.name}`);
}

async function main() {
  console.log('🔧 FIXING PLAYER IMAGE MISMATCHES');
  console.log('═'.repeat(50));
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const player of playersToFix) {
    try {
      const result = await tryDownloadPlayer(player);
      results.success.push({ player: player.name, ...result });
      
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`  💥 Failed to fix ${player.name}: ${error.message}`);
      results.failed.push({ player: player.name, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('═'.repeat(50));
  console.log(`✅ Successfully fixed: ${results.success.length} players`);
  console.log(`❌ Failed to fix: ${results.failed.length} players`);
  
  if (results.success.length > 0) {
    console.log('\n🎉 Fixed Players:');
    results.success.forEach(r => {
      console.log(`  • ${r.player}: ${r.filename} (${r.size.toLocaleString()} bytes)`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n⚠️ Still Need Manual Fix:');
    results.failed.forEach(r => {
      console.log(`  • ${r.player}: ${r.error}`);
    });
  }
  
  console.log('\n📝 Next Steps:');
  console.log('• Test the draft tiers page to verify correct images');
  console.log('• Check that Jayden Daniels shows Jayden Daniels (not Justin Fields)');
  console.log('• Check that Justin Fields shows Justin Fields (not Jayden Daniels)');
  console.log('• Verify Kyler Murray and Kirk Cousins show correctly');
  console.log('• If any still show wrong, may need manual image replacement');
}

main().catch(console.error);