import {
  formatDateTime,
  formatFullDate,
  formatShortDate,
  formatUpdatedAt,
  isLocalDateKey,
  parseLocalDateKey,
  toLocalDateKey,
} from "../date-formatters";

describe("date-formatters", () => {
  it("returns fallback labels for invalid dates", () => {
    expect(formatShortDate("not-a-date")).toBe("TBD");
    expect(formatDateTime("not-a-date")).toBe("TBD");
    expect(formatUpdatedAt("not-a-date")).toBe("Unavailable");
    expect(formatFullDate("not-a-date")).toBe("Unavailable");
  });

  it("formats date-like values with the shared dashboard formatters", () => {
    const date = new Date(2026, 3, 25, 14, 30);

    expect(formatShortDate(date)).toBe("Apr 25");
    expect(formatFullDate(date)).toBe("Apr 25, 2026");
    expect(formatUpdatedAt(date)).toContain("Apr 25");
    expect(formatUpdatedAt(date)).toContain("2:30");
    expect(formatDateTime(date)).toContain("Apr 25");
    expect(formatDateTime(date)).toMatch(/\b2:30\b/);
  });

  it("creates calendar keys from local date fields rather than UTC", () => {
    const localLateNight = new Date(2026, 0, 2, 23, 45);

    expect(toLocalDateKey(localLateNight)).toBe("2026-01-02");
    expect(toLocalDateKey(new Date(Number.NaN))).toBe("");
  });

  it("validates real local calendar keys", () => {
    expect(isLocalDateKey("2026-02-28")).toBe(true);
    expect(isLocalDateKey("2026-02-29")).toBe(false);
    expect(isLocalDateKey("2026-13-01")).toBe(false);
    expect(isLocalDateKey("02/28/2026")).toBe(false);
  });

  it("parses date-only keys at local midnight", () => {
    const date = parseLocalDateKey("2026-07-10");
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6);
    expect(date?.getDate()).toBe(10);
    expect(date?.getHours()).toBe(0);
    expect(parseLocalDateKey("2026-02-30")).toBeNull();
  });
});
