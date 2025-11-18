/**
 * Unified Fantasy Data API Endpoint
 * Uses NFLverse/DynastyProcess open-source data
 * Replaces FantasyPros with free, open-source NFL data
 */

import { NextRequest, NextResponse } from 'next/server';
import { nflverseAPI } from '@/lib/nflverseAPI';
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
  const validFormats: ScoringFormat[] = ['PPR', 'HALF_PPR', 'STANDARD'];
  const normalizedFormat = format.toUpperCase().replace('HALF', 'HALF_PPR').replace('STD', 'STANDARD');
  return validFormats.includes(normalizedFormat as ScoringFormat);
}

// Normalize scoring format to match ScoringFormat type
function normalizeScoringFormat(format: string): ScoringFormat {
  const upper = format.toUpperCase();
  if (upper === 'HALF' || upper === 'HALF-PPR') return 'HALF_PPR';
  if (upper === 'STD' || upper === 'STANDARD') return 'STANDARD';
  if (upper === 'PPR') return 'PPR';
  return 'HALF_PPR'; // default
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
  const scoringFormatParam = searchParams.get('scoring') || 'PPR';
  const forceRefresh = searchParams.get('refresh') === 'true';
  const getAllPositions = searchParams.get('all') === 'true';

  // Validate and normalize scoring format
  if (!validateScoringFormat(scoringFormatParam)) {
    return NextResponse.json({
      success: false,
      error: 'Invalid scoring format. Must be one of: PPR, HALF_PPR, HALF, STANDARD, STD'
    }, { status: 400 });
  }

  const scoringFormat = normalizeScoringFormat(scoringFormatParam);

  try {
    if (getAllPositions) {
      // Fetch all positions separately
      logger.info(`Fetching all positions for ${scoringFormat} scoring from nflverse`);

      const allResults = await nflverseAPI.fetchAllPositions(scoringFormat);

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
          forceRefresh
        }
      };

      logger.info(`All positions fetch completed: ${totalPlayers} players, ${successfulFetches}/${positions.length} successful`);
      return NextResponse.json(response);

    } else {
      // Single position fetch
      if (!validatePosition(position)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or missing position. Must be one of: QB, RB, WR, TE, K, DST, FLEX, OVERALL'
        }, { status: 400 });
      }

      logger.info(`Fetching ${position} for ${scoringFormat} scoring from nflverse`);

      // Fetch data from nflverse
      const result = await nflverseAPI.fetchPlayersData(
        position as Position,
        scoringFormat
      );

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
          forceRefresh
        }
      };

      if (result.success) {
        logger.info(`Successfully fetched ${result.players.length} ${position} players from nflverse`);
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

// POST endpoint for cache management
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, position, scoringFormat } = body;

    switch (action) {
      case 'clear-cache':
        if (position && scoringFormat) {
          const normalizedFormat = normalizeScoringFormat(scoringFormat);
          nflverseAPI.clearCache(position, normalizedFormat);
          return NextResponse.json({
            success: true,
            message: `Cache cleared for ${position} ${normalizedFormat}`
          });
        } else {
          nflverseAPI.clearCache();
          return NextResponse.json({
            success: true,
            message: 'All cache cleared'
          });
        }

      case 'cache-stats': {
        const stats = nflverseAPI.getCacheStats();
        return NextResponse.json({
          success: true,
          cacheStats: stats
        });
      }

      case 'test-config': {
        // Test configuration - no API keys needed for nflverse
        const testResult = {
          dataSource: 'nflverse/DynastyProcess',
          requiresApiKey: false,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        };

        return NextResponse.json({
          success: true,
          config: testResult,
          message: 'NFLverse data source configured - no API keys required'
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
  const scoringFormatParam = searchParams.get('scoring');

  if (position && scoringFormatParam && validatePosition(position) && validateScoringFormat(scoringFormatParam)) {
    const scoringFormat = normalizeScoringFormat(scoringFormatParam);
    nflverseAPI.clearCache(position as Position, scoringFormat);
    return NextResponse.json({
      success: true,
      message: `Cache cleared for ${position} ${scoringFormat}`
    });
  } else {
    nflverseAPI.clearCache();
    return NextResponse.json({
      success: true,
      message: 'All fantasy data cache cleared'
    });
  }
}