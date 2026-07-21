import * as React from "react";
import { FixtureGroupSection, type GenericFixture } from "isaac-vazquez-portfolio";

const worldCupUpcoming: GenericFixture[] = [
  {
    id: "wc-gs-14",
    utcDate: "2026-06-13T16:00:00Z",
    status: "TIMED",
    matchday: null,
    homeTeam: { id: "t-usa", shortName: "United States", crest: null },
    awayTeam: { id: "t-wal", shortName: "Wales", crest: null },
    score: { winner: null, home: null, away: null },
  },
  {
    id: "wc-gs-15",
    utcDate: "2026-06-13T22:00:00Z",
    status: "TIMED",
    matchday: null,
    homeTeam: { id: "t-mex", shortName: "Mexico", crest: null },
    awayTeam: { id: "t-pol", shortName: "Poland", crest: null },
    score: { winner: null, home: null, away: null },
  },
];

const groupLabels: Record<string, string> = {
  "wc-gs-14": "Group D · Match 14",
  "wc-gs-15": "Group A · Match 15",
};

export const UpcomingMatches = () => (
  <div className="max-w-xl">
    <FixtureGroupSection
      title="Next up"
      description="Upcoming matches"
      fixtures={worldCupUpcoming}
      getFallbackLabel={(fixture) => groupLabels[fixture.id]}
    />
  </div>
);

const premierLeagueResults: GenericFixture[] = [
  {
    id: "pl-361",
    utcDate: "2026-05-09T14:00:00Z",
    status: "FINISHED",
    matchday: 36,
    homeTeam: { id: "t-ars", shortName: "Arsenal", crest: null },
    awayTeam: { id: "t-new", shortName: "Newcastle", crest: null },
    score: { winner: "HOME_TEAM", home: 3, away: 1 },
  },
  {
    id: "pl-362",
    utcDate: "2026-05-09T16:30:00Z",
    status: "FINISHED",
    matchday: 36,
    homeTeam: { id: "t-tot", shortName: "Tottenham", crest: null },
    awayTeam: { id: "t-che", shortName: "Chelsea", crest: null },
    score: { winner: "DRAW", home: 2, away: 2 },
  },
];

export const LatestResults = () => (
  <div className="max-w-xl">
    <FixtureGroupSection
      title="Recent slate"
      description="Latest results"
      fixtures={premierLeagueResults}
    />
  </div>
);

export const EmptyState = () => (
  <div className="max-w-xl">
    <FixtureGroupSection
      title="Next up"
      description="Upcoming matches"
      fixtures={[]}
    />
  </div>
);
