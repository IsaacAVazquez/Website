import { epicentres, seismogramSpikes } from "../seismogram";

const end = new Date("2026-09-24T12:00:00Z");
const q = (id: string, hoursAgo: number, magnitude: number, lat = 0, lon = 0, depthKm = 10) => ({
  id,
  time: new Date(end.getTime() - hoursAgo * 3600e3).toISOString(),
  magnitude,
  latitude: lat,
  longitude: lon,
  depthKm,
});

describe("seismogramSpikes", () => {
  it("places each quake at its time across the window and scales height by magnitude", () => {
    const [a, b] = seismogramSpikes([q("a", 12, 2.5), q("b", 0, 5)], end);
    expect(a.x).toBeCloseTo(0.5);
    expect(b.x).toBeCloseTo(1);
    expect(b.height).toBe(1);
    expect(a.height).toBeGreaterThan(0);
    expect(a.height).toBeLessThan(b.height);
  });

  it("drops quakes outside the window", () => {
    expect(seismogramSpikes([q("old", 30, 4)], end)).toEqual([]);
  });

  it("keeps small quakes visible beside a great one", () => {
    const spikes = seismogramSpikes([q("small", 1, 2.5), q("great", 2, 8.2)], end);
    expect(spikes.find((s) => s.id === "small")!.height).toBeGreaterThanOrEqual(0.08);
  });

  it("returns nothing for an empty feed", () => {
    expect(seismogramSpikes([], end)).toEqual([]);
  });
});

describe("epicentres", () => {
  it("projects coordinates onto the unit square and bands depth", () => {
    expect(epicentres([q("p", 0, 5, 90, -180, 400)])[0]).toMatchObject({ x: 0, y: 0, depthBand: "deep" });
    expect(epicentres([q("c", 0, 5, 0, 0, 5)])[0]).toMatchObject({ x: 0.5, y: 0.5, depthBand: "shallow" });
    expect(epicentres([q("i", 0, 5, 0, 0, 120)])[0].depthBand).toBe("intermediate");
  });

  it("sizes by magnitude with a floor so small quakes stay visible", () => {
    const [small, big] = epicentres([q("s", 0, 0.5), q("b", 0, 7)]);
    expect(small.r).toBeGreaterThanOrEqual(1.5);
    expect(big.r).toBeGreaterThan(small.r);
  });

  it("returns nothing for an empty feed", () => {
    expect(epicentres([])).toEqual([]);
  });
});
