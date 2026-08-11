import { buildRefreshManifest } from "../verifyDataRefresh";
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
