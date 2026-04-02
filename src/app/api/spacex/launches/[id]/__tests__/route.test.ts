/**
 * @jest-environment node
 */
jest.mock("@/lib/spacexData", () => ({
  getMissionLaunchDetail: jest.fn(),
  isValidMissionLaunchId: jest.fn(),
}));

import { GET } from "../route";
import { getMissionLaunchDetail, isValidMissionLaunchId } from "@/lib/spacexData";

const mockGetMissionLaunchDetail = getMissionLaunchDetail as jest.MockedFunction<
  typeof getMissionLaunchDetail
>;
const mockIsValidMissionLaunchId = isValidMissionLaunchId as jest.MockedFunction<
  typeof isValidMissionLaunchId
>;

describe("GET /api/spacex/launches/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsValidMissionLaunchId.mockReturnValue(true);
  });

  it("rejects invalid launch ids", async () => {
    mockIsValidMissionLaunchId.mockReturnValue(false);

    const response = await GET(new Request("https://isaacavazquez.com"), {
      params: Promise.resolve({ id: "bad-id" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid launch id/i);
    expect(mockGetMissionLaunchDetail).not.toHaveBeenCalled();
  });

  it("returns 404s from the upstream-backed data layer cleanly", async () => {
    mockGetMissionLaunchDetail.mockRejectedValue(
      Object.assign(new Error("Launch not found"), { status: 404 })
    );

    const response = await GET(new Request("https://isaacavazquez.com"), {
      params: Promise.resolve({ id: "5eb87d46ffd86e000604b388" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/launch not found/i);
  });

  it("returns detail payloads with longer cache headers", async () => {
    mockGetMissionLaunchDetail.mockResolvedValue({
      id: "5eb87d46ffd86e000604b388",
      name: "CCtCap Demo Mission 2",
      flightNumber: 94,
      upcoming: false,
      success: true,
      details: "Crewed demo mission",
      dateUtc: "2020-05-30T19:22:00.000Z",
      dateUnix: 1590866520,
      dateLocal: "2020-05-30T15:22:00-04:00",
      datePrecision: "hour",
      tbd: false,
      net: false,
      rocketName: "Falcon 9",
      launchpadName: "KSC LC 39A",
      launchpadLocation: "Cape Canaveral, Florida",
      patchImage: null,
      crewCount: 2,
      payloadCount: 1,
      capsuleCount: 1,
      coreCount: 1,
      hasExactTime: true,
      isStaleSchedule: false,
      links: {
        webcast: "https://youtu.be/test",
        article: null,
        wikipedia: null,
        presskit: null,
        redditLaunch: null,
        redditCampaign: null,
        redditMedia: null,
        youtubeId: null,
        patchSmall: null,
        patchLarge: null,
        flickrOriginal: [],
      },
      staticFireDateUtc: null,
      window: 0,
      failures: [],
      rocket: null,
      launchpad: null,
      crew: [],
      payloads: [],
      capsules: [],
      cores: [],
    });

    const response = await GET(new Request("https://isaacavazquez.com"), {
      params: Promise.resolve({ id: "5eb87d46ffd86e000604b388" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("5eb87d46ffd86e000604b388");
    expect(response.headers.get("Cache-Control")).toContain("max-age=300");
  });
});
