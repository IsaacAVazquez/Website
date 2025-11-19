/**
 * Unified Fantasy Data Hook
 * Replaces complex multi-hook system with single, reliable data fetching
 * Uses new unified API endpoints for consistent data access
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Position, ScoringFormat } from '@/types';
import { logger } from '@/lib/logger';

export interface TierData {
  position: Position;
  scoringFormat: ScoringFormat;
  players: Player[];
  tierBreaks: number[];
  totalTiers: number;
  algorithm: string;
  metadata: {
    timestamp: string;
    dataSource: string;
    playerCount: number;
    executionTimeMs: number;
    cacheHit: boolean;
  };
}

export interface UseUnifiedFantasyDataOptions {
  position?: Position;
  scoringFormat: ScoringFormat;
  autoRefresh?: boolean;
  refreshInterval?: number;
  withTiers?: boolean;
  preferredMethod?: 'api' | 'free' | 'session' | 'auto';
  enhancedData?: boolean; // Enable enhanced player data with projections and analysis
}

export interface UseUnifiedFantasyDataResult {
  // Data
  players: Player[];
  tierData: TierData | null;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Metadata
  dataSource: string;
  lastUpdated: string;
  executionTime: number;
  cacheHit: boolean;
  
  // Actions
  refresh: () => Promise<void>;
  refreshTiers: () => Promise<void>;
  
  // Status helpers
  getDataStatus: () => {
    status: 'loading' | 'success' | 'error' | 'empty';
    message: string;
    color: string;
  };
}

// Request deduplication map
const activeRequests = new Map<string, Promise<any>>();

function generateRequestKey(position: Position | undefined, scoringFormat: ScoringFormat, withTiers: boolean): string {
  const pos = position || 'all';
  return `${pos}:${scoringFormat}:${withTiers ? 'tiers' : 'data'}`;
}

export function useUnifiedFantasyData({
  position,
  scoringFormat,
  autoRefresh = false,
  refreshInterval = 10 * 60 * 1000, // 10 minutes
  withTiers = false,
  preferredMethod = 'auto',
  enhancedData = false
}: UseUnifiedFantasyDataOptions): UseUnifiedFantasyDataResult {
  
  // State
  const [players, setPlayers] = useState<Player[]>([]);
  const [tierData, setTierData] = useState<TierData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Metadata
  const [dataSource, setDataSource] = useState<string>('unknown');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [cacheHit, setCacheHit] = useState<boolean>(false);
  
  // Refs for managing state
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef<boolean>(false);

  /**
   * Fetch player data from unified API
   */
  const fetchPlayerData = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    const requestKey = generateRequestKey(position, scoringFormat, false);
    
    // Check for existing request
    if (activeRequests.has(requestKey) && !forceRefresh) {
      try {
        await activeRequests.get(requestKey);
        return;
      } catch (error) {
        // If existing request failed, continue with new request
        activeRequests.delete(requestKey);
      }
    }

    // Create new request
    const requestPromise = (async () => {
      try {
        const params = new URLSearchParams({
          scoring: scoringFormat,
          ...(position && { position }),
          ...(forceRefresh && { refresh: 'true' }),
          ...(preferredMethod !== 'auto' && { method: preferredMethod }),
          ...(enhancedData && { enhanced: 'true' }),
          ...(position ? {} : { all: 'true' }) // Get all positions if no specific position
        });

        const response = await fetch(`/api/fantasy-data?${params}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'API request failed');
        }

        return data;

      } finally {
        activeRequests.delete(requestKey);
      }
    })();

    activeRequests.set(requestKey, requestPromise);
    
    try {
      const data = await requestPromise;
      
      if (position) {
        // Single position data
        setPlayers(data.players || []);
        setDataSource(data.metadata?.source || 'unknown');
        // Always show current time when data is successfully fetched
        setLastUpdated(new Date().toLocaleString());
        setExecutionTime(data.metadata?.executionTimeMs || 0);
        setCacheHit(data.metadata?.cacheHit || false);
        
      } else {
        // All positions data - combine all players
        const allPlayers: Player[] = [];
        let primarySource = 'unknown';
        let latestTimestamp = '';
        let totalExecutionTime = 0;
        let anyCacheHit = false;

        if (data.data) {
          Object.values(data.data).forEach((positionData: any) => {
            if (positionData.players) {
              allPlayers.push(...positionData.players);
              if (positionData.metadata) {
                if (!latestTimestamp || positionData.metadata.timestamp > latestTimestamp) {
                  latestTimestamp = positionData.metadata.timestamp;
                  primarySource = positionData.metadata.dataSource;
                }
                totalExecutionTime += positionData.metadata.executionTimeMs || 0;
                anyCacheHit = anyCacheHit || positionData.metadata.cacheHit;
              }
            }
          });
        }

        // Sort combined players by average rank
        allPlayers.sort((a, b) => {
          const aRank = parseFloat(a.averageRank?.toString() || '999');
          const bRank = parseFloat(b.averageRank?.toString() || '999');
          return aRank - bRank;
        });

        setPlayers(allPlayers);
        setDataSource(primarySource);
        // Always show current time when data is successfully fetched
        setLastUpdated(new Date().toLocaleString());
        setExecutionTime(totalExecutionTime);
        setCacheHit(anyCacheHit);
      }

      setError(null);
      logger.info(`Fetched ${players.length} players for ${position || 'all positions'} ${scoringFormat}`);
      
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Failed to fetch player data';
      setError(errorMessage);
      setDataSource('error');
      logger.error(`Failed to fetch player data: ${errorMessage}`);
      throw fetchError;
    }
  }, [position, scoringFormat, preferredMethod]);

  /**
   * Fetch tier data from unified API
   * NOTE: /api/draft-tiers endpoint has been removed
   */
  const fetchTierData = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    // Tier calculation API has been removed - tiers are now calculated client-side
    setTierData(null);
    return;

    /* DEPRECATED: /api/draft-tiers endpoint removed
    if (!position) {
      // Can't calculate tiers for all positions combined
      setTierData(null);
      return;
    }

    const requestKey = generateRequestKey(position, scoringFormat, true);

    // Check for existing request
    if (activeRequests.has(requestKey) && !forceRefresh) {
      try {
        await activeRequests.get(requestKey);
        return;
      } catch (error) {
        activeRequests.delete(requestKey);
      }
    }

    // Create new request
    const requestPromise = (async () => {
      try {
        const params = new URLSearchParams({
          position,
          scoring: scoringFormat,
          ...(forceRefresh && { refresh: 'true' })
        });

        const response = await fetch(`/api/draft-tiers?${params}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Tier calculation failed');
        }

        return data.data;

      } finally {
        activeRequests.delete(requestKey);
      }
    })();

    activeRequests.set(requestKey, requestPromise);

    try {
      const tierResult = await requestPromise;
      setTierData(tierResult);
      logger.info(`Calculated ${tierResult.totalTiers} tiers for ${tierResult.playerCount} ${position} players`);

    } catch (tierError) {
      const errorMessage = tierError instanceof Error ? tierError.message : 'Failed to fetch tier data';
      logger.error(`Failed to fetch tier data: ${errorMessage}`);
      // Don't set error state for tier failures - player data might still be valid
    }
    */
  }, [position, scoringFormat]);

  /**
   * Main data loading function
   */
  const loadData = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    if (isRefreshingRef.current && !forceRefresh) {
      return;
    }

    setIsLoading(true);
    setError(null);
    isRefreshingRef.current = true;

    try {
      // Always fetch player data first
      await fetchPlayerData(forceRefresh);
      
      // Fetch tier data if requested
      if (withTiers) {
        await fetchTierData(forceRefresh);
      }
      
    } catch (loadError) {
      // Error is already set in fetchPlayerData
      logger.error('Data loading failed:', loadError);
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [fetchPlayerData, fetchTierData, withTiers]);

  /**
   * Manual refresh functions
   */
  const refresh = useCallback(async (): Promise<void> => {
    await loadData(true);
  }, [loadData]);

  const refreshTiers = useCallback(async (): Promise<void> => {
    if (!withTiers || !position) return;
    
    setIsLoading(true);
    try {
      await fetchTierData(true);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTierData, withTiers, position]);

  /**
   * Get data status for UI display
   */
  const getDataStatus = useCallback(() => {
    if (isLoading) {
      return { status: 'loading' as const, message: 'Loading fantasy data...', color: 'blue' };
    }
    
    if (error) {
      return { status: 'error' as const, message: error, color: 'red' };
    }
    
    if (players.length === 0) {
      return { status: 'empty' as const, message: 'No player data available', color: 'gray' };
    }
    
    const freshness = cacheHit ? 'cached' : 'fresh';
    return { 
      status: 'success' as const, 
      message: `${players.length} players loaded (${freshness}, ${dataSource})`, 
      color: 'green' 
    };
  }, [isLoading, error, players.length, cacheHit, dataSource]);

  /**
   * Auto-refresh setup
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const setupAutoRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        loadData(false); // Background refresh
        setupAutoRefresh(); // Setup next refresh
      }, refreshInterval);
    };

    setupAutoRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, loadData]);

  /**
   * Initial data load and dependency updates
   */
  useEffect(() => {
    loadData(false);
  }, [position, scoringFormat, withTiers, preferredMethod]);

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
    // Data
    players,
    tierData,
    
    // State
    isLoading,
    error,
    
    // Metadata
    dataSource,
    lastUpdated,
    executionTime,
    cacheHit,
    
    // Actions
    refresh,
    refreshTiers,
    
    // Helpers
    getDataStatus
  };
}