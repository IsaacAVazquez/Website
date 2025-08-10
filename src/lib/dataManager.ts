import { Player, Position } from '@/types';
import { parseCSV, csvToPlayers } from './dataImport';
import { FantasyProsScraper, SleeperAPI } from './webScraper';

export class DataManager {
  private currentData: { [position: string]: Player[] } = {};
  
  // Method 1: Import from CSV files
  async importFromCSV(file: File, position: Position): Promise<Player[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const csvData = parseCSV(csvContent);
          const players = csvToPlayers(csvData);
          
          // Filter by position if specified
          const filteredPlayers = players.filter(p => p.position === position);
          
          this.currentData[position] = filteredPlayers;
          resolve(filteredPlayers);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  // Method 2: Import from URL (CSV hosted online)
  async importFromURL(url: string, position: Position): Promise<Player[]> {
    try {
      const response = await fetch(url);
      const csvContent = await response.text();
      
      const csvData = parseCSV(csvContent);
      const players = csvToPlayers(csvData);
      const filteredPlayers = players.filter(p => p.position === position);
      
      this.currentData[position] = filteredPlayers;
      return filteredPlayers;
    } catch (error) {
      console.error('Error importing from URL:', error);
      throw error;
    }
  }
  
  // Method 3: Scrape FantasyPros
  async scrapeFantasyPros(position: string, scoringFormat: string = 'ppr'): Promise<Player[]> {
    const scraper = new FantasyProsScraper();
    const players = await scraper.scrapePosition(position, scoringFormat);
    
    this.currentData[position.toUpperCase()] = players;
    return players;
  }
  
  // Method 4: Fetch from Sleeper API
  async fetchFromSleeper(): Promise<{ [position: string]: Player[] }> {
    const sleeper = new SleeperAPI();
    const sleeperData = await sleeper.getSleeperPlayers();
    const players = await sleeper.convertSleeperToPlayers(sleeperData);
    
    // Group by position
    const groupedPlayers: { [position: string]: Player[] } = {};
    players.forEach(player => {
      if (!groupedPlayers[player.position]) {
        groupedPlayers[player.position] = [];
      }
      groupedPlayers[player.position].push(player);
    });
    
    this.currentData = { ...this.currentData, ...groupedPlayers };
    return groupedPlayers;
  }
  
  // Method 5: Paste rankings data directly
  parseRankingsText(text: string, position: Position): Player[] {
    const lines = text.trim().split('\n');
    const players: Player[] = [];
    
    lines.forEach((line, index) => {
      // Handle different formats:
      // "1. Player Name (TEAM)"
      // "Player Name - TEAM"
      // "1 Player Name TEAM"
      
      const rankMatch = line.match(/^(\d+)\.?\s*/);
      const rank = rankMatch ? parseInt(rankMatch[1]) : index + 1;
      
      // Remove rank from line
      const cleanLine = line.replace(/^\d+\.?\s*/, '');
      
      // Extract player name and team
      let playerName = '';
      let team = '';
      
      const teamParenMatch = cleanLine.match(/^(.+?)\s*\(([A-Z]{2,3})\)/);
      const teamDashMatch = cleanLine.match(/^(.+?)\s*-\s*([A-Z]{2,3})/);
      const teamSpaceMatch = cleanLine.match(/^(.+?)\s+([A-Z]{2,3})$/);
      
      if (teamParenMatch) {
        playerName = teamParenMatch[1].trim();
        team = teamParenMatch[2];
      } else if (teamDashMatch) {
        playerName = teamDashMatch[1].trim();
        team = teamDashMatch[2];
      } else if (teamSpaceMatch) {
        playerName = teamSpaceMatch[1].trim();
        team = teamSpaceMatch[2];
      } else {
        playerName = cleanLine.trim();
        team = 'UNK';
      }
      
      if (playerName) {
        players.push({
          id: `manual-${position}-${index}`,
          name: playerName,
          team: team,
          position: position,
          averageRank: rank,
          projectedPoints: this.estimateProjectedPoints(position, rank),
          standardDeviation: Math.max(0.5, rank * 0.1),
          expertRanks: this.generateExpertRanks(rank)
        });
      }
    });
    
    this.currentData[position] = players;
    return players;
  }
  
  // Update individual player
  updatePlayer(playerId: string, updates: Partial<Player>): boolean {
    for (const position in this.currentData) {
      const playerIndex = this.currentData[position].findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        this.currentData[position][playerIndex] = {
          ...this.currentData[position][playerIndex],
          ...updates
        };
        return true;
      }
    }
    return false;
  }
  
  // Export to different formats
  exportToCSV(position?: Position): string {
    const players = position 
      ? this.currentData[position] || []
      : Object.values(this.currentData).flat();
    
    const headers = ['name', 'team', 'position', 'rank', 'projected_points', 'standard_deviation'];
    const rows = players.map(p => [
      p.name, p.team, p.position, p.averageRank, p.projectedPoints, p.standardDeviation
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  exportToTypeScript(): string {
    let output = 'import { Player } from \'@/types\';\n\n';
    
    Object.entries(this.currentData).forEach(([position, players]) => {
      output += `export const sample${position}Data: Player[] = [\n`;
      players.forEach(player => {
        output += `  {\n`;
        output += `    id: '${player.id}',\n`;
        output += `    name: '${player.name}',\n`;
        output += `    team: '${player.team}',\n`;
        output += `    position: '${player.position}',\n`;
        output += `    averageRank: ${player.averageRank},\n`;
        output += `    projectedPoints: ${player.projectedPoints},\n`;
        output += `    standardDeviation: ${player.standardDeviation},\n`;
        output += `    expertRanks: [${player.expertRanks.join(', ')}]\n`;
        output += `  },\n`;
      });
      output += '];\n\n';
    });
    
    return output;
  }
  
  // Get current data
  getData(position?: Position): Player[] | { [position: string]: Player[] } {
    return position ? this.currentData[position] || [] : this.currentData;
  }

  // Get players by position
  getPlayersByPosition(position: Position): Player[] {
    return this.currentData[position] || [];
  }

  // Set players for a position
  setPlayersByPosition(position: Position, players: Player[]): void {
    this.currentData[position] = players;
  }
  
  // Helper methods
  private estimateProjectedPoints(position: Position, rank: number): number {
    const basePoints: Record<Position, number> = {
      'QB': 380, 'RB': 300, 'WR': 260, 'TE': 180, 'K': 130, 'DST': 135, 'FLEX': 260, 'OVERALL': 260
    };
    
    const base = basePoints[position] || 200;
    return Math.round(base * Math.exp(-rank * 0.04));
  }
  
  private generateExpertRanks(avgRank: number): number[] {
    return Array.from({ length: 5 }, () => 
      Math.max(1, Math.round(avgRank + (Math.random() - 0.5) * 4))
    );
  }
}

// Singleton instance
export const dataManager = new DataManager();