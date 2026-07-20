/**
 * @jest-environment node
 */
import {
  buildMlbLiveSummaryData,
  getCurrentSeason,
  getMlbSummary,
  getMlbTeamSnapshot,
  isValidMlbTeamId,
  createEmptyMlbSnapshot,
} from "../mlbData";
import type { MlbGame, MlbSummarySnapshot, MlbTeamOption } from "@/types/mlb";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// ---- Fixtures -------------------------------------------------------------

const AL_LEAGUE_ID = 103;
const NL_LEAGUE_ID = 104;

function teamsPayload() {
  return {
    teams: [
      {
        id: 147,
        name: "New York Yankees",
        teamName: "Yankees",
        shortName: "NY Yankees",
        locationName: "New York",
        abbreviation: "NYY",
        league: { id: AL_LEAGUE_ID, name: "American League" },
        division: { id: 201, name: "American League East" },
        venue: { name: "Yankee Stadium" },
        firstYearOfPlay: "1903",
      },
      {
        id: 111,
        name: "Boston Red Sox",
        teamName: "Red Sox",
        shortName: "Boston",
        locationName: "Boston",
        abbreviation: "BOS",
        league: { id: AL_LEAGUE_ID, name: "American League" },
        division: { id: 201, name: "American League East" },
        venue: { name: "Fenway Park" },
        firstYearOfPlay: "1901",
      },
      {
        id: 119,
        name: "Los Angeles Dodgers",
        teamName: "Dodgers",
        shortName: "LA Dodgers",
        locationName: "Los Angeles",
        abbreviation: "LAD",
        league: { id: NL_LEAGUE_ID, name: "National League" },
        division: { id: 203, name: "National League West" },
        venue: { name: "Dodger Stadium" },
        firstYearOfPlay: "1884",
      },
      // A team in neither AL nor NL (e.g. a spring/other league) must be dropped.
      {
        id: 999,
        name: "Phantom Club",
        teamName: "Phantoms",
        abbreviation: "PHA",
        league: { id: 160, name: "Cactus League" },
        division: { id: 999, name: "Cactus West" },
        venue: { name: "Nowhere Park" },
        firstYearOfPlay: "2099",
      },
    ],
  };
}

function standingsPayload() {
  return {
    records: [
      {
        league: { id: AL_LEAGUE_ID, name: "American League" },
        division: { id: 201, name: "American League East" },
        teamRecords: [
          {
            team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
            divisionRank: "2",
            leagueRank: "3",
            wildCardRank: "1",
            divisionGamesBack: "4.0",
            wildCardGamesBack: "-",
            wins: 50,
            losses: 40,
            winningPercentage: ".556",
            runsScored: 420,
            runsAllowed: 390,
            runDifferential: 30,
            streak: { streakCode: "W2" },
            records: {
              splitRecords: [
                { type: "lastTen", wins: 6, losses: 4 },
                { type: "home", wins: 28, losses: 18 },
              ],
            },
          },
          {
            team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
            divisionRank: "1",
            leagueRank: "1",
            wildCardRank: null,
            divisionGamesBack: "-",
            wildCardGamesBack: "-",
            wins: 55,
            losses: 35,
            winningPercentage: ".611",
            runsScored: 460,
            runsAllowed: 360,
            runDifferential: 100,
            streak: { streakCode: "W4" },
            records: {
              splitRecords: [{ type: "lastTen", wins: 7, losses: 3 }],
            },
          },
        ],
      },
      {
        league: { id: NL_LEAGUE_ID, name: "National League" },
        division: { id: 203, name: "National League West" },
        teamRecords: [
          {
            team: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
            divisionRank: "1",
            leagueRank: "1",
            wildCardRank: null,
            divisionGamesBack: "-",
            wildCardGamesBack: "-",
            wins: 58,
            losses: 32,
            winningPercentage: ".644",
            runsScored: 480,
            runsAllowed: 350,
            runDifferential: 130,
            streak: { streakCode: "L1" },
            records: { splitRecords: [{ type: "lastTen", wins: 5, losses: 5 }] },
          },
        ],
      },
    ],
  };
}

function recentSchedulePayload() {
  return {
    dates: [
      {
        date: "2026-06-19",
        games: [
          {
            gamePk: 700001,
            gameDate: "2026-06-19T23:05:00Z",
            gameType: "R",
            status: { abstractGameState: "Final", detailedState: "Final" },
            teams: {
              home: {
                team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
                score: 6,
                isWinner: true,
              },
              away: {
                team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
                score: 3,
                isWinner: false,
              },
            },
          },
        ],
      },
      {
        date: "2026-06-20",
        games: [
          {
            gamePk: 700002,
            gameDate: "2026-06-20T23:05:00Z",
            gameType: "R",
            status: { abstractGameState: "Final", detailedState: "Final" },
            teams: {
              home: {
                team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
                score: 2,
                isWinner: false,
              },
              away: {
                team: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
                score: 5,
                isWinner: true,
              },
            },
          },
          // A non-final game inside the recent window must be excluded.
          {
            gamePk: 700003,
            gameDate: "2026-06-20T20:00:00Z",
            gameType: "R",
            status: { abstractGameState: "Live", detailedState: "In Progress" },
            teams: {
              home: {
                team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
                score: 1,
              },
              away: {
                team: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
                score: 1,
              },
            },
          },
        ],
      },
    ],
  };
}

function upcomingSchedulePayload() {
  return {
    dates: [
      {
        date: "2026-06-24",
        games: [
          {
            gamePk: 800001,
            gameDate: "2026-06-24T23:05:00Z",
            gameType: "R",
            status: { abstractGameState: "Preview", detailedState: "Scheduled" },
            teams: {
              home: {
                team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
              },
              away: {
                team: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
              },
            },
          },
        ],
      },
      {
        date: "2026-06-25",
        games: [
          {
            gamePk: 800002,
            gameDate: "2026-06-25T23:05:00Z",
            gameType: "R",
            status: { abstractGameState: "Preview", detailedState: "Scheduled" },
            teams: {
              home: {
                team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
              },
              away: {
                team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
              },
            },
          },
        ],
      },
    ],
  };
}

function leadersPayload(category: string) {
  // Use distinct values so we can confirm the right category routed through.
  const value = category === "battingAverage" ? "0.345" : "30";
  return {
    leagueLeaders: [
      {
        leaderCategory: category,
        statGroup: "hitting",
        season: "2026",
        leaders: [
          {
            rank: 1,
            value,
            person: { id: 5001, fullName: "Aaron Judge" },
            team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
            numGames: 90,
          },
          {
            rank: 2,
            value: category === "battingAverage" ? "0.330" : "28",
            person: { id: 5002, fullName: "Mookie Betts" },
            team: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
            numGames: 88,
          },
          // Malformed entry (missing person name) must be dropped.
          {
            rank: 3,
            value: "27",
            person: { id: 5003, fullName: null },
            team: { id: 111, abbreviation: "BOS" },
            numGames: 85,
          },
        ],
      },
    ],
  };
}

// ---- Routing --------------------------------------------------------------

function routeFetch(input: RequestInfo | URL): Response {
  const url = typeof input === "string" ? input : input.toString();

  if (url.includes("/teams?")) {
    return jsonResponse(teamsPayload());
  }
  if (url.includes("/standings?")) {
    return jsonResponse(standingsPayload());
  }
  if (url.includes("/stats/leaders?")) {
    const match = url.match(/leaderCategories=([^&]+)/);
    const category = match ? decodeURIComponent(match[1]) : "homeRuns";
    return jsonResponse(leadersPayload(category));
  }
  if (url.includes("/schedule?")) {
    // Distinguish recent vs upcoming windows by the startDate query param.
    // Recent window starts in the past (startDate < today); upcoming starts today/future.
    const startMatch = url.match(/startDate=([^&]+)/);
    const endMatch = url.match(/endDate=([^&]+)/);
    const start = startMatch ? startMatch[1] : "";
    const end = endMatch ? endMatch[1] : "";
    // Recent schedule's endDate is yesterday (offset -1); upcoming's startDate is today (offset 0).
    // The recent window's start is strictly before its end and both are in the past.
    const today = new Date().toISOString().slice(0, 10);
    if (end < today || end === undefined) {
      return jsonResponse(recentSchedulePayload());
    }
    if (start >= today) {
      return jsonResponse(upcomingSchedulePayload());
    }
    // Fallback: treat as recent.
    return jsonResponse(recentSchedulePayload());
  }

  throw new Error(`Unexpected fetch URL in test: ${url}`);
}

describe("getCurrentSeason", () => {
  // The MLB regular season and postseason (through the early-November World
  // Series) all resolve within the same calendar year. The refresh cron runs
  // March through November, never December, so the season should only roll
  // forward in December — not in November, when a next-season request would
  // return empty/zeroed standings and break World Series coverage.
  it("keeps the current year through November (World Series window)", () => {
    expect(getCurrentSeason(new Date("2026-11-15T12:00:00Z"))).toBe("2026");
  });

  it("rolls forward to the next season in December", () => {
    expect(getCurrentSeason(new Date("2026-12-15T12:00:00Z"))).toBe("2027");
  });

  it("returns the current year mid-season", () => {
    expect(getCurrentSeason(new Date("2026-07-04T12:00:00Z"))).toBe("2026");
  });
});

describe("getMlbSummary", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds a summary with sorted standings, normalized leaders, and split schedule", async () => {
    jest
      .spyOn(global, "fetch")
      .mockImplementation(async (input: RequestInfo | URL) =>
        routeFetch(input)
      );

    const summary = await getMlbSummary();

    // --- Teams: AL/NL only, non-MLB league dropped, sorted by shortName. ---
    expect(summary.teams).toHaveLength(3);
    expect(summary.teams.some((t) => t.abbreviation === "PHA")).toBe(false);
    const shortNames = summary.teams.map((t) => t.shortName);
    expect([...shortNames].sort((a, b) => a.localeCompare(b))).toEqual(
      shortNames
    );
    const yankees = summary.teams.find((t) => t.id === "147");
    expect(yankees).toMatchObject({
      name: "New York Yankees",
      shortName: "Yankees",
      abbreviation: "NYY",
      league: "AL",
      division: "AL East",
      venue: "Yankee Stadium",
    });
    expect(yankees?.logo).toContain("147.svg");

    // --- Standings: populated and sorted by league, division, divisionRank. ---
    expect(summary.standings).toHaveLength(3);
    // AL sorts before NL; within AL East, divisionRank 1 (Yankees) precedes 2 (Red Sox).
    expect(summary.standings.map((r) => r.code)).toEqual([
      "NYY",
      "BOS",
      "LAD",
    ]);
    const yankeesRow = summary.standings[0];
    expect(yankeesRow.wins).toBe(55);
    expect(yankeesRow.losses).toBe(35);
    expect(yankeesRow.pct).toBeCloseTo(0.611, 3);
    expect(yankeesRow.divisionRank).toBe(1);
    expect(yankeesRow.gamesBack).toBe(0); // "-" parses to 0
    expect(yankeesRow.runDifferential).toBe(100);
    expect(yankeesRow.streak).toBe("W4");
    expect(yankeesRow.last10).toBe("7-3");

    const redSoxRow = summary.standings[1];
    expect(redSoxRow.gamesBack).toBe(4); // "4.0" parses to 4
    expect(redSoxRow.wildCardRank).toBe(1);
    expect(redSoxRow.last10).toBe("6-4");

    // --- Recent games: only FINISHED, sorted newest-first. ---
    expect(summary.recentGames).toHaveLength(2);
    expect(summary.recentGames.every((g) => g.status === "FINISHED")).toBe(
      true
    );
    // 06-20 game is newer than 06-19 game.
    expect(summary.recentGames[0].id).toBe("700002");
    expect(summary.recentGames[1].id).toBe("700001");
    // Winner derivation from scores.
    const yanksWin = summary.recentGames.find((g) => g.id === "700001");
    expect(yanksWin?.score.winner).toBe("HOME_TEAM");
    expect(yanksWin?.score.home).toBe(6);
    expect(yanksWin?.score.away).toBe(3);
    // Known-team enrichment: home team shortName comes from team lookup.
    expect(yanksWin?.homeTeam.shortName).toBe("Yankees");

    // --- Upcoming games: only non-FINISHED, sorted oldest-first. ---
    expect(summary.upcomingGames).toHaveLength(2);
    expect(
      summary.upcomingGames.every((g) => g.status !== "FINISHED")
    ).toBe(true);
    expect(summary.upcomingGames[0].id).toBe("800001");
    expect(summary.upcomingGames[1].id).toBe("800002");

    // --- Leaders: normalized, malformed entries dropped, perGame derived. ---
    const hr = summary.hittingLeaders.homeRuns;
    expect(hr).toHaveLength(2); // third entry (null name) dropped
    expect(hr[0]).toMatchObject({
      rank: 1,
      name: "Aaron Judge",
      teamId: "147",
      teamCode: "NYY",
      total: 30,
      games: 90,
    });
    expect(hr[0].perGame).toBeCloseTo(30 / 90, 5);

    const avg = summary.hittingLeaders.battingAverage;
    expect(avg[0].total).toBeCloseTo(0.345, 3);

    expect(summary.pitchingLeaders.earnedRunAverage).toHaveLength(2);
    expect(summary.pitchingLeaders.strikeouts[0].name).toBe("Aaron Judge");

    // --- Misc shape. ---
    expect(typeof summary.season).toBe("string");
    expect(typeof summary.generatedAt).toBe("string");
  });

  it("handles empty and malformed upstream feeds gracefully", async () => {
    jest
      .spyOn(global, "fetch")
      .mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("/teams?")) {
          // No teams at all.
          return jsonResponse({ teams: [] });
        }
        if (url.includes("/standings?")) {
          // Missing records key entirely.
          return jsonResponse({});
        }
        if (url.includes("/stats/leaders?")) {
          // Empty leaderboard group.
          return jsonResponse({ leagueLeaders: [] });
        }
        if (url.includes("/schedule?")) {
          // Null dates.
          return jsonResponse({ dates: null });
        }
        throw new Error(`Unexpected fetch URL in test: ${url}`);
      });

    const summary = await getMlbSummary();

    expect(summary.teams).toEqual([]);
    expect(summary.standings).toEqual([]);
    expect(summary.recentGames).toEqual([]);
    expect(summary.upcomingGames).toEqual([]);
    expect(summary.hittingLeaders.homeRuns).toEqual([]);
    expect(summary.hittingLeaders.runsBattedIn).toEqual([]);
    expect(summary.hittingLeaders.battingAverage).toEqual([]);
    expect(summary.pitchingLeaders.earnedRunAverage).toEqual([]);
    expect(summary.pitchingLeaders.wins).toEqual([]);
    expect(summary.pitchingLeaders.strikeouts).toEqual([]);
    expect(typeof summary.season).toBe("string");
  });
});

// ---- Team snapshot fixtures ----------------------------------------------

function teamDetailPayload() {
  return {
    teams: [
      {
        id: 147,
        name: "New York Yankees",
        teamName: "Yankees",
        shortName: "NY Yankees",
        locationName: "New York",
        abbreviation: "NYY",
        league: { id: AL_LEAGUE_ID, name: "American League" },
        division: { id: 201, name: "American League East" },
        venue: { name: "Yankee Stadium" },
        firstYearOfPlay: "1903",
      },
    ],
  };
}

function teamRecentSchedulePayload() {
  return {
    dates: [
      {
        date: "2026-06-10",
        games: [
          // past-1: Yankees (147) at home, win.
          {
            gamePk: 910001,
            gameDate: "2026-06-10T23:05:00Z",
            gameType: "R",
            status: { abstractGameState: "Final", detailedState: "Final" },
            teams: {
              home: {
                team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
                score: 6,
                isWinner: true,
              },
              away: {
                team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
                score: 3,
                isWinner: false,
              },
            },
          },
        ],
      },
      {
        date: "2026-06-12",
        games: [
          // past-2: Yankees (147) on the road, loss (home team wins).
          {
            gamePk: 910002,
            gameDate: "2026-06-12T23:05:00Z",
            gameType: "R",
            status: { abstractGameState: "Final", detailedState: "Final" },
            teams: {
              home: {
                team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
                score: 5,
                isWinner: true,
              },
              away: {
                team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
                score: 2,
                isWinner: false,
              },
            },
          },
          // A non-final game inside the recent window must be excluded from recentGames.
          {
            gamePk: 910003,
            gameDate: "2026-06-12T20:00:00Z",
            gameType: "R",
            status: { abstractGameState: "Live", detailedState: "In Progress" },
            teams: {
              home: {
                team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
                score: 1,
              },
              away: {
                team: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" },
                score: 1,
              },
            },
          },
        ],
      },
    ],
  };
}

function teamUpcomingSchedulePayload() {
  return {
    dates: [
      {
        date: "2026-06-25",
        games: [
          // future-1: scheduled, soonest.
          {
            gamePk: 920001,
            gameDate: "2026-06-25T23:05:00Z",
            gameType: "R",
            status: { abstractGameState: "Preview", detailedState: "Scheduled" },
            teams: {
              home: { team: { id: 147, name: "New York Yankees", abbreviation: "NYY" } },
              away: { team: { id: 119, name: "Los Angeles Dodgers", abbreviation: "LAD" } },
            },
          },
          // A FINISHED game inside the upcoming window must be excluded from upcomingGames.
          {
            gamePk: 920003,
            gameDate: "2026-06-25T18:00:00Z",
            gameType: "R",
            status: { abstractGameState: "Final", detailedState: "Final" },
            teams: {
              home: {
                team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
                score: 4,
                isWinner: true,
              },
              away: {
                team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
                score: 2,
                isWinner: false,
              },
            },
          },
        ],
      },
      {
        date: "2026-06-27",
        games: [
          // future-2: scheduled, later.
          {
            gamePk: 920002,
            gameDate: "2026-06-27T23:05:00Z",
            gameType: "R",
            status: { abstractGameState: "Preview", detailedState: "Scheduled" },
            teams: {
              home: { team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" } },
              away: { team: { id: 147, name: "New York Yankees", abbreviation: "NYY" } },
            },
          },
        ],
      },
    ],
  };
}

// Routes the four endpoints getMlbTeamSnapshot can hit: the teams list (used to
// build the lookup when none is passed), the single-team detail (/teams/:id?),
// and the recent/upcoming schedule windows (split by their start/end dates).
function makeTeamRouter(payloads: {
  teams?: unknown;
  detail: unknown;
  recent: unknown;
  upcoming: unknown;
}) {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    if (/\/teams\/\d+\?/.test(url)) {
      return jsonResponse(payloads.detail);
    }
    if (url.includes("/teams?")) {
      return jsonResponse(payloads.teams ?? teamsPayload());
    }
    if (url.includes("/schedule?")) {
      const startMatch = url.match(/startDate=([^&]+)/);
      const endMatch = url.match(/endDate=([^&]+)/);
      const start = startMatch ? startMatch[1] : "";
      const end = endMatch ? endMatch[1] : "";
      const today = new Date().toISOString().slice(0, 10);
      if (end && end < today) return jsonResponse(payloads.recent);
      if (start && start >= today) return jsonResponse(payloads.upcoming);
      return jsonResponse(payloads.recent);
    }
    throw new Error(`Unexpected fetch URL in test: ${url}`);
  };
}

describe("isValidMlbTeamId", () => {
  it("accepts positive integer ids and rejects everything else", () => {
    expect(isValidMlbTeamId("147")).toBe(true);
    expect(isValidMlbTeamId("1")).toBe(true);
    expect(isValidMlbTeamId("119")).toBe(true);
    expect(isValidMlbTeamId("0")).toBe(false); // leading zero / zero not allowed
    expect(isValidMlbTeamId("012")).toBe(false); // leading zero
    expect(isValidMlbTeamId("")).toBe(false);
    expect(isValidMlbTeamId("-1")).toBe(false);
    expect(isValidMlbTeamId("12a")).toBe(false);
    expect(isValidMlbTeamId("1.5")).toBe(false);
    expect(isValidMlbTeamId("abc")).toBe(false);
    expect(isValidMlbTeamId(" 147")).toBe(false);
  });
});

describe("createEmptyMlbSnapshot", () => {
  it("returns a fully-shaped empty snapshot", () => {
    const snap = createEmptyMlbSnapshot();

    expect(typeof snap.season).toBe("string");
    expect(snap.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(snap.sourceLabel).toBe("MLB Stats API");
    expect(snap.sourceUrls.standings).toContain("statsapi.mlb.com/api/v1/standings");
    expect(snap.sourceUrls.schedule).toContain("statsapi.mlb.com/api/v1/schedule");
    expect(snap.sourceUrls.leaders).toContain("statsapi.mlb.com/api/v1/stats/leaders");

    expect(snap.teams).toEqual([]);
    expect(snap.standings).toEqual([]);
    expect(snap.recentGames).toEqual([]);
    expect(snap.upcomingGames).toEqual([]);
    expect(snap.hittingLeaders).toEqual({
      homeRuns: [],
      runsBattedIn: [],
      battingAverage: [],
    });
    expect(snap.pitchingLeaders).toEqual({
      earnedRunAverage: [],
      wins: [],
      strikeouts: [],
    });
    expect(snap.teamSnapshots).toEqual({});
  });
});

describe("getMlbTeamSnapshot", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects an invalid team id before hitting the network", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    await expect(getMlbTeamSnapshot("bad-id")).rejects.toMatchObject({
      status: 400,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("normalizes the profile, splits recent/upcoming games, and derives form", async () => {
    jest
      .spyOn(global, "fetch")
      .mockImplementation(
        makeTeamRouter({
          detail: teamDetailPayload(),
          recent: teamRecentSchedulePayload(),
          upcoming: teamUpcomingSchedulePayload(),
        }) as unknown as typeof fetch
      );

    const snapshot = await getMlbTeamSnapshot("147");

    // --- Profile: normalized from the /teams/:id detail feed. ---
    expect(snapshot.team).not.toBeNull();
    expect(snapshot.team).toMatchObject({
      id: "147",
      name: "New York Yankees",
      shortName: "Yankees",
      abbreviation: "NYY",
      league: "AL",
      division: "AL East",
      venue: "Yankee Stadium",
      founded: 1903,
      primaryColor: null,
    });
    expect(snapshot.team?.logo).toContain("147.svg");

    // --- Recent games: only FINISHED, newest-first; live game dropped. ---
    expect(snapshot.recentGames.map((g) => g.id)).toEqual(["910002", "910001"]);
    expect(snapshot.recentGames.every((g) => g.status === "FINISHED")).toBe(true);
    // Enrichment: known team lookup supplies the shortName on the home side.
    const past1 = snapshot.recentGames.find((g) => g.id === "910001");
    expect(past1?.homeTeam.shortName).toBe("Yankees");
    expect(past1?.score.winner).toBe("HOME_TEAM");

    // --- Upcoming games: only non-FINISHED, soonest-first; final game dropped. ---
    expect(snapshot.upcomingGames.map((g) => g.id)).toEqual(["920001", "920002"]);
    expect(snapshot.upcomingGames.every((g) => g.status !== "FINISHED")).toBe(true);

    // --- Form: derived from the (ordered) recent games. ---
    // Iteration order is [910002 (away loss), 910001 (home win)].
    expect(snapshot.form.wins).toBe(1);
    expect(snapshot.form.losses).toBe(1);
    expect(snapshot.form.sequence).toEqual(["L", "W"]);
    expect(snapshot.form.runsFor).toBe(8); // 2 (away) + 6 (home)
    expect(snapshot.form.runsAgainst).toBe(8); // 5 (away) + 3 (home)

    expect(typeof snapshot.generatedAt).toBe("string");
    expect(() => new Date(snapshot.generatedAt).toISOString()).not.toThrow();
  });

  it("returns a null profile when the detail feed has no team, keeping games/form empty", async () => {
    jest
      .spyOn(global, "fetch")
      .mockImplementation(
        makeTeamRouter({
          detail: { teams: [] },
          recent: { dates: [] },
          upcoming: { dates: [] },
        }) as unknown as typeof fetch
      );

    const snapshot = await getMlbTeamSnapshot("147");

    expect(snapshot.team).toBeNull();
    expect(snapshot.recentGames).toEqual([]);
    expect(snapshot.upcomingGames).toEqual([]);
    expect(snapshot.form).toEqual({
      sequence: [],
      wins: 0,
      losses: 0,
      runsFor: 0,
      runsAgainst: 0,
    });
  });

  it("surfaces a 404 from the upstream team detail feed", async () => {
    jest
      .spyOn(global, "fetch")
      .mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (/\/teams\/\d+\?/.test(url)) {
          return jsonResponse({}, 404);
        }
        if (url.includes("/teams?")) {
          return jsonResponse(teamsPayload());
        }
        if (url.includes("/schedule?")) {
          return jsonResponse({ dates: [] });
        }
        throw new Error(`Unexpected fetch URL in test: ${url}`);
      });

    await expect(getMlbTeamSnapshot("147")).rejects.toMatchObject({
      status: 404,
    });
  });
});

// ---- Live summary builder --------------------------------------------------

function isoDate(daysFromToday: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

function isoDateTime(daysFromToday: number, time = "T20:00:00Z"): string {
  return `${isoDate(daysFromToday)}${time}`;
}

const LIVE_TEAMS: MlbTeamOption[] = [
  {
    id: "147",
    name: "New York Yankees",
    shortName: "Yankees",
    abbreviation: "NYY",
    league: "AL",
    division: "AL East",
    venue: "Yankee Stadium",
    logo: "https://www.mlbstatic.com/team-logos/147.svg",
  },
  {
    id: "111",
    name: "Boston Red Sox",
    shortName: "Red Sox",
    abbreviation: "BOS",
    league: "AL",
    division: "AL East",
    venue: "Fenway Park",
    logo: "https://www.mlbstatic.com/team-logos/111.svg",
  },
];

function committedGame(
  id: string,
  utcDate: string,
  status: string,
  score: MlbGame["score"] = { winner: null, home: null, away: null }
): MlbGame {
  return {
    id,
    utcDate,
    status,
    matchday: null,
    stage: "R",
    homeTeam: {
      id: "147",
      name: "New York Yankees",
      shortName: "Yankees",
      abbreviation: "NYY",
      crest: "https://www.mlbstatic.com/team-logos/147.svg",
    },
    awayTeam: {
      id: "111",
      name: "Boston Red Sox",
      shortName: "Red Sox",
      abbreviation: "BOS",
      crest: "https://www.mlbstatic.com/team-logos/111.svg",
    },
    score,
  };
}

function liveFallbackSummary(): MlbSummarySnapshot {
  return {
    season: "2026",
    updatedAt: isoDate(-1),
    sourceLabel: "MLB Stats API",
    sourceUrls: { standings: "standings", schedule: "schedule", leaders: "leaders" },
    teams: LIVE_TEAMS,
    standings: [],
    recentGames: [
      committedGame("900001", isoDateTime(-3), "FINISHED", {
        winner: "HOME_TEAM",
        home: 4,
        away: 1,
      }),
    ],
    upcomingGames: [
      committedGame("900101", isoDateTime(0), "Scheduled"),
      committedGame("900103", isoDateTime(0, "T17:00:00Z"), "Scheduled"),
      committedGame("900102", isoDateTime(1), "Scheduled"),
    ],
    hittingLeaders: { homeRuns: [], runsBattedIn: [], battingAverage: [] },
    pitchingLeaders: { earnedRunAverage: [], wins: [], strikeouts: [] },
  };
}

function rawScheduleGame(
  gamePk: number,
  gameDate: string,
  abstractGameState: string,
  detailedState: string,
  homeScore: number | null = null,
  awayScore: number | null = null
) {
  return {
    gamePk,
    gameDate,
    gameType: "R",
    status: { abstractGameState, detailedState },
    teams: {
      home: {
        team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
        score: homeScore,
        isWinner: null,
      },
      away: {
        team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
        score: awayScore,
        isWinner: null,
      },
    },
  };
}

function makeLiveScheduleRouter(
  yesterdayResponse: () => Response,
  todayResponse: () => Response
) {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    if (!url.includes("/schedule?")) {
      throw new Error(`Unexpected fetch URL in test: ${url}`);
    }
    const startMatch = url.match(/startDate=([^&]+)/);
    const start = startMatch ? startMatch[1] : "";
    if (start < isoDate(0)) return yesterdayResponse();
    return todayResponse();
  };
}

describe("buildMlbLiveSummaryData", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("merges yesterday's finals and today's scoreboard into the committed summary", async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      makeLiveScheduleRouter(
        () =>
          jsonResponse({
            dates: [
              {
                date: isoDate(-1),
                games: [
                  rawScheduleGame(900050, isoDateTime(-1), "Final", "Final", 3, 2),
                ],
              },
            ],
          }),
        () =>
          jsonResponse({
            dates: [
              {
                date: isoDate(0),
                games: [
                  rawScheduleGame(
                    900101,
                    isoDateTime(0),
                    "Live",
                    "In Progress",
                    2,
                    1
                  ),
                  rawScheduleGame(
                    900103,
                    isoDateTime(0, "T17:00:00Z"),
                    "Final",
                    "Final",
                    6,
                    5
                  ),
                ],
              },
            ],
          })
      ) as unknown as typeof fetch
    );

    const fallback = liveFallbackSummary();
    const summary = await buildMlbLiveSummaryData(fallback);

    // Today's in-progress game replaces its committed entry with live score
    // and state; the now-finished game leaves the upcoming list.
    expect(summary.upcomingGames.map((g) => g.id)).toEqual(["900101", "900102"]);
    const liveGame = summary.upcomingGames[0];
    expect(liveGame.status).toBe("In Progress");
    expect(liveGame.score).toEqual({ winner: null, home: 2, away: 1 });
    // Known-team enrichment still applies to live games.
    expect(liveGame.homeTeam.shortName).toBe("Yankees");

    // Finals from both windows merge ahead of the committed recents, newest first.
    expect(summary.recentGames.map((g) => g.id)).toEqual([
      "900103",
      "900050",
      "900001",
    ]);
    expect(summary.recentGames[0].score).toEqual({
      winner: "HOME_TEAM",
      home: 6,
      away: 5,
    });

    // Non-time-sensitive sections stay committed; the stamp refreshes.
    expect(summary.standings).toBe(fallback.standings);
    expect(summary.hittingLeaders).toBe(fallback.hittingLeaders);
    expect(summary.teams).toBe(fallback.teams);
    expect(summary.updatedAt).toBe(isoDate(0));
  });

  it("keeps the committed games for a window whose fetch fails", async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      makeLiveScheduleRouter(
        () => jsonResponse({}, 404),
        () =>
          jsonResponse({
            dates: [
              {
                date: isoDate(0),
                games: [
                  rawScheduleGame(
                    900103,
                    isoDateTime(0, "T17:00:00Z"),
                    "Final",
                    "Final",
                    6,
                    5
                  ),
                ],
              },
            ],
          })
      ) as unknown as typeof fetch
    );

    const fallback = liveFallbackSummary();
    const summary = await buildMlbLiveSummaryData(fallback);

    // Yesterday's window failed, so only today's final joins the committed recents.
    expect(summary.recentGames.map((g) => g.id)).toEqual(["900103", "900001"]);
    expect(summary.upcomingGames.map((g) => g.id)).toEqual(["900101", "900102"]);
  });

  it("throws when every live schedule window fails so callers can fall back wholesale", async () => {
    jest
      .spyOn(global, "fetch")
      .mockImplementation(
        makeLiveScheduleRouter(
          () => jsonResponse({}, 404),
          () => jsonResponse({}, 404)
        ) as unknown as typeof fetch
      );

    await expect(buildMlbLiveSummaryData(liveFallbackSummary())).rejects.toMatchObject({
      status: 503,
    });
  });
});
