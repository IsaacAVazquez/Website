/**
 * @jest-environment node
 */
import type { TransitSnapshot } from "@/types/bayAreaTransit";

// A compact stand-in for the committed artifact, which the scheduled refresh
// rewrites every six hours. Fremont and Oakland Airport are in the station list
// with no board, as they were in the snapshot committed on 2026-09-27.
const mockCommitted: TransitSnapshot = {
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
      stationCount: 3,
      activeAdvisories: 0,
      elevatorOutages: 0,
      trainsTracked: 1,
    },
    lines: [],
    stations: [
      {
        id: "embr",
        abbr: "EMBR",
        name: "Embarcadero",
        city: "San Francisco",
        latitude: 37.792874,
        longitude: -122.39702,
        lines: ["Blue", "Green", "Red", "Yellow"],
      },
      {
        id: "frmt",
        abbr: "FRMT",
        name: "Fremont",
        city: "Fremont",
        latitude: 37.557465,
        longitude: -121.976608,
        lines: ["Green", "Orange"],
      },
      {
        id: "oakl",
        abbr: "OAKL",
        name: "Oakland International Airport",
        city: "Oakland",
        latitude: 37.713238,
        longitude: -122.212191,
        lines: ["Grey"],
      },
    ],
    advisories: [],
    elevator: [],
    sectionStatus: {
      advisories: "fresh",
      elevator: "fresh",
      departures: "fresh",
    },
    defaultStation: "embr",
  },
  stationBoards: {
    embr: {
      id: "embr",
      abbr: "EMBR",
      name: "Embarcadero",
      departures: [
        {
          destination: "Dublin/Pleasanton",
          destinationAbbr: "DUBL",
          minutes: 7,
          platform: "2",
          direction: "North",
          length: 8,
          colorName: "BLUE",
          hexColor: "#0099cc",
          delaySeconds: 0,
          bikesAllowed: true,
        },
      ],
      generatedAt: "2026-09-27T17:14:27.469Z",
    },
  },
};

jest.mock("@/data/bayAreaTransitSnapshot", () => ({
  bayAreaTransitSnapshot: mockCommitted,
}));

// --- Real response shapes, copied from api.bart.gov on 2026-09-27 -------------

const XML_HEADER = { "@version": "1.0", "@encoding": "utf-8" };

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

const REAL_NO_ADVISORIES = realRoot("bsa.aspx?cmd=bsa", {
  bsa: [
    {
      station: "",
      description: { "#cdata-section": "No delays reported." },
      sms_text: { "#cdata-section": "No delays reported." },
    },
  ],
  message: "",
});

function realEtdAll(stations: unknown[]) {
  return realRoot("etd.aspx?cmd=etd&orig=ALL", {
    station: stations,
    message: "Direction not supported for ALL ETD messages.",
  });
}

function realStation(name: string, abbr: string, minutes: string) {
  return {
    name,
    abbr,
    etd: [
      {
        destination: "Daly City",
        abbreviation: "DALY",
        limited: "0",
        estimate: [
          {
            minutes,
            platform: "1",
            direction: "South",
            length: "8",
            color: "GREEN",
            hexcolor: "#339933",
            bikeflag: "1",
            delay: "0",
            cancelflag: "0",
            dynamicflag: "0",
          },
        ],
      },
    ],
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function mockBart(departures: () => Response) {
  return jest.spyOn(global, "fetch").mockImplementation((input: unknown) => {
    const url = String(input);
    return Promise.resolve(
      url.includes("etd.aspx") ? departures() : jsonResponse(REAL_NO_ADVISORIES)
    );
  });
}

/** The library keeps its live cache at module level, so each test loads a fresh copy. */
async function loadLibrary() {
  jest.resetModules();
  return import("../bayAreaTransitSnapshot");
}

describe("bayAreaTransitSnapshot", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("when every BART feed fails", () => {
    it("labels the committed snapshot as the last good copy", async () => {
      jest
        .spyOn(global, "fetch")
        .mockImplementation(() =>
          Promise.resolve(jsonResponse(REAL_ERROR_BODY, 400))
        );
      const { getTransitSummary, getTransitStationBoard } = await loadLibrary();

      const summary = await getTransitSummary({ preferLive: true });
      const board = await getTransitStationBoard("embr", { preferLive: true });

      expect(summary.sectionStatus).toEqual({
        advisories: "stale-fallback",
        elevator: "stale-fallback",
        departures: "stale-fallback",
      });
      expect(summary.system?.generatedAt).toBe("2026-09-27T17:14:27.469Z");
      expect(board.departures).toHaveLength(1);
      expect(board.status).toBe("stale-fallback");
      // The committed snapshot still backs the page's first render as it is.
      expect(mockCommitted.summary.sectionStatus?.departures).toBe("fresh");
    });

    it("remembers the failure so the next request does not wait on BART again", async () => {
      const fetchSpy = jest
        .spyOn(global, "fetch")
        .mockImplementation(() =>
          Promise.resolve(jsonResponse(REAL_ERROR_BODY, 400))
        );
      const clock = jest.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);
      const { getTransitSummary, getTransitStationBoard } = await loadLibrary();

      await getTransitSummary({ preferLive: true });
      expect(fetchSpy).toHaveBeenCalledTimes(3);

      clock.mockReturnValue(1_800_000_000_000 + 29_000);
      await getTransitStationBoard("embr", { preferLive: true });
      expect(fetchSpy).toHaveBeenCalledTimes(3);

      clock.mockReturnValue(1_800_000_000_000 + 31_000);
      await getTransitSummary({ preferLive: true });
      expect(fetchSpy).toHaveBeenCalledTimes(6);
    });
  });

  describe("station ids", () => {
    it("accepts every station in the list, with or without a board", async () => {
      const { isValidTransitStationId } = await loadLibrary();

      expect(isValidTransitStationId("embr")).toBe(true);
      expect(isValidTransitStationId("frmt")).toBe(true);
      expect(isValidTransitStationId("oakl")).toBe(true);
    });

    it("rejects an id that is not a BART station", async () => {
      const { isValidTransitStationId } = await loadLibrary();

      expect(isValidTransitStationId("zzzz")).toBe(false);
      expect(isValidTransitStationId("EMBR")).toBe(false);
      expect(isValidTransitStationId("constructor")).toBe(false);
    });
  });

  describe("station boards", () => {
    it("serves the live board for a station the committed map lacks", async () => {
      mockBart(() =>
        jsonResponse(realEtdAll([realStation("Fremont", "FRMT", "4")]))
      );
      const { getTransitStationBoard } = await loadLibrary();

      const board = await getTransitStationBoard("frmt", { preferLive: true });

      expect(board.name).toBe("Fremont");
      expect(board.departures.map((d) => d.minutes)).toEqual([4]);
      expect(board.status).toBe("fresh");
    });

    it("answers a real station that has no board with no departures", async () => {
      mockBart(() =>
        jsonResponse(realEtdAll([realStation("Embarcadero", "EMBR", "4")]))
      );
      const { getTransitStationBoard, getTransitSummary } = await loadLibrary();

      const board = await getTransitStationBoard("frmt", { preferLive: true });
      const summary = await getTransitSummary({ preferLive: true });

      expect(board).toEqual({
        id: "frmt",
        abbr: "FRMT",
        name: "Fremont",
        departures: [],
        generatedAt: summary.system?.generatedAt,
        status: "fresh",
      });
    });

    it("answers the committed snapshot's missing stations the same way", async () => {
      const { getTransitStationBoard } = await loadLibrary();

      const board = await getTransitStationBoard("oakl");

      expect(board.name).toBe("Oakland International Airport");
      expect(board.departures).toEqual([]);
    });

    it("rejects an id that is not a BART station with a 404", async () => {
      const { getTransitStationBoard } = await loadLibrary();

      await expect(getTransitStationBoard("zzzz")).rejects.toMatchObject({
        status: 404,
      });
    });

    it("serves no trains when BART answers with an empty feed", async () => {
      mockBart(() =>
        jsonResponse(
          realRoot("etd.aspx?cmd=etd&orig=ALL", {
            message: { warning: "No data matched your criteria." },
          })
        )
      );
      const { getTransitStationBoard, getTransitSummary } = await loadLibrary();

      const summary = await getTransitSummary({ preferLive: true });
      const board = await getTransitStationBoard("embr", { preferLive: true });

      expect(summary.heroStats.trainsTracked).toBe(0);
      expect(summary.sectionStatus?.departures).toBe("fresh");
      expect(board.departures).toEqual([]);
      expect(board.status).toBe("fresh");
    });
  });
});
