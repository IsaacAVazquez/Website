/**
 * @jest-environment node
 */
jest.mock("@/lib/laLigaSnapshot", () => ({
  createEmptyLaLigaTeamSnapshot: jest.fn(() => ({
    team: null,
    recentFixtures: [],
    upcomingFixtures: [],
    form: {
      sequence: [],
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
    generatedAt: "2026-04-03T00:00:00.000Z",
  })),
  getLaLigaTeamSnapshot: jest.fn(),
  isLaLigaTeamIdShape: jest.fn(),
  isValidLaLigaTeamId: jest.fn(),
}));

import { GET } from "../route";
import {
  getLaLigaTeamSnapshot,
  isLaLigaTeamIdShape,
  isValidLaLigaTeamId,
} from "@/lib/laLigaSnapshot";

const mockGetLaLigaTeamSnapshot = getLaLigaTeamSnapshot as jest.MockedFunction<
  typeof getLaLigaTeamSnapshot
>;
const mockIsLaLigaTeamIdShape = isLaLigaTeamIdShape as jest.MockedFunction<
  typeof isLaLigaTeamIdShape
>;
const mockIsValidLaLigaTeamId = isValidLaLigaTeamId as jest.MockedFunction<
  typeof isValidLaLigaTeamId
>;

describe("GET /api/la-liga/teams/[teamId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects malformed team ids with a 400 before hitting the data loader", async () => {
    mockIsLaLigaTeamIdShape.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "!" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid team id/i);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetLaLigaTeamSnapshot).not.toHaveBeenCalled();
  });

  it("returns 404 with no-store when a shaped id is not in the snapshot", async () => {
    mockIsLaLigaTeamIdShape.mockReturnValue(true);
    mockIsValidLaLigaTeamId.mockReturnValue(false);

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "zzzz" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.team).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockGetLaLigaTeamSnapshot).not.toHaveBeenCalled();
  });

  it("returns the club snapshot with cache headers", async () => {
    mockIsLaLigaTeamIdShape.mockReturnValue(true);
    mockIsValidLaLigaTeamId.mockReturnValue(true);
    mockGetLaLigaTeamSnapshot.mockResolvedValue({
      team: {
        id: "86",
        name: "Real Madrid CF",
        shortName: "Real Madrid",
        tla: "RMA",
        crest: null,
        venue: "Santiago Bernabeu",
        founded: 1902,
        clubColors: "White",
      },
      recentFixtures: [],
      upcomingFixtures: [],
      form: {
        sequence: ["W", "D", "W", "W", "L"],
        wins: 3,
        draws: 1,
        losses: 1,
        points: 10,
        goalsFor: 9,
        goalsAgainst: 4,
      },
      generatedAt: "2026-04-03T00:00:00.000Z",
    });

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "86" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.team.shortName).toBe("Real Madrid");
    expect(body.form.sequence).toEqual(["W", "D", "W", "W", "L"]);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=900"
    );
    expect(mockGetLaLigaTeamSnapshot).toHaveBeenCalledWith("86");
  });

  it("returns a stable empty payload when the team lookup fails", async () => {
    mockIsLaLigaTeamIdShape.mockReturnValue(true);
    mockIsValidLaLigaTeamId.mockReturnValue(true);
    mockGetLaLigaTeamSnapshot.mockRejectedValue(
      Object.assign(new Error("La Liga team snapshot was not found."), { status: 503 })
    );

    const response = await GET(new Request("http://localhost:3000"), {
      params: Promise.resolve({ teamId: "86" }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/snapshot/i);
    expect(body.team).toBeNull();
    expect(body.recentFixtures).toEqual([]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
