#!/usr/bin/env node

/**
 * Image validation system to prevent future duplicates and mismatches
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const imagesDir = path.join(__dirname, '../public/player-images');
const mappingPath = path.join(__dirname, '../src/data/player-images.json');

class ImageValidator {
  constructor() {
    this.mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    this.imageHashes = new Map();
    this.loadImageHashes();
  }

  // Load and cache all image hashes
  loadImageHashes() {
    const files = fs.readdirSync(imagesDir).filter(file => file.endsWith('.jpg'));
    
    for (const file of files) {
      const filePath = path.join(imagesDir, file);
      const hash = crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
      const stats = fs.statSync(filePath);
      
      this.imageHashes.set(file, {
        hash,
        size: stats.size,
        modified: stats.mtime
      });
    }
  }

  // Check for duplicate hashes
  findDuplicates() {
    const hashGroups = new Map();
    
    for (const [filename, data] of this.imageHashes) {
      if (!hashGroups.has(data.hash)) {
        hashGroups.set(data.hash, []);
      }
      hashGroups.get(data.hash).push({ filename, ...data });
    }
    
    return Array.from(hashGroups.values()).filter(group => group.length > 1);
  }

  // Check for suspicious patterns
  findSuspiciousPatterns() {
    const suspicious = [];
    const sizeGroups = new Map();
    
    // Group by similar sizes (within 100 bytes)
    for (const [filename, data] of this.imageHashes) {
      const sizeKey = Math.floor(data.size / 100) * 100;
      if (!sizeGroups.has(sizeKey)) {
        sizeGroups.set(sizeKey, []);
      }
      sizeGroups.get(sizeKey).push({ filename, ...data });
    }
    
    // Find groups with multiple files of very similar sizes
    for (const [sizeKey, files] of sizeGroups) {
      if (files.length > 2 && sizeKey < 15000) { // Small files that might be placeholders
        suspicious.push({
          type: 'small_similar_sizes',
          sizeRange: `${sizeKey}-${sizeKey + 100} bytes`,
          files: files
        });
      }
    }
    
    // Find very recent files with identical sizes
    const now = Date.now();
    const recentFiles = Array.from(this.imageHashes.entries())
      .filter(([filename, data]) => now - data.modified.getTime() < 24 * 60 * 60 * 1000)
      .map(([filename, data]) => ({ filename, ...data }));
    
    const recentSizeGroups = new Map();
    for (const file of recentFiles) {
      if (!recentSizeGroups.has(file.size)) {
        recentSizeGroups.set(file.size, []);
      }
      recentSizeGroups.get(file.size).push(file);
    }
    
    for (const [size, files] of recentSizeGroups) {
      if (files.length > 1) {
        suspicious.push({
          type: 'recent_identical_sizes',
          size: size,
          files: files
        });
      }
    }
    
    return suspicious;
  }

  // Validate mapping integrity
  validateMapping() {
    const issues = [];
    
    // Check for missing image files
    for (const [key, imagePath] of Object.entries(this.mapping)) {
      const filename = imagePath.replace('/player-images/', '');
      const fullPath = path.join(imagesDir, filename);
      
      if (!fs.existsSync(fullPath)) {
        issues.push({
          type: 'missing_file',
          key: key,
          path: imagePath,
          filename: filename
        });
      }
    }
    
    // Check for orphaned image files (no mapping entry)
    const mappedFiles = Object.values(this.mapping).map(path => path.replace('/player-images/', ''));
    const actualFiles = fs.readdirSync(imagesDir).filter(file => file.endsWith('.jpg'));
    
    const orphanedFiles = actualFiles.filter(file => !mappedFiles.includes(file));
    
    for (const file of orphanedFiles) {
      issues.push({
        type: 'orphaned_file',
        filename: file,
        size: this.imageHashes.get(file)?.size || 0
      });
    }
    
    return issues;
  }

  // Generate validation report
  generateReport() {
    const duplicates = this.findDuplicates();
    const suspicious = this.findSuspiciousPatterns();
    const mappingIssues = this.validateMapping();
    
    return {
      summary: {
        totalImages: this.imageHashes.size,
        totalMappings: Object.keys(this.mapping).length,
        duplicateGroups: duplicates.length,
        suspiciousPatterns: suspicious.length,
        mappingIssues: mappingIssues.length
      },
      duplicates,
      suspicious,
      mappingIssues
    };
  }
}

// Main execution
console.log('🔍 IMAGE VALIDATION REPORT\n');

const validator = new ImageValidator();
const report = validator.generateReport();

// Print summary
console.log('📊 SUMMARY:');
console.log('─'.repeat(50));
console.log(`Total images: ${report.summary.totalImages}`);
console.log(`Total mappings: ${report.summary.totalMappings}`);
console.log(`Duplicate groups: ${report.summary.duplicateGroups}`);
console.log(`Suspicious patterns: ${report.summary.suspiciousPatterns}`);
console.log(`Mapping issues: ${report.summary.mappingIssues}`);

// Report duplicates
if (report.duplicates.length > 0) {
  console.log('\n🚨 DUPLICATE IMAGES FOUND:');
  console.log('─'.repeat(50));
  
  for (const group of report.duplicates) {
    console.log(`Hash: ${group[0].hash.substring(0, 12)}... (${group.length} files):`);
    for (const file of group) {
      console.log(`  - ${file.filename} (${file.size.toLocaleString()} bytes, ${file.modified.toLocaleDateString()})`);
    }
    console.log('');
  }
}

// Report suspicious patterns
if (report.suspicious.length > 0) {
  console.log('\n⚠️  SUSPICIOUS PATTERNS:');
  console.log('─'.repeat(50));
  
  for (const pattern of report.suspicious) {
    if (pattern.type === 'small_similar_sizes') {
      console.log(`Small files with similar sizes (${pattern.sizeRange}):`);
      for (const file of pattern.files) {
        console.log(`  - ${file.filename} (${file.size} bytes)`);
      }
    } else if (pattern.type === 'recent_identical_sizes') {
      console.log(`Recent files with identical size (${pattern.size.toLocaleString()} bytes):`);
      for (const file of pattern.files) {
        console.log(`  - ${file.filename} (${file.modified.toLocaleDateString()})`);
      }
    }
    console.log('');
  }
}

// Report mapping issues
if (report.mappingIssues.length > 0) {
  console.log('\n❌ MAPPING ISSUES:');
  console.log('─'.repeat(50));
  
  const missingFiles = report.mappingIssues.filter(issue => issue.type === 'missing_file');
  const orphanedFiles = report.mappingIssues.filter(issue => issue.type === 'orphaned_file');
  
  if (missingFiles.length > 0) {
    console.log(`Missing image files (${missingFiles.length}):`);
    for (const issue of missingFiles) {
      console.log(`  - ${issue.key} -> ${issue.filename} (FILE NOT FOUND)`);
    }
    console.log('');
  }
  
  if (orphanedFiles.length > 0) {
    console.log(`Orphaned image files (${orphanedFiles.length}):`);
    for (const issue of orphanedFiles) {
      console.log(`  - ${issue.filename} (${issue.size.toLocaleString()} bytes, NO MAPPING)`);
    }
    console.log('');
  }
}

// Health assessment
console.log('\n🏥 HEALTH ASSESSMENT:');
console.log('─'.repeat(50));

let healthScore = 100;
if (report.duplicates.length > 0) {
  healthScore -= report.duplicates.length * 10;
  console.log(`❌ Found ${report.duplicates.length} duplicate groups (-${report.duplicates.length * 10} points)`);
}

if (report.mappingIssues.length > 0) {
  const missingFiles = report.mappingIssues.filter(i => i.type === 'missing_file').length;
  if (missingFiles > 0) {
    healthScore -= missingFiles * 5;
    console.log(`❌ Found ${missingFiles} missing files (-${missingFiles * 5} points)`);
  }
}

if (report.suspicious.length > 0) {
  healthScore -= report.suspicious.length * 3;
  console.log(`⚠️  Found ${report.suspicious.length} suspicious patterns (-${report.suspicious.length * 3} points)`);
}

healthScore = Math.max(0, healthScore);

console.log(`\n🎯 Overall Health Score: ${healthScore}/100`);

if (healthScore >= 90) {
  console.log('🎉 Excellent! Image system is in great shape.');
} else if (healthScore >= 70) {
  console.log('✅ Good! Minor issues that should be addressed.');
} else if (healthScore >= 50) {
  console.log('⚠️  Fair! Several issues need attention.');
} else {
  console.log('🚨 Poor! Major issues require immediate attention.');
}

// Recommendations
console.log('\n💡 RECOMMENDATIONS:');
console.log('─'.repeat(50));

if (report.duplicates.length > 0) {
  console.log('• Remove duplicate images immediately');
}

if (report.mappingIssues.filter(i => i.type === 'missing_file').length > 0) {
  console.log('• Re-scrape or manually add missing image files');
}

if (report.mappingIssues.filter(i => i.type === 'orphaned_file').length > 0) {
  console.log('• Add mapping entries for orphaned files or remove unused images');
}

if (report.suspicious.length > 0) {
  console.log('• Review suspicious patterns for potential quality issues');
}

// Save report for future reference
const reportPath = path.join(__dirname, 'image-validation-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Full report saved: ${reportPath}`);