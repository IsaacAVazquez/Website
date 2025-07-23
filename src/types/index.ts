export interface Player {
  id: string;
  name: string;
  team: string;
  position: Position;
  averageRank: number | string;
  projectedPoints: number;
  standardDeviation: number | string;
  tier?: number;
  expertRanks: number[];
  // Additional FantasyPros fields
  positionRank?: number;
  minRank?: number | string;
  maxRank?: number | string;
  byeWeek?: number;
  adp?: number; // Average Draft Position
  lastUpdated?: string;
}

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST' | 'FLEX' | 'OVERALL';
export type ScoringFormat = 'STANDARD' | 'PPR' | 'HALF_PPR';

export interface TierGroup {
  tier: number;
  players: Player[];
  color: string;
  minRank: number;
  maxRank: number;
  avgRank: number;
  label?: string; // Optional tier label
}

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ClusteringOptions {
  numberOfClusters?: number;
  maxIterations?: number;
  tolerance?: number;
}