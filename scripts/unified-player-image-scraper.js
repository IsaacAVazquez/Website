#!/usr/bin/env node

/**
 * Unified Player Image Scraper
 * A comprehensive scraper that prioritizes high-quality images from multiple sources
 * Replaces low-quality images automatically
 */

const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

// Constants
const IMAGE_DIR = path.join(__dirname, '../public/player-images');
const DATA_DIR = path.join(__dirname, '../src/data');
const MIN_IMAGE_SIZE = 5000; // Minimum size in bytes for a good quality image
const PREFERRED_SIZE = '200x200'; // Preferred image dimensions

// Ensure image directory exists
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Load all players from data files
function loadAllPlayers() {
  const positionFiles = ['qbData.ts', 'rbData.ts', 'wrData.ts', 'teData.ts'];
  const allPlayers = [];
  
  positionFiles.forEach(file => {
    const filePath = path.join(DATA_DIR, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const position = file.replace('Data.ts', '').toUpperCase();
      
      // Extract player objects
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

// Generate consistent filename
function generateFilename(player) {
  const sanitizedName = player.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${player.team.toLowerCase()}-${sanitizedName}.jpg`;
}

// Check if existing image is low quality
function isLowQualityImage(filename) {
  const filepath = path.join(IMAGE_DIR, filename);
  if (!fs.existsSync(filepath)) return true;
  
  const stats = fs.statSync(filepath);
  return stats.size < MIN_IMAGE_SIZE;
}

// Search FantasyPros for player and get their ID
async function searchFantasyProsPlayer(player) {
  const nameSlug = player.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Try different URL patterns
  const searchUrls = [
    `https://www.fantasypros.com/nfl/players/${nameSlug}.php`,
    `https://www.fantasypros.com/nfl/players/${nameSlug}-${player.team.toLowerCase()}.php`,
    `https://www.fantasypros.com/nfl/${player.position.toLowerCase()}/${nameSlug}.php`
  ];
  
  for (const url of searchUrls) {
    try {
      console.log(`    🔍 Searching: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Extract player ID from the page
        const idMatch = html.match(/data-player="(\d+)"/);
        if (idMatch) {
          const playerId = idMatch[1];
          console.log(`    ✅ Found player ID: ${playerId}`);
          return { success: true, playerId, source: 'fantasypros' };
        }
      }
    } catch (error) {
      // Continue to next URL
    }
  }
  
  return { success: false };
}

// Get high-quality image URL from FantasyPros
function getFantasyProsImageUrl(playerId, size = '200x200') {
  return `https://images.fantasypros.com/images/players/nfl/${playerId}/headshot/${size}.png`;
}

// Download image with quality check
async function downloadImage(url, filename) {
  const filepath = path.join(IMAGE_DIR, filename);
  const tempPath = filepath + '.tmp';
  
  try {
    console.log(`    📥 Downloading from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // Download to temp file first
    await streamPipeline(response.body, createWriteStream(tempPath));
    
    // Check file size
    const stats = fs.statSync(tempPath);
    if (stats.size < 1000) {
      throw new Error('Image too small (likely placeholder)');
    }
    
    // Move temp file to final location
    fs.renameSync(tempPath, filepath);
    
    console.log(`    ✅ Downloaded: ${filename} (${stats.size} bytes)`);
    return { success: true, size: stats.size, filename };
    
  } catch (error) {
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw error;
  }
}

// Process a single player
async function processPlayer(player, forceUpdate = false) {
  const filename = generateFilename(player);
  const needsUpdate = forceUpdate || isLowQualityImage(filename);
  
  if (!needsUpdate) {
    const stats = fs.statSync(path.join(IMAGE_DIR, filename));
    console.log(`  ⏭️  Skipping ${player.name} - already has quality image (${stats.size} bytes)`);
    return { success: true, skipped: true, player, filename };
  }
  
  console.log(`\n🏈 Processing: ${player.name} (${player.team}) - ${player.position}`);
  
  // Search for player on FantasyPros
  const searchResult = await searchFantasyProsPlayer(player);
  
  if (searchResult.success) {
    // Try to download high-quality image
    const imageUrl = getFantasyProsImageUrl(searchResult.playerId, '200x200');
    
    try {
      const downloadResult = await downloadImage(imageUrl, filename);
      return {
        success: true,
        player,
        filename,
        source: 'fantasypros',
        size: downloadResult.size,
        replaced: !forceUpdate && fs.existsSync(path.join(IMAGE_DIR, filename))
      };
    } catch (error) {
      console.log(`    ❌ Failed to download 200x200: ${error.message}`);
      
      // Try fallback size
      try {
        const fallbackUrl = getFantasyProsImageUrl(searchResult.playerId, '70x70');
        const downloadResult = await downloadImage(fallbackUrl, filename);
        return {
          success: true,
          player,
          filename,
          source: 'fantasypros-small',
          size: downloadResult.size,
          replaced: !forceUpdate && fs.existsSync(path.join(IMAGE_DIR, filename))
        };
      } catch (fallbackError) {
        console.log(`    ❌ Fallback also failed: ${fallbackError.message}`);
      }
    }
  }
  
  return { success: false, player, filename };
}

// Main function
async function main() {
  console.log('🚀 Unified Player Image Scraper\n');
  console.log('📋 Loading players from data files...');
  
  const allPlayers = loadAllPlayers();
  console.log(`✅ Found ${allPlayers.length} offensive players\n`);
  
  // Check existing images
  console.log('🔍 Checking existing image quality...');
  const existingImages = fs.readdirSync(IMAGE_DIR).filter(f => f.endsWith('.jpg'));
  
  let lowQualityCount = 0;
  existingImages.forEach(img => {
    const stats = fs.statSync(path.join(IMAGE_DIR, img));
    if (stats.size < MIN_IMAGE_SIZE) {
      lowQualityCount++;
    }
  });
  
  console.log(`📊 Found ${existingImages.length} existing images`);
  console.log(`⚠️  ${lowQualityCount} are low quality (< ${MIN_IMAGE_SIZE} bytes)\n`);
  
  // Process players
  const results = {
    successful: [],
    failed: [],
    skipped: [],
    replaced: []
  };
  
  // Process in batches to avoid rate limiting
  const BATCH_SIZE = 5;
  const DELAY_MS = 1000;
  
  for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
    const batch = allPlayers.slice(i, Math.min(i + BATCH_SIZE, allPlayers.length));
    console.log(`\n📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(allPlayers.length/BATCH_SIZE)}...`);
    
    const batchPromises = batch.map(player => processPlayer(player));
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(result => {
      if (result.skipped) {
        results.skipped.push(result);
      } else if (result.success) {
        results.successful.push(result);
        if (result.replaced) {
          results.replaced.push(result);
        }
      } else {
        results.failed.push(result);
      }
    });
    
    // Delay between batches
    if (i + BATCH_SIZE < allPlayers.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  // Update player-images.json mapping
  console.log('\n📝 Updating player-images.json mapping...');
  updateImageMapping();
  
  // Final report
  console.log('\n📊 Final Report:');
  console.log('================');
  console.log(`✅ Successfully downloaded: ${results.successful.length}`);
  console.log(`⏭️  Skipped (already good): ${results.skipped.length}`);
  console.log(`🔄 Replaced low quality: ${results.replaced.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed players:');
    results.failed.forEach(r => {
      console.log(`  - ${r.player.name} (${r.player.team})`);
    });
  }
  
  // Size distribution
  const allImages = fs.readdirSync(IMAGE_DIR).filter(f => f.endsWith('.jpg'));
  const sizeDistribution = {
    tiny: 0,     // < 3KB
    small: 0,    // 3-10KB
    medium: 0,   // 10-50KB
    large: 0     // > 50KB
  };
  
  allImages.forEach(img => {
    const stats = fs.statSync(path.join(IMAGE_DIR, img));
    if (stats.size < 3000) sizeDistribution.tiny++;
    else if (stats.size < 10000) sizeDistribution.small++;
    else if (stats.size < 50000) sizeDistribution.medium++;
    else sizeDistribution.large++;
  });
  
  console.log('\n📏 Image size distribution:');
  console.log(`  Tiny (<3KB): ${sizeDistribution.tiny}`);
  console.log(`  Small (3-10KB): ${sizeDistribution.small}`);
  console.log(`  Medium (10-50KB): ${sizeDistribution.medium}`);
  console.log(`  Large (>50KB): ${sizeDistribution.large}`);
}

// Update the player-images.json mapping file
function updateImageMapping() {
  const mappingPath = path.join(DATA_DIR, 'player-images.json');
  const mapping = {};
  
  const imageFiles = fs.readdirSync(IMAGE_DIR).filter(f => f.endsWith('.jpg'));
  
  imageFiles.forEach(filename => {
    // Parse filename to get team and player name
    const nameWithoutExt = filename.replace('.jpg', '');
    const parts = nameWithoutExt.split('-');
    
    if (parts.length >= 2) {
      const team = parts[0].toUpperCase();
      const nameParts = parts.slice(1);
      
      // Convert name parts to proper case
      const name = nameParts.map(part => {
        if (part === 'jr') return 'Jr.';
        if (part === 'sr') return 'Sr.';
        if (part === 'ii') return 'II';
        if (part === 'iii') return 'III';
        if (part === 'iv') return 'IV';
        return part.charAt(0).toUpperCase() + part.slice(1);
      }).join(' ');
      
      const key = `${team} ${name}`;
      mapping[key] = `/player-images/${filename}`;
    }
  });
  
  // Sort and save
  const sortedMapping = {};
  Object.keys(mapping).sort().forEach(key => {
    sortedMapping[key] = mapping[key];
  });
  
  fs.writeFileSync(mappingPath, JSON.stringify(sortedMapping, null, 2));
  console.log(`✅ Updated mapping with ${Object.keys(sortedMapping).length} entries`);
}

// Run the scraper
main().catch(console.error);