import {
  formatHistoryAsOf,
  getHistoricalPriceFreshness,
} from "../investmentsHistory";

describe("investmentsHistory", () => {
  describe("getHistoricalPriceFreshness", () => {
    const referenceDate = new Date("2026-07-06T12:00:00Z");

    it("parses the history date to UTC midnight", () => {
      const result = getHistoricalPriceFreshness("2026-07-03", null, referenceDate);
      expect(result.historyDate?.toISOString()).toBe("2026-07-03T00:00:00.000Z");
    });

    it("treats an exactly three-day lag as fresh (boundary is lagDays > 3)", () => {
      const result = getHistoricalPriceFreshness("2026-07-03", null, referenceDate);
      expect(result.lagDays).toBe(3);
      expect(result.isStale).toBe(false);
    });

    it("flags a four-day lag as stale", () => {
      const result = getHistoricalPriceFreshness("2026-07-02", null, referenceDate);
      expect(result.lagDays).toBe(4);
      expect(result.isStale).toBe(true);
    });

    it("compares calendar days in UTC, ignoring the reference time of day", () => {
      const lateInDay = new Date("2026-07-06T23:59:59Z");
      const result = getHistoricalPriceFreshness("2026-07-03", null, lateInDay);
      expect(result.lagDays).toBe(3);
      expect(result.isStale).toBe(false);
    });

    it("anchors lag to the dataset date when it is earlier than the reference date", () => {
      const laterReference = new Date("2026-07-20T00:00:00Z");
      const result = getHistoricalPriceFreshness("2026-07-03", "2026-07-06", laterReference);
      // The dataset was last updated on 07-06, so lag is measured from there (3 days),
      // not from the 07-20 reference date (which would be 17 days).
      expect(result.referenceDate.toISOString()).toBe("2026-07-06T00:00:00.000Z");
      expect(result.lagDays).toBe(3);
      expect(result.isStale).toBe(false);
    });

    it("anchors lag to the reference date when the dataset date is later", () => {
      const result = getHistoricalPriceFreshness("2026-07-03", "2026-07-20", referenceDate);
      // The earlier of the two anchors wins, so the reference date is used unchanged.
      expect(result.referenceDate).toBe(referenceDate);
      expect(result.lagDays).toBe(3);
    });

    it("ignores an unparseable dataset date and falls back to the reference date", () => {
      const result = getHistoricalPriceFreshness("2026-07-02", "not-a-date", referenceDate);
      expect(result.referenceDate).toBe(referenceDate);
      expect(result.lagDays).toBe(4);
      expect(result.isStale).toBe(true);
    });

    it("floors negative lag to zero when history is ahead of the anchor", () => {
      const result = getHistoricalPriceFreshness("2026-07-10", null, referenceDate);
      expect(result.lagDays).toBe(0);
      expect(result.isStale).toBe(false);
    });

    it("returns non-stale null-lag defaults when the history date is null", () => {
      const result = getHistoricalPriceFreshness(null, "2026-07-06", referenceDate);
      expect(result.historyDate).toBeNull();
      expect(result.lagDays).toBeNull();
      expect(result.isStale).toBe(false);
      // The null branch returns early, so the raw reference date is passed through
      // untouched (the earlier dataset date is never applied).
      expect(result.referenceDate).toBe(referenceDate);
    });

    it("returns null-lag defaults for an unparseable history date", () => {
      const result = getHistoricalPriceFreshness("not-a-date", null, referenceDate);
      expect(result.historyDate).toBeNull();
      expect(result.lagDays).toBeNull();
      expect(result.isStale).toBe(false);
    });
  });

  describe("formatHistoryAsOf", () => {
    it("formats a valid date as a UTC en-US medium date", () => {
      expect(formatHistoryAsOf("2026-07-03")).toBe("Jul 3, 2026");
    });

    it("returns the em-dash placeholder for null, empty, or invalid input", () => {
      expect(formatHistoryAsOf(null)).toBe("—");
      expect(formatHistoryAsOf("")).toBe("—");
      expect(formatHistoryAsOf("not-a-date")).toBe("—");
    });
  });
});
