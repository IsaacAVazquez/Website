// League source configuration for the score-pools snapshot builder.
//
// Each entry wires one league to its providers: The Odds API sport key for
// odds, API-Football league id + season for fixtures/results/standings.
// Leagues with null providers run entirely on manual/CSV entries. Add a
// league here (and, if the odds provider spells team names differently,
// teamAliases mapping odds-provider name → fixtures-provider name), then run
// `npm run update:score-pools`.

import type { ScorePoolLeagueSource } from "../../src/lib/scorePoolsData";

export const SCORE_POOL_LEAGUES: ScorePoolLeagueSource[] = [
  {
    key: "premier-league",
    name: "Premier League",
    sport: "soccer",
    season: "2026-27",
    theOddsApiSportKey: "soccer_epl",
    apiFootball: { leagueId: 39, season: 2026 },
    knockoutRoundPattern: null,
    teamAliases: {
      "Manchester United": "Manchester United",
      "Brighton and Hove Albion": "Brighton",
      "Tottenham Hotspur": "Tottenham",
      "Newcastle United": "Newcastle",
      "Nottingham Forest": "Nottingham Forest",
    },
  },
];
