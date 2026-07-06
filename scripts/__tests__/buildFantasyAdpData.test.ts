/**
 * @jest-environment node
 */
import { resolveAdpFormat, MIN_ADP_ENTRIES } from "../buildFantasyAdpData";
import type { FantasyAdpEntry } from "@/lib/fantasyAdpSource";

function record(entryCount: number, asOf: string, sampleSize: number) {
  const entries: FantasyAdpEntry[] = Array.from({ length: entryCount }, (_, i) => ({
    name: `Player ${i}`,
    team: "FA",
    position: "RB",
    adp: i + 1,
  })) as unknown as FantasyAdpEntry[];
  return { entries, asOf, sampleSize, sourceUrl: "https://example/adp" };
}

describe("resolveAdpFormat", () => {
  const previous = record(150, "2026-06-01", 800);

  it("uses the fresh board when it meets the entry floor", () => {
    const fresh = record(140, "2026-07-05", 394);
    const result = resolveAdpFormat(fresh, previous);
    expect(result.source).toBe("fresh");
    expect(result.record).toBe(fresh);
  });

  it("keeps the previous board when the fresh board is thin (below the floor)", () => {
    // The real regression: FFC's late-June rollover returned 1-4 entries and
    // overwrote a full board. A thin board must not replace good previous data.
    const thin = record(4, "2026-07-01", 197);
    const result = resolveAdpFormat(thin, previous);
    expect(result.source).toBe("previous");
    expect(result.record).toBe(previous);
  });

  it("keeps the previous board when the fetch failed (null fresh)", () => {
    const result = resolveAdpFormat(null, previous);
    expect(result.source).toBe("previous");
    expect(result.record).toBe(previous);
  });

  it("falls back to a thin fresh board when there is no usable previous", () => {
    const thin = record(4, "2026-07-01", 197);
    const result = resolveAdpFormat(thin, null);
    expect(result.source).toBe("thin-fresh");
    expect(result.record).toBe(thin);
  });

  it("returns empty when neither fresh nor previous is usable", () => {
    const result = resolveAdpFormat(null, null);
    expect(result.source).toBe("empty");
    expect(result.record).toBeNull();
  });

  it("exposes a sane floor that separates the 1-4 regression from healthy 138-193 boards", () => {
    expect(MIN_ADP_ENTRIES).toBeGreaterThan(4);
    expect(MIN_ADP_ENTRIES).toBeLessThanOrEqual(120);
  });
});
