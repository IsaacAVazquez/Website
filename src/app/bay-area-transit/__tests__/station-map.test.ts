import { bundleTrack, linePath, nearestStation, projectStations } from "../station-map";

function st(abbr: string, latitude: number, longitude: number, lines: string[] = []) {
  return { abbr, latitude, longitude, lines };
}

describe("projectStations", () => {
  it("places the westernmost station at x = pad and the northernmost at y = pad", () => {
    const stations = [
      st("west", 0, -10),
      st("east", 0, 10),
      st("north", 5, 0),
      st("south", -5, 0),
    ];
    const points = projectStations(stations, [], 220, 120, 10);
    const west = points.find((p) => p.abbr === "west")!;
    const north = points.find((p) => p.abbr === "north")!;
    const east = points.find((p) => p.abbr === "east")!;
    const south = points.find((p) => p.abbr === "south")!;

    expect(west.x).toBeCloseTo(10);
    expect(north.y).toBeCloseTo(10);
    expect(east.x).toBeCloseTo(210);
    expect(south.y).toBeCloseTo(110);
  });

  it("corrects longitude by cos(mean latitude) so the frame isn't stretched", () => {
    const stations = [
      st("a", 37.5, -122.5),
      st("b", 37.5, -121.9),
      st("c", 38.0, -122.2),
      st("d", 37.0, -122.2),
    ];
    const points = projectStations(stations, [], 300, 300, 20);
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const pixelSpanX = Math.max(...xs) - Math.min(...xs);
    const pixelSpanY = Math.max(...ys) - Math.min(...ys);

    const meanLat = (37.5 + 37.5 + 38.0 + 37.0) / 4;
    const lonScale = Math.cos((meanLat * Math.PI) / 180);
    const expectedRatio = (0.6 * lonScale) / 1.0;

    expect(pixelSpanX / pixelSpanY).toBeCloseTo(expectedRatio, 2);
  });

  it("centers a single station", () => {
    const points = projectStations([st("only", 37.8, -122.4)], [], 300, 200, 20);
    expect(points).toEqual([{ abbr: "only", x: 150, y: 100, rings: [] }]);
  });

  it("adds no ring for a line missing from the lines list", () => {
    const points = projectStations(
      [st("embr", 37.79, -122.39, ["Yellow", "Silver"])],
      [{ colorName: "Yellow", hexColor: "#ffff33" }],
      300,
      200,
      20
    );
    expect(points[0].rings).toEqual(["#ffff33"]);
  });

  it("orders rings by the lines list, not the station's own line order", () => {
    const points = projectStations(
      [st("mont", 37.79, -122.4, ["Red", "Yellow"])],
      [
        { colorName: "Yellow", hexColor: "#ffff33" },
        { colorName: "Red", hexColor: "#ff0000" },
      ],
      300,
      200,
      20
    );
    expect(points[0].rings).toEqual(["#ffff33", "#ff0000"]);
  });

  it("returns nothing for an empty station list", () => {
    expect(projectStations([], [], 300, 200)).toEqual([]);
  });
});

describe("linePath", () => {
  const byAbbr = new Map([
    ["EMBR", "embr"],
    ["MONT", "mont"],
    ["POWL", "powl"],
  ]);

  it("follows BART's order and skips stops the map doesn't know", () => {
    expect(linePath({ stationSequence: ["POWL", "XXXX", "MONT", "EMBR"] }, byAbbr)).toEqual([
      "powl",
      "mont",
      "embr",
    ]);
  });

  it("draws nothing for the airport connector, which BART lists as OAKL twice", () => {
    expect(linePath({ stationSequence: ["OAKL", "OAKL"] }, new Map([["OAKL", "oakl"]]))).toEqual([]);
  });

  it("draws nothing for a snapshot built before the sequence existed", () => {
    expect(linePath({}, byAbbr)).toEqual([]);
  });
});

describe("nearestStation", () => {
  const stations = [
    { abbr: "EMBR", latitude: 37.7929, longitude: -122.3971 },
    { abbr: "12TH", latitude: 37.8037, longitude: -122.2716 },
  ];

  it("picks the closer station and gives a sane distance", () => {
    // A point near the Ferry Building is about half a kilometre from Embarcadero.
    const hit = nearestStation(stations, 37.7955, -122.3937)!;
    expect(hit.station.abbr).toBe("EMBR");
    expect(hit.km).toBeGreaterThan(0.2);
    expect(hit.km).toBeLessThan(1);
  });

  it("returns null with no stations", () => {
    expect(nearestStation([], 37.8, -122.3)).toBeNull();
  });
});

describe("bundleTrack", () => {
  const pt = (abbr: string, x: number, y: number) => ({ abbr, x, y });

  it("makes one segment per stretch of track, whichever way a line runs it", () => {
    const segments = bundleTrack(
      [
        { key: "a", hex: "#a", path: [pt("A", 0, 0), pt("B", 10, 0)] },
        { key: "b", hex: "#b", path: [pt("B", 10, 0), pt("A", 0, 0)] },
      ],
      4
    );
    expect(segments).toHaveLength(1);
    expect(segments[0].members).toEqual(["a", "b"]);
  });

  it("sets shared lines spacing apart, centred on the track", () => {
    const [segment] = bundleTrack(
      [
        { key: "a", hex: "#a", path: [pt("A", 0, 0), pt("B", 10, 0)] },
        { key: "b", hex: "#b", path: [pt("A", 0, 0), pt("B", 10, 0)] },
      ],
      4
    );
    const ys = segment.strokes.map((stroke) => stroke.ends[0].y);
    expect(ys).toEqual([-2, 2]);
    expect(segment.strokes[0].ends[1].y).toBe(-2);
  });

  it("keeps the same side-by-side order along a trunk, even where a line runs it backwards", () => {
    const segments = bundleTrack(
      [
        { key: "a", hex: "#a", path: [pt("A", 0, 0), pt("Z", 10, 0), pt("C", 20, 0)] },
        { key: "b", hex: "#b", path: [pt("C", 20, 0), pt("Z", 10, 0), pt("A", 0, 0)] },
      ],
      4
    );
    // Line a sits on the same side of both stretches.
    expect(segments.map((segment) => segment.strokes[0].ends[0].y)).toEqual([-2, -2]);
  });

  it("leaves a stretch run by one line on the track itself", () => {
    const [segment] = bundleTrack([{ key: "a", hex: "#a", path: [pt("A", 0, 0), pt("B", 0, 10)] }], 4);
    expect(segment.strokes[0].ends).toEqual(segment.ends);
  });
});
