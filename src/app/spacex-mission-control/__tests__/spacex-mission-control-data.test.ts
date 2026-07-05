import { loadMissionControlInitialData } from "../spacex-mission-control-data";
import type {
  MissionControlSearchState,
  MissionControlSummary,
  MissionLaunchCard,
  MissionLaunchDetail,
} from "@/types/spacex";
import {
  getMissionControlCadence,
  getMissionControlSummary,
  getMissionControlVehicleCatalogData,
  getMissionLaunchCards,
  getMissionLaunchDetail,
} from "@/lib/spacexData";

jest.mock("@/lib/spacexData", () => ({
  getMissionControlSummary: jest.fn(),
  getMissionLaunchCards: jest.fn(),
  getMissionLaunchDetail: jest.fn(),
  getMissionControlCadence: jest.fn(),
  getMissionControlVehicleCatalogData: jest.fn(),
}));

const mockGetMissionControlSummary = jest.mocked(getMissionControlSummary);
const mockGetMissionLaunchCards = jest.mocked(getMissionLaunchCards);
const mockGetMissionLaunchDetail = jest.mocked(getMissionLaunchDetail);
const mockGetMissionControlCadence = jest.mocked(getMissionControlCadence);
const mockGetMissionControlVehicleCatalogData = jest.mocked(getMissionControlVehicleCatalogData);

const baseLinks = {
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
};

const launchCard: MissionLaunchCard = {
  id: "5eb87d46ffd86e000604b388",
  name: "Demo-2",
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
  patchImage: "https://images.example.com/demo-2-patch.png",
  vehicleImage: "https://images.example.com/demo-2-vehicle.png",
  crewCount: 2,
  payloadCount: 1,
  capsuleCount: 1,
  coreCount: 1,
  hasExactTime: true,
  isStaleSchedule: false,
  links: baseLinks,
};

const summary: MissionControlSummary = {
  heroLaunch: launchCard,
  nextLaunch: null,
  fallbackLaunch: launchCard,
  heroMode: "fallback",
  heroMessage: "No future mission published.",
  insights: [],
  generatedAt: "2026-04-12T00:00:00.000Z",
};

const detail: MissionLaunchDetail = {
  ...launchCard,
  staticFireDateUtc: null,
  window: 0,
  failures: [],
  rocket: null,
  launchpad: null,
  crew: [],
  payloads: [],
  capsules: [],
  cores: [],
};

describe("loadMissionControlInitialData", () => {
  beforeEach(() => {
    mockGetMissionControlSummary.mockReset();
    mockGetMissionLaunchCards.mockReset();
    mockGetMissionLaunchDetail.mockReset();
    mockGetMissionControlCadence.mockReset().mockReturnValue(null);
    mockGetMissionControlVehicleCatalogData.mockReset().mockReturnValue({});
  });

  it("preloads summary, board launches, and selected detail for the current route", async () => {
    const routeState: MissionControlSearchState = {
      status: "past",
      launch: launchCard.id,
      panel: "vehicle",
    };

    mockGetMissionControlSummary.mockResolvedValue(summary);
    mockGetMissionLaunchCards.mockResolvedValue([launchCard]);
    mockGetMissionLaunchDetail.mockResolvedValue(detail);

    const initialData = await loadMissionControlInitialData(routeState);

    expect(initialData).toEqual({
      summary,
      summaryError: null,
      launches: [launchCard],
      launchesError: null,
      detail,
      detailError: null,
      tapeRecentLaunches: [launchCard],
      tapeUpcomingLaunches: [launchCard],
      launchDetails: {},
      cadence: null,
    });
    expect(mockGetMissionLaunchCards).toHaveBeenCalledWith("past", 10);
    expect(mockGetMissionLaunchDetail).toHaveBeenCalledWith(launchCard.id);
  });

  it("keeps successful payloads when another preload request fails", async () => {
    const routeState: MissionControlSearchState = {
      status: "upcoming",
      launch: launchCard.id,
      panel: "overview",
    };

    mockGetMissionControlSummary.mockRejectedValue(
      Object.assign(new Error("Launch Library temporarily rate limited"), { status: 429 })
    );
    mockGetMissionLaunchCards.mockResolvedValue([launchCard]);
    mockGetMissionLaunchDetail.mockRejectedValue(new Error("Launch not found"));

    const initialData = await loadMissionControlInitialData(routeState);

    expect(initialData.summary).toBeNull();
    expect(initialData.summaryError).toBe(
      "Live SpaceX data is temporarily rate limited. Retry shortly."
    );
    expect(initialData.launches).toEqual([launchCard]);
    expect(initialData.launchesError).toBeNull();
    expect(initialData.detail).toBeNull();
    expect(initialData.detailError).toBe("Launch not found");
  });

  it("skips detail preloading when no launch is selected", async () => {
    const routeState: MissionControlSearchState = {
      status: "upcoming",
      launch: null,
      panel: "overview",
    };

    mockGetMissionControlSummary.mockResolvedValue(summary);
    mockGetMissionLaunchCards.mockResolvedValue([launchCard]);

    const initialData = await loadMissionControlInitialData(routeState);

    expect(initialData.detail).toBeNull();
    expect(initialData.detailError).toBeNull();
    expect(mockGetMissionLaunchDetail).not.toHaveBeenCalled();
  });
});
