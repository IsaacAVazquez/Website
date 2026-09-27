import { projectStations } from "../station-map";

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
