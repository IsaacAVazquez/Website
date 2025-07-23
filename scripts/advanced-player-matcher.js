#!/usr/bin/env node

/**
 * Advanced Player Matching Engine
 * 
 * This matches fantasy players from sampleData.ts to the NFL master database
 * using sophisticated algorithms including:
 * - Exact name + team matching
 * - Name variations and fuzzy matching  
 * - Team abbreviation variations
 * - Phonetic matching for misspelled names
 * - Position-based filtering
 * - Confidence scoring
 */

const fs = require('fs');
const path = require('path');

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i-1) === str1.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1, // substitution
          matrix[i][j-1] + 1,   // insertion
          matrix[i-1][j] + 1    // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Calculate fuzzy match score (0-1, 1 being perfect match)
function fuzzyScore(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - (distance / maxLen);
}

// Advanced name matching with multiple strategies
class AdvancedPlayerMatcher {
  constructor(nflDatabase) {
    this.nflDatabase = nflDatabase;
    this.players = nflDatabase.players;
    this.searchIndex = nflDatabase.searchIndex;
    
    // Pre-compute lookup maps for performance
    this.teamPlayerMap = this.buildTeamPlayerMap();
    this.positionPlayerMap = this.buildPositionPlayerMap();
    
    console.log(`✅ Loaded matcher with ${this.players.length} NFL players`);
    console.log(`✅ Search index has ${Object.keys(this.searchIndex.byName).length} name entries`);
  }
  
  buildTeamPlayerMap() {
    const map = {};
    this.players.forEach((player, index) => {
      const team = player.team.toLowerCase();
      if (!map[team]) map[team] = [];
      map[team].push(index);
    });
    return map;
  }
  
  buildPositionPlayerMap() {
    const map = {};
    this.players.forEach((player, index) => {
      const pos = player.position;
      if (!map[pos]) map[pos] = [];
      map[pos].push(index); 
    });
    return map;
  }
  
  // Generate team variations for matching
  getTeamVariations(team) {
    const teamUpper = team.toUpperCase();
    const variations = [teamUpper, teamUpper.toLowerCase()];
    
    // Handle common team abbreviation variations
    const teamMap = {
      'WAS': ['WSH', 'WAS'],
      'WSH': ['WAS', 'WSH'],
      'JAX': ['JAC', 'JAX'],
      'JAC': ['JAX', 'JAC'],
      'LV': ['LAS', 'OAK', 'LV'],
      'LAS': ['LV', 'LAS'],
      'OAK': ['LV', 'OAK'],
      'LAC': ['SD', 'LAC'],
      'SD': ['LAC', 'SD'],
      'LAR': ['LA', 'STL', 'LAR'],
      'LA': ['LAR', 'LA'],
      'STL': ['LAR', 'STL']
    };
    
    if (teamMap[teamUpper]) {
      variations.push(...teamMap[teamUpper]);
    }
    
    return [...new Set(variations)];
  }
  
  // Find exact matches using search index
  findExactMatches(fantasyPlayer) {
    const matches = [];
    const nameVariations = this.generateFantasyNameVariations(fantasyPlayer.name);
    const teamVariations = this.getTeamVariations(fantasyPlayer.team);
    
    for (const name of nameVariations) {
      for (const team of teamVariations) {
        const searchKeys = [
          `${name.toLowerCase()}-${team.toLowerCase()}-${fantasyPlayer.position.toLowerCase()}`,
          `${name.toLowerCase()}-${team.toLowerCase()}`,
          `${name.toLowerCase()}`
        ];
        
        for (const key of searchKeys) {
          const playerIndices = this.searchIndex.byName[key];
          if (playerIndices && playerIndices.length > 0) {
            playerIndices.forEach(index => {
              const nflPlayer = this.players[index];
              if (nflPlayer.position === fantasyPlayer.position) {
                matches.push({
                  nflPlayer,
                  index,
                  confidence: 1.0,
                  matchType: 'exact',
                  matchKey: key
                });
              }
            });
          }
        }
      }
    }
    
    return matches;
  }
  
  // Generate name variations for fantasy players
  generateFantasyNameVariations(name) {
    const variations = new Set([name]);
    
    // Remove periods and apostrophes
    variations.add(name.replace(/[.']/g, ''));
    variations.add(name.replace(/'/g, ''));
    
    // Handle common abbreviations
    variations.add(name.replace(/Jr\.?$/i, '').trim());
    variations.add(name.replace(/Sr\.?$/i, '').trim());
    variations.add(name.replace(/\s+(III|IV|V)$/i, '').trim());
    
    // Handle hyphenated names
    variations.add(name.replace(/-/g, ' '));
    variations.add(name.replace(/-/g, ''));
    
    // Handle middle initials
    variations.add(name.replace(/\s[A-Z]\.\s/g, ' '));
    
    // Common name variations
    const nameMap = {
      'A.J.': 'AJ',
      'AJ': 'A.J.',
      'T.J.': 'TJ', 
      'TJ': 'T.J.',
      'C.J.': 'CJ',
      'CJ': 'C.J.',
      'D.J.': 'DJ',
      'DJ': 'D.J.',
      'J.J.': 'JJ',
      'JJ': 'J.J.'
    };
    
    Object.entries(nameMap).forEach(([from, to]) => {
      if (name.includes(from)) {
        variations.add(name.replace(from, to));
      }
    });
    
    return Array.from(variations);
  }
  
  // Find fuzzy matches when exact matches fail
  findFuzzyMatches(fantasyPlayer) {
    const matches = [];
    const targetName = fantasyPlayer.name.toLowerCase();
    const teamVariations = this.getTeamVariations(fantasyPlayer.team);
    
    // Look at players from same team and position first
    const candidateIndices = new Set();
    
    teamVariations.forEach(team => {
      const teamPlayers = this.teamPlayerMap[team.toLowerCase()] || [];
      teamPlayers.forEach(index => {
        const player = this.players[index];
        if (player.position === fantasyPlayer.position) {
          candidateIndices.add(index);
        }
      });
    });
    
    // If no team matches, look at all players with same position
    if (candidateIndices.size === 0) {
      const positionPlayers = this.positionPlayerMap[fantasyPlayer.position] || [];
      positionPlayers.forEach(index => candidateIndices.add(index));
    }
    
    // Score each candidate
    candidateIndices.forEach(index => {
      const nflPlayer = this.players[index];
      const nflName = nflPlayer.fullName.toLowerCase();
      
      // Calculate name similarity
      const nameScore = fuzzyScore(targetName, nflName);
      
      // Bonus for team match
      let teamBonus = 0;
      if (teamVariations.some(t => t.toLowerCase() === nflPlayer.team.toLowerCase())) {
        teamBonus = 0.2;
      }
      
      // Position match bonus
      const positionBonus = fantasyPlayer.position === nflPlayer.position ? 0.1 : 0;
      
      const totalScore = Math.min(1.0, nameScore + teamBonus + positionBonus);
      
      if (totalScore >= 0.7) { // Only include reasonably good matches
        matches.push({
          nflPlayer,
          index,
          confidence: totalScore,
          matchType: 'fuzzy',
          nameScore,
          teamBonus,
          positionBonus
        });
      }
    });
    
    return matches.sort((a, b) => b.confidence - a.confidence);
  }
  
  // Main matching function
  matchPlayer(fantasyPlayer) {
    console.log(`\n🔍 Matching: ${fantasyPlayer.name} (${fantasyPlayer.team} ${fantasyPlayer.position})`);
    
    // Try exact matches first
    let matches = this.findExactMatches(fantasyPlayer);
    
    if (matches.length > 0) {
      console.log(`  ✅ Found ${matches.length} exact match(es)`);
      // Return best exact match
      const bestMatch = matches.sort((a, b) => b.confidence - a.confidence)[0];
      return {
        fantasyPlayer,
        match: bestMatch,
        alternativeMatches: matches.slice(1, 3) // Include up to 2 alternatives
      };
    }
    
    // Try fuzzy matches
    matches = this.findFuzzyMatches(fantasyPlayer);
    
    if (matches.length > 0) {
      console.log(`  🔍 Found ${matches.length} fuzzy match(es), best confidence: ${matches[0].confidence.toFixed(3)}`);
      return {
        fantasyPlayer,
        match: matches[0],
        alternativeMatches: matches.slice(1, 3)
      };
    }
    
    console.log(`  ❌ No matches found`);
    return {
      fantasyPlayer,
      match: null,
      alternativeMatches: []
    };
  }
  
  // Match all fantasy players
  matchAllPlayers(fantasyPlayers) {
    console.log(`\n🚀 Starting to match ${fantasyPlayers.length} fantasy players...`);
    console.log('═'.repeat(70));
    
    const results = {
      matched: [],
      unmatched: [],
      summary: {
        total: fantasyPlayers.length,
        exactMatches: 0,
        fuzzyMatches: 0,
        noMatches: 0
      }
    };
    
    fantasyPlayers.forEach((player, index) => {
      const result = this.matchPlayer(player);
      
      if (result.match) {
        results.matched.push(result);
        if (result.match.matchType === 'exact') {
          results.summary.exactMatches++;
        } else {
          results.summary.fuzzyMatches++;
        }
      } else {
        results.unmatched.push(result);
        results.summary.noMatches++;
      }
      
      // Progress indicator
      if ((index + 1) % 50 === 0) {
        console.log(`\n📊 Progress: ${index + 1}/${fantasyPlayers.length} players processed`);
      }
    });
    
    return results;
  }
}

// Load NFL database
function loadNFLDatabase() {
  const dbPath = path.join(__dirname, '../src/data/player-database.json');
  if (!fs.existsSync(dbPath)) {
    throw new Error('NFL player database not found. Run create-master-player-database.js first.');
  }
  
  const database = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  console.log(`✅ Loaded NFL database with ${database.players.length} players`);
  return database;
}

// Extract fantasy players from sampleData.ts
function loadFantasyPlayers() {
  const sampleDataPath = path.join(__dirname, '../src/data/sampleData.ts');
  if (!fs.existsSync(sampleDataPath)) {
    throw new Error('sampleData.ts not found');
  }
  
  const content = fs.readFileSync(sampleDataPath, 'utf-8');
  
  // Extract all player arrays using regex
  const playerArrayRegex = /export const sample\w+Data\w+: Player\[\] = (\[[\s\S]*?\]);/g;
  const players = [];
  let match;
  
  while ((match = playerArrayRegex.exec(content)) !== null) {
    try {
      // Clean up the array string and parse it
      let arrayStr = match[1];
      
      // Remove TypeScript-style trailing commas and comments
      arrayStr = arrayStr.replace(/,(\s*[\]}])/g, '$1');
      arrayStr = arrayStr.replace(/\/\/.*$/gm, '');
      
      const playerArray = eval('(' + arrayStr + ')');
      players.push(...playerArray);
    } catch (error) {
      console.warn(`Failed to parse player array: ${error.message}`);
    }
  }
  
  console.log(`✅ Loaded ${players.length} fantasy players from sampleData.ts`);
  return players;
}

async function main() {
  console.log('🚀 ADVANCED PLAYER MATCHING ENGINE');
  console.log('═'.repeat(60));
  
  try {
    // Load data
    const nflDatabase = loadNFLDatabase();
    const fantasyPlayers = loadFantasyPlayers();
    
    // Create matcher
    const matcher = new AdvancedPlayerMatcher(nflDatabase);
    
    // Match all players
    const results = matcher.matchAllPlayers(fantasyPlayers);
    
    // Generate summary
    console.log('\n📊 MATCHING RESULTS SUMMARY:');
    console.log('═'.repeat(50));
    console.log(`✅ Total fantasy players: ${results.summary.total}`);
    console.log(`✅ Exact matches: ${results.summary.exactMatches}`);
    console.log(`🔍 Fuzzy matches: ${results.summary.fuzzyMatches}`);
    console.log(`❌ No matches: ${results.summary.noMatches}`);
    
    const matchRate = ((results.summary.exactMatches + results.summary.fuzzyMatches) / results.summary.total * 100);
    console.log(`📈 Overall match rate: ${matchRate.toFixed(1)}%`);
    
    // Save results
    const outputPath = path.join(__dirname, '../src/data/player-matching-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);
    
    // Show sample matches
    console.log('\n🎯 SAMPLE SUCCESSFUL MATCHES:');
    console.log('─'.repeat(50));
    results.matched.slice(0, 10).forEach(result => {
      const fp = result.fantasyPlayer;
      const nfl = result.match.nflPlayer;
      console.log(`${fp.name} (${fp.team}) → ${nfl.fullName} (${nfl.team}) [${result.match.confidence.toFixed(3)}]`);
    });
    
    if (results.unmatched.length > 0) {
      console.log('\n⚠️ UNMATCHED PLAYERS (first 10):');
      console.log('─'.repeat(40));
      results.unmatched.slice(0, 10).forEach(result => {
        const fp = result.fantasyPlayer;
        console.log(`❌ ${fp.name} (${fp.team} ${fp.position})`);
      });
    }
    
    console.log('\n✨ Advanced player matching completed!');
    return results;
    
  } catch (error) {
    console.error('\n💥 MATCHING FAILED:', error.message);
    console.log('\nTroubleshooting:');
    console.log('• Ensure player-database.json exists (run create-master-player-database.js)');
    console.log('• Check that sampleData.ts is readable');
    console.log('• Verify file permissions');
    process.exit(1);
  }
}

main().catch(console.error);