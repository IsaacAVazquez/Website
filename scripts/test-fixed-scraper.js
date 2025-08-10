#!/usr/bin/env node

/**
 * Test Fixed Player Image Scraper
 * Tests with a small batch to verify the fixes work
 */

const fs = require('fs');
const path = require('path');

// Import the scraping function from the batch scraper
const { scrapePlayerImages, scrapePlayer } = require('./batch-player-scraper.js');

// Test with a small batch of players that don't have images yet
const TEST_PLAYERS = [
  { name: "Cameron Ward", team: "TEN", position: "QB" },
  { name: "De'Von Achane", team: "MIA", position: "RB" },
  { name: "Dillon Gabriel", team: "CLE", position: "QB" },
];

async function testScraper() {
  console.log('🧪 Testing fixed player image scraper...\n');
  
  console.log('Test players:');
  TEST_PLAYERS.forEach((player, i) => {
    console.log(`   ${i + 1}. ${player.name} (${player.team} ${player.position})`);
  });
  console.log('');
  
  const results = {
    successful: [],
    failed: [],
    total: TEST_PLAYERS.length
  };
  
  // Test each player individually
  for (const player of TEST_PLAYERS) {
    try {
      const result = await scrapePlayer(player);
      
      if (result.success) {
        results.successful.push(result);
        console.log(`✅ Success: ${result.filename} from ${result.source}`);
        
        // Verify the image is unique (not a duplicate)
        const imagePath = path.join(__dirname, '../public/player-images', result.filename);
        if (fs.existsSync(imagePath)) {
          const stats = fs.statSync(imagePath);
          console.log(`   📊 Size: ${Math.round(stats.size / 1024)}KB`);
          
          // Check if it's the problematic duplicate size
          if (stats.size === 107837) {
            console.log(`   ⚠️  WARNING: This might be a duplicate image!`);
            results.failed.push({
              ...result,
              success: false,
              reason: 'Potential duplicate detected'
            });
            results.successful.pop(); // Remove from successful
          }
        }
      } else {
        results.failed.push(result);
        console.log(`❌ Failed: ${result.reason || 'Unknown error'}`);
      }
      
      console.log(''); // Empty line between players
      
      // Small delay between players
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`💥 Error testing ${player.name}:`, error.message);
      results.failed.push({
        player,
        success: false,
        reason: error.message
      });
    }
  }
  
  // Summary
  console.log('🧪 Test Results:');
  console.log(`   ✅ Successful: ${results.successful.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);
  console.log(`   📊 Success Rate: ${Math.round((results.successful.length / results.total) * 100)}%`);
  
  if (results.successful.length > 0) {
    console.log('\n✅ Successfully downloaded:');
    results.successful.forEach(r => {
      console.log(`   ${r.player.name} (${r.player.team}) -> ${r.filename} from ${r.source}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed downloads:');
    results.failed.forEach(r => {
      console.log(`   ${r.player.name} (${r.player.team}): ${r.reason}`);
    });
  }
  
  // Save test results
  const testResultsFile = path.join(__dirname, '../tmp/test-scraper-results.json');
  fs.writeFileSync(testResultsFile, JSON.stringify(results, null, 2));
  console.log(`\n📁 Test results saved to: ${testResultsFile}`);
  
  return results;
}

// Run the test
if (require.main === module) {
  testScraper().catch(console.error);
}

module.exports = { testScraper };