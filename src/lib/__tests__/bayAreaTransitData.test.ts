/**
 * @jest-environment node
 */
import {
  buildBayAreaTransitLiveSnapshotData,
  buildBayAreaTransitSnapshotData,
} from "../bayAreaTransitData";
import type {
  TransitSnapshot,
  TransitStationBoard,
} from "@/types/bayAreaTransit";

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

/** Previously committed boards, with one departure each. */
function makePreviousBoards(ids: string[]): Record<string, TransitStationBoard> {
  return Object.fromEntries(
    ids.map((id) => [
      id,
      {
        id,
        abbr: id.toUpperCase(),
        name: id.toUpperCase(),
        departures: [
          {
            destination: "Antioch",
            destinationAbbr: "ANTC",
            minutes: 5,
            platform: "2",
            direction: "North",
            length: 10,
            colorName: "Yellow",
            hexColor: "#ffff33",
            delaySeconds: 0,
            bikesAllowed: true,
          },
        ],
        generatedAt: "2026-06-22T16:15:00.000Z",
      },
    ])
  );
}

/** An etd.aspx response covering only the named stations. */
function etdWithStations(names: Array<{ name: string; abbr: string }>) {
  return {
    root: {
      date: "06/22/2026",
      time: "04:15:00 AM PDT",
      station: names.map(({ name, abbr }) => ({
        name,
        abbr,
        etd: [
          {
            destination: "Antioch",
            abbreviation: "ANTC",
            estimate: [
              {
                minutes: "9",
                platform: "2",
                direction: "North",
                length: "10",
                color: "YELLOW",
                hexcolor: "#ffff33",
                bikeflag: "1",
                delay: "0",
              },
            ],
          },
        ],
      })),
    },
  };
}

function fetcherWithEtd(etd: unknown): (url: string) => Response {
  return (url) =>
    url.includes("etd.aspx") ? jsonResponse(etd) : defaultFetcher(url);
}

// --- Real response shapes, copied from api.bart.gov on 2026-09-27 -------------

const XML_HEADER = { "@version": "1.0", "@encoding": "utf-8" };

function realRoot(command: string, body: Record<string, unknown>) {
  return {
    "?xml": XML_HEADER,
    root: {
      "@id": "1",
      uri: { "#cdata-section": `http://api.bart.gov/api/${command}&json=y` },
      date: "09/27/2026",
      time: "12:03:47 PM PDT",
      ...body,
    },
  };
}

function realEstimate(minutes: string, overrides: Record<string, string> = {}) {
  return {
    minutes,
    platform: "2",
    direction: "North",
    length: "8",
    color: "YELLOW",
    hexcolor: "#ffff33",
    bikeflag: "1",
    delay: "0",
    cancelflag: "0",
    dynamicflag: "0",
    ...overrides,
  };
}

function realStation(name: string, abbr: string, estimates: unknown[]) {
  return {
    name,
    abbr,
    etd: [
      {
        destination: "Antioch",
        abbreviation: "ANTC",
        limited: "0",
        estimate: estimates,
      },
    ],
  };
}

/** etd.aspx?cmd=etd&orig=ALL. The message is a plain string on a good day. */
function realEtdAll(stations: unknown[]) {
  return realRoot("etd.aspx?cmd=etd&orig=ALL", {
    station: stations,
    message: "Direction not supported for ALL ETD messages.",
  });
}

/** How BART answers when nothing matches, which is how a night with no trains reads. */
const REAL_ETD_NO_DATA = realRoot("etd.aspx?cmd=etd&orig=ALL", {
  message: { warning: "No data matched your criteria." },
});

/** A bad key, station, or command. BART sends it with a 400 today. */
const REAL_ERROR_BODY = {
  "?xml": XML_HEADER,
  root: {
    message: {
      error: {
        text: "Invalid key",
        details: "The api key was missing or invalid.",
      },
    },
  },
};

const REAL_ADVISORIES = realRoot("bsa.aspx?cmd=bsa", {
  bsa: [
    {
      "@id": "551",
      station: "BART",
      type: "DELAY",
      description: {
        "#cdata-section":
          "Passengers traveling between Union City and Warm Springs this weekend must transfer to a free bus while crews make track upgrades. ",
      },
      sms_text: {
        "#cdata-section":
          "Riders between UCTY and warm this weekend must transfer to a free bus.",
      },
      posted: "Sun Sep 27 2026 07:50 AM PDT",
      expires: "No time provided.",
    },
  ],
  message: "",
});

const REAL_ELEVATORS = realRoot("bsa.aspx?cmd=elev", {
  bsa: [
    {
      "@id": "09271239",
      station: "BART",
      type: "ELEVATOR",
      description: {
        "#cdata-section":
          "There are 2 elevators out of service at this time: 24TH: Station; PITT: Station - SF/East Bay",
      },
      sms_text: {
        "#cdata-section": "2 elevs out of svc: 24TH: stn; PITT: stn - sf/East Bay",
      },
      posted: "",
      expires: "",
    },
  ],
  message: "",
});

interface LiveFeeds {
  advisories?: () => Response;
  elevators?: () => Response;
  departures?: () => Response;
}

function liveFetcher(feeds: LiveFeeds = {}): Fetcher {
  return (url) => {
    if (url.includes("cmd=elev")) {
      return feeds.elevators?.() ?? jsonResponse(REAL_ELEVATORS);
    }
    if (url.includes("cmd=bsa")) {
      return feeds.advisories?.() ?? jsonResponse(REAL_ADVISORIES);
    }
    if (url.includes("etd.aspx")) {
      return (
        feeds.departures?.() ??
        jsonResponse(
          realEtdAll([
            realStation("Embarcadero", "EMBR", [
              realEstimate("Leaving"),
              realEstimate("12"),
            ]),
            realStation("Lake Merritt", "LAKE", [realEstimate("6")]),
          ])
        )
      );
    }
    return jsonResponse(REAL_ERROR_BODY, 400);
  };
}

/** The committed snapshot the live builder falls back on. */
function makeFallbackSnapshot(): TransitSnapshot {
  return {
    summary: {
      system: {
        name: "Bay Area Rapid Transit",
        abbr: "BART",
        source: "BART public API (api.bart.gov)",
        feedTime: "09/27/2026 10:14:18 AM PDT",
        generatedAt: "2026-09-27T17:14:27.469Z",
        seed: false,
      },
      heroStats: {
        lineCount: 6,
        stationCount: 50,
        activeAdvisories: 1,
        elevatorOutages: 1,
        trainsTracked: 4,
      },
      lines: [],
      stations: [],
      advisories: [
        {
          id: "advisory-0",
          type: "DELAY",
          description: "The advisory in the committed snapshot.",
          station: "BART",
          posted: "Sun Sep 27 2026 07:50 AM PDT",
        },
      ],
      elevator: [
        {
          id: "elevator-0",
          description: "The elevator outage in the committed snapshot.",
          posted: "",
        },
      ],
      sectionStatus: {
        advisories: "fresh",
        elevator: "fresh",
        departures: "fresh",
      },
      defaultStation: "embr",
    },
    stationBoards: makePreviousBoards(["embr", "mont", "powl", "12th"]),
  };
}

/**
 * A feed that never answers. AbortSignal.timeout runs on a timer Jest cannot
 * fake, so the signal arrives already timed out and the stub rejects the way a
 * real hung request does once its timer fires. The real reason is a
 * DOMException named TimeoutError, which Jest builds in another realm, so a
 * plain Error carries the name here to keep `instanceof Error` true.
 */
function mockHungFetch() {
  const timeout = jest
    .spyOn(AbortSignal, "timeout")
    .mockImplementation(() =>
      AbortSignal.abort(
        Object.assign(new Error("The operation timed out."), {
          name: "TimeoutError",
        })
      )
    );
  const fetchSpy = jest
    .spyOn(global, "fetch")
    .mockImplementation((_input: unknown, init?: RequestInit) =>
      Promise.reject(init?.signal?.reason)
    );
  return { timeout, fetchSpy };
}

describe("buildBayAreaTransitSnapshotData", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // BART's etd.aspx?cmd=etd&orig=ALL only returns stations with a departure
  // inside its lookahead window, so a successful pre-service call can come back
  // with one station instead of forty-plus. Committing that collapses
  // stationBoards and makes every other station route 404.
  it("keeps the previous boards when the departures feed collapses", async () => {
    mockFetch(
      fetcherWithEtd(etdWithStations([{ name: "Embarcadero", abbr: "EMBR" }]))
    );

    const previousBoards = makePreviousBoards(["embr", "mont", "powl", "12th"]);
    const { summary, stationBoards } = await buildBayAreaTransitSnapshotData({
      previousBoards,
    });

    expect(Object.keys(stationBoards).sort()).toEqual([
      "12th",
      "embr",
      "mont",
      "powl",
    ]);
    expect(summary.sectionStatus?.departures).toBe("stale-fallback");
    // trainsTracked is recomputed from the boards actually shipped.
    expect(summary.heroStats.trainsTracked).toBe(4);
  });

  it("accepts a fresh feed that still covers at least half the previous boards", async () => {
    mockFetch(
      fetcherWithEtd(
        etdWithStations([
          { name: "Embarcadero", abbr: "EMBR" },
          { name: "Montgomery St.", abbr: "MONT" },
        ])
      )
    );

    // Two fresh against four previous is exactly half, so it is not degraded.
    // A proportional floor rather than "fewer than before", so a genuinely
    // closed station cannot ratchet the guard permanently shut.
    const { summary, stationBoards } = await buildBayAreaTransitSnapshotData({
      previousBoards: makePreviousBoards(["embr", "mont", "powl", "12th"]),
    });

    expect(Object.keys(stationBoards).sort()).toEqual(["embr", "mont"]);
    expect(summary.sectionStatus?.departures).toBe("fresh");
    expect(summary.heroStats.trainsTracked).toBe(2);
  });

  it("uses the fresh boards when there is no previous snapshot", async () => {
    mockFetch(defaultFetcher);

    const { summary, stationBoards } = await buildBayAreaTransitSnapshotData();

    expect(Object.keys(stationBoards).sort()).toEqual(["embr", "mont"]);
    expect(summary.sectionStatus?.departures).toBe("fresh");
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
    // The first direction's running order, kept as BART lists it.
    expect(yellow?.stationSequence).toEqual(["EMBR", "MONT", "POWL"]);
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
    expect(summary.sectionStatus?.elevator).toBe("fresh");

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
    expect(summary.sectionStatus?.elevator).toBe("unavailable");
    // Other feeds remain intact.
    expect(summary.lines.length).toBeGreaterThan(0);
    expect(summary.stations).toHaveLength(12);
    expect(summary.advisories).toHaveLength(1);
  }, 20000);

  it("uses BART_API_KEY from the env when set, falling back to the demo key", async () => {
    const spy = mockFetch(defaultFetcher);
    const priorKey = process.env.BART_API_KEY;
    process.env.BART_API_KEY = "TEST-KEY-1234";

    try {
      await buildBayAreaTransitSnapshotData();
      const urls = spy.mock.calls.map((call) => String(call[0]));
      expect(urls.length).toBeGreaterThan(0);
      expect(urls.every((url) => url.includes("key=TEST-KEY-1234"))).toBe(true);

      spy.mockClear();
      delete process.env.BART_API_KEY;
      await buildBayAreaTransitSnapshotData();
      const fallbackUrls = spy.mock.calls.map((call) => String(call[0]));
      expect(
        fallbackUrls.every((url) => url.includes("key=MW9S-E7SL-26DU-VV8V"))
      ).toBe(true);
    } finally {
      if (priorKey === undefined) {
        delete process.env.BART_API_KEY;
      } else {
        process.env.BART_API_KEY = priorKey;
      }
    }
  }, 20000);

  // The committed boards are the cold start fallback, so an empty overnight
  // feed must not replace them. The request path makes the opposite choice.
  it("keeps the previous boards when an overnight feed has no departures", async () => {
    mockFetch(fetcherWithEtd(REAL_ETD_NO_DATA));

    const { summary, stationBoards } = await buildBayAreaTransitSnapshotData({
      previousBoards: makePreviousBoards(["embr", "mont", "powl", "12th"]),
    });

    expect(Object.keys(stationBoards)).toHaveLength(4);
    expect(summary.sectionStatus?.departures).toBe("stale-fallback");
    expect(summary.heroStats.trainsTracked).toBe(4);
  });

  it("leaves a cancelled train out of the committed boards", async () => {
    mockFetch(
      fetcherWithEtd(
        realEtdAll([
          realStation("Embarcadero", "EMBR", [
            realEstimate("4", { cancelflag: "1" }),
            realEstimate("19"),
          ]),
        ])
      )
    );

    const { summary, stationBoards } = await buildBayAreaTransitSnapshotData();

    expect(stationBoards.embr.departures.map((d) => d.minutes)).toEqual([19]);
    expect(summary.heroStats.trainsTracked).toBe(1);
  });

  it("keeps fifteen seconds and three attempts for the scheduled build", async () => {
    jest.useFakeTimers();
    try {
      const { timeout, fetchSpy } = mockHungFetch();

      const build = buildBayAreaTransitSnapshotData();
      const settled = expect(build).rejects.toMatchObject({
        name: "TimeoutError",
      });
      // The one and two second waits between attempts.
      await jest.advanceTimersByTimeAsync(3_000);
      await settled;

      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(timeout.mock.calls.map(([ms]) => ms)).toEqual([
        15_000, 15_000, 15_000,
      ]);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("buildBayAreaTransitLiveSnapshotData", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reads the three live feeds over the committed catalog", async () => {
    mockFetch(liveFetcher());
    const fallback = makeFallbackSnapshot();

    const { summary, stationBoards } =
      await buildBayAreaTransitLiveSnapshotData(fallback);

    expect(Object.keys(stationBoards).sort()).toEqual(["embr", "lake"]);
    // "Leaving" sorts ahead of the timed train.
    expect(stationBoards.embr.departures.map((d) => d.minutes)).toEqual([
      null,
      12,
    ]);
    expect(stationBoards.embr.generatedAt).toBe(summary.system?.generatedAt);
    expect(summary.system?.generatedAt).not.toBe(
      fallback.summary.system?.generatedAt
    );
    expect(summary.system?.feedTime).toBe("09/27/2026 12:03:47 PM PDT");
    expect(summary.heroStats.trainsTracked).toBe(3);
    expect(summary.heroStats.lineCount).toBe(6);
    expect(summary.advisories).toHaveLength(1);
    expect(summary.advisories[0].description).toContain("Union City");
    expect(summary.elevator[0].description).toContain("2 elevators");
    expect(summary.sectionStatus).toEqual({
      advisories: "fresh",
      elevator: "fresh",
      departures: "fresh",
    });
  });

  it("keeps the committed copy of a feed that fails and says so", async () => {
    mockFetch(
      liveFetcher({ departures: () => jsonResponse(REAL_ERROR_BODY, 400) })
    );
    const fallback = makeFallbackSnapshot();

    const { summary, stationBoards } =
      await buildBayAreaTransitLiveSnapshotData(fallback);

    expect(stationBoards).toBe(fallback.stationBoards);
    expect(summary.heroStats.trainsTracked).toBe(4);
    expect(summary.sectionStatus).toEqual({
      advisories: "fresh",
      elevator: "fresh",
      departures: "stale-fallback",
    });
  });

  it("throws when every feed fails, so the caller can label the fallback", async () => {
    mockFetch(() => jsonResponse(REAL_ERROR_BODY, 400));

    await expect(
      buildBayAreaTransitLiveSnapshotData(makeFallbackSnapshot())
    ).rejects.toThrow(/every bart live feed was unavailable/i);
  });

  it("reads an error inside a 200 response as a failed feed", async () => {
    mockFetch(() => jsonResponse(REAL_ERROR_BODY));

    await expect(
      buildBayAreaTransitLiveSnapshotData(makeFallbackSnapshot())
    ).rejects.toThrow(/every bart live feed was unavailable/i);
  });

  it("drops BART's placeholder line for a day with no advisories", async () => {
    // What bsa.aspx?cmd=bsa answered on 2026-10-09 with nothing posted.
    mockFetch(
      liveFetcher({
        advisories: () =>
          jsonResponse({
            root: {
              bsa: [
                {
                  station: "",
                  description: { "#cdata-section": "No advisories issued." },
                  sms_text: { "#cdata-section": "No advisories issued." },
                },
              ],
            },
          }),
      })
    );
    const fallback = makeFallbackSnapshot();

    const { summary } = await buildBayAreaTransitLiveSnapshotData(fallback);

    expect(summary.advisories).toEqual([]);
    expect(summary.heroStats.activeAdvisories).toBe(0);
    expect(summary.sectionStatus?.advisories).toBe("fresh");
  });

  it("keeps the committed advisories when that feed answers 200 with an error", async () => {
    mockFetch(liveFetcher({ advisories: () => jsonResponse(REAL_ERROR_BODY) }));
    const fallback = makeFallbackSnapshot();

    const { summary } = await buildBayAreaTransitLiveSnapshotData(fallback);

    expect(summary.advisories).toEqual(fallback.summary.advisories);
    expect(summary.heroStats.activeAdvisories).toBe(1);
    expect(summary.sectionStatus?.advisories).toBe("stale-fallback");
    expect(summary.sectionStatus?.departures).toBe("fresh");
  });

  it("serves no boards when BART answers with no departures", async () => {
    mockFetch(liveFetcher({ departures: () => jsonResponse(REAL_ETD_NO_DATA) }));

    const { summary, stationBoards } =
      await buildBayAreaTransitLiveSnapshotData(makeFallbackSnapshot());

    expect(stationBoards).toEqual({});
    expect(summary.heroStats.trainsTracked).toBe(0);
    expect(summary.sectionStatus?.departures).toBe("fresh");
    expect(summary.defaultStation).toBe("embr");
  });

  // The shape api.bart.gov gave for Fremont during the 2026-09-27 track work.
  it("reads a station listed with no trains as an empty board", async () => {
    mockFetch(
      liveFetcher({
        departures: () =>
          jsonResponse(
            realRoot("etd.aspx?cmd=etd&orig=ALL", {
              station: [{ name: "Fremont", abbr: "FRMT" }],
              message: { warning: "No data matched your criteria." },
            })
          ),
      })
    );

    const { stationBoards } = await buildBayAreaTransitLiveSnapshotData(
      makeFallbackSnapshot()
    );

    expect(Object.keys(stationBoards)).toEqual(["frmt"]);
    expect(stationBoards.frmt.departures).toEqual([]);
  });

  it("leaves a cancelled train off the board", async () => {
    mockFetch(
      liveFetcher({
        departures: () =>
          jsonResponse(
            realEtdAll([
              realStation("Embarcadero", "EMBR", [
                realEstimate("4", { cancelflag: "1" }),
                realEstimate("19"),
              ]),
            ])
          ),
      })
    );

    const { summary, stationBoards } =
      await buildBayAreaTransitLiveSnapshotData(makeFallbackSnapshot());

    expect(stationBoards.embr.departures.map((d) => d.minutes)).toEqual([19]);
    expect(summary.heroStats.trainsTracked).toBe(1);
  });

  it("gives each live feed one attempt and four seconds", async () => {
    const { timeout, fetchSpy } = mockHungFetch();

    await expect(
      buildBayAreaTransitLiveSnapshotData(makeFallbackSnapshot())
    ).rejects.toThrow(/every bart live feed was unavailable/i);

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(timeout.mock.calls.map(([ms]) => ms)).toEqual([4_000, 4_000, 4_000]);
  });
});
