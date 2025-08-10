#!/usr/bin/env node

/**
 * Fix specific problematic players using the CSV database
 * Focus on the players we know are mismatched
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Specific problematic players to fix
const problematicPlayers = [
  { name: 'Jayden Daniels', team: 'WAS', position: 'QB' },
  { name: 'JaMarr Chase', team: 'CIN', position: 'WR' },
  { name: 'Ja\'Marr Chase', team: 'CIN', position: 'WR' }, // Alternative spelling
  { name: 'Justin Jefferson', team: 'MIN', position: 'WR' },
  { name: 'Amon-Ra St. Brown', team: 'DET', position: 'WR' },
  { name: 'A.J. Brown', team: 'PHI', position: 'WR' },
  { name: 'Davante Adams', team: 'LV', position: 'WR' },
  { name: 'Tyreek Hill', team: 'MIA', position: 'WR' },
  { name: 'Stefon Diggs', team: 'HOU', position: 'WR' },
  { name: 'Travis Etienne', team: 'JAX', position: 'RB' },
  { name: 'Josh Allen', team: 'BUF', position: 'QB' },
  { name: 'Lamar Jackson', team: 'BAL', position: 'QB' }
];

// Parse CSV manually (simple approach)
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  
  const players = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV parsing with potential commas in quoted fields
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
    values.push(current.trim()); // Last value
    
    if (values.length >= headers.length) {
      const player = {};
      headers.forEach((header, index) => {
        player[header.trim()] = values[index] ? values[index].replace(/"/g, '').trim() : '';
      });
      
      // Only include players with headshot URLs
      if (player.headshot_url && player.full_name) {
        players.push(player);
      }
    }
  }
  
  return players;
}

// Create player matcher
function findPlayerInCSV(fantasyPlayer, csvPlayers) {
  const searchName = fantasyPlayer.name.toLowerCase();
  const searchTeam = fantasyPlayer.team.toLowerCase();
  const searchPos = fantasyPlayer.position;
  
  // Try exact matches first
  for (const csvPlayer of csvPlayers) {
    const csvName = csvPlayer.full_name.toLowerCase();
    const csvTeam = csvPlayer.team.toLowerCase();
    const csvPos = csvPlayer.position;
    
    // Exact name match
    if (csvName === searchName && csvTeam === searchTeam && csvPos === searchPos) {
      return csvPlayer;
    }
    
    // Handle name variations
    const normalizedCsvName = csvName.replace(/['']/g, '').replace(/\./g, '').replace(/\s+/g, ' ');
    const normalizedSearchName = searchName.replace(/['']/g, '').replace(/\./g, '').replace(/\s+/g, ' ');
    
    if (normalizedCsvName === normalizedSearchName && csvTeam === searchTeam && csvPos === searchPos) {
      return csvPlayer;
    }
    
    // Handle common variations
    const variations = [
      csvPlayer.first_name + ' ' + csvPlayer.last_name,
      csvPlayer.football_name || csvPlayer.full_name
    ];
    
    for (const variation of variations) {
      if (variation && variation.toLowerCase() === searchName && csvTeam === searchTeam && csvPos === searchPos) {
        return csvPlayer;
      }
    }
  }
  
  return null;
}

// Download image with proper validation for large NFL images
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    if (!url || url === '') {
      reject(new Error('Empty URL'));
      return;
    }
    
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
          
          // More lenient validation for NFL images (they can be large)
          const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8;
          const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
          const isGIF = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
          
          const isValidImage = (isJPEG || isPNG || isGIF) && buffer.length > 1000 && buffer.length < 10000000; // Up to 10MB
          
          if (isValidImage) {
            fs.writeFileSync(outputPath, buffer);
            console.log(`  ✅ Success: ${filename} (${buffer.length.toLocaleString()} bytes)`);
            resolve({ success: true, size: buffer.length, filename, url });
          } else {
            reject(new Error(`Invalid image: ${buffer.length} bytes, headers: ${buffer.slice(0, 4).toString('hex')}`));
          }
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        console.log(`  🔄 Redirect: ${redirectUrl}`);
        downloadImage(redirectUrl, filename).then(resolve).catch(reject);
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

// Generate filename from player info
function generateFilename(player) {
  const cleanName = player.name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\./g, '')
    .replace(/[^a-z\s-]/g, '')
    .replace(/\s+/g, '-');
  
  const cleanTeam = player.team.toLowerCase();
  
  return `${cleanTeam}-${cleanName}.jpg`;
}

async function main() {
  console.log('🎯 FIXING SPECIFIC PROBLEMATIC PLAYERS');
  console.log('═'.repeat(60));
  
  try {
    // Parse CSV
    console.log('📊 Loading 2025 roster CSV...');
    const csvPath = '/Users/isaacvazquez/Downloads/roster_2025.csv';
    const csvPlayers = parseCSV(csvPath);
    console.log(`✅ Loaded ${csvPlayers.length} NFL players`);
    
    // Process each problematic player
    const results = {
      matched: [],
      notFound: [],
      downloaded: [],
      failed: []
    };
    
    for (const problematicPlayer of problematicPlayers) {
      console.log(`\n🔍 Processing ${problematicPlayer.name} (${problematicPlayer.team} ${problematicPlayer.position})`);
      
      const csvPlayer = findPlayerInCSV(problematicPlayer, csvPlayers);
      
      if (csvPlayer) {
        console.log(`  ✅ Found: ${csvPlayer.full_name} (ESPN ID: ${csvPlayer.espn_id})`);
        results.matched.push({ fantasy: problematicPlayer, csv: csvPlayer });
        
        // Download image
        const filename = generateFilename(problematicPlayer);
        
        try {
          const downloadResult = await downloadImage(csvPlayer.headshot_url, filename);
          results.downloaded.push({
            ...downloadResult,
            fantasyPlayer: problematicPlayer,
            csvPlayer,
            espnId: csvPlayer.espn_id
          });
        } catch (error) {
          console.log(`  ❌ Download failed: ${error.message}`);
          results.failed.push({
            fantasyPlayer: problematicPlayer,
            csvPlayer,
            error: error.message
          });
        }
        
        // Delay between downloads
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } else {
        console.log(`  ❌ Not found in CSV`);
        results.notFound.push(problematicPlayer);
      }
    }
    
    // Update mapping file for successful downloads
    if (results.downloaded.length > 0) {
      console.log('\n📝 Updating player-images.json...');
      const mappingPath = path.join(__dirname, '../src/data/player-images.json');
      let mapping = {};
      
      if (fs.existsSync(mappingPath)) {
        mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
      }
      
      // Add new mappings
      results.downloaded.forEach(result => {
        const key = generateFilename(result.fantasyPlayer).replace('.jpg', '');
        mapping[key] = `/player-images/${result.filename}`;
        console.log(`  Added mapping: ${key} → ${mapping[key]}`);
      });
      
      // Write updated mapping
      fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
      console.log(`✅ Updated mapping file with ${results.downloaded.length} new entries`);
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('═'.repeat(40));
    console.log(`✅ Players matched: ${results.matched.length}`);
    console.log(`❌ Players not found: ${results.notFound.length}`);
    console.log(`📥 Images downloaded: ${results.downloaded.length}`);
    console.log(`💥 Download failures: ${results.failed.length}`);
    
    if (results.downloaded.length > 0) {
      console.log('\n🎉 Successfully Fixed:');
      results.downloaded.forEach(r => {
        console.log(`  • ${r.fantasyPlayer.name}: ${r.filename} (${r.size.toLocaleString()} bytes)`);
      });
    }
    
    if (results.notFound.length > 0) {
      console.log('\n⚠️ Not Found in CSV:');
      results.notFound.forEach(p => {
        console.log(`  • ${p.name} (${p.team} ${p.position})`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n💥 Download Failures:');
      results.failed.forEach(f => {
        console.log(`  • ${f.fantasyPlayer.name}: ${f.error}`);
      });
    }
    
    console.log('\n🎯 VERIFICATION NEEDED:');
    console.log('Please check the draft tiers page and verify:');
    results.downloaded.forEach(r => {
      console.log(`• ${r.fantasyPlayer.name} now shows correct player photo`);
    });
    
    console.log('\n📝 Next Steps:');
    console.log('1. Refresh the draft tiers page (clear cache if needed)');
    console.log('2. Visually verify each player shows their correct image');
    console.log('3. Report any remaining mismatches');
    
  } catch (error) {
    console.error('\n💥 SCRIPT FAILED:', error);
    console.log('Check CSV file path and network connectivity');
  }
}

main().catch(console.error);