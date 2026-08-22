import type {
  BestBallContestId,
  BestBallRecommendation,
  BestBallRecommendationMode,
} from "@/lib/bestBall";
import type { Player, RedraftLineupSettings, ScoringFormat } from "@/types";

export const FANTASY_COMPANION_SCHEMA_VERSION = 1;

export type FantasyCompanionDraftOrder = "snake" | "linear";

interface FantasyCompanionRoomBase {
  season: number;
  teams: number;
  rounds: number;
  userTeam: number;
  draftOrder: FantasyCompanionDraftOrder;
}

export interface RedraftCompanionRoomConfig extends FantasyCompanionRoomBase {
  kind: "redraft";
  scoring: ScoringFormat;
  lineup: RedraftLineupSettings;
}

export interface BestBallCompanionRoomConfig extends FantasyCompanionRoomBase {
  kind: "best-ball";
  contestId: BestBallContestId;
  scoring: "HALF_PPR";
  draftOrder: "snake";
}

export type FantasyCompanionRoomConfig =
  | RedraftCompanionRoomConfig
  | BestBallCompanionRoomConfig;

export interface CreateRedraftRoomOptions {
  season: number;
  teams?: number;
  rounds?: number;
  userTeam?: number;
  draftOrder?: FantasyCompanionDraftOrder;
  /** Compatibility alias for the existing site tracker. */
  draftType?: FantasyCompanionDraftOrder;
  scoring?: ScoringFormat;
  lineup?: Partial<RedraftLineupSettings>;
}

export interface CreateBestBallRoomOptions {
  season: number;
  contestId: BestBallContestId;
  userTeam?: number;
}

export interface FantasyCompanionPick {
  pickNumber: number;
  round: number;
  teamNumber: number;
  player: Player;
  draftedAt: string;
}

export interface FantasyCompanionDraftState {
  schemaVersion: typeof FANTASY_COMPANION_SCHEMA_VERSION;
  room: FantasyCompanionRoomConfig;
  picks: readonly FantasyCompanionPick[];
  startedAt: string | null;
  updatedAt: string;
}

export type AddFantasyCompanionPickFailureReason =
  | "draft-complete"
  | "duplicate-player"
  | "ineligible-position"
  | "invalid-player";

export type AddFantasyCompanionPickResult =
  | {
      ok: true;
      state: FantasyCompanionDraftState;
      pick: FantasyCompanionPick;
    }
  | {
      ok: false;
      state: FantasyCompanionDraftState;
      reason: AddFantasyCompanionPickFailureReason;
    };

export interface PlayerMatchInput {
  id?: string;
  name?: string;
  team?: string;
  position?: Player["position"];
}

export type PlayerMatchResult =
  | {
      status: "matched";
      player: Player;
      matchedBy:
        | "id"
        | "name"
        | "name-position"
        | "name-team"
        | "name-team-position"
        | "team-position";
    }
  | {
      status: "ambiguous";
      candidates: readonly Player[];
    }
  | {
      status: "not-found";
    };

export interface RedraftRecommendation {
  player: Player;
  rank: number;
  sourceRank: number;
  valueAtCurrentPick: number | null;
  reason: string;
}

export interface RedraftCompanionRecommendationResult {
  kind: "redraft";
  mode: "consensus";
  reason: string;
  recommendations: readonly RedraftRecommendation[];
}

export interface BestBallCompanionRecommendationResult {
  kind: "best-ball";
  mode: BestBallRecommendationMode;
  reason: string;
  recommendations: readonly BestBallRecommendation[];
}

export type FantasyCompanionRecommendationResult =
  | RedraftCompanionRecommendationResult
  | BestBallCompanionRecommendationResult;

export interface FantasyCompanionRecommendationOptions {
  state: FantasyCompanionDraftState;
  players: readonly Player[];
  week17Opponents?: Readonly<Record<string, string>>;
  limit?: number;
}
