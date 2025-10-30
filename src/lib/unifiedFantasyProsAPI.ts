/**
 * Unified FantasyPros API Service
 * Consolidates 3 different approaches into one reliable service with fallback chain
 * Inspired by fftiers repository architecture
 */

import { Player, Position, ScoringFormat } from '@/types';
import { fantasyProsAPI } from './fantasyProsAPI';
import { fantasyProsFreeAccess } from './fantasyProsAlternative';
import { fantasyProsSession } from './fantasyProsSession';
import { convertScoringFormat } from './scoringFormatUtils';
import { logger } from './logger';
import { createOverallRankedPlayers, validateOverallRankings, calculateOverallRankings } from './overallValueCalculator';

export interface FetchResult {
  players: Player[];
  source: 'api' | 'free' | 'session' | 'sample';
  success: boolean;
  error?: string;
  metadata: {
    timestamp: string;
    position: Position;
    scoringFormat: string;
    playersCount: number;
  };
}

export interface UnifiedAPIOptions {
  forceRefresh?: boolean;
  timeoutMs?: number;
  preferredMethod?: 'api' | 'free' | 'session' | 'auto';
}

class UnifiedFantasyProsAPI {
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (similar to fftiers)
  
  // Cache to prevent duplicate requests (in-memory only)
  private readonly requestCache = new Map<string, { 
    data: FetchResult; 
    timestamp: number; 
  }>();

  /**
   * Primary method to fetch fantasy data with intelligent fallback
   * Follows fftiers pattern of trying multiple sources
   */
  async fetchPlayersData(
    position: Position, 
    scoringFormat: ScoringFormat,
    options: UnifiedAPIOptions = {}
  ): Promise<FetchResult> {
    const cacheKey = `${position}-${scoringFormat}`;
    const now = Date.now();
    
    // Check cache first (unless forcing refresh)
    if (!options.forceRefresh) {
      const cached = this.requestCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
        logger.info(`Using cached data for ${position} ${scoringFormat}`);
        return cached.data;
      }
    }

    const scoringParam = convertScoringFormat(scoringFormat);
    let lastError: string = '';

    // Determine fetch order based on preference
    const fetchMethods = this.getFetchOrder(options.preferredMethod);
    
    for (const method of fetchMethods) {
      try {
        logger.info(`Attempting ${method} for ${position} ${scoringFormat}`);
        
        const result = await this.fetchWithTimeout(
          () => this.executeFetch(method, position, scoringParam),
          options.timeoutMs || this.DEFAULT_TIMEOUT
        );

        if (result && result.players.length > 0) {
          const fetchResult: FetchResult = {
            players: result.players,
            source: method,
            success: true,
            metadata: {
              timestamp: new Date().toISOString(),
              position,
              scoringFormat: scoringParam,
              playersCount: result.players.length
            }
          };

          // Cache the successful result
          this.requestCache.set(cacheKey, {
            data: fetchResult,
            timestamp: now
          });

          logger.info(`Successfully fetched ${result.players.length} ${position} players via ${method}`);
          return fetchResult;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        lastError = errorMsg;
        logger.warn(`${method} failed for ${position}: ${errorMsg}`);
        continue;
      }
    }

    // All methods failed - return sample data
    logger.error(`All fetch methods failed for ${position} ${scoringFormat}. Last error: ${lastError}`);
    
    return {
      players: this.getSampleData(position, scoringParam),
      source: 'sample',
      success: false,
      error: `All data sources failed. Last error: ${lastError}`,
      metadata: {
        timestamp: new Date().toISOString(),
        position,
        scoringFormat: scoringParam,
        playersCount: 0
      }
    };
  }

  /**
   * Fetch all positions for a given scoring format
   * Similar to fftiers master.py approach
   */
  async fetchAllPositions(
    scoringFormat: ScoringFormat,
    options: UnifiedAPIOptions = {}
  ): Promise<Record<Position, FetchResult>> {
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    const results: Record<Position, FetchResult> = {} as Record<Position, FetchResult>;

    // Fetch all positions in parallel (like fftiers batch processing)
    const fetchPromises = positions.map(async (position) => {
      const result = await this.fetchPlayersData(position, scoringFormat, options);
      return { position, result };
    });

    const settledResults = await Promise.allSettled(fetchPromises);

    settledResults.forEach((settledResult, index) => {
      const position = positions[index];
      
      if (settledResult.status === 'fulfilled') {
        results[position] = settledResult.value.result;
      } else {
        // Create error result with sample data
        results[position] = {
          players: this.getSampleData(position, scoringParam),
          source: 'sample',
          success: false,
          error: settledResult.reason?.message || 'Fetch failed',
          metadata: {
            timestamp: new Date().toISOString(),
            position,
            scoringFormat: convertScoringFormat(scoringFormat),
            playersCount: 0
          }
        };
      }
    });

    return results;
  }

  /**
   * Fetch all positions and create properly weighted overall rankings
   * Fixes issue where K1 and DST1 rank too highly in overall view
   */
  async fetchOverallRankings(
    scoringFormat: ScoringFormat,
    options: UnifiedAPIOptions = {}
  ): Promise<FetchResult> {
    try {
      // Get all positional data
      const allPositions = await this.fetchAllPositions(scoringFormat, options);
      
      // Combine all players from all positions
      const allPlayers: Player[] = [];
      let primarySource = 'sample';
      let hasSuccessfulFetch = false;
      
      Object.entries(allPositions).forEach(([position, result]) => {
        if (result.success && result.players.length > 0) {
          allPlayers.push(...result.players);
          if (!hasSuccessfulFetch) {
            primarySource = result.source;
            hasSuccessfulFetch = true;
          }
        }
      });

      if (allPlayers.length === 0) {
        throw new Error('No players found from any position');
      }

      // Apply overall value calculation and re-ranking
      const properlyRankedPlayers = createOverallRankedPlayers(allPlayers, scoringFormat);
      
      // Validate rankings and log warnings
      const calculations = calculateOverallRankings(allPlayers, scoringFormat);
      const warnings = validateOverallRankings(calculations);
      if (warnings.length > 0) {
        logger.warn('Overall ranking validation warnings:', warnings);
      } else {
        logger.info('Overall rankings validated successfully');
      }

      logger.info(`Created overall rankings: ${properlyRankedPlayers.length} players, source: ${primarySource}`);
      
      return {
        players: properlyRankedPlayers,
        source: primarySource as 'api' | 'free' | 'session' | 'sample',
        success: true,
        metadata: {
          timestamp: new Date().toISOString(),
          position: 'OVERALL' as Position,
          scoringFormat: convertScoringFormat(scoringFormat),
          playersCount: properlyRankedPlayers.length
        }
      };

    } catch (error) {
      logger.error('Failed to create overall rankings:', error);
      
      // Fallback to sample data with proper overall rankings
      try {
        const samplePlayers = this.getSampleData('QB', convertScoringFormat(scoringFormat))
          .concat(this.getSampleData('RB', convertScoringFormat(scoringFormat)))
          .concat(this.getSampleData('WR', convertScoringFormat(scoringFormat)))
          .concat(this.getSampleData('TE', convertScoringFormat(scoringFormat)))
          .concat(this.getSampleData('K', convertScoringFormat(scoringFormat)))
          .concat(this.getSampleData('DST', convertScoringFormat(scoringFormat)));
        
        const rankedSamplePlayers = createOverallRankedPlayers(samplePlayers, scoringFormat);
        
        return {
          players: rankedSamplePlayers,
          source: 'sample',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            timestamp: new Date().toISOString(),
            position: 'OVERALL' as Position,
            scoringFormat: convertScoringFormat(scoringFormat),
            playersCount: rankedSamplePlayers.length
          }
        };
      } catch (sampleError) {
        logger.error('Failed to create sample overall rankings:', sampleError);
        
        return {
          players: [],
          source: 'sample',
          success: false,
          error: 'Failed to create overall rankings',
          metadata: {
            timestamp: new Date().toISOString(),
            position: 'OVERALL' as Position,
            scoringFormat: convertScoringFormat(scoringFormat),
            playersCount: 0
          }
        };
      }
    }
  }

  /**
   * Clear cache for specific position or all
   */
  clearCache(position?: Position, scoringFormat?: ScoringFormat): void {
    if (position && scoringFormat) {
      const key = `${position}-${scoringFormat}`;
      this.requestCache.delete(key);
      logger.info(`Cleared cache for ${position} ${scoringFormat}`);
    } else {
      this.requestCache.clear();
      logger.info('Cleared all fantasy data cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalCached: number; oldestEntry: string | null } {
    const entries = Array.from(this.requestCache.values());
    const oldestTimestamp = entries.length > 0 
      ? Math.min(...entries.map(e => e.timestamp))
      : null;
    
    return {
      totalCached: entries.length,
      oldestEntry: oldestTimestamp ? new Date(oldestTimestamp).toISOString() : null
    };
  }

  // Private helper methods

  private getFetchOrder(preferred?: string): Array<'api' | 'free' | 'session'> {
    const allMethods: Array<'api' | 'free' | 'session'> = ['api', 'session', 'free'];
    
    if (!preferred || preferred === 'auto') {
      // Default order: API (most reliable) → Session (good data) → Free (fallback)
      return allMethods;
    }
    
    if (preferred === 'api' || preferred === 'free' || preferred === 'session') {
      // Put preferred method first, then others
      const others = allMethods.filter(m => m !== preferred);
      return [preferred, ...others];
    }
    
    return allMethods;
  }

  private async executeFetch(
    method: 'api' | 'free' | 'session',
    position: Position,
    scoringFormat: string
  ): Promise<{ players: Player[] } | null> {
    const currentYear = new Date().getFullYear();
    
    switch (method) {
      case 'api': {
        if (!process.env.FANTASYPROS_API_KEY) {
          throw new Error('FANTASYPROS_API_KEY not configured');
        }
        const apiPlayers = await fantasyProsAPI.getConsensusRankings(
          currentYear,
          0,
          scoringFormat as 'STD' | 'PPR' | 'HALF',
          position
        );
        return { players: apiPlayers };
      }

      case 'session': {
        if (!process.env.FANTASYPROS_USERNAME || !process.env.FANTASYPROS_PASSWORD) {
          throw new Error('FantasyPros credentials not configured');
        }
        fantasyProsSession.setCredentials(
          process.env.FANTASYPROS_USERNAME,
          process.env.FANTASYPROS_PASSWORD
        );
        const sessionPlayers = await fantasyProsSession.getRankings(position, 0, scoringFormat);
        return { players: sessionPlayers };
      }

      case 'free': {
        const freePlayers = await fantasyProsFreeAccess.getPublicRankings(position, scoringFormat);
        return { players: freePlayers };
      }

      default:
        throw new Error(`Unknown fetch method: ${method}`);
    }
  }

  private async fetchWithTimeout<T>(
    fetchFn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fetchFn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  }

  /**
   * Fetch enhanced player data including projections, auction values, and expert analysis
   * This supplements basic rankings with detailed fantasy context
   */
  async fetchEnhancedPlayerData(
    position: Position,
    scoringFormat: ScoringFormat,
    options: UnifiedAPIOptions = {}
  ): Promise<FetchResult> {
    const baseData = await this.fetchPlayersData(position, scoringFormat, options);
    
    // Enhance players with additional data
    const enhancedPlayers = await Promise.all(
      baseData.players.map(async (player) => {
        return this.enhancePlayerWithDetails(player, scoringFormat);
      })
    );

    return {
      ...baseData,
      players: enhancedPlayers
    };
  }

  /**
   * Fetch enhanced data for all positions
   */
  async fetchAllPositionsEnhanced(
    scoringFormat: ScoringFormat,
    options: UnifiedAPIOptions = {}
  ): Promise<Record<Position, FetchResult>> {
    const baseResults = await this.fetchAllPositions(scoringFormat, options);
    
    // Enhance all players in all positions
    const enhancedResults: Record<Position, FetchResult> = {} as Record<Position, FetchResult>;
    
    for (const [position, result] of Object.entries(baseResults)) {
      if (result.success && result.players.length > 0) {
        const enhancedPlayers = await Promise.all(
          result.players.map(async (player) => {
            return this.enhancePlayerWithDetails(player, scoringFormat);
          })
        );
        
        enhancedResults[position as Position] = {
          ...result,
          players: enhancedPlayers
        };
      } else {
        enhancedResults[position as Position] = result;
      }
    }
    
    return enhancedResults;
  }

  /**
   * Enhance individual player with additional details
   */
  private async enhancePlayerWithDetails(player: Player, scoringFormat: ScoringFormat): Promise<Player> {
    try {
      // Calculate consensus level based on expert rank distribution
      const consensusLevel = this.calculateConsensusLevel(player.expertRanks);
      
      // Generate auction value based on position and rank
      const auctionValue = this.calculateAuctionValue(player, scoringFormat);
      
      // Generate projections based on position
      const projections = this.generatePositionProjections(player, scoringFormat);
      
      // Generate contextual descriptions (simplified for now, would call AI/external service in production)
      const context = this.generatePlayerContext(player);

      return {
        ...player,
        consensusLevel,
        auctionValue,
        projections,
        expertCount: player.expertRanks?.length || 0,
        upside: context.upside,
        downside: context.downside,
        bottomLine: context.bottomLine,
        byeWeek: this.getTeamByeWeek(player.team),
      };
    } catch (error) {
      logger.warn(`Failed to enhance player ${player.name}:`, error);
      return player;
    }
  }

  private calculateConsensusLevel(expertRanks: number[]): 'high' | 'medium' | 'low' {
    if (!expertRanks || expertRanks.length < 3) return 'low';
    
    const min = Math.min(...expertRanks);
    const max = Math.max(...expertRanks);
    const range = max - min;
    
    // Tight consensus if range is small relative to average
    if (range <= 10) return 'high';
    if (range <= 25) return 'medium';
    return 'low';
  }

  private calculateAuctionValue(player: Player, scoringFormat: ScoringFormat): number {
    const rank = typeof player.averageRank === 'string' ? 
                 parseFloat(player.averageRank) : player.averageRank;
    
    // Auction value algorithm based on position and rank
    // Higher values for top players, position scarcity adjustments
    const positionMultipliers: Record<Position, number> = {
      'QB': 0.85, // QBs typically less valuable in auction
      'RB': 1.2,  // RBs premium due to scarcity
      'WR': 1.0,  // WRs baseline
      'TE': 0.9,  // TEs less valuable except elite
      'K': 0.1,   // Kickers minimal value
      'DST': 0.1, // Defense minimal value
      'FLEX': 1.0,
      'OVERALL': 1.0
    };

    const baseValue = Math.max(1, 200 - (rank * 3)); // Higher for lower ranks
    const positionValue = baseValue * (positionMultipliers[player.position] || 1.0);
    
    // PPR scoring increases WR/RB receiving value
    const scoringMultiplier = (scoringFormat === 'PPR' && 
                              ['RB', 'WR', 'TE'].includes(player.position)) ? 1.1 : 1.0;
    
    return Math.round(positionValue * scoringMultiplier);
  }

  private generatePositionProjections(player: Player, scoringFormat: ScoringFormat) {
    const rank = typeof player.averageRank === 'string' ? 
                 parseFloat(player.averageRank) : player.averageRank;
    
    // Generate reasonable projections based on position and rank
    // This is simplified - in production would use historical data/ML models
    switch (player.position) {
      case 'QB':
        return {
          passingYards: Math.max(2000, 4500 - (rank * 100)),
          passingTDs: Math.max(10, 35 - (rank * 1.5)),
          interceptions: Math.max(5, 8 + (rank * 0.3)),
          rushingYards: Math.max(0, 500 - (rank * 20)),
          rushingTDs: Math.max(0, 8 - (rank * 0.5))
        };
        
      case 'RB':
        return {
          carries: Math.max(50, 300 - (rank * 8)),
          rushingYards: Math.max(200, 1500 - (rank * 40)),
          rushingTDs: Math.max(2, 15 - (rank * 0.4)),
          receptions: Math.max(10, 80 - (rank * 2)),
          receivingYards: Math.max(100, 800 - (rank * 20)),
          receivingTDs: Math.max(1, 8 - (rank * 0.2))
        };
        
      case 'WR':
        return {
          receptions: Math.max(30, 120 - (rank * 3)),
          receivingYards: Math.max(400, 1600 - (rank * 35)),
          receivingTDs: Math.max(2, 15 - (rank * 0.4)),
          targets: Math.max(40, 160 - (rank * 4)),
          targetShare: Math.max(0.1, 0.25 - (rank * 0.005))
        };
        
      case 'TE':
        return {
          receptions: Math.max(20, 100 - (rank * 4)),
          receivingYards: Math.max(250, 1200 - (rank * 40)),
          receivingTDs: Math.max(2, 12 - (rank * 0.5)),
          targets: Math.max(30, 130 - (rank * 5))
        };
        
      default:
        return {};
    }
  }

  private generatePlayerContext(player: Player): {
    upside: string;
    downside: string;
    bottomLine: string;
  } {
    const rank = typeof player.averageRank === 'string' ? 
                 parseFloat(player.averageRank) : player.averageRank;
    
    // Generate contextual descriptions based on rank and position
    const isElite = rank <= 12;
    const isGood = rank <= 36;
    const isDeep = rank > 100;

    let upside = '';
    let downside = '';
    let bottomLine = '';

    if (isElite) {
      upside = `Elite ${player.position} with proven track record and high floor/ceiling combination.`;
      downside = 'Injury risk and high expectations. Limited upside due to already elite status.';
      bottomLine = `Must-have player at ${player.position}. Draft with confidence in early rounds.`;
    } else if (isGood) {
      upside = `Solid ${player.position} with potential for top-tier production in favorable matchups.`;
      downside = 'Consistency concerns and potential for down weeks. Competition for targets/touches.';
      bottomLine = `Reliable option with upside. Good value in middle rounds.`;
    } else if (isDeep) {
      upside = `Deep sleeper with breakout potential if opportunity arises.`;
      downside = 'Limited opportunity and unproven production. High bust potential.';
      bottomLine = `Late-round flyer worth considering in deeper leagues.`;
    } else {
      upside = `Decent ${player.position} with weekly starter potential.`;
      downside = 'Limited ceiling and competition for playing time.';
      bottomLine = `Solid bench option with spot-start appeal.`;
    }

    return { upside, downside, bottomLine };
  }

  private getTeamByeWeek(team: string): number {
    // NFL 2024 bye weeks - would be updated annually
    const byeWeeks: Record<string, number> = {
      'ARI': 11, 'ATL': 12, 'BAL': 14, 'BUF': 12,
      'CAR': 11, 'CHI': 7, 'CIN': 12, 'CLE': 10,
      'DAL': 7, 'DEN': 14, 'DET': 9, 'GB': 10,
      'HOU': 14, 'IND': 14, 'JAX': 12, 'KC': 10,
      'LV': 10, 'LAC': 5, 'LAR': 6, 'MIA': 6,
      'MIN': 6, 'NE': 14, 'NO': 12, 'NYG': 11,
      'NYJ': 12, 'PHI': 5, 'PIT': 9, 'SF': 9,
      'SEA': 10, 'TB': 11, 'TEN': 5, 'WAS': 14
    };
    
    return byeWeeks[team] || 0;
  }

  private getSampleData(position: Position, scoringFormat: string = 'HALF'): Player[] {
    // Import sample data dynamically to avoid circular dependencies
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getSampleDataByPosition } = require('@/data/sampleData');
      // Convert scoring format to match sample data format
      const sampleFormat = scoringFormat === 'HALF' ? 'HALF_PPR' :
                          scoringFormat === 'PPR' ? 'PPR' : 'STD';
      return getSampleDataByPosition(position, sampleFormat as ScoringFormat);
    } catch (error) {
      logger.warn('Could not load sample data, returning empty array');
      return [];
    }
  }
}

// Export singleton instance
export const unifiedFantasyProsAPI = new UnifiedFantasyProsAPI();