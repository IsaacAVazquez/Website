#!/usr/bin/env node

/**
 * Fantasy Football RB Tiers Data Update Script
 *
 * This script fetches the latest running back tier rankings and updates
 * the static JSON file used by the RBTiersChart component.
 *
 * Usage:
 *   npm run update:fantasy-rb
 *
 * What it does:
 * 1. Fetches RB rankings from a fantasy football data API
 * 2. Calculates tier groupings (1-8) based on rankings
 * 3. Transforms data into the rb_current.json schema
 * 4. Writes the updated JSON file to public/fantasy/rb_current.json
 * 5. Logs success or errors
 *
 * Configuration:
 * - Update the API_ENDPOINT constant below with your real data source
 * - Adjust tier calculation logic if needed
 * - Modify the data transformation to match your API response structure
 */

import * as fs from 'fs';
import * as path from 'path';

// ========================================
// CONFIGURATION
// ========================================

/**
 * TODO: Replace this with your actual fantasy football data API endpoint
 *
 * Examples of free/open-source options:
 * - FantasyData.com (has free tier)
 * - Sleeper API (completely free)
 * - ESPN Fantasy API
 * - NFLverse/DynastyProcess GitHub (what the current site uses)
 *
 * For NFLverse example:
 * https://github.com/nflverse/nflverse-data/releases/latest/download/rankings_WEEK.csv
 */
const API_ENDPOINT = 'https://example.com/api/fantasy/rb/rankings';

// Alternative: Use the existing nflverse integration if available
const USE_NFLVERSE = true; // Set to false to use API_ENDPOINT instead

/**
 * Current NFL week number
 * TODO: Update this weekly or fetch dynamically from an NFL schedule API
 */
const CURRENT_WEEK = 11;

/**
 * Scoring format: 'PPR', 'HALF_PPR', or 'STANDARD'
 */
const SCORING_FORMAT = 'PPR';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface RBPlayer {
  name: string;
  team: string;
  avgRank: number;
  consensusRank: number;
  tier: number;
  stdDev?: number;
}

interface RBTierData {
  week: number;
  generatedAt: string;
  season: string;
  scoringFormat: string;
  players: RBPlayer[];
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Calculate tier grouping based on rankings
 * Uses a simple algorithm that groups players by rank ranges
 */
function calculateTier(rank: number, position: 'RB'): number {
  // Tier 1: Top 4 RBs (elite)
  if (rank <= 4) return 1;
  // Tier 2: Ranks 5-9 (RB1s)
  if (rank <= 9) return 2;
  // Tier 3: Ranks 10-14 (mid RB1s / high RB2s)
  if (rank <= 14) return 3;
  // Tier 4: Ranks 15-19 (RB2s)
  if (rank <= 19) return 4;
  // Tier 5: Ranks 20-24 (low RB2s / high RB3s)
  if (rank <= 24) return 5;
  // Tier 6: Ranks 25-29 (RB3s)
  if (rank <= 29) return 6;
  // Tier 7: Ranks 30-34 (low RB3s / FLEX)
  if (rank <= 34) return 7;
  // Tier 8: Rank 35+ (deep bench / waiver)
  return 8;
}

/**
 * Fetch RB rankings from the configured API endpoint
 * TODO: Implement actual API call with your data source
 */
async function fetchRBRankings(): Promise<any> {
  console.log(`📡 Fetching RB rankings for Week ${CURRENT_WEEK} (${SCORING_FORMAT})...`);

  if (USE_NFLVERSE) {
    console.log('ℹ️  Using NFLverse data integration (via internal API)');

    // Call the existing nflverse API endpoint if available
    try {
      // This assumes your Next.js API is running on localhost:3000 during dev
      // For production, you might need a different approach or use the nflverse library directly
      const response = await fetch(
        `http://localhost:3000/api/fantasy-data?position=RB&scoring=${SCORING_FORMAT}`
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.players) {
        throw new Error('API response missing players data');
      }

      return data.players;
    } catch (error) {
      console.error('❌ Failed to fetch from nflverse API:', error);
      console.log('ℹ️  Falling back to mock data generation...');
      return null;
    }
  }

  // TODO: Implement your actual API call here
  console.log(`📡 Fetching from: ${API_ENDPOINT}`);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any required API keys or auth headers here:
        // 'Authorization': `Bearer ${process.env.FANTASY_API_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // TODO: Transform the API response to match the expected format
    // This will depend on your API's response structure
    return data;

  } catch (error) {
    console.error('❌ API fetch failed:', error);
    console.log('ℹ️  You need to configure API_ENDPOINT with a real data source');
    return null;
  }
}

/**
 * Transform API response into rb_current.json format
 * TODO: Adjust this based on your API's response structure
 */
function transformToRBTierData(apiResponse: any): RBTierData {
  console.log('🔄 Transforming data...');

  const players: RBPlayer[] = [];

  // If apiResponse is an array of players (nflverse format)
  if (Array.isArray(apiResponse)) {
    apiResponse.forEach((player: any) => {
      // Extract rank - adjust these field names based on your API
      const avgRank = parseFloat(player.averageRank || player.avg_rank || player.rank || 999);
      const consensusRank = parseFloat(player.consensusRank || player.ecr || player.rank || avgRank);
      const stdDev = parseFloat(player.standardDeviation || player.std_dev || player.stdDev || 0);

      players.push({
        name: player.name || player.player_name || 'Unknown',
        team: player.team || player.team_abbr || 'FA',
        avgRank,
        consensusRank,
        tier: calculateTier(consensusRank, 'RB'),
        stdDev: stdDev > 0 ? stdDev : undefined
      });
    });
  } else if (apiResponse && typeof apiResponse === 'object') {
    // If apiResponse is an object with a players array
    const playerArray = apiResponse.players || apiResponse.data || apiResponse.rankings || [];

    playerArray.forEach((player: any) => {
      const avgRank = parseFloat(player.averageRank || player.avg_rank || player.rank || 999);
      const consensusRank = parseFloat(player.consensusRank || player.ecr || player.rank || avgRank);
      const stdDev = parseFloat(player.standardDeviation || player.std_dev || player.stdDev || 0);

      players.push({
        name: player.name || player.player_name || 'Unknown',
        team: player.team || player.team_abbr || 'FA',
        avgRank,
        consensusRank,
        tier: calculateTier(consensusRank, 'RB'),
        stdDev: stdDev > 0 ? stdDev : undefined
      });
    });
  }

  // Sort by consensus rank
  players.sort((a, b) => a.consensusRank - b.consensusRank);

  // Limit to top 40 RBs
  const topPlayers = players.slice(0, 40);

  const tierData: RBTierData = {
    week: CURRENT_WEEK,
    generatedAt: new Date().toISOString(),
    season: new Date().getFullYear().toString(),
    scoringFormat: SCORING_FORMAT,
    players: topPlayers
  };

  console.log(`✅ Transformed ${topPlayers.length} players into tier data`);
  return tierData;
}

/**
 * Generate sample/fallback data if API is not configured
 */
function generateSampleData(): RBTierData {
  console.log('⚠️  Generating sample data (configure API for real data)');

  // Sample data for demonstration
  const samplePlayers: RBPlayer[] = [
    { name: 'Christian McCaffrey', team: 'SF', avgRank: 1.2, consensusRank: 1.0, tier: 1, stdDev: 0.4 },
    { name: 'Saquon Barkley', team: 'PHI', avgRank: 2.1, consensusRank: 2.0, tier: 1, stdDev: 0.5 },
    { name: 'Breece Hall', team: 'NYJ', avgRank: 3.3, consensusRank: 3.0, tier: 1, stdDev: 0.8 },
    { name: 'Bijan Robinson', team: 'ATL', avgRank: 4.1, consensusRank: 4.0, tier: 1, stdDev: 0.6 },
    // Add more sample data as needed
  ];

  return {
    week: CURRENT_WEEK,
    generatedAt: new Date().toISOString(),
    season: new Date().getFullYear().toString(),
    scoringFormat: SCORING_FORMAT,
    players: samplePlayers
  };
}

/**
 * Write the tier data to the public JSON file
 */
function writeDataToFile(data: RBTierData): void {
  const outputPath = path.join(process.cwd(), 'public', 'fantasy', 'rb_current.json');

  console.log(`📝 Writing data to: ${outputPath}`);

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write formatted JSON
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

  console.log('✅ Successfully updated rb_current.json');
  console.log(`   Week: ${data.week}`);
  console.log(`   Season: ${data.season}`);
  console.log(`   Players: ${data.players.length}`);
  console.log(`   Format: ${data.scoringFormat}`);
  console.log(`   Updated: ${data.generatedAt}`);
}

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
  console.log('\n🏈 Fantasy Football RB Tiers Update Script');
  console.log('==========================================\n');

  try {
    // Step 1: Fetch rankings from API
    const apiResponse = await fetchRBRankings();

    // Step 2: Transform data or use sample data
    let tierData: RBTierData;

    if (apiResponse && (Array.isArray(apiResponse) ? apiResponse.length > 0 : true)) {
      tierData = transformToRBTierData(apiResponse);
    } else {
      tierData = generateSampleData();
    }

    // Step 3: Write to file
    writeDataToFile(tierData);

    console.log('\n✅ Update complete!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Update failed:', error);
    console.error('\nPlease check the error above and try again.\n');
    process.exit(1);
  }
}

// Run the script
main();
