#!/usr/bin/env node

/**
 * Build comprehensive player image database from 2025 roster CSV
 * This will create reliable ESPN ID and headshot URL mappings
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

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
      
      // Only include players with headshot URLs and fantasy-relevant positions
      if (player.headshot_url && ['QB', 'RB', 'WR', 'TE', 'K'].includes(player.position)) {
        players.push(player);
      }
    }
  }
  
  return players;
}

// Extract top fantasy players from our sample data
function extractTopFantasyPlayers() {
  const sampleDataPath = path.join(__dirname, '../src/data/sampleData.ts');
  const content = fs.readFileSync(sampleDataPath, 'utf-8');
  
  const players = [];
  
  // Extract player objects using regex (simplified approach)
  const playerMatches = content.match(/{\s*"id"[^}]+}/g) || [];
  
  playerMatches.forEach(match => {
    try {
      const playerStr = match.replace(/(\w+):/g, '"$1":'); // Fix unquoted keys
      const player = JSON.parse(playerStr);
      
      // Only include players in tiers 1-5
      if (player.tier && player.tier <= 5) {
        players.push({
          name: player.name,
          team: player.team,
          position: player.position,
          tier: player.tier,
          averageRank: parseFloat(player.averageRank)
        });
      }
    } catch (error) {
      // Skip malformed entries
    }
  });
  
  return players.sort((a, b) => a.averageRank - b.averageRank);
}

// Create name matching algorithm
function createPlayerMatcher(csvPlayers) {
  // Create lookup maps for efficient searching
  const exactMatches = new Map();
  const nameVariations = new Map();
  
  csvPlayers.forEach(player => {
    const key = `${player.full_name.toLowerCase()}-${player.team.toLowerCase()}-${player.position}`;
    exactMatches.set(key, player);
    
    // Create name variations
    const variations = [
      player.full_name,
      player.first_name + ' ' + player.last_name,
      player.football_name || player.full_name
    ];
    
    variations.forEach(variation => {
      if (variation) {
        const varKey = `${variation.toLowerCase()}-${player.team.toLowerCase()}-${player.position}`;
        nameVariations.set(varKey, player);
      }
    });
  });
  
  function findPlayer(fantasyPlayer) {
    const searchName = fantasyPlayer.name.toLowerCase();
    const searchTeam = fantasyPlayer.team.toLowerCase();
    const searchPos = fantasyPlayer.position;
    
    // Try exact match first
    const exactKey = `${searchName}-${searchTeam}-${searchPos}`;
    if (exactMatches.has(exactKey)) {
      return exactMatches.get(exactKey);
    }
    
    // Try name variations
    const varKey = `${searchName}-${searchTeam}-${searchPos}`;
    if (nameVariations.has(varKey)) {
      return nameVariations.get(varKey);
    }
    
    // Try fuzzy matching (handle common variations)
    for (const [key, player] of nameVariations.entries()) {
      const [name, team, pos] = key.split('-');
      
      if (pos === searchPos && team === searchTeam) {
        // Handle name variations like "Ja'Marr" vs "JaMarr"
        const normalizedCsvName = name.replace(/['']/g, '').replace(/\./g, '').replace(/\s+/g, ' ');
        const normalizedSearchName = searchName.replace(/['']/g, '').replace(/\./g, '').replace(/\s+/g, ' ');
        
        if (normalizedCsvName === normalizedSearchName) {
          return player;
        }
        
        // Try last name matching for unique cases
        const searchLastName = searchName.split(' ').pop();
        const csvLastName = name.split(' ').pop();
        
        if (searchLastName === csvLastName && searchName.includes(name.split(' ')[0])) {
          return player;
        }
      }
    }
    
    return null;
  }
  
  return findPlayer;
}

// Download image from URL
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    if (!url || url === '') {
      reject(new Error('Empty URL'));
      return;
    }
    
    const outputPath = path.join(__dirname, '../public/player-images', filename);
    
    console.log(`  📥 Downloading: ${filename} from ${url.substring(0, 60)}...`);
    
    const request = https.get(url, { 
      timeout: 20000,
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
          
          // Validate image
          const isValidImage = buffer.length > 5000 && buffer.length < 2000000 && 
                              (buffer[0] === 0x89 || buffer[0] === 0xFF || buffer[0] === 0x47);
          
          if (isValidImage) {
            fs.writeFileSync(outputPath, buffer);
            console.log(`  ✅ Success: ${filename} (${buffer.length.toLocaleString()} bytes)`);
            resolve({ success: true, size: buffer.length, filename, url });
          } else {
            reject(new Error(`Invalid image: ${buffer.length} bytes`));
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
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, '-');
  
  const cleanTeam = player.team.toLowerCase();
  
  return `${cleanTeam}-${cleanName}.jpg`;
}

async function main() {
  console.log('🚀 BUILDING COMPREHENSIVE PLAYER IMAGE DATABASE');
  console.log('═'.repeat(70));
  
  try {
    // Step 1: Parse CSV
    console.log('📊 Parsing 2025 roster CSV...');
    const csvPath = '/Users/isaacvazquez/Downloads/roster_2025.csv';
    const csvPlayers = parseCSV(csvPath);
    console.log(`✅ Loaded ${csvPlayers.length} NFL players with headshots`);
    
    // Step 2: Extract fantasy players
    console.log('\n🏈 Extracting top fantasy players (tiers 1-5)...');
    const fantasyPlayers = extractTopFantasyPlayers();
    console.log(`✅ Found ${fantasyPlayers.length} top-tier fantasy players`);
    
    // Step 3: Create matcher
    console.log('\n🔍 Creating player matching system...');
    const findPlayer = createPlayerMatcher(csvPlayers);
    
    // Step 4: Match and download
    console.log('\n📥 Matching players and downloading images...');
    
    const results = {
      matched: [],
      notFound: [],
      downloaded: [],
      failed: []
    };
    
    for (const fantasyPlayer of fantasyPlayers) {
      console.log(`\n🔍 Processing ${fantasyPlayer.name} (${fantasyPlayer.team} ${fantasyPlayer.position})`);
      
      const csvPlayer = findPlayer(fantasyPlayer);
      
      if (csvPlayer) {
        console.log(`  ✅ Matched to: ${csvPlayer.full_name} (ESPN ID: ${csvPlayer.espn_id})`);
        results.matched.push({
          fantasy: fantasyPlayer,
          csv: csvPlayer
        });
        
        // Download image
        const filename = generateFilename(fantasyPlayer);
        
        try {
          const downloadResult = await downloadImage(csvPlayer.headshot_url, filename);
          results.downloaded.push({
            ...downloadResult,
            fantasyPlayer,
            csvPlayer,
            espnId: csvPlayer.espn_id
          });
        } catch (error) {
          console.log(`  ❌ Download failed: ${error.message}`);
          results.failed.push({
            fantasyPlayer,
            csvPlayer,
            error: error.message
          });
        }
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } else {
        console.log(`  ❌ No match found`);
        results.notFound.push(fantasyPlayer);
      }
    }
    
    // Step 5: Update mapping file
    console.log('\n📝 Updating player-images.json mapping file...');
    const mappingPath = path.join(__dirname, '../src/data/player-images.json');
    let mapping = {};
    
    if (fs.existsSync(mappingPath)) {
      mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    }
    
    // Add new mappings
    results.downloaded.forEach(result => {
      const key = generateFilename(result.fantasyPlayer).replace('.jpg', '');
      mapping[key] = `/player-images/${result.filename}`;
    });
    
    // Write updated mapping
    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
    console.log(`✅ Updated mapping file with ${results.downloaded.length} new entries`);
    
    // Step 6: Create ESPN ID reference file
    console.log('\n📋 Creating ESPN ID reference file...');
    const espnMappingPath = path.join(__dirname, '../src/data/espn-player-mappings.json');
    const espnMapping = {};
    
    results.matched.forEach(result => {
      espnMapping[result.fantasy.name] = {
        espnId: result.csv.espn_id,
        fullName: result.csv.full_name,
        team: result.csv.team,
        position: result.csv.position,
        headshotUrl: result.csv.headshot_url,
        tier: result.fantasy.tier,
        averageRank: result.fantasy.averageRank
      };
    });
    
    fs.writeFileSync(espnMappingPath, JSON.stringify(espnMapping, null, 2));
    console.log(`✅ Created ESPN mapping reference with ${Object.keys(espnMapping).length} players`);
    
    // Summary
    console.log('\n📊 FINAL SUMMARY:');
    console.log('═'.repeat(50));
    console.log(`✅ Players matched: ${results.matched.length}`);
    console.log(`❌ Players not found: ${results.notFound.length}`);
    console.log(`📥 Images downloaded: ${results.downloaded.length}`);
    console.log(`💥 Download failures: ${results.failed.length}`);
    
    if (results.downloaded.length > 0) {
      console.log('\n🎉 Successfully Downloaded:');
      results.downloaded.forEach(r => {
        console.log(`  • ${r.fantasyPlayer.name}: ${r.filename} (${r.size.toLocaleString()} bytes)`);
      });
    }
    
    if (results.notFound.length > 0) {
      console.log('\n⚠️ Not Found (may need manual verification):');
      results.notFound.forEach(p => {
        console.log(`  • ${p.name} (${p.team} ${p.position}) - Tier ${p.tier}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n💥 Download Failures:');
      results.failed.forEach(f => {
        console.log(`  • ${f.fantasyPlayer.name}: ${f.error}`);
      });
    }
    
    console.log('\n🎯 EXPECTED RESULTS:');
    console.log('The following problematic players should now show correctly:');
    console.log('• Jayden Daniels → Should show actual Jayden Daniels');
    console.log('• JaMarr Chase → Should show actual JaMarr Chase');
    console.log('• Justin Jefferson → Should show actual Justin Jefferson');
    console.log('• A.J. Brown → Should show actual A.J. Brown');
    console.log('• All other top-tier players → Should show correct images');
    
    console.log('\n📝 Next Steps:');
    console.log('1. Test the draft tiers page');
    console.log('2. Verify problematic players now show correctly'); 
    console.log('3. Clear browser cache if needed');
    console.log('4. Run validation script to confirm all fixes');
    
  } catch (error) {
    console.error('\n💥 SCRIPT FAILED:', error);
    console.log('\nTroubleshooting:');
    console.log('• Check that the CSV file exists and is readable');
    console.log('• Verify network connectivity for image downloads');
    console.log('• Ensure public/player-images directory exists');
  }
}

main().catch(console.error);