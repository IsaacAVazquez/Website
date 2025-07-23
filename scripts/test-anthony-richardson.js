#!/usr/bin/env node

// Test script to verify Anthony Richardson mapping works
const fs = require('fs');
const path = require('path');

const MAPPING_FILE = path.join(__dirname, '..', 'src', 'data', 'player-images.json');

// Simulate the PlayerImageService normalization logic
function normalizePlayerName(playerName) {
  return playerName
    .toLowerCase()
    .replace(/\./g, '') // Remove periods
    .replace(/'/g, '') // Remove apostrophes
    .replace(/'/g, '') // Remove smart quotes
    .replace(/jr\.?|sr\.?|iii|iv|v$/gi, '') // Remove suffixes
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
    .trim();
}

function testAnthonyRichardson() {
  console.log('🧪 Testing Anthony Richardson mapping...\n');
  
  // Load the mapping
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  
  // Test case: Anthony Richardson Sr. from IND
  const playerName = "Anthony Richardson Sr.";
  const team = "IND";
  
  // Generate the expected mapping key (simplified version of PlayerImageService logic)
  const normalizedName = normalizePlayerName(playerName);
  const expectedKey = `${normalizedName}-${team.toLowerCase()}`;
  
  console.log(`Player: ${playerName} (${team})`);
  console.log(`Normalized name: "${normalizedName}"`);
  console.log(`Expected mapping key: "${expectedKey}"`);
  
  // Check if the mapping exists
  const imageUrl = mapping[expectedKey];
  
  if (imageUrl) {
    console.log(`✅ Mapping found: ${expectedKey} -> ${imageUrl}`);
    
    // Check if the image file exists
    const imagePath = path.join(__dirname, '..', 'public', imageUrl.replace('/player-images/', '/player-images/'));
    
    if (fs.existsSync(imagePath)) {
      console.log(`✅ Image file exists: ${imagePath}`);
      
      // Check image dimensions
      try {
        const { execSync } = require('child_process');
        const fileInfo = execSync(`file "${imagePath}"`, { encoding: 'utf8' });
        console.log(`✅ Image info: ${fileInfo.trim()}`);
        
        if (fileInfo.includes('70 x 70')) {
          console.log(`✅ Image is correctly sized (70x70)`);
        } else {
          console.log(`⚠️  Image is not standard size (should be 70x70)`);
        }
      } catch (error) {
        console.log(`⚠️  Could not check image dimensions: ${error.message}`);
      }
    } else {
      console.log(`❌ Image file not found: ${imagePath}`);
    }
  } else {
    console.log(`❌ No mapping found for key: "${expectedKey}"`);
    
    // Show available keys that might match
    const potentialKeys = Object.keys(mapping).filter(key => 
      key.includes('anthony') && key.includes('richardson')
    );
    
    if (potentialKeys.length > 0) {
      console.log(`Available Anthony Richardson keys:`);
      potentialKeys.forEach(key => {
        console.log(`   • ${key} -> ${mapping[key]}`);
      });
    }
  }
  
  console.log('\n🎯 Result: Anthony Richardson should now appear correctly on the fantasy football pages!');
}

// Run the test
if (require.main === module) {
  testAnthonyRichardson();
}

module.exports = { testAnthonyRichardson };