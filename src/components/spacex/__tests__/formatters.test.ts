import type { MissionLaunchCard } from "@/types/spacex";
import {
  formatCurrencyCompact,
  formatInteger,
  formatMissionMoment,
  formatMissionScheduleLabel,
  humanizeMissionPrecision,
} from "../formatters";

function buildLaunch(overrides: Partial<MissionLaunchCard> = {}): MissionLaunchCard {
  return {
    dateUtc: "2026-04-20T17:30:00.000Z",
    datePrecision: "hour",
    tbd: false,
    isStaleSchedule: false,
    ...overrides,
  } as MissionLaunchCard;
}

describe("SpaceX formatters", () => {
  describe("formatCurrencyCompact", () => {
    it("formats compact launch costs without trailing zero hydration drift", () => {
      expect(formatCurrencyCompact(52_000_000)).toBe("$52M");
      expect(formatCurrencyCompact(52_500_000)).toBe("$52.5M");
    });

    it("scales into billions", () => {
      expect(formatCurrencyCompact(2_000_000_000)).toBe("$2B");
      expect(formatCurrencyCompact(1_200)).toBe("$1.2K");
    });

    it("keeps small currency values as standard dollar amounts", () => {
      expect(formatCurrencyCompact(950)).toBe("$950");
      expect(formatCurrencyCompact(null)).toBe("Unavailable");
    });
  });

  describe("formatInteger", () => {
    it("adds grouping separators for finite values", () => {
      expect(formatInteger(1234567)).toBe("1,234,567");
      expect(formatInteger(0)).toBe("0");
    });

    it("returns a placeholder for non-finite values", () => {
      expect(formatInteger(null)).toBe("Unavailable");
      expect(formatInteger(Number.NaN)).toBe("Unavailable");
    });
  });

  describe("humanizeMissionPrecision", () => {
    it("maps known precisions to readable labels", () => {
      expect(humanizeMissionPrecision("hour")).toBe("hour");
      expect(humanizeMissionPrecision("day")).toBe("day");
      expect(humanizeMissionPrecision("month")).toBe("month");
      expect(humanizeMissionPrecision("year")).toBe("year");
      expect(humanizeMissionPrecision("quarter")).toBe("quarter");
      expect(humanizeMissionPrecision("half")).toBe("half-year");
    });

    it("passes unknown precisions through untouched", () => {
      expect(humanizeMissionPrecision("decade")).toBe("decade");
    });
  });

  describe("formatMissionMoment", () => {
    it("includes the time for hour precision", () => {
      const label = formatMissionMoment({
        dateUtc: "2026-04-20T17:30:00.000Z",
        datePrecision: "hour",
      });
      // Time component present (contains AM/PM marker) for hour precision.
      expect(label).toMatch(/AM|PM/);
    });

    it("renders month/year for coarse precisions", () => {
      const label = formatMissionMoment({
        dateUtc: "2026-04-20T17:30:00.000Z",
        datePrecision: "month",
      });
      expect(label).toContain("2026");
      expect(label).not.toMatch(/AM|PM/);
    });

    it("renders a bare year for year precision", () => {
      expect(
        formatMissionMoment({
          dateUtc: "2026-04-20T17:30:00.000Z",
          datePrecision: "year",
        })
      ).toBe("2026");
    });

    it("falls back to date formatting for unknown precision", () => {
      const label = formatMissionMoment({
        dateUtc: "2026-04-20T17:30:00.000Z",
        datePrecision: "unknown" as MissionLaunchCard["datePrecision"],
      });
      expect(label).toContain("2026");
    });
  });

  describe("formatMissionScheduleLabel", () => {
    it("flags a stale schedule first", () => {
      expect(
        formatMissionScheduleLabel(buildLaunch({ isStaleSchedule: true }))
      ).toBe("Awaiting refreshed schedule from upstream API");
    });

    it("describes TBD launches with their precision", () => {
      expect(
        formatMissionScheduleLabel(
          buildLaunch({ tbd: true, datePrecision: "month" })
        )
      ).toBe("Date TBD (month precision)");
    });

    it("returns a bare moment for hour precision", () => {
      const label = formatMissionScheduleLabel(
        buildLaunch({ datePrecision: "hour" })
      );
      expect(label).not.toContain("Scheduled for");
      expect(label).toMatch(/AM|PM/);
    });

    it("prefixes coarser precisions with 'Scheduled for'", () => {
      const label = formatMissionScheduleLabel(
        buildLaunch({ datePrecision: "day" })
      );
      expect(label).toContain("Scheduled for");
    });
  });
});
