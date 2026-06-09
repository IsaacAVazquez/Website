/**
 * @jest-environment node
 */
jest.mock("@/lib/golfSnapshot", () => ({
  createEmptyGolfPlayerSnapshot: jest.fn(() => ({
    player: null,
    tournamentStatus: {
      position: "—",
      totalToPar: 0,
      today: 0,
      thru: "—",
      status: "Snapshot unavailable",
      movement: 0,
      nextTeeTime: null,
    },
    roundByRound: [],
    scoring: {
      birdies: 0,
      bogeys: 0,
      pars: 0,
      eagles: 0,
      doubleBogeys: 0,
    },
    generatedAt: "2026-04-16T19:05:00.000Z",
  })),
  getGolfPlayerSnapshot: jest.fn(),
  isGolfPlayerIdShape: jest.fn(),
  isValidGolfPlayerId: jest.fn(),
}));

import { GET } from "../route";
import {
  getGolfPlayerSnapshot,
  isGolfPlayerIdShape,
  isValidGolfPlayerId,
} from "@/lib/golfSnapshot";

const mockGetGolfPlayerSnapshot =
  getGolfPlayerSnapshot as jest.MockedFunction<typeof getGolfPlayerSnapshot>;
const mockIsGolfPlayerIdShape =
  isGolfPlayerIdShape as jest.MockedFunction<typeof isGolfPlayerIdShape>;
const mockIsValidGolfPlayerId =
  isValidGolfPlayerId as jest.MockedFunction<typeof isValidGolfPlayerId>;

describe("GET /api/golf/players/[playerId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects malformed player ids with a 400 before hitting the data loader", async () => {
    // Shape-level rejection: "bad id with spaces!" wouldn't match the slug
    // pattern. Previously this route returned 404 for any invalid input;
    // now shape failures correctly surface as 400.
    mockIsGolfPlayerIdShape.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ playerId: "bad id!" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid player id/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetGolfPlayerSnapshot).not.toHaveBeenCalled();
  });

  it("returns 404 with no-store when the slug is well-formed but unknown", async () => {
    mockIsGolfPlayerIdShape.mockReturnValue(true);
    mockIsValidGolfPlayerId.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ playerId: "unknown-player" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/snapshot/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetGolfPlayerSnapshot).not.toHaveBeenCalled();
  });

  it("returns the golfer snapshot with cache headers", async () => {
    mockIsGolfPlayerIdShape.mockReturnValue(true);
    mockIsValidGolfPlayerId.mockReturnValue(true);
    mockGetGolfPlayerSnapshot.mockResolvedValue({
      player: {
        id: "scottie-scheffler",
        name: "Scottie Scheffler",
        country: "United States",
      },
      tournamentStatus: {
        position: "1",
        totalToPar: -8,
        today: -3,
        thru: "F",
        status: "In clubhouse",
        movement: 2,
        nextTeeTime: "1:40 PM ET",
      },
      roundByRound: [
        { round: 1, score: 66, relativeToPar: -5 },
        { round: 2, score: 68, relativeToPar: -3 },
      ],
      scoring: {
        birdies: 11,
        bogeys: 3,
        pars: 22,
        eagles: 0,
        doubleBogeys: 0,
      },
      generatedAt: "2026-04-16T19:05:00.000Z",
    });

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ playerId: "scottie-scheffler" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.player.name).toBe("Scottie Scheffler");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
    expect(mockGetGolfPlayerSnapshot).toHaveBeenCalledWith("scottie-scheffler");
  });

  it("returns a stable empty payload when the player lookup fails", async () => {
    mockIsGolfPlayerIdShape.mockReturnValue(true);
    mockIsValidGolfPlayerId.mockReturnValue(true);
    mockGetGolfPlayerSnapshot.mockRejectedValue(
      Object.assign(new Error("Golf player snapshot was not found."), {
        status: 503,
      })
    );

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ playerId: "scottie-scheffler" }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.player).toBeNull();
    expect(body.roundByRound).toEqual([]);
    // Errors must NOT be cached by the CDN.
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
