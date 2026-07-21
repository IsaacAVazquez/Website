import * as React from "react";
import { FixtureCard } from "isaac-vazquez-portfolio";

const finished = {
  id: "pl-431",
  utcDate: "2026-05-17T14:00:00Z",
  status: "FINISHED",
  matchday: 37,
  homeTeam: { id: "t-ars", shortName: "Arsenal", crest: null },
  awayTeam: { id: "t-liv", shortName: "Liverpool", crest: null },
  score: { winner: "HOME_TEAM", home: 2, away: 1 },
};

const upcoming = {
  id: "pl-440",
  utcDate: "2026-05-24T15:30:00Z",
  status: "TIMED",
  matchday: 38,
  homeTeam: { id: "t-mci", shortName: "Man City", crest: null },
  awayTeam: { id: "t-che", shortName: "Chelsea", crest: null },
  score: { winner: null, home: null, away: null },
};

const shootout = {
  id: "wc-r16-3",
  utcDate: "2026-07-06T19:00:00Z",
  status: "FINISHED",
  matchday: null,
  homeTeam: { id: "t-ned", shortName: "Netherlands", crest: null },
  awayTeam: { id: "t-arg", shortName: "Argentina", crest: null },
  score: {
    winner: "AWAY_TEAM",
    home: 2,
    away: 2,
    shootoutHome: 3,
    shootoutAway: 4,
  },
};

export const Finished = () => (
  <div className="max-w-md">
    <FixtureCard fixture={finished} />
  </div>
);

export const Upcoming = () => (
  <div className="max-w-md">
    <FixtureCard fixture={upcoming} />
  </div>
);

const finishedDraw = {
  id: "pl-433",
  utcDate: "2026-05-10T14:00:00Z",
  status: "FINISHED",
  matchday: 36,
  homeTeam: { id: "t-liv", shortName: "Liverpool", crest: null },
  awayTeam: { id: "t-tot", shortName: "Tottenham", crest: null },
  score: { winner: "DRAW", home: 1, away: 1 },
};

export const CompactWithTeamContext = () => (
  <div className="max-w-md space-y-2">
    <FixtureCard fixture={finished} compact contextTeamId="t-ars" />
    <FixtureCard fixture={finishedDraw} compact contextTeamId="t-liv" />
    <FixtureCard fixture={finished} compact contextTeamId="t-liv" />
  </div>
);

export const ShootoutDecided = () => (
  <div className="max-w-md">
    <FixtureCard fixture={shootout} periodLabel="Round of 16" fallbackLabel="Knockout tie" />
  </div>
);
