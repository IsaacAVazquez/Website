import * as React from "react";
import { ResultsTape, type ResultsTapeFixture } from "isaac-vazquez-portfolio";

const recentResults: ResultsTapeFixture[] = [
  {
    id: "pl-371",
    utcDate: "2026-05-16T14:00:00Z",
    status: "FINISHED",
    homeTeam: { shortName: "Arsenal", tla: "ARS" },
    awayTeam: { shortName: "Liverpool", tla: "LIV" },
    score: { winner: "HOME_TEAM", home: 2, away: 1 },
  },
  {
    id: "pl-372",
    utcDate: "2026-05-16T16:30:00Z",
    status: "FINISHED",
    homeTeam: { shortName: "Tottenham", tla: "TOT" },
    awayTeam: { shortName: "Chelsea", tla: "CHE" },
    score: { winner: "DRAW", home: 2, away: 2 },
  },
  {
    id: "pl-373",
    utcDate: "2026-05-17T13:00:00Z",
    status: "FINISHED",
    homeTeam: { shortName: "Everton", tla: "EVE" },
    awayTeam: { shortName: "Man City", tla: "MCI" },
    score: { winner: "AWAY_TEAM", home: 0, away: 3 },
  },
];

const upcomingFixtures: ResultsTapeFixture[] = [
  {
    id: "pl-381",
    utcDate: "2026-05-24T14:00:00Z",
    status: "TIMED",
    homeTeam: { shortName: "Newcastle", tla: "NEW" },
    awayTeam: { shortName: "Aston Villa", tla: "AVL" },
    score: { winner: null, home: null, away: null },
  },
  {
    id: "pl-382",
    utcDate: "2026-05-24T14:00:00Z",
    status: "TIMED",
    homeTeam: { shortName: "Brighton", tla: "BHA" },
    awayTeam: { shortName: "West Ham", tla: "WHU" },
    score: { winner: null, home: null, away: null },
  },
];

const tapeShell: React.CSSProperties = {
  border: "1px solid var(--home-rule)",
  background: "var(--home-paper-alt)",
  borderRadius: 8,
  padding: "4px 16px",
};

const signalDot = (
  <span
    style={{
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "var(--home-signal)",
      flexShrink: 0,
    }}
  />
);

export const MatchdayLatest = () => (
  <div style={tapeShell}>
    <ResultsTape
      recentFixtures={recentResults}
      upcomingFixtures={upcomingFixtures.slice(0, 1)}
      label={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {signalDot}
          Matchday 37 · latest
        </span>
      }
    />
  </div>
);

export const ResultsOnly = () => (
  <div style={tapeShell}>
    <ResultsTape
      recentFixtures={recentResults}
      upcomingFixtures={[]}
      label="Full time"
    />
  </div>
);

export const UpcomingOnly = () => (
  <div style={tapeShell}>
    <ResultsTape
      recentFixtures={[]}
      upcomingFixtures={upcomingFixtures}
      label="Next kickoffs"
    />
  </div>
);
