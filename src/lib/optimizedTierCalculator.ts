import { Player, TierGroup } from '@/types';

// Enhanced cache with better performance characteristics
const CACHE_CONFIG = {
  maxEntries: 100,
  maxAge: 30 * 60 * 1000, // 30 minutes (increased from 5 minutes)
  compressionThreshold: 50, // Compress results with 50+ players
} as const;

interface OptimizedCachedResult {
  tiers: OptimizedTier[];
  timestamp: number;
  compressed?: boolean;
  playerCount: number;
  checksum: string;
}

interface OptimizedTier {
  tier: number;
  players: Player[];
  color: string;
  label: string;
  minRank: number;
  maxRank: number;
  avgRank: number;
  playerCount: number;
}

// Enhanced cache with LRU eviction
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private accessOrder = new Map<K, number>();
  private accessCounter = 0;

  constructor(private maxSize: number) {}

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.accessOrder.set(key, ++this.accessCounter);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    this.cache.set(key, value);
    this.accessOrder.set(key, ++this.accessCounter);
  }

  private evictLRU(): void {
    let lruKey: K | undefined;
    let minAccess = Infinity;
    
    for (const [key, access] of this.accessOrder) {
      if (access < minAccess) {
        minAccess = access;
        lruKey = key;
      }
    }
    
    if (lruKey !== undefined) {
      this.cache.delete(lruKey);
      this.accessOrder.delete(lruKey);
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance with LRU eviction
const tierCache = new LRUCache<string, OptimizedCachedResult>(CACHE_CONFIG.maxEntries);

// Fast checksum calculation for cache validation
function calculateChecksum(players: Player[]): string {
  if (players.length === 0) return 'empty';
  
  // Use first, middle, and last player IDs + count for fast checksum
  const first = players[0].id;
  const middle = players[Math.floor(players.length / 2)].id;
  const last = players[players.length - 1].id;
  
  return `${first}-${middle}-${last}-${players.length}`;
}

// Generate optimized cache key
function generateOptimizedCacheKey(
  players: Player[], 
  numberOfTiers: number, 
  scoringFormat?: string
): string {
  const checksum = calculateChecksum(players);
  return `${checksum}:${numberOfTiers}:${scoringFormat || 'default'}`;
}

// Tier colors optimized for performance (pre-calculated)
const TIER_COLORS = [
  '#FF073A', '#FFB800', '#39FF14', '#00F5FF', '#BF00FF', 
  '#00FFBF', '#4B5563', '#374151', '#1F2937', '#111827'
] as const;

const TIER_LABELS = [
  'Elite', 'Excellent', 'Very Good', 'Good', 'Solid',
  'Decent', 'Deep', 'Late Round', 'Waiver Wire', 'Bench'
] as const;

// Fast tier calculation using statistical breaks
function calculateTiersByQuartiles(
  players: Player[],
  numberOfTiers: number
): OptimizedTier[] {
  if (players.length === 0) return [];

  const sortedPlayers = [...players].sort((a, b) => {
    const aRank = typeof a.averageRank === 'string' ? parseFloat(a.averageRank) : a.averageRank;
    const bRank = typeof b.averageRank === 'string' ? parseFloat(b.averageRank) : b.averageRank;
    return aRank - bRank;
  });

  const tiers: OptimizedTier[] = [];
  const playersPerTier = Math.ceil(sortedPlayers.length / numberOfTiers);

  for (let tierIndex = 0; tierIndex < numberOfTiers; tierIndex++) {
    const startIndex = tierIndex * playersPerTier;
    const endIndex = Math.min(startIndex + playersPerTier, sortedPlayers.length);
    
    if (startIndex >= sortedPlayers.length) break;

    const tierPlayers = sortedPlayers.slice(startIndex, endIndex);
    const fantasyProsRanks = tierPlayers.map(p => {
      const rank = typeof p.averageRank === 'string' ? parseFloat(p.averageRank) : p.averageRank;
      return rank;
    });

    tiers.push({
      tier: tierIndex + 1,
      players: tierPlayers,
      color: TIER_COLORS[tierIndex] || TIER_COLORS[TIER_COLORS.length - 1],
      label: TIER_LABELS[tierIndex] || `Tier ${tierIndex + 1}`,
      minRank: startIndex + 1,
      maxRank: endIndex,
      avgRank: fantasyProsRanks.reduce((sum, rank) => sum + rank, 0) / fantasyProsRanks.length,
      playerCount: tierPlayers.length
    });
  }

  return tiers;
}

// Main optimized tier calculation function
export async function calculateOptimizedTiers(
  players: Player[],
  numberOfTiers: number = 6,
  scoringFormat?: string,
  useWebWorker: boolean = false
): Promise<OptimizedTier[]> {
  if (players.length === 0) return [];

  const cacheKey = generateOptimizedCacheKey(players, numberOfTiers, scoringFormat);
  const checksum = calculateChecksum(players);

  // Check cache first
  const cached = tierCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_CONFIG.maxAge) {
    // Validate cache integrity with checksum
    if (cached.checksum === checksum) {
      return cached.tiers;
    }
  }

  // If using web worker and available, delegate to background thread
  if (useWebWorker && typeof Worker !== 'undefined' && players.length > 100) {
    try {
      const workerResult = await calculateTiersInWorker(players, numberOfTiers, scoringFormat);
      if (workerResult) {
        // Cache the result
        tierCache.set(cacheKey, {
          tiers: workerResult,
          timestamp: Date.now(),
          playerCount: players.length,
          checksum
        });
        return workerResult;
      }
    } catch (error) {
      console.warn('Web Worker tier calculation failed, falling back to main thread:', error);
    }
  }

  // Calculate tiers on main thread
  const result = calculateTiersByQuartiles(players, numberOfTiers);

  // Cache the result
  tierCache.set(cacheKey, {
    tiers: result,
    timestamp: Date.now(),
    playerCount: players.length,
    checksum
  });

  return result;
}

// Web Worker calculation (fallback to Promise for compatibility)
async function calculateTiersInWorker(
  players: Player[],
  numberOfTiers: number,
  scoringFormat?: string
): Promise<OptimizedTier[] | null> {
  return new Promise((resolve) => {
    try {
      // For now, return null to use main thread
      // TODO: Implement actual Web Worker in future enhancement
      resolve(null);
    } catch (error) {
      resolve(null);
    }
  });
}

// Utility function to warm cache with common configurations
export function warmTierCache(
  allPlayersData: Record<string, Player[]>,
  commonConfigs: Array<{ position: string; scoring: string; tiers: number }>
): void {
  // Run in next tick to avoid blocking main thread
  setTimeout(() => {
    commonConfigs.forEach(async ({ position, scoring, tiers }) => {
      const players = allPlayersData[position];
      if (players && players.length > 0) {
        await calculateOptimizedTiers(players, tiers, scoring, false);
      }
    });
  }, 100);
}

// Cache management utilities
export const tierCacheUtils = {
  size: () => tierCache.size(),
  clear: () => tierCache.clear(),
  
  getStats: () => ({
    size: tierCache.size(),
    maxSize: CACHE_CONFIG.maxEntries,
    maxAge: CACHE_CONFIG.maxAge,
    hitRate: 'N/A' // TODO: Implement hit rate tracking
  })
};

// Pre-computed tier configurations for common scenarios
export const COMMON_TIER_CONFIGS = [
  { position: 'QB', scoring: 'PPR', tiers: 6 },
  { position: 'RB', scoring: 'PPR', tiers: 8 },
  { position: 'WR', scoring: 'PPR', tiers: 8 },
  { position: 'TE', scoring: 'PPR', tiers: 6 },
  { position: 'FLEX', scoring: 'PPR', tiers: 10 },
  { position: 'ALL', scoring: 'PPR', tiers: 12 }
] as const;

export default calculateOptimizedTiers;