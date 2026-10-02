/**
 * @jest-environment node
 */
import {
  buildNbaSnapshot,
  getNbaSummary,
  getNbaTeamSnapshot,
  isValidNbaTeamId,
  buildSeasonLabel,
  resolveNbaSeasonEndYear,
  preservePriorFixtures,
} from "../nbaData";
import type { NbaFixture, NbaLeader, NbaSnapshot, NbaTeam, NbaTeamSnapshot } from "../../types/nba";

function createEmptyNbaSnapshot(): NbaSnapshot {
  return {
    season: "Current season",
    generatedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01",
    sourceLabel: "ESPN",
    sourceUrls: { standings: "", leaders: "", scoreboard: "" },
    teamsByConference: { east: [], west: [] },
    scorers: [],
    rebounders: [],
    assistLeaders: [],
    recentFixtures: [],
    upcomingFixtures: [],
    teams: [],
    teamSnapshots: {},
  };
}
import {
  NBA_BYATHLETE_2026_POSTSEASON,
  NBA_BYATHLETE_2026_REGULAR_SEASON,
  NBA_BYATHLETE_2027,
  NBA_SCOREBOARD_DAYS,
  NBA_SCOREBOARD_RANGE_REJECTED,
  NBA_STANDINGS_2026,
  NBA_STANDINGS_2027,
  NBA_TEAM_DETAIL_OKC,
  NBA_TEAM_SCHEDULE_CHI_2026,
  NBA_TEAM_SCHEDULE_EMPTY,
  NBA_TEAM_SCHEDULE_OKC,
  NBA_TEAMS,
} from "./fixtures/nbaEspn.fixture";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// --- Standings fixture builders -------------------------------------------

interface StandingTeamOptions {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName?: string;
  location?: string;
  wins: number;
  losses: number;
  winPercent: number;
  logo?: string;
  venue?: string;
}

function makeStandingEntry(opts: StandingTeamOptions) {
  return {
    team: {
      id: opts.id,
      abbreviation: opts.abbreviation,
      displayName: opts.displayName,
      shortDisplayName: opts.shortDisplayName ?? opts.displayName,
      location: opts.location ?? opts.displayName,
      logo: opts.logo ?? `https://logos.example/${opts.abbreviation}.png`,
      venue: { fullName: opts.venue ?? `${opts.displayName} Arena` },
    },
    stats: [
      { name: "wins", value: opts.wins, displayValue: String(opts.wins) },
      { name: "losses", value: opts.losses, displayValue: String(opts.losses) },
      {
        name: "winPercent",
        value: opts.winPercent,
        displayValue: opts.winPercent.toFixed(3),
      },
      { name: "gamesBehind", value: 0, displayValue: "0" },
      { name: "avgPointsFor", value: 115.2, displayValue: "115.2" },
      { name: "avgPointsAgainst", value: 110.1, displayValue: "110.1" },
      { name: "avgPointDifferential", value: 5.1, displayValue: "5.1" },
      { name: "playoffSeed", value: 1, displayValue: "1" },
      { name: "streak", value: 2, displayValue: "W2" },
      { name: "home", displayValue: "20-5" },
      { name: "road", displayValue: "15-10" },
      { name: "lastTenGames", displayValue: "7-3" },
    ],
  };
}

function makeStandingsResponse() {
  return {
    season: { year: 2025, displayName: "2025-26" },
    children: [
      {
        name: "Eastern Conference",
        abbreviation: "East",
        standings: {
          entries: [
            // Intentionally out of order to prove the sort runs.
            makeStandingEntry({
              id: "2",
              abbreviation: "BOS",
              displayName: "Boston Celtics",
              wins: 40,
              losses: 12,
              winPercent: 0.769,
            }),
            makeStandingEntry({
              id: "1",
              abbreviation: "CLE",
              displayName: "Cleveland Cavaliers",
              wins: 45,
              losses: 8,
              winPercent: 0.849,
            }),
          ],
        },
      },
      {
        name: "Western Conference",
        abbreviation: "West",
        standings: {
          entries: [
            makeStandingEntry({
              id: "3",
              abbreviation: "OKC",
              displayName: "Oklahoma City Thunder",
              wins: 44,
              losses: 9,
              winPercent: 0.83,
            }),
            makeStandingEntry({
              id: "4",
              abbreviation: "DEN",
              displayName: "Denver Nuggets",
              wins: 38,
              losses: 15,
              winPercent: 0.717,
            }),
          ],
        },
      },
    ],
  };
}

// --- Scoreboard fixture builders ------------------------------------------

interface EventOptions {
  id: string;
  date: string;
  completed: boolean;
  homeAbbr: string;
  homeName: string;
  awayAbbr: string;
  awayName: string;
  homeScore?: string;
  awayScore?: string;
  homeWinner?: boolean;
  awayWinner?: boolean;
}

function makeEvent(opts: EventOptions) {
  const statusName = opts.completed ? "STATUS_FINAL" : "STATUS_SCHEDULED";
  return {
    id: opts.id,
    date: opts.date,
    status: { type: { name: statusName, completed: opts.completed } },
    season: { type: 2 },
    competitions: [
      {
        status: { type: { name: statusName, completed: opts.completed } },
        competitors: [
          {
            homeAway: "home",
            score: opts.homeScore ?? null,
            winner: opts.homeWinner ?? false,
            team: {
              id: `${opts.id}-h`,
              abbreviation: opts.homeAbbr,
              displayName: opts.homeName,
              shortDisplayName: opts.homeName,
              logo: `https://logos.example/${opts.homeAbbr}.png`,
            },
          },
          {
            homeAway: "away",
            score: opts.awayScore ?? null,
            winner: opts.awayWinner ?? false,
            team: {
              id: `${opts.id}-a`,
              abbreviation: opts.awayAbbr,
              displayName: opts.awayName,
              shortDisplayName: opts.awayName,
              logo: `https://logos.example/${opts.awayAbbr}.png`,
            },
          },
        ],
      },
    ],
  };
}

function makeScoreboardResponse() {
  return {
    season: { year: 2025, type: 2 },
    events: [
      // A finished game (older)
      makeEvent({
        id: "401-finished-1",
        date: "2026-06-20T00:00:00Z",
        completed: true,
        homeAbbr: "BOS",
        homeName: "Boston Celtics",
        awayAbbr: "CLE",
        awayName: "Cleveland Cavaliers",
        homeScore: "110",
        awayScore: "104",
        homeWinner: true,
      }),
      // A finished game (newer) — should sort first in recentFixtures
      makeEvent({
        id: "401-finished-2",
        date: "2026-06-22T00:00:00Z",
        completed: true,
        homeAbbr: "OKC",
        homeName: "Oklahoma City Thunder",
        awayAbbr: "DEN",
        awayName: "Denver Nuggets",
        homeScore: "98",
        awayScore: "120",
        awayWinner: true,
      }),
      // Upcoming games — should be sorted ascending
      makeEvent({
        id: "401-upcoming-late",
        date: "2026-06-28T00:00:00Z",
        completed: false,
        homeAbbr: "DEN",
        homeName: "Denver Nuggets",
        awayAbbr: "BOS",
        awayName: "Boston Celtics",
      }),
      makeEvent({
        id: "401-upcoming-early",
        date: "2026-06-25T00:00:00Z",
        completed: false,
        homeAbbr: "CLE",
        homeName: "Cleveland Cavaliers",
        awayAbbr: "OKC",
        awayName: "Oklahoma City Thunder",
      }),
    ],
  };
}

// --- ByAthlete (leaders) fixture builders ---------------------------------

// The glossary defines the column order per category. The code reads:
//   offensive: avgPoints, points, avgAssists, assists
//   general:   avgRebounds, rebounds, gamesPlayed
function makeByAthleteResponse() {
  return {
    categories: [
      {
        name: "general",
        names: ["gamesPlayed", "avgRebounds", "rebounds"],
      },
      {
        name: "offensive",
        names: ["avgPoints", "points", "avgAssists", "assists"],
      },
    ],
    athletes: [
      {
        athlete: {
          id: "a1",
          displayName: "Star Scorer",
          teamId: "1",
          teamShortName: "cle",
        },
        categories: [
          { name: "general", values: [50, 5.0, 250] },
          { name: "offensive", values: [30.5, 1525, 6.0, 300] },
        ],
      },
      {
        athlete: {
          id: "a2",
          displayName: "Glass Cleaner",
          teamId: "2",
          teamShortName: "bos",
        },
        categories: [
          { name: "general", values: [52, 13.4, 696] },
          { name: "offensive", values: [18.2, 946, 4.0, 208] },
        ],
      },
      {
        athlete: {
          id: "a3",
          displayName: "Floor General",
          teamId: "3",
          teamShortName: "okc",
        },
        categories: [
          { name: "general", values: [48, 4.5, 216] },
          { name: "offensive", values: [22.0, 1056, 11.5, 552] },
        ],
      },
    ],
  };
}

// --- Teams list fixture builders ------------------------------------------

function makeTeamsResponse() {
  const team = (
    id: string,
    abbreviation: string,
    displayName: string
  ) => ({
    team: {
      id,
      abbreviation,
      displayName,
      shortDisplayName: displayName,
      logo: `https://logos.example/${abbreviation}.png`,
      venue: { fullName: `${displayName} Arena` },
    },
  });
  return {
    sports: [
      {
        leagues: [
          {
            teams: [
              team("3", "OKC", "Oklahoma City Thunder"),
              team("1", "CLE", "Cleveland Cavaliers"),
              team("4", "DEN", "Denver Nuggets"),
              team("2", "BOS", "Boston Celtics"),
            ],
          },
        ],
      },
    ],
  };
}

// --- fetch router ----------------------------------------------------------

function routeFetch(payloads: {
  standings: unknown;
  scoreboard: unknown;
  byathlete: unknown;
  teams: unknown;
}) {
  return (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("byathlete")) {
      return Promise.resolve(jsonResponse(payloads.byathlete));
    }
    if (url.includes("/standings")) {
      return Promise.resolve(jsonResponse(payloads.standings));
    }
    if (url.includes("/scoreboard")) {
      return Promise.resolve(jsonResponse(payloads.scoreboard));
    }
    if (url.includes("/teams")) {
      return Promise.resolve(jsonResponse(payloads.teams));
    }
    return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
  };
}

describe("getNbaSummary", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("normalizes standings, leaders, fixtures and teams from the four ESPN feeds", async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      routeFetch({
        standings: makeStandingsResponse(),
        scoreboard: makeScoreboardResponse(),
        byathlete: makeByAthleteResponse(),
        teams: makeTeamsResponse(),
      }) as unknown as typeof fetch
    );

    const summary = await getNbaSummary();

    // Season label is now derived from the pinned calendar season rather than
    // ESPN's (sometimes-rolled) displayName, so it stays a real "YYYY-YY" label.
    expect(summary.season).toMatch(/^\d{4}-\d{2}$/);
    expect(summary.season).toBe(buildSeasonLabel(resolveNbaSeasonEndYear(new Date())));

    // generatedAt is an ISO string — assert shape, not the exact value.
    expect(typeof summary.generatedAt).toBe("string");
    expect(() => new Date(summary.generatedAt).toISOString()).not.toThrow();

    // --- Standings: both conferences populated and sorted by winPercent desc.
    expect(summary.teamsByConference.east).toHaveLength(2);
    expect(summary.teamsByConference.west).toHaveLength(2);

    const east = summary.teamsByConference.east;
    expect(east[0].abbreviation).toBe("CLE"); // .849 sorts above .769
    expect(east[1].abbreviation).toBe("BOS");
    // Position + conferenceSeed are re-derived from the sorted order.
    expect(east[0].position).toBe(1);
    expect(east[0].conferenceSeed).toBe(1);
    expect(east[1].position).toBe(2);
    // winPercent descending across the list.
    expect(east[0].winPercent).toBeGreaterThanOrEqual(east[1].winPercent);

    const west = summary.teamsByConference.west;
    expect(west[0].abbreviation).toBe("OKC"); // .830 sorts above .717
    expect(west[1].abbreviation).toBe("DEN");

    // Normalized numeric fields carry through.
    expect(east[0].wins).toBe(45);
    expect(east[0].losses).toBe(8);
    expect(east[0].gamesPlayed).toBe(53);
    expect(east[0].conference).toBe("east");
    expect(west[0].conference).toBe("west");

    // --- Leaders: scorers/rebounders/assistLeaders normalized + ranked.
    expect(summary.scorers[0].name).toBe("Star Scorer"); // 30.5 ppg
    expect(summary.scorers[0].rank).toBe(1);
    expect(summary.scorers[0].perGame).toBeCloseTo(30.5);
    expect(summary.scorers[0].total).toBe(1525);
    expect(summary.scorers[0].appearances).toBe(50);
    expect(summary.scorers[0].teamAbbreviation).toBe("CLE");
    expect(summary.scorers[0].teamId).toBe("cle");
    // Ranks are sequential.
    expect(summary.scorers.map((s) => s.rank)).toEqual([1, 2, 3]);

    // Rebounders sorted by avgRebounds desc => Glass Cleaner (13.4) first.
    expect(summary.rebounders[0].name).toBe("Glass Cleaner");
    expect(summary.rebounders[0].perGame).toBeCloseTo(13.4);

    // Assist leaders sorted by avgAssists desc => Floor General (11.5) first.
    expect(summary.assistLeaders[0].name).toBe("Floor General");
    expect(summary.assistLeaders[0].perGame).toBeCloseTo(11.5);

    // --- Fixtures: finished vs upcoming split + sorted correctly.
    expect(summary.recentFixtures).toHaveLength(2);
    // Recent sorted by date descending (newest first).
    expect(summary.recentFixtures[0].id).toBe("401-finished-2");
    expect(summary.recentFixtures[1].id).toBe("401-finished-1");
    expect(summary.recentFixtures[0].status).toBe("FINISHED");

    // Winner derivation: away team won 120-98.
    const newest = summary.recentFixtures[0];
    expect(newest.score.home).toBe(98);
    expect(newest.score.away).toBe(120);
    expect(newest.score.winner).toBe("AWAY_TEAM");

    // Home winner derivation on the older game.
    const older = summary.recentFixtures[1];
    expect(older.score.winner).toBe("HOME_TEAM");

    expect(summary.upcomingFixtures).toHaveLength(2);
    // Upcoming sorted by date ascending (soonest first).
    expect(summary.upcomingFixtures[0].id).toBe("401-upcoming-early");
    expect(summary.upcomingFixtures[1].id).toBe("401-upcoming-late");
    expect(summary.upcomingFixtures[0].status).not.toBe("FINISHED");

    // --- Teams list: normalized + alphabetized by shortName.
    expect(summary.teams).toHaveLength(4);
    const teamNames = summary.teams.map((t) => t.shortName);
    expect(teamNames).toEqual([...teamNames].sort((a, b) => a.localeCompare(b)));
    // Conference is matched in from the standings.
    const cle = summary.teams.find((t) => t.abbreviation === "CLE");
    expect(cle?.conference).toBe("east");
    const okc = summary.teams.find((t) => t.abbreviation === "OKC");
    expect(okc?.conference).toBe("west");
  });

  it("handles empty / malformed feeds by returning empty arrays", async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      routeFetch({
        standings: { season: null, children: [] },
        scoreboard: { events: [] },
        byathlete: { categories: [], athletes: [] },
        teams: { sports: [] },
      }) as unknown as typeof fetch
    );

    const summary = await getNbaSummary();

    expect(summary.teamsByConference.east).toEqual([]);
    expect(summary.teamsByConference.west).toEqual([]);
    expect(summary.scorers).toEqual([]);
    expect(summary.rebounders).toEqual([]);
    expect(summary.assistLeaders).toEqual([]);
    expect(summary.recentFixtures).toEqual([]);
    expect(summary.upcomingFixtures).toEqual([]);
    expect(summary.teams).toEqual([]);
    // Even when ESPN returns an empty feed, the season label comes from the
    // pinned calendar season, so it stays a real "YYYY-YY" label.
    expect(summary.season).toBe(buildSeasonLabel(resolveNbaSeasonEndYear(new Date())));
    expect(typeof summary.generatedAt).toBe("string");
  });

  it("drops fixtures missing required fields and athletes with no per-game stat", async () => {
    // A scoreboard event missing the away competitor (incomplete) plus one valid event.
    const scoreboard = {
      season: { year: 2025, type: 2 },
      events: [
        {
          id: "bad-1",
          date: "2026-06-21T00:00:00Z",
          status: { type: { name: "STATUS_FINAL", completed: true } },
          competitions: [
            {
              competitors: [
                {
                  homeAway: "home",
                  score: "100",
                  team: { id: "x", abbreviation: "XXX", displayName: "X" },
                },
                // away competitor absent => normalizeFixture returns null
              ],
            },
          ],
        },
        makeEvent({
          id: "good-1",
          date: "2026-06-22T00:00:00Z",
          completed: true,
          homeAbbr: "BOS",
          homeName: "Boston Celtics",
          awayAbbr: "CLE",
          awayName: "Cleveland Cavaliers",
          homeScore: "110",
          awayScore: "100",
          homeWinner: true,
        }),
      ],
    };

    // An athlete with a zero per-game scoring value is excluded from scorers.
    const byathlete = {
      categories: [
        { name: "general", names: ["gamesPlayed", "avgRebounds", "rebounds"] },
        { name: "offensive", names: ["avgPoints", "points", "avgAssists", "assists"] },
      ],
      athletes: [
        {
          athlete: { id: "z1", displayName: "Bench Warmer", teamShortName: "bos" },
          categories: [
            { name: "general", values: [2, 0, 0] },
            { name: "offensive", values: [0, 0, 0, 0] }, // avgPoints = 0 => dropped
          ],
        },
        {
          // Missing teamShortName => skipped entirely.
          athlete: { id: "z2", displayName: "No Team" },
          categories: [
            { name: "offensive", values: [25, 1000, 5, 200] },
          ],
        },
        {
          athlete: { id: "z3", displayName: "Real Scorer", teamShortName: "cle" },
          categories: [
            { name: "general", values: [50, 6, 300] },
            { name: "offensive", values: [27.3, 1365, 5, 250] },
          ],
        },
      ],
    };

    jest.spyOn(global, "fetch").mockImplementation(
      routeFetch({
        standings: makeStandingsResponse(),
        scoreboard,
        byathlete,
        teams: makeTeamsResponse(),
      }) as unknown as typeof fetch
    );

    const summary = await getNbaSummary();

    // Only the well-formed fixture survives.
    expect(summary.recentFixtures).toHaveLength(1);
    expect(summary.recentFixtures[0].id).toBe("good-1");

    // Only the athlete with a positive per-game scoring average and a team.
    expect(summary.scorers).toHaveLength(1);
    expect(summary.scorers[0].name).toBe("Real Scorer");
    expect(summary.scorers[0].rank).toBe(1);
  });
});

describe("season labelling", () => {
  it("labels the season from ESPN's pinned ending year, not the rolled displayName", () => {
    // ESPN keys the 2025-26 season by its ENDING year (season=2026). During the
    // 2025-26 Finals it rolled the standings feed's `displayName` to "2026-27"
    // while still serving 2025-26 final records, so the committed snapshot read
    // "2026-27". The label must be built from the pinned ending year instead, so
    // 2026 reads "2025-26", not "2026-27".
    expect(buildSeasonLabel(2026)).toBe("2025-26");
    expect(buildSeasonLabel(2027)).toBe("2026-27");
    expect(buildSeasonLabel(2025)).toBe("2024-25");
  });

  it("resolves the NBA season ending year from the calendar (October rollover)", () => {
    // January through September belong to the season that ends this calendar
    // year; October through December belong to the season that tips off this
    // year and ends the next.
    expect(resolveNbaSeasonEndYear(new Date("2026-06-15T00:00:00Z"))).toBe(2026); // Finals
    expect(resolveNbaSeasonEndYear(new Date("2026-07-05T00:00:00Z"))).toBe(2026); // off-season gap
    expect(resolveNbaSeasonEndYear(new Date("2026-09-30T00:00:00Z"))).toBe(2026); // pre-tip
    expect(resolveNbaSeasonEndYear(new Date("2026-10-15T00:00:00Z"))).toBe(2027); // new season
    expect(resolveNbaSeasonEndYear(new Date("2027-01-10T00:00:00Z"))).toBe(2027); // mid new season
  });
});

describe("isValidNbaTeamId", () => {
  it("accepts 2-4 character alphanumeric ids and rejects others", () => {
    expect(isValidNbaTeamId("lal")).toBe(true);
    expect(isValidNbaTeamId("BOS")).toBe(true);
    expect(isValidNbaTeamId("13")).toBe(true);
    expect(isValidNbaTeamId("a")).toBe(false); // too short
    expect(isValidNbaTeamId("toolong")).toBe(false); // too long
    expect(isValidNbaTeamId("la-l")).toBe(false); // hyphen
    expect(isValidNbaTeamId("")).toBe(false);
  });
});

describe("getNbaTeamSnapshot", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function routeTeamFetch(payloads: { schedule: unknown; detail: unknown }) {
    return (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/schedule")) {
        return Promise.resolve(jsonResponse(payloads.schedule));
      }
      if (url.includes("/teams/")) {
        return Promise.resolve(jsonResponse(payloads.detail));
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    };
  }

  it("rejects an invalid team id before hitting the network", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    await expect(getNbaTeamSnapshot("bad-id")).rejects.toMatchObject({
      status: 400,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("normalizes the profile, splits fixtures, and derives form from wins", async () => {
    const detail = {
      team: {
        id: "13",
        abbreviation: "LAL",
        displayName: "Los Angeles Lakers",
        shortDisplayName: "Lakers",
        color: "552583",
        logo: "https://logos.example/LAL.png",
        venue: { fullName: "Crypto.com Arena" },
      },
    };
    const schedule = {
      team: detail.team,
      season: { year: 2025 },
      events: [
        makeEvent({
          id: "past-1",
          date: "2026-06-10T00:00:00Z",
          completed: true,
          homeAbbr: "LAL",
          homeName: "Los Angeles Lakers",
          awayAbbr: "BOS",
          awayName: "Boston Celtics",
          homeScore: "110",
          awayScore: "100",
          homeWinner: true,
        }),
        makeEvent({
          id: "past-2",
          date: "2026-06-12T00:00:00Z",
          completed: true,
          homeAbbr: "DEN",
          homeName: "Denver Nuggets",
          awayAbbr: "LAL",
          awayName: "Los Angeles Lakers",
          homeScore: "120",
          awayScore: "98",
          homeWinner: true,
        }),
        makeEvent({
          id: "future-1",
          date: "2026-06-25T00:00:00Z",
          completed: false,
          homeAbbr: "LAL",
          homeName: "Los Angeles Lakers",
          awayAbbr: "OKC",
          awayName: "Oklahoma City Thunder",
        }),
      ],
    };

    jest.spyOn(global, "fetch").mockImplementation(
      routeTeamFetch({ schedule, detail }) as unknown as typeof fetch
    );

    const snapshot = await getNbaTeamSnapshot("lal", "west");

    expect(snapshot.team?.id).toBe("lal");
    expect(snapshot.team?.name).toBe("Los Angeles Lakers");
    expect(snapshot.team?.conference).toBe("west");
    expect(snapshot.team?.primaryColor).toBe("552583");

    // Fixtures: two finished (newest first), one upcoming.
    expect(snapshot.recentFixtures.map((f) => f.id)).toEqual(["past-2", "past-1"]);
    expect(snapshot.upcomingFixtures.map((f) => f.id)).toEqual(["future-1"]);

    // Form: won past-1 (home win) but lost past-2 (away, home won).
    expect(snapshot.form.wins).toBe(1);
    expect(snapshot.form.losses).toBe(1);
    expect(snapshot.form.sequence).toHaveLength(2);
    expect(typeof snapshot.generatedAt).toBe("string");
  });

  it("falls back to the schedule team when the detail feed has no team", async () => {
    const scheduleTeam = {
      id: "2",
      abbreviation: "BOS",
      displayName: "Boston Celtics",
      shortDisplayName: "Celtics",
      logo: "https://logos.example/BOS.png",
    };
    jest.spyOn(global, "fetch").mockImplementation(
      routeTeamFetch({
        schedule: { team: scheduleTeam, events: [] },
        detail: { team: null },
      }) as unknown as typeof fetch
    );

    const snapshot = await getNbaTeamSnapshot("bos");
    expect(snapshot.team?.id).toBe("bos");
    expect(snapshot.recentFixtures).toEqual([]);
    expect(snapshot.form.sequence).toEqual([]);
  });

  it("surfaces a 404 from the upstream schedule feed", async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      ((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("/schedule")) {
          return Promise.resolve(jsonResponse({}, 404));
        }
        return Promise.resolve(jsonResponse({ team: null }));
      }) as unknown as typeof fetch
    );

    await expect(getNbaTeamSnapshot("lal")).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("preservePriorFixtures (off-season fixtures guard)", () => {
  const fixture = (id: string): NbaFixture => ({
    id,
    utcDate: "2026-06-19T00:00:00Z",
    status: "FINISHED",
    matchday: null,
    stage: "Playoffs",
    homeTeam: { id: "1", name: "Home", shortName: "Home", abbreviation: "HOM", crest: null },
    awayTeam: { id: "2", name: "Away", shortName: "Away", abbreviation: "AWY", crest: null },
    score: { winner: "HOME_TEAM", home: 100, away: 98 },
  });

  const teamSnapshot = (
    recentFixtures: NbaFixture[],
    upcomingFixtures: NbaFixture[]
  ): NbaTeamSnapshot => ({
    team: null,
    recentFixtures,
    upcomingFixtures,
    form: { sequence: [], wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 },
    generatedAt: "2026-06-20T00:00:00Z",
  });

  it("carries prior fixtures forward when the fresh build has an empty scoreboard window", () => {
    // Off-season refresh: standings and leaders update but ESPN's scoreboard
    // window is empty. Fixtures must not regress to zero, so the committed
    // snapshot's fixtures are carried forward while the fresh season/standings
    // win — which is what lets the workflow commit the correction on its own.
    const previous = {
      ...createEmptyNbaSnapshot(),
      season: "2025-26",
      recentFixtures: [fixture("g1"), fixture("g2")],
      teamSnapshots: { lal: teamSnapshot([fixture("g1")], []) },
    };
    const next = {
      ...createEmptyNbaSnapshot(),
      season: "2025-26",
      recentFixtures: [],
      upcomingFixtures: [],
      teamSnapshots: { lal: teamSnapshot([], []) },
    };

    const merged = preservePriorFixtures(next, previous);

    expect(merged.recentFixtures.map((f) => f.id)).toEqual(["g1", "g2"]);
    expect(merged.teamSnapshots.lal.recentFixtures).toHaveLength(1);
    // Non-fixture fields still come from the fresh build.
    expect(merged.season).toBe("2025-26");
  });

  it("keeps the fresh fixtures when the new build has its own", () => {
    const previous = {
      ...createEmptyNbaSnapshot(),
      recentFixtures: [fixture("stale")],
    };
    const next = {
      ...createEmptyNbaSnapshot(),
      recentFixtures: [fixture("live1"), fixture("live2")],
      upcomingFixtures: [fixture("live3")],
    };

    const merged = preservePriorFixtures(next, previous);

    expect(merged.recentFixtures.map((f) => f.id)).toEqual(["live1", "live2"]);
    expect(merged.upcomingFixtures.map((f) => f.id)).toEqual(["live3"]);
  });

  it("no-ops when there is no prior snapshot or the prior also has no fixtures", () => {
    const next = createEmptyNbaSnapshot();
    expect(preservePriorFixtures(next, null)).toBe(next);
    expect(preservePriorFixtures(next, createEmptyNbaSnapshot())).toBe(next);
  });
});

// Everything below runs against responses cut from ESPN's own payloads, so a
// field ESPN nests or types differently from what the code expects shows up.
describe("ESPN's real response shapes", () => {
  interface LooseStat {
    name: string;
    value?: number;
    displayValue?: string;
  }
  interface LooseStandings {
    children: Array<{
      standings: { entries: Array<{ team: { abbreviation: string }; stats: LooseStat[] }> };
    }>;
  }
  interface LooseByAthlete {
    categories: Array<{ name: string; names: string[] }>;
    athletes: Array<{
      athlete: { displayName: string };
      categories: Array<{ name: string; values: number[] }>;
    }>;
  }

  const scoreboardDays = NBA_SCOREBOARD_DAYS as Record<string, unknown>;
  const EMPTY_DAY = "20261019";

  // Only the clock is frozen. The timers stay real so a stubbed response can
  // still yield between requests.
  function freezeClock(iso: string) {
    jest.useFakeTimers({
      now: new Date(iso),
      doNotFake: [
        "hrtime",
        "nextTick",
        "performance",
        "queueMicrotask",
        "setImmediate",
        "clearImmediate",
        "setInterval",
        "clearInterval",
        "setTimeout",
        "clearTimeout",
      ],
    });
  }

  function withRecords(records: Record<string, [number, number]>): LooseStandings {
    const standings = JSON.parse(JSON.stringify(NBA_STANDINGS_2027)) as LooseStandings;
    for (const child of standings.children) {
      for (const entry of child.standings.entries) {
        const record = records[entry.team.abbreviation];
        if (!record) continue;
        const [wins, losses] = record;
        const values: Record<string, number> = {
          wins,
          losses,
          winPercent: wins / (wins + losses),
        };
        for (const stat of entry.stats) {
          if (stat.name in values) {
            stat.value = values[stat.name];
            stat.displayValue = String(values[stat.name]);
          }
        }
      }
    }
    return standings;
  }

  function leadersWithGames(games: Record<string, number>): LooseByAthlete {
    const leaders = JSON.parse(
      JSON.stringify(NBA_BYATHLETE_2026_REGULAR_SEASON)
    ) as LooseByAthlete;
    const gamesIndex = leaders.categories
      .find((category) => category.name === "general")!
      .names.indexOf("gamesPlayed");
    leaders.athletes = leaders.athletes.filter(
      (entry) => entry.athlete.displayName in games
    );
    for (const entry of leaders.athletes) {
      entry.categories.find((category) => category.name === "general")!.values[gamesIndex] =
        games[entry.athlete.displayName];
    }
    return leaders;
  }

  function scheduleFor(team: string, season: string | null, seasonType: string | null) {
    if (team === "chi") {
      return season === "2026" && seasonType === "2"
        ? NBA_TEAM_SCHEDULE_CHI_2026
        : NBA_TEAM_SCHEDULE_EMPTY;
    }
    // With no season type ESPN serves the current one, which was the preseason
    // when these were fetched.
    if (!season || !seasonType) return NBA_TEAM_SCHEDULE_OKC.default;
    if (season === "2026" && seasonType === "2") return NBA_TEAM_SCHEDULE_OKC.regularSeason2026;
    if (season === "2026" && seasonType === "3") return NBA_TEAM_SCHEDULE_OKC.postseason2026;
    if (season === "2027" && seasonType === "2") return NBA_TEAM_SCHEDULE_OKC.regularSeason2027;
    return NBA_TEAM_SCHEDULE_EMPTY;
  }

  function stubEspn(
    options: {
      standings2027?: unknown;
      byathlete2027?: unknown;
      failDays?: string[];
      teams?: unknown;
    } = {}
  ) {
    const requests: string[] = [];
    let scoreboardInFlight = 0;
    let scoreboardPeak = 0;

    jest.spyOn(global, "fetch").mockImplementation((async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const { pathname, searchParams } = url;
      const season = searchParams.get("season");
      const seasonType = searchParams.get("seasontype");
      requests.push(`${pathname.split("/nba/")[1]}${url.search}`);

      if (pathname.endsWith("/standings")) {
        return jsonResponse(
          season === "2027" ? options.standings2027 ?? NBA_STANDINGS_2027 : NBA_STANDINGS_2026
        );
      }
      if (pathname.endsWith("/byathlete")) {
        if (season === "2027") return jsonResponse(options.byathlete2027 ?? NBA_BYATHLETE_2027);
        // For a finished season ESPN serves the postseason unless the regular
        // season is asked for.
        return jsonResponse(
          seasonType === "2" ? NBA_BYATHLETE_2026_REGULAR_SEASON : NBA_BYATHLETE_2026_POSTSEASON
        );
      }
      if (pathname.endsWith("/scoreboard")) {
        const dates = searchParams.get("dates") ?? "";
        scoreboardInFlight += 1;
        scoreboardPeak = Math.max(scoreboardPeak, scoreboardInFlight);
        await new Promise((resolve) => setImmediate(resolve));
        scoreboardInFlight -= 1;
        if (dates.includes("-") || options.failDays?.includes(dates)) {
          return jsonResponse(NBA_SCOREBOARD_RANGE_REJECTED, 400);
        }
        return jsonResponse(scoreboardDays[dates] ?? scoreboardDays[EMPTY_DAY]);
      }
      if (pathname.endsWith("/schedule")) {
        return jsonResponse(scheduleFor(pathname.split("/").at(-2) ?? "", season, seasonType));
      }
      if (pathname.endsWith("/teams")) return jsonResponse(options.teams ?? NBA_TEAMS);
      if (pathname.includes("/teams/")) return jsonResponse(NBA_TEAM_DETAIL_OKC);
      throw new Error(`Unexpected fetch URL: ${url}`);
    }) as unknown as typeof fetch);

    return { requests, scoreboardPeak: () => scoreboardPeak };
  }

  const names = (leaders: NbaLeader[]) => leaders.map((leader) => leader.name);
  const seeds = (teams: NbaTeam[]) =>
    Object.fromEntries(teams.map((team) => [team.abbreviation, team.conferenceSeed]));

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("scoreboard window", () => {
    it("asks for one day at a time because ESPN rejects a date range", async () => {
      freezeClock("2026-10-15T00:20:00Z");
      const espn = stubEspn();

      const summary = await getNbaSummary();

      const scoreboardRequests = espn.requests.filter((request) =>
        request.startsWith("scoreboard")
      );
      expect(scoreboardRequests).toHaveLength(15);
      expect(scoreboardRequests[0]).toBe("scoreboard?dates=20261008");
      expect(scoreboardRequests.at(-1)).toBe("scoreboard?dates=20261022");
      expect(espn.scoreboardPeak()).toBeLessThanOrEqual(3);
      expect(summary.upcomingFixtures.map((fixture) => fixture.id)).toEqual([
        "401909088",
        "401909089",
        "401909090",
      ]);
    });

    it("keeps standings and leaders when a day fails", async () => {
      freezeClock("2026-10-15T00:20:00Z");
      jest.spyOn(console, "warn").mockImplementation(() => {});
      stubEspn({ failDays: ["20261020"] });

      const summary = await getNbaSummary();

      expect(summary.upcomingFixtures).toEqual([]);
      expect(summary.teamsByConference.east).toHaveLength(15);
      expect(summary.teamsByConference.west).toHaveLength(15);
      expect(summary.scorers.length).toBeGreaterThanOrEqual(5);
    });

    it("drops preseason games", async () => {
      freezeClock("2026-10-03T12:00:00Z");
      stubEspn();

      const summary = await getNbaSummary();

      expect(summary.upcomingFixtures).toEqual([]);
      expect(summary.recentFixtures).toEqual([]);
    });

    it("drops All-Star sides and labels the play-in and the NBA Cup final", async () => {
      freezeClock("2026-02-15T12:00:00Z");
      stubEspn();
      expect((await getNbaSummary()).recentFixtures).toEqual([]);

      jest.setSystemTime(new Date("2026-04-15T12:00:00Z"));
      expect(
        (await getNbaSummary()).recentFixtures.map((fixture) => [fixture.id, fixture.stage])
      ).toEqual([
        ["401866756", "Play-In"],
        ["401866757", "Play-In"],
      ]);

      jest.setSystemTime(new Date("2025-12-16T12:00:00Z"));
      expect(
        (await getNbaSummary()).recentFixtures.map((fixture) => [fixture.id, fixture.stage])
      ).toEqual([["401809839", "NBA Cup"]]);
    });
  });

  describe("season rollover", () => {
    it("steps back to the completed season while the new one has no games and no leaders", async () => {
      freezeClock("2026-10-15T00:20:00Z");
      stubEspn();

      const summary = await getNbaSummary();

      expect(summary.season).toBe("2025-26");
      expect(summary.seasonEndYear).toBe(2026);
      expect(summary.teamsByConference.west[0]).toMatchObject({
        abbreviation: "OKC",
        wins: 64,
        losses: 18,
      });
      expect(summary.scorers[0]).toMatchObject({ name: "Luka Doncic", appearances: 64 });
      // The refresh workflow refuses a snapshot with fewer than five leaders
      // in any category.
      expect(summary.scorers.length).toBeGreaterThanOrEqual(5);
      expect(summary.rebounders.length).toBeGreaterThanOrEqual(5);
      expect(summary.assistLeaders.length).toBeGreaterThanOrEqual(5);
    });

    it("moves to the new season once it has games and leaders", async () => {
      freezeClock("2026-10-22T12:00:00Z");
      const espn = stubEspn({
        standings2027: withRecords({
          DET: [1, 0],
          BOS: [0, 1],
          NY: [1, 0],
          PHI: [0, 1],
          SA: [1, 0],
          OKC: [0, 1],
        }),
        byathlete2027: leadersWithGames({
          "Shai Gilgeous-Alexander": 1,
          "Jaylen Brown": 1,
          "Tyrese Maxey": 1,
          "Cade Cunningham": 1,
          "Stephon Castle": 1,
          "Karl-Anthony Towns": 1,
          "Victor Wembanyama": 1,
          "Jalen Duren": 1,
        }),
      });

      const summary = await getNbaSummary();

      expect(summary.season).toBe("2026-27");
      expect(summary.seasonEndYear).toBe(2027);
      expect(summary.scorers[0]).toMatchObject({
        name: "Shai Gilgeous-Alexander",
        appearances: 1,
      });
      expect(summary.scorers.length).toBeGreaterThanOrEqual(5);
      expect(espn.requests.some((request) => request.includes("season=2026"))).toBe(false);
      // ESPN had handed out no seeds yet, so the order falls back to the record.
      expect(
        summary.teamsByConference.east.slice(0, 2).map((team) => team.abbreviation)
      ).toEqual(["DET", "NY"]);
    });

    it("stays on a season that has games when only the leaders come back empty", async () => {
      freezeClock("2027-01-10T12:00:00Z");
      stubEspn({ standings2027: withRecords({ DET: [25, 12], OKC: [30, 8] }) });

      const summary = await getNbaSummary();

      expect(summary.season).toBe("2026-27");
      expect(summary.scorers).toEqual([]);
    });
  });

  describe("leaders", () => {
    it("reads the regular season and holds leaders to the league's games floor", async () => {
      freezeClock("2026-06-20T12:00:00Z");
      const espn = stubEspn();

      const summary = await getNbaSummary();

      expect(espn.requests.find((request) => request.includes("byathlete"))).toContain(
        "seasontype=2"
      );
      expect(
        summary.scorers.slice(0, 3).map((leader) => [leader.name, leader.appearances])
      ).toEqual([
        ["Luka Doncic", 64],
        ["Shai Gilgeous-Alexander", 68],
        ["Anthony Edwards", 61],
      ]);
      expect(summary.scorers[0].perGame).toBeCloseTo(33.5, 1);
      // 36, 19, 54, and 20 games, all short of 58.
      expect(names(summary.scorers)).not.toContain("Giannis Antetokounmpo");
      expect(names(summary.rebounders)).not.toContain("Domantas Sabonis");
      expect(names(summary.assistLeaders)).not.toContain("Josh Giddey");
      expect(names(summary.assistLeaders)).not.toContain("Ja Morant");
    });

    it("scales the games floor to how many games the team has played", async () => {
      freezeClock("2026-11-10T12:00:00Z");
      stubEspn({
        standings2027: withRecords({ OKC: [8, 2], PHI: [5, 5] }),
        // Eight of ten games is 58 of 82 rounded up, and seven is one short.
        byathlete2027: leadersWithGames({
          "Shai Gilgeous-Alexander": 8,
          "Jaylen Brown": 7,
        }),
      });

      const summary = await getNbaSummary();

      expect(names(summary.scorers)).toEqual(["Shai Gilgeous-Alexander"]);
    });
  });

  describe("seeds", () => {
    it("follows ESPN's playoffSeed, which carries the tiebreakers and the play-in", async () => {
      freezeClock("2026-06-20T12:00:00Z");
      stubEspn();

      const { east, west } = (await getNbaSummary()).teamsByConference;

      expect(seeds(east)).toMatchObject({ TOR: 5, ATL: 6, PHI: 7, ORL: 8 });
      expect(seeds(west)).toMatchObject({ POR: 7, PHX: 8 });
      expect(east.map((team) => team.position)).toEqual(
        Array.from({ length: 15 }, (_, index) => index + 1)
      );
    });
  });

  describe("team schedule", () => {
    it("reads scores and the stage, and adds the playoffs to a finished regular season", async () => {
      stubEspn();

      const snapshot = await getNbaTeamSnapshot("okc", "west", 2026);

      expect(snapshot.recentFixtures.map((fixture) => fixture.id)).toEqual([
        "401873203",
        "401873202",
        "401873201",
        "401811051",
        "401811037",
      ]);
      expect(snapshot.recentFixtures[0]).toMatchObject({
        stage: "Playoffs",
        status: "FINISHED",
        score: { winner: "AWAY_TEAM", home: 103, away: 111 },
      });
      expect(snapshot.recentFixtures[3]).toMatchObject({
        stage: "Regular Season",
        score: { winner: "AWAY_TEAM", home: 103, away: 135 },
      });
      expect(snapshot.form).toMatchObject({
        wins: 1,
        losses: 4,
        pointsFor: 531,
        pointsAgainst: 605,
      });
      expect(snapshot.upcomingFixtures).toEqual([]);
    });

    it("leaves the playoffs alone while regular season games remain", async () => {
      const espn = stubEspn();

      const snapshot = await getNbaTeamSnapshot("okc", "west", 2027);

      expect(snapshot.recentFixtures).toEqual([]);
      expect(snapshot.upcomingFixtures.map((fixture) => [fixture.id, fixture.stage])).toEqual([
        ["401909090", "Regular Season"],
        ["401909094", "Regular Season"],
        ["401909865", "Regular Season"],
      ]);
      expect(espn.requests.filter((request) => request.includes("/schedule"))).toEqual([
        "teams/okc/schedule?season=2027&seasontype=2",
      ]);
    });

    it("drops a postponed game, which ESPN keeps on the schedule after the makeup", async () => {
      stubEspn();

      const snapshot = await getNbaTeamSnapshot("chi", "east", 2026);

      expect(snapshot.upcomingFixtures).toEqual([]);
      expect(snapshot.recentFixtures.map((fixture) => fixture.id)).toEqual([
        "401811048",
        "401811032",
      ]);
    });

    it("builds team panels for the season the summary settled on", async () => {
      freezeClock("2026-10-15T00:20:00Z");
      jest
        .spyOn(global, "setTimeout")
        .mockImplementation(((callback: () => void) => {
          callback();
          return 0;
        }) as unknown as typeof setTimeout);
      const okcOnly = JSON.parse(JSON.stringify(NBA_TEAMS)) as typeof NBA_TEAMS;
      okcOnly.sports[0].leagues[0].teams = okcOnly.sports[0].leagues[0].teams.filter(
        (wrapper) => wrapper.team.abbreviation === "OKC"
      );
      stubEspn({ teams: okcOnly });

      const snapshot = await buildNbaSnapshot();

      expect(snapshot.season).toBe("2025-26");
      expect(snapshot.teamSnapshots.okc.recentFixtures[0]).toMatchObject({
        id: "401873203",
        score: { home: 103, away: 111 },
      });
    });
  });
});
