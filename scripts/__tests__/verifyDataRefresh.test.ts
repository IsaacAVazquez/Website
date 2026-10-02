import { buildRefreshManifest, findShortfalls } from "../verifyDataRefresh";
import { DATA_REFRESH_ARTIFACTS } from "../dataRefreshRegistry";
import { readGeneratedSnapshot } from "../snapshotFallback";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("data refresh manifests", () => {
  it("describes a registered artifact with revision and freshness metadata", async () => {
    const probe = await buildRefreshManifest("formula-1");
    expect(probe.sourceAsOf).toBeTruthy();
    const sourceTime = Date.parse(probe.sourceAsOf as string);
    const manifest = await buildRefreshManifest(
      "formula-1",
      new Date(sourceTime + 60_000)
    );

    expect(manifest.surface).toBe("formula-1");
    expect(manifest.revision).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.sourceAsOf).toBeTruthy();
    expect(manifest.outcome).toBe("fresh");
  });

  it("detects an old artifact as a stale fallback", async () => {
    const probe = await buildRefreshManifest("formula-1");
    const sourceTime = Date.parse(probe.sourceAsOf as string);
    const manifest = await buildRefreshManifest("formula-1", new Date(sourceTime + 7 * 24 * 60 * 60 * 1000));

    expect(manifest.outcome).toBe("stale-fallback");
  });

  it.each(["mlb", "nba", "la-liga"] as const)(
    "uses a full-precision generation timestamp for %s",
    async (surface) => {
      const probe = await buildRefreshManifest(surface);
      expect(probe.sourceAsOf).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      const sourceTime = Date.parse(probe.sourceAsOf as string);
      const fresh = await buildRefreshManifest(
        surface,
        new Date(sourceTime + 7 * 60 * 60 * 1000)
      );
      const stale = await buildRefreshManifest(
        surface,
        new Date(sourceTime + 400 * 24 * 60 * 60 * 1000)
      );

      expect(fresh.outcome).toBe("fresh");
      expect(fresh.ageSeconds).toBe(7 * 60 * 60);
      expect(stale.outcome).toBe("stale-fallback");
    }
  );

  it("measures fantasy freshness from the upstream rankings timestamp", async () => {
    const snapshot = JSON.parse(
      readFileSync(
        join(process.cwd(), "public", "data", "fantasy", "ppr.json"),
        "utf8"
      )
    ) as { generatedAt: string; upstreamUpdatedAt: string };
    const manifest = await buildRefreshManifest("fantasy-football");

    expect(snapshot.upstreamUpdatedAt).not.toBe(snapshot.generatedAt);
    expect(manifest.sourceAsOf).toBe(snapshot.upstreamUpdatedAt);
  });
});

describe("snapshot quality minimums", () => {
  const gated = Object.values(DATA_REFRESH_ARTIFACTS).filter(
    (artifact) => artifact?.minimums
  );

  it("gates the ten surfaces whose workflow checks were only counts", () => {
    expect(gated.map((artifact) => artifact!.surface).sort()).toEqual(
      ["bay-area-transit", "earthquake", "github-trending", "golf", "la-liga", "mlb", "nba", "nfl", "premier-league", "world-cup"]
    );
  });

  // The committed snapshots shipped through the old inline gates, so each one
  // has to clear the same minimums here. A misspelled path counts as zero and
  // fails this.
  it.each(gated.map((artifact) => [artifact!.surface, artifact!] as const))(
    "passes the committed %s snapshot",
    (_surface, artifact) => {
      const payload = readGeneratedSnapshot(artifact.artifactPath, artifact.exportName!);
      expect(findShortfalls(payload, artifact.minimums)).toEqual([]);
    }
  );

  it("names each count under its minimum and sums joined paths", () => {
    const payload = { a: [1], b: { c: "xy", d: { e: 1 } }, n: Number.NaN };
    expect(findShortfalls(payload, { a: 1, "b.c": 3, "a+b.d": 2, n: 1, missing: 1 })).toEqual([
      "b.c: 2 < 3",
      "n: 0 < 1",
      "missing: 0 < 1",
    ]);
  });
});
