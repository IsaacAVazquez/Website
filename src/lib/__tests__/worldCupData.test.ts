/**
 * @jest-environment node
 */
import {
  buildWorldCupSnapshotData,
  classifyStageByDate,
} from "../worldCupData";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// --- ESPN response builders --------------------------------------------------

function makeStandingsEntry(opts: {
  id: string;
  name: string;
  abbr: string;
  rank?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
}) {
  return {
    team: {
      id: opts.id,
      displayName: opts.name,
      shortDisplayName: opts.name,
      abbreviation: opts.abbr,
      logos: [{ href: `https://logos.example/${opts.abbr}.png` }],
    },
    stats: [
      { type: "rank", value: opts.rank ?? 1 },
      { type: "wins", value: opts.wins ?? 0 },
      { type: "ties", value: opts.draws ?? 0 },
      { type: "losses", value: opts.losses ?? 0 },
      { type: "pointsfor", value: opts.goalsFor ?? 0 },
      { type: "pointsagainst", value: opts.goalsAgainst ?? 0 },
    ],
  };
}

function makeStandingsResponse() {
  return {
    children: [
      {
        name: "Group A",
        abbreviation: "A",
        standings: {
          entries: [
            makeStandingsEntry({
              id: "100",
              name: "Mexico",
              abbr: "MEX",
              rank: 1,
              wins: 1,
              goalsFor: 2,
              goalsAgainst: 0,
            }),
            makeStandingsEntry({
              id: "101",
              name: "Canada",
              abbr: "CAN",
              rank: 2,
              losses: 1,
              goalsFor: 0,
              goalsAgainst: 2,
            }),
          ],
        },
      },
      {
        name: "Group B",
        abbreviation: "B",
        standings: {
          entries: [
            makeStandingsEntry({
              id: "200",
              name: "United States",
              abbr: "USA",
              rank: 1,
            }),
            makeStandingsEntry({
              id: "201",
              name: "Brazil",
              abbr: "BRA",
              rank: 2,
            }),
          ],
        },
      },
    ],
  };
}

function makeEvent(opts: {
  id: string;
  date: string;
  homeName: string;
  homeAbbr: string;
  awayName: string;
  awayAbbr: string;
  homeScore?: number | null;
  awayScore?: number | null;
  state?: string; // "pre" | "in" | "post"
  completed?: boolean;
  homeWinner?: boolean;
  awayWinner?: boolean;
}) {
  const statusType = {
    state: opts.state ?? "post",
    completed: opts.completed ?? true,
    description: "Status",
  };
  return {
    id: opts.id,
    date: opts.date,
    competitions: [
      {
        date: opts.date,
        venue: { fullName: "Estadio Azteca" },
        status: { type: statusType },
        competitors: [
          {
            homeAway: "home",
            winner: opts.homeWinner ?? false,
            score: opts.homeScore ?? null,
            team: {
              id: `t-${opts.homeAbbr}`,
              displayName: opts.homeName,
              shortDisplayName: opts.homeName,
              abbreviation: opts.homeAbbr,
              logos: [{ href: `https://logos.example/${opts.homeAbbr}.png` }],
            },
          },
          {
            homeAway: "away",
            winner: opts.awayWinner ?? false,
            score: opts.awayScore ?? null,
            team: {
              id: `t-${opts.awayAbbr}`,
              displayName: opts.awayName,
              shortDisplayName: opts.awayName,
              abbreviation: opts.awayAbbr,
              logos: [{ href: `https://logos.example/${opts.awayAbbr}.png` }],
            },
          },
        ],
      },
    ],
    status: { type: statusType },
  };
}

/**
 * Route fetch() by URL. The scoreboard is paged across the tournament window in
 * ~10-day chunks; this mock returns the group-stage events only for the page
 * covering June 11 and empty events for every other page.
 */
function mockFetch(opts: {
  standings?: unknown;
  events?: ReturnType<typeof makeEvent>[];
  eventsWindowStart?: string; // YYYYMMDD that the events page begins with
} = {}) {
  const standings = opts.standings ?? makeStandingsResponse();
  const events = opts.events ?? [
    // Group-stage matches (dates well before the 2026-06-28 R32 boundary).
    makeEvent({
      id: "evt-1",
      date: "2026-06-11T18:00:00Z",
      homeName: "Mexico",
      homeAbbr: "MEX",
      awayName: "Canada",
      awayAbbr: "CAN",
      homeScore: 2,
      awayScore: 0,
      homeWinner: true,
    }),
    makeEvent({
      id: "evt-2",
      date: "2026-06-12T18:00:00Z",
      homeName: "United States",
      homeAbbr: "USA",
      awayName: "Brazil",
      awayAbbr: "BRA",
      state: "pre",
      completed: false,
    }),
  ];
  const windowStart = opts.eventsWindowStart ?? "20260611";

  return jest
    .spyOn(global, "fetch")
    .mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/standings")) {
        return Promise.resolve(jsonResponse(standings));
      }
      if (url.includes("/scoreboard")) {
        // Only the page whose range starts on the events window carries events.
        if (url.includes(`dates=${windowStart}`)) {
          return Promise.resolve(jsonResponse({ events }));
        }
        return Promise.resolve(jsonResponse({ events: [] }));
      }
      return Promise.resolve(jsonResponse({}));
    });
}

describe("classifyStageByDate", () => {
  it("classifies dates before the Round of 32 boundary as the group stage", () => {
    expect(classifyStageByDate("2026-06-11T18:00:00Z")).toEqual({
      stage: "Group stage",
      group: null,
      knockout: null,
    });
    expect(classifyStageByDate("2026-06-27T23:00:00Z").stage).toBe(
      "Group stage"
    );
  });

  it("classifies each knockout window by kickoff date", () => {
    const round32 = classifyStageByDate("2026-06-28T18:00:00Z");
    expect(round32.stage).toBe("Round of 32");
    expect(round32.knockout).toEqual({
      id: "round-of-32",
      name: "Round of 32",
      order: 0,
    });

    expect(classifyStageByDate("2026-07-04T18:00:00Z").knockout?.id).toBe(
      "round-of-16"
    );
    expect(classifyStageByDate("2026-07-08T18:00:00Z").knockout?.id).toBe(
      "quarterfinals"
    );
    expect(classifyStageByDate("2026-07-13T18:00:00Z").knockout?.id).toBe(
      "semifinals"
    );
    expect(classifyStageByDate("2026-07-17T18:00:00Z").knockout?.id).toBe(
      "third-place"
    );
    expect(classifyStageByDate("2026-07-19T18:00:00Z").knockout).toEqual({
      id: "final",
      name: "Final",
      order: 5,
    });
  });

  it("picks the latest matching window for dates after the final boundary", () => {
    expect(classifyStageByDate("2026-08-01T00:00:00Z").knockout?.id).toBe(
      "final"
    );
  });

  it("falls back to the group stage for missing or unparseable dates", () => {
    expect(classifyStageByDate(null).stage).toBe("Group stage");
    expect(classifyStageByDate(undefined).stage).toBe("Group stage");
    expect(classifyStageByDate("not-a-date").stage).toBe("Group stage");
  });
});

describe("buildWorldCupSnapshotData", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds groups, standings, fixtures, and carries the stable tournament block", async () => {
    mockFetch();

    const snapshot = await buildWorldCupSnapshotData();

    // Stable pre-confirmed facts carried forward from the seed.
    expect(snapshot.tournament.name).toBe("2026 FIFA World Cup");
    expect(snapshot.tournament.hosts).toEqual(
      expect.arrayContaining(["Mexico", "United States", "Canada"])
    );
    expect(snapshot.tournament.startDate).toBe("2026-06-11");
    expect(snapshot.tournament.endDate).toBe("2026-07-19");
    expect(snapshot.tournament.teamCount).toBe(48);
    expect(snapshot.tournament.groupCount).toBe(12);
    expect(snapshot.tournament.venues.length).toBeGreaterThan(0);
    expect(typeof snapshot.tournament.generatedAt).toBe("string");

    // Groups populate from the standings response, sorted by letter.
    expect(snapshot.groups.map((g) => g.letter)).toEqual(["A", "B"]);
    const groupA = snapshot.groups.find((g) => g.letter === "A");
    expect(groupA?.name).toBe("Group A");
    expect(groupA?.standings.map((row) => row.name)).toEqual([
      "Mexico",
      "Canada",
    ]);

    // Standing rows derive played/points from W/D/L.
    const mexico = groupA?.standings.find((row) => row.name === "Mexico");
    expect(mexico?.played).toBe(1);
    expect(mexico?.points).toBe(3);
    expect(mexico?.goalDifference).toBe(2);
    expect(mexico?.code).toBe("MEX");

    // Team options are derived and selectable.
    expect(snapshot.teamOptions.length).toBeGreaterThanOrEqual(4);
    const usOption = snapshot.teamOptions.find((t) => t.code === "USA");
    expect(usOption?.group).toBe("B");

    // Fixtures parsed: a finished result and a scheduled match.
    const finished = snapshot.recentFixtures.find((f) => f.id === "evt-1");
    expect(finished?.status).toBe("FINISHED");
    expect(finished?.score).toEqual({ winner: "HOME_TEAM", home: 2, away: 0 });
    expect(finished?.stage).toBe("Group stage");

    const upcoming = snapshot.upcomingFixtures.find((f) => f.id === "evt-2");
    expect(upcoming?.status).toBe("SCHEDULED");

    // Per-team snapshots keyed by team slug.
    expect(snapshot.teamSnapshots["mexico"]).toBeDefined();
    expect(snapshot.teamSnapshots["mexico"].recentFixtures.length).toBe(1);

    // Scorers stay empty (no lineup source wired in).
    expect(snapshot.scorers).toEqual([]);
  });

  it("assigns the group letter to group-stage fixtures by team membership", async () => {
    mockFetch();
    const snapshot = await buildWorldCupSnapshotData();
    const finished = snapshot.recentFixtures.find((f) => f.id === "evt-1");
    expect(finished?.group).toBe("A");
  });

  it("derives recent form for a team that has played", async () => {
    mockFetch();
    const snapshot = await buildWorldCupSnapshotData();
    const mexico = snapshot.teamSnapshots["mexico"];
    expect(mexico.form.sequence).toEqual(["W"]);
    expect(mexico.form.wins).toBe(1);
    expect(mexico.form.goalsFor).toBe(2);
    expect(mexico.form.goalsAgainst).toBe(0);
  });

  it("throws (keeping the existing snapshot) when no fixtures come back", async () => {
    mockFetch({ events: [] });
    await expect(buildWorldCupSnapshotData()).rejects.toThrow(
      /no teams or no fixtures/i
    );
  });

  it("throws when standings have no usable groups and there are no fixtures", async () => {
    mockFetch({ standings: { children: [] }, events: [] });
    await expect(buildWorldCupSnapshotData()).rejects.toThrow(
      /no teams or no fixtures/i
    );
  });

  it("falls back to fixtures for team options when standings are empty", async () => {
    // No standings groups, but group-stage fixtures carry real teams.
    mockFetch({ standings: { children: [] } });
    const snapshot = await buildWorldCupSnapshotData();
    expect(snapshot.groups).toEqual([]);
    // Team options still populate from the group-stage fixtures.
    expect(snapshot.teamOptions.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.teamOptions.some((t) => t.code === "MEX")).toBe(true);
  });

  it("classifies a knockout fixture into its round", async () => {
    const events = [
      makeEvent({
        id: "evt-group",
        date: "2026-06-11T18:00:00Z",
        homeName: "Mexico",
        homeAbbr: "MEX",
        awayName: "Canada",
        awayAbbr: "CAN",
        homeScore: 2,
        awayScore: 0,
        homeWinner: true,
      }),
      makeEvent({
        id: "evt-final",
        date: "2026-07-19T19:00:00Z",
        homeName: "Argentina",
        homeAbbr: "ARG",
        awayName: "France",
        awayAbbr: "FRA",
        state: "pre",
        completed: false,
      }),
    ];
    // The final lands in a later scoreboard page; route both windows.
    jest
      .spyOn(global, "fetch")
      .mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("/standings")) {
          return Promise.resolve(jsonResponse(makeStandingsResponse()));
        }
        if (url.includes("/scoreboard")) {
          if (url.includes("dates=20260611")) {
            return Promise.resolve(jsonResponse({ events: [events[0]] }));
          }
          // The final is on 2026-07-19; surface it on any page covering July.
          if (url.includes("dates=202607")) {
            return Promise.resolve(jsonResponse({ events: [events[1]] }));
          }
          return Promise.resolve(jsonResponse({ events: [] }));
        }
        return Promise.resolve(jsonResponse({}));
      });

    const snapshot = await buildWorldCupSnapshotData();
    const finalRound = snapshot.knockout.find((r) => r.id === "final");
    expect(finalRound).toBeDefined();
    expect(finalRound?.fixtures.some((f) => f.id === "evt-final")).toBe(true);
  });
});
