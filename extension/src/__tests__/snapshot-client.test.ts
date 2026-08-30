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

  it("loads a normalized redraft board with separate ranking and market provenance", async () => {
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
      kind: "redraft",
      filename: "ppr.json",
      source: "published",
    });
    if (result.snapshot.kind !== "redraft") {
      throw new Error("Expected a redraft companion snapshot.");
    }
    expect(result.snapshot.data).toMatchObject({
      season: 2026,
      scoringFormat: "PPR",
      upstreamUpdatedAt: published.upstreamUpdatedAt,
      adpSource: published.adpSource,
    });
    expect(result.snapshot.data.sliceMetadata.overall).toMatchObject({
      available: true,
      updatedAt: published.upstreamUpdatedAt,
    });
    expect(result.snapshot.data.overall.length).toBeGreaterThan(500);
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
    expect(result.liveError).toContain("does not match requested PPR");
  });

  it("preserves each best ball source instead of collapsing them into one date", async () => {
    const published = readSnapshot("best-ball.json");
    jest.mocked(globalThis.fetch).mockResolvedValue(response(published) as Response);

    const result = await loadCompanionSnapshot(
      createBestBallRoomConfig({ season: 2026, contestId: "bbm-vii" })
    );

    expect(result.snapshot).toMatchObject({
      kind: "best-ball",
      filename: "best-ball.json",
      source: "published",
    });
    if (result.snapshot.kind !== "best-ball") {
      throw new Error("Expected a best ball companion snapshot.");
    }
    expect(result.snapshot.data.rankingSource).toEqual(published.rankingSource);
    expect(result.snapshot.data.superflexSource).toEqual(published.superflexSource);
    expect(result.snapshot.data.adpSource).toEqual(published.adpSource);
    expect(result.snapshot.data.scheduleSource).toEqual(published.scheduleSource);
    expect(Object.keys(result.snapshot.data.week17Opponents).length).toBeGreaterThanOrEqual(30);
  });

  it("keeps a usable best ball board when schedule guidance is unavailable", async () => {
    const published = readSnapshot("best-ball.json");
    jest.mocked(globalThis.fetch).mockResolvedValue(
      response({
        ...published,
        scheduleSource: null,
        week17Opponents: {},
      }) as Response
    );

    const result = await loadCompanionSnapshot(
      createBestBallRoomConfig({ season: 2026, contestId: "bbm-vii" })
    );

    expect(result.liveError).toBeNull();
    expect(result.snapshot.source).toBe("published");
    if (result.snapshot.kind !== "best-ball") {
      throw new Error("Expected a best ball companion snapshot.");
    }
    expect(result.snapshot.data.players.length).toBeGreaterThan(300);
    expect(result.snapshot.data.scheduleSource).toBeNull();
    expect(result.snapshot.data.week17Opponents).toEqual({});
  });

  it("writes and restores version 2 cache records", async () => {
    const published = readSnapshot("ppr.json");
    const fetchMock = jest.mocked(globalThis.fetch);
    fetchMock
      .mockResolvedValueOnce(response(published) as Response)
      .mockRejectedValueOnce(new Error("offline"));
    const room = createRedraftRoomConfig({ season: 2026, scoring: "PPR" });

    const first = await loadCompanionSnapshot(room);
    const savedRaw = window.localStorage.getItem(
      "fantasy-companion-snapshot-v2-ppr.json"
    );
    const second = await loadCompanionSnapshot(room);

    expect(first.snapshot.source).toBe("published");
    expect(JSON.parse(savedRaw ?? "null")).toMatchObject({
      version: 2,
      filename: "ppr.json",
      kind: "redraft",
      data: {
        season: 2026,
        scoringFormat: "PPR",
      },
    });
    expect(second.snapshot.source).toBe("saved");
    expect(second.liveError).toContain("offline");
    if (second.snapshot.kind !== "redraft") {
      throw new Error("Expected a redraft companion snapshot.");
    }
    expect(second.snapshot.data.adpSource).toEqual(published.adpSource);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("ignores legacy cache records and falls back to the packaged board", async () => {
    const published = readSnapshot("ppr.json");
    window.localStorage.setItem(
      "fantasy-companion-snapshot-v2-ppr.json",
      JSON.stringify({
        version: 1,
        filename: "ppr.json",
        kind: "redraft",
        data: published,
      })
    );
    const fetchMock = jest.mocked(globalThis.fetch);
    fetchMock
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(response(published) as Response);

    const result = await loadCompanionSnapshot(
      createRedraftRoomConfig({ season: 2026, scoring: "PPR" })
    );

    expect(result.snapshot.source).toBe("bundled");
    expect(result.liveError).toContain("offline");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/data/fantasy/ppr.json",
      expect.objectContaining({ cache: "no-store" })
    );
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
