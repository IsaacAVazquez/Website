#!/usr/bin/env node

/**
 * Update Player Images Mapping
 * Scans the player-images directory and updates the player-images.json mapping file
 */

const fs = require('fs');
const path = require('path');

// Path to images directory and mapping file
const IMAGES_DIR = path.join(__dirname, '../public/player-images');
const MAPPING_FILE = path.join(__dirname, '../src/data/player-images.json');

// Get all image files
function getImageFiles() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error('❌ Images directory not found:', IMAGES_DIR);
    return [];
  }
  
  const files = fs.readdirSync(IMAGES_DIR);
  return files.filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
}

// Parse filename to extract player info
function parseFilename(filename) {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(jpg|png)$/, '');
  
  // Split by team prefix (first part is team, rest is name)
  const parts = nameWithoutExt.split('-');
  if (parts.length < 2) return null;
  
  const team = parts[0].toUpperCase();
  const nameParts = parts.slice(1);
  
  // Convert name parts to proper case
  const name = nameParts.map(part => {
    // Handle special cases
    if (part === 'jr') return 'Jr.';
    if (part === 'sr') return 'Sr.';
    if (part === 'ii') return 'II';
    if (part === 'iii') return 'III';
    if (part === 'iv') return 'IV';
    if (part === 'dst') return 'DST';
    
    // Regular capitalization
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(' ');
  
  return {
    team,
    name,
    filename
  };
}

// Main function
function updateMapping() {
  console.log('📸 Updating Player Images Mapping...\n');
  
  // Get all image files
  const imageFiles = getImageFiles();
  console.log(`📊 Found ${imageFiles.length} image files\n`);
  
  // Create mapping object
  const mapping = {};
  const unmapped = [];
  
  imageFiles.forEach(filename => {
    const info = parseFilename(filename);
    if (!info) {
      unmapped.push(filename);
      return;
    }
    
    // Create key: "player-name-team" format (e.g., "baker-mayfield-tb")
    const sanitizedName = info.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const sanitizedTeam = info.team.toLowerCase();
    const key = `${sanitizedName}-${sanitizedTeam}`;
    mapping[key] = `/player-images/${filename}`;
  });
  
  // Sort keys for consistent output
  const sortedMapping = {};
  Object.keys(mapping).sort().forEach(key => {
    sortedMapping[key] = mapping[key];
  });
  
  // Write mapping file
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(sortedMapping, null, 2));
  
  console.log(`✅ Updated mapping with ${Object.keys(sortedMapping).length} players`);
  console.log(`📁 Saved to: ${MAPPING_FILE}`);
  
  if (unmapped.length > 0) {
    console.log(`\n⚠️  ${unmapped.length} files couldn't be mapped:`);
    unmapped.forEach(file => console.log(`   - ${file}`));
  }
  
  // Show sample mappings
  console.log('\n📋 Sample mappings:');
  const samples = Object.entries(sortedMapping).slice(0, 5);
  samples.forEach(([key, value]) => {
    console.log(`   "${key}" → "${value}"`);
  });
  console.log('   ...\n');
}

// Run the update
updateMapping();