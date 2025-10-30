/**
 * Server-Side Draft Tiers API
 * Consolidates tier calculation logic on the server for consistency
 * Similar to fftiers' approach of server-side processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedFantasyProsAPI } from '@/lib/unifiedFantasyProsAPI';
import { databaseManager } from '@/lib/database';
import { calculateTiers } from '@/lib/tierCalculator';
import { Position, ScoringFormat, Player } from '@/types';
import { fantasyRateLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

export interface TierResult {
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

export interface TierCalculationOptions {
  algorithm?: 'kmeans' | 'gaussian' | 'boris-chen' | 'auto';
  maxTiers?: number;
  minPlayersPerTier?: number;
  forceRefresh?: boolean;
  useDatabase?: boolean;
}

// Cache for computed tiers (in-memory cache with TTL)
const tierCache = new Map<string, { data: TierResult; expires: number }>();
const TIER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function generateCacheKey(position: Position, scoringFormat: ScoringFormat, options: TierCalculationOptions): string {
  const optionsKey = JSON.stringify(options);
  return `${position}-${scoringFormat}-${optionsKey}`;
}

function validateTierOptions(options: any): TierCalculationOptions {
  return {
    algorithm: options.algorithm || 'auto',
    maxTiers: Math.min(options.maxTiers || 12, 20), // Cap at 20 tiers
    minPlayersPerTier: Math.max(options.minPlayersPerTier || 2, 1), // Minimum 1 player per tier
    forceRefresh: Boolean(options.forceRefresh),
    useDatabase: options.useDatabase !== false // Default to true
  };
}

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = fantasyRateLimiter.check(clientId);
  
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  
  // Parse parameters
  const position = searchParams.get('position') as Position;
  const scoringFormat = (searchParams.get('scoring') || 'PPR') as ScoringFormat;
  const getAllPositions = searchParams.get('all') === 'true';
  
  // Parse tier calculation options
  const options = validateTierOptions({
    algorithm: searchParams.get('algorithm'),
    maxTiers: parseInt(searchParams.get('maxTiers') || '12'),
    minPlayersPerTier: parseInt(searchParams.get('minPlayersPerTier') || '2'),
    forceRefresh: searchParams.get('refresh') === 'true',
    useDatabase: searchParams.get('useDatabase') !== 'false'
  });

  // Validate position if provided
  if (position && !['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'FLEX', 'OVERALL'].includes(position)) {
    return NextResponse.json({
      success: false,
      error: 'Invalid position. Must be one of: QB, RB, WR, TE, K, DST, FLEX, OVERALL'
    }, { status: 400 });
  }

  try {
    // Initialize database if using database storage
    if (options.useDatabase) {
      await databaseManager.initialize();
    }

    if (getAllPositions) {
      // Calculate tiers for all positions
      const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
      const results: Record<Position, TierResult> = {} as Record<Position, TierResult>;

      // Process positions in parallel for better performance
      const tierPromises = positions.map(async (pos) => {
        const tierResult = await calculateTiersForPosition(pos, scoringFormat, options);
        return { position: pos, result: tierResult };
      });

      const settledResults = await Promise.allSettled(tierPromises);

      settledResults.forEach((settledResult, index) => {
        const position = positions[index];
        
        if (settledResult.status === 'fulfilled') {
          results[position] = settledResult.value.result;
        } else {
          // Create error result
          results[position] = {
            position,
            scoringFormat,
            players: [],
            tierBreaks: [],
            totalTiers: 0,
            algorithm: 'error',
            metadata: {
              timestamp: new Date().toISOString(),
              dataSource: 'error',
              playerCount: 0,
              executionTimeMs: 0,
              cacheHit: false
            }
          };
          logger.error(`Failed to calculate tiers for ${position}:`, settledResult.reason);
        }
      });

      // Calculate summary statistics
      const summary = {
        totalPlayers: Object.values(results).reduce((sum, result) => sum + result.players.length, 0),
        totalTiers: Object.values(results).reduce((sum, result) => sum + result.totalTiers, 0),
        successfulPositions: Object.values(results).filter(r => r.algorithm !== 'error').length,
        executionTimeMs: Date.now() - startTime
      };

      return NextResponse.json({
        success: true,
        data: results,
        summary,
        options
      });

    } else if (position) {
      // Single position tier calculation
      const tierResult = await calculateTiersForPosition(position, scoringFormat, options);
      
      return NextResponse.json({
        success: true,
        data: tierResult,
        options,
        executionTimeMs: Date.now() - startTime
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Either position parameter or all=true must be specified'
      }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Draft tiers calculation failed: ${errorMessage}`);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      executionTimeMs: Date.now() - startTime
    }, { status: 500 });
  }
}

// POST endpoint for cache management
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, position, scoringFormat } = body;

    switch (action) {
      case 'clear-cache':
        if (position && scoringFormat) {
          const options = validateTierOptions(body.options || {});
          const cacheKey = generateCacheKey(position, scoringFormat, options);
          tierCache.delete(cacheKey);
          
          return NextResponse.json({
            success: true,
            message: `Tier cache cleared for ${position} ${scoringFormat}`
          });
        } else {
          tierCache.clear();
          return NextResponse.json({
            success: true,
            message: 'All tier cache cleared'
          });
        }

      case 'cache-stats': {
        const now = Date.now();
        const validEntries = Array.from(tierCache.values()).filter(entry => entry.expires > now);
        const expiredEntries = tierCache.size - validEntries.length;

        return NextResponse.json({
          success: true,
          cacheStats: {
            totalEntries: tierCache.size,
            validEntries: validEntries.length,
            expiredEntries,
            oldestEntry: validEntries.length > 0 
              ? new Date(Math.min(...validEntries.map(e => e.expires - TIER_CACHE_TTL))).toISOString()
              : null
          }
        });
      }

      case 'warm-cache': {
        // Pre-calculate tiers for common combinations
        const positions: Position[] = ['QB', 'RB', 'WR', 'TE'];
        const formats: ScoringFormat[] = ['PPR', 'HALF', 'STD'];
        const warmupOptions = validateTierOptions(body.options || {});

        let warmedCount = 0;
        for (const pos of positions) {
          for (const format of formats) {
            try {
              await calculateTiersForPosition(pos, format, { ...warmupOptions, forceRefresh: false });
              warmedCount++;
            } catch (error) {
              logger.warn(`Failed to warm cache for ${pos} ${format}:`, error);
            }
          }
        }

        return NextResponse.json({
          success: true,
          message: `Cache warmed for ${warmedCount} position/format combinations`
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: clear-cache, cache-stats, warm-cache'
        }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to calculate tiers for a single position
async function calculateTiersForPosition(
  position: Position,
  scoringFormat: ScoringFormat,
  options: TierCalculationOptions
): Promise<TierResult> {
  const startTime = Date.now();
  const cacheKey = generateCacheKey(position, scoringFormat, options);
  
  // Check cache first (unless forcing refresh)
  if (!options.forceRefresh) {
    const cached = tierCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      logger.info(`Using cached tiers for ${position} ${scoringFormat}`);
      return {
        ...cached.data,
        metadata: {
          ...cached.data.metadata,
          cacheHit: true
        }
      };
    }
  }

  let players: Player[] = [];
  let dataSource = 'unknown';

  try {
    // Try to get data from database first if enabled
    if (options.useDatabase) {
      const storedPlayers = await databaseManager.getPlayers(position, scoringFormat, { limit: 200 });
      
      if (storedPlayers.length > 0) {
        players = storedPlayers.map(sp => ({
          id: sp.player_id || sp.name,
          name: sp.name,
          team: sp.team || '',
          position: sp.position as Position,
          averageRank: sp.averageRank || '999',
          projectedPoints: sp.projectedPoints || 0,
          standardDeviation: sp.standardDeviation || '0',
          tier: sp.tier || 1,
          minRank: sp.minRank || sp.averageRank || '999',
          maxRank: sp.maxRank || sp.averageRank || '999',
          expertRanks: sp.expertRanks || [],
          byeWeek: sp.byeWeek,
          injuryStatus: sp.injuryStatus,
          opponent: sp.opponent
        }));
        dataSource = 'database';
        logger.info(`Loaded ${players.length} ${position} players from database`);
      }
    }

    // If no database data, fetch from unified API
    if (players.length === 0) {
      const fetchResult = await unifiedFantasyProsAPI.fetchPlayersData(position, scoringFormat, {
        forceRefresh: options.forceRefresh
      });
      
      players = fetchResult.players;
      dataSource = fetchResult.source;
      
      // Store in database if enabled and successful
      if (options.useDatabase && fetchResult.success && players.length > 0) {
        try {
          await databaseManager.storePlayers(position, scoringFormat, players, {
            source: fetchResult.source,
            week: 0,
            year: new Date().getFullYear()
          });
        } catch (dbError) {
          logger.warn('Failed to store players in database:', dbError);
          // Continue with tier calculation even if database storage fails
        }
      }
    }

    // Limit players for tier calculation (prevent too many tiers)
    const maxPlayers = Math.min(players.length, 150);
    const limitedPlayers = players.slice(0, maxPlayers);

    // Calculate tiers using the tier calculator
    const tiers = calculateTiers(limitedPlayers, scoringFormat as any, options.maxTiers);
    
    // Convert to expected format
    const tierCalculation = {
      players: limitedPlayers.map((player, index) => {
        const tier = tiers.find(t => t.players.some(p => p.id === player.id))?.tier || 1;
        return { ...player, tier };
      }),
      tierBreaks: tiers.map(t => t.maxRank),
      totalTiers: tiers.length,
      algorithm: options.algorithm || 'clustering'
    };

    const result: TierResult = {
      position,
      scoringFormat,
      players: tierCalculation.players,
      tierBreaks: tierCalculation.tierBreaks,
      totalTiers: tierCalculation.totalTiers,
      algorithm: tierCalculation.algorithm,
      metadata: {
        timestamp: new Date().toISOString(),
        dataSource,
        playerCount: tierCalculation.players.length,
        executionTimeMs: Date.now() - startTime,
        cacheHit: false
      }
    };

    // Cache the result
    tierCache.set(cacheKey, {
      data: result,
      expires: Date.now() + TIER_CACHE_TTL
    });

    logger.info(`Calculated ${result.totalTiers} tiers for ${result.playerCount} ${position} players using ${result.algorithm} algorithm`);
    return result;

  } catch (error) {
    logger.error(`Tier calculation failed for ${position} ${scoringFormat}:`, error);
    throw error;
  }
}

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  let removedCount = 0;
  
  for (const [key, value] of tierCache.entries()) {
    if (value.expires <= now) {
      tierCache.delete(key);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    logger.info(`Cleaned up ${removedCount} expired tier cache entries`);
  }
}, 5 * 60 * 1000); // Run every 5 minutes