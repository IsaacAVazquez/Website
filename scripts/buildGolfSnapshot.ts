#!/usr/bin/env tsx
/**
 * Refreshes src/data/golfSnapshot.json from ESPN's public golf leaderboard.
 *
 *   npm run update:golf
 *
 * ESPN's site API needs no token. The script tracks whichever PGA Tour event
 * ESPN is currently featuring (in-progress event preferred, else most recent).
 * If the fetch or parse fails, the existing snapshot is kept instead of being
 * wiped — matching the Formula 1 pipeline.
 */

import { resolve } from "node:path";

import { GolfNoLiveEventError, buildGolfSnapshotData } from "../src/lib/golfData";
import type { GolfSnapshot } from "../src/types/golf";
import { readGeneratedSnapshot, writeFileAtomic } from "./snapshotFallback";

function hasContents(snapshot: GolfSnapshot | null): snapshot is GolfSnapshot {
  return Boolean(snapshot && snapshot.summary.leaderboard.length > 0);
}

/**
 * A re-stamp vouches that the committed board is still the newest one there
 * is. The longest gap between PGA Tour boards is about four weeks over the
 * winter break, so past this age the claim stops being believable and the
 * freshness gate is left to go red.
 */
const MAX_RESTAMP_DAYS = 45;

function isRecentBoard(endDate: string | undefined): boolean {
  const endedAt = Date.parse(endDate ?? "");
  return (
    Number.isFinite(endedAt) &&
    Date.now() - endedAt <= MAX_RESTAMP_DAYS * 24 * 60 * 60 * 1000
  );
}

async function main() {
  const outPath = resolve(__dirname, "../src/data/golfSnapshot.json");

  let snapshot: GolfSnapshot;
  try {
    console.log("⛳ Building golf snapshot from ESPN…");
    snapshot = await buildGolfSnapshotData();
  } catch (error) {
    const existing = readGeneratedSnapshot<GolfSnapshot>(outPath);
    if (!hasContents(existing)) {
      throw error;
    }
    if (
      !(error instanceof GolfNoLiveEventError) ||
      !existing.summary.tournament ||
      !isRecentBoard(existing.summary.tournament.endDate)
    ) {
      console.warn(
        "⛳ Golf snapshot refresh failed; keeping the existing snapshot.",
        error
      );
      return;
    }
    // Between tournaments, and during a team event, ESPN has no individual
    // field to score, so the last final board is still the freshest data that
    // exists. Re-stamp its verification time so the freshness gate reads a
    // checked source rather than a frozen one for the whole off week.
    const generatedAt = new Date().toISOString();
    snapshot = {
      ...existing,
      summary: {
        ...existing.summary,
        tournament: { ...existing.summary.tournament, generatedAt },
      },
    };
    console.log(
      `⛳ ${error.message} Re-verified the ${existing.summary.tournament.name} board at ${generatedAt}.`
    );
  }

  const output = JSON.stringify(snapshot, null, 2) + "\n";
  writeFileAtomic(outPath, output);

  const tournament = snapshot.summary.tournament;
  console.log(
    `⛳ Done. ${tournament?.name ?? "Unknown event"} — ` +
      `${snapshot.summary.leaderboard.length} players, leader ` +
      `${snapshot.summary.heroStats.leaderName ?? "?"} ` +
      `(${snapshot.summary.heroStats.leaderScore ?? "?"}).`
  );
}

main().catch((err) => {
  console.error("Golf snapshot update failed:", err);
  process.exit(1);
});
