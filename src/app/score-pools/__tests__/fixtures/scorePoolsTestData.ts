// Shared builders for the score-pools UI tests. Dates are relative to the
// real clock because each client takes its own "now" from new Date().

import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import {
  createPool,
  SCORE_POOLS_STORAGE_KEY,
  type ScorePoolsStore,
  type StoredPool,
} from "@/lib/scorePools/persistence";
import type {
  ScorePoolLeagueSnapshot,
  ScorePoolsSnapshot,
  SnapshotFixture,
  SnapshotOddsEntry,
} from "@/types/scorePools";

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export function isoFromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

export function odds(overrides: Partial<SnapshotOddsEntry> = {}): SnapshotOddsEntry {
  return {
    fetchedAt: isoFromNow(-2 * HOUR),
    bookmaker: "pinnacle",
    manual: false,
    moneyline: { home: 2.1, draw: 3.4, away: 3.6 },
    totals: { line: 2.5, over: 1.95, under: 1.9 },
    ...overrides,
  };
}

export function fixture(overrides: Partial<SnapshotFixture> = {}): SnapshotFixture {
  return {
    id: "fx-1",
    kickoff: isoFromNow(3 * DAY),
    homeTeam: "Harbor City",
    awayTeam: "Ironvale",
    stage: "Matchday 1",
    round: null,
    knockout: false,
    status: "scheduled",
    result: null,
    lineupsConfirmed: null,
    injuryNotes: [],
    odds: [odds()],
    ...overrides,
  };
}

export function league(overrides: Partial<ScorePoolLeagueSnapshot> = {}): ScorePoolLeagueSnapshot {
  return {
    key: "test-league",
    name: "Test League",
    sport: "soccer",
    season: "2026",
    sources: { fixtures: "football-data", odds: "the-odds-api" },
    generatedAt: isoFromNow(-3 * HOUR),
    sample: false,
    notes: [],
    fixtures: [fixture()],
    standings: [],
    ...overrides,
  };
}

export function snapshot(leagues: ScorePoolLeagueSnapshot[]): ScorePoolsSnapshot {
  return { generatedAt: isoFromNow(-3 * HOUR), leagues };
}

export function pool(overrides: Partial<StoredPool> = {}): StoredPool {
  return { ...createPool("test-league", "Office pool"), id: "pool-1", ...overrides };
}

/** Seed the store the hook reads, and drop the storage module's cached copy. */
export function seedStore(pools: StoredPool[], activePoolId: string | null = pools[0]?.id ?? null) {
  const store: ScorePoolsStore = { version: 1, activePoolId, pools };
  window.localStorage.setItem(SCORE_POOLS_STORAGE_KEY, JSON.stringify(store));
  resetBrowserStorageMemory();
}

export function readStore(): ScorePoolsStore {
  return JSON.parse(window.localStorage.getItem(SCORE_POOLS_STORAGE_KEY) ?? "null") as ScorePoolsStore;
}

export function resetStore() {
  window.localStorage.clear();
  resetBrowserStorageMemory();
}
