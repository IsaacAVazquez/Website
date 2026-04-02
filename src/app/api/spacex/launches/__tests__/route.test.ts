/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/spacexData", () => ({
  getMissionLaunchCards: jest.fn(),
}));

import { GET } from "../route";
import { getMissionLaunchCards } from "@/lib/spacexData";

const mockGetMissionLaunchCards = getMissionLaunchCards as jest.MockedFunction<
  typeof getMissionLaunchCards
>;

describe("GET /api/spacex/launches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates status values before reaching the data layer", async () => {
    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/spacex/launches?status=invalid")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid status/i);
    expect(mockGetMissionLaunchCards).not.toHaveBeenCalled();
  });

  it("returns normalized launch cards with cache headers", async () => {
    mockGetMissionLaunchCards.mockResolvedValue([
      {
        id: "5eb87d46ffd86e000604b388",
        name: "CCtCap Demo Mission 2",
        flightNumber: 94,
        upcoming: false,
        success: true,
        details: null,
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
          webcast: null,
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
      },
    ]);

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/spacex/launches?status=past&limit=6")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.launches).toHaveLength(1);
    expect(mockGetMissionLaunchCards).toHaveBeenCalledWith("past", 6);
    expect(response.headers.get("Cache-Control")).toContain("max-age=120");
  });
});
