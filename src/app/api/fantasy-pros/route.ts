import { NextRequest, NextResponse } from 'next/server';
import { fantasyProsAPI } from '@/lib/fantasyProsAPI';
import { dataManager } from '@/lib/dataManager';
import { Position } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const position = searchParams.get('position') as Position;
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const week = parseInt(searchParams.get('week') || '0');
  const scoring = (searchParams.get('scoring') || 'PPR') as 'STD' | 'PPR' | 'HALF';

  try {
    // Try to get rankings from FantasyPros API
    const rankings = await fantasyProsAPI.getConsensusRankings(year, week, scoring, position);
    
    if (rankings.length > 0) {
      // Store the fetched rankings in dataManager
      if (position) {
        dataManager.setPlayersByPosition(position, rankings);
      }

      return NextResponse.json({
        success: true,
        players: rankings,
        source: 'fantasypros-api',
        lastUpdated: new Date().toISOString()
      });
    } else {
      throw new Error('No data returned from FantasyPros API');
    }
  } catch (error) {
    console.error('FantasyPros API error:', error);
    
    // Fallback to local data
    const localPlayers = dataManager.getPlayersByPosition(position || 'QB');
    
    return NextResponse.json({
      success: false,
      players: localPlayers,
      source: 'local-cache',
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'Using cached data. To use live data, configure FANTASYPROS_API_KEY environment variable.'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Test the API key
    fantasyProsAPI.setApiKey(apiKey);
    const testRankings = await fantasyProsAPI.getConsensusRankings(
      new Date().getFullYear(),
      0,
      'PPR',
      'QB'
    );

    if (testRankings.length > 0) {
      // API key is valid, save it (in production, you'd save this securely)
      return NextResponse.json({
        success: true,
        message: 'API key validated successfully',
        samplePlayers: testRankings.slice(0, 5).map(p => ({
          name: p.name,
          team: p.team,
          rank: p.averageRank
        }))
      });
    } else {
      throw new Error('No data returned with this API key');
    }
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Invalid API key' 
      },
      { status: 400 }
    );
  }
}