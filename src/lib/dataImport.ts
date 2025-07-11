import { Player, Position } from '@/types';

// CSV Parser for fantasy football rankings
export interface CSVPlayerData {
  name: string;
  team: string;
  position: Position;
  rank: number;
  projectedPoints?: number;
  adp?: number; // Average Draft Position
  tier?: number;
}

// Parse CSV content into player objects
export function parseCSV(csvContent: string): CSVPlayerData[] {
  const lines = csvContent.trim().split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  // Handle CSV with or without headers
  const firstLine = lines[0];
  const hasHeaders = isHeaderRow(firstLine);
  
  let headers: string[];
  let dataLines: string[];
  
  if (hasHeaders) {
    headers = parseCSVLine(firstLine).map(h => h.trim().toLowerCase());
    dataLines = lines.slice(1);
  } else {
    // Default headers if no header row detected
    headers = ['name', 'team', 'position', 'rank'];
    dataLines = lines;
  }
  
  return dataLines.map((line, index) => {
    const values = parseCSVLine(line);
    const player: any = {};
    
    headers.forEach((header, i) => {
      const value = values[i] ? values[i].trim() : '';
      
      switch (header) {
        case 'name':
        case 'player':
        case 'player_name':
        case 'full_name':
          player.name = value;
          break;
        case 'team':
        case 'tm':
          player.team = value.toUpperCase();
          break;
        case 'position':
        case 'pos':
          player.position = value.toUpperCase() as Position;
          break;
        case 'rank':
        case 'ranking':
        case 'overall_rank':
        case 'rk':
          player.rank = parseFloat(value) || index + 1;
          break;
        case 'projected_points':
        case 'points':
        case 'fantasy_points':
        case 'pts':
        case 'fpts':
          player.projectedPoints = parseFloat(value);
          break;
        case 'adp':
        case 'average_draft_position':
          player.adp = parseFloat(value);
          break;
        case 'tier':
          player.tier = parseInt(value);
          break;
      }
    });
    
    // Set defaults if missing required fields
    if (!player.name && values.length > 0) {
      player.name = values[0];
    }
    if (!player.rank) {
      player.rank = index + 1;
    }
    
    return player as CSVPlayerData;
  }).filter(player => player.name && player.name.length > 0);
}

// Helper function to detect if first row contains headers
function isHeaderRow(line: string): boolean {
  const lowerLine = line.toLowerCase();
  return lowerLine.includes('name') || 
         lowerLine.includes('player') || 
         lowerLine.includes('position') ||
         lowerLine.includes('rank');
}

// Parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result.map(val => val.replace(/^"|"$/g, '').trim());
}

// Convert CSV data to Player objects with calculated uncertainty
export function csvToPlayers(csvData: CSVPlayerData[], baseId: number = 1): Player[] {
  return csvData.map((csvPlayer, index) => {
    // Calculate standard deviation based on rank (higher ranks = more uncertainty)
    const standardDeviation = Math.max(0.2, Math.min(5.0, csvPlayer.rank * 0.15));
    
    // Generate mock expert ranks around the average rank
    const expertRanks = generateExpertRanks(csvPlayer.rank, standardDeviation);
    
    // Estimate projected points if not provided
    const projectedPoints = csvPlayer.projectedPoints || estimateProjectedPoints(
      csvPlayer.position, 
      csvPlayer.rank
    );
    
    return {
      id: (baseId + index).toString(),
      name: csvPlayer.name,
      team: csvPlayer.team,
      position: csvPlayer.position,
      averageRank: csvPlayer.rank,
      projectedPoints,
      standardDeviation,
      expertRanks
    };
  });
}

// Generate mock expert rankings around average rank
function generateExpertRanks(avgRank: number, stdDev: number): number[] {
  const ranks: number[] = [];
  for (let i = 0; i < 5; i++) {
    // Generate normal distribution around avgRank
    const rank = Math.round(avgRank + (Math.random() - 0.5) * stdDev * 2);
    ranks.push(Math.max(1, rank));
  }
  return ranks;
}

// Estimate projected points based on position and rank
function estimateProjectedPoints(position: Position, rank: number): number {
  const basePoints: Record<Position, number> = {
    'QB': 400,
    'RB': 320,
    'WR': 285,
    'TE': 200,
    'K': 135,
    'DST': 140,
    'FLEX': 285
  };
  
  const positionBase = basePoints[position] || 200;
  
  // Decrease points based on rank (exponential decay)
  const pointsMultiplier = Math.exp(-rank * 0.05);
  return Math.round(positionBase * pointsMultiplier);
}

// Batch import from multiple CSV sources
export async function importFromMultipleCSVs(csvFiles: { [position: string]: string }) {
  const allPlayers: Player[] = [];
  let currentId = 1;
  
  for (const [position, csvContent] of Object.entries(csvFiles)) {
    const csvData = parseCSV(csvContent);
    const players = csvToPlayers(csvData, currentId);
    allPlayers.push(...players);
    currentId += players.length;
  }
  
  return allPlayers;
}

// Export current data to CSV format
export function exportToCSV(players: Player[]): string {
  const headers = ['name', 'team', 'position', 'rank', 'projected_points', 'standard_deviation'];
  
  const rows = players.map(player => [
    player.name,
    player.team,
    player.position,
    player.averageRank.toString(),
    player.projectedPoints.toString(),
    player.standardDeviation.toString()
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}