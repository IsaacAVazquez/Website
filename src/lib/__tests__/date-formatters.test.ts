import {
  formatDateTime,
  formatShortDate,
  formatUpdatedAt,
  isLocalDateKey,
  parseLocalDateKey,
  sep,
  toLocalDateKey,
} from "../date-formatters";

describe("date-formatters", () => {
  it("returns fallback labels for invalid dates", () => {
    expect(formatShortDate("not-a-date")).toBe("TBD");
    expect(formatDateTime("not-a-date")).toBe("TBD");
    expect(formatUpdatedAt("not-a-date")).toBe("Unavailable");
  });

  it("formats date-like values with the shared dashboard formatters", () => {
    // 21:30 UTC is 2:30 PM in Pacific daylight time, whatever zone Jest runs in.
    const date = new Date("2026-04-25T21:30:00Z");

    expect(formatShortDate(date)).toBe("Apr 25");
    expect(formatUpdatedAt(date)).toContain("Apr 25");
    expect(formatUpdatedAt(date)).toContain("2:30");
    expect(formatDateTime(date)).toContain("Apr 25");
    expect(formatDateTime(date)).toMatch(/\b2:30\b/);
    expect(formatDateTime(date)).toContain("PDT");
  });

  it("prints the same text in every host zone", () => {
    // Just after midnight UTC is still the previous evening in the Bay Area.
    const date = new Date("2026-04-26T00:15:00Z");
    expect(formatShortDate(date)).toBe("Apr 25");
    expect(formatUpdatedAt(date)).toBe("Apr 25, 5:15 PM PDT");
  });

  it("prints an en-GB September as Sep, whichever way the engine spelled it", () => {
    // Node, Chrome, and Firefox hand back "Sept" and WebKit on macOS hands back "Sep".
    expect(sep("25 Sept 2026")).toBe("25 Sep 2026");
    expect(sep("22 Sept, 16:39")).toBe("22 Sep, 16:39");
    expect(sep("25 Sep 2026")).toBe("25 Sep 2026");
    expect(sep("25 September 2026")).toBe("25 September 2026");
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
