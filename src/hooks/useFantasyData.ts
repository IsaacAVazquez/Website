import { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Position, ScoringFormat } from '@/types';
import { dataCache, CacheStatus } from '@/lib/dataCache';
import { convertScoringFormat } from '@/lib/scoringFormatUtils';
import { getSampleDataByPosition } from '@/data/sampleData';

export interface UseFantasyDataOptions {
  position: Position;
  scoringFormat: ScoringFormat;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseFantasyDataResult {
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

export function useFantasyData({
  position,
  scoringFormat,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000 // 5 minutes
}: UseFantasyDataOptions): UseFantasyDataResult {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'cache' | 'api' | 'sample'>('sample');
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>('missing');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Refs to prevent unnecessary re-renders
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const isRefreshingRef = useRef<boolean>(false);

  const scoringFormatParam = convertScoringFormat(scoringFormat);

  /**
   * Fetch data from API
   */
  const fetchFromAPI = useCallback(async (): Promise<Player[] | null> => {
    try {
      const response = await fetch(
        `/api/data-manager?position=${position}&dataset=fantasypros-session&scoringFormat=${scoringFormatParam}`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.players && data.players.length > 0) {
        // Cache the fresh data
        dataCache.set(position, scoringFormatParam, data.players, 'api');
        return data.players;
      }
      
      return null;
    } catch (apiError) {
      console.warn('API fetch failed:', apiError);
      return null;
    }
  }, [position, scoringFormatParam]);

  /**
   * Load data with cache-first strategy
   */
  const loadData = useCallback(async (forceRefresh: boolean = false) => {
    if (isRefreshingRef.current && !forceRefresh) {
      return;
    }

    setIsLoading(true);
    setError(null);
    isRefreshingRef.current = true;

    try {
      const currentCacheStatus = dataCache.getStatus(position, scoringFormatParam);
      setCacheStatus(currentCacheStatus);

      // Step 1: Try to get cached data
      const cachedData = dataCache.get(position, scoringFormatParam);
      
      if (cachedData && !forceRefresh) {
        // Use cached data immediately
        setPlayers(cachedData.data);
        setDataSource('cache');
        setLastUpdated(new Date(cachedData.timestamp).toLocaleTimeString());
        setIsLoading(false);

        // If data is fresh, we're done
        if (dataCache.isFresh(position, scoringFormatParam)) {
          isRefreshingRef.current = false;
          return;
        }
      }

      // Step 2: Try to fetch fresh data from API (background refresh)
      const apiData = await fetchFromAPI();
      
      if (apiData) {
        setPlayers(apiData);
        setDataSource('api');
        setLastUpdated(new Date().toLocaleTimeString());
        setCacheStatus('fresh');
      } else if (!cachedData) {
        // Step 3: Fallback to sample data if no cache and API failed
        const sampleData = getSampleDataByPosition(position);
        setPlayers(sampleData);
        setDataSource('sample');
        setLastUpdated('Sample data');
        setCacheStatus('missing');
        setError('Using sample data - API unavailable');
      }
      // If we have cached data but API failed, keep using cached data
      
    } catch (loadError) {
      console.error('Failed to load data:', loadError);
      
      // Try cached data as fallback
      const cachedData = dataCache.get(position, scoringFormatParam);
      if (cachedData) {
        setPlayers(cachedData.data);
        setDataSource('cache');
        setLastUpdated(new Date(cachedData.timestamp).toLocaleTimeString());
        setError('Using cached data - refresh failed');
      } else {
        // Final fallback to sample data
        const sampleData = getSampleDataByPosition(position);
        setPlayers(sampleData);
        setDataSource('sample');
        setLastUpdated('Sample data');
        setError('Using sample data - all sources failed');
      }
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [position, scoringFormatParam, fetchFromAPI]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  /**
   * Clear cache for current position/format
   */
  const clearCache = useCallback(() => {
    dataCache.remove(position, scoringFormatParam);
    setCacheStatus('missing');
    // Reload data after clearing cache
    loadData(true);
  }, [position, scoringFormatParam, loadData]);

  /**
   * Get cache information for UI display
   */
  const getCacheInfo = useCallback(() => {
    return dataCache.getStatusDisplay(position, scoringFormatParam);
  }, [position, scoringFormatParam]);

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
        // Only auto-refresh if data needs refreshing
        if (dataCache.needsRefresh(position, scoringFormatParam)) {
          loadData(false); // Background refresh, don't force
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
  }, [position, scoringFormatParam, autoRefresh, refreshInterval, loadData]);

  /**
   * Load data when position or scoring format changes
   */
  useEffect(() => {
    loadData(false);
  }, [position, scoringFormatParam, loadData]);

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

/**
 * Hook for managing cache across all positions and scoring formats
 */
export function useFantasyDataCache() {
  const [metadata, setMetadata] = useState(dataCache.getMetadata());

  const refreshMetadata = useCallback(() => {
    setMetadata(dataCache.getMetadata());
  }, []);

  const clearAllCache = useCallback(() => {
    dataCache.clear();
    refreshMetadata();
  }, [refreshMetadata]);

  const cleanupExpired = useCallback(() => {
    const removedCount = dataCache.cleanupExpired();
    refreshMetadata();
    return removedCount;
  }, [refreshMetadata]);

  const getCacheSize = useCallback(() => {
    return dataCache.getCacheSizeFormatted();
  }, []);

  const getAllEntries = useCallback(() => {
    return dataCache.getAllEntries();
  }, []);

  // Refresh metadata periodically
  useEffect(() => {
    const interval = setInterval(refreshMetadata, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [refreshMetadata]);

  return {
    metadata,
    refreshMetadata,
    clearAllCache,
    cleanupExpired,
    getCacheSize,
    getAllEntries
  };
}