import { NextRequest, NextResponse } from 'next/server';
import { fantasyProsSession } from '@/lib/fantasyProsSession';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Authenticate
    fantasyProsSession.setCredentials(username, password);
    const sessionData = await fantasyProsSession.authenticate();

    // Try the preseason QB URL to see actual data format
    const testUrl = 'https://www.fantasypros.com/nfl/rankings/qb-cheatsheets.php?export=xls';
    
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': sessionData.cookies,
        'Referer': 'https://www.fantasypros.com/nfl/rankings/'
      }
    });

    const text = await response.text();

    // Look for data tables or JSON in the HTML
    const patterns = [
      { name: 'Table data', regex: new RegExp('<table[^>]*>(.*?)</table>', 'gs') },
      { name: 'Player data JSON', regex: /var\s+ecrData\s*=\s*(\{.*?\});/g },
      { name: 'Rankings data', regex: /rankings['"]\s*:\s*(\[.*?\])/g },
      { name: 'Player rows', regex: /<tr[^>]*class="[^"]*player[^"]*"[^>]*>(.*?)<\/tr>/g }
    ];

    const findings: any = {};

    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern.regex));
      findings[pattern.name] = {
        found: matches.length > 0,
        count: matches.length,
        samples: matches.slice(0, 2).map(m => m[0].substring(0, 200) + '...')
      };
    }

    // Look for any tab-separated or CSV-like data
    const lines = text.split('\n');
    const tabSeparatedLines = lines.filter(line => 
      line.includes('\t') && 
      (line.includes('QB') || line.includes('RB') || line.toLowerCase().includes('rank'))
    );

    // Look for script tags with data
    const scriptRegex = new RegExp('<script[^>]*>(.*?)</script>', 'gs');
    const scriptTags = Array.from(text.matchAll(scriptRegex))
      .map(match => match[1])
      .filter(script => 
        script.includes('player') || 
        script.includes('ranking') || 
        script.includes('data')
      )
      .slice(0, 3)
      .map(script => script.substring(0, 300) + '...');

    return NextResponse.json({
      success: true,
      url: testUrl,
      responseStatus: response.status,
      contentLength: text.length,
      isHtml: text.includes('<!DOCTYPE html>'),
      findings,
      tabSeparatedLines: tabSeparatedLines.slice(0, 5),
      relevantScripts: scriptTags,
      htmlPreview: text.substring(0, 2000) + '...'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}