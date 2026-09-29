/**
 * MLB Stats API rows cut down from real 2026 responses read on 2026-09-27.
 * They keep the API's own shape, where `date` is the US calendar date the API
 * filters on and `gameDate` is the UTC start.
 */

/**
 * Orioles, 2026-09-21 to 2026-09-27. Game 824785 was rained out on 09-22 and
 * made up on 09-23 under the same gamePk, and the API still reports the
 * rained out row as Final. Game 823489 is the second game of a doubleheader,
 * so its start time is a placeholder.
 */
export const ORIOLES_SCHEDULE_DATES = [
  {
    date: "2026-09-21",
    games: [
      {
        gamePk: 824787,
        gameType: "R",
        gameDate: "2026-09-21T22:35:00Z",
        officialDate: "2026-09-21",
        status: {
          abstractGameState: "Final",
          codedGameState: "F",
          detailedState: "Final",
          statusCode: "F",
          startTimeTBD: false,
          abstractGameCode: "F",
        },
        teams: {
          away: { team: { id: 141, name: "Toronto Blue Jays" }, score: 3, isWinner: false },
          home: { team: { id: 110, name: "Baltimore Orioles" }, score: 4, isWinner: true },
        },
        doubleHeader: "N",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
    ],
  },
  {
    date: "2026-09-22",
    games: [
      {
        gamePk: 824785,
        gameType: "R",
        gameDate: "2026-09-22T22:35:00Z",
        officialDate: "2026-09-23",
        rescheduleDate: "2026-09-23T17:35:00Z",
        status: {
          abstractGameState: "Final",
          codedGameState: "D",
          detailedState: "Postponed",
          statusCode: "DR",
          startTimeTBD: false,
          reason: "Rain",
          abstractGameCode: "F",
        },
        teams: {
          away: { team: { id: 141, name: "Toronto Blue Jays" } },
          home: { team: { id: 110, name: "Baltimore Orioles" } },
        },
        doubleHeader: "N",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
    ],
  },
  {
    date: "2026-09-23",
    games: [
      {
        gamePk: 824785,
        gameType: "R",
        gameDate: "2026-09-23T17:35:00Z",
        officialDate: "2026-09-23",
        rescheduledFrom: "2026-09-22T22:35:00Z",
        status: {
          abstractGameState: "Final",
          codedGameState: "F",
          detailedState: "Final",
          statusCode: "F",
          startTimeTBD: false,
          abstractGameCode: "F",
        },
        teams: {
          away: { team: { id: 141, name: "Toronto Blue Jays" }, score: 2, isWinner: false },
          home: { team: { id: 110, name: "Baltimore Orioles" }, score: 4, isWinner: true },
        },
        doubleHeader: "S",
        description: "Makeup of 9/22 PPD",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
      {
        gamePk: 824784,
        gameType: "R",
        gameDate: "2026-09-23T22:35:00Z",
        officialDate: "2026-09-23",
        status: {
          abstractGameState: "Final",
          codedGameState: "F",
          detailedState: "Final",
          statusCode: "F",
          startTimeTBD: false,
          abstractGameCode: "F",
        },
        teams: {
          away: { team: { id: 141, name: "Toronto Blue Jays" }, score: 2, isWinner: false },
          home: { team: { id: 110, name: "Baltimore Orioles" }, score: 4, isWinner: true },
        },
        doubleHeader: "S",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
    ],
  },
  {
    date: "2026-09-25",
    games: [
      {
        gamePk: 823491,
        gameType: "R",
        gameDate: "2026-09-25T20:05:00Z",
        officialDate: "2026-09-25",
        status: {
          abstractGameState: "Final",
          codedGameState: "F",
          detailedState: "Final",
          statusCode: "F",
          startTimeTBD: false,
          abstractGameCode: "F",
        },
        teams: {
          away: { team: { id: 110, name: "Baltimore Orioles" }, score: 10, isWinner: true },
          home: { team: { id: 147, name: "New York Yankees" }, score: 2, isWinner: false },
        },
        doubleHeader: "Y",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
      {
        gamePk: 823489,
        gameType: "R",
        gameDate: "2026-09-25T20:10:00Z",
        officialDate: "2026-09-25",
        status: {
          abstractGameState: "Final",
          codedGameState: "F",
          detailedState: "Final",
          statusCode: "F",
          startTimeTBD: true,
          abstractGameCode: "F",
        },
        teams: {
          away: { team: { id: 110, name: "Baltimore Orioles" }, score: 3, isWinner: false },
          home: { team: { id: 147, name: "New York Yankees" }, score: 6, isWinner: true },
        },
        doubleHeader: "Y",
        description: "Makeup of 9/26 PPD",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
    ],
  },
  {
    date: "2026-09-27",
    games: [
      {
        gamePk: 823490,
        gameType: "R",
        gameDate: "2026-09-27T17:05:00Z",
        officialDate: "2026-09-27",
        status: {
          abstractGameState: "Preview",
          codedGameState: "P",
          detailedState: "Delayed Start",
          statusCode: "PR",
          startTimeTBD: false,
          reason: "Rain",
          abstractGameCode: "P",
        },
        teams: {
          away: { team: { id: 110, name: "Baltimore Orioles" } },
          home: { team: { id: 147, name: "New York Yankees" } },
        },
        doubleHeader: "N",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
    ],
  },
];

/**
 * Giants at Braves, 2026-06-16 and 2026-06-17. Game 824912 was suspended and
 * finished the next day, so the API lists it under both dates with one score.
 */
export const RESUMED_GAME_SCHEDULE_DATES = [
  {
    date: "2026-06-16",
    games: [
      {
        gamePk: 824912,
        gameType: "R",
        gameDate: "2026-06-16T23:15:00Z",
        officialDate: "2026-06-16",
        resumeDate: "2026-06-17T18:00:00Z",
        status: {
          abstractGameState: "Final",
          codedGameState: "F",
          detailedState: "Final",
          statusCode: "F",
          startTimeTBD: false,
          abstractGameCode: "F",
        },
        teams: {
          away: { team: { id: 137, name: "San Francisco Giants" }, score: 7, isWinner: true },
          home: { team: { id: 144, name: "Atlanta Braves" }, score: 2, isWinner: false },
        },
        doubleHeader: "N",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
    ],
  },
  {
    date: "2026-06-17",
    games: [
      {
        gamePk: 824912,
        gameType: "R",
        gameDate: "2026-06-17T18:00:00Z",
        officialDate: "2026-06-16",
        resumedFrom: "2026-06-16T23:15:00Z",
        status: {
          abstractGameState: "Final",
          codedGameState: "F",
          detailedState: "Final",
          statusCode: "F",
          startTimeTBD: false,
          abstractGameCode: "F",
        },
        teams: {
          away: { team: { id: 137, name: "San Francisco Giants" }, score: 7, isWinner: true },
          home: { team: { id: 144, name: "Atlanta Braves" }, score: 2, isWinner: false },
        },
        doubleHeader: "N",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
      {
        gamePk: 824913,
        gameType: "R",
        gameDate: "2026-06-17T23:15:00Z",
        officialDate: "2026-06-17",
        status: {
          abstractGameState: "Final",
          codedGameState: "F",
          detailedState: "Final",
          statusCode: "F",
          startTimeTBD: false,
          abstractGameCode: "F",
        },
        teams: {
          away: { team: { id: 137, name: "San Francisco Giants" }, score: 7, isWinner: true },
          home: { team: { id: 144, name: "Atlanta Braves" }, score: 5, isWinner: false },
        },
        doubleHeader: "N",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
    ],
  },
];

/**
 * Dodgers, 2026-09-26 into the Division Series. Every Division Series row has
 * `startTimeTBD: true` with a placeholder start of 3:33 AM at the venue, and
 * game 4 is played only if necessary.
 */
export const DODGERS_SCHEDULE_DATES = [
  {
    date: "2026-09-26",
    games: [
      {
        gamePk: 823165,
        gameType: "R",
        gameDate: "2026-09-26T20:05:00Z",
        officialDate: "2026-09-26",
        status: {
          abstractGameState: "Final",
          codedGameState: "F",
          detailedState: "Final",
          statusCode: "F",
          startTimeTBD: false,
          abstractGameCode: "F",
        },
        teams: {
          away: { team: { id: 119, name: "Los Angeles Dodgers" }, score: 4, isWinner: true },
          home: { team: { id: 137, name: "San Francisco Giants" }, score: 3, isWinner: false },
        },
        doubleHeader: "N",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
    ],
  },
  {
    date: "2026-09-27",
    games: [
      {
        gamePk: 823164,
        gameType: "R",
        gameDate: "2026-09-27T19:05:00Z",
        officialDate: "2026-09-27",
        status: {
          abstractGameState: "Live",
          codedGameState: "I",
          detailedState: "In Progress",
          statusCode: "I",
          startTimeTBD: false,
          abstractGameCode: "L",
        },
        teams: {
          away: { team: { id: 119, name: "Los Angeles Dodgers" }, score: 0 },
          home: { team: { id: 137, name: "San Francisco Giants" }, score: 1 },
        },
        doubleHeader: "N",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
    ],
  },
  {
    date: "2026-10-03",
    games: [
      {
        gamePk: 849828,
        gameType: "D",
        gameDate: "2026-10-03T10:33:00Z",
        officialDate: "2026-10-03",
        status: {
          abstractGameState: "Preview",
          codedGameState: "S",
          detailedState: "Scheduled",
          statusCode: "S",
          startTimeTBD: true,
          abstractGameCode: "P",
        },
        teams: {
          away: { team: { id: 5532, name: "NL 3/6 Winner" } },
          home: { team: { id: 119, name: "Los Angeles Dodgers" } },
        },
        doubleHeader: "N",
        description: "NLDS 'B' Game 1",
        seriesDescription: "NL Division Series",
        ifNecessary: "N",
      },
    ],
  },
  {
    date: "2026-10-04",
    games: [
      {
        gamePk: 849823,
        gameType: "D",
        gameDate: "2026-10-04T10:33:00Z",
        officialDate: "2026-10-04",
        status: {
          abstractGameState: "Preview",
          codedGameState: "S",
          detailedState: "Scheduled",
          statusCode: "S",
          startTimeTBD: true,
          abstractGameCode: "P",
        },
        teams: {
          away: { team: { id: 5532, name: "NL 3/6 Winner" } },
          home: { team: { id: 119, name: "Los Angeles Dodgers" } },
        },
        doubleHeader: "N",
        description: "NLDS 'B' Game 2",
        seriesDescription: "NL Division Series",
        ifNecessary: "N",
      },
    ],
  },
  {
    date: "2026-10-06",
    games: [
      {
        gamePk: 849819,
        gameType: "D",
        gameDate: "2026-10-06T07:33:00Z",
        officialDate: "2026-10-06",
        status: {
          abstractGameState: "Preview",
          codedGameState: "S",
          detailedState: "Scheduled",
          statusCode: "S",
          startTimeTBD: true,
          abstractGameCode: "P",
        },
        teams: {
          away: { team: { id: 119, name: "Los Angeles Dodgers" } },
          home: { team: { id: 5532, name: "NL 3/6 Winner" } },
        },
        doubleHeader: "N",
        description: "NLDS 'B' Game 3",
        seriesDescription: "NL Division Series",
        ifNecessary: "N",
      },
    ],
  },
  {
    date: "2026-10-07",
    games: [
      {
        gamePk: 849822,
        gameType: "D",
        gameDate: "2026-10-07T07:33:00Z",
        officialDate: "2026-10-07",
        status: {
          abstractGameState: "Preview",
          codedGameState: "S",
          detailedState: "Scheduled",
          statusCode: "S",
          startTimeTBD: true,
          abstractGameCode: "P",
        },
        teams: {
          away: { team: { id: 119, name: "Los Angeles Dodgers" } },
          home: { team: { id: 5532, name: "NL 3/6 Winner" } },
        },
        doubleHeader: "N",
        description: "NLDS 'B' Game 4",
        seriesDescription: "NL Division Series",
        ifNecessary: "Y",
      },
    ],
  },
];

/**
 * Astros at Athletics as the API reports the series at 03:00 UTC on
 * 2026-09-27. Game 824949 started at 01:40 UTC and belongs to the US date
 * 09-26. The saved response was read after that game ended, so its status
 * block is copied from a row that was in progress when read and its score is
 * filled in to match.
 */
export const LATE_GAME_SCHEDULE_DATES = [
  {
    date: "2026-09-26",
    games: [
      {
        gamePk: 824949,
        gameType: "R",
        gameDate: "2026-09-27T01:40:00Z",
        officialDate: "2026-09-26",
        status: {
          abstractGameState: "Live",
          codedGameState: "I",
          detailedState: "In Progress",
          statusCode: "I",
          startTimeTBD: false,
          abstractGameCode: "L",
        },
        teams: {
          away: { team: { id: 117, name: "Houston Astros" }, score: 6 },
          home: { team: { id: 133, name: "Athletics" }, score: 1 },
        },
        doubleHeader: "N",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
    ],
  },
  {
    date: "2026-09-27",
    games: [
      {
        gamePk: 824948,
        gameType: "R",
        gameDate: "2026-09-27T19:05:00Z",
        officialDate: "2026-09-27",
        status: {
          abstractGameState: "Preview",
          codedGameState: "S",
          detailedState: "Scheduled",
          statusCode: "S",
          startTimeTBD: false,
          abstractGameCode: "P",
        },
        teams: {
          away: { team: { id: 117, name: "Houston Astros" } },
          home: { team: { id: 133, name: "Athletics" } },
        },
        doubleHeader: "N",
        seriesDescription: "Regular Season",
        ifNecessary: "N",
      },
    ],
  },
];

/**
 * Batting average leaders with the season line hydrated onto each player.
 * The leader rows carry no games played field of their own. Luis Arraez was
 * traded, so his line has a combined split followed by one split per club.
 */
export const HYDRATED_LEADERS_RESPONSE = {
  leagueLeaders: [
    {
      leaderCategory: "battingAverage",
      season: "2026",
      statGroup: "hitting",
      leaders: [
        {
          rank: 1,
          value: ".316",
          team: { id: 117, name: "Houston Astros" },
          person: {
            id: 670541,
            fullName: "Yordan Alvarez",
            stats: [
              {
                type: { displayName: "season" },
                group: { displayName: "hitting" },
                splits: [
                  {
                    season: "2026",
                    stat: { gamesPlayed: 158, avg: ".316" },
                    team: { id: 117, name: "Houston Astros" },
                  },
                ],
              },
            ],
          },
          season: "2026",
          numTeams: 1,
        },
        {
          rank: 3,
          value: ".310",
          team: { id: 143, name: "Philadelphia Phillies" },
          person: {
            id: 650333,
            fullName: "Luis Arraez",
            stats: [
              {
                type: { displayName: "season" },
                group: { displayName: "hitting" },
                splits: [
                  { season: "2026", stat: { gamesPlayed: 151, avg: ".310" }, numTeams: 2 },
                  {
                    season: "2026",
                    stat: { gamesPlayed: 105, avg: ".324" },
                    team: { id: 137, name: "San Francisco Giants" },
                  },
                  {
                    season: "2026",
                    stat: { gamesPlayed: 46, avg: ".278" },
                    team: { id: 143, name: "Philadelphia Phillies" },
                  },
                ],
              },
            ],
          },
          season: "2026",
          numTeams: 2,
        },
      ],
    },
  ],
};
