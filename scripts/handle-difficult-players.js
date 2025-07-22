#!/usr/bin/env node

/**
 * Handle Difficult Players
 * Special handling for players that consistently fail with FantasyPros
 * Uses alternative methods and manual mappings
 */

const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

// Players that consistently fail and need special handling
const DIFFICULT_PLAYERS = [
  {
    name: 'C.J. Stroud',
    team: 'HOU',
    position: 'QB',
    alternativeUrls: [
      'https://images.fantasypros.com/images/players/nfl/4709781/headshot/200x200.png',
      'https://a.espncdn.com/i/headshots/nfl/players/full/4709781.png',
      'https://static.www.nfl.com/image/private/t_headshot_desktop/league/person/cj-stroud/headshot',
      'https://www.pro-football-reference.com/req/20180801/images/headshots/StroCJ00_2023.jpg'
    ]
  },
  {
    name: 'De\'Von Achane',
    team: 'MIA', 
    position: 'RB',
    alternativeUrls: [
      'https://images.fantasypros.com/images/players/nfl/4685493/headshot/200x200.png',
      'https://a.espncdn.com/i/headshots/nfl/players/full/4685493.png',
      'https://static.www.nfl.com/image/private/t_headshot_desktop/league/person/devon-achane/headshot'
    ]
  }
];

async function downloadImage(url, localPath) {
  try {
    console.log(`     🔍 Trying: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.log(`     ❌ Failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.log(`     ❌ Not an image: ${contentType}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 1000) {
      console.log(`     ❌ Too small: ${buffer.byteLength} bytes`);
      return false;
    }

    const imageDir = path.join(__dirname, '../public/player-images');
    const fullPath = path.join(imageDir, localPath);
    
    await fs.promises.writeFile(fullPath, Buffer.from(buffer));
    console.log(`     ✅ Downloaded: ${localPath} (${buffer.byteLength} bytes)`);
    return { url, size: buffer.byteLength };
    
  } catch (error) {
    console.log(`     ❌ Error: ${error.message}`);
    return false;
  }
}

function generateImageFilename(player) {
  const sanitizedName = player.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${player.team.toLowerCase()}-${sanitizedName}.jpg`;
}

async function handleDifficultPlayer(player) {
  console.log(`\n🔍 Handling difficult player: ${player.name} (${player.team})`);
  
  const filename = generateImageFilename(player);
  
  for (const url of player.alternativeUrls) {
    const result = await downloadImage(url, filename);
    if (result) {
      return {
        player,
        filename,
        imageUrl: result.url,
        size: result.size,
        source: 'alternative-method',
        success: true
      };
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`     ❌ All alternatives failed for ${player.name}`);
  return {
    player,
    filename,
    success: false,
    reason: 'All alternative URLs failed'
  };
}

async function updatePlayerMappings(results) {
  const mappingPath = path.join(__dirname, '../src/data/player-images.json');
  const currentMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  
  let updated = 0;
  
  results.forEach(result => {
    if (result.success) {
      const key = `${result.player.name.toLowerCase()}-${result.player.team.toLowerCase()}`;
      const cleanKey = key.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      
      // Update or add mapping
      currentMapping[cleanKey] = {
        name: result.player.name,
        team: result.player.team,
        position: result.player.position,
        imagePath: result.filename,
        source: result.source,
        verified: true,
        addedBy: 'difficult-player-handler',
        alternativeMethod: true
      };
      
      updated++;
      console.log(`   ✅ Updated mapping: ${cleanKey} -> ${result.filename}`);
    }
  });
  
  // Save updated mapping
  fs.writeFileSync(mappingPath, JSON.stringify(currentMapping, null, 2));
  console.log(`\n💾 Updated ${updated} mappings in player-images.json`);
  
  return updated;
}

async function main() {
  try {
    console.log('🚀 DIFFICULT PLAYER HANDLER');
    console.log('===========================\n');
    
    console.log(`📋 Handling ${DIFFICULT_PLAYERS.length} difficult players:`);
    DIFFICULT_PLAYERS.forEach(player => {
      console.log(`   - ${player.name} (${player.team}) - ${player.position}`);
    });
    
    const results = [];
    
    for (const player of DIFFICULT_PLAYERS) {
      const result = await handleDifficultPlayer(player);
      results.push(result);
    }
    
    // Update mappings
    const updated = await updatePlayerMappings(results);
    
    // Generate summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n📊 RESULTS SUMMARY');
    console.log('==================');
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📝 Mappings updated: ${updated}`);
    
    if (successful.length > 0) {
      console.log('\n✅ Successfully downloaded:');
      successful.forEach(result => {
        console.log(`   - ${result.player.name}: ${result.filename}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Still failed:');
      failed.forEach(result => {
        console.log(`   - ${result.player.name}: ${result.reason}`);
      });
    }
    
    return { successful: successful.length, failed: failed.length };
    
  } catch (error) {
    console.error('\n❌ Handler failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, DIFFICULT_PLAYERS };