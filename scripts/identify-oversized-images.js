#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLAYER_IMAGES_DIR = path.join(__dirname, '..', 'public', 'player-images');

function identifyOversizedImages() {
  console.log('🔍 Identifying oversized player images...\n');
  
  const files = fs.readdirSync(PLAYER_IMAGES_DIR).filter(file => file.endsWith('.jpg'));
  
  let correctlySized = [];
  let oversized = [];
  let otherSizes = [];
  
  for (const file of files) {
    const filePath = path.join(PLAYER_IMAGES_DIR, file);
    
    try {
      // Use the file command to get image dimensions
      const fileInfo = execSync(`file "${filePath}"`, { encoding: 'utf8' });
      
      if (fileInfo.includes('70 x 70')) {
        correctlySized.push(file);
      } else if (fileInfo.includes('3400 x 2450')) {
        oversized.push(file);
      } else {
        // Extract dimensions for other sizes
        const dimensionMatch = fileInfo.match(/(\d+) x (\d+)/);
        if (dimensionMatch) {
          otherSizes.push({
            file,
            dimensions: `${dimensionMatch[1]}x${dimensionMatch[2]}`
          });
        }
      }
    } catch (error) {
      console.warn(`Could not analyze ${file}: ${error.message}`);
    }
  }
  
  console.log('📊 Image Size Analysis:');
  console.log(`   Correctly sized (70x70): ${correctlySized.length}`);
  console.log(`   Oversized (3400x2450): ${oversized.length}`);
  console.log(`   Other sizes: ${otherSizes.length}`);
  console.log(`   Total files: ${files.length}\n`);
  
  if (oversized.length > 0) {
    console.log('⚠️  Oversized images that may cause rendering issues:');
    console.log('   (These images are 3400x2450 pixels and ~3-4MB each)');
    oversized.slice(0, 20).forEach(file => {
      console.log(`   • ${file}`);
    });
    if (oversized.length > 20) {
      console.log(`   ... and ${oversized.length - 20} more`);
    }
    console.log('');
  }
  
  if (otherSizes.length > 0) {
    console.log('ℹ️  Images with other dimensions:');
    otherSizes.slice(0, 10).forEach(({ file, dimensions }) => {
      console.log(`   • ${file} (${dimensions})`);
    });
    if (otherSizes.length > 10) {
      console.log(`   ... and ${otherSizes.length - 10} more`);
    }
    console.log('');
  }
  
  console.log('💡 Recommendations:');
  console.log('   1. Oversized images should be resized to 70x70 pixels for optimal performance');
  console.log('   2. This will improve loading times and ensure consistent rendering');
  console.log('   3. Consider using an image processing tool to batch resize them');
  
  return {
    correctlySized: correctlySized.length,
    oversized: oversized.length,
    otherSizes: otherSizes.length,
    oversizedFiles: oversized
  };
}

// Run the analysis
if (require.main === module) {
  identifyOversizedImages();
}

module.exports = { identifyOversizedImages };