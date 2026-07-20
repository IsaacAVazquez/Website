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
    // Exercise the REAL guards. isValidTransitStationId uses the prototype-aware
    // `in` operator, so `"constructor" in stationBoards` is true — the only thing
    // stopping the built-in from resolving into a cacheable 200 is the shape
    // regex (/^[a-z0-9]{2,8}$/), which bars "constructor" at the 400 stage before
    // the membership check ever runs.
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
