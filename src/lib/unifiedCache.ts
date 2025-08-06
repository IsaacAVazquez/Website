/**
 * Unified Cache Strategy
 * Replaces complex multi-layer caching with single, reliable cache system
 * Similar to fftiers' simplified data management approach
 */

import { Player, Position, ScoringFormat } from '@/types';
import { logger } from './logger';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expires: number;
  source: string;
  version: string;
  hitCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: number; // Additional time to serve stale data while revalidating
  maxSize?: number; // Maximum number of entries
  compressionThreshold?: number; // Compress data above this size (in bytes)
}

export interface CacheStats {
  totalEntries: number;
  memoryUsage: number; // Approximate memory usage in bytes
  hitRate: number; // Cache hit rate as percentage
  oldestEntry: string | null;
  mostAccessed: string | null;
}

class UnifiedCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 15 * 60 * 1000; // 15 minutes (fftiers-like duration)
  private readonly defaultStaleTime = 5 * 60 * 1000; // 5 minutes stale time
  private readonly maxSize = 1000; // Maximum cache entries
  private readonly version = '1.0.0';
  
  // Statistics tracking
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0
  };

  /**
   * Store data in cache with automatic expiration and eviction
   */
  set<T>(
    key: string, 
    data: T, 
    options: CacheOptions & { source?: string } = {}
  ): void {
    const now = Date.now();
    const ttl = options.ttl || this.defaultTTL;
    const source = options.source || 'unknown';
    
    // Evict old entries if cache is full
    if (this.cache.size >= (options.maxSize || this.maxSize)) {
      this.evictLRU();
    }

    // Create cache entry
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expires: now + ttl,
      source,
      version: this.version,
      hitCount: 0,
      lastAccessed: now
    };

    // Store in cache
    this.cache.set(key, entry);
    this.stats.sets++;
    
    logger.debug(`Cache SET: ${key} (TTL: ${ttl}ms, Source: ${source})`);
  }

  /**
   * Retrieve data from cache with staleness handling
   */
  get<T>(key: string, options: { allowStale?: boolean } = {}): {
    data: T | null;
    isStale: boolean;
    isExpired: boolean;
    source: string | null;
    age: number;
  } {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry) {
      this.stats.misses++;
      return {
        data: null,
        isStale: false,
        isExpired: true,
        source: null,
        age: 0
      };
    }

    // Update access statistics
    entry.hitCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    const age = now - entry.timestamp;
    const isExpired = now > entry.expires;
    const isStale = age > (entry.expires - entry.timestamp) * 0.8; // 80% of TTL

    // Check if expired
    if (isExpired && !options.allowStale) {
      this.cache.delete(key);
      this.stats.deletes++;
      
      return {
        data: null,
        isStale: true,
        isExpired: true,
        source: entry.source,
        age
      };
    }

    logger.debug(`Cache HIT: ${key} (Age: ${age}ms, Stale: ${isStale}, Expired: ${isExpired})`);

    return {
      data: entry.data as T,
      isStale,
      isExpired,
      source: entry.source,
      age
    };
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string, options: { allowStale?: boolean } = {}): boolean {
    const result = this.get(key, options);
    return result.data !== null;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      logger.debug(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    logger.info(`Cache CLEAR: Removed ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    // Approximate memory usage (rough calculation)
    const memoryUsage = Array.from(this.cache.entries()).reduce((total, [key, entry]) => {
      const keySize = key.length * 2; // 2 bytes per character
      const dataSize = JSON.stringify(entry.data).length * 2;
      const metadataSize = 200; // Approximate metadata size
      return total + keySize + dataSize + metadataSize;
    }, 0);

    // Find oldest and most accessed entries
    const oldestEntry = entries.length > 0 
      ? entries.reduce((oldest, entry) => entry.timestamp < oldest.timestamp ? entry : oldest)
      : null;
    
    const mostAccessed = entries.length > 0
      ? entries.reduce((most, entry) => entry.hitCount > most.hitCount ? entry : most)
      : null;

    return {
      totalEntries: this.cache.size,
      memoryUsage,
      hitRate: Math.round(hitRate * 100) / 100,
      oldestEntry: oldestEntry ? new Date(oldestEntry.timestamp).toISOString() : null,
      mostAccessed: mostAccessed ? this.findKeyByEntry(mostAccessed) : null
    };
  }

  /**
   * Get detailed information about a specific cache key
   */
  inspect(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    return entry || null;
  }

  /**
   * Get all cache keys matching a pattern
   */
  keys(pattern?: string): string[] {
    const allKeys = Array.from(this.cache.keys());
    
    if (!pattern) {
      return allKeys;
    }

    // Simple pattern matching (supports * wildcard)
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  /**
   * Prune expired entries manually
   */
  prune(): number {
    const now = Date.now();
    let prunedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
        prunedCount++;
      }
    }

    this.stats.deletes += prunedCount;
    
    if (prunedCount > 0) {
      logger.info(`Cache PRUNE: Removed ${prunedCount} expired entries`);
    }

    return prunedCount;
  }

  /**
   * Fantasy-specific cache key generators
   */
  generatePlayerKey(position: Position, scoringFormat: ScoringFormat): string {
    return `players:${position.toLowerCase()}:${scoringFormat.toLowerCase()}`;
  }

  generateTierKey(position: Position, scoringFormat: ScoringFormat, algorithm?: string): string {
    const algo = algorithm || 'auto';
    return `tiers:${position.toLowerCase()}:${scoringFormat.toLowerCase()}:${algo}`;
  }

  generateRankingKey(source: string, position: Position, week: number = 0): string {
    return `rankings:${source}:${position.toLowerCase()}:week${week}`;
  }

  /**
   * Convenience methods for fantasy football data
   */
  setPlayers(position: Position, scoringFormat: ScoringFormat, players: Player[], source: string = 'api'): void {
    const key = this.generatePlayerKey(position, scoringFormat);
    this.set(key, players, { source, ttl: this.defaultTTL });
  }

  getPlayers(position: Position, scoringFormat: ScoringFormat): Player[] | null {
    const key = this.generatePlayerKey(position, scoringFormat);
    const result = this.get<Player[]>(key);
    return result.data;
  }

  setTiers(position: Position, scoringFormat: ScoringFormat, tierData: any, algorithm?: string): void {
    const key = this.generateTierKey(position, scoringFormat, algorithm);
    this.set(key, tierData, { source: 'tier-calculation', ttl: this.defaultTTL });
  }

  getTiers(position: Position, scoringFormat: ScoringFormat, algorithm?: string): any | null {
    const key = this.generateTierKey(position, scoringFormat, algorithm);
    const result = this.get(key);
    return result.data;
  }

  /**
   * Invalidate related cache entries
   */
  invalidatePosition(position: Position): number {
    const pattern = `*:${position.toLowerCase()}:*`;
    const keysToDelete = this.keys(pattern);
    
    keysToDelete.forEach(key => this.delete(key));
    
    logger.info(`Cache INVALIDATE: Removed ${keysToDelete.length} entries for position ${position}`);
    return keysToDelete.length;
  }

  invalidateScoring(scoringFormat: ScoringFormat): number {
    const pattern = `*:${scoringFormat.toLowerCase()}*`;
    const keysToDelete = this.keys(pattern);
    
    keysToDelete.forEach(key => this.delete(key));
    
    logger.info(`Cache INVALIDATE: Removed ${keysToDelete.length} entries for scoring format ${scoringFormat}`);
    return keysToDelete.length;
  }

  // Private helper methods

  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // Find least recently used entry
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
      logger.debug(`Cache EVICT: Removed LRU entry ${lruKey}`);
    }
  }

  private findKeyByEntry(targetEntry: CacheEntry): string | null {
    for (const [key, entry] of this.cache.entries()) {
      if (entry === targetEntry) {
        return key;
      }
    }
    return null;
  }
}

// Export singleton instance
export const unifiedCache = new UnifiedCache();

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  unifiedCache.prune();
}, 5 * 60 * 1000);