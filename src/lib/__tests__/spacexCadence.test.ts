import { aggregateLaunchCadence } from "@/lib/spacexCadence";

describe("aggregateLaunchCadence", () => {
  it("buckets dates into trailing months, oldest first / newest last, zero-filled", () => {
    const referenceMs = Date.parse("2026-07-05T00:00:00.000Z");
    const dates = [
      "2026-07-01T00:00:00.000Z",
      "2026-07-03T00:00:00.000Z",
      "2026-06-15T00:00:00.000Z",
      "2025-08-01T00:00:00.000Z", // the oldest month still inside a trailing-12-month window
    ];

    const cadence = aggregateLaunchCadence(dates, referenceMs, 12);

    expect(cadence.points).toHaveLength(12);
    expect(cadence.points[0]?.monthKey).toBe("2025-08");
    expect(cadence.points[11]?.monthKey).toBe("2026-07");
    expect(cadence.points[11]?.count).toBe(2);
    expect(cadence.points.find((p) => p.monthKey === "2026-06")?.count).toBe(1);
    // The 2025-08-01 date falls exactly on the oldest bucket boundary, so it
    // IS counted (12 months back from July 2026 is August 2025).
    expect(cadence.points[0]?.count).toBe(1);
    expect(cadence.rangeLabel).toBe(`${cadence.points[0]?.label} – ${cadence.points[11]?.label}`);
  });

  it("ignores unparsable or missing dates without throwing", () => {
    const referenceMs = Date.parse("2026-07-05T00:00:00.000Z");
    const cadence = aggregateLaunchCadence([null, undefined, "not-a-date", ""], referenceMs, 6);

    expect(cadence.points).toHaveLength(6);
    expect(cadence.points.every((point) => point.count === 0)).toBe(true);
  });

  it("returns an empty series when monthsBack is 0", () => {
    const cadence = aggregateLaunchCadence(["2026-07-01T00:00:00.000Z"], Date.now(), 0);

    expect(cadence.points).toHaveLength(0);
    expect(cadence.rangeLabel).toBe("");
  });
});
