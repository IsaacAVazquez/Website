#!/usr/bin/env node

/**
 * Manual Test Scraper
 * Test specific image URLs to find working sources
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../public/player-images');

// Test player
const TEST_PLAYER = { name: "De'Von Achane", team: "MIA", position: "RB" };

function sanitizeName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function testImageUrl(url, filename) {
  return new Promise((resolve) => {
    console.log(`Testing: ${url}`);
    
    const request = https.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/webp,image/jpeg,image/png,*/*',
        'Referer': 'https://www.google.com/'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        const tempPath = path.join(IMAGES_DIR, `test-${filename}`);
        const file = fs.createWriteStream(tempPath);
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          const stats = fs.statSync(tempPath);
          console.log(`✅ Success: ${Math.round(stats.size / 1024)}KB`);
          
          // Clean up test file
          fs.unlinkSync(tempPath);
          
          resolve({ success: true, size: stats.size, url });
        });
        
        file.on('error', () => {
          console.log('❌ File write error');
          resolve({ success: false, error: 'File write error', url });
        });
      } else {
        console.log(`❌ HTTP ${response.statusCode}`);
        resolve({ success: false, error: `HTTP ${response.statusCode}`, url });
      }
    });
    
    request.on('error', (error) => {
      console.log(`❌ Request error: ${error.message}`);
      resolve({ success: false, error: error.message, url });
    });
    
    request.on('timeout', () => {
      request.destroy();
      console.log('❌ Request timeout');
      resolve({ success: false, error: 'Timeout', url });
    });
  });
}

async function testPlayer(player) {
  const sanitizedName = sanitizeName(player.name);
  const filename = `${player.team.toLowerCase()}-${sanitizedName}.jpg`;
  
  console.log(`\n🔍 Testing ${player.name} (${player.team} ${player.position})`);
  console.log(`Sanitized name: ${sanitizedName}\n`);
  
  // Test URLs to try
  const testUrls = [
    // Direct attempts for this specific player
    `https://images.fantasypros.com/images/nfl/players/400x400/devon-achane.jpg`,
    `https://images.fantasypros.com/images/nfl/players/400x400/de-von-achane.jpg`,
    `https://static.www.nfl.com/image/private/t_headshot_desktop/league/player/devon-achane`,
    `https://static.www.nfl.com/image/private/t_headshot_desktop/league/player/de-von-achane`,
    `https://a.espncdn.com/i/headshots/nfl/players/full/devon-achane.png`,
    `https://a.espncdn.com/i/headshots/nfl/players/full/de-von-achane.png`,
    
    // Try some other common name variations
    `https://images.fantasypros.com/images/nfl/players/400x400/devon_achane.jpg`,
    `https://images.fantasypros.com/images/nfl/players/400x400/devonachane.jpg`,
    
    // Team specific
    `https://www.miamidolphins.com/team/players-roster/devon-achane/`,
    
    // Generic patterns
    `https://static.www.nfl.com/image/private/t_headshot_desktop/league/player/${sanitizedName}`,
    `https://images.fantasypros.com/images/nfl/players/400x400/${sanitizedName}.jpg`,
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    const result = await testImageUrl(url, filename);
    results.push(result);
    
    if (result.success) {
      console.log(`🎉 Found working URL: ${url}`);
      break; // Stop at first success
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const successful = results.filter(r => r.success);
  
  console.log(`\n📊 Results for ${player.name}:`);
  console.log(`   ✅ Successful: ${successful.length}`);
  console.log(`   ❌ Failed: ${results.length - successful.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Working URLs:');
    successful.forEach(r => {
      console.log(`   ${r.url} (${Math.round(r.size / 1024)}KB)`);
    });
  }
  
  return results;
}

// Run the test
testPlayer(TEST_PLAYER).catch(console.error);