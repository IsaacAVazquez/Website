#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PLAYER_IMAGES_DIR = path.join(__dirname, '..', 'public', 'player-images');
const MAPPING_FILE = path.join(__dirname, '..', 'src', 'data', 'player-images.json');

function validatePlayerImages() {
  console.log('🔍 Validating player images mapping...\n');
  
  // Load mapping
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  
  // Get all actual files
  const actualFiles = fs.readdirSync(PLAYER_IMAGES_DIR)
    .filter(file => file.endsWith('.jpg'))
    .map(file => `/player-images/${file}`);
  
  const actualFilesSet = new Set(actualFiles);
  
  let issues = [];
  let validMappings = 0;
  
  console.log('📋 Checking mapping entries...');
  
  // Check each mapping entry
  for (const [key, filePath] of Object.entries(mapping)) {
    if (!actualFilesSet.has(filePath)) {
      issues.push({
        type: 'missing_file',
        key,
        filePath,
        description: `Mapping key "${key}" points to non-existent file: ${filePath}`
      });
    } else {
      validMappings++;
    }
  }
  
  // Check for unmapped files
  const mappedFiles = new Set(Object.values(mapping));
  const unmappedFiles = actualFiles.filter(file => !mappedFiles.has(file));
  
  if (unmappedFiles.length > 0) {
    unmappedFiles.forEach(file => {
      issues.push({
        type: 'unmapped_file',
        filePath: file,
        description: `File exists but is not mapped: ${file}`
      });
    });
  }
  
  // Check for duplicate mappings (multiple keys pointing to same file)
  const fileToKeys = {};
  for (const [key, filePath] of Object.entries(mapping)) {
    if (!fileToKeys[filePath]) {
      fileToKeys[filePath] = [];
    }
    fileToKeys[filePath].push(key);
  }
  
  for (const [filePath, keys] of Object.entries(fileToKeys)) {
    if (keys.length > 1) {
      issues.push({
        type: 'duplicate_mapping',
        filePath,
        keys,
        description: `Multiple keys map to same file: ${keys.join(', ')} -> ${filePath}`
      });
    }
  }
  
  // Report results
  console.log('\n📊 Validation Results:');
  console.log(`   Total mapping entries: ${Object.keys(mapping).length}`);
  console.log(`   Valid mappings: ${validMappings}`);
  console.log(`   Total files: ${actualFiles.length}`);
  console.log(`   Issues found: ${issues.length}`);
  
  if (issues.length > 0) {
    console.log('\n❌ Issues found:');
    
    const byType = {};
    issues.forEach(issue => {
      if (!byType[issue.type]) byType[issue.type] = [];
      byType[issue.type].push(issue);
    });
    
    for (const [type, typeIssues] of Object.entries(byType)) {
      console.log(`\n   ${type.toUpperCase()} (${typeIssues.length} issues):`);
      typeIssues.slice(0, 5).forEach(issue => {
        console.log(`     • ${issue.description}`);
      });
      if (typeIssues.length > 5) {
        console.log(`     ... and ${typeIssues.length - 5} more`);
      }
    }
  }
  
  if (issues.length === 0) {
    console.log('\n✅ All validations passed! Player images system is healthy.');
  } else {
    console.log(`\n⚠️  Found ${issues.length} total issues that should be addressed.`);
  }
  
  return {
    totalMappings: Object.keys(mapping).length,
    validMappings,
    totalFiles: actualFiles.length,
    issues
  };
}

// Run validation
if (require.main === module) {
  validatePlayerImages();
}

module.exports = { validatePlayerImages };