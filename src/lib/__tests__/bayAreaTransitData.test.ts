/**
 * @jest-environment node
 */
import { buildBayAreaTransitSnapshotData } from "../bayAreaTransitData";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// --- Fixtures ----------------------------------------------------------------

/** 12 stations (>= MIN_STATIONS of 10), a couple with the abbrs the builder
 * prefers for the default station ("embr", "mont"). */
function makeStations() {
  const defs: Array<[string, string, string, string, string]> = [
    ["EMBR", "Embarcadero", "San Francisco", "37.792", "-122.397"],
    ["MONT", "Montgomery St.", "San Francisco", "37.789", "-122.401"],
    ["POWL", "Powell St.", "San Francisco", "37.784", "-122.408"],
    ["CIVC", "Civic Center", "San Francisco", "37.780", "-122.414"],
    ["16TH", "16th St. Mission", "San Francisco", "37.765", "-122.420"],
    ["24TH", "24th St. Mission", "San Francisco", "37.752", "-122.418"],
    ["GLEN", "Glen Park", "San Francisco", "37.733", "-122.434"],
    ["BALB", "Balboa Park", "San Francisco", "37.722", "-122.447"],
    ["DALY", "Daly City", "Daly City", "37.706", "-122.469"],
    ["12TH", "12th St. Oakland City Center", "Oakland", "37.803", "-122.272"],
    ["19TH", "19th St. Oakland", "Oakland", "37.808", "-122.269"],
    ["MCAR", "MacArthur", "Oakland", "37.829", "-122.267"],
  ];
  return {
    root: {
      stations: {
        station: defs.map(([abbr, name, city, lat, lng]) => ({
          name,
          abbr,
          city,
          gtfs_latitude: lat,
          gtfs_longitude: lng,
        })),
      },
    },
  };
}

/** Routes summary feed: each colored line appears twice (one per direction). */
function makeRoutes() {
  return {
    root: {
      routes: {
        route: [
          { name: "Antioch to SFO/Millbrae", abbr: "YELLOW-N", routeID: "ROUTE 1", number: "1", hexcolor: "#ffff33", color: "YELLOW" },
          { name: "SFO/Millbrae to Antioch", abbr: "YELLOW-S", routeID: "ROUTE 2", number: "2", hexcolor: "#ffff33", color: "YELLOW" },
          { name: "Berryessa to Daly City", abbr: "GREEN-N", routeID: "ROUTE 5", number: "5", hexcolor: "#339933", color: "GREEN" },
          { name: "Daly City to Berryessa", abbr: "GREEN-S", routeID: "ROUTE 6", number: "6", hexcolor: "#339933", color: "GREEN" },
          { name: "Richmond to Daly City", abbr: "RED-N", routeID: "ROUTE 7", number: "7", hexcolor: "#ff0000", color: "RED" },
          { name: "Daly City to Richmond", abbr: "RED-S", routeID: "ROUTE 8", number: "8", hexcolor: "#ff0000", color: "RED" },
        ],
      },
    },
  };
}

/** Per-route detail feeds keyed by route number, with config.station lists. */
const routeDetails: Record<string, unknown> = {
  "1": {
    root: { routes: { route: { name: "Antioch to SFO/Millbrae", abbr: "YELLOW-N", routeID: "ROUTE 1", number: "1", hexcolor: "#ffff33", color: "YELLOW", origin: "ANTC", destination: "MLBR", num_stns: "3", config: { station: ["EMBR", "MONT", "POWL"] } } } },
  },
  "2": {
    root: { routes: { route: { name: "SFO/Millbrae to Antioch", abbr: "YELLOW-S", routeID: "ROUTE 2", number: "2", hexcolor: "#ffff33", color: "YELLOW", origin: "MLBR", destination: "ANTC", num_stns: "3", config: { station: ["POWL", "MONT", "EMBR"] } } } },
  },
  "5": {
    root: { routes: { route: { name: "Berryessa to Daly City", abbr: "GREEN-N", routeID: "ROUTE 5", number: "5", hexcolor: "#339933", color: "GREEN", origin: "BERY", destination: "DALY", num_stns: "2", config: { station: ["EMBR", "GLEN"] } } } },
  },
  "6": {
    root: { routes: { route: { name: "Daly City to Berryessa", abbr: "GREEN-S", routeID: "ROUTE 6", number: "6", hexcolor: "#339933", color: "GREEN", origin: "DALY", destination: "BERY", num_stns: "2", config: { station: ["GLEN", "EMBR"] } } } },
  },
  "7": {
    root: { routes: { route: { name: "Richmond to Daly City", abbr: "RED-N", routeID: "ROUTE 7", number: "7", hexcolor: "#ff0000", color: "RED", origin: "RICH", destination: "DALY", num_stns: "2", config: { station: ["MCAR", "12TH"] } } } },
  },
  "8": {
    root: { routes: { route: { name: "Daly City to Richmond", abbr: "RED-S", routeID: "ROUTE 8", number: "8", hexcolor: "#ff0000", color: "RED", origin: "DALY", destination: "RICH", num_stns: "2", config: { station: ["12TH", "MCAR"] } } } },
  },
};

/** Service advisory feed: one real delay plus a "No delays" line (filtered out). */
function makeAdvisories() {
  return {
    root: {
      bsa: [
        {
          station: "EMBR",
          type: "DELAY",
          description: { "#cdata-section": "Trains are running about 10 minutes late due to a medical emergency at Embarcadero." },
          sms_text: { "#cdata-section": "10 min delay at EMBR" },
          posted: "Mon, June 22, 2026 9:15 AM",
        },
        {
          type: "",
          description: { "#cdata-section": "No delays reported." },
          posted: "Mon, June 22, 2026 9:00 AM",
        },
      ],
    },
  };
}

/** Elevator feed: one out-of-service plus an "all elevators" line (filtered). */
function makeElevators() {
  return {
    root: {
      bsa: [
        {
          type: "ELEVATOR",
          description: { "#cdata-section": "Powell St. station elevator to the platform is out of service." },
          posted: "Mon, June 22, 2026 7:00 AM",
        },
        {
          type: "ELEVATOR",
          description: { "#cdata-section": "Attention passengers: All elevators are in service." },
          posted: "Mon, June 22, 2026 6:00 AM",
        },
      ],
    },
  };
}

/** Real-time departures for all stations in one call. */
function makeEtd() {
  return {
    root: {
      date: "06/22/2026",
      time: "09:15:00 AM PDT",
      station: [
        {
          name: "Embarcadero",
          abbr: "EMBR",
          etd: [
            {
              destination: "Antioch",
              abbreviation: "ANTC",
              estimate: [
                { minutes: "Leaving", platform: "2", direction: "North", length: "10", color: "YELLOW", hexcolor: "#ffff33", bikeflag: "1", delay: "0" },
                { minutes: "8", platform: "2", direction: "North", length: "8", color: "YELLOW", hexcolor: "#ffff33", bikeflag: "0", delay: "60" },
              ],
            },
            {
              destination: "Daly City",
              abbreviation: "DALY",
              estimate: [
                { minutes: "3", platform: "1", direction: "South", length: "9", color: "GREEN", hexcolor: "#339933", bikeflag: "1", delay: "0" },
              ],
            },
          ],
        },
        {
          name: "Montgomery St.",
          abbr: "MONT",
          etd: [
            {
              destination: "Richmond",
              abbreviation: "RICH",
              estimate: [
                { minutes: "5", platform: "2", direction: "North", length: "10", color: "RED", hexcolor: "#ff0000", bikeflag: "0", delay: "0" },
              ],
            },
          ],
        },
      ],
    },
  };
}

// --- Router ------------------------------------------------------------------

type Fetcher = (url: string) => Response;

function defaultFetcher(url: string): Response {
  if (url.includes("stn.aspx") && url.includes("cmd=stns")) {
    return jsonResponse(makeStations());
  }
  if (url.includes("route.aspx") && url.includes("cmd=routeinfo")) {
    const match = url.match(/[?&]route=([^&]+)/);
    const number = match ? decodeURIComponent(match[1]) : "";
    return jsonResponse(routeDetails[number] ?? { root: { routes: { route: [] } } });
  }
  if (url.includes("route.aspx") && url.includes("cmd=routes")) {
    return jsonResponse(makeRoutes());
  }
  if (url.includes("bsa.aspx") && url.includes("cmd=elev")) {
    return jsonResponse(makeElevators());
  }
  if (url.includes("bsa.aspx") && url.includes("cmd=bsa")) {
    return jsonResponse(makeAdvisories());
  }
  if (url.includes("etd.aspx")) {
    return jsonResponse(makeEtd());
  }
  return jsonResponse({});
}

function mockFetch(fetcher: Fetcher) {
  return jest.spyOn(global, "fetch").mockImplementation((input: unknown) => {
    const url = String(input);
    return Promise.resolve(fetcher(url));
  });
}

describe("buildBayAreaTransitSnapshotData", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds a snapshot with normalized stations, line mappings, advisories, elevator outages, and departures", async () => {
    mockFetch(defaultFetcher);

    const { summary, stationBoards } = await buildBayAreaTransitSnapshotData();

    // System metadata.
    expect(summary.system?.abbr).toBe("BART");
    expect(summary.system?.seed).toBe(false);
    expect(summary.system?.source).toContain("api.bart.gov");

    // Lines: 3 colored lines (one card per color, second direction folded in).
    expect(summary.lines).toHaveLength(3);
    const yellow = summary.lines.find((l) => l.colorName === "Yellow");
    expect(yellow).toBeDefined();
    expect(yellow?.name).toBe("Antioch to SFO/Millbrae");
    expect(yellow?.hexColor).toBe("#ffff33");
    expect(yellow?.origin).toBe("ANTC");
    expect(yellow?.destination).toBe("MLBR");
    expect(yellow?.stationCount).toBe(3);
    // Colors are title-cased and sorted.
    expect(summary.lines.map((l) => l.colorName)).toEqual(["Green", "Red", "Yellow"]);

    // Stations: all 12 normalized and sorted by name.
    expect(summary.stations).toHaveLength(12);
    const names = summary.stations.map((s) => s.name);
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);

    const embr = summary.stations.find((s) => s.abbr === "EMBR");
    expect(embr).toBeDefined();
    expect(embr?.id).toBe("embr");
    expect(embr?.city).toBe("San Francisco");
    expect(typeof embr?.latitude).toBe("number");
    expect(embr?.latitude).toBeCloseTo(37.792, 3);
    // EMBR is on Yellow (routes 1/2) and Green (routes 5/6); labels sorted.
    expect(embr?.lines).toEqual(["Green", "Yellow"]);

    const mcar = summary.stations.find((s) => s.abbr === "MCAR");
    expect(mcar?.lines).toEqual(["Red"]);

    // Advisories: the "No delays" line is filtered out, the real delay remains.
    expect(summary.advisories).toHaveLength(1);
    expect(summary.advisories[0].type).toBe("DELAY");
    expect(summary.advisories[0].station).toBe("EMBR");
    expect(summary.advisories[0].description).toContain("medical emergency");

    // Elevator: "all elevators in service" filtered out, the outage remains.
    expect(summary.elevator).toHaveLength(1);
    expect(summary.elevator[0].description).toContain("Powell St.");

    // Departures: per-station board populated and keyed by lowercase abbr.
    const embrBoard = stationBoards["embr"];
    expect(embrBoard).toBeDefined();
    expect(embrBoard.abbr).toBe("EMBR");
    expect(embrBoard.departures).toHaveLength(3);
    // "Leaving" sorts first (null minutes), then 3, then 8.
    expect(embrBoard.departures[0].minutes).toBeNull();
    expect(embrBoard.departures[1].minutes).toBe(3);
    expect(embrBoard.departures[2].minutes).toBe(8);
    // Estimate fields are parsed.
    const leaving = embrBoard.departures[0];
    expect(leaving.destination).toBe("Antioch");
    expect(leaving.destinationAbbr).toBe("ANTC");
    expect(leaving.length).toBe(10);
    expect(leaving.bikesAllowed).toBe(true);
    expect(leaving.colorName).toBe("YELLOW");
    const delayed = embrBoard.departures.find((d) => d.minutes === 8);
    expect(delayed?.delaySeconds).toBe(60);
    expect(delayed?.bikesAllowed).toBe(false);

    // Hero stats reflect the parsed feeds.
    expect(summary.heroStats.lineCount).toBe(3);
    expect(summary.heroStats.stationCount).toBe(12);
    expect(summary.heroStats.activeAdvisories).toBe(1);
    expect(summary.heroStats.elevatorOutages).toBe(1);
    expect(summary.heroStats.trainsTracked).toBe(4); // 3 at EMBR + 1 at MONT

    // Default station prefers a busy core station with live departures.
    expect(summary.defaultStation).toBe("embr");
  }, 20000);

  it("throws when stations come back too thin (fallback keeps prior snapshot upstream)", async () => {
    mockFetch((url) => {
      if (url.includes("stn.aspx")) {
        return jsonResponse({
          root: { stations: { station: [{ name: "Only One", abbr: "ONE" }] } },
        });
      }
      return jsonResponse({});
    });

    await expect(buildBayAreaTransitSnapshotData()).rejects.toThrow(/too few stations/i);
  });

  it("does not crash and still throws cleanly on an empty stations response", async () => {
    mockFetch(() => jsonResponse({}));

    await expect(buildBayAreaTransitSnapshotData()).rejects.toThrow(/too few stations/i);
  });

  it("keeps the rest of the snapshot when the elevator feed errors", async () => {
    mockFetch((url) => {
      if (url.includes("bsa.aspx") && url.includes("cmd=elev")) {
        // Persistent 500 — fetchBartJson retries then throws; builder swallows it.
        return jsonResponse({ error: "boom" }, 500);
      }
      return defaultFetcher(url);
    });

    const { summary } = await buildBayAreaTransitSnapshotData();

    // Elevator gracefully degrades to empty without taking down the build.
    expect(summary.elevator).toEqual([]);
    expect(summary.heroStats.elevatorOutages).toBe(0);
    // Other feeds remain intact.
    expect(summary.lines.length).toBeGreaterThan(0);
    expect(summary.stations).toHaveLength(12);
    expect(summary.advisories).toHaveLength(1);
  }, 20000);
});
