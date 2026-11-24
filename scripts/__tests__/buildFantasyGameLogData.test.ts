/**
 * @jest-environment node
 */
import {
  candidateSeasons,
  fetchFirstUsableSeason,
  MIN_GAME_LOG_ENTRIES,
  resolveGameLogFormat,
} from "../buildFantasyGameLogData";
import { fetchFantasyGameLogBoard, type FantasyGameLogEntry } from "@/lib/fantasyGameLogSource";

jest.mock("@/lib/fantasyGameLogSource", () => ({
  ...jest.requireActual("@/lib/fantasyGameLogSource"),
  fetchFantasyGameLogBoard: jest.fn(),
}));
// The retry backoff is not under test, so each fetch runs once.
jest.mock("@/lib/fetchRetry", () => ({
  withRetry: (_label: string, run: () => Promise<unknown>) => run(),
}));

const fetchBoard = fetchFantasyGameLogBoard as jest.MockedFunction<typeof fetchFantasyGameLogBoard>;

function record(entryCount: number, season: number) {
  return {
    entries: Array.from({ length: entryCount }, (_, index) => ({
      name: `Player ${index}`,
    })) as unknown as FantasyGameLogEntry[],
    season,
    seasonType: "REG",
    sourceUrl: `https://example.com/stats_player_week_${season}.csv`,
    throughWeek: 18,
  };
}

describe("resolveGameLogFormat", () => {
  const previous = record(300, 2025);

  it("uses a fresh board that clears the entry floor, including a newer season", () => {
    const fresh = record(MIN_GAME_LOG_ENTRIES, 2026);
    expect(resolveGameLogFormat(fresh, previous)).toEqual({ record: fresh, source: "fresh" });
  });

  it("keeps the previous board over a thin fresh one or a failed fetch", () => {
    expect(resolveGameLogFormat(record(MIN_GAME_LOG_ENTRIES - 1, 2026), previous)).toEqual({
      record: previous,
      source: "previous",
    });
    expect(resolveGameLogFormat(null, previous)).toEqual({ record: previous, source: "previous" });
  });

  it("takes a thin fresh board only when there is nothing to keep", () => {
    const thin = record(4, 2026);
    expect(resolveGameLogFormat(thin, null)).toEqual({ record: thin, source: "thin-fresh" });
    expect(resolveGameLogFormat(thin, record(0, 2025))).toEqual({ record: thin, source: "thin-fresh" });
  });

  it("reports empty when neither side has a player", () => {
    expect(resolveGameLogFormat(null, null)).toEqual({ record: null, source: "empty" });
    expect(resolveGameLogFormat(record(0, 2026), null)).toEqual({ record: null, source: "empty" });
  });
});

describe("candidateSeasons", () => {
  it("tries the season in progress first and rolls over on March 1 in UTC", () => {
    expect(candidateSeasons(new Date("2026-10-26T12:00:00.000Z"))).toEqual([2026, 2025]);
    expect(candidateSeasons(new Date("2027-02-28T23:59:59.000Z"))).toEqual([2026, 2025]);
    expect(candidateSeasons(new Date("2027-03-01T00:00:00.000Z"))).toEqual([2027, 2026]);
  });
});

describe("fetchFirstUsableSeason", () => {
  beforeEach(() => {
    fetchBoard.mockReset();
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const board = (entryCount: number, season: number) =>
    ({ ...record(entryCount, season), scoringFormat: "PPR" }) as unknown as Awaited<
      ReturnType<typeof fetchFantasyGameLogBoard>
    >;

  it("takes the current season once it clears the floor and asks for nothing older", async () => {
    fetchBoard.mockResolvedValueOnce(board(MIN_GAME_LOG_ENTRIES, 2026));

    await expect(fetchFirstUsableSeason("PPR", [2026, 2025])).resolves.toMatchObject({ season: 2026 });
    expect(fetchBoard.mock.calls).toEqual([["PPR", 2026]]);
  });

  it("falls to the completed prior season when the current one is under the floor", async () => {
    fetchBoard
      .mockResolvedValueOnce(board(MIN_GAME_LOG_ENTRIES - 1, 2026))
      .mockResolvedValueOnce(board(350, 2025));

    const result = await fetchFirstUsableSeason("PPR", [2026, 2025]);
    expect(result).toMatchObject({ season: 2025, throughWeek: 18 });
    expect(result?.entries).toHaveLength(350);
    expect(fetchBoard.mock.calls).toEqual([["PPR", 2026], ["PPR", 2025]]);
  });

  it("falls to the prior season when the current season's file is missing", async () => {
    fetchBoard
      .mockRejectedValueOnce(new Error("HTTP 404"))
      .mockResolvedValueOnce(board(350, 2025));

    await expect(fetchFirstUsableSeason("PPR", [2026, 2025])).resolves.toMatchObject({ season: 2025 });
  });

  it("returns nothing when no season is usable", async () => {
    fetchBoard
      .mockRejectedValueOnce(new Error("HTTP 404"))
      .mockResolvedValueOnce(board(12, 2025));

    await expect(fetchFirstUsableSeason("PPR", [2026, 2025])).resolves.toBeNull();
  });
});
