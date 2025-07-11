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

    // Set credentials and authenticate
    fantasyProsSession.setCredentials(username, password);
    const sessionData = await fantasyProsSession.authenticate();
    const currentWeek = fantasyProsSession.getCurrentWeek();

    // Test different URL types to see what's available
    const testUrls = [
      {
        name: 'Preseason QB',
        url: 'https://www.fantasypros.com/nfl/rankings/qb-cheatsheets.php?export=xls'
      },
      {
        name: 'Weekly QB',
        url: 'https://www.fantasypros.com/nfl/rankings/qb.php?export=xls'
      },
      {
        name: 'Draft QB',
        url: 'https://www.fantasypros.com/nfl/rankings/qb.php?export=xls&week=0'
      },
      {
        name: 'PPR QB',
        url: 'https://www.fantasypros.com/nfl/rankings/ppr-qb.php?export=xls'
      }
    ];

    const results = [];

    for (const testUrl of testUrls) {
      try {
        const response = await fetch(testUrl.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cookie': sessionData.cookies,
            'Referer': 'https://www.fantasypros.com/nfl/rankings/'
          }
        });

        const data = await response.arrayBuffer();
        const text = new TextDecoder('utf-8').decode(data);
        const lines = text.split('\n').filter(line => line.trim());

        results.push({
          name: testUrl.name,
          url: testUrl.url,
          status: response.status,
          contentLength: data.byteLength,
          hasData: lines.length > 5,
          firstFewLines: lines.slice(0, 10),
          looksLikeData: text.includes('Rank') || text.includes('Player') || text.includes('QB')
        });
      } catch (error) {
        results.push({
          name: testUrl.name,
          url: testUrl.url,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful! Testing different URLs...',
      currentWeek,
      sessionInfo: {
        hasToken: !!sessionData.csrfToken,
        tokenPreview: sessionData.csrfToken?.substring(0, 10) + '...',
        hasCookies: !!sessionData.cookies
      },
      urlTests: results,
      recommendations: results
        .filter(r => r.looksLikeData && r.hasData)
        .map(r => `${r.name}: ${r.contentLength} bytes, ${r.firstFewLines?.length || 0} lines`)
    });

  } catch (error) {
    console.error('Detailed test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      currentWeek: fantasyProsSession.getCurrentWeek()
    }, { status: 401 });
  }
}