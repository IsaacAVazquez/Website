import { useState, useEffect, useCallback, useRef } from 'react';
import { Player, ScoringFormat } from '@/types';
import { dataCache, CacheStatus } from '@/lib/dataCache';
import { convertScoringFormat } from '@/lib/scoringFormatUtils';
import { overallPlayers } from '@/data/overallData';
import { logger } from '@/lib/logger';

export interface UseOverallFantasyDataOptions {
  scoringFormat: ScoringFormat;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseOverallFantasyDataResult {
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

export function useOverallFantasyData({
  scoringFormat,
  autoRefresh = true,
  refreshInterval = 10 * 60 * 1000 // 10 minutes
}: UseOverallFantasyDataOptions): UseOverallFantasyDataResult {
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
   * Fetch overall data from API
   */
  const fetchOverallFromAPI = useCallback(async (): Promise<Player[] | null> => {
    try {
      const response = await fetch(
        `/api/data-manager?position=OVERALL&dataset=fantasypros-session&scoringFormat=${scoringFormatRef.current}`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed for OVERALL: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.players && data.players.length > 0) {
        // Cache the fresh data for overall position
        dataCache.set('OVERALL' as any, scoringFormatRef.current, data.players, 'api');
        return data.players;
      }
      
      return null;
    } catch (apiError) {
      logger.warn('API fetch failed for OVERALL:', apiError);
      return null;
    }
  }, []);

  /**
   * Load overall data with cache-first strategy
   */
  const loadOverallData = useCallback(async (forceRefresh: boolean = false) => {
    if (isRefreshingRef.current && !forceRefresh) {
      return;
    }

    setIsLoading(true);
    setError(null);
    isRefreshingRef.current = true;

    try {
      const currentCacheStatus = dataCache.getStatus('OVERALL' as any, scoringFormatRef.current);
      setCacheStatus(currentCacheStatus);

      // Try to get cached data first
      const cachedData = dataCache.get('OVERALL' as any, scoringFormatRef.current);
      
      if (cachedData && !forceRefresh && dataCache.isFresh('OVERALL' as any, scoringFormatRef.current)) {
        // Use fresh cached data
        setPlayers(cachedData.data);
        setDataSource('cache');
        setLastUpdated(new Date(cachedData.timestamp).toLocaleTimeString());
        setIsLoading(false);
        isRefreshingRef.current = false;
        return;
      }

      // Try to fetch fresh data from API
      const apiData = await fetchOverallFromAPI();
      
      if (apiData) {
        setPlayers(apiData);
        setDataSource('api');
        setLastUpdated(new Date().toLocaleTimeString());
        setCacheStatus('fresh');
      } else if (cachedData) {
        // Fall back to stale cached data
        setPlayers(cachedData.data);
        setDataSource('cache');
        setLastUpdated(new Date(cachedData.timestamp).toLocaleTimeString());
        setError('Using cached data - refresh failed');
      } else {
        // Fall back to sample overall data
        setPlayers(overallPlayers);
        setDataSource('sample');
        setLastUpdated('Sample data');
        setError('Using sample data - API unavailable');
      }
      
    } catch (loadError) {
      logger.error('Failed to load overall fantasy data:', loadError);
      
      // Try cached data as fallback
      const cachedData = dataCache.get('OVERALL' as any, scoringFormatRef.current);
      if (cachedData) {
        setPlayers(cachedData.data);
        setDataSource('cache');
        setLastUpdated(new Date(cachedData.timestamp).toLocaleTimeString());
        setError('Using cached data - refresh failed');
      } else {
        // Final fallback to sample data
        setPlayers(overallPlayers);
        setDataSource('sample');
        setLastUpdated('Sample data');
        setError('Using sample data - all sources failed');
      }
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [scoringFormatParam, fetchOverallFromAPI]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await loadOverallData(true);
  }, [loadOverallData]);

  /**
   * Clear cache for overall data
   */
  const clearCache = useCallback(() => {
    dataCache.remove('OVERALL' as any, scoringFormatRef.current);
    setCacheStatus('missing');
    // Reload data after clearing cache
    loadOverallData(true);
  }, [loadOverallData]);

  /**
   * Get cache information for UI display
   */
  const getCacheInfo = useCallback(() => {
    return dataCache.getStatusDisplay('OVERALL' as any, scoringFormatRef.current);
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
        // Check if overall data needs refreshing
        if (dataCache.needsRefresh('OVERALL' as any, scoringFormatRef.current)) {
          loadOverallData(false); // Background refresh, don't force
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
  }, [autoRefresh, refreshInterval, loadOverallData]);

  /**
   * Load data when scoring format changes
   */
  useEffect(() => {
    loadOverallData(false);
  }, [scoringFormatParam, loadOverallData]);

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