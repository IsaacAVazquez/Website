#!/usr/bin/env node

/**
 * Download Player Images and Create Comprehensive Mapping
 * 
 * This script:
 * 1. Loads matching results from advanced-player-matcher.js
 * 2. Downloads missing images from NFL headshot URLs
 * 3. Creates comprehensive fantasy-player-mappings.json
 * 4. Updates player-images.json with new mappings
 * 5. Validates all downloads and mappings
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Download image from URL with proper error handling
async function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    if (!url || typeof url !== 'string') {
      reject(new Error('Invalid URL provided'));
      return;
    }
    
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadImage(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const writeStream = fs.createWriteStream(outputPath);
      response.pipe(writeStream);
      
      writeStream.on('finish', () => {
        writeStream.close();
        
        // Validate the downloaded file
        try {
          const stats = fs.statSync(outputPath);
          if (stats.size < 1000) { // Less than 1KB is probably an error page
            fs.unlinkSync(outputPath);
            reject(new Error('Downloaded file too small (likely error page)'));
          } else {
            resolve({
              success: true,
              size: stats.size,
              path: outputPath
            });
          }
        } catch (error) {
          reject(new Error(`Failed to validate downloaded file: ${error.message}`));
        }
      });
      
      writeStream.on('error', (error) => {
        fs.unlinkSync(outputPath).catch(() => {}); // Clean up on error
        reject(error);
      });
    });
    
    request.on('error', (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });
    
    // Timeout after 30 seconds
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

// Generate consistent filename from player data
function generateFilename(nflPlayer) {
  const cleanName = nflPlayer.fullName
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\./g, '')
    .replace(/[^a-z\\s-]/g, '')
    .replace(/\\s+/g, '-');
  
  const cleanTeam = nflPlayer.team.toLowerCase();
  return `${cleanTeam}-${cleanName}.jpg`;
}

// Generate mapping key for player-images.json
function generateMappingKey(fantasyPlayer, nflPlayer) {
  const cleanName = fantasyPlayer.name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\\./g, '')
    .replace(/[^a-z\\s-]/g, '')
    .replace(/\\s+/g, '-');
  
  const cleanTeam = fantasyPlayer.team.toLowerCase();
  return `${cleanName}-${cleanTeam}`;
}

// Create comprehensive player mapping entry
function createPlayerMapping(matchResult) {
  const fp = matchResult.fantasyPlayer;
  const nfl = matchResult.match.nflPlayer;
  
  return {
    // Fantasy player info
    fantasyId: fp.id,
    fantasyName: fp.name,
    fantasyTeam: fp.team,
    position: fp.position,
    
    // NFL player info
    nflId: nfl.id,
    nflName: nfl.fullName,
    nflTeam: nfl.team,
    espnId: nfl.espnId,
    
    // Matching info
    matchType: matchResult.match.matchType,
    confidence: matchResult.match.confidence,
    
    // Image info
    headshotUrl: nfl.headshotUrl,
    localImagePath: null, // Will be set after download
    mappingKey: generateMappingKey(fp, nfl),
    filename: generateFilename(nfl),
    
    // Metadata
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
}

async function main() {
  console.log('🚀 DOWNLOADING PLAYER IMAGES & CREATING COMPREHENSIVE MAPPING');
  console.log('═'.repeat(80));
  
  try {
    // Load matching results
    const resultsPath = path.join(__dirname, '../src/data/player-matching-results.json');
    if (!fs.existsSync(resultsPath)) {
      throw new Error('Matching results not found. Run advanced-player-matcher.js first.');
    }
    
    const matchingResults = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    console.log(`✅ Loaded matching results: ${matchingResults.matched.length} matched players`);
    
    // Create comprehensive mappings
    console.log('\\n📋 Creating comprehensive player mappings...');
    const comprehensiveMappings = matchingResults.matched.map(createPlayerMapping);
    
    // Filter players that have headshot URLs and need downloads
    const playersNeedingDownload = comprehensiveMappings.filter(mapping => 
      mapping.headshotUrl && 
      mapping.headshotUrl.trim() !== '' &&
      mapping.headshotUrl !== 'null'
    );
    
    console.log(`🔍 Found ${playersNeedingDownload.length} players with headshot URLs`);
    
    // Check which images already exist
    const imageDir = path.join(__dirname, '../public/player-images');
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }
    
    const existingImages = new Set();
    if (fs.existsSync(imageDir)) {
      fs.readdirSync(imageDir).forEach(file => {
        if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
          existingImages.add(file);
        }
      });
    }
    
    console.log(`📁 Found ${existingImages.size} existing images`);
    
    // Download missing images
    const downloadResults = {
      success: [],
      failed: [],
      skipped: []
    };
    
    console.log('\\n⬇️ Starting image downloads...');
    console.log('─'.repeat(50));
    
    for (let i = 0; i < playersNeedingDownload.length; i++) {
      const mapping = playersNeedingDownload[i];
      const filename = mapping.filename;
      const outputPath = path.join(imageDir, filename);
      
      // Skip if image already exists
      if (existingImages.has(filename)) {
        mapping.localImagePath = `/player-images/${filename}`;
        downloadResults.skipped.push(mapping);
        
        if ((i + 1) % 50 === 0) {
          console.log(`📊 Progress: ${i + 1}/${playersNeedingDownload.length} processed (${downloadResults.success.length} downloaded, ${downloadResults.skipped.length} skipped, ${downloadResults.failed.length} failed)`);
        }
        continue;
      }
      
      try {
        console.log(`⬇️ Downloading: ${mapping.fantasyName} (${mapping.fantasyTeam}) -> ${filename}`);
        
        const result = await downloadImage(mapping.headshotUrl, outputPath);
        
        mapping.localImagePath = `/player-images/${filename}`;
        mapping.downloadedAt = new Date().toISOString();
        mapping.fileSize = result.size;
        
        downloadResults.success.push(mapping);
        
        console.log(`  ✅ Success: ${result.size.toLocaleString()} bytes`);
        
        // Add small delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
        
        mapping.downloadError = error.message;
        mapping.downloadAttemptedAt = new Date().toISOString();
        
        downloadResults.failed.push(mapping);
      }
      
      // Progress indicator
      if ((i + 1) % 50 === 0) {
        console.log(`\\n📊 Progress: ${i + 1}/${playersNeedingDownload.length} processed`);
        console.log(`  ✅ Downloaded: ${downloadResults.success.length}`);
        console.log(`  ⏭️ Skipped: ${downloadResults.skipped.length}`);
        console.log(`  ❌ Failed: ${downloadResults.failed.length}`);
        console.log('');
      }
    }
    
    // Create comprehensive mapping file
    console.log('\\n💾 Saving comprehensive mapping file...');
    const comprehensiveMapping = {
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        totalPlayers: comprehensiveMappings.length,
        playersWithImages: downloadResults.success.length + downloadResults.skipped.length,
        downloadedImages: downloadResults.success.length,
        skippedImages: downloadResults.skipped.length,
        failedImages: downloadResults.failed.length,
        sourceDatabase: 'NFL 2025 Roster CSV',
        fantasySource: 'FantasyPros sampleData.ts'
      },
      players: comprehensiveMappings,
      downloadResults: downloadResults
    };
    
    const comprehensiveOutputPath = path.join(__dirname, '../src/data/fantasy-player-mappings.json');
    fs.writeFileSync(comprehensiveOutputPath, JSON.stringify(comprehensiveMapping, null, 2));
    console.log(`✅ Saved comprehensive mapping: ${comprehensiveOutputPath}`);
    
    // Update player-images.json with new mappings
    console.log('\\n🔄 Updating player-images.json...');
    const existingMappingPath = path.join(__dirname, '../src/data/player-images.json');
    let existingMapping = {};
    
    if (fs.existsSync(existingMappingPath)) {
      existingMapping = JSON.parse(fs.readFileSync(existingMappingPath, 'utf-8'));
    }
    
    // Add new mappings
    let newMappingsCount = 0;
    comprehensiveMappings.forEach(mapping => {
      if (mapping.localImagePath) {
        const key = mapping.mappingKey;
        if (!existingMapping[key]) {
          existingMapping[key] = mapping.localImagePath;
          newMappingsCount++;
        }
      }
    });
    
    // Save updated mapping
    fs.writeFileSync(existingMappingPath, JSON.stringify(existingMapping, null, 2));
    console.log(`✅ Updated player-images.json with ${newMappingsCount} new mappings`);
    console.log(`📊 Total mappings: ${Object.keys(existingMapping).length}`);
    
    // Final summary
    console.log('\\n📊 FINAL SUMMARY:');
    console.log('═'.repeat(50));
    console.log(`✅ Total fantasy players processed: ${comprehensiveMappings.length}`);
    console.log(`✅ Players with NFL headshot URLs: ${playersNeedingDownload.length}`);
    console.log(`✅ Images successfully downloaded: ${downloadResults.success.length}`);
    console.log(`⏭️ Images already existed: ${downloadResults.skipped.length}`);
    console.log(`❌ Download failures: ${downloadResults.failed.length}`);
    
    const totalWithImages = downloadResults.success.length + downloadResults.skipped.length;
    const imagesCoverage = (totalWithImages / comprehensiveMappings.length * 100).toFixed(1);
    console.log(`📈 Images coverage: ${imagesCoverage}% (${totalWithImages}/${comprehensiveMappings.length})`);
    
    if (downloadResults.failed.length > 0) {
      console.log('\\n❌ FAILED DOWNLOADS (first 10):');
      downloadResults.failed.slice(0, 10).forEach(mapping => {
        console.log(`  • ${mapping.fantasyName} (${mapping.fantasyTeam}): ${mapping.downloadError}`);
      });
    }
    
    // Calculate total download size
    const totalSize = downloadResults.success.reduce((sum, mapping) => sum + (mapping.fileSize || 0), 0);
    console.log(`💾 Total downloaded: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\\n✨ Image download and mapping creation completed!');
    
    return {
      success: true,
      downloadResults,
      comprehensiveMapping,
      newMappingsCount
    };
    
  } catch (error) {
    console.error('\\n💥 PROCESS FAILED:', error.message);
    console.log('\\nTroubleshooting:');
    console.log('• Ensure matching results exist (run advanced-player-matcher.js)');
    console.log('• Check network connectivity for downloads');
    console.log('• Verify write permissions for image directory');
    console.log('• Check disk space for image downloads');
    process.exit(1);
  }
}

main().catch(console.error);