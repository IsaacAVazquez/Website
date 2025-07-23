import { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Position, ScoringFormat } from '@/types';
import { dataCache, CacheStatus } from '@/lib/dataCache';
import { convertScoringFormat } from '@/lib/scoringFormatUtils';
import { getSampleDataByPosition } from '@/data/sampleData';

export interface UseAllFantasyDataOptions {
  scoringFormat: ScoringFormat;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseAllFantasyDataResult {
  players: Player[];
  isLoading: boolean;
  error: string | null;
  dataSource: 'cache' | 'api' | 'sample';
  cacheStatus: CacheStatus;
  lastUpdated: string;
  refresh: () => Promise<void>;
  clearCache: () => void;
  getCacheInfo: () => {
    status: CacheStatus;
    message: string;
    color: string;
  };
}

const ALL_POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

export function useAllFantasyData({
  scoringFormat,
  autoRefresh = true,
  refreshInterval = 10 * 60 * 1000 // 10 minutes
}: UseAllFantasyDataOptions): UseAllFantasyDataResult {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'cache' | 'api' | 'sample'>('sample');
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>('missing');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Refs to prevent unnecessary re-renders
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef<boolean>(false);

  const scoringFormatParam = convertScoringFormat(scoringFormat);

  /**
   * Fetch data from API for a specific position
   */
  const fetchPositionFromAPI = useCallback(async (position: Position): Promise<Player[] | null> => {
    try {
      const response = await fetch(
        `/api/data-manager?position=${position}&dataset=fantasypros-session&scoringFormat=${scoringFormatParam}`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed for ${position}: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.players && data.players.length > 0) {
        // Cache the fresh data for this position
        dataCache.set(position, scoringFormatParam, data.players, 'api');
        return data.players;
      }
      
      return null;
    } catch (apiError) {
      console.warn(`API fetch failed for ${position}:`, apiError);
      return null;
    }
  }, [scoringFormatParam]);

  /**
   * Load data for all positions with cache-first strategy
   */
  const loadAllData = useCallback(async (forceRefresh: boolean = false) => {
    if (isRefreshingRef.current && !forceRefresh) {
      return;
    }

    setIsLoading(true);
    setError(null);
    isRefreshingRef.current = true;

    try {
      const allPlayers: Player[] = [];
      let hasApiData = false;
      let hasCacheData = false;
      let overallCacheStatus: CacheStatus = 'fresh';

      // Process each position
      for (const position of ALL_POSITIONS) {
        const currentCacheStatus = dataCache.getStatus(position, scoringFormatParam);
        
        // Update overall cache status (use the worst status)
        if (currentCacheStatus === 'missing') {
          overallCacheStatus = 'missing';
        } else if (currentCacheStatus === 'stale' && overallCacheStatus === 'fresh') {
          overallCacheStatus = 'stale';
        }

        // Try to get cached data first
        const cachedData = dataCache.get(position, scoringFormatParam);
        
        if (cachedData && !forceRefresh && dataCache.isFresh(position, scoringFormatParam)) {
          // Use fresh cached data
          allPlayers.push(...cachedData.data);
          hasCacheData = true;
          continue;
        }

        // Try to fetch fresh data from API
        const apiData = await fetchPositionFromAPI(position);
        
        if (apiData) {
          allPlayers.push(...apiData);
          hasApiData = true;
        } else if (cachedData) {
          // Fall back to stale cached data
          allPlayers.push(...cachedData.data);
          hasCacheData = true;
        } else {
          // Fall back to sample data for this position
          const sampleData = getSampleDataByPosition(position);
          allPlayers.push(...sampleData);
        }
      }

      // Determine data source and status
      if (hasApiData) {
        setDataSource('api');
        setCacheStatus('fresh');
        setLastUpdated(new Date().toLocaleTimeString());
      } else if (hasCacheData) {
        setDataSource('cache');
        setCacheStatus(overallCacheStatus);
        // Use the most recent cache timestamp
        const cacheTimestamps = ALL_POSITIONS
          .map(pos => dataCache.get(pos, scoringFormatParam)?.timestamp)
          .filter(Boolean) as number[];
        
        if (cacheTimestamps.length > 0) {
          const mostRecent = Math.max(...cacheTimestamps);
          setLastUpdated(new Date(mostRecent).toLocaleTimeString());
        }
      } else {
        // All sample data
        setDataSource('sample');
        setCacheStatus('missing');
        setLastUpdated('Sample data');
        setError('Using sample data - API unavailable');
      }

      // Sort all players by average rank
      allPlayers.sort((a, b) => {
        const aRank = parseFloat(a.averageRank?.toString() || "999");
        const bRank = parseFloat(b.averageRank?.toString() || "999");
        return aRank - bRank;
      });

      setPlayers(allPlayers);
      
    } catch (loadError) {
      console.error('Failed to load all fantasy data:', loadError);
      
      // Try to use any available cached data
      const allCachedPlayers: Player[] = [];
      let hasAnyCachedData = false;

      for (const position of ALL_POSITIONS) {
        const cachedData = dataCache.get(position, scoringFormatParam);
        if (cachedData) {
          allCachedPlayers.push(...cachedData.data);
          hasAnyCachedData = true;
        } else {
          // Add sample data for missing positions
          const sampleData = getSampleDataByPosition(position);
          allCachedPlayers.push(...sampleData);
        }
      }

      if (hasAnyCachedData) {
        allCachedPlayers.sort((a, b) => {
          const aRank = parseFloat(a.averageRank?.toString() || "999");
          const bRank = parseFloat(b.averageRank?.toString() || "999");
          return aRank - bRank;
        });
        
        setPlayers(allCachedPlayers);
        setDataSource('cache');
        setError('Using cached data - refresh failed');
      } else {
        // Final fallback to all sample data
        const allSampleData: Player[] = [];
        for (const position of ALL_POSITIONS) {
          allSampleData.push(...getSampleDataByPosition(position));
        }
        
        allSampleData.sort((a, b) => {
          const aRank = parseFloat(a.averageRank?.toString() || "999");
          const bRank = parseFloat(b.averageRank?.toString() || "999");
          return aRank - bRank;
        });
        
        setPlayers(allSampleData);
        setDataSource('sample');
        setLastUpdated('Sample data');
        setError('Using sample data - all sources failed');
      }
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [scoringFormatParam, fetchPositionFromAPI]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await loadAllData(true);
  }, [loadAllData]);

  /**
   * Clear cache for all positions
   */
  const clearCache = useCallback(() => {
    ALL_POSITIONS.forEach(position => {
      dataCache.remove(position, scoringFormatParam);
    });
    setCacheStatus('missing');
    // Reload data after clearing cache
    loadAllData(true);
  }, [scoringFormatParam, loadAllData]);

  /**
   * Get cache information for UI display (aggregate across all positions)
   */
  const getCacheInfo = useCallback(() => {
    // Check cache status across all positions
    const statuses = ALL_POSITIONS.map(pos => dataCache.getStatus(pos, scoringFormatParam));
    
    if (statuses.every(status => status === 'fresh')) {
      return { status: 'fresh' as CacheStatus, message: 'Data is fresh', color: 'green' };
    } else if (statuses.some(status => status === 'fresh')) {
      return { status: 'stale' as CacheStatus, message: 'Mixed cache status', color: 'yellow' };
    } else if (statuses.some(status => status === 'stale')) {
      return { status: 'stale' as CacheStatus, message: 'Data needs refresh', color: 'yellow' };
    } else {
      return { status: 'missing' as CacheStatus, message: 'No cached data', color: 'red' };
    }
  }, [scoringFormatParam]);

  /**
   * Setup auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const setupAutoRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        // Check if any position needs refreshing
        const needsRefresh = ALL_POSITIONS.some(pos => 
          dataCache.needsRefresh(pos, scoringFormatParam)
        );

        if (needsRefresh) {
          loadAllData(false); // Background refresh, don't force
        }
        setupAutoRefresh(); // Setup next refresh
      }, refreshInterval);
    };

    setupAutoRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [scoringFormatParam, autoRefresh, refreshInterval, loadAllData]);

  /**
   * Load data when scoring format changes
   */
  useEffect(() => {
    loadAllData(false);
  }, [scoringFormatParam, loadAllData]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      isRefreshingRef.current = false;
    };
  }, []);

  return {
    players,
    isLoading,
    error,
    dataSource,
    cacheStatus,
    lastUpdated,
    refresh,
    clearCache,
    getCacheInfo
  };
}