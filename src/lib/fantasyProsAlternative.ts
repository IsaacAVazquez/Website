import { Player, Position } from '@/types';

// Alternative approach: Try to access free rankings without authentication
export class FantasyProsFreeAccess {
  private baseUrl = 'https://www.fantasypros.com/nfl/rankings';

  // Try to scrape public rankings without authentication
  async getPublicRankings(position: Position, scoringFormat: string = 'ppr'): Promise<Player[]> {
    try {
      // Build URLs based on scoring format
      let urls: Record<string, string>;
      
      if (scoringFormat === 'standard') {
        urls = {
          'QB': `${this.baseUrl}/qb.php`,
          'RB': `${this.baseUrl}/rb.php`,
          'WR': `${this.baseUrl}/wr.php`,
          'TE': `${this.baseUrl}/te.php`,
          'K': `${this.baseUrl}/k.php`,
          'DST': `${this.baseUrl}/dst.php`,
          'FLEX': `${this.baseUrl}/flex.php`,
          'OVERALL': `${this.baseUrl}/consensus-cheatsheets.php`
        };
      } else if (scoringFormat === 'half-ppr') {
        urls = {
          'QB': `${this.baseUrl}/qb.php`,
          'RB': `${this.baseUrl}/half-point-ppr-rb.php`,
          'WR': `${this.baseUrl}/half-point-ppr-wr.php`,
          'TE': `${this.baseUrl}/half-point-ppr-te.php`,
          'K': `${this.baseUrl}/k.php`,
          'DST': `${this.baseUrl}/dst.php`,
          'FLEX': `${this.baseUrl}/half-point-ppr-flex.php`,
          'OVERALL': `${this.baseUrl}/half-point-ppr-cheatsheets.php`
        };
      } else {
        // PPR (default)
        urls = {
          'QB': `${this.baseUrl}/qb.php`,
          'RB': `${this.baseUrl}/ppr-rb.php`,
          'WR': `${this.baseUrl}/ppr-wr.php`,
          'TE': `${this.baseUrl}/ppr-te.php`,
          'K': `${this.baseUrl}/k.php`,
          'DST': `${this.baseUrl}/dst.php`,
          'FLEX': `${this.baseUrl}/ppr-flex.php`,
          'OVERALL': `${this.baseUrl}/ppr-cheatsheets.php`
        };
      }

      const url = urls[position];
      if (!url) {
        throw new Error(`Unsupported position: ${position}`);
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rankings: ${response.status}`);
      }

      const html = await response.text();
      return this.parseRankingsHTML(html, position);
    } catch (error) {
      console.error(`Error getting public rankings for ${position}:`, error);
      throw error;
    }
  }

  private parseRankingsHTML(html: string, position: Position): Player[] {
    const players: Player[] = [];
    
    try {
      // Look for ranking table data
      // FantasyPros typically uses tables with specific classes
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
          
          // Extract player data
          const player = this.extractPlayerFromRow(rowHtml, position, index + 1);
          if (player) {
            players.push(player);
            index++;
          }
        }
        
        if (players.length > 0) break; // Found data, stop trying other patterns
      }

      // If no table data found, try alternative parsing
      if (players.length === 0) {
        return this.parseAlternativeFormat(html, position);
      }

      return players;
    } catch (error) {
      console.error('Error parsing rankings HTML:', error);
      return [];
    }
  }

  private extractPlayerFromRow(rowHtml: string, position: Position, rank: number): Player | null {
    try {
      // Extract player name
      const namePatterns = [
        /data-fp-player-name="([^"]+)"/,
        /class="[^"]*player-label[^"]*"[^>]*>([^<]+)</,
        /class="[^"]*player-name[^"]*"[^>]*>([^<]+)</,
        /<a[^>]*>([A-Z][a-z]+ [A-Z][a-z]+)<\/a>/,
        /<strong[^>]*>([A-Z][a-z]+ [A-Z][a-z]+)<\/strong>/,
        />([A-Z][a-z]+ [A-Z][a-z]+)\s*\(/
      ];

      let playerName = '';
      for (const pattern of namePatterns) {
        const match = rowHtml.match(pattern);
        if (match) {
          playerName = match[1].trim();
          break;
        }
      }

      // Extract team
      const teamPatterns = [
        /\(([A-Z]{2,4})\)/,
        /data-team="([A-Z]{2,4})"/,
        /class="[^"]*team[^"]*"[^>]*>([A-Z]{2,4})</,
        /&nbsp;([A-Z]{2,4})\s/
      ];

      let team = 'FA';
      for (const pattern of teamPatterns) {
        const match = rowHtml.match(pattern);
        if (match) {
          team = match[1];
          break;
        }
      }

      // For OVERALL rankings, extract the actual position
      let actualPosition: Position = position;
      if (position === 'OVERALL') {
        const positionPatterns = [
          /data-position="([A-Z]+)"/,
          /class="[^"]*position[^"]*"[^>]*>([A-Z]+)</,
          />\s*(QB|RB|WR|TE|K|DST)\s*</,
          /\b(QB|RB|WR|TE|K|DST)\b/
        ];
        
        for (const pattern of positionPatterns) {
          const match = rowHtml.match(pattern);
          if (match) {
            const foundPos = match[1].toUpperCase();
            if (['QB', 'RB', 'WR', 'TE', 'K', 'DST'].includes(foundPos)) {
              actualPosition = foundPos as Position;
              break;
            }
          }
        }
      }

      // Extract rank if available
      const rankPatterns = [
        /rank[^>]*>(\d+)/i,
        /(\d+)\s*\./,
        /data-rank="(\d+)"/
      ];

      let actualRank = rank;
      for (const pattern of rankPatterns) {
        const match = rowHtml.match(pattern);
        if (match) {
          actualRank = parseInt(match[1]);
          break;
        }
      }

      if (playerName && playerName.length > 2) {
        return {
          id: `fp-free-${position}-${actualRank}`,
          name: playerName,
          team,
          position: actualPosition,
          averageRank: actualRank,
          projectedPoints: this.estimateProjectedPoints(actualPosition, actualRank),
          standardDeviation: Math.max(0.5, actualRank * 0.1),
          expertRanks: this.generateExpertRanks(actualRank)
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting player from row:', error);
      return null;
    }
  }

  private parseAlternativeFormat(html: string, position: Position): Player[] {
    const players: Player[] = [];
    
    // Look for JSON data in the page
    const jsonPatterns = [
      /var\s+players\s*=\s*(\[.*?\]);/,
      /var\s+rankings\s*=\s*(\[.*?\]);/,
      /"players"\s*:\s*(\[.*?\])/,
      /window\.__INITIAL_STATE__\s*=\s*({.*?});/
    ];

    for (const pattern of jsonPatterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          if (Array.isArray(data) && data.length > 0) {
            data.forEach((playerData, index) => {
              if (playerData.name || playerData.player_name) {
                // For OVERALL rankings, use player's actual position if available
                let playerPosition: Position = position;
                if (position === 'OVERALL' && (playerData.position || playerData.player_position_id)) {
                  const posStr = (playerData.position || playerData.player_position_id).toUpperCase();
                  if (['QB', 'RB', 'WR', 'TE', 'K', 'DST'].includes(posStr)) {
                    playerPosition = posStr as Position;
                  }
                }
                
                players.push({
                  id: `fp-json-${position}-${index + 1}`,
                  name: playerData.name || playerData.player_name,
                  team: playerData.team || playerData.team_abbr || 'FA',
                  position: playerPosition,
                  averageRank: playerData.rank || index + 1,
                  projectedPoints: this.estimateProjectedPoints(playerPosition, playerData.rank || index + 1),
                  standardDeviation: playerData.std_dev || 1.0,
                  tier: playerData.tier,
                  expertRanks: this.generateExpertRanks(playerData.rank || index + 1)
                });
              }
            });
            break;
          }
        } catch (e) {
          console.log('Failed to parse JSON data:', e);
        }
      }
    }

    return players;
  }

  private estimateProjectedPoints(position: Position, rank: number): number {
    const basePoints: Record<Position, number> = {
      'QB': 380,
      'RB': 300,
      'WR': 260,
      'TE': 180,
      'K': 130,
      'DST': 135,
      'FLEX': 260,
      'OVERALL': 260
    };

    const base = basePoints[position] || 200;
    return Math.round(base * Math.exp(-rank * 0.03));
  }

  private generateExpertRanks(avgRank: number): number[] {
    return Array.from({ length: 10 }, () => 
      Math.max(1, Math.round(avgRank + (Math.random() - 0.5) * 6))
    );
  }

  // Get all positions without authentication
  async getAllPublicRankings(scoringFormat: string = 'ppr'): Promise<Record<Position, Player[]>> {
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'FLEX'];
    const allRankings: Partial<Record<Position, Player[]>> = {};
    
    for (const position of positions) {
      try {
        allRankings[position] = await this.getPublicRankings(position, scoringFormat);
      } catch (error) {
        console.error(`Failed to get ${position} rankings:`, error);
        allRankings[position] = [];
      }
    }
    
    return allRankings as Record<Position, Player[]>;
  }
}

export const fantasyProsFreeAccess = new FantasyProsFreeAccess();