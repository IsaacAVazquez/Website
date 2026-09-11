/**
 * @jest-environment node
 */
import {
  assertBestBallSourceScoring,
  fetchBestBallRankingsBoard,
  fetchBestBallSuperflexRankingsBoard,
  getBestBallRefreshFallback,
  getExpectedBestBallSeason,
  parseBestBallAdpPayload,
  parseBestBallSchedulePayload,
} from "@/lib/bestBallSource";
import { FANTASY_PROS_OFFICIAL_API_SOURCE } from "@/lib/fantasyProsPublicSource";

const originalFantasyProsApiKey = process.env.FANTASYPROS_API_KEY;
const originalFantasyProsSource = process.env.FANTASYPROS_SOURCE;

function officialRankingsPayload(options: {
  position: "ALL" | "OP";
  scoring: "PPR" | "HALF";
  rankingType: "BEST" | "DRAFT";
}) {
  const positions = ["QB", "RB", "WR", "TE"] as const;
  const players = Array.from({ length: 250 }, (_, index) => {
    const position = positions[index % positions.length];
    const rank = index + 1;
    return {
      player_id: 30000 + index,
      player_name: `Best Ball Player ${rank}`,
      player_short_name: `B. Player ${rank}`,
      player_team_id: "ATL",
      player_position_id: position,
      player_positions: position,
      sportsdata_id: `00000000-0000-4000-8000-${String(30000 + index).padStart(12, "0")}`,
      player_eligibility: position,
      player_yahoo_positions: position,
      player_page_url: `https://www.fantasypros.com/nfl/players/best-ball-player-${rank}.php`,
      player_filename: `best-ball-player-${rank}.php`,
      player_yahoo_id: String(30000 + index),
      cbs_player_id: String(30000 + index),
      player_bye_week: "5",
      player_owned_avg: 50,
      player_owned_espn: 50,
      player_owned_yahoo: 50,
      rank_ecr: rank,
      pos_rank: `${position}${rank}`,
      tier: Math.ceil(rank / 12),
    };
  });

  return {
    sport: "NFL",
    ranking_type_name: options.rankingType,
    year: "2026",
    week: "0",
    position_id: options.position,
    scoring: options.scoring,
    filters: null,
    count: players.length,
    total_experts: options.rankingType === "BEST" ? 6 : 12,
    last_updated: "8/11",
    last_updated_ts: 1776266960,
    players,
  };
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers(),
    json: async () => body,
  } as Response;
}

describe("best ball public sources", () => {
  beforeEach(() => {
    delete process.env.FANTASYPROS_API_KEY;
    delete process.env.FANTASYPROS_SOURCE;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    if (originalFantasyProsApiKey === undefined) {
      delete process.env.FANTASYPROS_API_KEY;
    } else {
      process.env.FANTASYPROS_API_KEY = originalFantasyProsApiKey;
    }
    if (originalFantasyProsSource === undefined) {
      delete process.env.FANTASYPROS_SOURCE;
    } else {
      process.env.FANTASYPROS_SOURCE = originalFantasyProsSource;
    }
  });

  it("keeps January and February attached to the season that began the prior year", () => {
    expect(getExpectedBestBallSeason(new Date("2027-02-15T00:00:00.000Z"))).toBe(2026);
    expect(getExpectedBestBallSeason(new Date("2027-03-01T00:00:00.000Z"))).toBe(2027);
  });

  it("rejects a rankings feed with the wrong scoring label", () => {
    expect(() => assertBestBallSourceScoring("PPR", "HALF")).toThrow(
      "instead of HALF"
    );
    expect(() => assertBestBallSourceScoring("HALF", "HALF")).not.toThrow();
  });

  it("maps standard best ball to BEST/ALL and Superflex to DRAFT/OP on the official API", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-11T12:00:00.000Z"));
    process.env.FANTASYPROS_SOURCE = "official-api";
    process.env.FANTASYPROS_API_KEY = "best-ball-test-key";
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation(async (input) => {
        const url = new URL(String(input));
        const position = url.searchParams.get("position");
        const scoring = url.searchParams.get("scoring");
        const rankingType = url.searchParams.get("type");
        if (
          (position !== "ALL" && position !== "OP") ||
          (scoring !== "PPR" && scoring !== "HALF") ||
          (rankingType !== "BEST" && rankingType !== "DRAFT")
        ) {
          throw new Error(`Unexpected FantasyPros request ${url}`);
        }
        return jsonResponse(
          officialRankingsPayload({ position, scoring, rankingType })
        );
      });

    const standard = await fetchBestBallRankingsBoard();
    const superflex = await fetchBestBallSuperflexRankingsBoard();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const standardUrl = new URL(String(fetchMock.mock.calls[0][0]));
    const superflexUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(Object.fromEntries(standardUrl.searchParams)).toEqual({
      position: "ALL",
      scoring: "PPR",
      type: "BEST",
      week: "0",
    });
    expect(Object.fromEntries(superflexUrl.searchParams)).toEqual({
      position: "OP",
      scoring: "HALF",
      type: "DRAFT",
      week: "0",
    });
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.headers).toMatchObject({
        Accept: "application/json",
        "x-api-key": "best-ball-test-key",
      });
    }
    expect(standard).toMatchObject({
      season: 2026,
      sourceLabel: FANTASY_PROS_OFFICIAL_API_SOURCE,
      expertCount: 6,
    });
    expect(superflex).toMatchObject({
      season: 2026,
      sourceLabel: FANTASY_PROS_OFFICIAL_API_SOURCE,
      expertCount: 12,
    });
    expect(standard.players).toHaveLength(250);
    expect(superflex.players).toHaveLength(250);
  });

  it.each([
    {
      label: "accepts a board whose consensus rank agrees with its own expert range",
      omitEveryThird: false,
    },
    {
      label: "rejects a board whose consensus rank contradicts its own expert range at the top",
      omitEveryThird: true,
    },
  ])("$label", async ({ omitEveryThird }) => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-07T12:00:00.000Z"));
    process.env.FANTASYPROS_SOURCE = "official-api";
    process.env.FANTASYPROS_API_KEY = "best-ball-test-key";
    const payload = officialRankingsPayload({ position: "ALL", scoring: "PPR", rankingType: "BEST" });
    payload.total_experts = 4;
    // The 2026-09-06 shape: three of four experts rank the player at the top
    // while the fourth omits him, so the published average and range stay at
    // the top and rank_ecr lands 53 places lower.
    payload.players = payload.players.map((player, index) => {
      const rank = index + 1;
      const omitted = omitEveryThird && index % 3 === 0 && index < 200;
      return {
        ...player,
        rank_ecr: omitted ? rank + 53 : rank,
        rank_ave: rank + 0.33,
        rank_min: Math.max(1, rank - 1),
        rank_max: rank + 2,
        rank_std: 0.47,
        tier: omitted ? 7 : player.tier,
      };
    });
    jest.spyOn(global, "fetch").mockImplementation(async () => jsonResponse(payload));

    if (omitEveryThird) {
      await expect(fetchBestBallRankingsBoard()).rejects.toThrow(
        /disagrees with its own expert ranges: \d+ of the top 150 players/
      );
    } else {
      await expect(fetchBestBallRankingsBoard()).resolves.toMatchObject({ expertCount: 4 });
    }
  });

  it("keeps a committed snapshot on a failed refresh while it is recent or once the season has opened", () => {
    const preseason = new Date("2026-08-20T12:00:00.000Z");
    expect(
      getBestBallRefreshFallback({ season: 2026, generatedAt: "2026-08-15T12:00:00.000Z" }, preseason)
    ).toEqual({ keep: true, reason: "recent" });
    expect(
      getBestBallRefreshFallback({ season: 2026, generatedAt: "2026-08-01T12:00:00.000Z" }, preseason)
    ).toEqual({ keep: false, reason: "stale" });

    // Week 1 opened Wednesday 2026-09-09; a frozen board is the honest state after that.
    const inSeason = new Date("2026-09-25T12:00:00.000Z");
    expect(
      getBestBallRefreshFallback({ season: 2026, generatedAt: "2026-09-03T12:00:00.000Z" }, inSeason)
    ).toEqual({ keep: true, reason: "season-open" });
    expect(
      getBestBallRefreshFallback({ season: 2026, generatedAt: "2026-09-08T12:00:00.000Z" }, new Date("2026-09-08T13:00:00.000Z"))
    ).toEqual({ keep: true, reason: "recent" });
  });

  it("keeps only usable NFL best ball ADP rows and carries the latest timestamp", () => {
    const contract = { season: 2026, week: 0, format: "PPR", ranker: "hayden" };
    const sourceRow = {
      season: 2026,
      week: 0,
      format: "PPR",
      rankerSlug: "hayden",
    };
    const board = parseBestBallAdpPayload([
      {
        ...sourceRow,
        adp: 11.2,
        updatedAt: "2026-08-01T10:00:00Z",
        player: { name: "Ja'Marr Chase", position: "WR", nflTeamAbbr: "CIN" },
      },
      {
        ...sourceRow,
        adp: 44,
        updatedAt: "2026-08-02T10:00:00Z",
        player: { name: "Josh Allen", position: "QB", nflTeamAbbr: "BUF" },
      },
      { ...sourceRow, adp: null, player: { name: "No Market", position: "RB" } },
      { ...sourceRow, adp: 3, player: { name: "Wrong Sport", position: "P" } },
    ], contract);

    expect(board.entries).toEqual([
      { name: "Ja'Marr Chase", team: "CIN", position: "WR", adp: 11.2 },
      { name: "Josh Allen", team: "BUF", position: "QB", adp: 44 },
    ]);
    expect(board.updatedAt).toBe("2026-08-02T10:00:00.000Z");
    expect(board).toMatchObject({ season: 2026, format: "PPR", ranker: "hayden" });
  });

  it.each([
    ["season", { season: 2025 }],
    ["week", { week: 1 }],
    ["format", { format: "HALF" }],
    ["ranker", { rankerSlug: "other" }],
  ])("rejects an ADP row with the wrong %s contract", (_field, override) => {
    expect(() =>
      parseBestBallAdpPayload(
        [
          {
            season: 2026,
            week: 0,
            format: "PPR",
            rankerSlug: "hayden",
            adp: 10,
            player: { name: "Contract Player", position: "WR", nflTeamAbbr: "SEA" },
            ...override,
          },
        ],
        { season: 2026, week: 0, format: "PPR", ranker: "hayden" }
      )
    ).toThrow(/outside the requested/i);
  });

  it("builds both directions of every Week 17 matchup", () => {
    const teams = [
      "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE",
      "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC",
      "LAC", "LAR", "LV", "MIA", "MIN", "NE", "NO", "NYG",
      "NYJ", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WSH",
    ];
    const payload = {
      season: { year: 2026 },
      week: { number: 17 },
      events: Array.from({ length: 16 }, (_, index) => ({
        competitions: [{
          competitors: [
            { team: { abbreviation: teams[index * 2] } },
            { team: { abbreviation: teams[index * 2 + 1] } },
          ],
        }],
      })),
    };

    const board = parseBestBallSchedulePayload(payload, {
      season: 2026,
      week: 17,
      sourceUrl: "https://example.com/schedule",
    });

    expect(board.opponents.ARI).toBe("ATL");
    expect(board.opponents.ATL).toBe("ARI");
    expect(Object.keys(board.opponents)).toHaveLength(32);
  });

  it("rejects an incomplete schedule", () => {
    expect(() =>
      parseBestBallSchedulePayload(
        {
          season: { year: 2026 },
          week: { number: 17 },
          events: [],
        },
        { season: 2026, week: 17, sourceUrl: "https://example.com" }
      )
    ).toThrow("incomplete NFL week");
  });
});
