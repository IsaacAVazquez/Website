/**
 * @jest-environment node
 */
jest.mock("@/lib/formula1Snapshot", () => ({
  createEmptyFormula1Meeting: jest.fn(() => ({
    key: "",
    name: "Formula 1 meeting",
    officialName: "",
    location: "",
    countryName: "",
    countryCode: null,
    countryFlag: null,
    circuitKey: null,
    circuitShortName: "",
    circuitType: null,
    circuitImage: null,
    gmtOffset: null,
    startAt: "",
    endAt: "",
    status: "upcoming",
    hasSprint: false,
    raceSessionKey: null,
    raceStartsAt: null,
    sessions: [],
    classification: [],
    podium: [],
    resultPublished: false,
  })),
  getFormula1Meeting: jest.fn(),
  getFormula1Summary: jest.fn(),
  isFormula1MeetingKeyShape: jest.fn(),
  isValidFormula1MeetingKey: jest.fn(),
}));

import { GET } from "../route";
import {
  getFormula1Meeting,
  getFormula1Summary,
  isFormula1MeetingKeyShape,
  isValidFormula1MeetingKey,
} from "@/lib/formula1Snapshot";

const mockGetFormula1Meeting = getFormula1Meeting as jest.MockedFunction<
  typeof getFormula1Meeting
>;
const mockGetFormula1Summary = getFormula1Summary as jest.MockedFunction<
  typeof getFormula1Summary
>;
const mockIsFormula1MeetingKeyShape = isFormula1MeetingKeyShape as jest.MockedFunction<
  typeof isFormula1MeetingKeyShape
>;
const mockIsValidFormula1MeetingKey = isValidFormula1MeetingKey as jest.MockedFunction<
  typeof isValidFormula1MeetingKey
>;

describe("GET /api/formula-1/meetings/[meetingId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects malformed meeting ids with a 400 before hitting the data loader", async () => {
    mockIsFormula1MeetingKeyShape.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ meetingId: "not-a-key!" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid meeting id/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetFormula1Meeting).not.toHaveBeenCalled();
  });

  it("returns 404 with no-store when the key is well-formed but unknown", async () => {
    mockIsFormula1MeetingKeyShape.mockReturnValue(true);
    mockIsValidFormula1MeetingKey.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ meetingId: "9999" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/snapshot/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetFormula1Meeting).not.toHaveBeenCalled();
  });

  it("returns the meeting detail with cache headers", async () => {
    mockIsFormula1MeetingKeyShape.mockReturnValue(true);
    mockIsValidFormula1MeetingKey.mockReturnValue(true);
    mockGetFormula1Meeting.mockResolvedValue({
      key: "1281",
      name: "Japanese Grand Prix",
      officialName: "FORMULA 1 JAPANESE GRAND PRIX 2026",
      location: "Suzuka",
      countryName: "Japan",
      countryCode: "JPN",
      countryFlag: null,
      circuitKey: "46",
      circuitShortName: "Suzuka",
      circuitType: "Permanent",
      circuitImage: null,
      gmtOffset: "09:00:00",
      startAt: "2026-03-27T02:30:00+00:00",
      endAt: "2026-03-29T07:00:00+00:00",
      status: "completed",
      hasSprint: false,
      raceSessionKey: "11253",
      raceStartsAt: "2026-03-29T05:00:00+00:00",
      sessions: [],
      classification: [
        {
          position: 1,
          driverNumber: 63,
          driverName: "George RUSSELL",
          broadcastName: "G RUSSELL",
          acronym: "RUS",
          teamName: "Mercedes",
          teamColor: "#00D7B6",
          headshotUrl: null,
          lapsCompleted: 53,
          points: 25,
          status: "classified",
          statusLabel: "Finished",
          gapToLeaderLabel: "Leader",
          durationLabel: "1:28:03.403",
        },
      ],
      podium: [],
      resultPublished: true,
    });
    mockGetFormula1Summary.mockResolvedValue({
      generatedAt: "2026-04-15T00:00:00.000Z",
    } as Awaited<ReturnType<typeof getFormula1Summary>>);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ meetingId: "1281" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe("Japanese Grand Prix");
    expect(body.classification).toHaveLength(1);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
    expect(mockGetFormula1Meeting).toHaveBeenCalledWith("1281");
  });

  it("returns a stable empty payload when the meeting lookup fails", async () => {
    mockIsFormula1MeetingKeyShape.mockReturnValue(true);
    mockIsValidFormula1MeetingKey.mockReturnValue(true);
    mockGetFormula1Meeting.mockRejectedValue(
      Object.assign(new Error("Formula 1 meeting snapshot was not found."), {
        status: 503,
      })
    );

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ meetingId: "1281" }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.classification).toEqual([]);
    // Errors must NOT be cached by the CDN.
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
