/**
 * Overall Fantasy Football Value Calculator
 * Properly weights players across positions for realistic overall rankings
 * Addresses issue where K1 and DST1 rank too highly in combined rankings
 */

import { Player, Position, ScoringFormat } from '@/types';

// Position value weights based on fantasy football impact and scarcity
// Higher values = more fantasy relevant positions
const POSITION_VALUES: Record<Position, number> = {
  'QB': 1.0,      // Baseline - steady production but replaceable
  'RB': 1.35,     // Premium - scarcest position, high usage
  'WR': 1.25,     // High value - consistent targets, PPR boost  
  'TE': 1.1,      // Moderate - elite TEs valuable, dropoff steep
  'K': 0.12,      // Minimal - very low impact, highly random
  'DST': 0.18,    // Low - some predictability, still minimal impact
  'FLEX': 1.25,   // Same as WR baseline for flex calculations
  'OVERALL': 1.0  // Not used in calculations
};

// Scoring format multipliers for position-specific adjustments
const FORMAT_MULTIPLIERS: Record<ScoringFormat, Record<Position, number>> = {
  'PPR': {
    'QB': 1.0,
    'RB': 1.15,    // PPR receiving backs get boost
    'WR': 1.3,     // Biggest PPR beneficiaries  
    'TE': 1.2,     // PPR helps TEs significantly
    'K': 1.0,
    'DST': 1.0,
    'FLEX': 1.25,
    'OVERALL': 1.0
  },
  'HALF': {
    'QB': 1.0,
    'RB': 1.25,    // Still valuable, less receiving boost
    'WR': 1.2,     // Moderate PPR benefit
    'TE': 1.15,    // Some receiving benefit
    'K': 1.0,
    'DST': 1.0,
    'FLEX': 1.2,
    'OVERALL': 1.0
  },
  'STD': {
    'QB': 1.0,
    'RB': 1.4,     // Rushing TDs and yards more valuable
    'WR': 1.1,     // Less valuable without reception points
    'TE': 1.05,    // Minimal benefit without PPR
    'K': 1.0,
    'DST': 1.0,
    'FLEX': 1.2,
    'OVERALL': 1.0
  }
};

// Expected positional contribution thresholds
// Used to normalize value calculations across positions
const POSITIONAL_BASELINES = {
  'QB': { starter: 20, relevant: 32 },      // ~12 teams need 1-2 QBs
  'RB': { starter: 30, relevant: 60 },     // ~12 teams need 2-3 RBs + handcuffs
  'WR': { starter: 36, relevant: 72 },     // ~12 teams need 3-4 WRs
  'TE': { starter: 15, relevant: 24 },     // ~12 teams need 1-2 TEs, big dropoff
  'K': { starter: 15, relevant: 20 },      // 1 per team, minimal difference
  'DST': { starter: 15, relevant: 20 }     // 1 per team, some streaming value
};

// Minimum overall rank floors - no player of these positions can rank higher
// Based on realistic fantasy draft patterns
const POSITION_RANK_FLOORS: Record<Position, number> = {
  'QB': 1,        // QBs can go very early (Josh Allen, etc.)
  'RB': 1,        // RBs dominate early rounds
  'WR': 1,        // WRs can go #1 overall
  'TE': 1,        // Elite TEs (Kelce) can go early
  'FLEX': 1,      // Not applicable
  'OVERALL': 1,   // Not applicable
  'DST': 165,     // No defense should rank higher than ~165
  'K': 190        // No kicker should rank higher than ~190
};

export interface OverallValueCalculation {
  player: Player;
  overallValue: number;
  overallRank: number;
  positionValue: number;
  formatAdjustment: number;
  scarcityBonus: number;
  originalRank: number;
}

/**
 * Calculate overall fantasy value for a player
 */
export function calculateOverallValue(
  player: Player, 
  scoringFormat: ScoringFormat = 'PPR'
): number {
  const projectedPoints = player.projectedPoints || 0;
  const position = player.position;
  
  // Skip FLEX and OVERALL positions for individual calculations
  if (position === 'FLEX' || position === 'OVERALL') {
    return projectedPoints;
  }

  // Base position value multiplier
  const positionMultiplier = POSITION_VALUES[position] || 1.0;
  
  // Scoring format adjustment
  const formatMultiplier = FORMAT_MULTIPLIERS[scoringFormat]?.[position] || 1.0;
  
  // Position scarcity adjustment based on player rank within position
  const playerRank = typeof player.averageRank === 'string' ? 
                     parseFloat(player.averageRank) : player.averageRank;
  const scarcityMultiplier = calculateScarcityMultiplier(position, playerRank);
  
  // Calculate final overall value
  const overallValue = projectedPoints * positionMultiplier * formatMultiplier * scarcityMultiplier;
  
  return Math.max(0, overallValue); // Ensure non-negative
}

/**
 * Calculate scarcity multiplier based on position and rank
 * Elite players at scarce positions get higher multipliers
 */
function calculateScarcityMultiplier(position: Position, playerRank: number): number {
  const baseline = POSITIONAL_BASELINES[position as keyof typeof POSITIONAL_BASELINES];
  if (!baseline) return 1.0;
  
  const { starter, relevant } = baseline;
  
  // Elite tier (top starter-level players) - significant bonus
  if (playerRank <= starter * 0.4) {
    return 1.3;
  }
  
  // Starter tier - moderate bonus  
  if (playerRank <= starter) {
    return 1.15;
  }
  
  // Depth tier - slight bonus
  if (playerRank <= relevant) {
    return 1.05;
  }
  
  // Deep tier - penalty for low-relevance players
  return 0.85;
}

/**
 * Re-rank all players by overall value and assign proper overall ranks
 * Enforces position rank floors to ensure realistic fantasy draft order
 */
export function calculateOverallRankings(
  allPlayers: Player[], 
  scoringFormat: ScoringFormat = 'PPR'
): OverallValueCalculation[] {
  
  // Calculate overall value for each player
  const calculations: OverallValueCalculation[] = allPlayers.map(player => {
    const originalRank = typeof player.averageRank === 'string' ? 
                        parseFloat(player.averageRank) : player.averageRank;
    
    const positionValue = POSITION_VALUES[player.position] || 1.0;
    const formatAdjustment = FORMAT_MULTIPLIERS[scoringFormat]?.[player.position] || 1.0;
    const scarcityBonus = calculateScarcityMultiplier(player.position, originalRank);
    const overallValue = calculateOverallValue(player, scoringFormat);
    
    return {
      player,
      overallValue,
      overallRank: 0, // Will be set after sorting
      positionValue,
      formatAdjustment,
      scarcityBonus,
      originalRank
    };
  });
  
  // Separate players by those subject to rank floors vs those that aren't
  const skillPositions = calculations.filter(calc => 
    !['K', 'DST'].includes(calc.player.position)
  );
  const kickersAndDefenses = calculations.filter(calc => 
    ['K', 'DST'].includes(calc.player.position)
  );
  
  // Sort skill positions by overall value (descending)
  skillPositions.sort((a, b) => b.overallValue - a.overallValue);
  
  // Sort K and DST by their own values (descending)
  kickersAndDefenses.sort((a, b) => b.overallValue - a.overallValue);
  
  // Assign ranks to skill positions first
  skillPositions.forEach((calc, index) => {
    calc.overallRank = index + 1;
  });
  
  // Find where to insert K and DST players based on rank floors
  let currentRank = skillPositions.length + 1;
  
  // Place DST players (floor: 165)
  const dstPlayers = kickersAndDefenses.filter(calc => calc.player.position === 'DST');
  const dstStartRank = Math.max(currentRank, POSITION_RANK_FLOORS.DST);
  dstPlayers.forEach((calc, index) => {
    calc.overallRank = dstStartRank + index;
  });
  
  // Place Kicker players (floor: 190)
  const kPlayers = kickersAndDefenses.filter(calc => calc.player.position === 'K');
  const kStartRank = Math.max(dstStartRank + dstPlayers.length, POSITION_RANK_FLOORS.K);
  kPlayers.forEach((calc, index) => {
    calc.overallRank = kStartRank + index;
  });
  
  // Combine all calculations back together
  const allCalculations = [...skillPositions, ...dstPlayers, ...kPlayers];
  
  // Sort by final overall rank for return
  allCalculations.sort((a, b) => a.overallRank - b.overallRank);
  
  return allCalculations;
}

/**
 * Create properly ranked players list with updated overall rankings
 */
export function createOverallRankedPlayers(
  allPlayers: Player[], 
  scoringFormat: ScoringFormat = 'PPR'
): Player[] {
  const calculations = calculateOverallRankings(allPlayers, scoringFormat);
  
  return calculations.map(calc => ({
    ...calc.player,
    averageRank: calc.overallRank,
    // Store original positional rank as metadata
    positionRank: calc.originalRank,
    // Add overall value as additional context
    overallValue: calc.overallValue
  }));
}

/**
 * Validate overall rankings make sense
 * Returns warnings if rankings seem off
 */
export function validateOverallRankings(calculations: OverallValueCalculation[]): string[] {
  const warnings: string[] = [];
  
  // Check if any kickers rank higher than their floor (190)
  const highKickers = calculations
    .filter(c => c.player.position === 'K' && c.overallRank < POSITION_RANK_FLOORS.K);
  if (highKickers.length > 0) {
    warnings.push(`${highKickers.length} kicker(s) ranked higher than floor (${POSITION_RANK_FLOORS.K}) - algorithm error`);
  }
  
  // Check if any DSTs rank higher than their floor (165)
  const highDefenses = calculations
    .filter(c => c.player.position === 'DST' && c.overallRank < POSITION_RANK_FLOORS.DST);
  if (highDefenses.length > 0) {
    warnings.push(`${highDefenses.length} defense(s) ranked higher than floor (${POSITION_RANK_FLOORS.DST}) - algorithm error`);
  }
  
  // Check position distribution in top 50 (should be all skill positions)
  const top50 = calculations.slice(0, 50);
  const positionCounts = top50.reduce((counts, calc) => {
    counts[calc.player.position] = (counts[calc.player.position] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  // With rank floors, K and DST should never appear in top 50
  if ((positionCounts.K || 0) > 0) {
    warnings.push(`${positionCounts.K} kicker(s) in top 50 - rank floor not working`);
  }
  
  if ((positionCounts.DST || 0) > 0) {
    warnings.push(`${positionCounts.DST} defense(s) in top 50 - rank floor not working`);
  }
  
  // Validate realistic skill position distribution in top 50
  const expectedRanges = {
    QB: { min: 2, max: 8 },    // ~2-8 QBs in top 50
    RB: { min: 15, max: 25 },  // ~15-25 RBs in top 50 (premium position)
    WR: { min: 15, max: 25 },  // ~15-25 WRs in top 50
    TE: { min: 2, max: 6 }     // ~2-6 TEs in top 50 (top-heavy)
  };
  
  Object.entries(expectedRanges).forEach(([position, range]) => {
    const count = positionCounts[position] || 0;
    if (count < range.min || count > range.max) {
      warnings.push(`${position} count (${count}) outside expected range ${range.min}-${range.max} in top 50`);
    }
  });
  
  return warnings;
}

export default {
  calculateOverallValue,
  calculateOverallRankings,
  createOverallRankedPlayers,
  validateOverallRankings
};