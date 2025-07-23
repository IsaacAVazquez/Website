#!/usr/bin/env node

/**
 * Compile All Fantasy Players
 * Creates a comprehensive list of all fantasy players from position data files
 */

const fs = require('fs');
const path = require('path');

// Data file paths
const DATA_FILES = [
  '../src/data/overallData.ts',
  '../src/data/qbData.ts',
  '../src/data/rbData.ts',
  '../src/data/wrData.ts',
  '../src/data/teData.ts',
  '../src/data/kData.ts',
  '../src/data/dstData.ts',
  '../src/data/flexData.ts'
];

// Output file
const OUTPUT_FILE = path.join(__dirname, '../tmp/all-fantasy-players.json');

console.log('🔍 Compiling all fantasy players from data files...\n');

// Function to extract players from TypeScript data file
function extractPlayersFromFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // Extract player objects using regex
    const playerMatches = content.match(/{\s*id:\s*['"]/g);
    if (!playerMatches) return [];

    // Parse the TypeScript content to extract player data
    const players = [];
    const playerObjectRegex = /{\s*id:\s*['"][^'"]+['"]\s*,\s*name:\s*['"]([^'"]+)['"]\s*,\s*team:\s*['"]([^'"]+)['"]\s*,\s*position:\s*['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = playerObjectRegex.exec(content)) !== null) {
      const [, name, team, position] = match;
      players.push({
        name: name.replace(/\\/g, ''), // Remove escape characters
        team: team,
        position: position,
        source: path.basename(filePath, '.ts')
      });
    }

    return players;
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error.message);
    return [];
  }
}

// Compile all players
const allPlayers = [];
const playerMap = new Map(); // To deduplicate

DATA_FILES.forEach(file => {
  console.log(`📄 Processing ${file}...`);
  const players = extractPlayersFromFile(file);
  console.log(`   Found ${players.length} players`);
  
  players.forEach(player => {
    const key = `${player.name}-${player.team}`;
    if (!playerMap.has(key)) {
      playerMap.set(key, player);
      allPlayers.push(player);
    }
  });
});

// Sort players by position and name
allPlayers.sort((a, b) => {
  if (a.position !== b.position) {
    const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position);
  }
  return a.name.localeCompare(b.name);
});

// Create output directory if it doesn't exist
const tmpDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Write output file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allPlayers, null, 2));

// Statistics
const positionCounts = allPlayers.reduce((acc, player) => {
  acc[player.position] = (acc[player.position] || 0) + 1;
  return acc;
}, {});

console.log('\n📊 Player Statistics:');
Object.entries(positionCounts).forEach(([position, count]) => {
  console.log(`   ${position}: ${count} players`);
});
console.log(`\n✅ Total unique players: ${allPlayers.length}`);
console.log(`📁 Saved to: ${OUTPUT_FILE}`);

// Check which players already have images
console.log('\n🖼️  Checking existing images...');
const playerImagesPath = path.join(__dirname, '../src/data/player-images.json');
const existingImages = JSON.parse(fs.readFileSync(playerImagesPath, 'utf-8'));

const playersWithImages = [];
const playersWithoutImages = [];

allPlayers.forEach(player => {
  // Generate key variations to check against existing mapping
  const sanitizedName = player.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const key = `${sanitizedName}-${player.team.toLowerCase()}`;
  
  if (existingImages[key]) {
    playersWithImages.push({ ...player, imageKey: key, imagePath: existingImages[key] });
  } else {
    playersWithoutImages.push({ ...player, expectedKey: key });
  }
});

console.log(`   ✅ Players with images: ${playersWithImages.length}`);
console.log(`   ❌ Players without images: ${playersWithoutImages.length}`);

// Save lists for further processing
const withImagesFile = path.join(__dirname, '../tmp/players-with-images.json');
const withoutImagesFile = path.join(__dirname, '../tmp/players-without-images.json');

fs.writeFileSync(withImagesFile, JSON.stringify(playersWithImages, null, 2));
fs.writeFileSync(withoutImagesFile, JSON.stringify(playersWithoutImages, null, 2));

console.log(`\n📁 Saved players with images: ${withImagesFile}`);
console.log(`📁 Saved players without images: ${withoutImagesFile}`);

// Show sample of players without images
console.log('\n🔍 Sample players needing images:');
playersWithoutImages.slice(0, 10).forEach(player => {
  console.log(`   ${player.name} (${player.team} ${player.position})`);
});
if (playersWithoutImages.length > 10) {
  console.log(`   ... and ${playersWithoutImages.length - 10} more`);
}