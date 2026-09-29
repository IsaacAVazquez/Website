/**
 * @jest-environment node
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  FANTASY_PROS_PUBLIC_SOURCE,
  type FantasyProsPublicBoard,
} from "@/lib/fantasyProsPublicSource";
import {
  fantasyProsWeeklyPageForUrl,
  type FantasyProsWeeklyPageOverrides,
} from "@/lib/__tests__/fixtures/fantasyProsWeeklyPages.fixture";
import { buildFantasyWeeklySnapshot, toSource } from "../buildFantasyWeeklySnapshot";

function board(overrides: Partial<FantasyProsPublicBoard> = {}): FantasyProsPublicBoard {
  return {
    sourceLabel: FANTASY_PROS_PUBLIC_SOURCE,
    sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-flex.php",
    upstreamUpdatedAt: "2026-09-10T19:26:46.000Z",
    totalExperts: 157,
    requestedPosition: "FLEX",
    players: [{ id: "1" }, { id: "2" }],
    ...overrides,
  } as unknown as FantasyProsPublicBoard;
}

describe("buildFantasyWeeklySnapshot toSource", () => {
  it("labels the flex board by the page that was requested rather than the parser's cheat-sheet prose", () => {
    const source = toSource(board());
    expect(source.provider).toBe("FantasyPros weekly flex board");
    expect(source.provider).not.toMatch(/derived locally/);
    expect(source).toMatchObject({
      url: "https://www.fantasypros.com/nfl/rankings/ppr-flex.php",
      asOf: "2026-09-10T19:26:46.000Z",
      expertCount: 157,
      playerCount: 2,
    });
  });

  it("labels the quarterback board separately", () => {
    expect(
      toSource(
        board({
          requestedPosition: "QB",
          sourceUrl: "https://www.fantasypros.com/nfl/rankings/qb.php",
        })
      ).provider
    ).toBe("FantasyPros weekly quarterback board");
  });

  it("refuses a board it was not written for", () => {
    expect(() => toSource(board({ requestedPosition: "OVERALL" }))).toThrow(
      /neither the flex nor the quarterback page/
    );
    expect(() => toSource(board({ sourceLabel: "Somebody else" }))).toThrow(
      /unknown source label/
    );
  });
});

// Sunday of Week 3, 2026, the afternoon the fixture pages were saved.
const NOW = new Date("2026-09-27T19:45:00.000Z");
const QB_URL = "https://www.fantasypros.com/nfl/rankings/qb.php";
const FLEX_URLS = [
  "https://www.fantasypros.com/nfl/rankings/ppr-flex.php",
  "https://www.fantasypros.com/nfl/rankings/half-point-ppr-flex.php",
  "https://www.fantasypros.com/nfl/rankings/flex.php",
];

function hoursBefore(now: Date, hours: number): number {
  return Math.floor(now.getTime() / 1000) - hours * 3600;
}

function pageResponse(html: string): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    text: async () => html,
  } as Response;
}

function failedResponse(status: number): Response {
  return {
    ok: false,
    status,
    headers: new Headers(),
    text: async () => "",
  } as Response;
}

describe("buildFantasyWeeklySnapshot", () => {
  const originalFetch = global.fetch;
  const tempDirs: string[] = [];
  let fetchMock: jest.Mock;

  /** Serves every FantasyPros page, with per-URL changes to what it says. */
  function serve(
    overridesFor: (url: string) => FantasyProsWeeklyPageOverrides = () => ({})
  ) {
    fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      return pageResponse(fantasyProsWeeklyPageForUrl(url, overridesFor(url)));
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  }

  function requestedUrls(): string[] {
    return fetchMock.mock.calls.map(([input]) => String(input));
  }

  async function emptyOutput(): Promise<string> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "fantasy-weekly-"));
    tempDirs.push(dir);
    return path.join(dir, "weekly.json");
  }

  /** A board already published for Week 3, the state every daily run starts from. */
  async function publishedOutput(): Promise<{ target: string; committed: string }> {
    const target = await emptyOutput();
    serve();
    await buildFantasyWeeklySnapshot(NOW, target);
    return { target, committed: await fs.readFile(target, "utf8") };
  }

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  afterAll(async () => {
    await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  });

  it("publishes the week FantasyPros is serving from four pages", async () => {
    const target = await emptyOutput();
    serve();

    await buildFantasyWeeklySnapshot(NOW, target);

    // One quarterback page and three flex pages. The rest-of-season pages are
    // live, but nothing publishes them, so the builder does not request one.
    expect(requestedUrls()).toEqual([QB_URL, ...FLEX_URLS]);
    const written = JSON.parse(await fs.readFile(target, "utf8"));
    expect(written).toMatchObject({ season: 2026, week: 3 });
    expect(written.boards.ppr.flex).toHaveLength(406);
    expect(written.boards.half_ppr.flex).toHaveLength(402);
    expect(written.boards.standard.flex).toHaveLength(400);
    expect(written.boards.ppr.quarterbacks).toHaveLength(64);
    expect(written.boards.ppr.flexSource).toMatchObject({
      asOf: "2026-09-27T16:59:38.000Z",
      expertCount: 43,
    });
    expect(written.boards.ppr.flex[0]).toMatchObject({
      name: "Jahmyr Gibbs",
      opponent: "vs. NYJ",
      ownership: 99.9,
    });
  });

  it("retries a page that fails once and then publishes", async () => {
    const target = await emptyOutput();
    serve();
    const healthy = fetchMock.getMockImplementation()!;
    let quarterbackRequests = 0;
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === QB_URL && (quarterbackRequests += 1) === 1) {
        return failedResponse(503);
      }
      return healthy(input);
    });

    jest.useFakeTimers();
    let settled = false;
    const run = buildFantasyWeeklySnapshot(NOW, target).finally(() => {
      settled = true;
    });
    while (!settled) {
      await jest.advanceTimersByTimeAsync(1_000);
    }
    await run;

    expect(requestedUrls()).toEqual([QB_URL, QB_URL, ...FLEX_URLS]);
    expect(JSON.parse(await fs.readFile(target, "utf8")).week).toBe(3);
  });

  it("refuses a quarterback page that is a week behind the flex pages", async () => {
    const { target, committed } = await publishedOutput();
    serve((url) => (url === QB_URL ? { week: 2 } : {}));

    await expect(buildFantasyWeeklySnapshot(NOW, target)).rejects.toThrow(
      /week 3 for the ppr flex board and week 2 for quarterbacks/
    );
    expect(await fs.readFile(target, "utf8")).toBe(committed);
  });

  it("refuses a board FantasyPros last updated more than 72 hours ago", async () => {
    const { target, committed } = await publishedOutput();
    serve(() => ({ lastUpdatedTs: hoursBefore(NOW, 73) }));

    await expect(buildFantasyWeeklySnapshot(NOW, target)).rejects.toThrow(
      /quarterback board 73\.0 hours ago/
    );
    // The quarterback page is read first, so a stalled source costs one request.
    expect(requestedUrls()).toEqual([QB_URL]);
    expect(await fs.readFile(target, "utf8")).toBe(committed);
  });

  it("refuses the run when only one flex page has stalled", async () => {
    const { target, committed } = await publishedOutput();
    serve((url) => (url === FLEX_URLS[1] ? { lastUpdatedTs: hoursBefore(NOW, 100) } : {}));

    await expect(buildFantasyWeeklySnapshot(NOW, target)).rejects.toThrow(
      /half_ppr flex board 100\.0 hours ago/
    );
    expect(await fs.readFile(target, "utf8")).toBe(committed);
  });

  it("publishes a board updated 71 hours ago", async () => {
    const target = await emptyOutput();
    serve(() => ({ lastUpdatedTs: hoursBefore(NOW, 71) }));

    await buildFantasyWeeklySnapshot(NOW, target);

    expect(JSON.parse(await fs.readFile(target, "utf8")).week).toBe(3);
  });

  it("refuses a page more than one week behind the calendar", async () => {
    const { target, committed } = await publishedOutput();
    // Freshly updated, so only the week number gives the stall away.
    serve(() => ({ week: 1, lastUpdatedTs: hoursBefore(NOW, 3) }));

    await expect(buildFantasyWeeklySnapshot(NOW, target)).rejects.toThrow(
      /week 1 for the quarterback board while the calendar is in week 3/
    );
    expect(await fs.readFile(target, "utf8")).toBe(committed);
  });

  // The calendar turns on Wednesday and the page turns on its own schedule,
  // so for a day either side of the turn they disagree by one.
  it.each([
    ["one week behind", 2],
    ["one week ahead", 4],
  ])("publishes a page that is %s of the calendar", async (_label, week) => {
    const target = await emptyOutput();
    serve(() => ({ week, lastUpdatedTs: hoursBefore(NOW, 3) }));

    await buildFantasyWeeklySnapshot(NOW, target);

    expect(JSON.parse(await fs.readFile(target, "utf8")).week).toBe(week);
  });

  it("builds nothing before Week 1", async () => {
    const { target, committed } = await publishedOutput();
    serve();

    await buildFantasyWeeklySnapshot(new Date("2026-08-30T17:00:00.000Z"), target);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await fs.readFile(target, "utf8")).toBe(committed);
  });

  it("still builds the Week 18 board six days after it opened", async () => {
    const target = await emptyOutput();
    const now = new Date("2027-01-12T17:00:00.000Z");
    serve(() => ({ week: 18, lastUpdatedTs: hoursBefore(now, 3) }));

    await buildFantasyWeeklySnapshot(now, target);

    expect(JSON.parse(await fs.readFile(target, "utf8"))).toMatchObject({
      season: 2026,
      week: 18,
    });
  });

  it("stops building once Week 18 has been open for more than 7 days", async () => {
    const { target, committed } = await publishedOutput();
    const now = new Date("2027-01-13T17:00:00.000Z");
    // What the page does after the regular season: it rolls past Week 18,
    // which the parser rejects, so a run that fetched would fail all winter.
    serve(() => ({ week: 19, lastUpdatedTs: hoursBefore(now, 3) }));

    await buildFantasyWeeklySnapshot(now, target);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await fs.readFile(target, "utf8")).toBe(committed);
  });
});
