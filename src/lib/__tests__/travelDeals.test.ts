import type { DestinationRegion } from "@/types/travelDeals";
import {
  daysBetween,
  formatSignedPercent,
  formatUsd,
  getBookingWindow,
  getRegion,
  isIsoDate,
  planBudget,
  scoreFare,
  valuePoints,
} from "../travelDeals";

const region: DestinationRegion = {
  id: "western-europe",
  label: "Western Europe",
  kind: "international",
  typicalFareLow: 450,
  typicalFare: 800,
  typicalFareHigh: 1500,
  bookWindowOpenDays: 180,
  sweetSpotMinDays: 60,
  sweetSpotMaxDays: 150,
  note: "test region",
};

/** Return an ISO date `offset` days from `2026-06-01` for stable window tests. */
function dateAtOffset(offset: number): string {
  const base = new Date("2026-06-01T00:00");
  base.setDate(base.getDate() + offset);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const TODAY = "2026-06-01";

describe("travelDeals date helpers", () => {
  it("validates ISO dates and measures whole-day gaps", () => {
    expect(isIsoDate("2026-06-01")).toBe(true);
    expect(isIsoDate("2026-6-1")).toBe(false);
    expect(isIsoDate(20260601)).toBe(false);
    expect(daysBetween("2026-06-01", "2026-06-11")).toBe(10);
    expect(daysBetween("2026-06-11", "2026-06-01")).toBe(-10);
    expect(daysBetween("bad", "2026-06-01")).toBeNull();
  });
});

describe("getRegion", () => {
  it("resolves a known region id and returns undefined otherwise", () => {
    expect(getRegion("oceania")?.kind).toBe("international");
    // @ts-expect-error — deliberately passing an unknown id
    expect(getRegion("atlantis")).toBeUndefined();
  });
});

describe("getBookingWindow", () => {
  it("flags a date far out as too early", () => {
    const window = getBookingWindow(region, dateAtOffset(220), TODAY);
    expect(window.status).toBe("too-early");
    expect(window.daysUntilDeparture).toBe(220);
    // Sweet spot opens once we are within sweetSpotMaxDays of departure.
    expect(window.daysUntilSweetSpot).toBe(220 - region.sweetSpotMaxDays);
  });

  it("flags the watching window between open and the sweet spot", () => {
    const window = getBookingWindow(region, dateAtOffset(160), TODAY);
    expect(window.status).toBe("watching");
  });

  it("identifies the sweet spot", () => {
    const window = getBookingWindow(region, dateAtOffset(90), TODAY);
    expect(window.status).toBe("sweet-spot");
    expect(window.daysUntilSweetSpot).toBe(0);
  });

  it("flags the closing window under the sweet spot but before last call", () => {
    const window = getBookingWindow(region, dateAtOffset(30), TODAY);
    expect(window.status).toBe("closing");
  });

  it("flags last-minute inside two weeks and past dates as departed", () => {
    expect(getBookingWindow(region, dateAtOffset(7), TODAY).status).toBe("last-call");
    expect(getBookingWindow(region, dateAtOffset(-3), TODAY).status).toBe("departed");
  });

  it("asks for a date when the departure is invalid", () => {
    const window = getBookingWindow(region, "not-a-date", TODAY);
    expect(window.daysUntilDeparture).toBeNull();
    expect(window.headline).toMatch(/date/i);
  });
});

describe("scoreFare", () => {
  it("rates a deep discount a steal and scales the benchmark by party size", () => {
    const score = scoreFare(1000, region, 2);
    // Benchmark is typicalFare * travelers = 1600 for two.
    expect(score.benchmark).toBe(1600);
    expect(score.savings).toBe(600);
    expect(score.rating).toBe("steal");
    expect(score.savingsPct).toBeCloseTo(0.375, 3);
  });

  it("rates a near-benchmark fare fair and an over-benchmark fare high", () => {
    expect(scoreFare(800, region, 1).rating).toBe("fair");
    expect(scoreFare(720, region, 1).rating).toBe("good");
    expect(scoreFare(1100, region, 1).rating).toBe("high");
  });

  it("never treats a negative fare as meaningful savings beyond the benchmark", () => {
    const score = scoreFare(-50, region, 1);
    expect(score.quoted).toBe(0);
    expect(score.savings).toBe(region.typicalFare);
  });
});

describe("valuePoints", () => {
  it("computes cents per point net of taxes and fees", () => {
    // (900 cash - 100 fees) / 40000 points * 100 = 2 cents per point.
    const value = valuePoints(900, 100, 40000, 1.4);
    expect(value.centsPerPoint).toBe(2);
    expect(value.rating).toBe("good");
  });

  it("rates an outsized redemption excellent and a weak one poor", () => {
    expect(valuePoints(2400, 100, 50000).rating).toBe("excellent");
    expect(valuePoints(300, 50, 40000).rating).toBe("poor");
  });

  it("guards against zero or missing points", () => {
    const value = valuePoints(500, 50, 0);
    expect(value.centsPerPoint).toBe(0);
    expect(value.rating).toBe("poor");
  });
});

describe("planBudget", () => {
  it("splits a budget into parts that sum back to the total", () => {
    const plan = planBudget(5000, 4, 2);
    const sum = plan.flights + plan.lodging + plan.food + plan.activities + plan.buffer;
    expect(sum).toBe(5000);
    expect(plan.days).toBe(5);
    expect(plan.lodgingPerNight).toBe(Math.round((5000 * 0.3) / 4));
    // Food per person per day divides across days (nights + 1) and travelers.
    expect(plan.foodPerDayPerPerson).toBe(Math.round((5000 * 0.2) / (5 * 2)));
  });

  it("clamps nonsense inputs to safe minimums", () => {
    const plan = planBudget(-100, 0, 0);
    expect(plan.total).toBe(0);
    expect(plan.nights).toBe(1);
    expect(plan.travelers).toBe(1);
  });
});

describe("formatters", () => {
  it("formats currency and signed percentages", () => {
    expect(formatUsd(1234.6)).toBe("$1,235");
    expect(formatSignedPercent(0.375)).toBe("+38%");
    expect(formatSignedPercent(-0.2)).toBe("-20%");
    expect(formatSignedPercent(0)).toBe("0%");
  });
});
