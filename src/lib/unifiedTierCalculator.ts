import { Player, TierGroup } from '@/types';
import { clusterPlayersWithGMM } from './gaussianMixture';

// Cache for tier calculations to avoid re-computation
const tierCalculationCache = new Map<string, CachedResult>();
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Limit cache size

interface CachedResult {
  tiers: UnifiedTier[];
  timestamp: number;
}

// Generate cache key from players and parameters
function generateCacheKey(players: Player[], numberOfTiers: number, scoringFormat?: string): string {
  // Create a simpler cache key based on player count, first/last player, and parameters
  if (players.length === 0) return `empty:${numberOfTiers}:${scoringFormat || 'default'}`;
  
  const sortedPlayers = [...players].sort((a, b) => {
    const aRank = typeof a.averageRank === 'string' ? parseFloat(a.averageRank) : a.averageRank;
    const bRank = typeof b.averageRank === 'string' ? parseFloat(b.averageRank) : b.averageRank;
    return aRank - bRank;
  });
  
  const firstPlayer = sortedPlayers[0];
  const lastPlayer = sortedPlayers[sortedPlayers.length - 1];
  
  // Use a combination of player count, first/last player IDs, and parameters
  return `${players.length}:${firstPlayer.id}:${lastPlayer.id}:${numberOfTiers}:${scoringFormat || 'default'}`;
}

// Clear expired cache entries
function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, cached] of tierCalculationCache.entries()) {
    if (now - cached.timestamp > CACHE_EXPIRY_MS) {
      tierCalculationCache.delete(key);
    }
  }
}

// Unified tier colors (cyberpunk theme)
export const UNIFIED_TIER_COLORS = [
  '#FF073A', // Red (Tier 1 - Elite) 
  '#FFB800', // Amber (Tier 2 - Excellent)
  '#39FF14', // Matrix Green (Tier 3 - Very Good)
  '#00F5FF', // Electric Blue (Tier 4 - Good)
  '#BF00FF', // Neon Purple (Tier 5 - Solid)
  '#00FFBF', // Cyber Teal (Tier 6 - Decent)
  '#4B5563', // Slate 600 (Tier 7+ - Deep)
  '#374151', // Slate 700
  '#1F2937', // Slate 800
  '#111827', // Slate 900
];

// Unified tier labels
export const UNIFIED_TIER_LABELS = [
  'Elite',
  'Excellent', 
  'Very Good',
  'Good',
  'Solid',
  'Decent',
  'Deep',
  'Late Round',
  'Waiver Wire',
  'Bench'
];

export interface UnifiedTier {
  tier: number;
  players: Player[];
  color: string;
  label: string;
  minRank: number;
  maxRank: number;
  avgRank: number;
  avgValue?: number;
}

/**
 * Unified tier calculation that works for both single position and cross-position data
 * Uses the more sophisticated clustering approach from clustering.ts as primary method
 */
export function calculateUnifiedTiers(
  players: Player[],
  numberOfTiers: number = 6,
  scoringFormat?: string
): UnifiedTier[] {
  if (players.length === 0) return [];

  // Check cache first
  const cacheKey = generateCacheKey(players, numberOfTiers, scoringFormat);
  const cached = tierCalculationCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY_MS) {
    return cached.tiers;
  }

  // Clear expired entries periodically
  if (tierCalculationCache.size > 50) {
    clearExpiredCache();
  }

  // Sort players by average rank first
  const sortedPlayers = [...players].sort((a, b) => {
    const aRank = typeof a.averageRank === 'string' ? parseFloat(a.averageRank) : a.averageRank;
    const bRank = typeof b.averageRank === 'string' ? parseFloat(b.averageRank) : b.averageRank;
    return aRank - bRank;
  });

  let result: UnifiedTier[];

  // Check if players already have tier assignments from FantasyPros
  const hasExistingTiers = sortedPlayers.some(p => p.tier && p.tier > 0);
  
  if (hasExistingTiers) {
    console.log('Using existing FantasyPros tier assignments');
    result = groupPlayersByExistingTiers(sortedPlayers);
  } else {
    // Try GMM clustering first (most sophisticated approach)
    try {
      const gmmTiers = clusterPlayersWithGMM(sortedPlayers, numberOfTiers);
      result = gmmTiers.map(tier => ({
        ...tier,
        color: UNIFIED_TIER_COLORS[tier.tier - 1] || UNIFIED_TIER_COLORS[UNIFIED_TIER_COLORS.length - 1],
        label: UNIFIED_TIER_LABELS[tier.tier - 1] || `Tier ${tier.tier}`
      }));
    } catch (gmmError) {
      console.warn('GMM clustering failed, trying value-drop method:', gmmError);
      
      // Fallback to value-drop method
      try {
        result = calculateTiersByValueDrops(sortedPlayers, numberOfTiers, scoringFormat);
      } catch (valueError) {
        console.warn('Value-drop method failed, using rank gap method:', valueError);
        
        // Final fallback to simple rank gap method
        result = calculateTiersByRankGaps(sortedPlayers, numberOfTiers);
      }
    }
  }

  // Cache the result
  tierCalculationCache.set(cacheKey, {
    tiers: result,
    timestamp: Date.now()
  });

  return result;
}

/**
 * Group players using existing tier assignments from FantasyPros
 */
function groupPlayersByExistingTiers(players: Player[]): UnifiedTier[] {
  if (players.length === 0) return [];
  
  // Group players by their existing tier assignments
  const tierMap = new Map<number, Player[]>();
  
  players.forEach(player => {
    const tier = player.tier || 999; // Default to tier 999 for tierless players
    if (!tierMap.has(tier)) {
      tierMap.set(tier, []);
    }
    tierMap.get(tier)!.push(player);
  });
  
  // Convert to UnifiedTier array and sort by tier number
  const tierGroups: UnifiedTier[] = [];
  const sortedTiers = Array.from(tierMap.keys()).sort((a, b) => a - b);
  let currentRankIndex = 1; // Start positional ranking from 1
  
  sortedTiers.forEach(tierNumber => {
    const tierPlayers = tierMap.get(tierNumber)!;
    
    // Sort players within tier by average rank
    tierPlayers.sort((a, b) => {
      const rankA = typeof a.averageRank === 'string' ? parseFloat(a.averageRank) : a.averageRank;
      const rankB = typeof b.averageRank === 'string' ? parseFloat(b.averageRank) : b.averageRank;
      return rankA - rankB;
    });
    
    // Calculate positional ranks for this tier
    const minRank = currentRankIndex;
    const maxRank = currentRankIndex + tierPlayers.length - 1;
    
    // Calculate average FantasyPros rank for reference
    const fantasyProsRanks = tierPlayers.map(p => {
      const rank = typeof p.averageRank === 'string' ? parseFloat(p.averageRank) : p.averageRank;
      return rank;
    });
    const avgRank = fantasyProsRanks.reduce((sum, rank) => sum + rank, 0) / fantasyProsRanks.length;
    
    tierGroups.push({
      tier: tierNumber,
      players: tierPlayers,
      color: UNIFIED_TIER_COLORS[tierNumber - 1] || UNIFIED_TIER_COLORS[UNIFIED_TIER_COLORS.length - 1],
      label: UNIFIED_TIER_LABELS[tierNumber - 1] || `Tier ${tierNumber}`,
      minRank: minRank,
      maxRank: maxRank,
      avgRank: avgRank
    });
    
    // Move to the next position index for the next tier
    currentRankIndex = maxRank + 1;
  });
  
  return tierGroups;
}

/**
 * Calculate tiers using value drops (from tierCalculator.ts approach)
 */
function calculateTiersByValueDrops(
  players: Player[],
  maxTiers: number,
  scoringFormat?: string
): UnifiedTier[] {
  // Get player values using the same logic as tierCalculator
  const playerValues = players.map((player, index) => ({
    player,
    rank: index + 1,
    value: getPlayerValue(player, scoringFormat || 'PPR', index + 1)
  }));

  // Calculate tier breaks using value drops
  const tierBreaks = findTierBreaks(playerValues, maxTiers);
  
  // Group players into tiers
  const tiers: UnifiedTier[] = [];
  let currentTier: Player[] = [];
  let tierNumber = 1;
  let tierStartIdx = 0;

  playerValues.forEach((pv, index) => {
    currentTier.push(pv.player);

    // Check if we should start a new tier
    if (tierBreaks.includes(index) || index === playerValues.length - 1) {
      // Calculate tier stats
      const tierValues = playerValues.slice(tierStartIdx, index + 1);
      const avgValue = tierValues.reduce((sum, tv) => sum + tv.value, 0) / tierValues.length;
      const ranks = tierValues.map(tv => {
        const rank = typeof tv.player.averageRank === 'string' ? parseFloat(tv.player.averageRank) : tv.player.averageRank;
        return rank;
      });

      tiers.push({
        tier: tierNumber,
        players: [...currentTier],
        color: UNIFIED_TIER_COLORS[tierNumber - 1] || UNIFIED_TIER_COLORS[UNIFIED_TIER_COLORS.length - 1],
        label: UNIFIED_TIER_LABELS[tierNumber - 1] || `Tier ${tierNumber}`,
        minRank: tierStartIdx + 1,
        maxRank: index + 1,
        avgRank: ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length,
        avgValue
      });

      // Reset for next tier
      currentTier = [];
      tierNumber++;
      tierStartIdx = index + 1;
    }
  });

  return tiers;
}

/**
 * Calculate tiers using rank gaps (simple fallback method)
 */
function calculateTiersByRankGaps(
  players: Player[],
  maxTiers: number,
  gapThreshold: number = 3
): UnifiedTier[] {
  const tierGroups: UnifiedTier[] = [];
  let currentTier: Player[] = [players[0]];
  let tierNumber = 1;
  let tierStartIdx = 0;
  
  for (let i = 1; i < players.length; i++) {
    const currentRank = typeof players[i].averageRank === 'string' ? parseFloat(players[i].averageRank) : players[i].averageRank;
    const prevRank = typeof players[i - 1].averageRank === 'string' ? parseFloat(players[i - 1].averageRank) : players[i - 1].averageRank;
    const rankGap = currentRank - prevRank;
    
    // If gap is large enough or we've hit max tiers, start a new tier
    if (rankGap > gapThreshold && tierNumber < maxTiers) {
      // Finalize current tier with positional ranks
      const fantasyProsRanks = currentTier.map(p => {
        const rank = typeof p.averageRank === 'string' ? parseFloat(p.averageRank) : p.averageRank;
        return rank;
      });
      
      tierGroups.push({
        tier: tierNumber,
        players: currentTier,
        color: UNIFIED_TIER_COLORS[tierNumber - 1] || UNIFIED_TIER_COLORS[UNIFIED_TIER_COLORS.length - 1],
        label: UNIFIED_TIER_LABELS[tierNumber - 1] || `Tier ${tierNumber}`,
        minRank: tierStartIdx + 1, // Positional rank starts from 1
        maxRank: i, // Current position (i is already 1-based for this tier's end)
        avgRank: fantasyProsRanks.reduce((sum, rank) => sum + rank, 0) / fantasyProsRanks.length
      });
      
      // Start new tier
      currentTier = [players[i]];
      tierNumber++;
      tierStartIdx = i;
    } else {
      currentTier.push(players[i]);
    }
  }
  
  // Add the last tier
  if (currentTier.length > 0) {
    const fantasyProsRanks = currentTier.map(p => {
      const rank = typeof p.averageRank === 'string' ? parseFloat(p.averageRank) : p.averageRank;
      return rank;
    });
    
    tierGroups.push({
      tier: tierNumber,
      players: currentTier,
      color: UNIFIED_TIER_COLORS[tierNumber - 1] || UNIFIED_TIER_COLORS[UNIFIED_TIER_COLORS.length - 1],
      label: UNIFIED_TIER_LABELS[tierNumber - 1] || `Tier ${tierNumber}`,
      minRank: tierStartIdx + 1, // Positional rank starts from 1
      maxRank: players.length, // Last position in the list
      avgRank: fantasyProsRanks.reduce((sum, rank) => sum + rank, 0) / fantasyProsRanks.length
    });
  }
  
  return tierGroups;
}

/**
 * Calculate player value (from tierCalculator.ts)
 */
function getPlayerValue(
  player: Player,
  scoringFormat: string,
  rank: number
): number {
  // Base value from inverse of rank and averageRank
  const avgRank = typeof player.averageRank === 'string' ? parseFloat(player.averageRank) : (player.averageRank || rank);
  let value = 100 / Math.sqrt(avgRank);

  // Adjust by position scarcity
  const positionMultipliers: Record<string, number> = {
    QB: 0.8,  // Less scarce
    RB: 1.2,  // More scarce
    WR: 1.0,  // Baseline
    TE: 1.1,  // Somewhat scarce
    K: 0.5,   // Much less valuable
    DST: 0.6  // Less valuable
  };

  value *= positionMultipliers[player.position] || 1.0;

  // Adjust for scoring format
  if (player.position === "RB" && scoringFormat === "STANDARD") {
    value *= 1.1; // RBs more valuable in standard
  } else if (player.position === "WR" && (scoringFormat === "PPR" || scoringFormat === "ppr")) {
    value *= 1.1; // WRs more valuable in PPR
  }

  // Use player's projected points if available
  if (player.projectedPoints) {
    const pointsBonus = player.projectedPoints / 100;
    value += pointsBonus;
  }

  // Factor in standard deviation (less consistent = lower value)
  if (player.standardDeviation) {
    const stdDev = typeof player.standardDeviation === 'string' ? parseFloat(player.standardDeviation) : player.standardDeviation;
    const consistencyFactor = 1 - (stdDev / 100);
    value *= Math.max(consistencyFactor, 0.5); // Don't penalize too heavily
  }

  return value;
}

/**
 * Find tier breaks based on value drops
 */
function findTierBreaks(
  playerValues: { player: Player; rank: number; value: number }[],
  maxTiers: number
): number[] {
  const breaks: number[] = [];
  
  // Calculate value drops between consecutive players
  const valueDrops: { index: number; drop: number }[] = [];
  
  for (let i = 1; i < playerValues.length; i++) {
    const drop = playerValues[i - 1].value - playerValues[i].value;
    valueDrops.push({ index: i - 1, drop });
  }

  // Sort by drop size and take the largest drops as tier breaks
  valueDrops.sort((a, b) => b.drop - a.drop);
  
  // Take top drops, but ensure reasonable tier sizes
  const minTierSize = Math.max(2, Math.floor(playerValues.length / (maxTiers * 2)));
  const selectedBreaks: number[] = [];
  
  for (const vd of valueDrops) {
    // Check if this break would create tiers that are too small
    let validBreak = true;
    
    for (const existingBreak of selectedBreaks) {
      if (Math.abs(vd.index - existingBreak) < minTierSize) {
        validBreak = false;
        break;
      }
    }
    
    if (validBreak) {
      selectedBreaks.push(vd.index);
      if (selectedBreaks.length >= maxTiers - 1) break;
    }
  }

  return selectedBreaks.sort((a, b) => a - b);
}

/**
 * Get tier color by tier number
 */
export function getUnifiedTierColor(tierNumber: number): string {
  return UNIFIED_TIER_COLORS[Math.min(tierNumber - 1, UNIFIED_TIER_COLORS.length - 1)];
}

/**
 * Get tier label by tier number
 */
export function getUnifiedTierLabel(tierNumber: number, totalTiers?: number): string {
  if (tierNumber <= UNIFIED_TIER_LABELS.length) {
    return UNIFIED_TIER_LABELS[tierNumber - 1];
  }
  return `Tier ${tierNumber}`;
}

/**
 * Convert old TierGroup format to UnifiedTier format for compatibility
 */
export function convertToUnifiedTier(tierGroup: TierGroup): UnifiedTier {
  return {
    tier: tierGroup.tier,
    players: tierGroup.players,
    color: UNIFIED_TIER_COLORS[tierGroup.tier - 1] || UNIFIED_TIER_COLORS[UNIFIED_TIER_COLORS.length - 1],
    label: UNIFIED_TIER_LABELS[tierGroup.tier - 1] || `Tier ${tierGroup.tier}`,
    minRank: tierGroup.minRank,
    maxRank: tierGroup.maxRank,
    avgRank: tierGroup.avgRank
  };
}