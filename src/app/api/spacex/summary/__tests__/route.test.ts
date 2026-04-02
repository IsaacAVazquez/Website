/**
 * @jest-environment node
 */
import { GET } from "../route";
import { getMissionControlSummary } from "@/lib/spacexData";

jest.mock("@/lib/spacexData", () => ({
  getMissionControlSummary: jest.fn(),
}));

const mockGetMissionControlSummary = getMissionControlSummary as jest.MockedFunction<
  typeof getMissionControlSummary
>;

describe("GET /api/spacex/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the normalized summary payload with cache headers", async () => {
    mockGetMissionControlSummary.mockResolvedValue({
      heroLaunch: null,
      nextLaunch: null,
      fallbackLaunch: null,
      heroMode: "fallback",
      heroMessage: "No upcoming launch is currently available from the upstream API.",
      insights: [],
      generatedAt: "2026-04-01T00:00:00.000Z",
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.heroMode).toBe("fallback");
    expect(response.headers.get("Cache-Control")).toContain("max-age=120");
  });
});
