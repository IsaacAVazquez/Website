/**
 * NFLverse API Service
 * Fetches fantasy football data from nflverse/DynastyProcess repositories
 * This replaces the FantasyPros API with open-source NFL data
 */

import { Player, Position, ScoringFormat } from '@/types';
import { logger } from './logger';

export interface NFLversePlayerRaw {
  fantasypros_id?: string;
  player_name: string;
  pos: string;
  team: string;
  rank?: number;
  ecr: number;
  sd: number;
  best: number;
  worst: number;
  player_bye_week?: string | number;
  pos_rank?: string | number;
  r2p_pts?: string | number;
  player_page_url?: string;
  player_filename?: string;
  player_owned_avg?: string | number;
  scrape_date?: string;
  note?: string;
  start_sit_grade?: string;
  // Additional fields from db_fpecr_latest.csv
  id?: string;
  sportsdata_id?: string;
  yahoo_id?: string;
  cbs_id?: string;
}

export interface NFLverseFetchResult {
  players: Player[];
  source: 'nflverse' | 'sample';
  success: boolean;
  error?: string;
  metadata: {
    timestamp: string;
    position: Position;
    scoringFormat: string;
    playersCount: number;
    dataUrl: string;
  };
}

class NFLverseAPI {
  private readonly BASE_URL = 'https://github.com/dynastyprocess/data/raw/master/files';
  private readonly WEEKLY_DATA_URL = `${this.BASE_URL}/fp_latest_weekly.csv`;
  private readonly ECR_DATA_URL = `${this.BASE_URL}/db_fpecr_latest.csv`;
  private readonly PLAYER_IDS_URL = `${this.BASE_URL}/db_playerids.csv`;

  // NFLverse headshots and team data
  private readonly HEADSHOTS_BASE_URL = 'https://a.espncdn.com/i/headshots/nfl/players/full';
  private readonly TEAM_LOGOS_BASE_URL = 'https://a.espncdn.com/i/teamlogos/nfl/500';

  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  // In-memory cache for player data
  private readonly cache = new Map<string, {
    data: NFLverseFetchResult;
    timestamp: number;
  }>();

  // Cache for player ID mappings (ESPN IDs for headshots)
  private playerIdsCache: Map<string, {
    espn_id?: string;
    yahoo_id?: string;
    sleeper_id?: string;
  }> | null = null;
  private playerIdsCacheTimestamp: number = 0;

  /**
   * Fetch and cache player ID mappings for headshots
   * @returns Promise that resolves when player IDs are loaded
   */
  private async loadPlayerIds(): Promise<void> {
    const now = Date.now();

    // Use cached data if available and fresh (1 hour cache)
    if (this.playerIdsCache && (now - this.playerIdsCacheTimestamp) < 60 * 60 * 1000) {
      return;
    }

    try {
      logger.info('Fetching player ID mappings from NFLverse');
      const response = await fetch(this.PLAYER_IDS_URL, {
        headers: { 'Accept': 'text/csv' }
      });

      if (!response.ok) {
        logger.warn('Failed to fetch player IDs, using without headshots');
        return;
      }

      const csvText = await response.text();
      const lines = csvText.split('\n').filter(line => line.trim());

      if (lines.length === 0) return;

      const headers = this.parseCSVLine(lines[0]);
      const playerIds = new Map<string, { espn_id?: string; yahoo_id?: string; sleeper_id?: string }>();

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;

        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const playerName = row.name || row.player_name || '';
        if (playerName) {
          playerIds.set(playerName.toLowerCase().trim(), {
            espn_id: row.espn_id || row.espnId,
            yahoo_id: row.yahoo_id || row.yahooId,
            sleeper_id: row.sleeper_id || row.sleeperId
          });
        }
      }

      this.playerIdsCache = playerIds;
      this.playerIdsCacheTimestamp = now;
      logger.info(`Loaded ${playerIds.size} player ID mappings`);

    } catch (error) {
      logger.warn('Failed to load player IDs:', error);
    }
  }

  /**
   * Get player headshot URL from ESPN
   */
  private getPlayerHeadshot(playerName: string, espnId?: string): string | undefined {
    if (espnId) {
      return `${this.HEADSHOTS_BASE_URL}/${espnId}.png`;
    }

    // Try to get ESPN ID from cache
    const ids = this.playerIdsCache?.get(playerName.toLowerCase().trim());
    if (ids?.espn_id) {
      return `${this.HEADSHOTS_BASE_URL}/${ids.espn_id}.png`;
    }

    return undefined;
  }

  /**
   * Get team logo URL
   */
  private getTeamLogo(teamAbbr: string): string {
    if (!teamAbbr || teamAbbr === 'FA') {
      return '';
    }
    // Convert team abbreviation to uppercase for consistency
    return `${this.TEAM_LOGOS_BASE_URL}/${teamAbbr.toUpperCase()}.png`;
  }

  /**
   * Fetch fantasy football rankings for a specific position
   */
  async fetchPlayersData(
    position: Position,
    scoringFormat: ScoringFormat = 'HALF_PPR'
  ): Promise<NFLverseFetchResult> {
    const cacheKey = `${position}-${scoringFormat}`;
    const now = Date.now();

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      logger.info(`Using cached nflverse data for ${position} ${scoringFormat}`);
      return cached.data;
    }

    try {
      logger.info(`Fetching nflverse data for ${position} ${scoringFormat}`);

      // Load player IDs for headshots (async, non-blocking)
      await this.loadPlayerIds();

      // Fetch data from DynastyProcess weekly rankings
      const response = await fetch(this.WEEKLY_DATA_URL, {
        headers: {
          'Accept': 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch nflverse data: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();
      const players = this.parseCSV(csvText, position, scoringFormat);

      const result: NFLverseFetchResult = {
        players,
        source: 'nflverse',
        success: true,
        metadata: {
          timestamp: new Date().toISOString(),
          position,
          scoringFormat,
          playersCount: players.length,
          dataUrl: this.WEEKLY_DATA_URL
        }
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: now
      });

      logger.info(`Successfully fetched ${players.length} ${position} players from nflverse`);
      return result;

    } catch (error) {
      logger.error('Failed to fetch nflverse data:', error);

      return {
        players: [],
        source: 'sample',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString(),
          position,
          scoringFormat,
          playersCount: 0,
          dataUrl: this.WEEKLY_DATA_URL
        }
      };
    }
  }

  /**
   * Fetch all positions for a given scoring format
   */
  async fetchAllPositions(
    scoringFormat: ScoringFormat = 'HALF_PPR'
  ): Promise<Record<Position, NFLverseFetchResult>> {
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    const results: Record<Position, NFLverseFetchResult> = {} as Record<Position, NFLverseFetchResult>;

    // Fetch all positions in parallel
    const fetchPromises = positions.map(async (position) => {
      const result = await this.fetchPlayersData(position, scoringFormat);
      return { position, result };
    });

    const settledResults = await Promise.allSettled(fetchPromises);

    settledResults.forEach((settledResult, index) => {
      const position = positions[index];

      if (settledResult.status === 'fulfilled') {
        results[position] = settledResult.value.result;
      } else {
        results[position] = {
          players: [],
          source: 'sample',
          success: false,
          error: settledResult.reason?.message || 'Fetch failed',
          metadata: {
            timestamp: new Date().toISOString(),
            position,
            scoringFormat,
            playersCount: 0,
            dataUrl: this.WEEKLY_DATA_URL
          }
        };
      }
    });

    return results;
  }

  /**
   * Parse CSV data and convert to Player objects
   */
  private parseCSV(csvText: string, position: Position, scoringFormat: ScoringFormat): Player[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      return [];
    }

    // Parse header row
    const headers = this.parseCSVLine(lines[0]);
    const players: Player[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Filter by position (if not OVERALL or ALL)
      const playerPos = row.pos?.toUpperCase();
      if (position !== 'OVERALL' && position !== 'ALL' && playerPos !== position) {
        continue;
      }

      // Skip if position doesn't match standard positions
      if (!['QB', 'RB', 'WR', 'TE', 'K', 'DST'].includes(playerPos)) {
        continue;
      }

      try {
        const player = this.transformToPlayer(row, scoringFormat);
        players.push(player);
      } catch (error) {
        logger.warn(`Failed to transform player: ${row.player_name}`, error);
        continue;
      }
    }

    return players;
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Transform raw NFLverse data to Player interface
   * Now includes player headshots and team logos from NFLverse ecosystem
   */
  private transformToPlayer(row: Record<string, string>, scoringFormat: ScoringFormat): Player {
    const id = row.fantasypros_id || row.id || `player-${row.player_name?.replace(/\s+/g, '-').toLowerCase()}`;
    const name = row.player_name || 'Unknown Player';
    const team = row.team || row.tm || 'FA';
    const position = (row.pos?.toUpperCase() || 'QB') as Position;

    // Parse numeric values
    const ecr = parseFloat(row.ecr || row.rank || '999');
    const sd = parseFloat(row.sd || '0');
    const best = parseFloat(row.best || row.ecr || '999');
    const worst = parseFloat(row.worst || row.ecr || '999');
    const posRank = parseInt(row.pos_rank || '0', 10);
    const byeWeek = parseInt(row.player_bye_week || '0', 10);
    const projectedPoints = parseFloat(row.r2p_pts || '0');

    // Calculate expert ranks array (simulate expert variation)
    const expertRanks = this.generateExpertRanks(ecr, sd, best, worst);

    // Get player headshot and team logo URLs
    const headshotUrl = this.getPlayerHeadshot(name, row.espn_id);
    const teamLogoUrl = this.getTeamLogo(team);

    const player: Player = {
      id,
      name,
      team,
      position,
      averageRank: ecr,
      projectedPoints,
      standardDeviation: sd,
      expertRanks,
      positionRank: posRank || undefined,
      minRank: best,
      maxRank: worst,
      byeWeek: byeWeek || undefined,
      lastUpdated: row.scrape_date || new Date().toISOString(),
      // Enhanced metadata from NFLverse
      headshotUrl,
      teamLogoUrl,
    };

    return player;
  }

  /**
   * Generate simulated expert ranks based on ECR, standard deviation, and min/max
   */
  private generateExpertRanks(ecr: number, sd: number, min: number, max: number): number[] {
    // Generate 10-20 expert ranks that fit within the constraints
    const numExperts = Math.floor(Math.random() * 11) + 10; // 10-20 experts
    const ranks: number[] = [];

    for (let i = 0; i < numExperts; i++) {
      // Use normal distribution approximation
      const rand = this.randomNormal();
      let rank = Math.round(ecr + (rand * sd));

      // Clamp to min/max
      rank = Math.max(min, Math.min(max, rank));
      ranks.push(rank);
    }

    return ranks.sort((a, b) => a - b);
  }

  /**
   * Generate a random number from a standard normal distribution
   * Box-Muller transform
   */
  private randomNormal(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Clear cache for specific position or all
   */
  clearCache(position?: Position, scoringFormat?: ScoringFormat): void {
    if (position && scoringFormat) {
      const key = `${position}-${scoringFormat}`;
      this.cache.delete(key);
      logger.info(`Cleared cache for ${position} ${scoringFormat}`);
    } else {
      this.cache.clear();
      logger.info('Cleared all nflverse cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalCached: number; oldestEntry: string | null } {
    const entries = Array.from(this.cache.values());
    const oldestTimestamp = entries.length > 0
      ? Math.min(...entries.map(e => e.timestamp))
      : null;

    return {
      totalCached: entries.length,
      oldestEntry: oldestTimestamp ? new Date(oldestTimestamp).toISOString() : null
    };
  }
}

// Export singleton instance
export const nflverseAPI = new NFLverseAPI();
