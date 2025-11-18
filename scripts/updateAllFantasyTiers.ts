#!/usr/bin/env node

/**
 * Fantasy Football All Positions Data Update Script
 *
 * This script fetches the latest tier rankings for ALL positions
 * and updates the static JSON files.
 *
 * Usage:
 *   npm run update:fantasy-all
 *
 * Positions updated:
 * - QB (Quarterbacks)
 * - RB (Running Backs)
 * - WR (Wide Receivers)
 * - TE (Tight Ends)
 * - K (Kickers)
 * - DST (Defense/Special Teams)
 */

import * as fs from 'fs';
import * as path from 'path';

// ========================================
// CONFIGURATION
// ========================================

const CURRENT_WEEK = 11;
const SCORING_FORMAT = 'PPR';
const USE_NFLVERSE = true;

type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';

interface Player {
  name: string;
  team: string;
  avgRank: number;
  consensusRank: number;
  tier: number;
  stdDev?: number;
}

interface TierData {
  week: number;
  generatedAt: string;
  season: string;
  scoringFormat: string;
  players: Player[];
}

// ========================================
// TIER CALCULATION
// ========================================

/**
 * Calculate tier grouping based on position and rank
 */
function calculateTier(rank: number, position: Position): number {
  switch (position) {
    case 'QB':
      if (rank <= 4) return 1;
      if (rank <= 8) return 2;
      if (rank <= 12) return 3;
      if (rank <= 16) return 4;
      return 5;

    case 'RB':
      if (rank <= 4) return 1;
      if (rank <= 9) return 2;
      if (rank <= 14) return 3;
      if (rank <= 19) return 4;
      if (rank <= 24) return 5;
      if (rank <= 29) return 6;
      if (rank <= 34) return 7;
      return 8;

    case 'WR':
      if (rank <= 4) return 1;
      if (rank <= 9) return 2;
      if (rank <= 14) return 3;
      if (rank <= 19) return 4;
      if (rank <= 24) return 5;
      if (rank <= 29) return 6;
      return 7;

    case 'TE':
      if (rank <= 3) return 1;
      if (rank <= 7) return 2;
      if (rank <= 11) return 3;
      return 4;

    case 'K':
      if (rank <= 3) return 1;
      if (rank <= 7) return 2;
      if (rank <= 11) return 3;
      return 4;

    case 'DST':
      if (rank <= 3) return 1;
      if (rank <= 7) return 2;
      if (rank <= 11) return 3;
      return 4;

    default:
      return 1;
  }
}

// ========================================
// DATA FETCHING
// ========================================

/**
 * Fetch rankings for a specific position
 */
async function fetchPositionData(position: Position): Promise<any> {
  console.log(`📡 Fetching ${position} rankings...`);

  if (USE_NFLVERSE) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/fantasy-data?position=${position}&scoring=${SCORING_FORMAT}`
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
      console.warn(`⚠️  Failed to fetch ${position} from API:`, error);
      return null;
    }
  }

  // TODO: Implement external API fetching here
  return null;
}

/**
 * Transform API response into tier data
 */
function transformToTierData(apiResponse: any, position: Position): TierData {
  const players: Player[] = [];

  if (Array.isArray(apiResponse)) {
    apiResponse.forEach((player: any) => {
      const avgRank = parseFloat(player.averageRank || player.avg_rank || player.rank || 999);
      const consensusRank = parseFloat(player.consensusRank || player.ecr || player.rank || avgRank);
      const stdDev = parseFloat(player.standardDeviation || player.std_dev || player.stdDev || 0);

      players.push({
        name: player.name || player.player_name || 'Unknown',
        team: player.team || player.team_abbr || 'FA',
        avgRank,
        consensusRank,
        tier: calculateTier(consensusRank, position),
        stdDev: stdDev > 0 ? stdDev : undefined
      });
    });
  }

  // Sort by consensus rank
  players.sort((a, b) => a.consensusRank - b.consensusRank);

  // Position-specific limits
  const limits: Record<Position, number> = {
    QB: 20,
    RB: 40,
    WR: 30,
    TE: 15,
    K: 12,
    DST: 12
  };

  const topPlayers = players.slice(0, limits[position]);

  return {
    week: CURRENT_WEEK,
    generatedAt: new Date().toISOString(),
    season: new Date().getFullYear().toString(),
    scoringFormat: position === 'K' || position === 'DST' ? 'STANDARD' : SCORING_FORMAT,
    players: topPlayers
  };
}

/**
 * Write tier data to file
 */
function writeDataToFile(data: TierData, position: Position): void {
  const filename = `${position.toLowerCase()}_current.json`;
  const outputPath = path.join(process.cwd(), 'public', 'fantasy', filename);

  console.log(`📝 Writing ${position} data to: ${outputPath}`);

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`✅ ${position}: ${data.players.length} players updated`);
}

// ========================================
// MAIN EXECUTION
// ========================================

async function updatePosition(position: Position): Promise<boolean> {
  try {
    const apiResponse = await fetchPositionData(position);

    if (apiResponse && (Array.isArray(apiResponse) ? apiResponse.length > 0 : true)) {
      const tierData = transformToTierData(apiResponse, position);
      writeDataToFile(tierData, position);
      return true;
    } else {
      console.log(`⚠️  ${position}: No data available, keeping existing file`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${position} update failed:`, error);
    return false;
  }
}

async function main() {
  console.log('\n🏈 Fantasy Football All Positions Update Script');
  console.log('================================================\n');
  console.log(`Week: ${CURRENT_WEEK}`);
  console.log(`Scoring: ${SCORING_FORMAT}`);
  console.log(`Source: ${USE_NFLVERSE ? 'NFLverse API' : 'External API'}\n`);

  const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
  const results: Record<Position, boolean> = {} as any;

  for (const position of positions) {
    console.log(`\n--- Updating ${position} ---`);
    results[position] = await updatePosition(position);
  }

  // Summary
  console.log('\n================================================');
  console.log('Update Summary:');
  console.log('================================================\n');

  const successful = Object.values(results).filter(Boolean).length;
  const failed = positions.length - successful;

  positions.forEach(pos => {
    const status = results[pos] ? '✅' : '❌';
    console.log(`${status} ${pos}: ${results[pos] ? 'Updated' : 'Failed/Skipped'}`);
  });

  console.log(`\nTotal: ${successful}/${positions.length} positions updated successfully`);

  if (failed === 0) {
    console.log('\n✅ All positions updated successfully!\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failed} position(s) failed or were skipped\n`);
    process.exit(1);
  }
}

// Run the script
main();
