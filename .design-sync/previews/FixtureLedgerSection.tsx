import * as React from "react";
import {
  FixtureLedgerSection,
  groupFixturesByMatchday,
  type GenericFixture,
} from "isaac-vazquez-portfolio";

const recentFixtures: GenericFixture[] = [
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
  {
    id: "pl-371",
    utcDate: "2026-05-16T14:00:00Z",
    status: "FINISHED",
    matchday: 37,
    homeTeam: { id: "t-eve", shortName: "Everton", crest: null },
    awayTeam: { id: "t-mci", shortName: "Man City", crest: null },
    score: { winner: "AWAY_TEAM", home: 0, away: 3 },
  },
  {
    id: "pl-372",
    utcDate: "2026-05-16T16:30:00Z",
    status: "FINISHED",
    matchday: 37,
    homeTeam: { id: "t-liv", shortName: "Liverpool", crest: null },
    awayTeam: { id: "t-bha", shortName: "Brighton", crest: null },
    score: { winner: "HOME_TEAM", home: 4, away: 2 },
  },
];

export const RecentResults = () => (
  <div className="max-w-xl">
    <FixtureLedgerSection groups={groupFixturesByMatchday(recentFixtures)} />
  </div>
);

const upcomingFixtures: GenericFixture[] = [
  {
    id: "pl-381",
    utcDate: "2026-05-24T14:00:00Z",
    status: "TIMED",
    matchday: 38,
    homeTeam: { id: "t-new", shortName: "Newcastle", crest: null },
    awayTeam: { id: "t-avl", shortName: "Aston Villa", crest: null },
    score: { winner: null, home: null, away: null },
  },
  {
    id: "pl-382",
    utcDate: "2026-05-24T14:00:00Z",
    status: "TIMED",
    matchday: 38,
    homeTeam: { id: "t-bha", shortName: "Brighton", crest: null },
    awayTeam: { id: "t-whu", shortName: "West Ham", crest: null },
    score: { winner: null, home: null, away: null },
  },
  {
    id: "pl-383",
    utcDate: "2026-05-24T14:00:00Z",
    status: "TIMED",
    matchday: 38,
    homeTeam: { id: "t-ful", shortName: "Fulham", crest: null },
    awayTeam: { id: "t-cry", shortName: "Crystal Palace", crest: null },
    score: { winner: null, home: null, away: null },
  },
  {
    id: "pl-399",
    utcDate: "2026-05-27T18:45:00Z",
    status: "TIMED",
    matchday: null,
    homeTeam: { id: "t-bou", shortName: "Bournemouth", crest: null },
    awayTeam: { id: "t-wol", shortName: "Wolves", crest: null },
    score: { winner: null, home: null, away: null },
  },
];

export const UpcomingSlate = () => (
  <div className="max-w-xl">
    <FixtureLedgerSection
      groups={groupFixturesByMatchday(upcomingFixtures, {
        suffix: "upcoming",
        fallbackLabel: "Rearranged",
      })}
    />
  </div>
);
