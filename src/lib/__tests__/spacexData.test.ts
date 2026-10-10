import {
  buildLaunchCollectionPath,
  buildMissionControlSnapshot,
  dedupeLaunches,
  getLaunchLibraryAuthHeaders,
  getMissionControlSummary,
  getMissionLaunchCards,
  getMissionLaunchDetail,
  isPastDate,
  isValidMissionLaunchId,
  resetSpaceXDataCacheForTests,
  sortByPriority,
} from "@/lib/spacexData";
import { setSpaceXImageManifestForTests } from "@/lib/spacexImageManifest";
import { setSpaceXSnapshotForTests } from "@/lib/spacexSnapshot";
import type {
  MissionControlSnapshot,
  MissionControlStatus,
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

  it("prefers the official webcast and page over an unofficial one that outranks them on priority", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 1,
        results: [
          {
            ...baseLaunch,
            vidURLs: [
              { url: "https://example.com/unofficial-stream", priority: 10, type: { name: "Unofficial Webcast" } },
              { url: "https://example.com/official-stream", priority: 5, type: { name: "Official Webcast" } },
            ],
            infoURLs: [
              { url: "https://example.com/unofficial-page", priority: 10, type: { name: "Unofficial Page" } },
              { url: "https://example.com/official-page", priority: 5, type: { name: "Official Page" } },
            ],
          },
        ],
      }),
    });

    const launches = await getMissionLaunchCards("upcoming", 1);

    expect(launches[0]?.links.webcast).toBe("https://example.com/official-stream");
    expect(launches[0]?.links.article).toBe("https://example.com/official-page");
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

// ---------------------------------------------------------------------------
// Live Launch Library paths: request errors, rate limiting, normalization.
// ---------------------------------------------------------------------------

const PAST_LAUNCH_ID = "0b1c2d3e-4f50-4617-8293-a4b5c6d7e8f9";
const SECOND_LAUNCH_ID = "1c2d3e4f-5061-4728-93a4-b5c6d7e8f90a";

function llResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    json: async () => body,
  };
}

function listOf(...results: unknown[]) {
  return llResponse({ count: results.length, results });
}

const pastLaunch = {
  ...baseLaunch,
  id: PAST_LAUNCH_ID,
  net: "2026-09-01T12:00:00Z",
  status: { id: 3, name: "Launch Successful", abbrev: "Success" },
  mission: { ...baseLaunch.mission, name: "Past Mission" },
};

const summaryAgency = {
  id: 121,
  name: "SpaceX",
  pending_launches: 1500,
  total_launch_count: 200,
  successful_launches: 190,
  launcher_list: [
    { family: "Falcon", pending_launches: 3 },
    { family: "Falcon", pending_launches: 1 },
    { family: null, name: "Starship", pending_launches: 2 },
    { family: "Retired", pending_launches: 0 },
  ],
};

interface LiveRoutes {
  upcoming?: () => unknown;
  previous?: () => unknown;
  agency?: () => unknown;
  detail?: (id: string) => unknown;
}

function routeLaunchLibrary(routes: LiveRoutes = {}) {
  mockFetch.mockImplementation(async (input: string | URL) => {
    const url = String(input);
    if (url.includes("/launch/upcoming/")) return (routes.upcoming ?? (() => listOf(baseLaunch)))();
    if (url.includes("/launch/previous/")) return (routes.previous ?? (() => listOf(pastLaunch)))();
    if (url.includes("/agencies/121/")) return (routes.agency ?? (() => llResponse(summaryAgency)))();
    const id = url.match(/\/launch\/([0-9a-f-]{36})\//)?.[1] ?? "";
    if (routes.detail) return routes.detail(id);
    return llResponse(id === PAST_LAUNCH_ID ? pastLaunch : baseLaunch);
  });
}

function liveSetup() {
  mockFetch.mockReset();
  resetSpaceXDataCacheForTests();
  setSpaceXImageManifestForTests(null);
  setSpaceXSnapshotForTests(emptySnapshot);
  jest.useFakeTimers();
  jest.setSystemTime(new Date(LL2_FIXTURE_NOW));
}

describe("spacexData pure helpers", () => {
  beforeEach(liveSetup);
  afterEach(() => jest.useRealTimers());

  it("validates launch ids in both UUID and legacy 24-hex form", () => {
    expect(isValidMissionLaunchId(baseLaunch.id)).toBe(true);
    expect(isValidMissionLaunchId("5eb87cd9ffd86e000604b32a")).toBe(true);
    expect(isValidMissionLaunchId("5eb87cd9ffd86e000604b32")).toBe(false);
    expect(isValidMissionLaunchId("../../etc/passwd")).toBe(false);
  });

  it("treats missing or unparseable dates as not past and honors the grace window", () => {
    expect(isPastDate(null)).toBe(false);
    expect(isPastDate("not a date")).toBe(false);
    expect(isPastDate("2026-09-27T19:00:00.000Z")).toBe(true);
    // Fifteen minutes ago is still inside a thirty-minute grace window.
    expect(isPastDate("2026-09-27T19:00:00.000Z", 30 * 60 * 1000)).toBe(false);
    expect(isPastDate("2026-09-28T00:00:00.000Z")).toBe(false);
  });

  it("drops duplicate and id-less rows while keeping first-seen order", () => {
    const rows = [
      { id: "a", net: "1" },
      { id: "", net: "2" },
      { id: "b", net: "3" },
      { id: "a", net: "4" },
    ];
    expect(dedupeLaunches(rows).map((row) => row.net)).toEqual(["1", "3"]);
  });

  it("sorts by descending priority, treating a missing priority as zero", () => {
    const sorted = sortByPriority([
      { name: "none" },
      { name: "high", priority: 10 },
      { name: "negative", priority: -1 },
      { name: "null", priority: null },
    ]);
    expect(sorted.map((item) => item.name)).toEqual(["high", "none", "null", "negative"]);
  });

  it("builds normal and list-mode collection paths", () => {
    const normal = new URL(`https://x${buildLaunchCollectionPath("upcoming", 6, "net")}`);
    expect(normal.pathname).toBe("/launch/upcoming/");
    expect(normal.searchParams.get("limit")).toBe("6");
    expect(normal.searchParams.get("lsp__ids")).toBe("121");
    expect(normal.searchParams.has("mode")).toBe(false);

    const list = new URL(`https://x${buildLaunchCollectionPath("previous", 100, "-net", 200)}`);
    expect(list.searchParams.get("mode")).toBe("list");
    expect(list.searchParams.get("offset")).toBe("200");
    expect(list.searchParams.get("ordering")).toBe("-net");
  });

  it("sends a trimmed Launch Library token only when one is configured", async () => {
    const previous = process.env.SPACEDEVS_API_TOKEN;
    try {
      delete process.env.SPACEDEVS_API_TOKEN;
      expect(getLaunchLibraryAuthHeaders()).toEqual({});
      process.env.SPACEDEVS_API_TOKEN = "   ";
      expect(getLaunchLibraryAuthHeaders()).toEqual({});
      process.env.SPACEDEVS_API_TOKEN = "  abc123 ";
      expect(getLaunchLibraryAuthHeaders()).toEqual({ Authorization: "Token abc123" });

      routeLaunchLibrary();
      await getMissionLaunchDetail(baseLaunch.id, { live: true });
      const init = mockFetch.mock.calls[0][1] as { headers: Record<string, string> };
      expect(init.headers.Authorization).toBe("Token abc123");
      expect(init.headers.Accept).toBe("application/json");
    } finally {
      if (previous === undefined) delete process.env.SPACEDEVS_API_TOKEN;
      else process.env.SPACEDEVS_API_TOKEN = previous;
    }
  });
});

describe("spacexData Launch Library request errors", () => {
  beforeEach(liveSetup);
  afterEach(() => jest.useRealTimers());

  it("maps a timeout to 504", async () => {
    mockFetch.mockRejectedValue(Object.assign(new Error("timed out"), { name: "TimeoutError" }));
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).rejects.toMatchObject({
      status: 504,
    });
  });

  it("maps a network failure to 502", async () => {
    mockFetch.mockRejectedValue(new TypeError("fetch failed"));
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).rejects.toMatchObject({
      status: 502,
    });
  });

  it("passes an upstream error status through", async () => {
    mockFetch.mockResolvedValue(llResponse({}, 503));
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).rejects.toMatchObject({
      status: 503,
    });
  });

  it("answers 404 for a live launch that belongs to another provider", async () => {
    mockFetch.mockResolvedValue(
      llResponse({ ...baseLaunch, launch_service_provider: { id: 1066, name: "HyImpulse" } })
    );
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).rejects.toMatchObject({
      status: 404,
    });
  });

  it("rejects a 429 with no cached value instead of inventing one", async () => {
    mockFetch.mockResolvedValue(llResponse({}, 429, { "retry-after": "60" }));
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).rejects.toMatchObject({
      status: 429,
    });
  });

  it("blocks requests for the Retry-After window, capped at five minutes", async () => {
    mockFetch.mockResolvedValueOnce(llResponse({}, 429, { "retry-after": "600" }));
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).rejects.toMatchObject({
      status: 429,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetch.mockResolvedValue(llResponse(baseLaunch));
    jest.setSystemTime(new Date(Date.parse(LL2_FIXTURE_NOW) + 5 * 60 * 1000 - 1));
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).rejects.toMatchObject({
      status: 429,
    });
    // Still inside the window, so the request never left the process.
    expect(mockFetch).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date(Date.parse(LL2_FIXTURE_NOW) + 5 * 60 * 1000 + 1));
    const detail = await getMissionLaunchDetail(baseLaunch.id, { live: true });
    expect(detail.id).toBe(baseLaunch.id);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("reads an HTTP-date Retry-After and never backs off less than a minute", async () => {
    const start = Date.parse(LL2_FIXTURE_NOW);
    mockFetch.mockResolvedValueOnce(
      llResponse({}, 429, { "retry-after": new Date(start + 2 * 60 * 1000).toUTCString() })
    );
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).rejects.toBeDefined();

    mockFetch.mockResolvedValue(llResponse(baseLaunch));
    jest.setSystemTime(new Date(start + 119 * 1000));
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).rejects.toMatchObject({
      status: 429,
    });
    jest.setSystemTime(new Date(start + 121 * 1000));
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).resolves.toMatchObject({
      id: baseLaunch.id,
    });
  });

  it("doubles the backoff on consecutive 429s when no Retry-After is sent", async () => {
    let now = Date.parse(LL2_FIXTURE_NOW);
    mockFetch.mockResolvedValue(llResponse({}, 429, { "retry-after": "soon" }));
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).rejects.toBeDefined();

    // First backoff is one minute.
    now += 61 * 1000;
    jest.setSystemTime(new Date(now));
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).rejects.toBeDefined();
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Second consecutive 429 doubles it to two minutes.
    now += 61 * 1000;
    jest.setSystemTime(new Date(now));
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).rejects.toMatchObject({
      status: 429,
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);

    now += 60 * 1000;
    jest.setSystemTime(new Date(now));
    mockFetch.mockResolvedValue(llResponse(baseLaunch));
    await expect(getMissionLaunchDetail(baseLaunch.id, { live: true })).resolves.toMatchObject({
      id: baseLaunch.id,
    });
  });

  it("shares one in-flight live detail request between concurrent callers", async () => {
    routeLaunchLibrary();
    const [first, second] = await Promise.all([
      getMissionLaunchDetail(baseLaunch.id, { live: true }),
      getMissionLaunchDetail(baseLaunch.id, { live: true }),
    ]);
    expect(second).toBe(first);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("spacexData live mission control summary", () => {
  beforeEach(liveSetup);
  afterEach(() => jest.useRealTimers());

  it("builds the hero from the next launch's detail and computes agency insights", async () => {
    routeLaunchLibrary({
      detail: (id) =>
        llResponse(
          id === PAST_LAUNCH_ID
            ? pastLaunch
            : { ...baseLaunch, mission: { ...baseLaunch.mission, name: "Detail Mission" } }
        ),
    });

    const summary = await getMissionControlSummary();

    expect(summary.heroMode).toBe("next");
    expect(summary.heroMessage).toBeNull();
    expect(summary.heroLaunch?.name).toBe("Detail Mission");
    expect(summary.nextLaunch?.upcoming).toBe(true);
    expect(summary.fallbackLaunch?.id).toBe(PAST_LAUNCH_ID);
    expect(summary.fallbackLaunch?.success).toBe(true);
    expect(summary.insights.map((insight) => [insight.id, insight.value])).toEqual([
      ["upcoming", "1.5K"],
      ["past", "200"],
      ["success-rate", "95%"],
      ["rocket-families", "2"],
    ]);
    expect(summary.generatedAt).toBe(LL2_FIXTURE_NOW);
  });

  it("falls back to the list row when a hero detail request fails", async () => {
    routeLaunchLibrary({ detail: () => llResponse({}, 500) });

    const summary = await getMissionControlSummary();

    expect(summary.nextLaunch?.name).toBe(baseLaunch.mission.name);
    expect(summary.fallbackLaunch?.name).toBe("Past Mission");
  });

  it("shows the latest completed launch when nothing is scheduled", async () => {
    routeLaunchLibrary({ upcoming: () => listOf(), agency: () => llResponse({}) });

    const summary = await getMissionControlSummary();

    expect(summary.nextLaunch).toBeNull();
    expect(summary.heroMode).toBe("fallback");
    expect(summary.heroLaunch?.id).toBe(PAST_LAUNCH_ID);
    expect(summary.heroMessage).toMatch(/No future SpaceX mission/);
    // An empty agency record reads as zeros rather than NaN.
    expect(summary.insights.map((insight) => insight.value)).toEqual(["0", "0", "0%", "0"]);
  });

  it("leaves the hero empty when neither list has a launch", async () => {
    routeLaunchLibrary({ upcoming: () => listOf(), previous: () => listOf() });

    const summary = await getMissionControlSummary();

    expect(summary.heroLaunch).toBeNull();
    expect(summary.fallbackLaunch).toBeNull();
    expect(summary.heroMode).toBe("next");
  });

  it("single-flights concurrent callers and serves the cache until the TTL passes", async () => {
    routeLaunchLibrary();

    const [first, second] = await Promise.all([
      getMissionControlSummary(),
      getMissionControlSummary(),
    ]);
    // upcoming, previous, agency, and one detail per hero candidate
    expect(mockFetch).toHaveBeenCalledTimes(5);
    expect(second).toBe(first);

    await getMissionControlSummary();
    expect(mockFetch).toHaveBeenCalledTimes(5);

    jest.setSystemTime(new Date(Date.parse(LL2_FIXTURE_NOW) + 121 * 1000));
    const refreshed = await getMissionControlSummary();
    expect(mockFetch).toHaveBeenCalledTimes(10);
    expect(refreshed).not.toBe(first);
  });

  it("serves the stale summary when Launch Library rate limits a refresh", async () => {
    routeLaunchLibrary();
    const first = await getMissionControlSummary();

    jest.setSystemTime(new Date(Date.parse(LL2_FIXTURE_NOW) + 121 * 1000));
    mockFetch.mockResolvedValue(llResponse({}, 429, { "retry-after": "60" }));

    await expect(getMissionControlSummary()).resolves.toBe(first);
  });

  it("rejects a rate limit when there is no summary to fall back on", async () => {
    mockFetch.mockResolvedValue(llResponse({}, 429, { "retry-after": "60" }));
    await expect(getMissionControlSummary()).rejects.toMatchObject({ status: 429 });
  });

  it("rejects other upstream failures even with a stale summary cached", async () => {
    routeLaunchLibrary();
    await getMissionControlSummary();

    jest.setSystemTime(new Date(Date.parse(LL2_FIXTURE_NOW) + 121 * 1000));
    routeLaunchLibrary({ agency: () => llResponse({}, 500) });

    await expect(getMissionControlSummary()).rejects.toMatchObject({ status: 500 });
  });
});

describe("spacexData live launch cards", () => {
  beforeEach(liveSetup);
  afterEach(() => jest.useRealTimers());

  function requestedLimit(): string | null {
    return new URL(String(mockFetch.mock.calls[0][0])).searchParams.get("limit");
  }

  it("rejects an unknown status with 400", async () => {
    await expect(
      getMissionLaunchCards("live" as MissionControlStatus)
    ).rejects.toMatchObject({ status: 400 });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([
    [Number.NaN, "18"],
    [100, "30"],
    [0, "7"],
    [3.9, "9"],
  ])("clamps a board limit of %p before asking for %s rows", async (limit, expected) => {
    mockFetch.mockResolvedValue(listOf(baseLaunch));
    await getMissionLaunchCards("upcoming", limit);
    expect(requestedLimit()).toBe(expected);
  });

  it("reads past launches newest first and drops rows dated in the future", async () => {
    const undated = { ...pastLaunch, id: SECOND_LAUNCH_ID, net: null };
    mockFetch.mockResolvedValue(listOf(baseLaunch, pastLaunch, undated));

    const launches = await getMissionLaunchCards("past", 5);

    expect(new URL(String(mockFetch.mock.calls[0][0])).searchParams.get("ordering")).toBe("-net");
    expect(launches.map((launch) => launch.id)).toEqual([PAST_LAUNCH_ID, SECOND_LAUNCH_ID]);
    expect(launches.every((launch) => !launch.upcoming)).toBe(true);
    // An undated row falls back to its window start, then to now.
    expect(launches[1].net).toBe(false);
    expect(launches[1].dateUtc).toBe(LL2_FIXTURE_NOW);
  });

  it("returns an empty board without fetching when the snapshot only holds the other status", async () => {
    setSpaceXSnapshotForTests({
      ...emptySnapshot,
      launchDetails: {
        [baseLaunch.id]: {} as MissionLaunchDetail,
      },
    });

    await expect(getMissionLaunchCards("upcoming", 3)).resolves.toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shares one in-flight board request and rethrows non rate-limit failures", async () => {
    mockFetch.mockResolvedValue(listOf(baseLaunch));
    const [first, second] = await Promise.all([
      getMissionLaunchCards("upcoming", 2),
      getMissionLaunchCards("upcoming", 2),
    ]);
    expect(second).toBe(first);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetch.mockResolvedValue(llResponse({}, 500));
    await expect(getMissionLaunchCards("past", 2)).rejects.toMatchObject({ status: 500 });
  });

  it("rejects a rate-limited board with no cached copy", async () => {
    mockFetch.mockResolvedValue(llResponse({}, 429));
    await expect(getMissionLaunchCards("upcoming", 2)).rejects.toMatchObject({ status: 429 });
  });
});

describe("spacexData launch normalization", () => {
  beforeEach(liveSetup);
  afterEach(() => jest.useRealTimers());

  // Each helper call clears the module caches, so one test can read several
  // shapes without the board or detail cache answering for the previous one.
  async function cardFor(launch: Record<string, unknown>): Promise<MissionLaunchCard> {
    resetSpaceXDataCacheForTests();
    mockFetch.mockResolvedValue(listOf({ ...baseLaunch, ...launch }));
    const [card] = await getMissionLaunchCards("upcoming", 1);
    return card;
  }

  async function detailFor(launch: Record<string, unknown>): Promise<MissionLaunchDetail> {
    resetSpaceXDataCacheForTests();
    mockFetch.mockResolvedValue(llResponse({ ...baseLaunch, ...launch }));
    return getMissionLaunchDetail(baseLaunch.id, { live: true });
  }

  it.each([
    [{ name: "Second", abbrev: "SEC" }, "hour"],
    [{ name: "Hour", abbrev: "HR" }, "hour"],
    [{ name: "Day", abbrev: "DAY" }, "day"],
    [{ name: "Month", abbrev: "MON" }, "month"],
    [{ name: "", abbrev: "M" }, "month"],
    [{ name: "Quarter", abbrev: "Q" }, "quarter"],
    [{ name: "", abbrev: "Q3" }, "quarter"],
    [{ name: "Half Year", abbrev: "H1" }, "half"],
    [{ name: "Year", abbrev: "YR" }, "year"],
    [{ name: "", abbrev: "Y" }, "year"],
    [{ name: "Fortnight", abbrev: "F" }, "day"],
    [null, "day"],
  ])("maps net precision %p to %s", async (precision, expected) => {
    const card = await cardFor({ net_precision: precision });
    expect(card.datePrecision).toBe(expected);
    expect(card.hasExactTime).toBe(expected === "hour");
  });

  it.each([
    [{ name: "Launch Successful", abbrev: "Success" }, true],
    [{ name: "Launch Failure", abbrev: "Failure" }, false],
    [{ name: "Partial Failure", abbrev: "PF" }, false],
    [{ name: "Launch Cancelled", abbrev: "X" }, false],
    [{ name: "Go for Launch", abbrev: "Go" }, null],
    [null, null],
  ])("maps launch status %p to success %p", async (status, expected) => {
    const card = await cardFor({ status });
    expect(card.success).toBe(expected);
  });

  it("marks a TBD launch as having no exact time", async () => {
    const card = await cardFor({ status: { name: "To Be Determined", abbrev: "TBD" } });
    expect(card.tbd).toBe(true);
    expect(card.hasExactTime).toBe(false);
    expect(card.isStaleSchedule).toBe(false);
  });

  it("falls back through launch name, flight number, and window start", async () => {
    const card = await cardFor({
      mission: null,
      agency_launch_attempt_count: null,
      net: null,
      window_start: "2026-10-01T00:00:00Z",
    });
    expect(card.name).toBe(baseLaunch.name);
    expect(card.flightNumber).toBe(baseLaunch.orbital_launch_attempt_count);
    expect(card.dateUtc).toBe("2026-10-01T00:00:00Z");
    expect(card.dateUnix).toBe(Date.parse("2026-10-01T00:00:00Z") / 1000);
    expect(card.net).toBe(false);
    expect(card.payloadCount).toBe(0);

    const bare = await cardFor({
      mission: null,
      name: null,
      agency_launch_attempt_count: null,
      orbital_launch_attempt_count: null,
    });
    expect(bare.name).toBe("Unnamed launch");
    expect(bare.flightNumber).toBe(0);
  });

  it.each([
    [{ launcher_stage: [{}, {}] }, 2],
    [{ rocket: { configuration: { full_name: "Falcon Heavy" } } }, 3],
    [{ rocket: { configuration: { name: "Starship" } } }, 2],
    [{ rocket: { configuration: { name: "Falcon 9" } } }, 1],
    [{ rocket: null }, 0],
  ])("derives the core count from %p", async (launch, expected) => {
    expect((await cardFor(launch)).coreCount).toBe(expected);
  });

  it.each([
    ["A batch of 29 satellites for Starlink.", 29],
    ["The rocket is carrying 22 satellites to orbit.", 22],
    ["Deploys 40 satellites to a sun-synchronous orbit.", 40],
    ["A batch of 0 test articles", 1],
    ["Cargo resupply to the ISS.", 1],
  ])("reads the payload count from %p", async (description, expected) => {
    const card = await cardFor({ mission: { ...baseLaunch.mission, description } });
    expect(card.payloadCount).toBe(expected);
  });

  it("counts crew as payload when a crewed spacecraft flies", async () => {
    const crew = [1, 2, 3, 4].map((id) => ({ id, astronaut: { id, name: `Astronaut ${id}` } }));
    const card = await cardFor({
      spacecraft_stage: { ...baseLaunch.spacecraft_stage, launch_crew: crew },
    });
    expect(card.crewCount).toBe(4);
    expect(card.payloadCount).toBe(4);
    expect(card.capsuleCount).toBe(1);
  });

  it("prefers official webcasts and mission articles and finds press kits and program art", async () => {
    const card = await cardFor({
      mission_patches: [],
      vidURLs: [
        { priority: 9, url: "https://www.youtube.com/watch?v=fanstream1", publisher: "Fan Channel", type: { name: "Fan Stream" } },
        { priority: 1, url: "https://youtu.be/OFFICIAL99", publisher: "SpaceX", type: { name: "Official Webcast" } },
      ],
      infoURLs: [
        { priority: 9, url: "https://example.com/news", title: "News" },
        { priority: 1, url: "https://www.spacex.com/launches/mission", title: "Mission page" },
        { priority: 0, url: "https://example.com/files/press-kit.pdf", title: "Media" },
      ],
      program: [
        {
          name: "Commercial Crew",
          info_url: "https://example.org/program",
          wiki_url: "https://en.wikipedia.org/wiki/Commercial_Crew_Program",
          mission_patches: [
            { priority: 1, image_url: "https://images.example.com/program-low.png" },
            { priority: 5, image_url: "https://images.example.com/program-patch.png" },
          ],
        },
      ],
    });

    expect(card.links.webcast).toBe("https://youtu.be/OFFICIAL99");
    expect(card.links.youtubeId).toBe("OFFICIAL99");
    expect(card.links.article).toBe("https://www.spacex.com/launches/mission");
    expect(card.links.presskit).toBe("https://example.com/files/press-kit.pdf");
    expect(card.links.wikipedia).toBe("https://en.wikipedia.org/wiki/Commercial_Crew_Program");
    expect(card.patchImage).toBe("https://images.example.com/program-patch.png");
  });

  it("falls back to the highest-priority links and reports no YouTube id for other hosts", async () => {
    const card = await cardFor({
      mission_patches: [],
      program: [],
      vidURLs: [
        { priority: 2, url: "https://video.example.com/stream", publisher: "Broadcaster" },
        { priority: 5, url: null, publisher: "Broadcaster" },
      ],
      infoURLs: [{ priority: 3, url: "https://example.com/story", title: "Story" }],
      mission: {
        ...baseLaunch.mission,
        agencies: [{ name: "NASA", wiki_url: null }, { name: "ESA", wiki_url: "https://en.wikipedia.org/wiki/ESA" }],
      },
    });

    expect(card.links.webcast).toBe("https://video.example.com/stream");
    expect(card.links.youtubeId).toBeNull();
    expect(card.links.article).toBe("https://example.com/story");
    expect(card.links.presskit).toBeNull();
    expect(card.links.wikipedia).toBe("https://en.wikipedia.org/wiki/ESA");
    expect(card.patchImage).toBeNull();
  });

  it("takes Wikipedia from the provider, then the pad, when no program or agency has one", async () => {
    const provider = await cardFor({
      mission: { ...baseLaunch.mission, agencies: [] },
      launch_service_provider: { id: 121, name: "SpaceX", wiki_url: "https://en.wikipedia.org/wiki/SpaceX" },
    });
    expect(provider.links.wikipedia).toBe("https://en.wikipedia.org/wiki/SpaceX");

    const pad = await cardFor({
      mission: { ...baseLaunch.mission, agencies: [] },
      pad: { ...baseLaunch.pad, wiki_url: "https://en.wikipedia.org/wiki/SLC-40" },
    });
    expect(pad.links.wikipedia).toBe("https://en.wikipedia.org/wiki/SLC-40");
    expect(pad.links.webcast).toBeNull();
  });

  it("normalizes a full launch detail into rocket, pad, crew, payload, capsule, and core records", async () => {
    const detail = await detailFor({
      window_start: "2027-04-02T11:55:10Z",
      window_end: "2027-04-02T12:25:10Z",
      failreason: "  Second stage anomaly  ",
      pad: {
        id: 80,
        name: "Space Launch Complex 40",
        description: null,
        map_image: "https://images.example.com/pad-map.png",
        location: { name: "Cape Canaveral", timezone_name: "America/New_York", description: "Florida coast" },
      },
      spacecraft_stage: {
        ...baseLaunch.spacecraft_stage,
        mission_end: "2027-04-12T00:00:00Z",
        launch_crew: [
          {
            role: { role: "Commander" },
            astronaut: {
              id: 11,
              name: "Pilot One",
              agency: { name: "NASA" },
              status: { name: "Active" },
              profile_image: "https://images.example.com/astronaut.png",
              wiki: "https://en.wikipedia.org/wiki/Pilot_One",
            },
          },
          { role: { role: "Specialist" }, astronaut: { id: 12 } },
          { role: { role: "Guest" }, astronaut: null },
        ],
        onboard_crew: [{ role: { role: "Duplicate" }, astronaut: { id: 11, name: "Pilot One" } }],
      },
      launcher_stage: [
        {
          reused: true,
          launcher_flight_number: 22,
          launcher: { id: 1080, serial_number: "B1080" },
          landing: {
            attempt: true,
            success: true,
            type: { name: "Autonomous Spaceport Drone Ship" },
            location: { name: "A Shortfall of Gravitas", location: { name: "Atlantic Ocean" } },
          },
        },
        {},
      ],
    });

    expect(detail.upcoming).toBe(true);
    expect(detail.window).toBe(1800);
    expect(detail.failures).toEqual([{ time: null, altitude: null, reason: "Second stage anomaly" }]);

    expect(detail.rocket).toMatchObject({
      id: "164",
      name: "Falcon 9 Block 5",
      type: "Block 5",
      active: true,
      boosters: 0,
      costPerLaunch: 52000000,
      successRatePct: 100,
      massKg: 549000,
      company: "SpaceX",
      heightMeters: 70,
      diameterMeters: 3.65,
    });
    expect(detail.launchpad).toMatchObject({
      id: "80",
      locality: "Cape Canaveral",
      timezone: "America/New_York",
      details: "Florida coast",
      image: "https://images.example.com/pad-map.png",
    });

    expect(detail.crew).toEqual([
      {
        id: "11",
        name: "Pilot One",
        role: "Commander",
        agency: "NASA",
        status: "Active",
        image: "https://images.example.com/astronaut.png",
        wikipedia: "https://en.wikipedia.org/wiki/Pilot_One",
      },
      {
        id: "12",
        name: "Unnamed crew member",
        role: "Specialist",
        agency: null,
        status: null,
        image: null,
        wikipedia: null,
      },
    ]);

    expect(detail.payloads).toEqual([
      {
        id: "7546",
        name: "Starlink Group 10-58",
        type: "Communications",
        customers: ["SpaceX"],
        manufacturers: ["SpaceX"],
        nationalities: ["USA"],
        orbit: "Low Earth Orbit",
        regime: "LEO",
        massKg: 6000,
        massLbs: null,
      },
    ]);
    expect(detail.capsules).toEqual([
      {
        id: "6",
        serial: "C212",
        status: "Active",
        type: "Capsule",
        reuseCount: 4,
        waterLandings: null,
        landLandings: null,
        lastUpdate: "2027-04-12T00:00:00Z",
      },
    ]);
    expect(detail.cores).toEqual([
      {
        id: "1080",
        serial: "B1080",
        flight: 22,
        reused: true,
        landingAttempt: true,
        landingSuccess: true,
        landingType: "Autonomous Spaceport Drone Ship",
        landpadName: "A Shortfall of Gravitas",
        landpadLocation: "Atlantic Ocean",
      },
      {
        id: null,
        serial: null,
        flight: null,
        reused: null,
        landingAttempt: null,
        landingSuccess: null,
        landingType: null,
        landpadName: null,
        landpadLocation: null,
      },
    ]);
  });

  it("leaves unknowable rocket and launch fields null rather than guessing", async () => {
    const detail = await detailFor({
      net: "2026-08-01T00:00:00Z",
      window_start: null,
      failreason: "   ",
      mission: null,
      pad: null,
      spacecraft_stage: null,
      rocket: {
        configuration: {
          name: "Falcon Heavy",
          full_name: "Falcon Heavy",
          family: "Falcon",
          active: null,
          pending_launches: 0,
          launch_cost: "unknown",
          launch_mass: "1420000",
          min_stage: 2,
        },
      },
    });

    expect(detail.upcoming).toBe(false);
    expect(detail.window).toBeNull();
    expect(detail.failures).toEqual([]);
    expect(detail.launchpad).toBeNull();
    expect(detail.payloads).toEqual([]);
    expect(detail.capsules).toEqual([]);
    expect(detail.rocket).toMatchObject({
      id: null,
      type: "Falcon",
      active: false,
      boosters: 2,
      stages: 2,
      costPerLaunch: null,
      successRatePct: null,
      massKg: 1420000,
      company: "SpaceX",
      country: null,
    });

    const noPending = await detailFor({
      rocket: { configuration: { name: "Prototype", launch_mass: null, successful_launches: 0, failed_launches: 0 } },
    });
    expect(noPending.rocket?.active).toBeNull();
    expect(noPending.rocket?.massKg).toBeNull();
    expect(noPending.rocket?.successRatePct).toBeNull();
    expect(noPending.rocket?.stages).toBeNull();

    const noRocket = await detailFor({ rocket: null });
    expect(noRocket.rocket).toBeNull();
  });
});

describe("spacexData snapshot build fallbacks", () => {
  beforeEach(liveSetup);
  afterEach(() => jest.useRealTimers());

  function routeSnapshotBuild(detail: (id: string) => unknown) {
    mockFetch.mockImplementation(async (input: string | URL) => {
      const url = String(input);
      if (url.includes("/launch/upcoming/")) return listOf();
      if (url.includes("/launch/previous/")) return llResponse(serveLl2PreviousPage(url));
      if (url.includes("/agencies/121/")) return llResponse(LL2_AGENCY);
      const id = url.match(/\/launch\/([0-9a-f-]{36})\//)?.[1] ?? "";
      return detail(id);
    });
  }

  it("uses the latest completed launch as hero and skips a detail that fails", async () => {
    let failedId: string | null = null;
    routeSnapshotBuild((id) => {
      if (failedId === null) {
        failedId = id;
        return llResponse({}, 500);
      }
      return llResponse({ ...LL2_NORMAL_ROW, id });
    });

    const snapshot = await buildMissionControlSnapshot();

    expect(snapshot.upcomingLaunches).toEqual([]);
    expect(snapshot.summary?.heroMode).toBe("fallback");
    expect(snapshot.summary?.heroLaunch?.id).toBe(snapshot.pastLaunches[0].id);
    expect(snapshot.summary?.heroMessage).toMatch(/latest completed launch/);
    expect(failedId).not.toBeNull();
    expect(Object.keys(snapshot.launchDetails)).not.toContain(failedId);
    expect(Object.keys(snapshot.launchDetails).length).toBeGreaterThan(0);
  });

  it("stops hydrating details at the first rate limit", async () => {
    routeSnapshotBuild(() => llResponse({}, 429, { "retry-after": "60" }));

    const snapshot = await buildMissionControlSnapshot();
    const detailRequests = mockFetch.mock.calls
      .map(([input]) => String(input))
      .filter((url) => /\/launch\/[0-9a-f-]{36}\//.test(url));

    expect(snapshot.launchDetails).toEqual({});
    expect(detailRequests).toHaveLength(1);
    // The rate-limit window also blocks the cadence page, so no partial count.
    expect(snapshot.cadence).toBeNull();
  });
});
