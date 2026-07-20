// Manual leagues and fixtures for the score-pools snapshot.
//
// This is the fallback that keeps a pool usable when no provider covers it:
// typed fixtures with hand-entered odds (decimal by default; american and
// fractional convert on build). Entries here merge into provider leagues by
// fixture id or team names, and leagues that no provider serves are built
// entirely from this file plus any CSVs in scripts/data/score-pools/.
//
// The Sample Cup below is fictional demo data so the tool renders end to end
// before a live league or API key is configured. It stays clearly labeled as
// a sample on-page; delete it once a real pool is wired up.

import type { ManualLeagueInput } from "../../src/lib/scorePools/providers/manual";

export const MANUAL_SCORE_POOL_LEAGUES: ManualLeagueInput[] = [
  {
    key: "sample-cup",
    name: "Sample Cup",
    sport: "soccer",
    season: "2026 demo",
    sample: true,
    notes: [
      "Sample data for trying the tool. Teams and odds are fictional; configure a live league in scripts/data/scorePoolsConfig.ts or drop CSV odds in scripts/data/score-pools/ to replace it.",
    ],
    fixtures: [
      {
        id: "sc-r1-4",
        kickoff: "2026-07-14T19:00:00.000Z",
        homeTeam: "Westmoor",
        awayTeam: "Pinewood",
        stage: "Round 1",
        knockout: true,
        odds: {
          moneyline: { home: 2.45, draw: 3.1, away: 3.15 },
          totals: { line: 2.5, over: 2.15, under: 1.75 },
          fetchedAt: "2026-07-14T09:00:00.000Z",
        },
        result: {
          ninetyMinutes: { home: 1, away: 1 },
          afterExtraTime: { home: 1, away: 1 },
          penaltyWinner: "home",
        },
      },
      {
        id: "sc-qf-1",
        kickoff: "2026-08-04T19:00:00.000Z",
        homeTeam: "Harbor City",
        awayTeam: "Ironvale",
        stage: "Quarterfinal",
        knockout: true,
        odds: {
          moneyline: { home: 2.55, draw: 3.05, away: 3.0 },
          totals: { line: 2.5, over: 2.1, under: 1.78 },
          fetchedAt: "2026-07-19T08:00:00.000Z",
        },
      },
      {
        id: "sc-qf-2",
        kickoff: "2026-08-05T16:30:00.000Z",
        homeTeam: "Meridian",
        awayTeam: "Northgate",
        stage: "Quarterfinal",
        knockout: true,
        odds: {
          moneyline: { home: 1.36, draw: 5.0, away: 8.5 },
          totals: { line: 2.5, over: 1.62, under: 2.3 },
          fetchedAt: "2026-07-19T08:00:00.000Z",
        },
      },
      {
        id: "sc-group-1",
        kickoff: "2026-08-06T19:00:00.000Z",
        homeTeam: "Eastport",
        awayTeam: "Silver Coast",
        stage: "Group A, final matchday",
        knockout: false,
        odds: {
          moneyline: { home: 2.7, draw: 3.1, away: 2.75 },
          totals: { line: 2.5, over: 2.0, under: 1.85 },
          fetchedAt: "2026-07-19T08:00:00.000Z",
        },
      },
    ],
    standings: [
      {
        group: "Group A",
        rows: [
          { team: "Eastport", position: 1, played: 2, points: 6, qualified: true, eliminated: null },
          { team: "Silver Coast", position: 2, played: 2, points: 4, qualified: true, eliminated: null },
          { team: "Northgate", position: 3, played: 2, points: 1, qualified: null, eliminated: true },
          { team: "Pinewood", position: 4, played: 2, points: 0, qualified: null, eliminated: true },
        ],
      },
    ],
  },
];
