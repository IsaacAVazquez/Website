export interface Player {
  id: string;
  name: string;
  team: string;
  position: Position;
  averageRank: number;
  projectedPoints?: number;
  standardDeviation?: number;
  tier?: number;
  expertRanks?: number[];
  // Additional FantasyPros fields
  positionRank?: number;
  minRank?: number;
  maxRank?: number;
  byeWeek?: number;
  adp?: number; // Average Draft Position
  adpHigh?: number; // Earliest observed draft slot in the ADP sample
  adpLow?: number; // Latest observed draft slot in the ADP sample
  adpStandardDeviation?: number; // Variation in observed draft slots
  adpTimesDrafted?: number; // Player-level number of observed selections
  lastUpdated?: string;
  ownership?: number;
  rankAverage?: number;
  rankEcr?: number;
  superflexRank?: number; // Separate sourced Superflex consensus rank when available
  superflexTier?: number; // Tier from the same sourced Superflex consensus board

  /**
   * Prior-season fantasy points per game for this scoring format, from
   * nflverse. Absent when the player has no matched scoring history, which is
   * normal for rookies and for anyone under the games-played floor.
   */
  gameLog?: {
    season: number;
    games: number;
    low: number;
    median: number;
    average: number;
    high: number;
  };

  // Enhanced NFLverse metadata
  headshotUrl?: string; // Player headshot from ESPN/NFLverse
  teamLogoUrl?: string; // Team logo URL
  
  // Enhanced player data for improved rankings
  overallValue?: number; // Weighted value used to order derived overall boards
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

/**
 * Starting lineup for the redraft assistant. FLEX accepts RB, WR, or TE.
 * The published redraft rankings are one-QB boards, so QB stays fixed at one
 * and Superflex is intentionally handled outside this model.
 */
export interface RedraftLineupSettings {
  QB: 1;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number;
  K: number;
  DST: number;
}

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
  lineup: RedraftLineupSettings;
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
    startPick?: number;
    endPick?: number;
  }[];
  teamStrengths: {
    teamNumber: number;
    strengths: Position[];
    weaknesses: Position[];
    valueTotal?: number; // Net pick-number-vs-baseline value across the team's picks
  }[];
}
