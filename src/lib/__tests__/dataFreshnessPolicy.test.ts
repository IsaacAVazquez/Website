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

  const HOUR_MS = 60 * 60 * 1000;
  const DAY_MS = 24 * HOUR_MS;
  const LIVE_TARGET_MS = 20 * HOUR_MS;
  const maxAgeOf =
    (surface: Parameters<typeof getDataFreshnessPolicy>[0]) => (iso: string) =>
      getDataFreshnessPolicy(surface, new Date(iso)).maxAgeMs;

  it("keeps the NBA in-season window aligned to the refresh schedule", () => {
    const maxAge = maxAgeOf("nba");

    // The cron is "20 */4 15-31 10 *", so nothing refreshes NBA before October
    // 15. A whole-month range declared an in-season target from October 1 and
    // left the surface reporting stale-fallback for two weeks with no job able
    // to clear it and no failure issue, because no run fired.
    expect(maxAge("2026-10-01T12:00:00Z")).toBeGreaterThan(24 * HOUR_MS);
    expect(maxAge("2026-10-14T23:59:59Z")).toBeGreaterThan(24 * HOUR_MS);
    expect(maxAge("2026-10-15T00:00:00Z")).toBe(LIVE_TARGET_MS);
    expect(maxAge("2026-10-31T12:00:00Z")).toBe(LIVE_TARGET_MS);

    // November through June is in-season, July through September is not.
    expect(maxAge("2026-11-15T12:00:00Z")).toBe(LIVE_TARGET_MS);
    expect(maxAge("2026-01-15T12:00:00Z")).toBe(LIVE_TARGET_MS);
    expect(maxAge("2026-06-15T12:00:00Z")).toBe(LIVE_TARGET_MS);
    expect(maxAge("2026-08-15T12:00:00Z")).toBeGreaterThan(24 * HOUR_MS);
  });

  it("leaves a live lane room for a dropped run and a slow publish", () => {
    // Measured in September 2026: a 10.1 hour gap between Premier League
    // refreshes and a 9.5 hour publish gap. The old targets were 4 and 8 hours.
    for (const surface of ["premier-league", "la-liga", "mlb", "bay-area-transit"] as const) {
      expect(maxAgeOf(surface)("2026-09-15T12:00:00Z")).toBeGreaterThanOrEqual(19.6 * HOUR_MS);
    }
  });

  it("opens the MLB window after Opening Day and closes it after the World Series", () => {
    const maxAge = maxAgeOf("mlb");

    // The API returns no standings until the first game, so the builder keeps
    // last season's file through March.
    expect(maxAge("2027-03-10T12:00:00Z")).toBeGreaterThan(30 * DAY_MS);
    expect(maxAge("2027-03-26T12:00:00Z")).toBeGreaterThan(30 * DAY_MS);
    expect(maxAge("2027-04-05T00:00:00Z")).toBe(LIVE_TARGET_MS);
    expect(maxAge("2026-10-28T12:00:00Z")).toBe(LIVE_TARGET_MS);
    expect(maxAge("2026-11-06T12:00:00Z")).toBe(LIVE_TARGET_MS);
    expect(maxAge("2026-11-20T12:00:00Z")).toBeGreaterThan(30 * DAY_MS);
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

    expect(weekend.maxAgeMs).toBe(LIVE_TARGET_MS);
    expect(weekday.maxAgeMs).toBeGreaterThan(weekend.maxAgeMs);
  });

  it("tightens Formula 1 on Thursday when the three-hour schedule begins", () => {
    expect(maxAgeOf("formula-1")("2026-07-16T12:00:00Z")).toBe(LIVE_TARGET_MS);
  });

  it("treats the finished World Cup as an archive in every month", () => {
    const maxAge = maxAgeOf("world-cup");

    // The old rule asked for a refresh inside 90 minutes every June and July
    // and went stale for good 45 days after the final.
    expect(maxAge("2026-09-27T12:00:00Z")).toBeGreaterThan(10 * 365 * DAY_MS);
    expect(maxAge("2027-06-20T12:00:00Z")).toBeGreaterThan(10 * 365 * DAY_MS);
  });

  it("measures the fantasy draft board daily until the opener and not while it is frozen", () => {
    const maxAge = maxAgeOf("fantasy-football");

    // Week 1 of 2026 opened Wednesday September 9, and FantasyPros last moved
    // its draft board on September 10.
    expect(maxAge("2026-08-20T12:00:00Z")).toBe(36 * HOUR_MS);
    expect(maxAge("2026-09-08T23:59:59Z")).toBe(36 * HOUR_MS);
    expect(maxAge("2026-09-09T00:00:00Z")).toBe(200 * DAY_MS);
    expect(maxAge("2026-09-27T12:00:00Z")).toBe(200 * DAY_MS);
    expect(maxAge("2027-01-15T12:00:00Z")).toBe(200 * DAY_MS);

    // The frozen window closes in late March, and the weekly spring lane takes over.
    expect(maxAge("2027-04-15T12:00:00Z")).toBe(10 * DAY_MS);
    expect(maxAge("2027-07-02T12:00:00Z")).toBe(36 * HOUR_MS);
  });

  it("catches a broken NFL lane within three days in season", () => {
    const maxAge = maxAgeOf("nfl");

    expect(maxAge("2026-10-15T12:00:00Z")).toBe(3 * DAY_MS);
    expect(maxAge("2027-02-10T12:00:00Z")).toBe(3 * DAY_MS);
    expect(maxAge("2027-05-10T12:00:00Z")).toBeGreaterThan(30 * DAY_MS);
  });
});
