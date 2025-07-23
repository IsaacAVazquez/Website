#!/usr/bin/env node

/**
 * Fix duplicate images by removing duplicates and updating mapping
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const imagesDir = path.join(__dirname, '../public/player-images');
const mappingPath = path.join(__dirname, '../src/data/player-images.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

// Get file hash
function getFileHash(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
}

// Find all duplicate groups
function findDuplicateGroups() {
  const files = fs.readdirSync(imagesDir).filter(file => file.endsWith('.jpg'));
  const hashGroups = {};
  
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const hash = getFileHash(filePath);
    
    if (!hashGroups[hash]) {
      hashGroups[hash] = [];
    }
    hashGroups[hash].push({
      filename: file,
      path: filePath,
      stat: fs.statSync(filePath)
    });
  }
  
  // Return only groups with duplicates
  return Object.values(hashGroups).filter(group => group.length > 1);
}

// Determine which file to keep in a duplicate group
function selectFileToKeep(group) {
  // Prefer files that were modified earlier (more likely to be correct)
  // Or files with more descriptive names
  group.sort((a, b) => {
    // First, prefer older files
    if (a.stat.mtime < b.stat.mtime) return -1;
    if (a.stat.mtime > b.stat.mtime) return 1;
    
    // If same date, prefer shorter/simpler names
    return a.filename.length - b.filename.length;
  });
  
  return group[0];
}

// Main execution
console.log('🔧 FIXING DUPLICATE IMAGES\n');

const duplicateGroups = findDuplicateGroups();

if (duplicateGroups.length === 0) {
  console.log('✅ No duplicate images found!');
  process.exit(0);
}

console.log(`Found ${duplicateGroups.length} duplicate groups affecting ${duplicateGroups.reduce((sum, group) => sum + group.length, 0)} files:\n`);

const filesToDelete = [];
const playersToRescrape = [];
const updatedMapping = { ...mapping };

// Process each duplicate group
for (let i = 0; i < duplicateGroups.length; i++) {
  const group = duplicateGroups[i];
  const keeper = selectFileToKeep(group);
  const duplicates = group.filter(file => file.filename !== keeper.filename);
  
  console.log(`Group ${i + 1}: ${group.length} identical files`);
  console.log(`  📁 Keeping: ${keeper.filename} (${keeper.stat.mtime.toLocaleDateString()})`);
  
  for (const duplicate of duplicates) {
    console.log(`  🗑  Deleting: ${duplicate.filename}`);
    filesToDelete.push(duplicate);
    
    // Extract player name for re-scraping
    const playerName = duplicate.filename
      .replace(/^[a-z]+-/, '')  // Remove team prefix
      .replace(/\.jpg$/, '')    // Remove extension
      .replace(/-/g, ' ')       // Replace dashes with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Title case
    
    playersToRescrape.push({
      filename: duplicate.filename,
      playerName: playerName,
      team: duplicate.filename.split('-')[0].toUpperCase()
    });
    
    // Remove from mapping
    const mappingKey = Object.keys(updatedMapping).find(key => 
      updatedMapping[key] === `/player-images/${duplicate.filename}`
    );
    if (mappingKey) {
      console.log(`    - Removing from mapping: ${mappingKey}`);
      delete updatedMapping[mappingKey];
    }
  }
  console.log('');
}

// Confirm before proceeding
console.log('📋 SUMMARY:');
console.log(`- Files to delete: ${filesToDelete.length}`);
console.log(`- Players needing re-scraping: ${playersToRescrape.length}`);
console.log(`- Mapping entries to remove: ${Object.keys(mapping).length - Object.keys(updatedMapping).length}`);

console.log('\n🗑  FILES TO DELETE:');
filesToDelete.forEach(file => console.log(`  - ${file.filename}`));

console.log('\n🔄 PLAYERS NEEDING NEW IMAGES:');
playersToRescrape.forEach(player => console.log(`  - ${player.playerName} (${player.team})`));

// Actually perform the cleanup
console.log('\n⚡ EXECUTING CLEANUP...');

let deletedCount = 0;
for (const file of filesToDelete) {
  try {
    fs.unlinkSync(file.path);
    console.log(`✅ Deleted: ${file.filename}`);
    deletedCount++;
  } catch (error) {
    console.log(`❌ Failed to delete ${file.filename}: ${error.message}`);
  }
}

// Update mapping file
try {
  fs.writeFileSync(mappingPath, JSON.stringify(updatedMapping, null, 2));
  console.log(`✅ Updated mapping file (${Object.keys(updatedMapping).length} entries)`);
} catch (error) {
  console.log(`❌ Failed to update mapping: ${error.message}`);
}

console.log('\n🎯 RESULTS:');
console.log(`- Successfully deleted: ${deletedCount} files`);
console.log(`- Mapping updated: ${Object.keys(mapping).length} → ${Object.keys(updatedMapping).length} entries`);

// Save list of players needing re-scraping
const rescrapeListPath = path.join(__dirname, 'players-to-rescrape.json');
fs.writeFileSync(rescrapeListPath, JSON.stringify(playersToRescrape, null, 2));
console.log(`- Saved re-scrape list: ${rescrapeListPath}`);

console.log('\n✅ CLEANUP COMPLETE!');
console.log('\nNext steps:');
console.log('1. Run the re-scraping script to get correct images for affected players');
console.log('2. Verify the application works correctly');
console.log('3. Test that duplicate issues are resolved');