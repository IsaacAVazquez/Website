import type { Player } from "@/types";

export const BEST_BALL_POSITIONS = ["QB", "RB", "WR", "TE"] as const;

export type BestBallPosition = (typeof BEST_BALL_POSITIONS)[number];

export type BestBallContestId =
  | "bbm-vii"
  | "puppy"
  | "eliminator"
  | "weekly-winners"
  | "sit-and-go"
  | "superflex";

export type BestBallContestFormat =
  | "tournament"
  | "elimination"
  | "weekly"
  | "cumulative"
  | "superflex";

export type BestBallStrategyProfileId =
  | "standard-tournament"
  | "eliminator"
  | "weekly-winners"
  | "cumulative"
  | "superflex";

export interface BestBallLineup {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number;
  SUPERFLEX?: number;
}

export interface BestBallContestEconomics {
  entryFee: number;
  fieldEntries: number;
  prizePool: number;
  firstAdvanceRate: number;
  asOf: string;
  sourceUrl: string;
}

export interface BestBallContestPreset {
  id: BestBallContestId;
  name: string;
  shortName: string;
  description: string;
  aliases: readonly string[];
  format: BestBallContestFormat;
  strategyProfileId: BestBallStrategyProfileId;
  teams: number;
  rounds: number;
  rosterSize: number;
  scoring: "HALF_PPR";
  lineup: Readonly<BestBallLineup>;
  officialRulesUrl: string;
  officialTermsUrl: string;
  rulesAsOf: string;
  rulesNote: string;
  economics?: Readonly<BestBallContestEconomics>;
}

export interface BestBallStrategyProfile {
  id: BestBallStrategyProfileId;
  correlationWeight: number;
  byeCoverageWeight: number;
  rosterNeedWeight: number;
  adpValueWeight: number;
  concentrationPenalty: number;
  spikeWeekWeight: number;
  week17Treatment: "tiebreaker" | "none";
}

/** Existing DraftPick values are structurally compatible with this smaller shape. */
export interface BestBallDraftPick {
  pickNumber: number;
  round: number;
  teamNumber: number;
  player: Player;
}

export interface RankedBestBallPlayer extends Player {
  bestBallRank: number;
  bestBallEcr: number;
  adjustedRank: number;
  rankAdjustment: number;
  rankReason: string;
}

export type BestBallRosterComposition = Record<BestBallPosition, number>;

export interface BestBallRosterTarget {
  minimum: number;
  recommended: number;
  maximum: number;
  drafted: number;
  reason: string;
}

export interface AdaptiveRosterTargets {
  rosterSize: number;
  draftedCount: number;
  currentRound: number;
  counts: BestBallRosterComposition;
  recommended: BestBallRosterComposition;
  targets: Record<BestBallPosition, BestBallRosterTarget>;
  validCompositions: readonly BestBallRosterComposition[];
  reasons: readonly string[];
}

export interface BestBallStack {
  team: string;
  quarterbacks: readonly Player[];
  passCatchers: readonly Player[];
  playerIds: readonly string[];
}

export interface BestBallTeamConcentration {
  team: string;
  count: number;
  players: readonly Player[];
}

export interface BestBallByeConflict {
  byeWeek: number;
  count: number;
  players: readonly Player[];
  positionCounts: Partial<Record<BestBallPosition, number>>;
}

export interface BestBallWeek17Pair {
  teams: readonly [string, string];
  playersByTeam: Readonly<Record<string, readonly Player[]>>;
}

export interface BestBallRosterAnalysis {
  targets: AdaptiveRosterTargets;
  stacks: readonly BestBallStack[];
  concentrations: readonly BestBallTeamConcentration[];
  byeConflicts: readonly BestBallByeConflict[];
  week17Pairs: readonly BestBallWeek17Pair[];
}

export type BestBallRecommendationComponent =
  | "baseRank"
  | "adpValue"
  | "rosterNeed"
  | "stackSchedule"
  | "byeRisk"
  | "concentrationRisk"
  | "spikeWeek";

export interface BestBallRecommendationReason {
  component: BestBallRecommendationComponent;
  score: number;
  detail: string;
}

export interface BestBallRecommendationComponents {
  baseRank: number;
  adpValue: number;
  rosterNeed: number;
  stackSchedule: number;
  byeRisk: number;
  concentrationRisk: number;
  spikeWeek: number;
}

export interface BestBallRecommendation {
  player: Player;
  score: number;
  components: BestBallRecommendationComponents;
  reasons: readonly BestBallRecommendationReason[];
  tiebreakers: {
    week17Opponent: number;
  };
}

export interface RecommendBestBallOptions {
  players: readonly Player[];
  picks: readonly BestBallDraftPick[];
  userTeamNumber: number;
  currentPickNumber: number;
  contestId?: BestBallContestId;
  week17Opponents?: Readonly<Record<string, string>>;
  limit?: number;
}
