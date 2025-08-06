import { NextRequest, NextResponse } from 'next/server';
import { fantasyProsFreeAccess } from '@/lib/fantasyProsAlternative';
import { dataManager } from '@/lib/dataManager';
import { Position } from '@/types';

/**
 * @deprecated This endpoint is deprecated. Use /api/fantasy-data instead.
 * This endpoint will be removed in a future version.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const position = searchParams.get('position') as Position;
  const scoringFormat = searchParams.get('scoringFormat') || 'ppr';

  try {
    if (position) {
      // Get rankings for specific position
      const rankings = await fantasyProsFreeAccess.getPublicRankings(position, scoringFormat);
      
      if (rankings.length > 0) {
        // Store in data manager
        dataManager.setPlayersByPosition(position, rankings);
        
        // Also store in persistent API storage
        try {
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/data-manager`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              position: position,
              players: rankings,
              action: 'set',
              source: 'fantasypros-free',
              scoringFormat: scoringFormat
            })
          });
        } catch (storageError) {
          console.error('Failed to store in persistent storage:', storageError);
          // Don't fail the request if storage fails
        }
        
        return NextResponse.json({
          success: true,
          players: rankings,
          position,
          source: 'fantasypros-free',
          message: `Found ${rankings.length} ${position} players from public rankings`
        });
      } else {
        return NextResponse.json({
          success: false,
          players: [],
          error: 'No players found in public rankings',
          note: 'Try using the session-based approach with login credentials'
        });
      }
    } else {
      // Get all positions
      const allRankings = await fantasyProsFreeAccess.getAllPublicRankings(scoringFormat);
      
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
                source: 'fantasypros-free',
                scoringFormat: scoringFormat
              })
            });
          } catch (storageError) {
            console.error(`Failed to store ${pos} in persistent storage:`, storageError);
            // Don't fail the request if storage fails
          }
        }
      }

      const totalPlayers = Object.values(allRankings).reduce(
        (sum, players) => sum + players.length, 
        0
      );

      if (totalPlayers > 0) {
        return NextResponse.json({
          success: true,
          allRankings,
          totalPlayers,
          source: 'fantasypros-free',
          message: `Found ${totalPlayers} total players from public rankings`
        });
      } else {
        return NextResponse.json({
          success: false,
          allRankings: {},
          totalPlayers: 0,
          error: 'No players found in public rankings',
          note: 'FantasyPros may require authentication. Try the session-based approach.'
        });
      }
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'Failed to access public rankings. FantasyPros may have changed their structure.'
    }, { status: 500 });
  }
}