import { Player, Position } from '@/types';

export interface TierAssignment {
  tier: number;
  player: Player;
}

/**
 * Calculate tier groupings for fantasy football players based on their rankings
 * Uses a gap-based algorithm to identify natural breaks in player rankings
 */
export function getTierGroups(players: Player[], position: Position): TierAssignment[] {
  if (!players.length) return [];

  // Sort players by their average rank (lower is better)
  const sortedPlayers = [...players].sort((a, b) => a.averageRank - b.averageRank);
  
  // Calculate gaps between consecutive players
  const gaps: number[] = [];
  for (let i = 1; i < sortedPlayers.length; i++) {
    gaps.push(sortedPlayers[i].averageRank - sortedPlayers[i - 1].averageRank);
  }
  
  // Find significant gaps (larger than average gap * 1.5)
  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length || 0;
  const tierBreaks: number[] = [];
  
  gaps.forEach((gap, index) => {
    if (gap > avgGap * 1.5 && gap > 2) { // Minimum gap of 2 ranks
      tierBreaks.push(index + 1); // +1 because gaps are offset by 1
    }
  });
  
  // Limit to maximum of 6 tiers for practical purposes
  const maxTiers = 6;
  if (tierBreaks.length > maxTiers - 1) {
    tierBreaks.length = maxTiers - 1;
  }
  
  // Assign tier numbers
  const result: TierAssignment[] = [];
  let currentTier = 1;
  let breakIndex = 0;
  
  sortedPlayers.forEach((player, index) => {
    // Check if we've hit a tier break
    if (breakIndex < tierBreaks.length && index >= tierBreaks[breakIndex]) {
      currentTier++;
      breakIndex++;
    }
    
    result.push({
      tier: currentTier,
      player: player
    });
  });
  
  // Map back to original player order
  const playerIndexMap = new Map(players.map((player, index) => [player.id, index]));
  const orderedResult = new Array(players.length);
  
  result.forEach(({ tier, player }) => {
    const originalIndex = playerIndexMap.get(player.id);
    if (originalIndex !== undefined) {
      orderedResult[originalIndex] = { tier, player };
    }
  });
  
  return orderedResult.filter(Boolean);
}

/**
 * Get tier statistics for analysis
 */
export function getTierStats(tierAssignments: TierAssignment[]) {
  const tierMap = new Map<number, Player[]>();
  
  tierAssignments.forEach(({ tier, player }) => {
    if (!tierMap.has(tier)) {
      tierMap.set(tier, []);
    }
    tierMap.get(tier)!.push(player);
  });
  
  const stats = Array.from(tierMap.entries()).map(([tier, players]) => ({
    tier,
    count: players.length,
    minRank: Math.min(...players.map(p => p.averageRank)),
    maxRank: Math.max(...players.map(p => p.averageRank)),
    avgRank: players.reduce((sum, p) => sum + p.averageRank, 0) / players.length
  }));
  
  return stats.sort((a, b) => a.tier - b.tier);
}