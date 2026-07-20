import { buildRefreshManifest } from "../verifyDataRefresh";

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
});
