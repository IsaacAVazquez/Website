import { formatPtDate, formatPtDay, formatPtTime } from "../catalog97Readouts";

describe("catalog97Readouts time formatting", () => {
  it("prints Pacific daylight time with a Sep abbreviation", () => {
    // 23:39 UTC on 22 Sep is 16:39 PDT the same day.
    expect(formatPtTime("2026-09-22T23:39:00Z")).toBe("22 Sep, 16:39 PT");
    expect(formatPtDay("2026-09-20T01:47:00Z")).toBe("19 Sep");
    expect(formatPtDate("2026-09-23T04:56:46Z")).toBe("22 Sep 2026");
  });

  it("follows the standard-time offset in winter", () => {
    expect(formatPtTime("2026-01-10T08:05:00Z")).toBe("10 Jan, 00:05 PT");
  });

  it("returns an empty string for an unparseable time", () => {
    expect(formatPtTime("not a date")).toBe("");
    expect(formatPtDate("")).toBe("");
  });
});
