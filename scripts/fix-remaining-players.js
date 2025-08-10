#!/usr/bin/env node

/**
 * Fix the remaining two players with correct team info
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Corrected player info based on CSV findings
const remainingPlayers = [
  { name: 'Davante Adams', team: 'LA', position: 'WR', originalTeam: 'LV' }, // Was looking for LV, actually LA
  { name: 'Stefon Diggs', team: 'NE', position: 'WR', originalTeam: 'HOU' }   // Was looking for HOU, actually NE
];

// Parse CSV manually
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  
  const players = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length >= headers.length) {
      const player = {};
      headers.forEach((header, index) => {
        player[header.trim()] = values[index] ? values[index].replace(/"/g, '').trim() : '';
      });
      
      if (player.headshot_url && player.full_name) {
        players.push(player);
      }
    }
  }
  
  return players;
}

// Find player in CSV
function findPlayerInCSV(fantasyPlayer, csvPlayers) {
  const searchName = fantasyPlayer.name.toLowerCase();
  const searchTeam = fantasyPlayer.team.toLowerCase();
  const searchPos = fantasyPlayer.position;
  
  for (const csvPlayer of csvPlayers) {
    const csvName = csvPlayer.full_name.toLowerCase();
    const csvTeam = csvPlayer.team.toLowerCase();
    const csvPos = csvPlayer.position;
    
    if (csvName === searchName && csvTeam === searchTeam && csvPos === searchPos) {
      return csvPlayer;
    }
  }
  
  return null;
}

// Download image
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, '../public/player-images', filename);
    
    console.log(`  📥 Downloading: ${filename}`);
    console.log(`      Source: ${url}`);
    
    const request = https.get(url, { 
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8;
          const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
          const isGIF = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
          
          const isValidImage = (isJPEG || isPNG || isGIF) && buffer.length > 1000 && buffer.length < 10000000;
          
          if (isValidImage) {
            fs.writeFileSync(outputPath, buffer);
            console.log(`  ✅ Success: ${filename} (${buffer.length.toLocaleString()} bytes)`);
            resolve({ success: true, size: buffer.length, filename, url });
          } else {
            reject(new Error(`Invalid image: ${buffer.length} bytes`));
          }
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    request.on('error', reject);
  });
}

// Generate filename using original team for consistency
function generateFilename(player) {
  const cleanName = player.name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\./g, '')
    .replace(/[^a-z\s-]/g, '')
    .replace(/\s+/g, '-');
  
  // Use original team from fantasy data for filename consistency
  const cleanTeam = player.originalTeam.toLowerCase();
  
  return `${cleanTeam}-${cleanName}.jpg`;
}

async function main() {
  console.log('🔧 FIXING REMAINING PLAYERS WITH CORRECT TEAMS');
  console.log('═'.repeat(55));
  
  try {
    const csvPath = '/Users/isaacvazquez/Downloads/roster_2025.csv';
    const csvPlayers = parseCSV(csvPath);
    console.log(`✅ Loaded ${csvPlayers.length} NFL players`);
    
    const results = {
      downloaded: [],
      failed: []
    };
    
    for (const player of remainingPlayers) {
      console.log(`\n🔍 Processing ${player.name}`);
      console.log(`    Looking for: ${player.team} ${player.position} (was searching ${player.originalTeam})`);
      
      const csvPlayer = findPlayerInCSV(player, csvPlayers);
      
      if (csvPlayer) {
        console.log(`  ✅ Found: ${csvPlayer.full_name} (ESPN ID: ${csvPlayer.espn_id})`);
        
        const filename = generateFilename(player);
        
        try {
          const downloadResult = await downloadImage(csvPlayer.headshot_url, filename);
          results.downloaded.push({
            ...downloadResult,
            fantasyPlayer: player,
            csvPlayer,
            espnId: csvPlayer.espn_id
          });
        } catch (error) {
          console.log(`  ❌ Download failed: ${error.message}`);
          results.failed.push({ fantasyPlayer: player, csvPlayer, error: error.message });
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } else {
        console.log(`  ❌ Still not found`);
        results.failed.push({ fantasyPlayer: player, error: 'Not found in CSV' });
      }
    }
    
    // Update mapping file
    if (results.downloaded.length > 0) {
      console.log('\n📝 Updating player-images.json...');
      const mappingPath = path.join(__dirname, '../src/data/player-images.json');
      let mapping = {};
      
      if (fs.existsSync(mappingPath)) {
        mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
      }
      
      results.downloaded.forEach(result => {
        const key = generateFilename(result.fantasyPlayer).replace('.jpg', '');
        mapping[key] = `/player-images/${result.filename}`;
        console.log(`  Added mapping: ${key} → ${mapping[key]}`);
      });
      
      fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
      console.log(`✅ Updated mapping file with ${results.downloaded.length} new entries`);
    }
    
    console.log('\n📊 FINAL RESULTS:');
    console.log('═'.repeat(30));
    console.log(`✅ Successfully downloaded: ${results.downloaded.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.downloaded.length > 0) {
      console.log('\n🎉 Successfully Fixed:');
      results.downloaded.forEach(r => {
        console.log(`  • ${r.fantasyPlayer.name}: ${r.filename} (${r.size.toLocaleString()} bytes)`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n💥 Still Failed:');
      results.failed.forEach(f => {
        console.log(`  • ${f.fantasyPlayer.name}: ${f.error}`);
      });
    }
    
    console.log('\n🎯 ALL PROBLEMATIC PLAYERS SHOULD NOW BE FIXED!');
    console.log('Please test the draft tiers page and verify all images show correctly.');
    
  } catch (error) {
    console.error('\n💥 SCRIPT FAILED:', error);
  }
}

main().catch(console.error);