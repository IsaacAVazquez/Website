import type { Formula1Snapshot } from "@/types/formula1";

export type FantasyFormula1AssetKind = "driver" | "constructor";
export type FantasyFormula1Risk = "low" | "medium" | "high";

export interface FantasyFormula1Asset {
  id: string;
  kind: FantasyFormula1AssetKind;
  name: string;
  shortName: string;
  teamName: string | null;
  teamColor: string | null;
  headshotUrl: string | null;
  standingPosition: number | null;
  seasonPoints: number;
  lastRacePoints: number;
  price: number;
  projectedPoints: number;
  valueRating: number;
  formScore: number;
  risk: FantasyFormula1Risk;
  riskReason: string;
}

export interface FantasyFormula1Lineup {
  driverIds: string[];
  constructorIds: string[];
  lockedAssetIds: string[];
}

export interface FantasyFormula1LineupSummary {
  drivers: FantasyFormula1Asset[];
  constructors: FantasyFormula1Asset[];
  assets: FantasyFormula1Asset[];
  totalPrice: number;
  projectedPoints: number;
  valueRating: number;
  budgetRemaining: number;
  isComplete: boolean;
  isOverBudget: boolean;
}

export interface FantasyFormula1OptimizationCandidate extends FantasyFormula1LineupSummary {
  rank: number;
}

export interface BuildFantasyFormula1AssetOptions {
  snapshot: Formula1Snapshot;
}
