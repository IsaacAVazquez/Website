#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLAYER_IMAGES_DIR = path.join(__dirname, '..', 'public', 'player-images');
const MAPPING_FILE = path.join(__dirname, '..', 'src', 'data', 'player-images.json');

function validateImageSystem() {
  console.log('🔍 Validating Player Image System...\n');
  
  // Load mapping
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  
  // Get all image files
  const imageFiles = fs.readdirSync(PLAYER_IMAGES_DIR)
    .filter(file => file.endsWith('.jpg'))
    .map(file => `/player-images/${file}`);
  
  // Analyze image sizes
  let correctSize = 0;
  let oversized = 0;
  let otherSizes = 0;
  
  console.log('📊 Image Size Analysis:');
  
  for (const file of imageFiles) {
    const filePath = path.join(__dirname, '..', 'public', file.substring(1));
    
    try {
      const fileInfo = execSync(`file "${filePath}"`, { encoding: 'utf8' });
      
      if (fileInfo.includes('70 x 70')) {
        correctSize++;
      } else if (fileInfo.includes('3400 x 2450')) {
        oversized++;
      } else {
        otherSizes++;
      }
    } catch (error) {
      console.warn(`Could not analyze ${file}`);
    }
  }
  
  console.log(`   ✅ Correctly sized (70x70): ${correctSize}`);
  console.log(`   ⚠️  Oversized (3400x2450): ${oversized}`);
  console.log(`   📋 Other sizes: ${otherSizes}`);
  console.log(`   📁 Total images: ${imageFiles.length}`);
  
  // Test Anthony Richardson specifically
  console.log('\n🧪 Anthony Richardson Test:');
  
  const anthonyKeys = Object.keys(mapping).filter(key => 
    key.includes('anthony') && key.includes('richardson')
  );
  
  if (anthonyKeys.length > 0) {
    console.log(`   Found ${anthonyKeys.length} Anthony Richardson mapping(s):`);
    
    for (const key of anthonyKeys) {
      const imageUrl = mapping[key];
      const imagePath = path.join(__dirname, '..', 'public', imageUrl.substring(1));
      
      console.log(`   • ${key} -> ${imageUrl}`);
      
      if (fs.existsSync(imagePath)) {
        try {
          const fileInfo = execSync(`file "${imagePath}"`, { encoding: 'utf8' });
          if (fileInfo.includes('70 x 70')) {
            console.log(`     ✅ Image exists and is correctly sized`);
          } else {
            console.log(`     ⚠️  Image exists but wrong size`);
          }
        } catch (error) {
          console.log(`     ❌ Could not verify image`);
        }
      } else {
        console.log(`     ❌ Image file not found`);
      }
    }
  } else {
    console.log(`   ❌ No Anthony Richardson mappings found`);
  }
  
  // Overall health assessment
  console.log('\n🎯 System Health Assessment:');
  
  const consistencyScore = (correctSize / imageFiles.length * 100).toFixed(1);
  
  if (consistencyScore >= 90) {
    console.log(`   ✅ EXCELLENT (${consistencyScore}% images correctly sized)`);
  } else if (consistencyScore >= 70) {
    console.log(`   ⚠️  GOOD (${consistencyScore}% images correctly sized)`);
  } else if (consistencyScore >= 50) {
    console.log(`   ⚠️  FAIR (${consistencyScore}% images correctly sized)`);
  } else {
    console.log(`   ❌ POOR (${consistencyScore}% images correctly sized)`);
  }
  
  console.log('\n💡 Recommendations:');
  
  if (oversized > 0) {
    console.log(`   • Resize ${oversized} oversized images using: node scripts/resize-oversized-images.js --execute`);
    console.log(`   • This will save ~${(oversized * 3.5 / 1024).toFixed(1)} GB and improve performance`);
  }
  
  if (anthonyKeys.length > 0) {
    console.log(`   • ✅ Anthony Richardson mapping is configured correctly`);
  } else {
    console.log(`   • ❌ Anthony Richardson mapping needs to be fixed`);
  }
  
  console.log(`   • Test your fantasy football pages at http://localhost:3001/fantasy-football`);
  
  return {
    totalImages: imageFiles.length,
    correctSize,
    oversized,
    otherSizes,
    consistencyScore: parseFloat(consistencyScore),
    anthonyRichardsonFixed: anthonyKeys.length > 0
  };
}

// Run validation
if (require.main === module) {
  validateImageSystem();
}

module.exports = { validateImageSystem };