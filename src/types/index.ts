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
  
  // Enhanced player data for improved rankings
  auctionValue?: number; // Auction draft value
  upside?: string; // Upside description
  downside?: string; // Risk factors
  bottomLine?: string; // Summary assessment
  expertCount?: number; // Number of experts ranking this player
  consensusLevel?: 'high' | 'medium' | 'low'; // Expert consensus agreement
  
  // Detailed projections (position-specific)
  projections?: {
    // QB projections
    passingYards?: number;
    passingTDs?: number;
    interceptions?: number;
    rushingYards?: number;
    rushingTDs?: number;
    
    // RB/WR/TE projections
    receptions?: number;
    receivingYards?: number;
    receivingTDs?: number;
    targets?: number;
    targetShare?: number;
    redZoneTargets?: number;
    
    // RB specific
    carries?: number;
    redZoneCarries?: number;
    
    // DST specific
    sacks?: number;
    interceptions?: number;
    fumblesRecovered?: number;
    safeties?: number;
    touchdowns?: number;
    
    // K specific
    fieldGoalAttempts?: number;
    fieldGoalPercentage?: number;
    extraPointAttempts?: number;
  };
  
  // Weekly performance data
  weeklyProjections?: Array<{
    week: number;
    projectedPoints: number;
    opponent: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST' | 'FLEX' | 'OVERALL' | 'ALL';
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

// Draft Tracker Types
export interface DraftSettings {
  totalTeams: number;
  userTeam: number;
  scoringFormat: ScoringFormat;
  draftType: 'snake' | 'linear';
  rounds: number;
  timerSeconds?: number; // Optional pick timer
  leagueName?: string;
  draftDate?: Date;
}

export interface DraftPick {
  pickNumber: number;
  round: number;
  teamNumber: number;
  player: Player;
  timestamp: Date;
  pickTimeSeconds?: number; // Time taken to make pick
  isKeeper?: boolean;
}

export interface TeamRoster {
  teamNumber: number;
  teamName?: string;
  picks: DraftPick[];
  positionCounts: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
    K: number;
    DST: number;
  };
  totalValue: number; // Sum of auction values
  projectedPoints: number;
  draftGrade?: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';
}

export interface DraftState {
  settings: DraftSettings;
  picks: DraftPick[];
  currentPick: number;
  currentRound: number;
  isActive: boolean;
  undoHistory: DraftPick[];
  teams: TeamRoster[];
  startTime?: Date;
  endTime?: Date;
  draftId?: string; // For persistence
}

export interface DraftAnalytics {
  bestValue: DraftPick[]; // Best picks based on ADP vs draft position
  reaches: DraftPick[]; // Players drafted significantly above ADP  
  steals: DraftPick[]; // Players drafted significantly below ADP
  positionRunAnalysis: {
    position: Position;
    startRound: number;
    endRound: number;
    playersSelected: number;
  }[];
  teamStrengths: {
    teamNumber: number;
    strengths: Position[];
    weaknesses: Position[];
    overallGrade: string;
  }[];
}