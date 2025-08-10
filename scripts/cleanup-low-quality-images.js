#!/usr/bin/env node

/**
 * Cleanup Low Quality Images
 * Identifies and optionally removes low-quality player images
 */

const fs = require('fs');
const path = require('path');

const IMAGE_DIR = path.join(__dirname, '../public/player-images');
const MIN_GOOD_SIZE = 5000; // Images smaller than this are considered low quality

function analyzeImages() {
  console.log('🔍 Analyzing Player Images Quality\n');
  
  const images = fs.readdirSync(IMAGE_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  
  const analysis = {
    total: images.length,
    bySize: {
      tiny: [],      // < 3KB
      small: [],     // 3-10KB  
      medium: [],    // 10-50KB
      large: []      // > 50KB
    },
    lowQuality: [],
    goodQuality: []
  };
  
  images.forEach(filename => {
    const filepath = path.join(IMAGE_DIR, filename);
    const stats = fs.statSync(filepath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    
    const imageInfo = {
      filename,
      size: stats.size,
      sizeKB: `${sizeKB}KB`
    };
    
    if (stats.size < 3000) {
      analysis.bySize.tiny.push(imageInfo);
    } else if (stats.size < 10000) {
      analysis.bySize.small.push(imageInfo);
    } else if (stats.size < 50000) {
      analysis.bySize.medium.push(imageInfo);
    } else {
      analysis.bySize.large.push(imageInfo);
    }
    
    if (stats.size < MIN_GOOD_SIZE) {
      analysis.lowQuality.push(imageInfo);
    } else {
      analysis.goodQuality.push(imageInfo);
    }
  });
  
  // Display results
  console.log(`📊 Total Images: ${analysis.total}`);
  console.log(`✅ Good Quality (≥${MIN_GOOD_SIZE} bytes): ${analysis.goodQuality.length}`);
  console.log(`❌ Low Quality (<${MIN_GOOD_SIZE} bytes): ${analysis.lowQuality.length}\n`);
  
  console.log('📏 Size Distribution:');
  console.log(`  Tiny (<3KB): ${analysis.bySize.tiny.length} images`);
  console.log(`  Small (3-10KB): ${analysis.bySize.small.length} images`);
  console.log(`  Medium (10-50KB): ${analysis.bySize.medium.length} images`);
  console.log(`  Large (>50KB): ${analysis.bySize.large.length} images\n`);
  
  if (analysis.bySize.tiny.length > 0) {
    console.log('🔴 Tiny Images (likely thumbnails):');
    analysis.bySize.tiny.slice(0, 10).forEach(img => {
      console.log(`  - ${img.filename} (${img.sizeKB})`);
    });
    if (analysis.bySize.tiny.length > 10) {
      console.log(`  ... and ${analysis.bySize.tiny.length - 10} more\n`);
    }
  }
  
  return analysis;
}

// Parse command line arguments
const args = process.argv.slice(2);
const shouldDelete = args.includes('--delete');
const sizeThreshold = args.includes('--size') ? 
  parseInt(args[args.indexOf('--size') + 1]) : MIN_GOOD_SIZE;

if (args.includes('--help')) {
  console.log('Usage: node cleanup-low-quality-images.js [options]');
  console.log('Options:');
  console.log('  --delete          Delete low quality images');
  console.log('  --size <bytes>    Set quality threshold (default: 5000)');
  console.log('  --help            Show this help message');
  process.exit(0);
}

// Run analysis
const analysis = analyzeImages();

if (shouldDelete && analysis.lowQuality.length > 0) {
  console.log(`\n🗑️  Deleting ${analysis.lowQuality.length} low quality images...`);
  
  analysis.lowQuality.forEach(img => {
    const filepath = path.join(IMAGE_DIR, img.filename);
    fs.unlinkSync(filepath);
    console.log(`  ❌ Deleted: ${img.filename}`);
  });
  
  console.log('\n✅ Cleanup complete!');
} else if (analysis.lowQuality.length > 0) {
  console.log('\n💡 Tip: Run with --delete flag to remove low quality images');
}