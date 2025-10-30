/**
 * Unified Fantasy Data API Endpoint
 * Replaces fantasy-pros, fantasy-pros-free, and fantasy-pros-session
 * Inspired by fftiers repository's unified approach
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedFantasyProsAPI, UnifiedAPIOptions } from '@/lib/unifiedFantasyProsAPI';
import { Position, ScoringFormat } from '@/types';
import { fantasyRateLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

// Validate position parameter
function validatePosition(position: string | null): position is Position {
  if (!position) return false;
  const validPositions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'FLEX', 'OVERALL'];
  return validPositions.includes(position as Position);
}

// Validate scoring format parameter
function validateScoringFormat(format: string | null): format is ScoringFormat {
  if (!format) return false;
  const validFormats: ScoringFormat[] = ['PPR', 'HALF', 'STD'];
  return validFormats.includes(format.toUpperCase() as ScoringFormat);
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
  const position = searchParams.get('position');
  const scoringFormat = (searchParams.get('scoring') || 'PPR').toUpperCase();
  const forceRefresh = searchParams.get('refresh') === 'true';
  const preferredMethod = searchParams.get('method') as 'api' | 'free' | 'session' | 'auto' | null;
  const timeoutMs = parseInt(searchParams.get('timeout') || '10000');
  const getAllPositions = searchParams.get('all') === 'true';
  const enhancedData = searchParams.get('enhanced') === 'true';

  // Validate scoring format
  if (!validateScoringFormat(scoringFormat)) {
    return NextResponse.json({
      success: false,
      error: 'Invalid scoring format. Must be one of: PPR, HALF, STD'
    }, { status: 400 });
  }

  const options: UnifiedAPIOptions = {
    forceRefresh,
    timeoutMs: Math.min(timeoutMs, 30000), // Cap at 30 seconds
    preferredMethod: preferredMethod || 'auto'
  };

  try {
    if (getAllPositions) {
      // Check if this is specifically for OVERALL rankings (needs proper weighting)
      // This happens when position is undefined but we want overall rankings
      const isOverallRequest = !position; // No specific position means overall rankings
      
      if (isOverallRequest) {
        logger.info(`Fetching OVERALL rankings with proper position weighting for ${scoringFormat} scoring`);
        
        const overallResult = await unifiedFantasyProsAPI.fetchOverallRankings(
          scoringFormat as ScoringFormat,
          options
        );
        
        const response = {
          success: overallResult.success,
          players: overallResult.players,
          source: overallResult.source,
          metadata: overallResult.metadata,
          error: overallResult.error,
          options: {
            forceRefresh,
            preferredMethod: options.preferredMethod,
            timeoutMs: timeoutMs,
            enhancedData
          },
          executionTimeMs: Date.now() - startTime
        };
        
        logger.info(`OVERALL rankings completed: ${overallResult.players.length} players, source: ${overallResult.source}`);
        return NextResponse.json(response);
        
      } else {
        // Fetch all positions separately (for position-specific analysis)
        logger.info(`Fetching all positions separately for ${scoringFormat} scoring`);
        
        const allResults = enhancedData ? 
          await unifiedFantasyProsAPI.fetchAllPositionsEnhanced(
            scoringFormat as ScoringFormat,
            options
          ) :
          await unifiedFantasyProsAPI.fetchAllPositions(
            scoringFormat as ScoringFormat,
            options
          );
      
        // Calculate total players and success rate
      const positions = Object.keys(allResults);
      const totalPlayers = Object.values(allResults).reduce(
        (sum, result) => sum + result.players.length,
        0
      );
      const successfulFetches = Object.values(allResults).filter(r => r.success).length;
      
      // Determine overall success
      const overallSuccess = successfulFetches > 0;
      const primarySource = Object.values(allResults).find(r => r.success)?.source || 'sample';

      const response = {
        success: overallSuccess,
        data: allResults,
        summary: {
          totalPlayers,
          positionsCount: positions.length,
          successfulFetches,
          failedFetches: positions.length - successfulFetches,
          primarySource,
          scoringFormat,
          executionTimeMs: Date.now() - startTime
        },
        options: {
          forceRefresh,
          preferredMethod: options.preferredMethod,
          timeoutMs: timeoutMs
        }
      };

        logger.info(`All positions fetch completed: ${totalPlayers} players, ${successfulFetches}/${positions.length} successful`);
        return NextResponse.json(response);
      }

    } else {
      // Single position fetch
      if (!validatePosition(position)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or missing position. Must be one of: QB, RB, WR, TE, K, DST, FLEX, OVERALL'
        }, { status: 400 });
      }

      logger.info(`Fetching ${position} for ${scoringFormat} scoring`);

      let result;
      
      if (position === 'OVERALL') {
        // Handle OVERALL position with proper weighting
        result = await unifiedFantasyProsAPI.fetchOverallRankings(
          scoringFormat as ScoringFormat,
          options
        );
      } else {
        // Handle specific position
        result = enhancedData ? 
          await unifiedFantasyProsAPI.fetchEnhancedPlayerData(
            position as Position,
            scoringFormat as ScoringFormat,
            options
          ) : 
          await unifiedFantasyProsAPI.fetchPlayersData(
            position as Position,
            scoringFormat as ScoringFormat,
            options
          );
      }

      const response = {
        success: result.success,
        players: result.players,
        metadata: {
          ...result.metadata,
          executionTimeMs: Date.now() - startTime,
          source: result.source,
          error: result.error
        },
        options: {
          forceRefresh,
          preferredMethod: options.preferredMethod,
          timeoutMs: timeoutMs
        }
      };

      if (result.success) {
        logger.info(`Successfully fetched ${result.players.length} ${position} players via ${result.source}`);
      } else {
        logger.warn(`Failed to fetch ${position} data: ${result.error}`);
      }

      return NextResponse.json(response);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Fantasy data fetch failed: ${errorMessage}`);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        position: position || 'all',
        scoringFormat
      }
    }, { status: 500 });
  }
}

// POST endpoint for cache management and testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, position, scoringFormat, testConfig } = body;

    switch (action) {
      case 'clear-cache':
        if (position && scoringFormat) {
          unifiedFantasyProsAPI.clearCache(position, scoringFormat);
          return NextResponse.json({
            success: true,
            message: `Cache cleared for ${position} ${scoringFormat}`
          });
        } else {
          unifiedFantasyProsAPI.clearCache();
          return NextResponse.json({
            success: true,
            message: 'All cache cleared'
          });
        }

      case 'cache-stats': {
        const stats = unifiedFantasyProsAPI.getCacheStats();
        return NextResponse.json({
          success: true,
          cacheStats: stats
        });
      }

      case 'test-config': {
        // Test configuration without storing sensitive data
        const testResult = {
          hasApiKey: !!process.env.FANTASYPROS_API_KEY,
          hasCredentials: !!(process.env.FANTASYPROS_USERNAME && process.env.FANTASYPROS_PASSWORD),
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        };

        return NextResponse.json({
          success: true,
          config: testResult,
          message: 'Configuration check completed'
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: clear-cache, cache-stats, test-config'
        }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE endpoint for cache clearing (RESTful alternative)
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const position = searchParams.get('position');
  const scoringFormat = searchParams.get('scoring');

  if (position && scoringFormat && validatePosition(position) && validateScoringFormat(scoringFormat)) {
    unifiedFantasyProsAPI.clearCache(position as Position, scoringFormat as ScoringFormat);
    return NextResponse.json({
      success: true,
      message: `Cache cleared for ${position} ${scoringFormat}`
    });
  } else {
    unifiedFantasyProsAPI.clearCache();
    return NextResponse.json({
      success: true,
      message: 'All fantasy data cache cleared'
    });
  }
}