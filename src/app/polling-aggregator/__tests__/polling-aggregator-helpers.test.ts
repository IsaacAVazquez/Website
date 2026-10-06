import {
  buildPolyline,
  describeStaleSource,
  formatDate,
  formatMargin,
  formatNet,
  formatShortDate,
  getRatingPillStyle,
  getRowStyle,
  isStalePollDate,
  newestPollDate,
  partyColor,
} from "../polling-aggregator-helpers";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("polling-aggregator-helpers", () => {
  it("formats margins, net approval values, and invalid dates", () => {
    expect(formatMargin(0.01)).toBe("Even");
    expect(formatMargin(3.24)).toBe("D+3.2");
    expect(formatMargin(-1.46)).toBe("R+1.5");

    expect(formatNet(0)).toBe("Even");
    expect(formatNet(2.45)).toBe("+2.5");
    expect(formatNet(-1)).toBe("-1.0");
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });

  it("prints a poll date as the calendar day the source gave", () => {
    // A date-only string parsed as UTC midnight prints the day before in any
    // timezone west of Greenwich.
    expect(formatDate("2026-09-08")).toBe("Sep 8, 2026");
    expect(formatShortDate("2026-08-15")).toBe("Aug 15");
  });

  it("finds the newest poll date in a series whatever the row order", () => {
    expect(
      newestPollDate([
        { endDate: "2026-08-17" },
        { endDate: "2026-08-28" },
        { endDate: "2026-08-24" },
      ])
    ).toBe("2026-08-28");
    expect(newestPollDate([])).toBeNull();
  });

  describe("describeStaleSource", () => {
    const now = Date.parse("2026-09-27T19:00:00.000Z");

    it("names the source and both dates when both series are old", () => {
      expect(describeStaleSource("2026-08-28", "2026-09-08", now)).toBe(
        "The newest approval poll I have from VoteHub ended Aug 28, 2026 and the newest generic ballot poll ended Sep 8, 2026, so the averages describe polling up to those dates."
      );
    });

    it("names only the series that is old", () => {
      expect(describeStaleSource("2026-08-28", "2026-09-25", now)).toBe(
        "The newest approval poll I have from VoteHub ended Aug 28, 2026, so the approval average describes polling up to that date."
      );
      expect(describeStaleSource("2026-09-25", "2026-09-08", now)).toBe(
        "The newest generic ballot poll I have from VoteHub ended Sep 8, 2026, so the generic ballot average describes polling up to that date."
      );
    });

    it("says nothing until a poll is more than 14 days old", () => {
      const newest = Date.parse("2026-09-08");

      expect(
        describeStaleSource("2026-09-08", "2026-09-08", newest + 14 * DAY_MS)
      ).toBeNull();
      expect(
        describeStaleSource("2026-09-08", "2026-09-08", newest + 14 * DAY_MS + 1)
      ).not.toBeNull();
      expect(describeStaleSource(null, null, now)).toBeNull();
    });

    it("flags one series by the same 14-day rule", () => {
      const newest = Date.parse("2026-09-08");

      expect(isStalePollDate("2026-09-08", newest + 14 * DAY_MS)).toBe(false);
      expect(isStalePollDate("2026-09-08", newest + 14 * DAY_MS + 1)).toBe(true);
      expect(isStalePollDate(null, now)).toBe(false);
    });
  });

  it("returns fallback party colors", () => {
    expect(partyColor("D")).toBe("var(--c97-party-d-mark)");
    expect(partyColor("R")).toBe("var(--c97-party-r-mark)");
    expect(partyColor("I")).toBe("var(--c97-ink-2)");
  });

  it("builds rating and view styles from helper branches", () => {
    expect(getRatingPillStyle("Lean D")).toEqual({
      background: "color-mix(in srgb, var(--c97-party-d) 25%, var(--c97-field))",
      color: "var(--c97-ink)",
      borderColor: "color-mix(in srgb, var(--c97-party-d) 25%, var(--c97-field))",
    });
    expect(getRatingPillStyle("Safe D").color).toBe("var(--c97-print-bone)");
    expect(getRatingPillStyle("Safe R").color).toBe("var(--c97-print-black)");
    expect(getRowStyle(true)).toMatchObject({
      borderColor: "color-mix(in srgb, var(--c97-accent) 35%, var(--c97-rule))",
    });
    expect(getRowStyle(false)).toMatchObject({
      borderColor: "var(--c97-rule)",
    });
  });

  it("maps values into a compact SVG polyline on a shared Y-domain", () => {
    expect(buildPolyline([10, 20, 15], 100, 50, 10, 10, 20)).toBe(
      "10.0,40.0 50.0,10.0 90.0,25.0"
    );
    expect(buildPolyline([12], 100, 50, 8, 0, 100)).toBe("");
    expect(buildPolyline([5, 5], 20, 20, 0, 5, 5)).toBe("0.0,20.0 20.0,20.0");
  });
});
