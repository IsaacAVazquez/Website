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

// Request deduplication to prevent multiple simultaneous API calls
const activeRequests = new Map<string, Promise<Player[] | null>>();

function getRequestKey(position: Position, scoringFormat: string): string {
  return `${position}:${scoringFormat}`;
}

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
  const scoringFormatRef = useRef<string>('');

  const scoringFormatParam = convertScoringFormat(scoringFormat);
  
  // Update ref when scoring format changes
  useEffect(() => {
    scoringFormatRef.current = scoringFormatParam;
  }, [scoringFormatParam]);

  /**
   * Fetch data from NFLverse API for a specific position with request deduplication
   * Updated to use modern /api/fantasy-data endpoint
   */
  const fetchPositionFromAPI = useCallback(async (position: Position): Promise<Player[] | null> => {
    const requestKey = getRequestKey(position, scoringFormatRef.current);

    // If there's already an active request for this data, return it
    if (activeRequests.has(requestKey)) {
      return activeRequests.get(requestKey)!;
    }

    // Create new request
    const requestPromise = (async () => {
      try {
        // Convert scoring format to API format
        const apiScoringFormat = scoringFormatRef.current
          .replace('half-ppr', 'HALF_PPR')
          .replace('ppr', 'PPR')
          .replace('standard', 'STANDARD')
          .toUpperCase();

        const response = await fetch(
          `/api/fantasy-data?position=${position}&scoring=${apiScoringFormat}`
        );

        if (!response.ok) {
          throw new Error(`NFLverse API request failed for ${position}: ${response.status}`);
        }

        const data = await response.json();

        // NFLverse API returns data in { success, players, metadata } format
        if (data.success && data.players && data.players.length > 0) {
          // Cache the fresh data for this position
          dataCache.set(position, scoringFormatRef.current, data.players, 'nflverse');
          return data.players;
        }

        return null;
      } catch (apiError) {
        console.warn(`NFLverse API fetch failed for ${position}:`, apiError);
        return null;
      } finally {
        // Clean up the active request
        activeRequests.delete(requestKey);
      }
    })();

    // Store the active request
    activeRequests.set(requestKey, requestPromise);

    return requestPromise;
  }, []); // Now stable since using ref

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
        const currentCacheStatus = dataCache.getStatus(position, scoringFormatRef.current);
        
        // Update overall cache status (use the worst status)
        if (currentCacheStatus === 'missing') {
          overallCacheStatus = 'missing';
        } else if (currentCacheStatus === 'stale' && overallCacheStatus === 'fresh') {
          overallCacheStatus = 'stale';
        }

        // Try to get cached data first
        const cachedData = dataCache.get(position, scoringFormatRef.current);
        
        if (cachedData && !forceRefresh && dataCache.isFresh(position, scoringFormatRef.current)) {
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
          .map(pos => dataCache.get(pos, scoringFormatRef.current)?.timestamp)
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
        const cachedData = dataCache.get(position, scoringFormatRef.current);
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
  }, [scoringFormatParam]); // Removed fetchPositionFromAPI to prevent infinite loops

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
      dataCache.remove(position, scoringFormatRef.current);
    });
    setCacheStatus('missing');
    // Reload data after clearing cache
    loadAllData(true);
  }, [loadAllData]);

  /**
   * Get cache information for UI display (aggregate across all positions)
   */
  const getCacheInfo = useCallback(() => {
    // Check cache status across all positions
    const statuses = ALL_POSITIONS.map(pos => dataCache.getStatus(pos, scoringFormatRef.current));
    
    if (statuses.every(status => status === 'fresh')) {
      return { status: 'fresh' as CacheStatus, message: 'Data is fresh', color: 'green' };
    } else if (statuses.some(status => status === 'fresh')) {
      return { status: 'stale' as CacheStatus, message: 'Mixed cache status', color: 'yellow' };
    } else if (statuses.some(status => status === 'stale')) {
      return { status: 'stale' as CacheStatus, message: 'Data needs refresh', color: 'yellow' };
    } else {
      return { status: 'missing' as CacheStatus, message: 'No cached data', color: 'red' };
    }
  }, []);

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
          dataCache.needsRefresh(pos, scoringFormatRef.current)
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
  }, [autoRefresh, refreshInterval, loadAllData]);

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