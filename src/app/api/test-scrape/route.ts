import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const testUrl = 'https://www.fantasypros.com/nfl/rankings/half-point-ppr-rb-cheatsheets.php';
  
  try {
    console.log('Testing scrape of:', testUrl);
    
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: `HTTP ${response.status}: ${response.statusText}`,
        success: false 
      });
    }

    const html = await response.text();
    const htmlLength = html.length;
    
    // Check what we actually got
    const hasContent = html.includes('running') || html.includes('RB') || html.includes('player');
    const hasJavaScript = html.includes('ecrData') || html.includes('var ') || html.includes('rankings');
    const hasTable = html.includes('<table') || html.includes('<tr') || html.includes('player-row');
    
    // Try to extract some sample data
    const sampleData = [];
    
    // Look for player names in the HTML
    const playerRegex = /([A-Z][a-z]+\s+[A-Z][a-z]+)\s*.*?([A-Z]{2,3})/g;
    let match;
    let count = 0;
    
    while ((match = playerRegex.exec(html)) !== null && count < 10) {
      const name = match[1];
      const team = match[2];
      
      if (name && team && 
          !name.includes('Fantasy') && 
          !name.includes('NFL') &&
          name.length > 3) {
        sampleData.push({ name, team, rank: count + 1 });
        count++;
      }
    }
    
    return NextResponse.json({
      success: true,
      url: testUrl,
      htmlLength,
      hasContent,
      hasJavaScript,
      hasTable,
      samplePlayers: sampleData,
      rawHtmlPreview: html.substring(0, 1000) + '...'
    });
    
  } catch (error) {
    console.error('Test scrape error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    });
  }
}