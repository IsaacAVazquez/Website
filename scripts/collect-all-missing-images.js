#!/usr/bin/env node

/**
 * Collect All Missing Player Images
 * Processes all players without images, focusing on WRs, Kickers, and DSTs
 */

const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

// Position priority for processing
const POSITION_PRIORITY = ['WR', 'K', 'DST', 'TE', 'QB', 'RB'];

// Load all player data
function loadAllPlayers() {
  const dataDir = path.join(__dirname, '../src/data');
  const files = ['qbData.ts', 'rbData.ts', 'wrData.ts', 'teData.ts', 'kData.ts', 'dstData.ts'];
  
  const allPlayers = [];
  
  files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const position = file.replace('Data.ts', '').toUpperCase();
      
      const playerMatches = content.match(/{[\s\S]*?}/g) || [];
      
      playerMatches.forEach(playerBlock => {
        const nameMatch = playerBlock.match(/name:\s*['"]([^'"]+)['"]/);
        const teamMatch = playerBlock.match(/team:\s*['"]([^'"]+)['"]/);
        
        if (nameMatch && teamMatch) {
          allPlayers.push({
            name: nameMatch[1],
            team: teamMatch[1],
            position: position
          });
        }
      });
    }
  });
  
  return allPlayers;
}

// Get existing images
function getCurrentImages() {
  const imageDir = path.join(__dirname, '../public/player-images');
  const images = {};
  
  if (fs.existsSync(imageDir)) {
    const files = fs.readdirSync(imageDir);
    files.forEach(file => {
      if (file.endsWith('.jpg') || file.endsWith('.png')) {
        images[file] = true;
      }
    });
  }
  
  return images;
}

// Generate expected filename
function generateImageFilename(player) {
  const sanitizedName = player.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${player.team.toLowerCase()}-${sanitizedName}.jpg`;
}

// Get missing players
function getMissingPlayers() {
  const allPlayers = loadAllPlayers();
  const currentImages = getCurrentImages();
  const missingPlayers = [];
  
  allPlayers.forEach(player => {
    const expectedFilename = generateImageFilename(player);
    if (!currentImages[expectedFilename]) {
      missingPlayers.push(player);
    }
  });
  
  // Sort by position priority
  missingPlayers.sort((a, b) => {
    const aPriority = POSITION_PRIORITY.indexOf(a.position);
    const bPriority = POSITION_PRIORITY.indexOf(b.position);
    return aPriority - bPriority;
  });
  
  return missingPlayers;
}

// ESPN API patterns
const ESPN_API_PATTERNS = [
  'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/{id}.png&w=350&h=254',
  'https://a.espncdn.com/i/headshots/nfl/players/full/{id}.png',
  'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/{id}.png'
];

// Try to find player on ESPN
async function findESPNImage(player) {
  // Common ESPN player IDs (would need a mapping database for accuracy)
  // For now, try common patterns
  const possibleIds = [
    Math.floor(Math.random() * 100000) + 10000, // Random ID for testing
  ];
  
  for (const id of possibleIds) {
    for (const pattern of ESPN_API_PATTERNS) {
      const url = pattern.replace('{id}', id);
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return { success: true, imageUrl: url, source: 'espn' };
        }
      } catch (error) {
        // Continue trying
      }
    }
  }
  
  return { success: false };
}

// Try FantasyPros API
async function findFantasyProsImage(player) {
  const nameSlug = player.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const urls = [
    `https://www.fantasypros.com/nfl/players/${nameSlug}.php`,
    `https://www.fantasypros.com/nfl/players/${nameSlug}-${player.team.toLowerCase()}.php`,
    `https://www.fantasypros.com/nfl/${player.position.toLowerCase()}/${nameSlug}.php`
  ];
  
  for (const url of urls) {
    try {
      console.log(`     🔍 Checking: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const idMatch = html.match(/data-player="(\d+)"/);
        if (idMatch) {
          const playerId = idMatch[1];
          const imageUrl = `https://images.fantasypros.com/images/players/nfl/${playerId}/headshot/70x70.png`;
          
          // Verify image exists
          const imgResponse = await fetch(imageUrl, { method: 'HEAD' });
          if (imgResponse.ok) {
            return { success: true, imageUrl, source: 'fantasypros', playerId };
          }
        }
      }
    } catch (error) {
      // Continue trying
    }
  }
  
  return { success: false };
}

// Download image
async function downloadImage(url, filename) {
  const imageDir = path.join(__dirname, '../public/player-images');
  const filepath = path.join(imageDir, filename);
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    await streamPipeline(response.body, createWriteStream(filepath));
    
    const stats = fs.statSync(filepath);
    if (stats.size < 1000) {
      fs.unlinkSync(filepath);
      throw new Error('Downloaded image too small');
    }
    
    return { success: true, filename, size: stats.size };
  } catch (error) {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    throw error;
  }
}

// Process a single player
async function processPlayer(player) {
  const filename = generateImageFilename(player);
  
  // Try FantasyPros first
  const fpResult = await findFantasyProsImage(player);
  if (fpResult.success) {
    try {
      const downloadResult = await downloadImage(fpResult.imageUrl, filename);
      return {
        success: true,
        player,
        imageUrl: fpResult.imageUrl,
        filename,
        source: fpResult.source,
        size: downloadResult.size
      };
    } catch (error) {
      console.log(`     ❌ Download failed: ${error.message}`);
    }
  }
  
  // Try ESPN
  const espnResult = await findESPNImage(player);
  if (espnResult.success) {
    try {
      const downloadResult = await downloadImage(espnResult.imageUrl, filename);
      return {
        success: true,
        player,
        imageUrl: espnResult.imageUrl,
        filename,
        source: espnResult.source,
        size: downloadResult.size
      };
    } catch (error) {
      console.log(`     ❌ Download failed: ${error.message}`);
    }
  }
  
  return { success: false, player };
}

// Main processing function
async function processAllMissingPlayers() {
  console.log('🚀 Starting comprehensive player image collection...\\n');
  
  const missingPlayers = getMissingPlayers();
  console.log(`📊 Found ${missingPlayers.length} players without images`);
  
  // Count by position
  const positionCounts = {};
  missingPlayers.forEach(player => {
    positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
  });
  
  console.log('\\n📈 Missing images by position:');
  Object.entries(positionCounts).forEach(([pos, count]) => {
    console.log(`   ${pos}: ${count} players`);
  });
  
  console.log(`\\n🎯 Processing players in priority order: ${POSITION_PRIORITY.join(', ')}\\n`);
  
  const results = {
    successful: [],
    failed: [],
    total: 0
  };
  
  // Process in batches to avoid overwhelming servers
  const BATCH_SIZE = 10;
  const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
  
  for (let i = 0; i < missingPlayers.length; i += BATCH_SIZE) {
    const batch = missingPlayers.slice(i, Math.min(i + BATCH_SIZE, missingPlayers.length));
    console.log(`\\n📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} players)...`);
    
    const batchPromises = batch.map(async (player, index) => {
      const playerNum = i + index + 1;
      console.log(`\\n[${playerNum}/${missingPlayers.length}] ${player.name} (${player.team}) - ${player.position}`);
      
      try {
        const result = await processPlayer(player);
        if (result.success) {
          results.successful.push(result);
          console.log(`   ✅ Success: ${result.filename} (${result.size} bytes) [${result.source}]`);
        } else {
          results.failed.push(result);
          console.log(`   ❌ Failed: No image found`);
        }
      } catch (error) {
        results.failed.push({ player, error: error.message });
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      results.total++;
    });
    
    await Promise.all(batchPromises);
    
    if (i + BATCH_SIZE < missingPlayers.length) {
      console.log(`\\n⏳ Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  // Save results
  const resultsPath = path.join(__dirname, '../tmp/all-missing-images-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log(`\\n📊 Final Results:`);
  console.log(`=====================================`);
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📈 Success rate: ${Math.round(results.successful.length / results.total * 100)}%`);
  console.log(`📁 Results saved to: ${resultsPath}`);
  
  // Show position breakdown
  const successByPosition = {};
  results.successful.forEach(r => {
    successByPosition[r.player.position] = (successByPosition[r.player.position] || 0) + 1;
  });
  
  console.log(`\\n📈 Success by position:`);
  Object.entries(successByPosition).forEach(([pos, count]) => {
    const total = positionCounts[pos] || 0;
    console.log(`   ${pos}: ${count}/${total} (${Math.round(count/total * 100)}%)`);
  });
}

// Run the script
processAllMissingPlayers().catch(console.error);