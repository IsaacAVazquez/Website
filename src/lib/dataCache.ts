import { Player, Position, ScoringFormat } from '@/types';

// Cache configuration
const CACHE_CONFIG = {
  FRESH_DURATION: 30 * 60 * 1000, // 30 minutes
  STALE_DURATION: 2 * 60 * 60 * 1000, // 2 hours
  MAX_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  VERSION: '1.0',
  KEY_PREFIX: 'ff_cache_'
};

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  source: string;
  version: string;
  position: Position;
  scoringFormat: string;
}

export interface CacheMetadata {
  totalEntries: number;
  totalSize: number;
  oldestEntry: number;
  newestEntry: number;
}

export type CacheStatus = 'fresh' | 'stale' | 'expired' | 'missing';

export class DataCache {
  private static instance: DataCache;

  public static getInstance(): DataCache {
    if (!DataCache.instance) {
      DataCache.instance = new DataCache();
    }
    return DataCache.instance;
  }

  private constructor() {
    // Clean up expired entries on initialization
    this.cleanupExpired();
  }

  /**
   * Generate cache key for position and scoring format
   */
  private getCacheKey(position: Position, scoringFormat: string): string {
    return `${CACHE_CONFIG.KEY_PREFIX}${position}_${scoringFormat}`;
  }

  /**
   * Check if localStorage is available
   */
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get cached data for a specific position and scoring format
   */
  public get(position: Position, scoringFormat: string): CacheEntry<Player[]> | null {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const key = this.getCacheKey(position, scoringFormat);
      const item = localStorage.getItem(key);
      
      if (!item) {
        return null;
      }

      const cached: CacheEntry<Player[]> = JSON.parse(item);
      
      // Check version compatibility
      if (cached.version !== CACHE_CONFIG.VERSION) {
        this.remove(position, scoringFormat);
        return null;
      }

      // Check if expired
      if (Date.now() > cached.expiry) {
        this.remove(position, scoringFormat);
        return null;
      }

      return cached;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Set cached data for a specific position and scoring format
   */
  public set(
    position: Position, 
    scoringFormat: string, 
    data: Player[], 
    source: string = 'api'
  ): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      const now = Date.now();
      const entry: CacheEntry<Player[]> = {
        data,
        timestamp: now,
        expiry: now + CACHE_CONFIG.MAX_DURATION,
        source,
        version: CACHE_CONFIG.VERSION,
        position,
        scoringFormat
      };

      const key = this.getCacheKey(position, scoringFormat);
      localStorage.setItem(key, JSON.stringify(entry));
      
      return true;
    } catch (error) {
      console.warn('Failed to cache data:', error);
      // Try to clean up space and retry
      this.cleanupOldest();
      try {
        const now = Date.now();
        const entry: CacheEntry<Player[]> = {
          data,
          timestamp: now,
          expiry: now + CACHE_CONFIG.MAX_DURATION,
          source,
          version: CACHE_CONFIG.VERSION,
          position,
          scoringFormat
        };

        const key = this.getCacheKey(position, scoringFormat);
        localStorage.setItem(key, JSON.stringify(entry));
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Remove cached data for a specific position and scoring format
   */
  public remove(position: Position, scoringFormat: string): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      const key = this.getCacheKey(position, scoringFormat);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove cached data:', error);
    }
  }

  /**
   * Get cache status for specific data
   */
  public getStatus(position: Position, scoringFormat: string): CacheStatus {
    const cached = this.get(position, scoringFormat);
    
    if (!cached) {
      return 'missing';
    }

    const now = Date.now();
    const age = now - cached.timestamp;

    if (age <= CACHE_CONFIG.FRESH_DURATION) {
      return 'fresh';
    } else if (age <= CACHE_CONFIG.STALE_DURATION) {
      return 'stale';
    } else {
      return 'expired';
    }
  }

  /**
   * Check if data is fresh (less than 30 minutes old)
   */
  public isFresh(position: Position, scoringFormat: string): boolean {
    return this.getStatus(position, scoringFormat) === 'fresh';
  }

  /**
   * Check if data is usable (fresh or stale, but not expired)
   */
  public isUsable(position: Position, scoringFormat: string): boolean {
    const status = this.getStatus(position, scoringFormat);
    return status === 'fresh' || status === 'stale';
  }

  /**
   * Get all cached entries
   */
  public getAllEntries(): CacheEntry<Player[]>[] {
    if (!this.isStorageAvailable()) {
      return [];
    }

    const entries: CacheEntry<Player[]>[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_CONFIG.KEY_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const entry: CacheEntry<Player[]> = JSON.parse(item);
              entries.push(entry);
            } catch {
              // Remove invalid entries
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get all cached entries:', error);
    }

    return entries;
  }

  /**
   * Get cache metadata and statistics
   */
  public getMetadata(): CacheMetadata {
    const entries = this.getAllEntries();
    
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: 0,
        newestEntry: 0
      };
    }

    const totalSize = entries.reduce((size, entry) => {
      return size + JSON.stringify(entry).length;
    }, 0);

    const timestamps = entries.map(entry => entry.timestamp);
    
    return {
      totalEntries: entries.length,
      totalSize,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }

  /**
   * Clear all cached data
   */
  public clear(): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_CONFIG.KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Clean up expired entries
   */
  public cleanupExpired(): number {
    if (!this.isStorageAvailable()) {
      return 0;
    }

    const entries = this.getAllEntries();
    const now = Date.now();
    let removedCount = 0;

    entries.forEach(entry => {
      if (now > entry.expiry) {
        this.remove(entry.position, entry.scoringFormat);
        removedCount++;
      }
    });

    return removedCount;
  }

  /**
   * Remove oldest entries to free up space
   */
  public cleanupOldest(count: number = 3): number {
    if (!this.isStorageAvailable()) {
      return 0;
    }

    const entries = this.getAllEntries();
    
    if (entries.length <= count) {
      return 0;
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    let removedCount = 0;
    for (let i = 0; i < count && i < entries.length; i++) {
      const entry = entries[i];
      this.remove(entry.position, entry.scoringFormat);
      removedCount++;
    }

    return removedCount;
  }

  /**
   * Refresh data if stale or expired
   */
  public needsRefresh(position: Position, scoringFormat: string): boolean {
    const status = this.getStatus(position, scoringFormat);
    return status === 'stale' || status === 'expired' || status === 'missing';
  }

  /**
   * Get formatted cache status for UI display
   */
  public getStatusDisplay(position: Position, scoringFormat: string): {
    status: CacheStatus;
    message: string;
    color: string;
  } {
    const status = this.getStatus(position, scoringFormat);
    const cached = this.get(position, scoringFormat);
    
    const statusMap = {
      fresh: {
        message: cached ? `Updated ${this.getTimeAgo(cached.timestamp)}` : 'No data',
        color: 'text-matrix-green'
      },
      stale: {
        message: cached ? `Cached ${this.getTimeAgo(cached.timestamp)}` : 'No data',
        color: 'text-warning-amber'
      },
      expired: {
        message: 'Data expired',
        color: 'text-error-red'
      },
      missing: {
        message: 'No cached data',
        color: 'text-gray-400'
      }
    };

    return {
      status,
      message: statusMap[status].message,
      color: statusMap[status].color
    };
  }

  /**
   * Get human-readable time ago string
   */
  private getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'just now';
    }
  }

  /**
   * Get cache size in human-readable format
   */
  public getCacheSizeFormatted(): string {
    const metadata = this.getMetadata();
    const bytes = metadata.totalSize;
    
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const dataCache = DataCache.getInstance();

// Export cache configuration for external use
export { CACHE_CONFIG };