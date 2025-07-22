#!/usr/bin/env node

/**
 * ESPN Headshot Scraper  
 * Downloads player images by trying different ESPN CDN URL patterns
 */

const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

// Load our missing players data
const missingPlayersPath = path.join(__dirname, '../tmp/missing-players.json');
const missingPlayersData = JSON.parse(fs.readFileSync(missingPlayersPath, 'utf8'));

// ESPN CDN URL patterns to try
const ESPN_IMAGE_PATTERNS = [
  // Direct headshots
  'https://a.espncdn.com/i/headshots/nfl/players/full/{id}.png',
  'https://a.espncdn.com/i/headshots/nfl/players/full/{id}.jpg',
  
  // Combiner service (resized)
  'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/{id}.png&h=200&w=200',
  'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/{id}.jpg&h=200&w=200',
  
  // College football (for rookies)
  'https://a.espncdn.com/i/headshots/college-football/players/full/{id}.png',
  'https://a.espncdn.com/i/headshots/college-football/players/full/{id}.jpg'
];

// Common ESPN player ID ranges to test
const PLAYER_ID_RANGES = [
  // NFL players typically use these ranges
  { start: 2500000, end: 2600000, step: 1000 },  // Older players
  { start: 3000000, end: 3200000, step: 1000 },  // Mid-career players  
  { start: 3900000, end: 4100000, step: 1000 },  // Newer players
  { start: 4000000, end: 4050000, step: 500 },   // Recent draft classes
  { start: 4200000, end: 4250000, step: 500 }    // Latest rookies
];

async function scrapePlayerImages(players, maxPlayers = 50) {
  console.log(`🖼️  Starting ESPN headshot scraper for ${Math.min(players.length, maxPlayers)} players...\n`);
  
  const outputDir = path.join(__dirname, '../public/player-images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const results = {
    successful: [],
    failed: [],
    total: 0
  };
  
  const limitedPlayers = players.slice(0, maxPlayers);
  
  for (let i = 0; i < limitedPlayers.length; i++) {
    const player = limitedPlayers[i];
    console.log(`[${i + 1}/${limitedPlayers.length}] ${player.name} (${player.team})...`);
    
    const imageResult = await findAndDownloadPlayerImage(player, outputDir);
    
    if (imageResult.success) {
      results.successful.push({
        ...player,
        imagePath: imageResult.imagePath,
        imageUrl: imageResult.imageUrl,
        espnId: imageResult.espnId
      });
      console.log(`   ✅ Downloaded: ${imageResult.imagePath}`);
    } else {
      results.failed.push({
        ...player,
        reason: imageResult.reason
      });
      console.log(`   ❌ Failed: ${imageResult.reason}`);
    }
    
    results.total++;
    
    // Add small delay to be respectful to ESPN
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Scraping Results:');
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📈 Success rate: ${Math.round((results.successful.length / results.total) * 100)}%`);
  
  // Save results
  const resultPath = path.join(__dirname, '../tmp/espn-scrape-results.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Results saved to: ${resultPath}`);
  
  return results;
}

async function findAndDownloadPlayerImage(player, outputDir) {
  // Generate expected filename
  const sanitizedName = player.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const imagePath = `${player.team.toLowerCase()}-${sanitizedName}.jpg`;
  const fullPath = path.join(outputDir, imagePath);
  
  // Skip if image already exists
  if (fs.existsSync(fullPath)) {
    return {
      success: true,
      imagePath,
      imageUrl: 'already_exists',
      reason: 'Image already exists'
    };
  }
  
  // Try different ESPN player ID ranges for this player
  const testIds = generatePlayerIdGuesses(player);
  
  for (const testId of testIds) {
    for (const pattern of ESPN_IMAGE_PATTERNS) {
      const imageUrl = pattern.replace('{id}', testId);
      
      try {
        const response = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
          // Download the image
          const fileStream = createWriteStream(fullPath);
          await streamPipeline(response.body, fileStream);
          
          // Verify the image was downloaded and has content
          const stats = fs.statSync(fullPath);
          if (stats.size > 1000) { // At least 1KB to be a real image
            return {
              success: true,
              imagePath,
              imageUrl,
              espnId: testId
            };
          } else {
            // Remove invalid/tiny file
            fs.unlinkSync(fullPath);
          }
        }
      } catch (error) {
        // Continue to next pattern/ID
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }
  
  return {
    success: false,
    reason: 'No valid image found in ESPN patterns'
  };
}

function generatePlayerIdGuesses(player) {
  // Generate potential ESPN player IDs based on player characteristics
  const ids = [];
  
  // For known high-profile players, try common ID patterns
  const nameHash = simpleHash(player.name);
  const teamHash = simpleHash(player.team);
  
  // Try various ID generation strategies
  for (const range of PLAYER_ID_RANGES) {
    // Generate IDs based on name/team hash
    const baseId = range.start + (nameHash % (range.end - range.start));
    ids.push(baseId);
    ids.push(baseId + 1);
    ids.push(baseId - 1);
    
    // Generate IDs based on team hash
    const teamBaseId = range.start + (teamHash % (range.end - range.start));  
    ids.push(teamBaseId);
    
    // Add some common offsets
    ids.push(baseId + 100);
    ids.push(baseId - 100);
  }
  
  // Add some completely random IDs in each range (last resort)
  for (const range of PLAYER_ID_RANGES) {
    for (let i = 0; i < 3; i++) {
      const randomId = range.start + Math.floor(Math.random() * (range.end - range.start));
      ids.push(randomId);
    }
  }
  
  // Remove duplicates and limit to first 15 IDs to test (faster)
  return [...new Set(ids)].slice(0, 15);
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

async function main() {
  console.log('🚀 ESPN Headshot Scraper Starting...\n');
  
  // Start with high-priority players
  const playersToScrape = missingPlayersData.highPriority || missingPlayersData.all.slice(0, 50);
  
  console.log(`📋 Targeting ${playersToScrape.length} high-priority players`);
  
  const results = await scrapePlayerImages(playersToScrape, 50); // Process 50 players
  
  if (results.successful.length > 0) {
    console.log('\n✅ Successfully downloaded images for:');
    results.successful.forEach(player => {
      console.log(`   ${player.name} (${player.team}) -> ${player.imagePath}`);
    });
  }
  
  return results;
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, scrapePlayerImages, findAndDownloadPlayerImage };