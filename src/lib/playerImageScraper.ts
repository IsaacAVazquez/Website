import fs from 'fs/promises';
import path from 'path';

export interface PlayerImageData {
  name: string;
  team: string;
  position: string;
  imageUrl?: string;
  localImagePath?: string;
}

export class PlayerImageScraper {
  private static readonly IMAGE_DIR = path.join(process.cwd(), 'public', 'player-images');
  private static readonly MAPPING_FILE = path.join(process.cwd(), 'src', 'data', 'player-images.json');
  
  // ESPN team abbreviations mapping
  private static readonly TEAM_MAPPING: Record<string, string> = {
    'ARI': 'cardinals', 'ATL': 'falcons', 'BAL': 'ravens', 'BUF': 'bills',
    'CAR': 'panthers', 'CHI': 'bears', 'CIN': 'bengals', 'CLE': 'browns',
    'DAL': 'cowboys', 'DEN': 'broncos', 'DET': 'lions', 'GB': 'packers',
    'HOU': 'texans', 'IND': 'colts', 'JAX': 'jaguars', 'KC': 'chiefs',
    'LV': 'raiders', 'LAC': 'chargers', 'LAR': 'rams', 'MIA': 'dolphins',
    'MIN': 'vikings', 'NE': 'patriots', 'NO': 'saints', 'NYG': 'giants',
    'NYJ': 'jets', 'PHI': 'eagles', 'PIT': 'steelers', 'SF': '49ers',
    'SEA': 'seahawks', 'TB': 'buccaneers', 'TEN': 'titans', 'WAS': 'commanders'
  };

  static async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.IMAGE_DIR, { recursive: true });
    await fs.mkdir(path.dirname(this.MAPPING_FILE), { recursive: true });
  }

  static async scrapeTeamRoster(teamAbbr: string): Promise<PlayerImageData[]> {
    const teamName = this.TEAM_MAPPING[teamAbbr];
    if (!teamName) {
      throw new Error(`Unknown team abbreviation: ${teamAbbr}`);
    }

    const espnUrl = `https://www.espn.com/nfl/team/roster/_/name/${teamAbbr.toLowerCase()}/${teamName}`;
    
    try {
      console.log(`Scraping roster for ${teamAbbr} from ${espnUrl}`);
      
      const response = await fetch(espnUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${teamAbbr} roster: ${response.status}`);
      }

      const html = await response.text();
      return this.parseRosterHTML(html, teamAbbr);
    } catch (error) {
      console.error(`Error scraping ${teamAbbr} roster:`, error);
      return [];
    }
  }

  private static parseRosterHTML(html: string, teamAbbr: string): PlayerImageData[] {
    const players: PlayerImageData[] = [];
    
    // Look for player image patterns in ESPN HTML
    const imageRegex = /<img[^>]+data-mptype="playerImage"[^>]+src="([^"]+)"[^>]*>/g;
    const playerLinkRegex = /<a[^>]+href="\/nfl\/player\/_\/id\/\d+\/([^"]+)"[^>]*>([^<]+)<\/a>/g;
    
    let imageMatch;
    const imageUrls: string[] = [];
    
    while ((imageMatch = imageRegex.exec(html)) !== null) {
      imageUrls.push(imageMatch[1]);
    }

    let playerMatch;
    let playerIndex = 0;
    
    while ((playerMatch = playerLinkRegex.exec(html)) !== null && playerIndex < imageUrls.length) {
      const playerName = playerMatch[2].trim();
      const imageUrl = imageUrls[playerIndex];
      
      // Extract position from surrounding HTML (this is approximate)
      const position = this.extractPositionFromContext(html, playerName);
      
      players.push({
        name: playerName,
        team: teamAbbr,
        position: position || 'UNKNOWN',
        imageUrl,
        localImagePath: this.generateLocalImagePath(playerName, teamAbbr)
      });
      
      playerIndex++;
    }

    return players;
  }

  private static extractPositionFromContext(html: string, playerName: string): string | null {
    // Look for position in table cell after player name
    const escapedName = playerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const positionRegex = new RegExp(`${escapedName}.*?<td[^>]*>\\s*(QB|RB|WR|TE|K|DST|DEF)\\s*<`, 'i');
    const match = positionRegex.exec(html);
    return match ? match[1].toUpperCase() : null;
  }

  private static generateLocalImagePath(playerName: string, teamAbbr: string): string {
    const sanitizedName = playerName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `${teamAbbr.toLowerCase()}-${sanitizedName}.jpg`;
  }

  static async downloadPlayerImage(imageUrl: string, localPath: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) return false;

      const buffer = await response.arrayBuffer();
      const fullPath = path.join(this.IMAGE_DIR, localPath);
      
      await fs.writeFile(fullPath, Buffer.from(buffer));
      console.log(`Downloaded: ${localPath}`);
      return true;
    } catch (error) {
      console.error(`Failed to download ${localPath}:`, error);
      return false;
    }
  }

  static async scrapeAllTeams(): Promise<void> {
    await this.ensureDirectories();
    
    const allPlayers: PlayerImageData[] = [];
    const teams = Object.keys(this.TEAM_MAPPING);
    
    for (const team of teams) {
      console.log(`\nScraping ${team}...`);
      const players = await this.scrapeTeamRoster(team);
      
      // Download images
      for (const player of players) {
        if (player.imageUrl && player.localImagePath) {
          const success = await this.downloadPlayerImage(player.imageUrl, player.localImagePath);
          if (!success) {
            player.localImagePath = undefined;
          }
        }
      }
      
      allPlayers.push(...players);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save mapping file
    await this.savePlayerMapping(allPlayers);
    console.log(`\nCompleted! Scraped ${allPlayers.length} players from ${teams.length} teams.`);
  }

  private static async savePlayerMapping(players: PlayerImageData[]): Promise<void> {
    const mapping = players.reduce((acc, player) => {
      const key = `${player.name}-${player.team}`.toLowerCase();
      acc[key] = {
        name: player.name,
        team: player.team,
        position: player.position,
        imagePath: player.localImagePath
      };
      return acc;
    }, {} as Record<string, any>);

    await fs.writeFile(this.MAPPING_FILE, JSON.stringify(mapping, null, 2));
  }

  static async getPlayerImagePath(playerName: string, teamAbbr: string): Promise<string | null> {
    try {
      const mapping = JSON.parse(await fs.readFile(this.MAPPING_FILE, 'utf-8'));
      const key = `${playerName}-${teamAbbr}`.toLowerCase();
      return mapping[key]?.imagePath || null;
    } catch {
      return null;
    }
  }
}