import { NextRequest, NextResponse } from 'next/server';
import { fantasyProsSession } from '@/lib/fantasyProsSession';
import { dataManager } from '@/lib/dataManager';
import { Position } from '@/types';
import { apiRateLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rateLimit';

// Verify the request is from a legitimate cron job
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn('CRON_SECRET not set in environment');
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = apiRateLimiter.check(clientId);
  
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    success: true,
    positions: {},
    errors: []
  };

  try {
    // Get current week
    const currentWeek = fantasyProsSession.getCurrentWeek();
    
    // Positions to update
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'FLEX', 'OVERALL'];
    
    // Update each position
    for (const position of positions) {
      try {
        console.log(`Updating ${position} rankings...`);
        
        // Fetch rankings for each scoring format
        const scoringFormats = ['ppr', 'half-ppr', 'standard'];
        const positionResults: Record<string, any> = {};
        
        for (const format of scoringFormats) {
          try {
            const rankings = await fantasyProsSession.getRankings(position, currentWeek, format);
            
            if (rankings.length > 0) {
              // Store in data manager
              dataManager.setPlayersByPosition(position, rankings);
              
              // Store in persistent storage
              await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/data-manager`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  position: position,
                  players: rankings,
                  action: 'set',
                  source: 'fantasypros-session',
                  scoringFormat: format,
                  week: currentWeek
                })
              });
              
              positionResults[format] = {
                count: rankings.length,
                updated: true
              };
            }
          } catch (formatError) {
            console.error(`Error updating ${position} ${format}:`, formatError);
            positionResults[format] = {
              error: formatError instanceof Error ? formatError.message : 'Unknown error',
              updated: false
            };
          }
        }
        
        results.positions[position] = positionResults;
      } catch (positionError) {
        console.error(`Error updating ${position}:`, positionError);
        results.errors.push({
          position,
          error: positionError instanceof Error ? positionError.message : 'Unknown error'
        });
      }
    }
    
    // Calculate execution time
    const executionTime = Date.now() - startTime;
    results.executionTimeMs = executionTime;
    
    // Log results
    console.log('Scheduled update completed:', {
      timestamp: results.timestamp,
      executionTime: `${executionTime}ms`,
      success: results.errors.length === 0
    });
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Scheduled update failed:', error);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime
    }, { status: 500 });
  }
}

// GET endpoint for testing/monitoring
export async function GET(request: NextRequest) {
  // Verify cron secret for GET as well
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: 'ready',
    currentWeek: fantasyProsSession.getCurrentWeek(),
    nextUpdateTime: getNextUpdateTime(),
    environment: {
      hasCredentials: !!(process.env.FANTASYPROS_USERNAME && process.env.FANTASYPROS_PASSWORD),
      hasCronSecret: !!process.env.CRON_SECRET
    }
  });
}

// Helper function to calculate next update time (midnight PST)
function getNextUpdateTime(): string {
  const now = new Date();
  const pst = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  
  // Set to midnight PST
  const nextUpdate = new Date(pst);
  nextUpdate.setHours(0, 0, 0, 0);
  
  // If it's already past midnight, set to tomorrow
  if (pst >= nextUpdate) {
    nextUpdate.setDate(nextUpdate.getDate() + 1);
  }
  
  return nextUpdate.toISOString();
}