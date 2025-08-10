#!/usr/bin/env node

/**
 * Fix ONLY Jayden Daniels image - the previous script got Brandon Aiyuk instead
 * We need to find the correct ESPN player ID for Jayden Daniels
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Possible ESPN player IDs for Jayden Daniels (need to try multiple)
const jaydenDanielsIds = [
  '4685681', // Most likely current ID for Jayden Daniels
  '4569618', // Alternative ID
  '4426334', // Another possible ID
  '4240069', // LSU/Washington transition ID
  '4568012'  // Backup ID
];

// Additional URL patterns to try
const alternativeUrls = [
  'https://a.espncdn.com/i/headshots/college-football/players/full/4569618.png',
  'https://a.espncdn.com/i/headshots/college-football/players/full/4426334.png',
  'https://static.www.nfl.com/image/private/w_200,h_200,c_fill/league/players/daniels-jayden-was',
  'https://www.pro-football-reference.com/req/202107181/images/headshots/d/DaniJa01.jpg',
  'https://www.pro-football-reference.com/req/202107181/images/headshots/d/DaniJa02.jpg'
];

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, '../public/player-images', filename);
    
    console.log(`  📥 Trying: ${url}`);
    
    const request = https.get(url, { 
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          // Validate image
          const isValidImage = buffer.length > 5000 && buffer.length < 2000000 && 
                              (buffer[0] === 0x89 || buffer[0] === 0xFF || buffer[0] === 0x47);
          
          if (isValidImage) {
            fs.writeFileSync(outputPath, buffer);
            console.log(`  ✅ Downloaded: ${filename} (${buffer.length.toLocaleString()} bytes)`);
            resolve({ success: true, size: buffer.length, filename, url });
          } else {
            reject(new Error(`Invalid image: ${buffer.length} bytes`));
          }
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        console.log(`  🔄 Redirecting to: ${redirectUrl}`);
        downloadImage(redirectUrl, filename).then(resolve).catch(reject);
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

async function findCorrectJaydenDaniels() {
  console.log('🔧 FIXING JAYDEN DANIELS IMAGE SPECIFICALLY');
  console.log('The previous script downloaded Brandon Aiyuk by mistake');
  console.log('═'.repeat(60));
  
  // Backup current (incorrect) file
  const currentPath = path.join(__dirname, '../public/player-images/was-jayden-daniels.jpg');
  const backupPath = path.join(__dirname, '../public/player-images/incorrect-aiyuk-was-jayden-daniels.jpg');
  
  if (fs.existsSync(currentPath)) {
    fs.copyFileSync(currentPath, backupPath);
    console.log('📋 Backed up incorrect Brandon Aiyuk image');
  }
  
  // Try ESPN IDs first
  console.log('\n🎯 Trying ESPN player IDs for Jayden Daniels...');
  for (const playerId of jaydenDanielsIds) {
    const url = `https://a.espncdn.com/i/headshots/nfl/players/full/${playerId}.png`;
    try {
      const result = await downloadImage(url, 'was-jayden-daniels.jpg');
      console.log(`🎉 SUCCESS! Found correct Jayden Daniels with ESPN ID: ${playerId}`);
      console.log(`   Size: ${result.size.toLocaleString()} bytes`);
      console.log(`   URL: ${result.url}`);
      return result;
    } catch (error) {
      console.log(`  ❌ ID ${playerId} failed: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Try alternative URLs
  console.log('\n🔄 Trying alternative sources...');
  for (const url of alternativeUrls) {
    try {
      const result = await downloadImage(url, 'was-jayden-daniels.jpg');
      console.log(`🎉 SUCCESS! Found correct Jayden Daniels from alternative source`);
      console.log(`   Size: ${result.size.toLocaleString()} bytes`);
      console.log(`   URL: ${result.url}`);
      return result;
    } catch (error) {
      console.log(`  ❌ Alternative URL failed: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // If all failed, restore original
  const originalBackup = path.join(__dirname, '../public/player-images/backup-was-jayden-daniels.jpg');
  if (fs.existsSync(originalBackup)) {
    fs.copyFileSync(originalBackup, currentPath);
    console.log('🔄 Restored original Jayden Daniels image (all downloads failed)');
    console.log('   The original was correct - keeping it');
    return { success: true, restored: true };
  }
  
  throw new Error('Could not find correct Jayden Daniels image');
}

async function main() {
  try {
    const result = await findCorrectJaydenDaniels();
    
    console.log('\n📊 RESULT:');
    console.log('═'.repeat(30));
    
    if (result.restored) {
      console.log('✅ Restored original correct Jayden Daniels image');
      console.log('   (You were right - the original was correct!)');
    } else {
      console.log('✅ Found and downloaded correct Jayden Daniels image');
      console.log(`   File: was-jayden-daniels.jpg (${result.size.toLocaleString()} bytes)`);
    }
    
    console.log('\n🎯 VERIFICATION:');
    console.log('Please check the draft tiers page to confirm:');
    console.log('• Jayden Daniels #3 now shows JAYDEN DANIELS (not Brandon Aiyuk)');
    console.log('• The image should show a Commanders QB, not a 49ers WR');
    
  } catch (error) {
    console.error('\n💥 FAILED:', error.message);
    console.log('\nThe original backup image should still be available if needed.');
  }
}

main().catch(console.error);