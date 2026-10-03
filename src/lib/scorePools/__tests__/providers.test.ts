/**
 * @jest-environment node
 */
import {
  fetchApiFootballFixtures,
  fetchApiFootballInjuries,
  fetchApiFootballLineupsConfirmed,
  fetchApiFootballStandings,
} from "../providers/apiFootball";
import { fetchTheOddsApiEvents } from "../providers/theOddsApi";

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

// The envelope is the one v3.football.api-sports.io returns: `errors` is an
// empty array on success and an object keyed by error kind on a refusal.
function apiFootballEnvelope(overrides: Record<string, unknown>) {
  return {
    get: "fixtures",
    parameters: { league: "39", season: "2026" },
    errors: [],
    results: 0,
    paging: { current: 1, total: 1 },
    response: [],
    ...overrides,
  };
}

const apiFootballFixture = {
  fixture: { id: 1208021, date: "2026-10-10T14:00:00+00:00", status: { short: "NS" } },
  league: { round: "Regular Season - 7" },
  teams: { home: { name: "Arsenal" }, away: { name: "Everton" } },
  goals: { home: null, away: null },
  score: {
    fulltime: { home: null, away: null },
    extratime: { home: null, away: null },
    penalty: { home: null, away: null },
  },
};

const oddsApiEvent = {
  id: "e1",
  sport_key: "soccer_epl",
  commence_time: "2026-10-10T14:00:00Z",
  home_team: "Arsenal",
  away_team: "Everton",
  bookmakers: [
    {
      key: "williamhill",
      title: "William Hill",
      markets: [
        {
          key: "h2h",
          outcomes: [
            { name: "Arsenal", price: 1.4 },
            { name: "Everton", price: 7.5 },
            { name: "Draw", price: 4.6 },
          ],
        },
      ],
    },
    {
      key: "pinnacle",
      title: "Pinnacle",
      markets: [
        {
          key: "h2h",
          outcomes: [
            { name: "Arsenal", price: 1.45 },
            { name: "Everton", price: 7.9 },
            { name: "Draw", price: 4.8 },
          ],
        },
        {
          key: "totals",
          outcomes: [
            { name: "Over", price: 1.85, point: 2.5 },
            { name: "Under", price: 2.02, point: 2.5 },
          ],
        },
      ],
    },
  ],
};

describe("API-Football adapter", () => {
  it("throws the provider's message when a 200 response carries an errors object", async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse(
        apiFootballEnvelope({
          errors: {
            plan: "Free plans do not have access to this season, try from 2022 to 2024.",
          },
        }),
      ),
    );

    await expect(
      fetchApiFootballFixtures(39, 2026, "test-key", fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow(/Free plans do not have access to this season, try from 2022 to 2024\./);
  });

  it("throws when the errors body is a non-empty array", async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse(apiFootballEnvelope({ errors: ["The season field is required."] })),
    );

    await expect(
      fetchApiFootballFixtures(39, 2026, "test-key", fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow(/The season field is required\./);
  });

  it("maps fixtures when the errors body is empty", async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse(apiFootballEnvelope({ results: 1, response: [apiFootballFixture] })),
    );

    const fixtures = await fetchApiFootballFixtures(
      39,
      2026,
      "test-key",
      fetchImpl as unknown as typeof fetch,
    );

    expect(fixtures).toEqual([
      {
        id: "af-1208021",
        kickoff: "2026-10-10T14:00:00.000Z",
        homeTeam: "Arsenal",
        awayTeam: "Everton",
        round: "Regular Season - 7",
        status: "scheduled",
        result: null,
      },
    ]);
  });

  it("sends a request timeout", async () => {
    const fetchImpl = jest.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse(apiFootballEnvelope({})),
    );

    await fetchApiFootballFixtures(39, 2026, "test-key", fetchImpl as unknown as typeof fetch);

    expect(fetchImpl.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("The Odds API adapter", () => {
  it("sends a request timeout", async () => {
    const fetchImpl = jest.fn(async (_url: string, _init?: RequestInit) => jsonResponse([]));

    await fetchTheOddsApiEvents("soccer_epl", "test-key", fetchImpl as unknown as typeof fetch);

    expect(fetchImpl.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("asks for the eu region only, which costs 2 credits a request", async () => {
    const fetchImpl = jest.fn(async (_url: string, _init?: RequestInit) => jsonResponse([]));

    await fetchTheOddsApiEvents("soccer_epl", "test-key", fetchImpl as unknown as typeof fetch);

    const url = new URL(fetchImpl.mock.calls[0][0]);
    expect(url.searchParams.get("regions")).toBe("eu");
    expect(url.searchParams.get("markets")).toBe("h2h,totals");
  });

  it("reduces an eu response to the sharpest book's three way prices and totals", async () => {
    const fetchImpl = jest.fn(async () => jsonResponse([oddsApiEvent]));

    const events = await fetchTheOddsApiEvents(
      "soccer_epl",
      "test-key",
      fetchImpl as unknown as typeof fetch,
    );

    expect(events).toEqual([
      {
        homeTeam: "Arsenal",
        awayTeam: "Everton",
        commenceTime: "2026-10-10T14:00:00Z",
        bookmaker: "pinnacle",
        moneyline: { home: 1.45, draw: 4.8, away: 7.9 },
        totals: { line: 2.5, over: 1.85, under: 2.02 },
      },
    ]);
  });
});

describe("API-Football adapter, response handling", () => {
  type Goals = { home: number | null; away: number | null };
  const none: Goals = { home: null, away: null };

  function rawFixture(
    id: number,
    short: string,
    score: { goals?: Goals; fulltime?: Goals; extratime?: Goals; penalty?: Goals } = {},
    round: string | null | "omit" = "Final",
  ) {
    return {
      fixture: { id, date: "2026-07-19T19:00:00+00:00", status: { short } },
      league: round === "omit" ? {} : { round },
      teams: { home: { name: "Alpha" }, away: { name: "Beta" } },
      goals: score.goals ?? none,
      score: {
        fulltime: score.fulltime ?? none,
        extratime: score.extratime ?? none,
        penalty: score.penalty ?? none,
      },
    };
  }

  async function mapFixtures(response: unknown[]) {
    const fetchImpl = jest.fn(async () => jsonResponse(apiFootballEnvelope({ response })));
    return fetchApiFootballFixtures(1, 2026, "k", fetchImpl as unknown as typeof fetch);
  }

  it("calls the fixtures endpoint with the key header", async () => {
    const fetchImpl = jest.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse(apiFootballEnvelope({})),
    );
    await fetchApiFootballFixtures(39, 2026, "secret", fetchImpl as unknown as typeof fetch);
    expect(fetchImpl.mock.calls[0][0]).toBe(
      "https://v3.football.api-sports.io/fixtures?league=39&season=2026",
    );
    expect(fetchImpl.mock.calls[0][1]?.headers).toEqual({ "x-apisports-key": "secret" });
  });

  it("throws with the HTTP status on a non-OK response", async () => {
    const fetchImpl = jest.fn(async () => new Response("nope", { status: 429 }));
    const error = await fetchApiFootballFixtures(
      39,
      2026,
      "k",
      fetchImpl as unknown as typeof fetch,
    ).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(
      "API-Football responded 429 for /fixtures?league=39&season=2026",
    );
    expect((error as { status?: number }).status).toBe(429);
  });

  it("propagates a network failure", async () => {
    const fetchImpl = jest.fn(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(
      fetchApiFootballFixtures(39, 2026, "k", fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow("fetch failed");
  });

  it("ignores an errors field that is not an object or array", async () => {
    const fetchImpl = jest.fn(async () =>
      jsonResponse(apiFootballEnvelope({ errors: "ignored", response: [rawFixture(1, "NS")] })),
    );
    const fixtures = await fetchApiFootballFixtures(
      39,
      2026,
      "k",
      fetchImpl as unknown as typeof fetch,
    );
    expect(fixtures).toHaveLength(1);
  });

  it("maps every provider status family", async () => {
    const statuses: Array<[string, string]> = [
      ["NS", "scheduled"],
      ["TBD", "scheduled"],
      ["1H", "in_play"],
      ["HT", "in_play"],
      ["ET", "in_play"],
      ["P", "in_play"],
      ["LIVE", "in_play"],
      ["PST", "postponed"],
      ["CANC", "postponed"],
      ["ABD", "postponed"],
      ["AWD", "postponed"],
      ["FT", "finished"],
      ["AET", "finished"],
      ["PEN", "finished"],
    ];
    const fixtures = await mapFixtures(
      statuses.map(([short], i) => rawFixture(i, short, { fulltime: { home: 0, away: 0 }, goals: { home: 0, away: 0 } })),
    );
    expect(fixtures.map((fixture) => fixture.status)).toEqual(statuses.map(([, mapped]) => mapped));
  });

  it("gives unfinished games no result even when goals are present", async () => {
    const [live] = await mapFixtures([rawFixture(1, "2H", { goals: { home: 1, away: 0 } })]);
    expect(live.result).toBeNull();
  });

  it("maps a 90-minute finish from the full-time score", async () => {
    const [ft] = await mapFixtures([
      rawFixture(1, "FT", { goals: { home: 2, away: 1 }, fulltime: { home: 2, away: 1 } }),
    ]);
    expect(ft.result).toEqual({
      ninetyMinutes: { home: 2, away: 1 },
      afterExtraTime: null,
      penaltyWinner: null,
    });
  });

  it("falls back to goals when the full-time score is missing, and to no result when both are", async () => {
    const [fallback, empty] = await mapFixtures([
      rawFixture(1, "FT", { goals: { home: 3, away: 3 } }),
      rawFixture(2, "FT"),
    ]);
    expect(fallback.result?.ninetyMinutes).toEqual({ home: 3, away: 3 });
    expect(empty.result).toBeNull();
  });

  it("separates the 90-minute score from the score after extra time", async () => {
    const [aet] = await mapFixtures([
      rawFixture(1, "AET", {
        goals: { home: 2, away: 1 },
        fulltime: { home: 1, away: 1 },
        extratime: { home: 1, away: 0 },
      }),
    ]);
    expect(aet.result).toEqual({
      ninetyMinutes: { home: 1, away: 1 },
      afterExtraTime: { home: 2, away: 1 },
      penaltyWinner: null,
    });
  });

  it("leaves extra time null when the final tally is missing", async () => {
    const [aet] = await mapFixtures([rawFixture(1, "AET", { fulltime: { home: 1, away: 1 } })]);
    expect(aet.result).toEqual({
      ninetyMinutes: { home: 1, away: 1 },
      afterExtraTime: null,
      penaltyWinner: null,
    });
  });

  it("names the shootout winner on either side, and none when the shootout score is missing", async () => {
    const level = { goals: { home: 1, away: 1 }, fulltime: { home: 1, away: 1 } };
    const [homeWin, awayWin, unknown] = await mapFixtures([
      rawFixture(1, "PEN", { ...level, penalty: { home: 5, away: 4 } }),
      rawFixture(2, "PEN", { ...level, penalty: { home: 2, away: 4 } }),
      rawFixture(3, "PEN", level),
    ]);
    expect(homeWin.result?.penaltyWinner).toBe("home");
    expect(homeWin.result?.afterExtraTime).toEqual({ home: 1, away: 1 });
    expect(awayWin.result?.penaltyWinner).toBe("away");
    expect(unknown.result?.penaltyWinner).toBeNull();
  });

  it("maps a missing or null round to null", async () => {
    const [missing, nulled] = await mapFixtures([
      rawFixture(1, "NS", {}, "omit"),
      rawFixture(2, "NS", {}, null),
    ]);
    expect(missing.round).toBeNull();
    expect(nulled.round).toBeNull();
  });

  it("maps standings groups with unknown clinch state", async () => {
    const fetchImpl = jest.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse(
        apiFootballEnvelope({
          response: [
            {
              league: {
                standings: [
                  [
                    { rank: 1, team: { name: "Alpha" }, points: 9, group: "Group A", all: { played: 3 } },
                    { rank: 2, team: { name: "Beta" }, points: 6, group: "Group A", all: { played: 3 } },
                  ],
                  [{ rank: 1, team: { name: "Gamma" }, points: 7, all: { played: 3 } }],
                  [],
                ],
              },
            },
          ],
        }),
      ),
    );
    const groups = await fetchApiFootballStandings(1, 2026, "k", fetchImpl as unknown as typeof fetch);
    expect(fetchImpl.mock.calls[0][0]).toContain("/standings?league=1&season=2026");
    expect(groups).toEqual([
      {
        group: "Group A",
        rows: [
          { team: "Alpha", position: 1, played: 3, points: 9, qualified: null, eliminated: null },
          { team: "Beta", position: 2, played: 3, points: 6, qualified: null, eliminated: null },
        ],
      },
      {
        group: null,
        rows: [{ team: "Gamma", position: 1, played: 3, points: 7, qualified: null, eliminated: null }],
      },
      { group: null, rows: [] },
    ]);
  });

  it("returns no standings when the provider has none", async () => {
    const fetchImpl = jest.fn(async () => jsonResponse(apiFootballEnvelope({ response: [] })));
    await expect(
      fetchApiFootballStandings(1, 2026, "k", fetchImpl as unknown as typeof fetch),
    ).resolves.toEqual([]);
  });

  it("groups injury notes by team, with reasons, capped at five a team", async () => {
    const injury = (team: string, name: string, reason?: string | null) => ({
      player: { name, ...(reason !== undefined ? { reason } : {}) },
      team: { name: team },
    });
    const fetchImpl = jest.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse(
        apiFootballEnvelope({
          response: [
            injury("Alpha", "A1", "Knee Injury"),
            injury("Alpha", "A2", null),
            injury("Beta", "B1"),
            injury("Alpha", "A3", "Suspended"),
            injury("Alpha", "A4", "Illness"),
            injury("Alpha", "A5", "Ankle"),
            injury("Alpha", "A6", "Hamstring"),
          ],
        }),
      ),
    );
    const notes = await fetchApiFootballInjuries(1, 2026, "k", fetchImpl as unknown as typeof fetch);
    expect(fetchImpl.mock.calls[0][0]).toContain("/injuries?league=1&season=2026");
    expect(notes.get("Alpha")).toEqual([
      "A1 (Knee Injury)",
      "A2",
      "A3 (Suspended)",
      "A4 (Illness)",
      "A5 (Ankle)",
    ]);
    expect(notes.get("Beta")).toEqual(["B1"]);
    expect(notes.has("Gamma")).toBe(false);
  });

  it("confirms lineups only when both elevens are published", async () => {
    const eleven = Array.from({ length: 11 }, (_, i) => ({ player: { id: i } }));
    const check = async (response: unknown[]) => {
      const fetchImpl = jest.fn(async (_url: string, _init?: RequestInit) =>
        jsonResponse(apiFootballEnvelope({ response })),
      );
      const confirmed = await fetchApiFootballLineupsConfirmed(
        555,
        "k",
        fetchImpl as unknown as typeof fetch,
      );
      expect(fetchImpl.mock.calls[0][0]).toContain("/fixtures/lineups?fixture=555");
      return confirmed;
    };
    expect(
      await check([
        { team: { name: "Alpha" }, startXI: eleven },
        { team: { name: "Beta" }, startXI: eleven },
      ]),
    ).toBe(true);
    expect(await check([])).toBe(false);
    expect(await check([{ team: { name: "Alpha" }, startXI: eleven }])).toBe(false);
    expect(
      await check([
        { team: { name: "Alpha" }, startXI: eleven },
        { team: { name: "Beta" }, startXI: eleven.slice(0, 10) },
      ]),
    ).toBe(false);
    expect(
      await check([{ team: { name: "Alpha" }, startXI: eleven }, { team: { name: "Beta" } }]),
    ).toBe(false);
  });

  it("uses the global fetch when no fetch implementation is passed", async () => {
    const spy = jest
      .spyOn(global, "fetch")
      .mockImplementation(async () => jsonResponse(apiFootballEnvelope({ response: [] })));
    try {
      await expect(fetchApiFootballFixtures(1, 2026, "k")).resolves.toEqual([]);
      await expect(fetchApiFootballStandings(1, 2026, "k")).resolves.toEqual([]);
      await expect(fetchApiFootballInjuries(1, 2026, "k")).resolves.toEqual(new Map());
      await expect(fetchApiFootballLineupsConfirmed(1, "k")).resolves.toBe(false);
      expect(spy).toHaveBeenCalledTimes(4);
    } finally {
      spy.mockRestore();
    }
  });
});
