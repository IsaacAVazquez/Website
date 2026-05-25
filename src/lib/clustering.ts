import { Player, TierGroup } from '@/types';
import { clusterPlayersWithGMM } from './gaussianMixture';

// Color palette for tiers (red -> yellow -> green -> blue -> purple)
const TIER_COLORS = [
  '#FF073A', // Red (Tier 1 - Best)
  '#FFB800', // Amber/Orange (Tier 2)
  '#FFEB3B', // Yellow (Tier 3)
  '#39FF14', // Green (Tier 4)
  '#00F5FF', // Cyan (Tier 5)
  '#2196F3', // Blue (Tier 6)
  '#BF00FF', // Purple (Tier 7+)
];

export function clusterPlayersIntoTiers(
  players: Player[],
  numberOfTiers: number = 6
): TierGroup[] {
  if (players.length === 0) return [];
  
  // First check if players already have tier assignments from FantasyPros
  const hasExistingTiers = players.some(p => p.tier && p.tier > 0);
  
  if (hasExistingTiers) {
    console.log('Using existing FantasyPros tier assignments');
    return groupPlayersByExistingTiers(players);
  }
  
  // Use Gaussian Mixture Model for clustering (matching Boris Chen's approach)
  try {
    return clusterPlayersWithGMM(players, numberOfTiers);
  } catch (error) {
    console.error('GMM clustering failed, falling back to rank gap method:', error);
    // Fallback to rank gap method if GMM fails
    return clusterByRankGaps(players, 3);
  }
}

// Alternative clustering using Gaussian Mixture Model approximation
// This is a simplified version that groups based on rank gaps
export function clusterByRankGaps(
  players: Player[],
  gapThreshold: number = 3
): TierGroup[] {
  if (players.length === 0) return [];
  
  // Sort players by average rank
  const sortedPlayers = [...players].sort((a, b) => Number(a.averageRank) - Number(b.averageRank));
  
  const tierGroups: TierGroup[] = [];
  let currentTier: Player[] = [sortedPlayers[0]];
  let tierNumber = 1;
  
  for (let i = 1; i < sortedPlayers.length; i++) {
    const rankGap = Number(sortedPlayers[i].averageRank) - Number(sortedPlayers[i - 1].averageRank);
    
    // If gap is large enough, start a new tier
    if (rankGap > gapThreshold) {
      // Finalize current tier
      const ranks = currentTier.map(p => Number(p.averageRank));
      tierGroups.push({
        tier: tierNumber,
        players: currentTier,
        color: TIER_COLORS[tierNumber - 1] || TIER_COLORS[TIER_COLORS.length - 1],
        minRank: Math.min(...ranks),
        maxRank: Math.max(...ranks),
        avgRank: ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length
      });
      
      // Start new tier
      currentTier = [sortedPlayers[i]];
      tierNumber++;
    } else {
      currentTier.push(sortedPlayers[i]);
    }
  }
  
  // Add the last tier
  if (currentTier.length > 0) {
    const ranks = currentTier.map(p => Number(p.averageRank));
    tierGroups.push({
      tier: tierNumber,
      players: currentTier,
      color: TIER_COLORS[tierNumber - 1] || TIER_COLORS[TIER_COLORS.length - 1],
      minRank: Math.min(...ranks),
      maxRank: Math.max(...ranks),
      avgRank: ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length
    });
  }
  
  return tierGroups;
}

// Group players using existing tier assignments from FantasyPros
export function groupPlayersByExistingTiers(players: Player[]): TierGroup[] {
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
  
  // Convert to TierGroup array and sort by tier number
  const tierGroups: TierGroup[] = [];
  const sortedTiers = Array.from(tierMap.keys()).sort((a, b) => a - b);
  
  sortedTiers.forEach(tierNumber => {
    const tierPlayers = tierMap.get(tierNumber)!;
    
    // Sort players within tier by average rank
    tierPlayers.sort((a, b) => {
      const rankA = a.averageRank;
      const rankB = b.averageRank;
      return rankA - rankB;
    });
    
    const ranks = tierPlayers.map(p => {
      const rank = p.averageRank;
      return rank;
    });
    
    tierGroups.push({
      tier: tierNumber,
      players: tierPlayers,
      color: TIER_COLORS[tierNumber - 1] || TIER_COLORS[TIER_COLORS.length - 1],
      minRank: Math.min(...ranks),
      maxRank: Math.max(...ranks),
      avgRank: ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length
    });
  });
  
  return tierGroups;
}