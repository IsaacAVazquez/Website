import { getRegion } from "@/lib/travelDeals";
import { bookingStrip, fareGauge, fitLabel } from "../fareGauge";

const region = getRegion("western-europe")!;

function addDays(base: string, days: number): string {
  const date = new Date(`${base}T00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

describe("fareGauge", () => {
  it("places the needle at the low, typical, and high band positions", () => {
    expect(fareGauge(region.typicalFareLow, region).needle).toBeCloseTo(
      fareGauge(region.typicalFareLow, region).band.low,
    );
    expect(fareGauge(region.typicalFare, region).needle).toBeCloseTo(
      fareGauge(region.typicalFare, region).band.typical,
    );
    expect(fareGauge(region.typicalFareHigh, region).needle).toBeCloseTo(
      fareGauge(region.typicalFareHigh, region).band.high,
    );
  });

  it("clamps a far outlier fare without moving the band", () => {
    const normal = fareGauge(region.typicalFare, region);
    const outlier = fareGauge(region.typicalFareHigh * 5, region);
    expect(outlier.needle).toBe(1);
    expect(outlier.clamped).toBe("high");
    expect(outlier.band).toEqual(normal.band);
  });

  it("clamps a zero fare to the low end", () => {
    const gauge = fareGauge(0, region);
    expect(gauge.needle).toBe(0);
    expect(gauge.clamped).toBe("low");
  });

  it("reuses scoreFare's rating rather than inventing a new one", () => {
    const { scoreFare } = jest.requireActual("@/lib/travelDeals");
    expect(fareGauge(region.typicalFare, region).rating).toBe(
      scoreFare(region.typicalFare, region).rating,
    );
  });
});

describe("bookingStrip", () => {
  const today = "2026-01-01";

  it("returns a null position for a missing departure date", () => {
    const strip = bookingStrip("", today, region);
    expect(strip.daysOut).toBeNull();
    expect(strip.todayFraction).toBeNull();
    expect(strip.position).toBeNull();
  });

  it("returns a null position for an invalid departure date", () => {
    const strip = bookingStrip("not-a-date", today, region);
    expect(strip.position).toBeNull();
  });

  it("marks a departure in the past as after the window", () => {
    const strip = bookingStrip(addDays(today, -5), today, region);
    expect(strip.daysOut).toBe(-5);
    expect(strip.position).toBe("after");
    expect(strip.todayFraction).toBe(1);
  });

  it("marks today inside the sweet spot", () => {
    const midSweetSpot = Math.round(
      (region.sweetSpotMinDays + region.sweetSpotMaxDays) / 2,
    );
    const strip = bookingStrip(addDays(today, midSweetSpot), today, region);
    expect(strip.position).toBe("inside");
    expect(strip.todayFraction).toBeGreaterThanOrEqual(strip.sweetSpot.start);
    expect(strip.todayFraction).toBeLessThanOrEqual(strip.sweetSpot.end);
  });

  it("covers a departure a year out and reads it as before the window", () => {
    const strip = bookingStrip(addDays(today, 365), today, region);
    expect(strip.daysOut).toBe(365);
    expect(strip.position).toBe("before");
    expect(strip.spanDays).toBeGreaterThanOrEqual(365);
    expect(strip.todayFraction).toBeGreaterThanOrEqual(0);
    expect(strip.todayFraction).toBeLessThanOrEqual(1);
  });

  it("always spans at least the sweet-spot window plus margin", () => {
    const shortWindowRegion = getRegion("domestic-short")!;
    const strip = bookingStrip("", today, shortWindowRegion);
    expect(strip.spanDays).toBeGreaterThanOrEqual(shortWindowRegion.sweetSpotMaxDays);
    expect(strip.sweetSpot.start).toBeGreaterThan(0);
    expect(strip.sweetSpot.end).toBeLessThan(1);
    expect(strip.sweetSpot.start).toBeLessThan(strip.sweetSpot.end);
  });
});

describe("fitLabel", () => {
  it("centres a label on its mark when there is room", () => {
    expect(fitLabel(300, 100, 0, 640)).toBe(300);
  });

  it("pulls a label in from either edge so it stays inside the plot", () => {
    expect(fitLabel(20, 100, 0, 640)).toBe(50);
    expect(fitLabel(630, 100, 0, 640)).toBe(590);
  });

  it("centres a label wider than the plot on the plot", () => {
    expect(fitLabel(100, 800, 0, 640)).toBe(320);
  });
});
