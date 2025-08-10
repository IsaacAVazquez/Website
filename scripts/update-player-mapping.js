#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PLAYER_IMAGES_DIR = path.join(__dirname, '..', 'public', 'player-images');
const MAPPING_FILE = path.join(__dirname, '..', 'src', 'data', 'player-images.json');

function updateMapping() {
  console.log('🔄 Updating player images mapping...\n');
  
  // Load current mapping
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  
  // Get all actual files
  const actualFiles = fs.readdirSync(PLAYER_IMAGES_DIR)
    .filter(file => file.endsWith('.jpg'))
    .map(file => `/player-images/${file}`);
  
  const actualFilesSet = new Set(actualFiles);
  
  // Find mapping entries that point to non-existent files
  const brokenMappings = [];
  const validMappings = {};
  
  for (const [key, filePath] of Object.entries(mapping)) {
    if (actualFilesSet.has(filePath)) {
      validMappings[key] = filePath;
    } else {
      brokenMappings.push({ key, filePath });
    }
  }
  
  console.log(`📊 Mapping Analysis:`);
  console.log(`   Total mappings: ${Object.keys(mapping).length}`);
  console.log(`   Valid mappings: ${Object.keys(validMappings).length}`);
  console.log(`   Broken mappings: ${brokenMappings.length}`);
  
  if (brokenMappings.length > 0) {
    console.log(`\n❌ Broken mappings to remove:`);
    brokenMappings.forEach(({ key, filePath }) => {
      console.log(`   ${key} -> ${filePath}`);
    });
  }
  
  // Find files that exist but aren't mapped
  const mappedFiles = new Set(Object.values(validMappings));
  const unmappedFiles = actualFiles.filter(file => !mappedFiles.has(file));
  
  let autoMapped = {};
  
  if (unmappedFiles.length > 0) {
    console.log(`\n🆕 Unmapped files found:`);
    unmappedFiles.forEach(file => {
      console.log(`   ${file}`);
    });
    
    // Try to auto-map some unmapped files
    console.log(`\n🤖 Attempting to auto-map files...`);
    
    for (const filePath of unmappedFiles) {
      const filename = path.basename(filePath, '.jpg');
      
      // Extract team and player name from filename
      const match = filename.match(/^([a-z]{2,3})-(.+)$/);
      if (match) {
        const [, team, playerPart] = match;
        
        // Create normalized mapping key
        const normalizedPlayer = playerPart.toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .replace(/jr|sr|iii|iv|v$/gi, '');
        
        const mappingKey = `${normalizedPlayer}-${team}`;
        
        // Only add if not already in valid mappings
        if (!validMappings[mappingKey]) {
          autoMapped[mappingKey] = filePath;
          console.log(`   ✅ Auto-mapped: ${mappingKey} -> ${filePath}`);
        }
      }
    }
    
    // Add auto-mapped entries to valid mappings
    Object.assign(validMappings, autoMapped);
  }
  
  // Write updated mapping
  const updatedMappingJson = JSON.stringify(validMappings, null, 2);
  fs.writeFileSync(MAPPING_FILE, updatedMappingJson);
  
  console.log(`\n✅ Updated mapping saved:`);
  console.log(`   Final mappings: ${Object.keys(validMappings).length}`);
  console.log(`   Removed broken: ${brokenMappings.length}`);
  console.log(`   Auto-mapped new: ${Object.keys(autoMapped || {}).length}`);
}

function createSpecialMappings() {
  console.log('\n🔧 Adding special name mappings for common variations...');
  
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  let addedCount = 0;
  
  // Define special mappings for players with known name variations
  const specialMappings = {
    // Kyler Murray - multiple ways people refer to him
    'kylermurray-ari': '/player-images/ari-kylermurray.jpg',
    'kyler-murray-ari': '/player-images/ari-kylermurray.jpg',
    'k-murray-ari': '/player-images/ari-kylermurray.jpg',
    
    // Ja'Marr Chase - apostrophe variations
    'jamarrchase-cin': '/player-images/cin-jamarrchase.jpg',
    'ja-marr-chase-cin': '/player-images/cin-jamarrchase.jpg',
    'jamarr-chase-cin': '/player-images/cin-jamarrchase.jpg',
    
    // Common suffix variations
    'anthonyrichardson-ind': '/player-images/ind-anthonyrichardson.jpg',
    'anthony-richardson-ind': '/player-images/ind-anthonyrichardson.jpg',
    'anthonyrichardsonsr-ind': '/player-images/ind-anthonyrichardson.jpg',
    
    // Team defense (should return null, but we'll handle this in service)
    
    // Add more as needed...
  };
  
  for (const [key, filePath] of Object.entries(specialMappings)) {
    if (!mapping[key] && fs.existsSync(path.join(__dirname, '..', 'public', filePath.substring(1)))) {
      mapping[key] = filePath;
      addedCount++;
      console.log(`   ✅ Added special mapping: ${key} -> ${filePath}`);
    }
  }
  
  // Write updated mapping
  const updatedMappingJson = JSON.stringify(mapping, null, 2);
  fs.writeFileSync(MAPPING_FILE, updatedMappingJson);
  
  console.log(`   Added ${addedCount} special mappings`);
}

// Run the update
if (require.main === module) {
  updateMapping();
  createSpecialMappings();
  console.log('\n🎉 Mapping update complete!');
}

module.exports = { updateMapping, createSpecialMappings };