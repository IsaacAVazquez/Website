import {
  buildMissionControlSnapshot,
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
import {
  LL2_AGENCY,
  LL2_FIXTURE_NOW,
  LL2_NORMAL_ROW,
  LL2_OTHER_PROVIDER_ROW,
  LL2_PAGE_CAP,
  LL2_UPCOMING_ROW,
  serveLl2PreviousPage,
} from "./fixtures/spacexLaunchLibrary.fixture";

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

    const detail = await getMissionLaunchDetail("63aa7636-d2b7-457f-a3e6-27e564e42941", { live: true });

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

  it("derives basic detail for listed cards that were not hydrated", async () => {
    const listedLaunch = {
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
      patchImage: null,
      vehicleImage: "/data/spacex/images/vehicle.png",
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
        patchSmall: null,
        patchLarge: null,
        flickrOriginal: [],
      },
    } satisfies MissionLaunchCard;

    setSpaceXSnapshotForTests({
      generatedAt: "2026-04-12T00:00:00.000Z",
      sourceLabel: "test snapshot",
      summary: null,
      upcomingLaunches: [listedLaunch],
      pastLaunches: [],
      launchDetails: {},
      cadence: null,
    });

    const detail = await getMissionLaunchDetail(listedLaunch.id);

    expect(detail.id).toBe(listedLaunch.id);
    expect(detail.rocket?.name).toBe("Falcon 9");
    expect(detail.launchpad?.name).toBe("SLC-40");
    expect(mockFetch).not.toHaveBeenCalled();
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

    const detail = await getMissionLaunchDetail("63aa7636-d2b7-457f-a3e6-27e564e42941", { live: true });

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

    const firstDetail = await getMissionLaunchDetail("63aa7636-d2b7-457f-a3e6-27e564e42941", { live: true });
    expect(firstDetail.id).toBe(baseLaunch.id);

    const secondDetail = await getMissionLaunchDetail("63aa7636-d2b7-457f-a3e6-27e564e42941", { live: true });
    expect(secondDetail.id).toBe(baseLaunch.id);
  });
});

const UNKNOWN_LAUNCH_ID = "00000000-0000-0000-0000-000000000000";

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function throttledResponse() {
  return {
    ok: false,
    status: 429,
    headers: { get: () => "1716" },
    json: async () => ({
      detail: "Request was throttled. Expected available in 1716 seconds.",
    }),
  };
}

// Routes each request the way Launch Library answers it. A detail payload is a
// superset of the row the list served, so the row stands in for it here.
function mockLaunchLibrary(
  previousPage: (url: string) => unknown = (url) => jsonResponse(serveLl2PreviousPage(url))
) {
  mockFetch.mockImplementation(async (input: string | URL) => {
    const url = String(input);

    if (url.includes("/launch/upcoming/")) {
      return jsonResponse({ count: 1, next: null, previous: null, results: [LL2_UPCOMING_ROW] });
    }

    if (url.includes("/launch/previous/")) {
      return previousPage(url);
    }

    if (url.includes("/agencies/121/")) {
      return jsonResponse(LL2_AGENCY);
    }

    const id = url.match(/\/launch\/([0-9a-f-]{36})\//)?.[1];
    return jsonResponse(
      id === LL2_UPCOMING_ROW.id ? LL2_UPCOMING_ROW : { ...LL2_NORMAL_ROW, id }
    );
  });
}

function requestedUrls(pathFragment: string): string[] {
  return mockFetch.mock.calls
    .map(([input]) => String(input))
    .filter((url) => url.includes(pathFragment));
}

describe("spacexData snapshot build", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    resetSpaceXDataCacheForTests();
    setSpaceXImageManifestForTests(null);
    setSpaceXSnapshotForTests(emptySnapshot);
    jest.useFakeTimers();
    jest.setSystemTime(new Date(LL2_FIXTURE_NOW));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("counts the whole trailing year when Launch Library caps a page at 100 rows", async () => {
    mockLaunchLibrary();

    const snapshot = await buildMissionControlSnapshot();
    const points = snapshot.cadence?.points ?? [];
    const total = points.reduce((sum, point) => sum + point.count, 0);

    for (const result of mockFetch.mock.results) {
      const body = await (await result.value).json();
      expect(body.results?.length ?? 0).toBeLessThanOrEqual(LL2_PAGE_CAP);
    }

    expect(points.map((point) => point.monthKey)).toEqual([
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
    expect(total).toBeGreaterThan(100);
    expect(points[0]?.count).toBe(16);
    expect(points.map((point) => point.count)).toEqual([
      16, 13, 13, 13, 12, 15, 12, 12, 14, 13, 14, 7,
    ]);
  });

  it("reads the second cadence page in list mode without adding a request", async () => {
    mockLaunchLibrary();

    const snapshot = await buildMissionControlSnapshot();
    const previousRequests = requestedUrls("/launch/previous/").map(
      (url) => new URL(url).searchParams
    );

    expect(snapshot.pastLaunches).toHaveLength(24);
    expect(Object.keys(snapshot.launchDetails)).toHaveLength(4);
    expect(previousRequests).toHaveLength(2);
    expect(previousRequests[0]?.get("offset")).toBeNull();
    expect(previousRequests[0]?.get("mode")).toBeNull();
    expect(previousRequests[1]?.get("offset")).toBe("100");
    expect(previousRequests[1]?.get("mode")).toBe("list");
    // upcoming, previous, agency, four details, and one more cadence page
    expect(mockFetch).toHaveBeenCalledTimes(8);
  });

  it("publishes no cadence when a later page is rate limited", async () => {
    mockLaunchLibrary((url) =>
      new URL(url).searchParams.has("offset")
        ? throttledResponse()
        : jsonResponse(serveLl2PreviousPage(url))
    );

    const snapshot = await buildMissionControlSnapshot();

    expect(snapshot.pastLaunches).toHaveLength(24);
    expect(snapshot.cadence).toBeNull();
  });

  it("publishes no cadence when the page bound ends before the window does", async () => {
    // Every page repeats the newest 100 launches, as an ignored offset would.
    mockLaunchLibrary((url) => {
      const firstPage = new URL(url);
      firstPage.searchParams.delete("offset");
      return jsonResponse(serveLl2PreviousPage(firstPage.toString()));
    });

    const snapshot = await buildMissionControlSnapshot();

    expect(snapshot.cadence).toBeNull();
    expect(requestedUrls("/launch/previous/")).toHaveLength(3);
  });
});

describe("spacexData provider guard", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    resetSpaceXDataCacheForTests();
    setSpaceXImageManifestForTests(null);
    setSpaceXSnapshotForTests(emptySnapshot);
    jest.useFakeTimers();
    jest.setSystemTime(new Date(LL2_FIXTURE_NOW));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("drops another provider's launch when the provider filter is ignored", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        count: 2,
        next: null,
        previous: null,
        results: [LL2_UPCOMING_ROW, LL2_OTHER_PROVIDER_ROW],
      })
    );

    const launches = await getMissionLaunchCards("upcoming", 5);

    expect(launches.map((launch) => launch.id)).toEqual([LL2_UPCOMING_ROW.id]);
  });

  it("keeps a row that carries no provider field", async () => {
    const { launch_service_provider: _provider, ...rowWithoutProvider } = LL2_UPCOMING_ROW;
    mockFetch.mockResolvedValue(
      jsonResponse({ count: 1, next: null, previous: null, results: [rowWithoutProvider] })
    );

    const launches = await getMissionLaunchCards("upcoming", 5);

    expect(launches.map((launch) => launch.id)).toEqual([LL2_UPCOMING_ROW.id]);
  });
});

describe("spacexData snapshot launch lookup", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    resetSpaceXDataCacheForTests();
    setSpaceXImageManifestForTests(null);
    setSpaceXSnapshotForTests(emptySnapshot);
    jest.useFakeTimers();
    jest.setSystemTime(new Date(LL2_FIXTURE_NOW));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("answers 404 for a well formed id that the snapshot does not hold", async () => {
    mockLaunchLibrary();
    setSpaceXSnapshotForTests(await buildMissionControlSnapshot());
    mockFetch.mockClear();

    await expect(
      getMissionLaunchDetail(UNKNOWN_LAUNCH_ID)
    ).rejects.toMatchObject({ status: 404 });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("answers 503 when the snapshot holds no data at all", async () => {
    await expect(
      getMissionLaunchDetail(UNKNOWN_LAUNCH_ID)
    ).rejects.toMatchObject({ status: 503 });
  });

  it("answers 400 for a malformed id", async () => {
    await expect(
      getMissionLaunchDetail("not-a-launch-id")
    ).rejects.toMatchObject({ status: 400 });
  });
});
