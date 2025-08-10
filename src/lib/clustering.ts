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

// Simple K-means implementation for clustering
function simpleKMeans(data: number[][], k: number): { clusters: number[] } {
  const n = data.length;
  const d = data[0].length;
  
  // Initialize centroids randomly
  const centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    centroids.push([
      Math.random() * 30, // Random rank between 0-30
      Math.random() * 5   // Random std dev between 0-5
    ]);
  }
  
  let clusters = new Array(n).fill(0);
  let changed = true;
  let iterations = 0;
  const maxIterations = 100;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    
    // Assign points to nearest centroid
    for (let i = 0; i < n; i++) {
      let minDistance = Infinity;
      let nearestCentroid = 0;
      
      for (let j = 0; j < k; j++) {
        const distance = Math.sqrt(
          Math.pow(data[i][0] - centroids[j][0], 2) +
          Math.pow(data[i][1] - centroids[j][1], 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestCentroid = j;
        }
      }
      
      if (clusters[i] !== nearestCentroid) {
        clusters[i] = nearestCentroid;
        changed = true;
      }
    }
    
    // Update centroids
    for (let j = 0; j < k; j++) {
      const clusterPoints = data.filter((_, i) => clusters[i] === j);
      if (clusterPoints.length > 0) {
        centroids[j] = [
          clusterPoints.reduce((sum, point) => sum + point[0], 0) / clusterPoints.length,
          clusterPoints.reduce((sum, point) => sum + point[1], 0) / clusterPoints.length
        ];
      }
    }
    
    iterations++;
  }
  
  return { clusters };
}

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
      const rankA = typeof a.averageRank === 'string' ? parseFloat(a.averageRank) : a.averageRank;
      const rankB = typeof b.averageRank === 'string' ? parseFloat(b.averageRank) : b.averageRank;
      return rankA - rankB;
    });
    
    const ranks = tierPlayers.map(p => {
      const rank = typeof p.averageRank === 'string' ? parseFloat(p.averageRank) : p.averageRank;
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