import {
  getMissionControlSummary,
  getMissionLaunchCards,
  getMissionLaunchDetail,
  resetSpaceXDataCacheForTests,
} from "@/lib/spacexData";
import { setSpaceXImageManifestForTests } from "@/lib/spacexImageManifest";
import { setSpaceXSnapshotForTests } from "@/lib/spacexSnapshot";
import type {
  MissionControlSnapshot,
  MissionControlSummary,
  MissionLaunchCard,
  MissionLaunchDetail,
} from "@/types/spacex";

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const emptySnapshot: MissionControlSnapshot = {
  generatedAt: null,
  sourceLabel: null,
  summary: null,
  upcomingLaunches: [],
  pastLaunches: [],
  launchDetails: {},
  cadence: null,
};

const baseLaunch = {
  id: "63aa7636-d2b7-457f-a3e6-27e564e42941",
  name: "Falcon 9 Block 5 | Starlink Group 10-58",
  status: {
    id: 1,
    name: "Go",
    abbrev: "Go",
  },
  net: "2027-04-02T11:55:10Z",
  net_precision: {
    id: 0,
    name: "Second",
    abbrev: "SEC",
  },
  launch_service_provider: {
    id: 121,
    name: "SpaceX",
  },
  rocket: {
    id: 8951,
    configuration: {
      id: 164,
      name: "Falcon 9",
      full_name: "Falcon 9 Block 5",
      family: "Falcon",
      variant: "Block 5",
      manufacturer: {
        id: 121,
        name: "SpaceX",
      },
      image_url: "https://images.example.com/rocket-config.png",
      successful_launches: 566,
      failed_launches: 1,
      pending_launches: 104,
      launch_cost: "52000000",
      launch_mass: 549,
      length: 70,
      diameter: 3.65,
      maiden_flight: "2018-05-11",
      description: "Falcon 9 Block 5 launch vehicle.",
      wiki_url: "https://en.wikipedia.org/wiki/Falcon_9",
    },
  },
  mission: {
    id: 7546,
    name: "Starlink Group 10-58",
    description: "A batch of 29 satellites for the Starlink constellation.",
    type: "Communications",
    orbit: {
      id: 8,
      name: "Low Earth Orbit",
      abbrev: "LEO",
    },
    agencies: [
      {
        id: 121,
        name: "SpaceX",
        country_code: "USA",
      },
    ],
  },
  pad: {
    id: 80,
    name: "Space Launch Complex 40",
    location: {
      id: 12,
      name: "Cape Canaveral SFS, FL, USA",
      timezone_name: "America/New_York",
    },
  },
  image: "https://images.example.com/launch-photo.png",
  mission_patches: [
    {
      id: 7,
      priority: 10,
      image_url: "https://images.example.com/mission-patch.png",
    },
  ],
  spacecraft_stage: {
    spacecraft: {
      id: 6,
      name: "Crew Dragon Freedom",
      serial_number: "C212",
      status: {
        id: 1,
        name: "Active",
      },
      flights_count: 5,
      spacecraft_config: {
        id: 6,
        name: "Crew Dragon 2",
        type: {
          id: 2,
          name: "Capsule",
        },
        image_url: "https://images.example.com/spacecraft.png",
        payload_capacity: 6000,
      },
    },
    launch_crew: [],
    onboard_crew: [],
    landing_crew: [],
  },
  infoURLs: [],
  vidURLs: [],
  launcher_stage: [],
  agency_launch_attempt_count: 660,
  orbital_launch_attempt_count: 7247,
};

describe("spacexData image normalization", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    resetSpaceXDataCacheForTests();
    setSpaceXImageManifestForTests(null);
    setSpaceXSnapshotForTests(emptySnapshot);
  });

  it("prefers the launch image for vehicle art on launch cards", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 1,
        results: [baseLaunch],
      }),
    });

    const launches = await getMissionLaunchCards("upcoming", 1);

    expect(launches[0]?.vehicleImage).toBe("https://images.example.com/launch-photo.png");
  });

  it("falls back to the spacecraft image when the launch photo is missing", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 1,
        results: [
          {
            ...baseLaunch,
            image: null,
          },
        ],
      }),
    });

    const launches = await getMissionLaunchCards("upcoming", 1);

    expect(launches[0]?.vehicleImage).toBe("https://images.example.com/spacecraft.png");
  });

  it("falls back to the rocket configuration image when launch and spacecraft images are missing", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 1,
        results: [
          {
            ...baseLaunch,
            image: null,
            spacecraft_stage: {
              ...baseLaunch.spacecraft_stage,
              spacecraft: {
                ...baseLaunch.spacecraft_stage.spacecraft,
                spacecraft_config: {
                  ...baseLaunch.spacecraft_stage.spacecraft.spacecraft_config,
                  image_url: null,
                },
              },
            },
          },
        ],
      }),
    });

    const launches = await getMissionLaunchCards("upcoming", 1);

    expect(launches[0]?.vehicleImage).toBe("https://images.example.com/rocket-config.png");
  });

  it("does not reuse the launch photo as a mission patch on launch cards", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 1,
        results: [
          {
            ...baseLaunch,
            mission_patches: [],
          },
        ],
      }),
    });

    const launches = await getMissionLaunchCards("upcoming", 1);

    expect(launches[0]?.patchImage).toBeNull();
    expect(launches[0]?.links.patchSmall).toBeNull();
    expect(launches[0]?.links.patchLarge).toBeNull();
    expect(launches[0]?.vehicleImage).toBe("https://images.example.com/launch-photo.png");
  });

  it("exposes the rocket image separately on launch detail", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => baseLaunch,
    });

    const detail = await getMissionLaunchDetail("63aa7636-d2b7-457f-a3e6-27e564e42941");

    expect(detail.vehicleImage).toBe("https://images.example.com/launch-photo.png");
    expect(detail.rocket?.image).toBe("https://images.example.com/rocket-config.png");
  });

  it("serves snapshot-backed summary, launch cards, and detail without hitting fetch", async () => {
    const snapshotLaunch = {
      id: "63aa7636-d2b7-457f-a3e6-27e564e42942",
      name: "Snapshot Mission",
      flightNumber: 701,
      upcoming: true,
      success: null,
      details: "Snapshot launch detail",
      dateUtc: "2027-05-02T11:55:10Z",
      dateUnix: 1809258910,
      dateLocal: "2027-05-02T11:55:10Z",
      datePrecision: "hour",
      tbd: false,
      net: true,
      rocketName: "Falcon 9",
      launchpadName: "SLC-40",
      launchpadLocation: "Cape Canaveral, Florida",
      patchImage: "/data/spacex/images/snapshot-patch.png",
      vehicleImage: "/data/spacex/images/snapshot-vehicle.png",
      crewCount: 0,
      payloadCount: 1,
      capsuleCount: 0,
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
        patchSmall: "/data/spacex/images/snapshot-patch.png",
        patchLarge: "/data/spacex/images/snapshot-patch.png",
        flickrOriginal: [],
      },
    } satisfies MissionLaunchCard;
    const snapshotSummary: MissionControlSummary = {
      heroLaunch: snapshotLaunch,
      nextLaunch: snapshotLaunch,
      fallbackLaunch: null,
      heroMode: "next",
      heroMessage: null,
      insights: [],
      generatedAt: "2026-04-12T00:00:00.000Z",
    };
    const snapshotDetail: MissionLaunchDetail = {
      ...snapshotLaunch,
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

    setSpaceXSnapshotForTests({
      generatedAt: "2026-04-12T00:00:00.000Z",
      sourceLabel: "test snapshot",
      summary: snapshotSummary,
      upcomingLaunches: [snapshotLaunch],
      pastLaunches: [],
      launchDetails: {
        "63aa7636-d2b7-457f-a3e6-27e564e42942": snapshotDetail,
      },
      cadence: null,
    } satisfies MissionControlSnapshot);

    const [resolvedSummary, launches, detail] = await Promise.all([
      getMissionControlSummary(),
      getMissionLaunchCards("upcoming", 1),
      getMissionLaunchDetail("63aa7636-d2b7-457f-a3e6-27e564e42942"),
    ]);

    expect(resolvedSummary).toEqual(snapshotSummary);
    expect(launches).toEqual([snapshotLaunch]);
    expect(detail).toEqual(snapshotDetail);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("falls back to live detail fetches when a launch is outside the local snapshot window", async () => {
    setSpaceXSnapshotForTests({
      generatedAt: "2026-04-12T00:00:00.000Z",
      sourceLabel: "test snapshot",
      summary: null,
      upcomingLaunches: [],
      pastLaunches: [],
      launchDetails: {},
      cadence: null,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => baseLaunch,
    });

    const detail = await getMissionLaunchDetail("63aa7636-d2b7-457f-a3e6-27e564e42941");

    expect(detail.id).toBe(baseLaunch.id);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("rewrites mapped launch card image fields to local snapshot paths", async () => {
    setSpaceXImageManifestForTests({
      "https://images.example.com/mission-patch.png": "/data/spacex/images/mission-patch.png",
      "https://images.example.com/launch-photo.png": "/data/spacex/images/launch-photo.png",
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 1,
        results: [baseLaunch],
      }),
    });

    const launches = await getMissionLaunchCards("upcoming", 1);

    expect(launches[0]?.patchImage).toBe("/data/spacex/images/mission-patch.png");
    expect(launches[0]?.vehicleImage).toBe("/data/spacex/images/launch-photo.png");
    expect(launches[0]?.links.patchSmall).toBe("/data/spacex/images/mission-patch.png");
    expect(launches[0]?.links.flickrOriginal).toEqual([
      "/data/spacex/images/launch-photo.png",
    ]);
  });

  it("rewrites mapped detail images while keeping unknown remote images unchanged", async () => {
    setSpaceXImageManifestForTests({
      "https://images.example.com/launch-photo.png": "/data/spacex/images/launch-photo.png",
      "https://images.example.com/rocket-config.png": "/data/spacex/images/rocket-config.png",
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => baseLaunch,
    });

    const detail = await getMissionLaunchDetail("63aa7636-d2b7-457f-a3e6-27e564e42941");

    expect(detail.vehicleImage).toBe("/data/spacex/images/launch-photo.png");
    expect(detail.rocket?.image).toBe("/data/spacex/images/rocket-config.png");
    expect(detail.rocket?.flickrImages).toEqual([
      "/data/spacex/images/rocket-config.png",
      "/data/spacex/images/launch-photo.png",
      "https://images.example.com/spacecraft.png",
    ]);
  });

  it("serves cached launch cards when Launch Library starts returning 429", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          results: [baseLaunch],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: () => "60",
        },
      });

    const firstLaunches = await getMissionLaunchCards("upcoming", 1);
    expect(firstLaunches).toHaveLength(1);

    const secondLaunches = await getMissionLaunchCards("upcoming", 1);
    expect(secondLaunches[0]?.id).toBe(baseLaunch.id);
  });

  it("serves cached launch detail when Launch Library starts returning 429", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => baseLaunch,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: () => "60",
        },
      });

    const firstDetail = await getMissionLaunchDetail("63aa7636-d2b7-457f-a3e6-27e564e42941");
    expect(firstDetail.id).toBe(baseLaunch.id);

    const secondDetail = await getMissionLaunchDetail("63aa7636-d2b7-457f-a3e6-27e564e42941");
    expect(secondDetail.id).toBe(baseLaunch.id);
  });
});
