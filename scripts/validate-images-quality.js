#!/usr/bin/env node

/**
 * Validate Images Quality
 * Comprehensive validation of player images including size, coverage, and mapping
 */

const fs = require('fs');
const path = require('path');

const IMAGE_DIR = path.join(__dirname, '../public/player-images');
const DATA_DIR = path.join(__dirname, '../src/data');
const MAPPING_FILE = path.join(DATA_DIR, 'player-images.json');

// Load all players from data files
function loadAllPlayers() {
  const positionFiles = ['qbData.ts', 'rbData.ts', 'wrData.ts', 'teData.ts', 'kData.ts', 'dstData.ts'];
  const playersByPosition = {};
  let totalPlayers = 0;
  
  positionFiles.forEach(file => {
    const filePath = path.join(DATA_DIR, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const position = file.replace('Data.ts', '').toUpperCase();
      
      playersByPosition[position] = [];
      
      // Extract player objects
      const playerMatches = content.match(/{[\s\S]*?}/g) || [];
      
      playerMatches.forEach(playerBlock => {
        const nameMatch = playerBlock.match(/name:\s*['"]([^'"]+)['"]/);
        const teamMatch = playerBlock.match(/team:\s*['"]([^'"]+)['"]/);
        
        if (nameMatch && teamMatch) {
          playersByPosition[position].push({
            name: nameMatch[1],
            team: teamMatch[1],
            position: position
          });
          totalPlayers++;
        }
      });
    }
  });
  
  return { playersByPosition, totalPlayers };
}

// Generate expected filename
function generateFilename(player) {
  const sanitizedName = player.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${player.team.toLowerCase()}-${sanitizedName}.jpg`;
}

// Check image quality
function checkImageQuality(filename) {
  const filepath = path.join(IMAGE_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return { exists: false };
  }
  
  const stats = fs.statSync(filepath);
  const quality = {
    exists: true,
    size: stats.size,
    sizeKB: (stats.size / 1024).toFixed(1),
    quality: 'unknown'
  };
  
  if (stats.size < 3000) {
    quality.quality = 'tiny';
  } else if (stats.size < 5000) {
    quality.quality = 'low';
  } else if (stats.size < 10000) {
    quality.quality = 'small';
  } else if (stats.size < 50000) {
    quality.quality = 'medium';
  } else {
    quality.quality = 'large';
  }
  
  return quality;
}

// Main validation
function validateImages() {
  console.log('🔍 Player Images Quality Validation Report');
  console.log('==========================================\n');
  
  const { playersByPosition, totalPlayers } = loadAllPlayers();
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  
  const report = {
    total: totalPlayers,
    coverage: {
      withImages: 0,
      withoutImages: 0,
      byPosition: {}
    },
    quality: {
      tiny: 0,
      low: 0,
      small: 0,
      medium: 0,
      large: 0
    },
    missingPlayers: [],
    lowQualityPlayers: []
  };
  
  // Check each position
  Object.entries(playersByPosition).forEach(([position, players]) => {
    console.log(`📊 Checking ${position} (${players.length} players)...`);
    
    const positionStats = {
      total: players.length,
      withImages: 0,
      withoutImages: 0,
      byQuality: {
        tiny: 0,
        low: 0,
        small: 0,
        medium: 0,
        large: 0
      }
    };
    
    players.forEach(player => {
      const filename = generateFilename(player);
      const imageCheck = checkImageQuality(filename);
      const mappingKey = `${player.team} ${player.name}`;
      const hasMappingEntry = mapping.hasOwnProperty(mappingKey);
      
      if (imageCheck.exists) {
        positionStats.withImages++;
        report.coverage.withImages++;
        report.quality[imageCheck.quality]++;
        positionStats.byQuality[imageCheck.quality]++;
        
        if (imageCheck.quality === 'tiny' || imageCheck.quality === 'low') {
          report.lowQualityPlayers.push({
            ...player,
            filename,
            size: imageCheck.size,
            sizeKB: imageCheck.sizeKB,
            quality: imageCheck.quality
          });
        }
      } else {
        positionStats.withoutImages++;
        report.coverage.withoutImages++;
        report.missingPlayers.push({
          ...player,
          filename,
          hasMapping: hasMappingEntry
        });
      }
    });
    
    report.coverage.byPosition[position] = positionStats;
    
    console.log(`  ✅ With images: ${positionStats.withImages} (${Math.round(positionStats.withImages/positionStats.total*100)}%)`);
    console.log(`  ❌ Without images: ${positionStats.withoutImages}`);
    
    if (positionStats.withImages > 0) {
      console.log(`  📏 Quality breakdown:`);
      if (positionStats.byQuality.large > 0) 
        console.log(`     Large (>50KB): ${positionStats.byQuality.large}`);
      if (positionStats.byQuality.medium > 0) 
        console.log(`     Medium (10-50KB): ${positionStats.byQuality.medium}`);
      if (positionStats.byQuality.small > 0) 
        console.log(`     Small (5-10KB): ${positionStats.byQuality.small}`);
      if (positionStats.byQuality.low > 0) 
        console.log(`     Low (3-5KB): ${positionStats.byQuality.low}`);
      if (positionStats.byQuality.tiny > 0) 
        console.log(`     Tiny (<3KB): ${positionStats.byQuality.tiny}`);
    }
    console.log('');
  });
  
  // Overall summary
  console.log('📈 Overall Summary');
  console.log('==================');
  console.log(`Total players: ${report.total}`);
  console.log(`With images: ${report.coverage.withImages} (${Math.round(report.coverage.withImages/report.total*100)}%)`);
  console.log(`Without images: ${report.coverage.withoutImages}\n`);
  
  console.log('📏 Image Quality Distribution:');
  console.log(`  Large (>50KB): ${report.quality.large} images`);
  console.log(`  Medium (10-50KB): ${report.quality.medium} images`);
  console.log(`  Small (5-10KB): ${report.quality.small} images`);
  console.log(`  Low (3-5KB): ${report.quality.low} images`);
  console.log(`  Tiny (<3KB): ${report.quality.tiny} images\n`);
  
  // Show some missing high-priority players
  if (report.missingPlayers.length > 0) {
    console.log('❌ Missing Players (top 10):');
    report.missingPlayers.slice(0, 10).forEach(p => {
      console.log(`  - ${p.name} (${p.team}) - ${p.position}`);
    });
    if (report.missingPlayers.length > 10) {
      console.log(`  ... and ${report.missingPlayers.length - 10} more\n`);
    }
  }
  
  // Show low quality images
  if (report.lowQualityPlayers.length > 0) {
    console.log('⚠️  Low Quality Images (should be replaced):');
    report.lowQualityPlayers.slice(0, 10).forEach(p => {
      console.log(`  - ${p.name} (${p.team}) - ${p.sizeKB}KB [${p.quality}]`);
    });
    if (report.lowQualityPlayers.length > 10) {
      console.log(`  ... and ${report.lowQualityPlayers.length - 10} more\n`);
    }
  }
  
  // Check for orphaned images
  const allImages = fs.readdirSync(IMAGE_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  const expectedImages = new Set();
  
  Object.values(playersByPosition).flat().forEach(player => {
    expectedImages.add(generateFilename(player));
  });
  
  const orphanedImages = allImages.filter(img => !expectedImages.has(img));
  
  if (orphanedImages.length > 0) {
    console.log(`🔍 Found ${orphanedImages.length} orphaned images (not matching any current player)`);
    console.log('   These might be from old rosters or name mismatches\n');
  }
  
  return report;
}

// Run validation
validateImages();