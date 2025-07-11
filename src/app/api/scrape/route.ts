import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const position = searchParams.get('position');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  try {
    // Add more realistic headers for FantasyPros
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse the HTML and extract player data
    const players = parseFantasyProsData(html, position);
    
    return NextResponse.json({ players });
    
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ 
      error: 'Failed to scrape data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function parseFantasyProsData(html: string, position: string | null) {
  const players: any[] = [];
  
  try {
    // FantasyPros uses JavaScript to load data, but sometimes static data exists
    // Try multiple parsing strategies
    
    // Strategy 1: Look for JSON data embedded in the page
    const jsonDataRegex = new RegExp('var\\s+ecrData\\s*=\\s*(\\{.*?\\});', 's');
    const jsonMatch = html.match(jsonDataRegex);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (data.players) {
          data.players.forEach((player: any, index: number) => {
            players.push({
              name: player.player_name || player.name,
              team: player.player_team_id || player.team,
              position: position?.toUpperCase() || 'UNKNOWN',
              rank: player.rank_ecr || index + 1,
              projectedPoints: estimateProjectedPoints(position?.toUpperCase(), index + 1),
              source: 'fantasypros-json'
            });
          });
          return players;
        }
      } catch (e) {
        console.log('Failed to parse JSON data:', e);
      }
    }
    
    // Strategy 2: Look for table rows with different class patterns
    const tablePatterns = [
      /<tr[^>]*class="[^"]*player-row[^"]*"[^>]*>(.*?)<\/tr>/g,
      /<tr[^>]*data-player[^>]*>(.*?)<\/tr>/g,
      /<div[^>]*class="[^"]*player[^"]*"[^>]*>(.*?)<\/div>/g
    ];
    
    for (const pattern of tablePatterns) {
      let match;
      let index = 0;
      
      while ((match = pattern.exec(html)) !== null && index < 50) {
        const rowHtml = match[1];
        
        // Extract player name with more patterns
        const namePatterns = [
          /data-fp-player-name="([^"]+)"/,
          new RegExp('class="[^"]*player-label[^"]*"[^>]*>([^<]+)<'),
          new RegExp('class="[^"]*player-name[^"]*"[^>]*>([^<]+)<'),
          /<a[^>]*player[^>]*>([^<]+)<\/a>/,
          /<strong[^>]*>([A-Z][a-z]+ [A-Z][a-z]+)<\/strong>/,
          />([A-Z][a-z]+ [A-Z][a-z]+)\s*\(/
        ];
        
        let playerName = '';
        for (const namePattern of namePatterns) {
          const nameMatch = rowHtml.match(namePattern);
          if (nameMatch) {
            playerName = nameMatch[1].trim();
            break;
          }
        }
        
        // Extract team
        const teamPatterns = [
          /\(([A-Z]{2,4})\)/,
          /data-team="([A-Z]{2,4})"/,
          new RegExp('class="[^"]*team[^"]*"[^>]*>([A-Z]{2,4})<'),
          /&nbsp;([A-Z]{2,4})\s/
        ];
        
        let team = 'UNK';
        for (const teamPattern of teamPatterns) {
          const teamMatch = rowHtml.match(teamPattern);
          if (teamMatch) {
            team = teamMatch[1];
            break;
          }
        }
        
        if (playerName && playerName.length > 3) {
          players.push({
            name: playerName,
            team: team,
            position: position?.toUpperCase() || 'UNKNOWN',
            rank: index + 1,
            projectedPoints: estimateProjectedPoints(position?.toUpperCase(), index + 1),
            source: 'fantasypros-table'
          });
          
          index++;
        }
      }
      
      if (players.length > 0) break; // Found data, stop trying other patterns
    }
    
    // Strategy 3: Look for any pattern with player names and teams
    if (players.length === 0) {
      const nameTeamRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z']+)*)\s*[^\w]*([A-Z]{2,4})[^\w]/g;
      let match;
      let index = 0;
      const foundNames = new Set();
      
      while ((match = nameTeamRegex.exec(html)) !== null && index < 50) {
        const playerName = match[1].trim();
        const team = match[2];
        
        // Filter out common false positives
        if (playerName.length > 3 && 
            !foundNames.has(playerName) &&
            !playerName.includes('Fantasy') &&
            !playerName.includes('NFL') &&
            team.length <= 4) {
          
          foundNames.add(playerName);
          players.push({
            name: playerName,
            team: team,
            position: position?.toUpperCase() || 'UNKNOWN',
            rank: index + 1,
            projectedPoints: estimateProjectedPoints(position?.toUpperCase(), index + 1),
            source: 'fantasypros-regex'
          });
          
          index++;
        }
      }
    }
    
  } catch (error) {
    console.error('Error parsing HTML:', error);
  }
  
  return players.slice(0, 30); // Limit to top 30 players
}

function estimateProjectedPoints(position: string | undefined, rank: number): number {
  const basePoints: { [key: string]: number } = {
    'QB': 380,
    'RB': 300, 
    'WR': 260,
    'TE': 180,
    'K': 130,
    'DST': 135
  };
  
  const base = basePoints[position || 'QB'] || 200;
  return Math.round(base * Math.exp(-rank * 0.04));
}