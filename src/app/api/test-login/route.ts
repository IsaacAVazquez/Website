import { NextRequest, NextResponse } from 'next/server';
import { fantasyProsSession } from '@/lib/fantasyProsSession';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Set credentials
    fantasyProsSession.setCredentials(username, password);

    // Get current week info
    const currentWeek = fantasyProsSession.getCurrentWeek();

    // Try to authenticate
    console.log('Testing authentication for user:', username);
    const sessionData = await fantasyProsSession.authenticate();

    // If authentication succeeds, try to get a small sample of data
    try {
      const sampleRankings = await fantasyProsSession.getRankings('QB', 0); // Try preseason
      
      return NextResponse.json({
        success: true,
        message: 'Authentication successful!',
        currentWeek,
        sessionInfo: {
          hasToken: !!sessionData.csrfToken,
          tokenPreview: sessionData.csrfToken?.substring(0, 10) + '...',
          hasCookies: !!sessionData.cookies
        },
        sampleData: {
          playersFound: sampleRankings.length,
          firstFewPlayers: sampleRankings.slice(0, 3).map(p => ({
            name: p.name,
            team: p.team,
            rank: p.averageRank
          }))
        }
      });
    } catch (dataError) {
      return NextResponse.json({
        success: true,
        message: 'Authentication successful, but data fetch failed',
        currentWeek,
        sessionInfo: {
          hasToken: !!sessionData.csrfToken,
          tokenPreview: sessionData.csrfToken?.substring(0, 10) + '...',
          hasCookies: !!sessionData.cookies
        },
        dataError: dataError instanceof Error ? dataError.message : 'Unknown data error'
      });
    }

  } catch (error) {
    console.error('Test login error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      currentWeek: fantasyProsSession.getCurrentWeek(),
      troubleshooting: {
        suggestion: 'Check if FantasyPros login page structure has changed',
        debugEndpoint: '/api/debug-fantasypros',
        possibleIssues: [
          'CSRF token format changed',
          'Login form fields changed',
          'New security measures added',
          'Account may need verification'
        ]
      }
    }, { status: 401 });
  }
}