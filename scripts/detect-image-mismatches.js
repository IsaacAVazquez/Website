#!/usr/bin/env node

/**
 * Detect potential image mismatches by analyzing file sizes, dates, and patterns
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const imagesDir = path.join(__dirname, '../public/player-images');
const mappingPath = path.join(__dirname, '../src/data/player-images.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

// Get file stats for all images
function getImageStats() {
  const files = fs.readdirSync(imagesDir).filter(file => file.endsWith('.jpg'));
  const stats = [];
  
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const stat = fs.statSync(filePath);
    const hash = crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
    
    stats.push({
      filename: file,
      size: stat.size,
      modified: stat.mtime,
      hash: hash
    });
  }
  
  return stats.sort((a, b) => b.modified - a.modified);
}

// Group images by size to find potential duplicates
function findDuplicateSizes(stats) {
  const sizeGroups = {};
  
  for (const stat of stats) {
    if (!sizeGroups[stat.size]) {
      sizeGroups[stat.size] = [];
    }
    sizeGroups[stat.size].push(stat);
  }
  
  // Return only groups with multiple files
  return Object.entries(sizeGroups)
    .filter(([size, files]) => files.length > 1)
    .map(([size, files]) => ({ size: parseInt(size), files }));
}

// Find images with identical hashes (exact duplicates)
function findExactDuplicates(stats) {
  const hashGroups = {};
  
  for (const stat of stats) {
    if (!hashGroups[stat.hash]) {
      hashGroups[stat.hash] = [];
    }
    hashGroups[stat.hash].push(stat);
  }
  
  return Object.values(hashGroups)
    .filter(group => group.length > 1);
}

// Analyze recent scraping activity
function analyzeRecentActivity(stats) {
  const now = new Date();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  
  const recent = stats.filter(s => s.modified > oneDayAgo);
  const thisWeek = stats.filter(s => s.modified > oneWeekAgo);
  
  return { recent, thisWeek };
}

// Main analysis
console.log('🔍 PLAYER IMAGE MISMATCH DETECTION\n');

const stats = getImageStats();
const duplicateSizes = findDuplicateSizes(stats);
const exactDuplicates = findExactDuplicates(stats);
const { recent, thisWeek } = analyzeRecentActivity(stats);

console.log('📊 OVERVIEW:');
console.log('─'.repeat(50));
console.log(`Total images: ${stats.length}`);
console.log(`Files with duplicate sizes: ${duplicateSizes.reduce((sum, group) => sum + group.files.length, 0)}`);
console.log(`Exact duplicates: ${exactDuplicates.reduce((sum, group) => sum + group.length, 0)}`);
console.log(`Modified in last 24h: ${recent.length}`);
console.log(`Modified in last week: ${thisWeek.length}`);

// Check the specific players mentioned by user
console.log('\n🎯 SPECIFIC PLAYERS MENTIONED:');
console.log('─'.repeat(50));
const suspiciousPlayers = ['tb-baker-mayfield.jpg', 'ind-daniel-jones.jpg', 'ari-kyler-murray.jpg'];

for (const player of suspiciousPlayers) {
  const stat = stats.find(s => s.filename === player);
  if (stat) {
    console.log(`${player}:`);
    console.log(`  Size: ${stat.size.toLocaleString()} bytes`);
    console.log(`  Modified: ${stat.modified.toISOString()}`);
    console.log(`  Hash: ${stat.hash.substring(0, 8)}...`);
    
    // Check if this size appears elsewhere
    const sameSize = stats.filter(s => s.size === stat.size && s.filename !== stat.filename);
    if (sameSize.length > 0) {
      console.log(`  ⚠️  Same size as: ${sameSize.map(s => s.filename).join(', ')}`);
    }
    
    // Check if this hash appears elsewhere
    const sameHash = stats.filter(s => s.hash === stat.hash && s.filename !== stat.filename);
    if (sameHash.length > 0) {
      console.log(`  🚨 EXACT DUPLICATE of: ${sameHash.map(s => s.filename).join(', ')}`);
    }
    console.log('');
  }
}

// Show duplicate size groups
if (duplicateSizes.length > 0) {
  console.log('\n⚠️  DUPLICATE SIZE GROUPS:');
  console.log('─'.repeat(50));
  
  for (const group of duplicateSizes) {
    console.log(`Size: ${group.size.toLocaleString()} bytes (${group.files.length} files):`);
    for (const file of group.files) {
      console.log(`  - ${file.filename} (${file.modified.toLocaleDateString()})`);
    }
    console.log('');
  }
}

// Show exact duplicates
if (exactDuplicates.length > 0) {
  console.log('\n🚨 EXACT DUPLICATES (Same Hash):');
  console.log('─'.repeat(50));
  
  for (const group of exactDuplicates) {
    console.log(`Hash: ${group[0].hash.substring(0, 12)}... (${group.length} files):`);
    for (const file of group) {
      console.log(`  - ${file.filename} (${file.modified.toLocaleDateString()})`);
    }
    console.log('');
  }
}

// Show recent activity patterns
if (recent.length > 0) {
  console.log('\n🕐 RECENT ACTIVITY (Last 24h):');
  console.log('─'.repeat(50));
  
  // Group by size to see patterns
  const recentSizes = {};
  for (const file of recent) {
    if (!recentSizes[file.size]) {
      recentSizes[file.size] = [];
    }
    recentSizes[file.size].push(file);
  }
  
  for (const [size, files] of Object.entries(recentSizes)) {
    if (files.length > 1) {
      console.log(`⚠️  Multiple files with size ${parseInt(size).toLocaleString()} bytes:`);
      for (const file of files) {
        console.log(`   - ${file.filename}`);
      }
      console.log('');
    }
  }
}

console.log('\n🔧 RECOMMENDATIONS:');
console.log('─'.repeat(50));

if (exactDuplicates.length > 0) {
  console.log('🚨 Found exact duplicates - these need immediate attention');
}

if (duplicateSizes.length > 0) {
  console.log('⚠️  Found files with identical sizes - may indicate same source/duplicate downloads');
}

const smallFiles = stats.filter(s => s.size < 15000); // Files under 15KB
if (smallFiles.length > 0) {
  console.log(`📏 Found ${smallFiles.length} very small files - may be placeholders or low quality`);
}

const veryRecentSimilarSizes = recent.filter(file1 => 
  recent.some(file2 => 
    file1.filename !== file2.filename && 
    Math.abs(file1.size - file2.size) < 1000 // Within 1KB
  )
);

if (veryRecentSimilarSizes.length > 0) {
  console.log('🔄 Found recently scraped files with very similar sizes - check for scraping errors');
}