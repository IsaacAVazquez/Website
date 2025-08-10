#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PLAYER_IMAGES_DIR = path.join(__dirname, '..', 'public', 'player-images');
const MAPPING_FILE = path.join(__dirname, '..', 'src', 'data', 'player-images.json');

// Known duplicates and incorrect files to remove
const INCORRECT_FILES = [
  'ari-kyler-murray.jpg', // Incorrect - should be ari-kylermurray.jpg
  'backup-1753291636230-was-jayden-daniels.jpg',
  'backup-1753291638793-nyj-justin-fields.jpg', 
  'backup-1753291642955-min-justin-jefferson.jpg',
  'backup-1753291645025-det-amon-ra-st-brown.jpg',
  'backup-1753291649153-lv-davante-adams.jpg',
  'backup-1753291651206-mia-tyreek-hill.jpg',
  'backup-1753292574209-was-jayden-daniels.jpg',
  'backup-ari-kyler-murray.jpg',
  'backup-atl-kirk-cousins.jpg',
  'backup-nyj-justin-fields.jpg',
  'backup-was-jayden-daniels.jpg',
  'incorrect-aiyuk-was-jayden-daniels.jpg'
];

// Duplicates where we want to keep the cleaner named version
const DUPLICATE_PAIRS = [
  // Keep the version without hyphens in player names
  { keep: 'ari-kylermurray.jpg', remove: 'ari-kyler-murray.jpg' },
  { keep: 'ari-claytontune.jpg', remove: 'ari-clayton-tune.jpg' },
  { keep: 'ari-emaridemercado.jpg', remove: 'ari-emari-demercado.jpg' },
  { keep: 'ari-jacobybrissett.jpg', remove: 'ari-jacoby-brissett.jpg' },
  { keep: 'ari-jamesconner.jpg', remove: 'ari-james-conner.jpg' },
  { keep: 'ari-marvinharrison.jpg', remove: 'ari-marvin-harrison-jr.jpg' },
  { keep: 'ari-treybenson.jpg', remove: 'ari-trey-benson.jpg' },
  { keep: 'ari-treymcbride.jpg', remove: 'ari-trey-mcbride.jpg' },
  { keep: 'atl-bijanrobinson.jpg', remove: 'atl-bijan-robinson.jpg' },
  { keep: 'atl-drakelondon.jpg', remove: 'atl-drake-london.jpg' },
  { keep: 'atl-kirkcousins.jpg', remove: 'atl-kirk-cousins.jpg' },
  { keep: 'atl-michaelpenix.jpg', remove: 'atl-michael-penix-jr.jpg' },
  { keep: 'atl-tylerallgeier.jpg', remove: 'atl-tyler-allgeier.jpg' },
  { keep: 'bal-cooperrush.jpg', remove: 'bal-cooper-rush.jpg' },
  { keep: 'bal-derrickhenry.jpg', remove: 'bal-derrick-henry.jpg' },
  { keep: 'bal-isaiahlikely.jpg', remove: 'bal-isaiah-likely.jpg' },
  { keep: 'bal-justicehill.jpg', remove: 'bal-justice-hill.jpg' },
  { keep: 'bal-keatonmitchell.jpg', remove: 'bal-keaton-mitchell.jpg' },
  { keep: 'bal-lamarjackson.jpg', remove: 'bal-lamar-jackson.jpg' },
  { keep: 'bal-markandrews.jpg', remove: 'bal-mark-andrews.jpg' },
  { keep: 'bal-rasheenali.jpg', remove: 'bal-rasheen-ali.jpg' },
  { keep: 'buf-daltonkincaid.jpg', remove: 'buf-dalton-kincaid.jpg' },
  { keep: 'buf-jamescook.jpg', remove: 'buf-james-cook.jpg' },
  { keep: 'buf-joshallen.jpg', remove: 'buf-josh-allen.jpg' },
  { keep: 'buf-raydavis.jpg', remove: 'buf-ray-davis.jpg' },
  { keep: 'buf-tyjohnson.jpg', remove: 'buf-ty-johnson.jpg' },
  { keep: 'buf-tylerbass.jpg', remove: 'buf-tyler-bass.jpg' },
  // Continue with more duplicates as needed...
];

function identifyAllDuplicates() {
  const files = fs.readdirSync(PLAYER_IMAGES_DIR);
  const duplicates = [];
  
  // Find files that look like duplicates (same base name with/without hyphens)
  const processed = new Set();
  
  for (const file of files) {
    if (processed.has(file)) continue;
    
    const baseName = file.replace(/\.jpg$/, '');
    const normalizedName = baseName.replace(/-/g, '');
    
    // Find potential duplicates
    const potentialDuplicates = files.filter(f => {
      const otherBase = f.replace(/\.jpg$/, '');
      const otherNormalized = otherBase.replace(/-/g, '');
      return f !== file && otherNormalized === normalizedName;
    });
    
    if (potentialDuplicates.length > 0) {
      const group = [file, ...potentialDuplicates];
      duplicates.push(group);
      group.forEach(f => processed.add(f));
    }
  }
  
  return duplicates;
}

function cleanupFiles() {
  console.log('🧹 Starting player image cleanup...\n');
  
  // Load current mapping
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  const mappingValues = Object.values(mapping);
  
  let removedCount = 0;
  let errors = [];
  
  // Remove explicitly incorrect files
  console.log('🗑️  Removing explicitly incorrect files:');
  for (const filename of INCORRECT_FILES) {
    const filePath = path.join(PLAYER_IMAGES_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`   ❌ Removed: ${filename}`);
        removedCount++;
      } catch (error) {
        errors.push(`Failed to remove ${filename}: ${error.message}`);
      }
    } else {
      console.log(`   ℹ️  Already missing: ${filename}`);
    }
  }
  
  // Remove duplicates
  console.log('\n🔄 Removing duplicate files:');
  for (const { keep, remove } of DUPLICATE_PAIRS) {
    const removePath = path.join(PLAYER_IMAGES_DIR, remove);
    const keepPath = path.join(PLAYER_IMAGES_DIR, keep);
    
    if (fs.existsSync(removePath)) {
      if (fs.existsSync(keepPath)) {
        try {
          fs.unlinkSync(removePath);
          console.log(`   ❌ Removed duplicate: ${remove} (keeping ${keep})`);
          removedCount++;
        } catch (error) {
          errors.push(`Failed to remove ${remove}: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️  Warning: Keep file ${keep} doesn't exist, not removing ${remove}`);
      }
    } else {
      console.log(`   ℹ️  Already removed: ${remove}`);
    }
  }
  
  // Identify any other potential duplicates
  console.log('\n🔍 Scanning for other potential duplicates:');
  const otherDuplicates = identifyAllDuplicates();
  
  if (otherDuplicates.length > 0) {
    console.log('   Found additional duplicate groups:');
    otherDuplicates.forEach(group => {
      console.log(`   📁 ${group.join(', ')}`);
    });
    console.log('   💡 You may want to manually review these');
  } else {
    console.log('   ✅ No additional duplicates found');
  }
  
  // Report on files not in mapping
  console.log('\n🗂️  Checking for unmapped files:');
  const allFiles = fs.readdirSync(PLAYER_IMAGES_DIR);
  const unmappedFiles = allFiles.filter(file => {
    const relativePath = `/player-images/${file}`;
    return !mappingValues.includes(relativePath);
  });
  
  if (unmappedFiles.length > 0) {
    console.log('   Found unmapped files:');
    unmappedFiles.forEach(file => {
      console.log(`   📋 ${file}`);
    });
  } else {
    console.log('   ✅ All remaining files are mapped');
  }
  
  // Summary
  console.log('\n📊 Cleanup Summary:');
  console.log(`   Removed files: ${removedCount}`);
  console.log(`   Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(error => console.log(`   ${error}`));
  }
  
  console.log('\n✅ Cleanup complete!');
}

// Run the cleanup
if (require.main === module) {
  cleanupFiles();
}

module.exports = { cleanupFiles, identifyAllDuplicates };