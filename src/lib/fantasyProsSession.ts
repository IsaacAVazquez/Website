import { Player, Position } from '@/types';

interface FantasyProsCredentials {
  username: string;
  password: string;
}

interface SessionData {
  cookies: string;
  csrfToken: string;
}

export class FantasyProsSession {
  private credentials: FantasyProsCredentials | null = null;
  private sessionData: SessionData | null = null;
  private loginUrl = 'https://secure.fantasypros.com/accounts/login/';
  
  constructor(credentials?: FantasyProsCredentials) {
    // Use environment variables if no credentials provided
    this.credentials = credentials || {
      username: process.env.FANTASYPROS_USERNAME || '',
      password: process.env.FANTASYPROS_PASSWORD || ''
    };
  }

  setCredentials(username: string, password: string) {
    this.credentials = { username, password };
  }

  // Server-side authentication function
  async authenticate(): Promise<SessionData> {
    if (!this.credentials) {
      throw new Error('Credentials not set. Please provide username and password.');
    }

    try {
      // Step 1: Get login page and extract CSRF token
      const loginPageResponse = await fetch(this.loginUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!loginPageResponse.ok) {
        throw new Error(`Failed to fetch login page: ${loginPageResponse.status}`);
      }

      const loginPageHtml = await loginPageResponse.text();
      const cookies = loginPageResponse.headers.get('set-cookie') || '';
      
      // Try multiple patterns to extract CSRF token
      const csrfPatterns = [
        /name=['"]csrfmiddlewaretoken['"][^>]*value=['"]([^'"]+)['"]/,
        /name='csrfmiddlewaretoken'\s+value='([^']+)'/,
        /name="csrfmiddlewaretoken"\s+value="([^"]+)"/,
        /value=['"]([^'"]+)['"][^>]*name=['"]csrfmiddlewaretoken['"]/,
        /<input[^>]*csrfmiddlewaretoken[^>]*value=['"]([^'"]+)['"]/,
        /csrfmiddlewaretoken['"]\s*:\s*['"]([^'"]+)['"]/
      ];

      let csrfToken = '';
      for (const pattern of csrfPatterns) {
        const match = loginPageHtml.match(pattern);
        if (match) {
          csrfToken = match[1];
          break;
        }
      }

      if (!csrfToken) {
        // Debug: Log partial HTML to understand structure
        console.log('Login page HTML preview:', loginPageHtml.substring(0, 1000));
        throw new Error('Could not find CSRF token. FantasyPros may have changed their login structure.');
      }

      // Step 2: Submit login form
      const formData = new URLSearchParams({
        username: this.credentials.username,
        password: this.credentials.password,
        csrfmiddlewaretoken: csrfToken
      });

      const loginResponse = await fetch(this.loginUrl, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': cookies,
          'Referer': this.loginUrl,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Origin': 'https://secure.fantasypros.com',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        body: formData.toString(),
        redirect: 'manual' // Don't follow redirects automatically
      });

      // Check if login was successful
      if (loginResponse.status === 302) {
        // Successful login usually redirects
        const location = loginResponse.headers.get('location');
        const sessionCookies = loginResponse.headers.get('set-cookie') || cookies;
        
        // Check if redirect is to a success page (not back to login)
        if (location && !location.includes('login')) {
          this.sessionData = {
            cookies: sessionCookies,
            csrfToken
          };
          return this.sessionData;
        } else {
          throw new Error('Login failed. Redirected back to login page. Check credentials.');
        }
      } else if (loginResponse.status === 200) {
        // Check response content for success indicators
        const responseText = await loginResponse.text();
        if (responseText.includes('dashboard') || responseText.includes('logout') || !responseText.includes('error')) {
          const sessionCookies = loginResponse.headers.get('set-cookie') || cookies;
          this.sessionData = {
            cookies: sessionCookies,
            csrfToken
          };
          return this.sessionData;
        } else {
          throw new Error('Login failed. Invalid credentials or account issues.');
        }
      } else {
        throw new Error(`Login failed with status ${loginResponse.status}. Check credentials.`);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // Download XLS file for a specific position (Note: FLEX is handled separately in getRankings)
  async downloadRankingsXLS(
    position: string,
    week: number = 0,
    scoringFormat: string = 'ppr'
  ): Promise<string> {
    if (!this.sessionData) {
      await this.authenticate();
    }

    let url: string;
    
    if (week === 0) {
      // Preseason URLs with scoring format support
      const scoringPath = scoringFormat === 'standard' ? '' : 
                         scoringFormat === 'half-ppr' ? 'half-point-ppr-' : 
                         'ppr-';
      
      // Build URLs based on scoring format
      let preseasonUrls: Record<string, string>;
      
      if (scoringFormat === 'standard') {
        // Standard scoring URLs
        preseasonUrls = {
          'overall': 'https://www.fantasypros.com/nfl/rankings/consensus-cheatsheets.php',
          'qb': 'https://www.fantasypros.com/nfl/rankings/qb-cheatsheets.php',
          'rb': 'https://www.fantasypros.com/nfl/rankings/rb-cheatsheets.php',
          'wr': 'https://www.fantasypros.com/nfl/rankings/wr-cheatsheets.php',
          'te': 'https://www.fantasypros.com/nfl/rankings/te-cheatsheets.php',
          'k': 'https://www.fantasypros.com/nfl/rankings/k-cheatsheets.php',
          'dst': 'https://www.fantasypros.com/nfl/rankings/dst-cheatsheets.php'
        };
      } else if (scoringFormat === 'half-ppr') {
        // Half-PPR URLs
        preseasonUrls = {
          'overall': 'https://www.fantasypros.com/nfl/rankings/half-point-ppr-cheatsheets.php',
          'qb': 'https://www.fantasypros.com/nfl/rankings/qb-cheatsheets.php',
          'rb': 'https://www.fantasypros.com/nfl/rankings/half-point-ppr-rb-cheatsheets.php',
          'wr': 'https://www.fantasypros.com/nfl/rankings/half-point-ppr-wr-cheatsheets.php',
          'te': 'https://www.fantasypros.com/nfl/rankings/half-point-ppr-te-cheatsheets.php',
          'k': 'https://www.fantasypros.com/nfl/rankings/k-cheatsheets.php',
          'dst': 'https://www.fantasypros.com/nfl/rankings/dst-cheatsheets.php'
        };
      } else {
        // PPR URLs (default)
        preseasonUrls = {
          'overall': 'https://www.fantasypros.com/nfl/rankings/ppr-cheatsheets.php',
          'qb': 'https://www.fantasypros.com/nfl/rankings/qb-cheatsheets.php',
          'rb': 'https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php',
          'wr': 'https://www.fantasypros.com/nfl/rankings/ppr-wr-cheatsheets.php',
          'te': 'https://www.fantasypros.com/nfl/rankings/ppr-te-cheatsheets.php',
          'k': 'https://www.fantasypros.com/nfl/rankings/k-cheatsheets.php',
          'dst': 'https://www.fantasypros.com/nfl/rankings/dst-cheatsheets.php'
        };
      }
      url = preseasonUrls[position.toLowerCase()] || preseasonUrls['overall'];
    } else {
      // Weekly URLs with scoring format support
      // Note: Weekly rankings might use different URL patterns than cheatsheets
      if (position.toLowerCase() === 'overall') {
        // Overall consensus rankings for weekly
        if (scoringFormat === 'standard') {
          url = `https://www.fantasypros.com/nfl/rankings/consensus-cheatsheets.php?week=${week}`;
        } else if (scoringFormat === 'half-ppr') {
          url = `https://www.fantasypros.com/nfl/rankings/half-point-ppr-cheatsheets.php?week=${week}`;
        } else {
          url = `https://www.fantasypros.com/nfl/rankings/ppr-cheatsheets.php?week=${week}`;
        }
      } else if (position.toLowerCase() === 'qb' || position.toLowerCase() === 'k' || position.toLowerCase() === 'dst') {
        // QB, K and DST don't have scoring format variations
        url = `https://www.fantasypros.com/nfl/rankings/${position.toLowerCase()}.php`;
      } else {
        // RB, WR, TE use scoring format for weekly
        if (scoringFormat === 'standard') {
          url = `https://www.fantasypros.com/nfl/rankings/${position.toLowerCase()}.php`;
        } else if (scoringFormat === 'half-ppr') {
          url = `https://www.fantasypros.com/nfl/rankings/half-point-ppr-${position.toLowerCase()}.php`;
        } else {
          url = `https://www.fantasypros.com/nfl/rankings/ppr-${position.toLowerCase()}.php`;
        }
      }
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Cookie': this.sessionData!.cookies,
          'Referer': 'https://www.fantasypros.com/nfl/rankings/'
        }
      });

      if (!response.ok) {
        console.error(`[FantasyPros] Failed to download from ${url}: ${response.status}`);
        throw new Error(`Failed to download XLS: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('[FantasyPros] Download error for', position, scoringFormat, ':', error);
      throw error;
    }
  }

  // Parse HTML data to extract player rankings from embedded JSON
  async parseHTMLData(htmlContent: string, position: Position, scoringFormat?: string): Promise<Player[]> {
    try {
      // Look for the ecrData JSON variable in the HTML
      const ecrDataMatch = htmlContent.match(/var\s+ecrData\s*=\s*(\{.*?\});/);
      
      if (ecrDataMatch) {
        const ecrData = JSON.parse(ecrDataMatch[1]);
        
        if (ecrData.players && Array.isArray(ecrData.players)) {
          return ecrData.players.map((player: any, index: number) => {
            const rank = player.rank_ecr || player.pos_rank || index + 1;
            const avgRank = player.rank_ave || player.rank_ecr || rank;
            const stdDev = player.rank_std || Math.max(0.5, rank * 0.1);
            
            // For OVERALL rankings, extract the actual position from the player data
            let playerPosition: Position = position;
            if (position === 'OVERALL' && player.player_position_id) {
              playerPosition = this.mapPositionId(player.player_position_id);
            }
            
            return {
              id: `fp-${position}-${rank}`,
              name: player.player_name || player.name,
              team: player.player_team_id || player.team || 'FA',
              position: playerPosition,
              averageRank: avgRank,
              projectedPoints: this.estimateProjectedPoints(playerPosition, avgRank),
              standardDeviation: stdDev,
              tier: player.tier,
              minRank: player.rank_min,
              maxRank: player.rank_max,
              expertRanks: this.generateExpertRanks(avgRank, stdDev)
            };
          });
        }
      }

      // Fallback: try to parse as tab-separated data (original XLS format)
      return this.parseTabSeparatedData(htmlContent, position, scoringFormat);
      
    } catch (error) {
      console.error('[FantasyPros] Error parsing HTML data:', error);
      // Fallback to tab-separated parsing
      return this.parseTabSeparatedData(htmlContent, position, scoringFormat);
    }
  }

  // Fallback method for tab-separated data
  private parseTabSeparatedData(text: string, position: Position, scoringFormat?: string): Player[] {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Skip header lines (first 5 lines according to Python script)
    const dataLines = lines.slice(5);
    const players: Player[] = [];

    dataLines.forEach((line, index) => {
      const columns = line.split('\t');
      
      if (columns.length >= 8) {
        const rank = parseInt(columns[0]) || index + 1;
        const name = columns[1]?.trim() || '';
        
        // Determine player position and column structure
        let playerPosition: Position;
        let avgRank: number;
        let stdDev: number;
        let tier: number | undefined;
        
        if (position === 'OVERALL' || columns[2]?.match(/^(QB|RB|WR|TE|K|DST)$/)) {
          // Overall format: Rank | Name | Position | Team | ... | Avg | Std | Tier
          playerPosition = (columns[2] as Position) || position;
          avgRank = parseFloat(columns[7]) || rank;
          stdDev = parseFloat(columns[8]) || 1.0;
          tier = columns[9] ? parseInt(columns[9]) : undefined;
        } else {
          // Position-specific format: Rank | Name | Team | ... | Avg | Std | Tier
          playerPosition = position;
          avgRank = parseFloat(columns[6]) || rank;
          stdDev = parseFloat(columns[7]) || 1.0;
          tier = columns[8] ? parseInt(columns[8]) : undefined;
        }

        // Extract team from name (e.g., "Patrick Mahomes KC" -> team: "KC")
        const teamMatch = name.match(/\s+([A-Z]{2,3})$/);
        const team = teamMatch ? teamMatch[1] : 'FA';
        const cleanName = teamMatch ? name.replace(teamMatch[0], '') : name;

        if (cleanName && rank <= 300) { // Reasonable limit
          players.push({
            id: `fp-${position}-${rank}`,
            name: cleanName,
            team,
            position: playerPosition,
            averageRank: avgRank,
            projectedPoints: this.estimateProjectedPoints(playerPosition, avgRank),
            standardDeviation: stdDev,
            tier: tier,
            expertRanks: this.generateExpertRanks(avgRank, stdDev)
          });
        }
      }
    });

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

  private mapPositionId(positionId: string): Position {
    const upperPos = positionId.toUpperCase();
    switch (upperPos) {
      case 'QB': return 'QB';
      case 'RB': return 'RB';
      case 'WR': return 'WR';
      case 'TE': return 'TE';
      case 'K': return 'K';
      case 'DST':
      case 'DEF':
      case 'D/ST': return 'DST';
      default: return 'FLEX';
    }
  }

  private generateExpertRanks(avgRank: number, stdDev: number): number[] {
    const numExperts = 10;
    const ranks: number[] = [];
    
    // Ensure avgRank and stdDev are numbers
    const avgRankNum = typeof avgRank === 'string' ? parseFloat(avgRank) : avgRank;
    const stdDevNum = typeof stdDev === 'string' ? parseFloat(stdDev) : stdDev;
    
    for (let i = 0; i < numExperts; i++) {
      // Generate normally distributed ranks
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const rank = Math.round(avgRankNum + stdDevNum * z);
      ranks.push(Math.max(1, rank));
    }
    
    return ranks;
  }

  // Get current NFL week
  getCurrentWeek(): number {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // 2025 NFL season hasn't started yet, so use preseason/offseason
    if (currentYear >= 2025) {
      return 0; // Preseason/offseason
    }
    
    // For 2024 season (Sep 5, 2024 to Feb 2025)
    const startDate = new Date('2024-09-05');
    
    if (today < startDate) {
      return 0; // Preseason
    }
    
    // Calculate weeks since season start
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const calculatedWeek = Math.floor(daysDiff / 7) + 1;
    
    // Regular season is weeks 1-18, playoffs are 19-22
    if (calculatedWeek <= 18) {
      return calculatedWeek;
    } else if (calculatedWeek <= 22) {
      return calculatedWeek; // Playoff weeks
    } else {
      return 0; // Offseason
    }
  }

  // Main method to get rankings
  async getRankings(position: Position, week?: number, scoringFormat: string = 'ppr'): Promise<Player[]> {
    const currentWeek = week !== undefined ? week : this.getCurrentWeek();
    
    // Special handling for FLEX: Get OVERALL rankings and filter to RB/WR/TE only
    // This is more reliable than using FantasyPros' FLEX-specific endpoints
    if (position === 'FLEX') {
      console.log('[FantasyPros] FLEX requested - fetching OVERALL rankings and filtering to RB/WR/TE');
      try {
        // Fetch OVERALL rankings
        const htmlContent = await this.downloadRankingsXLS('overall', currentWeek, scoringFormat);
        const allPlayers = await this.parseHTMLData(htmlContent, 'OVERALL', scoringFormat);
        
        // Filter to only FLEX-eligible positions (RB, WR, TE)
        const flexPlayers = allPlayers.filter(player => {
          const pos = player.position.toUpperCase();
          return pos === 'RB' || pos === 'WR' || pos === 'TE';
        });
        
        console.log(`[FantasyPros] Filtered ${allPlayers.length} OVERALL players to ${flexPlayers.length} FLEX-eligible (RB/WR/TE)`);
        
        // Re-rank the filtered players
        flexPlayers.sort((a, b) => a.averageRank - b.averageRank);
        
        // Update IDs and return as FLEX
        return flexPlayers.map((player, index) => ({
          ...player,
          id: `fp-FLEX-${index + 1}`,
          position: player.position // Keep original position (RB/WR/TE)
        }));
      } catch (error) {
        console.error('[FantasyPros] Error getting FLEX rankings via OVERALL:', error);
        throw error;
      }
    }
    
    // Normal flow for non-FLEX positions
    try {
      const htmlContent = await this.downloadRankingsXLS(position.toLowerCase(), currentWeek, scoringFormat);
      return await this.parseHTMLData(htmlContent, position, scoringFormat);
    } catch (error) {
      console.error(`Error getting rankings for ${position}:`, error);
      throw error;
    }
  }

  // Get all positions rankings
  async getAllRankings(week?: number, scoringFormat: string = 'ppr'): Promise<Record<Position, Player[]>> {
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'FLEX', 'OVERALL'];
    const allRankings: Partial<Record<Position, Player[]>> = {};
    
    for (const position of positions) {
      try {
        allRankings[position] = await this.getRankings(position, week, scoringFormat);
      } catch (error) {
        console.error(`Failed to get ${position} rankings:`, error);
        allRankings[position] = [];
      }
    }
    
    return allRankings as Record<Position, Player[]>;
  }
}

// Export singleton instance
export const fantasyProsSession = new FantasyProsSession();