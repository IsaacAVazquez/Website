/**
 * @jest-environment node
 */
jest.mock("@/lib/bayAreaTransitSnapshot", () => ({
  createEmptyTransitStationBoard: jest.fn(() => ({
    id: "",
    abbr: "",
    name: "",
    departures: [],
    generatedAt: "2026-04-03T00:00:00.000Z",
  })),
  getTransitStationBoard: jest.fn(),
  isTransitStationIdShape: jest.fn(),
  isValidTransitStationId: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { GET } from "../route";
import {
  getTransitStationBoard,
  isTransitStationIdShape,
  isValidTransitStationId,
} from "@/lib/bayAreaTransitSnapshot";
import { logger } from "@/lib/logger";

const mockGetTransitStationBoard = getTransitStationBoard as jest.MockedFunction<
  typeof getTransitStationBoard
>;
const mockIsTransitStationIdShape = isTransitStationIdShape as jest.MockedFunction<
  typeof isTransitStationIdShape
>;
const mockIsValidTransitStationId = isValidTransitStationId as jest.MockedFunction<
  typeof isValidTransitStationId
>;
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>;

describe("GET /api/bay-area-transit/stations/[stationId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects malformed station ids with a 400 before hitting the data loader", async () => {
    mockIsTransitStationIdShape.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ stationId: "!" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid station id/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockIsValidTransitStationId).not.toHaveBeenCalled();
    expect(mockGetTransitStationBoard).not.toHaveBeenCalled();
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it("returns 404 with no-store when a shaped id is not in the snapshot", async () => {
    mockIsTransitStationIdShape.mockReturnValue(true);
    mockIsValidTransitStationId.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ stationId: "zzzz" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/not found/i);
    expect(body.departures).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetTransitStationBoard).not.toHaveBeenCalled();
    // A missing-but-well-formed id is expected input, not a server fault.
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it("guards a prototype key like 'constructor' with a 400, never reaching the loader", async () => {
    // Exercise the REAL guards. The shape regex (/^[a-z0-9]{2,8}$/) bars
    // "constructor" at the 400 stage, before the station list is consulted, so
    // the built-in can never resolve into a cacheable 200.
    const actual = jest.requireActual(
      "@/lib/bayAreaTransitSnapshot"
    ) as typeof import("@/lib/bayAreaTransitSnapshot");
    mockIsTransitStationIdShape.mockImplementation(actual.isTransitStationIdShape);
    mockIsValidTransitStationId.mockImplementation(actual.isValidTransitStationId);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ stationId: "constructor" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.departures).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetTransitStationBoard).not.toHaveBeenCalled();
  });

  it("returns the station board with cache headers", async () => {
    mockIsTransitStationIdShape.mockReturnValue(true);
    mockIsValidTransitStationId.mockReturnValue(true);
    mockGetTransitStationBoard.mockResolvedValue({
      id: "lake",
      abbr: "LAKE",
      name: "Lake Merritt",
      departures: [
        {
          destination: "Berryessa",
          destinationAbbr: "BERY",
          minutes: 3,
          platform: "1",
          direction: "South",
          length: 6,
          colorName: "ORANGE",
          hexColor: "#ff9933",
          delaySeconds: 0,
          bikesAllowed: true,
        },
      ],
      generatedAt: "2026-04-03T12:00:00.000Z",
    });

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ stationId: "lake" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe("Lake Merritt");
    expect(body.departures).toHaveLength(1);
    expect(body.departures[0].destinationAbbr).toBe("BERY");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=30, stale-while-revalidate=120"
    );
    expect(response.headers.get("X-Data-Revision")).toMatch(/^[a-f0-9]{64}$/);
    expect(mockGetTransitStationBoard).toHaveBeenCalledWith("lake", {
      preferLive: true,
    });
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it("reports stale-fallback when the departures came from the committed snapshot", async () => {
    mockIsTransitStationIdShape.mockReturnValue(true);
    mockIsValidTransitStationId.mockReturnValue(true);
    mockGetTransitStationBoard.mockResolvedValue({
      id: "embr",
      abbr: "EMBR",
      name: "Embarcadero",
      departures: [],
      // Inside the freshness window, so age alone would read as fresh.
      generatedAt: new Date().toISOString(),
      status: "stale-fallback",
    });

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ stationId: "embr" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Data-Status")).toBe("stale-fallback");
  });

  // Fremont dropped out of BART's departures feed during the 2026-09-27 track
  // work and the route answered 404 for it. The real guards and loader run
  // here against a live feed that carries Embarcadero and no Fremont.
  it("answers a real station that has no board with 200 and no departures", async () => {
    const actual = jest.requireActual(
      "@/lib/bayAreaTransitSnapshot"
    ) as typeof import("@/lib/bayAreaTransitSnapshot");
    mockIsTransitStationIdShape.mockImplementation(actual.isTransitStationIdShape);
    mockIsValidTransitStationId.mockImplementation(actual.isValidTransitStationId);
    mockGetTransitStationBoard.mockImplementation(actual.getTransitStationBoard);
    const fetchSpy = jest.spyOn(global, "fetch").mockImplementation((input) => {
      const url = String(input);
      const feed = url.includes("etd.aspx")
        ? {
            station: [
              {
                name: "Embarcadero",
                abbr: "EMBR",
                etd: [
                  {
                    destination: "Antioch",
                    abbreviation: "ANTC",
                    limited: "0",
                    estimate: [
                      {
                        minutes: "4",
                        platform: "2",
                        direction: "North",
                        length: "8",
                        color: "YELLOW",
                        hexcolor: "#ffff33",
                        bikeflag: "1",
                        delay: "0",
                        cancelflag: "0",
                        dynamicflag: "0",
                      },
                    ],
                  },
                ],
              },
            ],
            message: "Direction not supported for ALL ETD messages.",
          }
        : {
            bsa: [
              {
                station: "",
                description: { "#cdata-section": "No delays reported." },
                sms_text: { "#cdata-section": "No delays reported." },
              },
            ],
            message: "",
          };
      return Promise.resolve(
        new Response(
          JSON.stringify({
            "?xml": { "@version": "1.0", "@encoding": "utf-8" },
            root: {
              "@id": "1",
              uri: { "#cdata-section": url.replace(/key=[^&]+&/, "") },
              date: "09/27/2026",
              time: "12:03:47 PM PDT",
              ...feed,
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );
    });

    try {
      const response = await GET(new Request("http://localhost:3000"), {
        params: Promise.resolve({ stationId: "frmt" }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.name).toBe("Fremont");
      expect(body.departures).toEqual([]);
      expect(body.error).toBeUndefined();
      expect(response.headers.get("X-Data-Status")).toBe("fresh");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("logs and returns a stable empty payload when the loader throws a 5xx", async () => {
    mockIsTransitStationIdShape.mockReturnValue(true);
    mockIsValidTransitStationId.mockReturnValue(true);
    mockGetTransitStationBoard.mockRejectedValue(
      Object.assign(new Error("Transit station board is unavailable."), {
        status: 503,
      })
    );

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ stationId: "lake" }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/unavailable/i);
    expect(body.departures).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Transit station API error",
      expect.any(Error)
    );
  });
});
