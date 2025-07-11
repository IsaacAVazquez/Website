import { NextRequest, NextResponse } from 'next/server';
import { fantasyProsSession } from '@/lib/fantasyProsSession';
import { dataManager } from '@/lib/dataManager';
import { Position } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, position, week, scoringFormat = 'ppr' } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Set credentials
    fantasyProsSession.setCredentials(username, password);

    // If position is specified, get rankings for that position
    if (position) {
      try {
        const rankings = await fantasyProsSession.getRankings(
          position as Position, 
          week,
          scoringFormat
        );

        // Store in both data manager and persistent storage
        if (rankings.length > 0) {
          dataManager.setPlayersByPosition(position as Position, rankings);
          
          // Also store in persistent API storage
          try {
            await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/data-manager`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                position: position,
                players: rankings,
                action: 'set',
                source: 'fantasypros-session',
                scoringFormat: scoringFormat
              })
            });
          } catch (storageError) {
            console.error('Failed to store in persistent storage:', storageError);
            // Don't fail the request if storage fails
          }
        }

        return NextResponse.json({
          success: true,
          players: rankings,
          position,
          week: week || fantasyProsSession.getCurrentWeek(),
          source: 'fantasypros-session'
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get rankings',
          note: 'Check your FantasyPros credentials'
        }, { status: 401 });
      }
    } else {
      // Get all positions
      try {
        const allRankings = await fantasyProsSession.getAllRankings(week, scoringFormat);
        
        // Store all in data manager and persistent storage
        for (const [pos, players] of Object.entries(allRankings)) {
          if (players.length > 0) {
            dataManager.setPlayersByPosition(pos as Position, players);
            
            // Also store in persistent API storage
            try {
              await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/data-manager`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  position: pos,
                  players: players,
                  action: 'set',
                  source: 'fantasypros-session',
                  scoringFormat: scoringFormat
                })
              });
            } catch (storageError) {
              console.error(`Failed to store ${pos} in persistent storage:`, storageError);
              // Don't fail the request if storage fails
            }
          }
        }

        // Calculate total players
        const totalPlayers = Object.values(allRankings).reduce(
          (sum, players) => sum + players.length, 
          0
        );

        return NextResponse.json({
          success: true,
          allRankings,
          totalPlayers,
          week: week || fantasyProsSession.getCurrentWeek(),
          source: 'fantasypros-session'
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get rankings',
          note: 'Check your FantasyPros credentials'
        }, { status: 401 });
      }
    }
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Server error' 
      },
      { status: 500 }
    );
  }
}

// Test authentication endpoint
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const test = searchParams.get('test');

  if (test === 'true') {
    return NextResponse.json({
      success: true,
      message: 'FantasyPros session endpoint is ready',
      supportedPositions: ['QB', 'RB', 'WR', 'TE', 'K', 'DST'],
      currentWeek: fantasyProsSession.getCurrentWeek(),
      note: 'Use POST with username and password to fetch rankings'
    });
  }

  return NextResponse.json({
    error: 'Use POST method with credentials to fetch rankings'
  }, { status: 405 });
}