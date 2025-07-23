#!/usr/bin/env node

/**
 * Manual fix for Jayden Daniels using more reliable sources
 * Stop using ESPN IDs and use direct NFL/PFR sources instead
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// More reliable URL patterns for Jayden Daniels specifically
const reliableSources = [
  // NFL.com official pattern (most reliable)
  'https://static.www.nfl.com/image/private/w_200,h_200,c_fill/league/players/daniels-jayden',
  
  // Pro Football Reference (predictable naming)
  'https://www.pro-football-reference.com/req/202107181/images/headshots/d/DaniJa00.jpg',
  'https://www.pro-football-reference.com/req/202107181/images/headshots/d/DaniJa01.jpg',
  
  // Alternative NFL.com formats
  'https://static.www.nfl.com/image/private/w_200,h_200,c_fill/league/players/jayden-daniels',
  'https://static.www.nfl.com/image/private/w_200,h_200,c_fill/league/players/j-daniels-was',
  
  // CBS Sports (often reliable)
  'https://sportshub.cbsistatic.com/i/r/2024/08/01/jayden-daniels-headshot.jpg',
  
  // NFL Draft Database (for newer players)
  'https://www.nfldraftbuzz.com/headshots/jayden-daniels.jpg'
];

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, '../public/player-images', filename);
    
    console.log(`  📥 Trying: ${url}`);
    
    const request = https.get(url, { 
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          // More strict validation
          const isValidImage = buffer.length > 10000 && buffer.length < 1500000 && 
                              (buffer[0] === 0x89 || buffer[0] === 0xFF || buffer[0] === 0x47);
          
          // Avoid the problematic 313,232 byte size that keeps appearing
          const isNotProblematicSize = buffer.length !== 313232;
          
          if (isValidImage && isNotProblematicSize) {
            fs.writeFileSync(outputPath, buffer);
            console.log(`  ✅ Downloaded: ${filename} (${buffer.length.toLocaleString()} bytes)`);
            console.log(`     URL: ${url}`);
            resolve({ success: true, size: buffer.length, filename, url });
          } else {
            console.log(`  ⚠️  Image rejected: ${buffer.length.toLocaleString()} bytes (${isValidImage ? 'valid format' : 'invalid format'}, ${isNotProblematicSize ? 'good size' : 'problematic size'})`);
            reject(new Error(`Image validation failed: ${buffer.length} bytes`));
          }
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        console.log(`  🔄 Following redirect: ${redirectUrl}`);
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

async function findRealJaydenDaniels() {
  console.log('🎯 MANUAL JAYDEN DANIELS FIX');
  console.log('Using reliable sources, avoiding ESPN ID guessing');
  console.log('Rejecting the problematic 313,232 byte image that keeps appearing');
  console.log('═'.repeat(70));
  
  // Check current image size first
  const currentPath = path.join(__dirname, '../public/player-images/was-jayden-daniels.jpg');
  if (fs.existsSync(currentPath)) {
    const currentStats = fs.statSync(currentPath);
    console.log(`📋 Current image size: ${currentStats.size.toLocaleString()} bytes`);
    
    if (currentStats.size === 313232) {
      console.log('⚠️  This is the problematic size that keeps appearing!');
      console.log('   This image is likely incorrect (Brandon Aiyuk/Garrett Wilson/etc.)');
    }
  }
  
  // Create timestamped backup
  const timestamp = Date.now();
  const backupPath = path.join(__dirname, '../public/player-images', `backup-${timestamp}-was-jayden-daniels.jpg`);
  if (fs.existsSync(currentPath)) {
    fs.copyFileSync(currentPath, backupPath);
    console.log(`📁 Backed up current image to: backup-${timestamp}-was-jayden-daniels.jpg`);
  }
  
  // Try each reliable source
  for (const url of reliableSources) {
    try {
      const result = await downloadImage(url, 'was-jayden-daniels.jpg');
      
      console.log('\n🎉 SUCCESS! Found what appears to be correct Jayden Daniels image');
      console.log(`   Source: ${result.url}`);
      console.log(`   Size: ${result.size.toLocaleString()} bytes (different from problematic 313,232)`);
      console.log('\n⚠️  IMPORTANT: Please manually verify this image shows:');
      console.log('   • Jayden Daniels (not Brandon Aiyuk, not Garrett Wilson)');
      console.log('   • Washington Commanders uniform');
      console.log('   • Quarterback position');
      
      return result;
      
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
    
    // Delay between attempts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // If all failed, restore most recent backup
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, currentPath);
    console.log('\n🔄 All downloads failed - restored previous image');
    console.log('   Manual intervention may be required');
  }
  
  throw new Error('Could not find reliable Jayden Daniels image from any source');
}

async function main() {
  try {
    await findRealJaydenDaniels();
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Check the draft tiers page');
    console.log('2. Verify Jayden Daniels #3 shows the correct player');
    console.log('3. If still wrong, we may need to manually source the image');
    console.log('4. Consider checking team roster pages directly');
    
  } catch (error) {
    console.error('\n💥 MANUAL FIX REQUIRED:', error.message);
    console.log('\nSuggested manual steps:');
    console.log('1. Visit commanders.com roster page');
    console.log('2. Find Jayden Daniels official headshot');
    console.log('3. Download manually and replace was-jayden-daniels.jpg');
    console.log('4. Or use a different approach like team media guides');
  }
}

main().catch(console.error);