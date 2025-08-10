import { Player, Position } from '@/types';

interface FantasyProsPlayer {
  player_name: string;
  player_team_id: string;
  player_position_id: string;
  player_id: string;
  rank_ecr: number;
  rank_min: number;
  rank_max: number;
  rank_ave: number;
  rank_std: number;
  pos_rank: number;
  tier: number;
}

interface FantasyProsResponse {
  players: FantasyProsPlayer[];
  last_updated: string;
}

export class FantasyProsAPI {
  private baseUrl = 'https://api.fantasypros.com/public/v2/json/nfl';
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FANTASYPROS_API_KEY || null;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async fetchWithAuth(url: string): Promise<Response> {
    if (!this.apiKey) {
      throw new Error('FantasyPros API key not configured. Please set FANTASYPROS_API_KEY environment variable.');
    }

    const response = await fetch(url, {
      headers: {
        'x-api-key': this.apiKey,
        'Accept': 'application/json',
        'User-Agent': 'Fantasy-Football-Tiers/1.0'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid FantasyPros API key');
      } else if (response.status === 429) {
        throw new Error('FantasyPros API rate limit exceeded');
      }
      throw new Error(`FantasyPros API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async getConsensusRankings(
    year: number = new Date().getFullYear(),
    week: number = 0, // 0 for season-long
    scoringType: 'STD' | 'PPR' | 'HALF' = 'PPR',
    position?: Position
  ): Promise<Player[]> {
    const endpoint = `${this.baseUrl}/${year}/consensus-rankings`;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (week > 0) params.append('week', week.toString());
    params.append('scoring', scoringType);
    if (position) params.append('position', position);

    const url = `${endpoint}?${params.toString()}`;

    try {
      const response = await this.fetchWithAuth(url);
      const data: FantasyProsResponse = await response.json();

      return this.transformFantasyProsData(data.players);
    } catch (error) {
      console.error('Error fetching FantasyPros rankings:', error);
      throw error;
    }
  }

  async getExpertConsensusRankings(
    year: number = new Date().getFullYear(),
    week: number = 0,
    scoringType: 'STD' | 'PPR' | 'HALF' = 'PPR'
  ): Promise<Record<Position, Player[]>> {
    const positions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    const allRankings: Record<Position, Player[]> = {} as Record<Position, Player[]>;

    // Fetch rankings for each position
    await Promise.all(
      positions.map(async (position) => {
        try {
          const players = await this.getConsensusRankings(year, week, scoringType, position);
          allRankings[position] = players;
        } catch (error) {
          console.error(`Error fetching ${position} rankings:`, error);
          allRankings[position] = [];
        }
      })
    );

    return allRankings;
  }

  private transformFantasyProsData(fantasyProsPlayers: FantasyProsPlayer[]): Player[] {
    return fantasyProsPlayers.map((fp, index) => {
      const player: Player = {
        id: fp.player_id || `fp-${index}`,
        name: fp.player_name,
        team: fp.player_team_id || 'FA',
        position: this.mapPosition(fp.player_position_id),
        averageRank: fp.rank_ecr || fp.rank_ave || index + 1,
        projectedPoints: this.estimateProjectedPoints(fp.player_position_id, fp.rank_ecr || index + 1),
        standardDeviation: fp.rank_std || 1.0,
        tier: fp.tier,
        expertRanks: this.generateExpertRanksFromStats(fp)
      };

      return player;
    });
  }

  private mapPosition(positionId: string): Position {
    const positionMap: Record<string, Position> = {
      'QB': 'QB',
      'RB': 'RB',
      'WR': 'WR',
      'TE': 'TE',
      'K': 'K',
      'DST': 'DST',
      'DEF': 'DST',
      'D/ST': 'DST'
    };

    return positionMap[positionId.toUpperCase()] || 'FLEX';
  }

  private estimateProjectedPoints(position: string, rank: number): number {
    const basePoints: Record<string, number> = {
      'QB': 380,
      'RB': 300,
      'WR': 260,
      'TE': 180,
      'K': 130,
      'DST': 135,
      'DEF': 135,
      'OVERALL': 260
    };

    const base = basePoints[position.toUpperCase()] || 200;
    // Exponential decay based on rank
    return Math.round(base * Math.exp(-rank * 0.03));
  }

  private generateExpertRanksFromStats(player: FantasyProsPlayer): number[] {
    // Generate a distribution of expert ranks based on min/max/std
    const numExperts = 10;
    const ranks: number[] = [];
    
    const avg = player.rank_ave || player.rank_ecr;
    const std = player.rank_std || 1.0;
    const min = player.rank_min || Math.max(1, avg - 2 * std);
    const max = player.rank_max || avg + 2 * std;

    for (let i = 0; i < numExperts; i++) {
      // Generate normally distributed ranks within min/max bounds
      let rank = this.normalRandom(avg, std);
      rank = Math.max(min, Math.min(max, rank));
      rank = Math.round(rank);
      ranks.push(rank);
    }

    return ranks;
  }

  private normalRandom(mean: number, std: number): number {
    // Box-Muller transform for normal distribution
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + std * normal;
  }

  // Additional endpoints that FantasyPros might offer
  async getWeeklyProjections(
    year: number,
    week: number,
    position: Position
  ): Promise<any[]> {
    const endpoint = `${this.baseUrl}/${year}/weekly-projections`;
    const params = new URLSearchParams({
      week: week.toString(),
      position: position
    });

    try {
      const response = await this.fetchWithAuth(`${endpoint}?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching weekly projections:', error);
      return [];
    }
  }

  async getDraftRankings(
    year: number,
    scoringType: 'STD' | 'PPR' | 'HALF' = 'PPR'
  ): Promise<any[]> {
    const endpoint = `${this.baseUrl}/${year}/draft-rankings`;
    const params = new URLSearchParams({
      scoring: scoringType
    });

    try {
      const response = await this.fetchWithAuth(`${endpoint}?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching draft rankings:', error);
      return [];
    }
  }
}

// Singleton instance for easy import
export const fantasyProsAPI = new FantasyProsAPI();