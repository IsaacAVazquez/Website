#!/usr/bin/env node

/**
 * Fix widespread player image mismatches for wide receivers
 * Multiple WRs are showing wrong player images
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Players with mismatched images (expanded list)
const playersToFix = [
  // Original problematic players
  {
    name: 'Jayden Daniels',
    team: 'WAS',
    filename: 'was-jayden-daniels.jpg',
    espnId: '4360438',
    position: 'QB'
  },
  {
    name: 'Justin Fields',
    team: 'NYJ', 
    filename: 'nyj-justin-fields.jpg',
    espnId: '4241478',
    position: 'QB'
  },
  
  // Wide receiver image mismatches
  {
    name: 'JaMarr Chase',
    team: 'CIN',
    filename: 'cin-jamarr-chase.jpg',
    espnId: '4372016',
    position: 'WR'
  },
  {
    name: 'Justin Jefferson',
    team: 'MIN',
    filename: 'min-justin-jefferson.jpg', 
    espnId: '4035687',
    position: 'WR'
  },
  {
    name: 'Amon-Ra St. Brown',
    team: 'DET',
    filename: 'det-amon-ra-st-brown.jpg',
    espnId: '4239993',
    position: 'WR'
  },
  {
    name: 'A.J. Brown',
    team: 'PHI',
    filename: 'phi-aj-brown.jpg',
    espnId: '3916387',
    position: 'WR'
  },
  {
    name: 'Davante Adams',
    team: 'LV',
    filename: 'lv-davante-adams.jpg',
    espnId: '2976499',
    position: 'WR'
  },
  {
    name: 'Tyreek Hill',
    team: 'MIA',
    filename: 'mia-tyreek-hill.jpg',
    espnId: '2576925',
    position: 'WR'
  },
  
  // Additional potentially affected players
  {
    name: 'Stefon Diggs',
    team: 'HOU',
    filename: 'hou-stefon-diggs.jpg',
    espnId: '2969939',
    position: 'WR'
  },
  {
    name: 'Travis Etienne',
    team: 'JAX',
    filename: 'jax-travis-etienne.jpg',
    espnId: '4361529',
    position: 'RB'
  }
];

// Multiple URL sources for each player
function getPlayerImageUrls(player) {
  const urls = [];
  
  // ESPN with correct player ID
  if (player.espnId) {
    urls.push(`https://a.espncdn.com/i/headshots/nfl/players/full/${player.espnId}.png`);
  }
  
  // NFL.com patterns
  const nameForUrl = player.name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '-');
  urls.push(`https://static.www.nfl.com/image/private/w_200,h_200,c_fill/league/players/${nameForUrl}`);
  
  // Pro Football Reference (alternative patterns)
  const lastName = player.name.split(' ').pop().toLowerCase().replace(/[^a-z]/g, '');
  const firstInitials = player.name.split(' ')[0].toLowerCase().substring(0, 2);
  urls.push(`https://www.pro-football-reference.com/req/202107181/images/headshots/${lastName[0]}/${lastName}${firstInitials}00.jpg`);
  urls.push(`https://www.pro-football-reference.com/req/202107181/images/headshots/${lastName[0]}/${lastName}${firstInitials}01.jpg`);
  
  // CBS Sports pattern
  const cbsName = player.name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '-');
  urls.push(`https://sportshub.cbsistatic.com/i/r/2023/08/01/players/${cbsName}.jpg`);
  
  return urls;
}

// Download image from URL with better validation
function downloadImage(url, filename, expectedPlayer) {
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
          
          // Basic validation - check if it's a valid image
          const isValidImage = buffer.length > 5000 && buffer.length < 2000000 && 
                              (buffer[0] === 0x89 || buffer[0] === 0xFF || buffer[0] === 0x47); // PNG, JPEG, GIF headers
          
          if (isValidImage) {
            fs.writeFileSync(outputPath, buffer);
            console.log(`  ✅ Downloaded: ${filename} (${buffer.length.toLocaleString()} bytes)`);
            resolve({ success: true, size: buffer.length, filename });
          } else {
            reject(new Error(`Invalid image format or size: ${buffer.length} bytes`));
          }
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        const redirectUrl = response.headers.location;
        console.log(`  🔄 Redirecting to: ${redirectUrl}`);
        downloadImage(redirectUrl, filename, expectedPlayer).then(resolve).catch(reject);
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
async function fixPlayerImage(player) {
  console.log(`\n🔄 Fixing ${player.name} (${player.team}) - ${player.position}...`);
  
  // Backup current file
  const originalPath = path.join(__dirname, '../public/player-images', player.filename);
  const backupPath = path.join(__dirname, '../public/player-images', `backup-${Date.now()}-${player.filename}`);
  
  if (fs.existsSync(originalPath)) {
    fs.copyFileSync(originalPath, backupPath);
    console.log(`  📋 Backed up original to: backup-${Date.now()}-${player.filename}`);
  }
  
  const urls = getPlayerImageUrls(player);
  
  for (const url of urls) {
    try {
      const result = await downloadImage(url, player.filename, player.name);
      console.log(`  🎯 Success! Found correct image for ${player.name}`);
      return result;
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Restore backup if all failed
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, originalPath);
    console.log(`  🔄 Restored original image (no better option found)`);
  }
  
  throw new Error(`All download attempts failed for ${player.name}`);
}

// Validate that player image mapping exists
function validateMapping(player) {
  const mappingPath = path.join(__dirname, '../src/data/player-images.json');
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  
  // Generate possible mapping keys
  const possibleKeys = [
    `${player.name.toLowerCase().replace(/[^a-z]/g, '')}-${player.team.toLowerCase()}`,
    `${player.name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '-')}-${player.team.toLowerCase()}`,
    `${player.name.toLowerCase().replace(/\./g, '').replace(/\s+/g, '-')}-${player.team.toLowerCase()}`
  ];
  
  for (const key of possibleKeys) {
    if (mapping[key]) {
      console.log(`  ✅ Mapping exists: ${key} → ${mapping[key]}`);
      return true;
    }
  }
  
  console.log(`  ⚠️  No mapping found for ${player.name} (${player.team})`);
  console.log(`     Tried keys: ${possibleKeys.join(', ')}`);
  return false;
}

async function main() {
  console.log('🔧 FIXING WIDESPREAD PLAYER IMAGE MISMATCHES');
  console.log('═'.repeat(60));
  console.log(`Fixing ${playersToFix.length} players with image mismatches...`);
  
  const results = {
    success: [],
    failed: [],
    mappingIssues: []
  };
  
  for (const player of playersToFix) {
    try {
      // First validate the mapping exists
      const hasMapping = validateMapping(player);
      if (!hasMapping) {
        results.mappingIssues.push(player.name);
      }
      
      const result = await fixPlayerImage(player);
      results.success.push({ player: player.name, ...result });
      
      // Longer delay between players to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`  💥 Failed to fix ${player.name}: ${error.message}`);
      results.failed.push({ player: player.name, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 FINAL SUMMARY:');
  console.log('═'.repeat(60));
  console.log(`✅ Successfully fixed: ${results.success.length} players`);
  console.log(`❌ Failed to fix: ${results.failed.length} players`);
  console.log(`⚠️  Mapping issues: ${results.mappingIssues.length} players`);
  
  if (results.success.length > 0) {
    console.log('\n🎉 Successfully Fixed:');
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
  
  if (results.mappingIssues.length > 0) {
    console.log('\n🔍 Players with Mapping Issues:');
    results.mappingIssues.forEach(name => {
      console.log(`  • ${name}: May need mapping entry in player-images.json`);
    });
  }
  
  console.log('\n📝 Next Steps:');
  console.log('• Test the draft tiers page to verify all images show correctly');
  console.log('• Check each player shows their own photo (not someone else)');
  console.log('• Verify wide receivers especially: JaMarr Chase, Justin Jefferson, etc.');
  console.log('• If any still wrong, check the browser cache (hard refresh)');
  console.log('• Consider running the comprehensive image validation script');
  
  console.log('\n🎯 Expected Results:');
  console.log('• JaMarr Chase should show JaMarr Chase (not Justin Fields)');
  console.log('• Justin Jefferson should show Justin Jefferson (not Travis Etienne)');
  console.log('• Amon-Ra St. Brown should show Amon-Ra (not JaMarr Chase)');
  console.log('• A.J. Brown should show A.J. Brown (not a Colts player)');
  console.log('• Davante Adams should show Davante (not Stefon Diggs)');
  console.log('• Tyreek Hill should show correct Tyreek Hill image');
}

main().catch(console.error);