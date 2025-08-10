#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to the mapping file
const mappingPath = path.join(__dirname, '../src/data/player-images.json');

console.log('🔧 Fixing player image mapping format...');

try {
  // Read the current mapping
  const currentMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  
  // Create new mapping with correct format
  const newMapping = {};
  
  Object.entries(currentMapping).forEach(([oldKey, imagePath]) => {
    // Parse the old key format: "TEAM Player Name"
    const spaceIndex = oldKey.indexOf(' ');
    if (spaceIndex === -1) {
      console.warn(`⚠️  Skipping malformed key: ${oldKey}`);
      return;
    }
    
    const team = oldKey.substring(0, spaceIndex);
    const playerName = oldKey.substring(spaceIndex + 1);
    
    // Generate the new key format: "player-name-team" (lowercase, hyphenated)
    const sanitizedName = playerName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const sanitizedTeam = team.toLowerCase();
    const newKey = `${sanitizedName}-${sanitizedTeam}`;
    
    newMapping[newKey] = imagePath;
    
    console.log(`✅ ${oldKey} → ${newKey}`);
  });
  
  // Write the new mapping
  fs.writeFileSync(mappingPath, JSON.stringify(newMapping, null, 2));
  
  console.log(`\n🎉 Successfully converted ${Object.keys(newMapping).length} mappings!`);
  console.log(`📁 Updated file: ${mappingPath}`);
  
} catch (error) {
  console.error('❌ Error fixing mapping:', error);
  process.exit(1);
}