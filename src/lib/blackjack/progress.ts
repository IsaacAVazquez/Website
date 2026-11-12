/**
 * The trainer's saved progress. One versioned localStorage key holds the
 * decision record, the hand record, the mistakes, the counting record, and the
 * chosen table. Everything read back is validated field by field, and a
 * malformed save falls back to an empty record.
 */

import { getBrowserStorageSnapshot, writeBrowserStorageString } from "@/lib/browserStorage";
import { isRecord, roundTo } from "@/lib/utils";
import type { HandResult } from "./round";
import type { PlayerAction } from "./strategy";
import { DEFAULT_TABLE_RULES, getTableRules } from "./tableRules";

export const BLACKJACK_PROGRESS_STORAGE_KEY = "blackjack_trainer_progress_v1";

const MAX_MISTAKES = 30;
const MAX_SITUATION_LENGTH = 60;
const MAX_COUNT = 1_000_000;
const ACTIONS: readonly PlayerAction[] = ["hit", "stand", "double", "split", "surrender"];

export interface BlackjackMistake {
  /** "Hard 16 against 10". */
  situation: string;
  chose: PlayerAction;
  best: PlayerAction;
  count: number;
  /** ISO timestamp of the latest time this mistake was made. */
  lastAt: string;
}

export interface BlackjackProgress {
  decisions: number;
  correct: number;
  hands: number;
  wins: number;
  losses: number;
  pushes: number;
  /** Net betting units across every hand played. */
  netUnits: number;
  mistakes: BlackjackMistake[];
  countChecks: number;
  countCorrect: number;
  rulesId: string;
}

export function emptyProgress(): BlackjackProgress {
  return {
    decisions: 0,
    correct: 0,
    hands: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    netUnits: 0,
    mistakes: [],
    countChecks: 0,
    countCorrect: 0,
    rulesId: DEFAULT_TABLE_RULES.id,
  };
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.min(Math.floor(value), MAX_COUNT)
    : 0;
}

function isAction(value: unknown): value is PlayerAction {
  return typeof value === "string" && (ACTIONS as readonly string[]).includes(value);
}

function sanitizeMistake(value: unknown): BlackjackMistake | null {
  if (!isRecord(value)) return null;
  const { situation, chose, best, lastAt } = value;
  if (typeof situation !== "string" || !situation.trim()) return null;
  if (!isAction(chose) || !isAction(best) || chose === best) return null;
  const times = count(value.count);
  if (times === 0) return null;
  const parsed = typeof lastAt === "string" ? new Date(lastAt) : new Date(NaN);
  return {
    situation: situation.trim().slice(0, MAX_SITUATION_LENGTH),
    chose,
    best,
    count: times,
    lastAt: Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString(),
  };
}

function sortMistakes(mistakes: BlackjackMistake[]): BlackjackMistake[] {
  return [...mistakes]
    .sort((a, b) => b.count - a.count || b.lastAt.localeCompare(a.lastAt))
    .slice(0, MAX_MISTAKES);
}

export function parseBlackjackProgress(raw: string | null): BlackjackProgress {
  if (!raw) return emptyProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return emptyProgress();
    const decisions = count(value.decisions);
    const countChecks = count(value.countChecks);
    const netUnits =
      typeof value.netUnits === "number" && Number.isFinite(value.netUnits)
        ? roundTo(Math.max(-MAX_COUNT, Math.min(MAX_COUNT, value.netUnits)), 1)
        : 0;
    return {
      decisions,
      correct: Math.min(count(value.correct), decisions),
      hands: count(value.hands),
      wins: count(value.wins),
      losses: count(value.losses),
      pushes: count(value.pushes),
      netUnits,
      mistakes: sortMistakes(
        (Array.isArray(value.mistakes) ? value.mistakes : [])
          .map(sanitizeMistake)
          .filter((mistake): mistake is BlackjackMistake => mistake !== null),
      ),
      countChecks,
      countCorrect: Math.min(count(value.countCorrect), countChecks),
      rulesId: getTableRules(value.rulesId).id,
    };
  } catch {
    return emptyProgress();
  }
}

export function loadBlackjackProgress(): BlackjackProgress {
  if (typeof window === "undefined") return emptyProgress();
  return parseBlackjackProgress(getBrowserStorageSnapshot(BLACKJACK_PROGRESS_STORAGE_KEY, ""));
}

export function saveBlackjackProgress(progress: BlackjackProgress): void {
  writeBrowserStorageString(BLACKJACK_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

export interface GradedDecision {
  situation: string;
  chose: PlayerAction;
  best: PlayerAction;
}

/** Counts one graded decision and files it under its mistake when it was wrong. */
export function recordDecision(
  progress: BlackjackProgress,
  decision: GradedDecision,
  now: Date = new Date(),
): BlackjackProgress {
  const correct = decision.chose === decision.best;
  const next: BlackjackProgress = {
    ...progress,
    decisions: progress.decisions + 1,
    correct: progress.correct + (correct ? 1 : 0),
  };
  if (correct) return next;

  const lastAt = now.toISOString();
  const situation = decision.situation.slice(0, MAX_SITUATION_LENGTH);
  const existing = progress.mistakes.find(
    (mistake) =>
      mistake.situation === situation && mistake.chose === decision.chose && mistake.best === decision.best,
  );
  const mistakes = existing
    ? progress.mistakes.map((mistake) =>
        mistake === existing ? { ...mistake, count: mistake.count + 1, lastAt } : mistake,
      )
    : [...progress.mistakes, { situation, chose: decision.chose, best: decision.best, count: 1, lastAt }];
  return { ...next, mistakes: sortMistakes(mistakes) };
}

/** Adds a settled round's hands to the record. */
export function recordResults(progress: BlackjackProgress, results: readonly HandResult[]): BlackjackProgress {
  const next = { ...progress };
  for (const result of results) {
    next.hands += 1;
    if (result.units > 0) next.wins += 1;
    else if (result.units < 0) next.losses += 1;
    else next.pushes += 1;
    next.netUnits = roundTo(next.netUnits + result.units, 1);
  }
  return next;
}

export function recordCountCheck(progress: BlackjackProgress, correct: boolean): BlackjackProgress {
  return {
    ...progress,
    countChecks: progress.countChecks + 1,
    countCorrect: progress.countCorrect + (correct ? 1 : 0),
  };
}

/** Whole-number percentage, or null when nothing has been counted yet. */
export function percent(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

/** "+2.5", "0", "-1.5" betting units. */
export function formatUnits(units: number): string {
  const rounded = roundTo(units, 1);
  if (rounded > 0) return `+${rounded}`;
  return String(rounded);
}
