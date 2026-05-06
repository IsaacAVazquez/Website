import {
  formatDateTime,
  formatFullDate,
  formatShortDate,
  formatUpdatedAt,
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
});
