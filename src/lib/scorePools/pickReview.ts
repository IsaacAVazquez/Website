import { isRecord } from "../utils";
import { isSourceTime } from "../personalFollowing";
import { scorePick } from "./scoring";
import type { StoredPool } from "./persistence";
import type { PoolFixtureAnalysis } from "./poolAnalysis";
import type { MatchResultInput, Scoreline, ScoringRules } from "./types";
import type { SnapshotOddsEntry } from "@/types/scorePools";

interface ReviewChoice {
  label: string;
  score: Scoreline;
  expectedPoints: number;
}
export interface SavedPickReview {
  recordedAt: string;
  sourceAt: string;
  rules: ScoringRules;
  recommended: ReviewChoice;
  alternatives: ReviewChoice[];
  odds: SnapshotOddsEntry | null;
}

export function capturePickReview(
  item: PoolFixtureAnalysis,
  pool: StoredPool,
  sourceAt: string,
  recordedAt = item.analysis.asOf,
): SavedPickReview | undefined {
  const { fixture, analysis } = item;
  if (
    fixture.status !== "scheduled" ||
    fixture.result ||
    !isSourceTime(recordedAt) ||
    Date.parse(recordedAt) >= Date.parse(analysis.locksAt) ||
    Date.parse(analysis.asOf) > Date.parse(recordedAt)
  )
    return undefined;
  const rec = analysis.recommendation;
  const choice = (
    label: string,
    pick: typeof rec.recommended,
  ): ReviewChoice => ({
    label,
    score: { ...pick.score },
    expectedPoints: pick.expectedPoints,
  });
  const manual = pool.manualOdds[fixture.id];
  const odds = manual
    ? {
        fetchedAt: manual.enteredAt,
        bookmaker: null,
        manual: true,
        moneyline: { home: manual.home, draw: manual.draw, away: manual.away },
        totals:
          manual.line === null
            ? null
            : { line: manual.line, over: manual.over, under: manual.under },
      }
    : (fixture.odds.at(-1) ?? null);
  if (odds && Date.parse(odds.fetchedAt) > Date.parse(recordedAt))
    return undefined;
  return decodePickReview({
    recordedAt,
    sourceAt,
    rules: pool.rules,
    recommended: choice("Recommendation", rec.recommended),
    alternatives: [
      choice("Higher floor", rec.safest),
      ...(rec.differentiator
        ? [choice("Differentiator", rec.differentiator)]
        : []),
    ],
    odds,
  });
}

function decodeChoice(value: unknown): ReviewChoice | undefined {
  if (
    !isRecord(value) ||
    typeof value.label !== "string" ||
    !value.label.trim() ||
    value.label.length > 80 ||
    !isRecord(value.score) ||
    ![value.score.home, value.score.away].every(
      (n) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 15,
    ) ||
    typeof value.expectedPoints !== "number" ||
    !Number.isFinite(value.expectedPoints) ||
    value.expectedPoints < 0 ||
    value.expectedPoints > 100
  )
    return undefined;
  return {
    label: value.label,
    score: {
      home: value.score.home as number,
      away: value.score.away as number,
    },
    expectedPoints: value.expectedPoints,
  };
}

export function decodePickReview(value: unknown): SavedPickReview | undefined {
  if (
    !isRecord(value) ||
    !isSourceTime(value.recordedAt) ||
    !isSourceTime(value.sourceAt) ||
    !isRecord(value.rules)
  )
    return undefined;
  const rules = value.rules;
  if (
    ![rules.exact, rules.correctDifference, rules.correctOutcome].every(
      (n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100,
    ) ||
    !["ninetyMinutes", "finalResult"].includes(rules.basis as string) ||
    typeof rules.penaltiesCountAsWin !== "boolean"
  )
    return undefined;
  const recommended = decodeChoice(value.recommended);
  if (
    !recommended ||
    !Array.isArray(value.alternatives) ||
    value.alternatives.length > 3
  )
    return undefined;
  const alternatives = value.alternatives.map(decodeChoice);
  if (alternatives.some((choice) => !choice)) return undefined;
  let odds: SnapshotOddsEntry | null = null;
  const raw = value.odds;
  const price = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n) && n > 1 && n <= 100000;
  if (raw !== null) {
    if (
      !isRecord(raw) ||
      !isSourceTime(raw.fetchedAt) ||
      !isRecord(raw.moneyline) ||
      !price(raw.moneyline.home) ||
      !price(raw.moneyline.away) ||
      (raw.moneyline.draw !== null && !price(raw.moneyline.draw)) ||
      typeof raw.manual !== "boolean" ||
      (raw.bookmaker !== null && typeof raw.bookmaker !== "string")
    )
      return undefined;
    let totals: SnapshotOddsEntry["totals"] = null;
    if (raw.totals !== null) {
      if (
        !isRecord(raw.totals) ||
        typeof raw.totals.line !== "number" ||
        !Number.isFinite(raw.totals.line) ||
        raw.totals.line < 0 ||
        raw.totals.line > 100 ||
        (raw.totals.over !== null && !price(raw.totals.over)) ||
        (raw.totals.under !== null && !price(raw.totals.under))
      )
        return undefined;
      totals = {
        line: raw.totals.line,
        over: raw.totals.over as number | null,
        under: raw.totals.under as number | null,
      };
    }
    odds = {
      fetchedAt: raw.fetchedAt,
      bookmaker:
        typeof raw.bookmaker === "string" ? raw.bookmaker.slice(0, 120) : null,
      manual: raw.manual,
      moneyline: {
        home: raw.moneyline.home as number,
        draw: raw.moneyline.draw as number | null,
        away: raw.moneyline.away as number,
      },
      totals,
    };
  }
  return {
    recordedAt: value.recordedAt,
    sourceAt: value.sourceAt,
    rules: {
      exact: rules.exact as number,
      correctDifference: rules.correctDifference as number,
      correctOutcome: rules.correctOutcome as number,
      basis: rules.basis as ScoringRules["basis"],
      penaltiesCountAsWin: rules.penaltiesCountAsWin,
    },
    recommended,
    alternatives: alternatives as ReviewChoice[],
    odds,
  };
}

export function scoreReviewedPick(
  pick: Scoreline,
  result: MatchResultInput,
  review: SavedPickReview,
) {
  return {
    chosen: scorePick(pick, result, review.rules).points,
    choices: [review.recommended, ...review.alternatives].map((choice) => ({
      ...choice,
      points: scorePick(choice.score, result, review.rules).points,
    })),
  };
}
