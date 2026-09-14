import {
  formatHistoryAsOf,
  getHistoricalPriceFreshness,
} from "../investmentsHistory";

describe("investmentsHistory", () => {
  describe("getHistoricalPriceFreshness", () => {
    const referenceDate = new Date("2026-07-06T12:00:00Z");

    it("parses the history date to UTC midnight", () => {
      const result = getHistoricalPriceFreshness("2026-07-03", referenceDate);
      expect(result.historyDate?.toISOString()).toBe("2026-07-03T00:00:00.000Z");
    });

    it("treats an exactly three-day lag as fresh (boundary is lagDays > 3)", () => {
      const result = getHistoricalPriceFreshness("2026-07-03", referenceDate);
      expect(result.lagDays).toBe(3);
      expect(result.isStale).toBe(false);
    });

    it("flags a four-day lag as stale", () => {
      const result = getHistoricalPriceFreshness("2026-07-02", referenceDate);
      expect(result.lagDays).toBe(4);
      expect(result.isStale).toBe(true);
    });

    it("compares calendar days in UTC, ignoring the reference time of day", () => {
      const lateInDay = new Date("2026-07-06T23:59:59Z");
      const result = getHistoricalPriceFreshness("2026-07-03", lateInDay);
      expect(result.lagDays).toBe(3);
      expect(result.isStale).toBe(false);
    });

    it("measures lag against the reference date, not a snapshot build date", () => {
      // A history ending Jul 17 is 59 days old on Sep 14 no matter when the
      // snapshot holding it was built, which is the case the old anchor hid.
      const laterReference = new Date("2026-09-14T00:00:00Z");
      const result = getHistoricalPriceFreshness("2026-07-17", laterReference);
      expect(result.referenceDate).toBe(laterReference);
      expect(result.lagDays).toBe(59);
      expect(result.isStale).toBe(true);
    });

    it("floors negative lag to zero when history is ahead of the reference date", () => {
      const result = getHistoricalPriceFreshness("2026-07-10", referenceDate);
      expect(result.lagDays).toBe(0);
      expect(result.isStale).toBe(false);
    });

    it("returns non-stale null-lag defaults when the history date is null", () => {
      const result = getHistoricalPriceFreshness(null, referenceDate);
      expect(result.historyDate).toBeNull();
      expect(result.lagDays).toBeNull();
      expect(result.isStale).toBe(false);
      expect(result.referenceDate).toBe(referenceDate);
    });

    it("returns null-lag defaults for an unparseable history date", () => {
      const result = getHistoricalPriceFreshness("not-a-date", referenceDate);
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
