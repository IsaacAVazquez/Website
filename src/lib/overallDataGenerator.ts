/**
 * Overall Data Generator
 * Transforms FantasyPros API data into TypeScript files with proper position weighting
 */

import { Player, Position, ScoringFormat } from '@/types';
import { calculateOverallRankings, createOverallRankedPlayers } from './overallValueCalculator';

// Scoring format mapping for API data
const SCORING_FORMAT_MAP: Record<string, ScoringFormat> = {
  'ppr': 'PPR',
  'half-ppr': 'HALF', 
  'standard': 'STD'
};

// File naming mapping
const FILE_NAME_MAP: Record<ScoringFormat, string> = {
  'PPR': 'overallDataPPR.ts',
  'HALF': 'overallData.ts',
  'STD': 'overallDataStandard.ts'
};

// Human readable format names
const FORMAT_DISPLAY_NAMES: Record<ScoringFormat, string> = {
  'PPR': 'Full PPR',
  'HALF': 'Half-PPR',
  'STD': 'Standard'
};

export interface OverallDataGenerationResult {
  fileName: string;
  content: string;
  playerCount: number;
  scoringFormat: ScoringFormat;
  generatedAt: string;
  validation: {
    dstCount: number;
    kCount: number;
    dstMinRank: number;
    kMinRank: number;
    errors: string[];
  };
}

/**
 * Transform FantasyPros API player data into our Player format
 */
export function transformFantasyProsPlayer(apiPlayer: any, position: Position): Player {
  return {
    id: `fp-${position}-${apiPlayer.player_id || Math.random().toString(36).substr(2, 9)}`,
    name: apiPlayer.player_name || apiPlayer.name || 'Unknown Player',
    team: apiPlayer.player_team_id || apiPlayer.team || 'FA',
    position: position,
    averageRank: (apiPlayer.rank_ecr || apiPlayer.rank_ave || apiPlayer.averageRank || 999).toString(),
    projectedPoints: parseInt(apiPlayer.projected_points) || apiPlayer.projectedPoints || 0,
    standardDeviation: (apiPlayer.rank_std || apiPlayer.standardDeviation || '0').toString(),
    tier: apiPlayer.tier || 1,
    minRank: (apiPlayer.rank_min || apiPlayer.minRank || apiPlayer.rank_ecr || apiPlayer.averageRank || '999').toString(),
    maxRank: (apiPlayer.rank_max || apiPlayer.maxRank || apiPlayer.rank_ecr || apiPlayer.averageRank || '999').toString(),
    expertRanks: apiPlayer.expert_ranks || apiPlayer.expertRanks || []
  };
}

/**
 * Generate overall rankings for a specific scoring format
 */
export function generateOverallRankings(
  positionData: Record<Position, Player[]>,
  scoringFormat: ScoringFormat
): OverallDataGenerationResult {
  
  // Combine all position data into one array
  const allPlayers: Player[] = [];
  Object.entries(positionData).forEach(([position, players]) => {
    if (position !== 'FLEX' && position !== 'OVERALL' && Array.isArray(players)) {
      allPlayers.push(...players);
    }
  });

  if (allPlayers.length === 0) {
    throw new Error('No player data available for overall ranking generation');
  }

  // Apply overall value calculator to get properly weighted rankings
  const rankedPlayers = createOverallRankedPlayers(allPlayers, scoringFormat);

  // Generate TypeScript file content
  const content = generateTypeScriptContent(rankedPlayers, scoringFormat);

  // Validate the results
  const validation = validateOverallRankings(rankedPlayers);

  return {
    fileName: FILE_NAME_MAP[scoringFormat],
    content,
    playerCount: rankedPlayers.length,
    scoringFormat,
    generatedAt: new Date().toISOString(),
    validation
  };
}

/**
 * Generate TypeScript file content
 */
function generateTypeScriptContent(players: Player[], scoringFormat: ScoringFormat): string {
  const formatName = FORMAT_DISPLAY_NAMES[scoringFormat];
  
  const header = `/**
 * OVERALL Player Data - ${formatName}
 * Last Updated: ${new Date().toISOString()}
 * Source: fantasypros (automated update with position weighting)
 * Format: ${scoringFormat.toLowerCase()}
 * Version: 2.1.0 - Automated generation with position weighting
 */

import { Player } from '@/types';

export const overallPlayers: Player[] = [`;

  const footer = '\n];';

  const playersContent = players.map(player => {
    // Ensure expert ranks is a proper array
    const expertRanks = Array.isArray(player.expertRanks) ? 
      player.expertRanks.filter(rank => !isNaN(rank)) : [];
    const expertRanksStr = expertRanks.length > 0 ? 
      `[${expertRanks.join(', ')}]` : '[]';
    
    return `  {
    id: '${player.id}',
    name: '${player.name.replace(/'/g, "\\'")}',
    team: '${player.team}',
    position: '${player.position}',
    averageRank: '${player.averageRank}',
    projectedPoints: ${player.projectedPoints || 0},
    standardDeviation: '${player.standardDeviation || '0'}',
    tier: ${player.tier || 1},
    minRank: '${player.minRank || player.averageRank}',
    maxRank: '${player.maxRank || player.averageRank}',
    expertRanks: ${expertRanksStr}
  }`;
  }).join(',\n');

  return header + '\n' + playersContent + footer;
}

/**
 * Validate overall rankings meet our standards
 */
function validateOverallRankings(players: Player[]): OverallDataGenerationResult['validation'] {
  const errors: string[] = [];
  
  // Count positions
  const dstPlayers = players.filter(p => p.position === 'DST');
  const kPlayers = players.filter(p => p.position === 'K');
  
  // Check minimum ranks
  const dstMinRank = dstPlayers.length > 0 ? 
    Math.min(...dstPlayers.map(p => parseInt(p.averageRank))) : 999;
  const kMinRank = kPlayers.length > 0 ? 
    Math.min(...kPlayers.map(p => parseInt(p.averageRank))) : 999;
  
  // Validation rules
  if (dstPlayers.length === 0) {
    errors.push('No DST players found');
  } else if (dstMinRank < 165) {
    errors.push(`DST players ranked too high: minimum rank ${dstMinRank} (should be ≥165)`);
  }
  
  if (kPlayers.length === 0) {
    errors.push('No K players found');
  } else if (kMinRank < 190) {
    errors.push(`K players ranked too high: minimum rank ${kMinRank} (should be ≥190)`);
  }

  // Check for reasonable position distribution in top 50
  const top50 = players.slice(0, 50);
  const top50Positions = top50.reduce((counts, player) => {
    counts[player.position] = (counts[player.position] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  if ((top50Positions.DST || 0) > 0) {
    errors.push(`${top50Positions.DST} DST in top 50 (should be 0)`);
  }
  if ((top50Positions.K || 0) > 0) {
    errors.push(`${top50Positions.K} K in top 50 (should be 0)`);
  }

  // Check skill position distribution
  const expectedRanges = {
    QB: { min: 2, max: 10 },
    RB: { min: 12, max: 25 },
    WR: { min: 12, max: 25 },
    TE: { min: 1, max: 8 }
  };

  Object.entries(expectedRanges).forEach(([pos, range]) => {
    const count = top50Positions[pos] || 0;
    if (count < range.min || count > range.max) {
      errors.push(`${pos} count (${count}) outside expected range ${range.min}-${range.max} in top 50`);
    }
  });

  return {
    dstCount: dstPlayers.length,
    kCount: kPlayers.length,
    dstMinRank,
    kMinRank,
    errors
  };
}

/**
 * Generate all three scoring format files from position data
 */
export function generateAllScoringFormats(
  positionData: Record<Position, Player[]>
): Record<ScoringFormat, OverallDataGenerationResult> {
  
  const results: Record<ScoringFormat, OverallDataGenerationResult> = {} as any;
  
  // Generate for each scoring format
  (['PPR', 'HALF', 'STD'] as ScoringFormat[]).forEach(format => {
    try {
      results[format] = generateOverallRankings(positionData, format);
    } catch (error) {
      throw new Error(`Failed to generate ${format} rankings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  return results;
}

/**
 * Prepare position data from FantasyPros API responses
 */
export function preparePositionDataFromAPI(
  apiResponses: Record<string, any[]>
): Record<Position, Player[]> {
  
  const positionData: Record<Position, Player[]> = {} as any;
  
  // Transform each position's API data
  Object.entries(apiResponses).forEach(([position, players]) => {
    if (position === 'FLEX' || position === 'OVERALL') return;
    
    const typedPosition = position as Position;
    positionData[typedPosition] = players.map(apiPlayer => 
      transformFantasyProsPlayer(apiPlayer, typedPosition)
    );
  });
  
  return positionData;
}

export default {
  generateOverallRankings,
  generateAllScoringFormats,
  preparePositionDataFromAPI,
  transformFantasyProsPlayer
};