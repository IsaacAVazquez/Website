import { readFileSync } from "node:fs";
import path from "node:path";

import {
  createBestBallRoomConfig,
  createRedraftRoomConfig,
} from "@/lib/fantasyCompanion";
import { loadCompanionSnapshot } from "../snapshot-client";

function readSnapshot(filename: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(
      path.join(process.cwd(), "public", "data", "fantasy", filename),
      "utf8"
    )
  ) as Record<string, unknown>;
}

function response(body: unknown, status = 200): Pick<Response, "json" | "ok" | "status"> {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("fantasy companion snapshot client", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "fetch");
  });

  it("loads the matching published redraft board and reports source freshness", async () => {
    const published = readSnapshot("ppr.json");
    const fetchMock = jest.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue(response(published) as Response);

    const result = await loadCompanionSnapshot(
      createRedraftRoomConfig({ season: 2026, scoring: "PPR" })
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://isaacvazquez.com/data/fantasy/ppr.json",
      expect.objectContaining({ cache: "no-store" })
    );
    expect(result.liveError).toBeNull();
    expect(result.snapshot).toMatchObject({
      season: 2026,
      source: "published",
      sourceUpdatedAt: published.upstreamUpdatedAt,
    });
    expect(result.snapshot.players.length).toBeGreaterThan(500);
  });

  it("rejects a scoring mismatch and falls back to the packaged board", async () => {
    const published = readSnapshot("ppr.json");
    const wrongScoring = { ...published, scoringFormat: "STANDARD" };
    const fetchMock = jest.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(response(wrongScoring) as Response)
      .mockResolvedValueOnce(response(published) as Response);

    const result = await loadCompanionSnapshot(
      createRedraftRoomConfig({ season: 2026, scoring: "PPR" })
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/data/fantasy/ppr.json",
      expect.objectContaining({ cache: "no-store" })
    );
    expect(result.snapshot.source).toBe("bundled");
    expect(result.liveError).toContain("wrong scoring format");
  });

  it("uses the older ranking or ADP date for best ball guidance", async () => {
    const published = readSnapshot("best-ball.json");
    const rankingAsOf = (published.rankingSource as { asOf: string }).asOf;
    const adpAsOf = (published.adpSource as { asOf: string }).asOf;
    jest.mocked(globalThis.fetch).mockResolvedValue(response(published) as Response);

    const result = await loadCompanionSnapshot(
      createBestBallRoomConfig({ season: 2026, contestId: "bbm-vii" })
    );

    expect(result.snapshot.sourceUpdatedAt).toBe(
      new Date(Math.min(Date.parse(rankingAsOf), Date.parse(adpAsOf))).toISOString()
    );
    expect(Object.keys(result.snapshot.week17Opponents).length).toBeGreaterThanOrEqual(30);
  });

  it("falls back to the packaged board when the storage read rejects", async () => {
    const published = readSnapshot("ppr.json");
    const fetchMock = jest.mocked(globalThis.fetch);
    fetchMock
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(response(published) as Response);
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        storage: {
          local: {
            get: jest.fn().mockRejectedValue(new Error("storage IO failure")),
            set: jest.fn().mockRejectedValue(new Error("storage IO failure")),
          },
        },
      },
    });

    try {
      const result = await loadCompanionSnapshot(
        createRedraftRoomConfig({ season: 2026, scoring: "PPR" })
      );

      expect(result.snapshot.source).toBe("bundled");
      expect(result.liveError).toContain("offline");
    } finally {
      Reflect.deleteProperty(globalThis, "chrome");
    }
  });

  it("still serves a validated live fetch when the cache write fails", async () => {
    const published = readSnapshot("ppr.json");
    jest.mocked(globalThis.fetch).mockResolvedValue(response(published) as Response);
    Object.defineProperty(globalThis, "chrome", {
      configurable: true,
      value: {
        storage: {
          local: {
            get: jest.fn().mockResolvedValue({}),
            set: jest.fn().mockRejectedValue(new Error("quota exceeded")),
          },
        },
      },
    });

    try {
      const result = await loadCompanionSnapshot(
        createRedraftRoomConfig({ season: 2026, scoring: "PPR" })
      );

      expect(result.snapshot.source).toBe("published");
      expect(result.liveError).toBeNull();
    } finally {
      Reflect.deleteProperty(globalThis, "chrome");
    }
  });
});
