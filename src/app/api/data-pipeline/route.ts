/**
 * Unified Data Pipeline API
 * Replaces scattered update mechanisms with centralized pipeline
 * Similar to fftiers master.py orchestration approach
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedFantasyProsAPI } from '@/lib/unifiedFantasyProsAPI';
import { databaseManager } from '@/lib/database';
import { unifiedCache } from '@/lib/unifiedCache';
import { Position, ScoringFormat } from '@/types';
import { apiRateLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

export interface PipelineResult {
  success: boolean;
  executionId: string;
  startTime: string;
  endTime: string;
  totalDurationMs: number;
  summary: {
    totalPositions: number;
    successfulFetches: number;
    failedFetches: number;
    totalPlayersStored: number;
    cacheEntriesUpdated: number;
    databaseUpdated: boolean;
  };
  details: Array<{
    position: Position;
    scoringFormat: ScoringFormat;
    success: boolean;
    playerCount: number;
    source: string;
    durationMs: number;
    error?: string;
  }>;
  errors: string[];
}

// Verify the request is authorized (similar to fftiers cron protection)
function verifyAuthorization(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const pipelineSecret = process.env.PIPELINE_SECRET || process.env.CRON_SECRET;
  
  if (!pipelineSecret) {
    logger.warn('PIPELINE_SECRET not set in environment - allowing all requests in development');
    return process.env.NODE_ENV === 'development';
  }
  
  return authHeader === `Bearer ${pipelineSecret}`;
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = apiRateLimiter.check(clientId);
  
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  // Verify authorization
  if (!verifyAuthorization(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Pipeline secret required' },
      { status: 401 }
    );
  }

  const executionId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date();
  
  logger.info(`Data pipeline started: ${executionId}`);

  // Parse request options
  const body = await request.json().catch(() => ({}));
  const {
    positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'] as Position[],
    scoringFormats = ['PPR', 'HALF', 'STD'] as ScoringFormat[],
    forceRefresh = false,
    updateDatabase = true,
    updateCache = true,
    preferredMethod = 'auto'
  } = body;

  // Initialize result tracking
  const result: PipelineResult = {
    success: true,
    executionId,
    startTime: startTime.toISOString(),
    endTime: '',
    totalDurationMs: 0,
    summary: {
      totalPositions: positions.length * scoringFormats.length,
      successfulFetches: 0,
      failedFetches: 0,
      totalPlayersStored: 0,
      cacheEntriesUpdated: 0,
      databaseUpdated: false
    },
    details: [],
    errors: []
  };

  try {
    // Initialize database if updating database
    if (updateDatabase) {
      await databaseManager.initialize();
      result.summary.databaseUpdated = true;
    }

    // Process each position and scoring format combination
    // Similar to fftiers' systematic approach
    for (const position of positions) {
      for (const scoringFormat of scoringFormats) {
        const itemStartTime = Date.now();
        
        try {
          logger.info(`Processing ${position} ${scoringFormat}...`);

          // Fetch data using unified API
          const fetchResult = await unifiedFantasyProsAPI.fetchPlayersData(
            position,
            scoringFormat,
            {
              forceRefresh,
              preferredMethod: preferredMethod as any
            }
          );

          if (fetchResult.success && fetchResult.players.length > 0) {
            // Store in database if enabled
            if (updateDatabase) {
              await databaseManager.storePlayers(
                position,
                scoringFormat,
                fetchResult.players,
                {
                  source: fetchResult.source,
                  week: 0,
                  year: new Date().getFullYear()
                }
              );
            }

            // Update cache if enabled
            if (updateCache) {
              unifiedCache.setPlayers(position, scoringFormat, fetchResult.players, fetchResult.source);
              result.summary.cacheEntriesUpdated++;
            }

            // Record success
            result.details.push({
              position,
              scoringFormat,
              success: true,
              playerCount: fetchResult.players.length,
              source: fetchResult.source,
              durationMs: Date.now() - itemStartTime
            });

            result.summary.successfulFetches++;
            result.summary.totalPlayersStored += fetchResult.players.length;
            
            logger.info(`✅ ${position} ${scoringFormat}: ${fetchResult.players.length} players from ${fetchResult.source}`);

          } else {
            // Record failure
            const error = fetchResult.error || 'No players returned';
            result.details.push({
              position,
              scoringFormat,
              success: false,
              playerCount: 0,
              source: fetchResult.source,
              durationMs: Date.now() - itemStartTime,
              error
            });

            result.summary.failedFetches++;
            result.errors.push(`${position} ${scoringFormat}: ${error}`);
            
            logger.warn(`❌ ${position} ${scoringFormat}: ${error}`);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          result.details.push({
            position,
            scoringFormat,
            success: false,
            playerCount: 0,
            source: 'error',
            durationMs: Date.now() - itemStartTime,
            error: errorMessage
          });

          result.summary.failedFetches++;
          result.errors.push(`${position} ${scoringFormat}: ${errorMessage}`);
          
          logger.error(`💥 ${position} ${scoringFormat}: ${errorMessage}`);
        }

        // Add small delay between requests to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update overall success status
    result.success = result.summary.successfulFetches > 0;
    
    // Calculate final timing
    const endTime = new Date();
    result.endTime = endTime.toISOString();
    result.totalDurationMs = endTime.getTime() - startTime.getTime();

    // Log final summary
    const successRate = Math.round((result.summary.successfulFetches / result.summary.totalPositions) * 100);
    logger.info(`Data pipeline completed: ${executionId}`);
    logger.info(`Success: ${result.summary.successfulFetches}/${result.summary.totalPositions} (${successRate}%)`);
    logger.info(`Total players: ${result.summary.totalPlayersStored}, Duration: ${result.totalDurationMs}ms`);

    return NextResponse.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Pipeline execution failed';
    const endTime = new Date();
    
    result.success = false;
    result.endTime = endTime.toISOString();
    result.totalDurationMs = endTime.getTime() - startTime.getTime();
    result.errors.push(`Pipeline error: ${errorMessage}`);

    logger.error(`Data pipeline failed: ${executionId} - ${errorMessage}`);

    return NextResponse.json(result, { status: 500 });
  }
}

// GET endpoint for pipeline status and monitoring
export async function GET(request: NextRequest) {
  // Basic status check doesn't require full authorization
  const searchParams = request.nextUrl.searchParams;
  const includeStats = searchParams.get('stats') === 'true';

  try {
    const status = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    };

    if (includeStats) {
      // Get database stats if available
      let dbStats = null;
      try {
        await databaseManager.initialize();
        dbStats = await databaseManager.getStats();
      } catch (dbError) {
        logger.warn('Could not get database stats:', dbError);
      }

      // Get cache stats
      const cacheStats = unifiedCache.getStats();

      return NextResponse.json({
        ...status,
        stats: {
          database: dbStats,
          cache: cacheStats,
          configuration: {
            hasPipelineSecret: !!process.env.PIPELINE_SECRET,
            hasFantasyProsCreds: !!(process.env.FANTASYPROS_USERNAME && process.env.FANTASYPROS_PASSWORD),
            hasFantasyProsAPI: !!process.env.FANTASYPROS_API_KEY
          }
        }
      });
    }

    return NextResponse.json(status);

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE endpoint for cleaning up old data
export async function DELETE(request: NextRequest) {
  // Verify authorization for cleanup operations
  if (!verifyAuthorization(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Pipeline secret required' },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const daysToKeep = parseInt(searchParams.get('days') || '7');
  const clearCache = searchParams.get('clearCache') === 'true';

  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      actions: []
    };

    // Clear cache if requested
    if (clearCache) {
      const cacheStats = unifiedCache.getStats();
      unifiedCache.clear();
      results.actions.push({
        action: 'clear_cache',
        success: true,
        details: `Cleared ${cacheStats.totalEntries} cache entries`
      });
    }

    // Cleanup old database data
    try {
      await databaseManager.initialize();
      const removedDatasets = await databaseManager.cleanupOldData(daysToKeep);
      results.actions.push({
        action: 'cleanup_database',
        success: true,
        details: `Removed ${removedDatasets} old datasets (older than ${daysToKeep} days)`
      });
    } catch (dbError) {
      results.actions.push({
        action: 'cleanup_database',
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Database cleanup failed'
      });
    }

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}