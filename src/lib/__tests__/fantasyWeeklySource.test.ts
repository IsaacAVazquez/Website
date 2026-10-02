/**
 * @jest-environment node
 */
import {
  fetchWeeklyFlexBoard,
  fetchWeeklyQuarterbackBoard,
} from "@/lib/fantasyWeeklySource";
import { fantasyProsWeeklyPageForUrl } from "./fixtures/fantasyProsWeeklyPages.fixture";

describe("fantasyWeeklySource", () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, "fetch").mockImplementation(
      async (input) =>
        ({
          ok: true,
          status: 200,
          headers: new Headers(),
          text: async () => fantasyProsWeeklyPageForUrl(String(input)),
        }) as Response
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reads the weekly flex page as its own board", async () => {
    const board = await fetchWeeklyFlexBoard("PPR", 2026);

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://www.fantasypros.com/nfl/rankings/ppr-flex.php"
    );
    expect(board).toMatchObject({
      requestedPosition: "FLEX",
      sourcePosition: "FLX",
      season: 2026,
      week: 3,
      totalExperts: 43,
      upstreamUpdatedAt: "2026-09-27T16:59:38.000Z",
    });
    expect(board.players).toHaveLength(406);
  });

  it("gives each weekly page request 20 seconds before it aborts", async () => {
    const timeout = jest.spyOn(AbortSignal, "timeout");

    await fetchWeeklyQuarterbackBoard(2026);
    await fetchWeeklyFlexBoard("HALF_PPR", 2026);

    expect(timeout.mock.calls).toEqual([[20_000], [20_000]]);
    expect(fetchMock.mock.calls.map(([, init]) => init?.signal)).toEqual(
      timeout.mock.results.map((result) => result.value)
    );
  });
});
