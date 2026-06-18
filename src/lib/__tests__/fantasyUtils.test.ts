import {
  getFantasyAdpFreshness,
  getSnapshotStaleness,
  getSnapshotStalenessLabel,
} from "@/lib/fantasyUtils";

const MS_PER_DAY = 86_400_000;

describe("getSnapshotStaleness", () => {
  it("buckets a recent date as fresh", () => {
    const recent = new Date(Date.now() - 1 * MS_PER_DAY).toISOString();
    expect(getSnapshotStaleness(recent)).toBe("fresh");
  });

  it("buckets an 8-14 day old date as aging", () => {
    const aging = new Date(Date.now() - 10 * MS_PER_DAY).toISOString();
    expect(getSnapshotStaleness(aging)).toBe("aging");
  });

  it("buckets a date older than two weeks as stale", () => {
    const stale = new Date(Date.now() - 30 * MS_PER_DAY).toISOString();
    expect(getSnapshotStaleness(stale)).toBe("stale");
  });

  it("treats a missing or invalid date as stale rather than fresh", () => {
    expect(getSnapshotStaleness(null)).toBe("stale");
    expect(getSnapshotStaleness(undefined)).toBe("stale");
    expect(getSnapshotStaleness("not-a-date")).toBe("stale");
  });
});

describe("getSnapshotStalenessLabel", () => {
  it("maps each band to a short label", () => {
    expect(getSnapshotStalenessLabel("fresh")).toBe("Current");
    expect(getSnapshotStalenessLabel("aging")).toBe("Aging");
    expect(getSnapshotStalenessLabel("stale")).toBe("Stale");
  });
});

describe("getFantasyAdpFreshness", () => {
  it("flags ADP from a calendar year before the snapshot season as prior-season", () => {
    expect(getFantasyAdpFreshness("2025-09-10T00:00:00.000Z", 2026)).toBe("prior-season");
  });

  it("treats same-season ADP as current", () => {
    expect(getFantasyAdpFreshness("2026-07-01T00:00:00.000Z", 2026)).toBe("current");
  });

  it("does not flag ADP dated after the season starts", () => {
    expect(getFantasyAdpFreshness("2027-01-02T00:00:00.000Z", 2026)).toBe("current");
  });

  it("returns current when there is nothing to compare against", () => {
    expect(getFantasyAdpFreshness(null, 2026)).toBe("current");
    expect(getFantasyAdpFreshness("2025-09-10T00:00:00.000Z", null)).toBe("current");
    expect(getFantasyAdpFreshness("2025-09-10T00:00:00.000Z", undefined)).toBe("current");
    expect(getFantasyAdpFreshness("not-a-date", 2026)).toBe("current");
  });
});
