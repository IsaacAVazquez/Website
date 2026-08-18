import {
  DATA_SURFACE_IDS,
  getDataFreshnessPolicy,
} from "@/lib/dataFreshnessPolicy";

describe("data freshness policies", () => {
  it("registers every surface exactly once", () => {
    expect(new Set(DATA_SURFACE_IDS).size).toBe(DATA_SURFACE_IDS.length);
    expect(DATA_SURFACE_IDS).toContain("fantasy-football");
    expect(DATA_SURFACE_IDS).toContain("polling");
    expect(DATA_SURFACE_IDS).toContain("score-pools");
    expect(DATA_SURFACE_IDS).toEqual(
      expect.arrayContaining([
        "ai-dev-tools",
        "museum-log",
        "travel-deals",
        "food-map",
      ])
    );
  });

  it("keeps the NBA in-season window aligned to the refresh schedule", () => {
    const HOUR_MS = 60 * 60 * 1000;
    const maxAge = (iso: string) =>
      getDataFreshnessPolicy("nba", new Date(iso)).maxAgeMs;

    // The cron is "20 */4 15-31 10 *", so nothing refreshes NBA before October
    // 15. A whole-month range declared an 8-hour target from October 1 and left
    // the surface reporting stale-fallback for two weeks with no job able to
    // clear it and no failure issue, because no run fired.
    expect(maxAge("2026-10-01T12:00:00Z")).toBeGreaterThan(24 * HOUR_MS);
    expect(maxAge("2026-10-14T23:59:59Z")).toBeGreaterThan(24 * HOUR_MS);
    expect(maxAge("2026-10-15T00:00:00Z")).toBe(8 * HOUR_MS);
    expect(maxAge("2026-10-31T12:00:00Z")).toBe(8 * HOUR_MS);

    // The rest of the season is unchanged: November through June is in-season,
    // July through September is not.
    expect(maxAge("2026-11-15T12:00:00Z")).toBe(8 * HOUR_MS);
    expect(maxAge("2026-01-15T12:00:00Z")).toBe(8 * HOUR_MS);
    expect(maxAge("2026-06-15T12:00:00Z")).toBe(8 * HOUR_MS);
    expect(maxAge("2026-08-15T12:00:00Z")).toBeGreaterThan(24 * HOUR_MS);
  });

  it("uses tighter seasonal windows when a competition is active", () => {
    const active = getDataFreshnessPolicy(
      "premier-league",
      new Date("2026-09-01T00:00:00Z")
    );
    const offseason = getDataFreshnessPolicy(
      "premier-league",
      new Date("2026-07-01T00:00:00Z")
    );

    expect(active.maxAgeMs).toBeLessThan(offseason.maxAgeMs);
  });

  it("marks curated datasets with a distinct source", () => {
    expect(getDataFreshnessPolicy("frontier-models").source).toBe(
      "curated-snapshot"
    );
  });

  it("tightens live-event surfaces on tournament weekends", () => {
    const weekend = getDataFreshnessPolicy(
      "golf",
      new Date("2026-07-19T12:00:00Z")
    );
    const weekday = getDataFreshnessPolicy(
      "golf",
      new Date("2026-07-20T12:00:00Z")
    );

    expect(weekend.maxAgeMs).toBe(4 * 60 * 60 * 1000);
    expect(weekday.maxAgeMs).toBeGreaterThan(weekend.maxAgeMs);
  });

  it("tightens Formula 1 on Thursday when the three-hour schedule begins", () => {
    expect(
      getDataFreshnessPolicy(
        "formula-1",
        new Date("2026-07-16T12:00:00Z")
      ).maxAgeMs
    ).toBe(4 * 60 * 60 * 1000);
  });

  it("requires a World Cup refresh inside ninety minutes during the event", () => {
    expect(
      getDataFreshnessPolicy(
        "world-cup",
        new Date("2026-07-19T12:00:00Z")
      ).maxAgeMs
    ).toBe(90 * 60 * 1000);
  });
});
