#!/usr/bin/env node

/**
 * Create Master Player Database from 2025 Roster CSV
 * 
 * This script processes the CSV into a structured JSON database that includes:
 * - All player information with multiple name variations
 * - Searchable index for fast lookups
 * - Metadata for maintenance and updates
 * - Confidence scoring for matches
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Parse CSV with proper handling of quoted fields
function parseCSV(filePath) {
  console.log('📊 Parsing CSV file...');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
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
    
    if (values.length >= headers.length - 5) { // Allow some missing trailing fields
      const player = {};
      headers.forEach((header, index) => {
        const value = values[index] ? values[index].replace(/"/g, '').trim() : '';
        player[header] = value;
      });
      
      // Debug first few players
      if (players.length < 3) {
        console.log(`🔍 DEBUG CSV Row ${i}: headers=${headers.length}, values=${values.length}`);
        console.log(`   full_name: "${player.full_name}"`);
        console.log(`   team: "${player.team}"`);
        console.log(`   position: "${player.position}"`);
        console.log(`   Values sample:`, values.slice(0, 10));
      }
      
      // Only include players with key data and positions we care about
      if (player.full_name && player.team && player.position && 
          ['QB', 'RB', 'WR', 'TE', 'K', 'DST'].includes(player.position)) {
        players.push(player);
      }
    }
  }
  
  console.log(`✅ Parsed ${players.length} relevant NFL players`);
  return players;
}

// Generate all possible name variations for matching
function generateNameVariations(player) {
  const variations = new Set();
  
  // Base names (handle both raw CSV data and enhanced data structures)
  const fullName = player.fullName || player.full_name || '';
  const firstName = player.firstName || player.first_name || '';
  const lastName = player.lastName || player.last_name || '';
  const footballName = player.footballName || player.football_name || fullName;
  
  // Add all base variations
  if (fullName) variations.add(fullName);
  if (footballName && footballName !== fullName) variations.add(footballName);
  if (firstName && lastName) variations.add(`${firstName} ${lastName}`);
  
  // Create normalized versions (handle common issues)
  const baseNames = Array.from(variations);
  
  baseNames.forEach(name => {
    if (!name) return;
    
    // Original
    variations.add(name);
    
    // Remove apostrophes: "Ja'Marr" -> "JaMarr"
    variations.add(name.replace(/'/g, ''));
    
    // Remove periods: "A.J." -> "AJ" 
    variations.add(name.replace(/\./g, ''));
    
    // Remove both: "D'Andre" -> "DAndre"
    variations.add(name.replace(/['.]/g, ''));
    
    // Handle Jr/Sr variations
    variations.add(name.replace(/\s+(Jr\.?|Sr\.?|III?|IV)$/i, ''));
    
    // Handle hyphenated names: "Amon-Ra" -> "Amon Ra"
    variations.add(name.replace(/-/g, ' '));
    
    // Remove middle initials: "David K. Johnson" -> "David Johnson"
    variations.add(name.replace(/\s+[A-Z]\.\s+/g, ' '));
    
    // Nickname handling for common cases
    const nicknameMap = {
      'Christopher': 'Chris',
      'Jonathan': 'Jon',
      'Anthony': 'Tony',
      'Michael': 'Mike',
      'Matthew': 'Matt',
      'Alexander': 'Alex',
      'Benjamin': 'Ben',
      'William': 'Will',
      'Robert': 'Rob'
    };
    
    Object.entries(nicknameMap).forEach(([full, nick]) => {
      if (name.includes(full)) {
        variations.add(name.replace(full, nick));
      }
      if (name.includes(nick)) {
        variations.add(name.replace(nick, full));
      }
    });
  });
  
  // Convert to sorted array and remove empty strings
  return Array.from(variations)
    .filter(name => name && name.trim().length > 0)
    .map(name => name.trim())
    .sort();
}

// Create searchable index for fast lookups
function createSearchIndex(players) {
  console.log('🔍 Building search index...');
  
  const index = {
    byName: new Map(),
    byTeamPosition: new Map(),
    byESPNId: new Map(),
    byLastName: new Map()
  };
  
  players.forEach((player, playerIndex) => {
    const espnId = player.espnId || player.espn_id;
    const team = (player.team || '').toLowerCase();
    const position = player.position;
    const lastName = (player.lastName || player.last_name || '').toLowerCase();
    
    // Debug first few players
    if (playerIndex < 3) {
      console.log(`🔍 DEBUG Player ${playerIndex}: ${player.fullName || player.full_name} (${player.team})`);
    }
    
    // Index by ESPN ID
    if (espnId) {
      index.byESPNId.set(espnId, playerIndex);
    }
    
    // Index by team + position
    const teamPosKey = `${team}-${position}`;
    if (!index.byTeamPosition.has(teamPosKey)) {
      index.byTeamPosition.set(teamPosKey, []);
    }
    index.byTeamPosition.get(teamPosKey).push(playerIndex);
    
    // Index by last name
    if (lastName) {
      if (!index.byLastName.has(lastName)) {
        index.byLastName.set(lastName, []);
      }
      index.byLastName.get(lastName).push(playerIndex);
    }
    
    // Index by all name variations
    const nameVariations = generateNameVariations(player);
    
    // Debug first few players' name variations
    if (playerIndex < 3) {
      console.log(`   Name variations (${nameVariations.length}):`, nameVariations.slice(0, 5));
    }
    
    nameVariations.forEach(nameVar => {
      const normalizedName = nameVar.toLowerCase();
      
      // Create compound keys for precise matching
      const nameTeamKey = `${normalizedName}-${team}`;
      const nameTeamPosKey = `${normalizedName}-${team}-${position}`;
      
      if (!index.byName.has(nameTeamPosKey)) {
        index.byName.set(nameTeamPosKey, []);
      }
      index.byName.get(nameTeamPosKey).push(playerIndex);
      
      if (!index.byName.has(nameTeamKey)) {
        index.byName.set(nameTeamKey, []);
      }
      index.byName.get(nameTeamKey).push(playerIndex);
      
      // Also index by name only (for fallback matching)
      if (!index.byName.has(normalizedName)) {
        index.byName.set(normalizedName, []);
      }
      index.byName.get(normalizedName).push(playerIndex);
    });
  });
  
  // Convert Maps to Objects for JSON serialization
  const serializedIndex = {
    byName: Object.fromEntries(Array.from(index.byName.entries())),
    byTeamPosition: Object.fromEntries(Array.from(index.byTeamPosition.entries())),
    byESPNId: Object.fromEntries(Array.from(index.byESPNId.entries())),
    byLastName: Object.fromEntries(Array.from(index.byLastName.entries()))
  };
  
  console.log(`✅ Created search index with ${index.byName.size} name entries`);
  return serializedIndex;
}

// Create enhanced player records with metadata
function enhancePlayerData(players) {
  console.log('⚡ Enhancing player data...');
  
  return players.map((player, index) => {
    // Debug first few players
    if (index < 3) {
      console.log(`🔍 DEBUG enhancePlayerData ${index}: full_name="${player.full_name}", team="${player.team}"`);  
      console.log(`   Player keys:`, Object.keys(player).slice(0, 10));
    }
    
    const nameVariations = generateNameVariations(player);
    
    return {
      // Core identifiers
      id: `nfl-${player.team}-${player.position}-${index}`,
      espnId: player.espn_id || null,
      gsis_id: player.gsis_id || null,
      
      // Names
      fullName: player.full_name,
      firstName: player.first_name,
      lastName: player.last_name,
      footballName: player.football_name || player.full_name,
      nameVariations: nameVariations,
      
      // Team and position
      team: player.team,
      position: player.position,
      depthChartPosition: player.depth_chart_position,
      jerseyNumber: player.jersey_number,
      status: player.status,
      
      // Physical attributes
      height: player.height,
      weight: player.weight,
      college: player.college,
      yearsExp: parseInt(player.years_exp) || 0,
      
      // Image and media
      headshotUrl: player.headshot_url,
      
      // External IDs for cross-referencing
      externalIds: {
        espn: player.espn_id,
        yahoo: player.yahoo_id,
        rotowire: player.rotowire_id,
        pff: player.pff_id,
        pfr: player.pfr_id,
        sleeper: player.sleeper_id,
        fantasyData: player.fantasy_data_id,
        sportradar: player.sportradar_id
      },
      
      // Metadata
      season: player.season,
      entryYear: player.entry_year,
      rookieYear: player.rookie_year,
      draftClub: player.draft_club,
      draftNumber: player.draft_number,
      
      // Search optimization
      searchKey: `${player.full_name}-${player.team}-${player.position}`.toLowerCase(),
      lastUpdated: new Date().toISOString()
    };
  });
}

// Generate database metadata
function generateMetadata(players, csvPath) {
  const csvStats = fs.statSync(csvPath);
  
  // Calculate checksums for change detection
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const checksum = crypto.createHash('sha256').update(csvContent).digest('hex');
  
  // Analyze data composition
  const positionCounts = {};
  const teamCounts = {};
  let playersWithImages = 0;
  
  players.forEach(player => {
    positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
    teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;
    if (player.headshotUrl) playersWithImages++;
  });
  
  return {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    source: {
      file: path.basename(csvPath),
      checksum: checksum,
      size: csvStats.size,
      lastModified: csvStats.mtime.toISOString()
    },
    statistics: {
      totalPlayers: players.length,
      playersWithImages: playersWithImages,
      imagesCoverage: `${((playersWithImages / players.length) * 100).toFixed(1)}%`,
      positionBreakdown: positionCounts,
      teamBreakdown: teamCounts
    },
    lastUpdated: new Date().toISOString()
  };
}

async function main() {
  console.log('🚀 CREATING MASTER PLAYER DATABASE');
  console.log('═'.repeat(60));
  
  try {
    const csvPath = '/Users/isaacvazquez/Downloads/roster_2025.csv';
    
    // Step 1: Parse CSV
    const rawPlayers = parseCSV(csvPath);
    
    // Step 2: Enhance player data
    const enhancedPlayers = enhancePlayerData(rawPlayers);
    
    // Step 3: Create search index
    const searchIndex = createSearchIndex(enhancedPlayers);
    
    // Step 4: Generate metadata
    const metadata = generateMetadata(enhancedPlayers, csvPath);
    
    // Step 5: Create the master database
    const masterDatabase = {
      metadata: metadata,
      players: enhancedPlayers,
      searchIndex: searchIndex
    };
    
    // Step 6: Save to file
    const outputPath = path.join(__dirname, '../src/data/player-database.json');
    fs.writeFileSync(outputPath, JSON.stringify(masterDatabase, null, 2));
    console.log(`✅ Saved master database to ${outputPath}`);
    
    // Step 7: Create backup
    const backupPath = path.join(__dirname, `../src/data/player-database-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(masterDatabase, null, 2));
    console.log(`📋 Created backup at ${backupPath}`);
    
    // Summary
    console.log('\n📊 DATABASE SUMMARY:');
    console.log('═'.repeat(50));
    console.log(`✅ Total Players: ${metadata.statistics.totalPlayers}`);
    console.log(`✅ Players with Images: ${metadata.statistics.playersWithImages} (${metadata.statistics.imagesCoverage})`);
    console.log(`✅ Search Index Entries: ${Object.keys(searchIndex.byName).length}`);
    console.log(`✅ Database Size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n📋 Position Breakdown:');
    Object.entries(metadata.statistics.positionBreakdown).forEach(([pos, count]) => {
      console.log(`  ${pos}: ${count} players`);
    });
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Build advanced matching engine');
    console.log('2. Match all fantasy players to this database');
    console.log('3. Download missing images');
    console.log('4. Create comprehensive mapping system');
    
    console.log('\n✨ Master player database created successfully!');
    
  } catch (error) {
    console.error('\n💥 FAILED:', error);
    console.log('\nCheck:');
    console.log('• CSV file exists and is readable');
    console.log('• Directory permissions for output');
    console.log('• Disk space for database file');
  }
}

main().catch(console.error);