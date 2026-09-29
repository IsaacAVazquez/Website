/**
 * @jest-environment node
 */
import { earthquakeSnapshot } from "@/data/earthquakeSnapshot";
import type { EarthquakeSummary } from "@/types/earthquake";
import { buildEarthquakeSnapshotData } from "../earthquakeData";
import {
  getEarthquakeSummary,
  resetEarthquakeLiveCacheForTests,
} from "../earthquakeSnapshot";
import {
  USGS_ALL_DAY_FIXTURE,
  USGS_CAPTURE_NOW,
  USGS_SIGNIFICANT_MONTH_FIXTURE,
  USGS_WEEK_FIXTURE,
} from "./fixtures/usgsFeeds.fixture";

const FEED_BASE =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary";
const ALL_DAY_URL = `${FEED_BASE}/all_day.geojson`;
const WEEK_URL = `${FEED_BASE}/2.5_week.geojson`;
const SIGNIFICANT_MONTH_URL = `${FEED_BASE}/significant_month.geojson`;

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

interface FeatureOptions {
  id: string;
  mag?: number | null;
  place?: string | null;
  /** Offset in ms from `now` (negative = in the past). Defaults to a recent past. */
  timeOffsetMs?: number;
  /** When set, overrides the absolute epoch ms used for `time`. */
  timeMs?: number | null;
  coordinates?: (number | null)[] | null;
  felt?: number | null;
  alert?: string | null;
  tsunami?: number | null;
  sig?: number | null;
  magType?: string;
  type?: string;
  url?: string;
}

function makeFeature(now: number, opts: FeatureOptions) {
  const time =
    opts.timeMs !== undefined
      ? opts.timeMs
      : now + (opts.timeOffsetMs ?? -60_000);
  return {
    id: opts.id,
    type: "Feature",
    properties: {
      mag: "mag" in opts ? opts.mag : 4.0,
      place: opts.place ?? "10 km NE of Ridgecrest, CA",
      time,
      url: opts.url ?? `https://earthquake.usgs.gov/earthquakes/eventpage/${opts.id}`,
      felt: opts.felt ?? null,
      alert: opts.alert ?? null,
      tsunami: opts.tsunami ?? 0,
      sig: opts.sig ?? 100,
      magType: opts.magType ?? "ml",
      type: opts.type ?? "earthquake",
      title: `M ${opts.mag ?? 4.0} - ${opts.place ?? "somewhere"}`,
    },
    geometry: {
      type: "Point",
      coordinates: opts.coordinates ?? [-117.6, 35.7, 8.2],
    },
  };
}

function featureCollection(
  features: unknown[],
  generated: number
) {
  return {
    type: "FeatureCollection",
    metadata: { generated },
    features,
  };
}

/**
 * Routes a fetch call to the right feed payload based on its URL. Any feed not
 * supplied resolves to an empty FeatureCollection.
 */
function mockFeeds(feeds: {
  day?: unknown;
  week?: unknown;
  significant?: unknown;
}) {
  jest.spyOn(global, "fetch").mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url === ALL_DAY_URL) {
      return Promise.resolve(jsonResponse(feeds.day ?? emptyCollection()));
    }
    if (url === WEEK_URL) {
      return Promise.resolve(jsonResponse(feeds.week ?? emptyCollection()));
    }
    if (url === SIGNIFICANT_MONTH_URL) {
      return Promise.resolve(
        jsonResponse(feeds.significant ?? emptyCollection())
      );
    }
    return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
  });
}

function emptyCollection() {
  return {
    type: "FeatureCollection",
    metadata: { generated: Date.now() },
    features: [],
  };
}

describe("buildEarthquakeSnapshotData", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("normalizes recent quakes, filters significant, aggregates regions, and embeds detail", async () => {
    const now = Date.now();

    // all_day feed: one strong felt quake, one below the recent threshold,
    // one non-earthquake (quarry blast) that must be filtered out.
    const dayFeed = featureCollection(
      [
        makeFeature(now, {
          id: "us-day-strong",
          mag: 6.2,
          place: "12 km S of Eureka, CA",
          timeOffsetMs: -2 * 60 * 60 * 1000, // 2h ago -> within 24h
          felt: 540,
          alert: "green",
          coordinates: [-124.1, 40.6, 12.3],
          sig: 600,
        }),
        makeFeature(now, {
          id: "us-day-tiny",
          mag: 1.4, // below RECENT_MIN_MAGNITUDE (2.5) -> excluded from `recent`
          place: "5 km W of Hollister, CA",
          timeOffsetMs: -3 * 60 * 60 * 1000,
        }),
        makeFeature(now, {
          id: "us-day-blast",
          mag: 2.9,
          type: "quarry blast", // not an earthquake -> filtered
          place: "3 km N of Somewhere, NV",
          timeOffsetMs: -1 * 60 * 60 * 1000,
        }),
      ],
      now - 30_000
    );

    // 2.5_week feed: powers regions + magnitude buckets over 7 days.
    const weekFeed = featureCollection(
      [
        makeFeature(now, {
          id: "us-week-ca-1",
          mag: 4.1,
          place: "10 km NE of Ridgecrest, CA",
          timeOffsetMs: -1 * 24 * 60 * 60 * 1000, // 1d ago
          coordinates: [-117.6, 35.7, 5.0],
        }),
        makeFeature(now, {
          id: "us-week-ca-2",
          mag: 5.3,
          place: "8 km SE of Trona, CA",
          timeOffsetMs: -2 * 24 * 60 * 60 * 1000,
          tsunami: 0,
          coordinates: [-117.4, 35.8, 9.0],
        }),
        makeFeature(now, {
          id: "us-week-fiji",
          mag: 6.4,
          place: "south of the Fiji Islands",
          timeOffsetMs: -3 * 24 * 60 * 60 * 1000,
          tsunami: 1,
          coordinates: [178.0, -22.0, 540.0], // deep + tsunami flag
        }),
        makeFeature(now, {
          id: "us-week-stale",
          mag: 4.8,
          place: "near the Coast of Chile",
          timeOffsetMs: -10 * 24 * 60 * 60 * 1000, // older than 7d -> excluded
        }),
      ],
      now - 45_000
    );

    // significant_month feed: two flagged-significant quakes.
    const significantFeed = featureCollection(
      [
        makeFeature(now, {
          id: "us-sig-1",
          mag: 6.2,
          place: "12 km S of Eureka, CA",
          timeOffsetMs: -5 * 24 * 60 * 60 * 1000,
          sig: 650,
        }),
        makeFeature(now, {
          id: "us-sig-2",
          mag: 7.1, // strongest -> should sort first
          place: "Banda Sea",
          timeOffsetMs: -12 * 24 * 60 * 60 * 1000,
          sig: 900,
        }),
      ],
      now - 60_000
    );

    mockFeeds({ day: dayFeed, week: weekFeed, significant: significantFeed });

    const { summary } = await buildEarthquakeSnapshotData();

    // --- recent: only earthquakes >= 2.5 from the day feed ---
    expect(summary.recent.map((e) => e.id)).toEqual(["us-day-strong"]);
    const strong = summary.recent[0];
    expect(strong.magnitude).toBe(6.2);
    expect(strong.tier).toBe("strong"); // 6.x -> strong
    expect(strong.place).toBe("12 km S of Eureka, CA");
    expect(strong.region).toBe("CA"); // tail after last comma
    expect(strong.felt).toBe(540);
    expect(strong.alert).toBe("green");
    expect(strong.depthKm).toBe(12.3);
    expect(strong.latitude).toBe(40.6);
    expect(strong.longitude).toBe(-124.1);
    // ISO string, but don't assert the exact value (tz-safe).
    expect(typeof strong.time).toBe("string");
    expect(strong.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // --- significant: sorted strongest-first, count tracked ---
    expect(summary.significant.map((e) => e.id)).toEqual([
      "us-sig-2",
      "us-sig-1",
    ]);
    expect(summary.significant[0].magnitude).toBe(7.1);
    expect(summary.significant[0].tier).toBe("major");
    expect(summary.heroStats.significant30d).toBe(2);

    // --- hero stats from the day + week feeds ---
    // 2 valid earthquakes in the day feed (the quarry blast is filtered out),
    // both within the past 24h, and only the M6.2 clears the M2.5 floor.
    expect(summary.heroStats.total24h).toBe(1);
    expect(summary.heroStats.felt24h).toBe(1); // only the strong quake has felt
    expect(summary.heroStats.strongest24hMag).toBe(6.2);
    expect(summary.heroStats.strongest24hPlace).toBe("12 km S of Eureka, CA");
    // week feed: 3 of 4 events are within 7d (Chile is stale).
    expect(summary.heroStats.total7d).toBe(3);
    expect(summary.heroStats.largest7dMag).toBe(6.4); // Fiji
    expect(summary.heroStats.tsunamiAlerts7d).toBe(1); // Fiji
    expect(summary.heroStats.deepestKm).toBe(540); // Fiji depth, rounded

    // --- regions: grouped + aggregated from the week feed (within 7d only) ---
    const ca = summary.regions.find((r) => r.region === "CA");
    expect(ca).toBeDefined();
    expect(ca?.count).toBe(2); // Ridgecrest + Trona
    expect(ca?.maxMagnitude).toBe(5.3);
    expect(ca?.strongestId).toBe("us-week-ca-2");
    // Oceanic event with no comma falls back to the body after "of".
    const fiji = summary.regions.find((r) =>
      r.region.toLowerCase().includes("fiji")
    );
    expect(fiji).toBeDefined();
    expect(fiji?.count).toBe(1);
    // Stale Chile event excluded from the region map.
    expect(
      summary.regions.some((r) => r.region.toLowerCase().includes("chile"))
    ).toBe(false);

    // --- magnitude buckets: always 6 tiers, ordered, counts from week events ---
    expect(summary.magnitudeBuckets).toHaveLength(6);
    expect(summary.magnitudeBuckets.map((b) => b.tier)).toEqual([
      "minor",
      "light",
      "moderate",
      "strong",
      "major",
      "great",
    ]);
    const lightBucket = summary.magnitudeBuckets.find((b) => b.tier === "light");
    expect(lightBucket?.count).toBe(1); // 4.1 Ridgecrest
    const moderateBucket = summary.magnitudeBuckets.find(
      (b) => b.tier === "moderate"
    );
    expect(moderateBucket?.count).toBe(1); // 5.3 Trona
    const strongBucket = summary.magnitudeBuckets.find(
      (b) => b.tier === "strong"
    );
    expect(strongBucket?.count).toBe(1); // 6.4 Fiji

    // --- quakeDetails: flat id->event map covering recent + significant,
    // plus the strongest quake of each region ---
    expect(Object.keys(summary.quakeDetails).sort()).toEqual(
      [
        "us-day-strong",
        "us-sig-1",
        "us-sig-2",
        "us-week-ca-2",
        "us-week-fiji",
      ].sort()
    );
    expect(summary.quakeDetails["us-sig-2"].magnitude).toBe(7.1);

    // --- shape sanity ---
    expect(typeof summary.generatedAt).toBe("string");
    expect(summary.feedUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("throws when every feed comes back empty", async () => {
    mockFeeds({});
    await expect(buildEarthquakeSnapshotData()).rejects.toThrow(
      /no earthquakes/i
    );
  });

  it("produces a valid, fully-shaped snapshot when only the significant feed has data", async () => {
    const now = Date.now();
    const significantFeed = featureCollection(
      [
        makeFeature(now, {
          id: "us-sig-only",
          mag: 7.8,
          place: "Banda Sea",
          timeOffsetMs: -20 * 24 * 60 * 60 * 1000,
          sig: 950,
        }),
      ],
      now - 1000
    );

    mockFeeds({ significant: significantFeed });

    const { summary } = await buildEarthquakeSnapshotData();

    // Recent/region/bucket aggregates are empty-but-shaped, not crashes.
    expect(summary.recent).toEqual([]);
    expect(summary.regions).toEqual([]);
    expect(summary.magnitudeBuckets).toHaveLength(6);
    expect(summary.magnitudeBuckets.every((b) => b.count === 0)).toBe(true);

    // Hero stats degrade gracefully to zeros/nulls.
    expect(summary.heroStats.total24h).toBe(0);
    expect(summary.heroStats.total7d).toBe(0);
    expect(summary.heroStats.felt24h).toBe(0);
    expect(summary.heroStats.strongest24hMag).toBeNull();
    expect(summary.heroStats.strongest24hPlace).toBeNull();
    expect(summary.heroStats.largest7dMag).toBeNull();
    expect(summary.heroStats.deepestKm).toBeNull();
    expect(summary.heroStats.tsunamiAlerts7d).toBe(0);

    // The significant feed still flows through.
    expect(summary.significant.map((e) => e.id)).toEqual(["us-sig-only"]);
    expect(summary.heroStats.significant30d).toBe(1);
    expect(summary.quakeDetails["us-sig-only"].tier).toBe("major");
  });

  it("skips features with missing magnitude, time, or id", async () => {
    const now = Date.now();
    const dayFeed = featureCollection(
      [
        makeFeature(now, {
          id: "us-good",
          mag: 4.5,
          timeOffsetMs: -60 * 60 * 1000,
        }),
        // null magnitude -> dropped
        makeFeature(now, { id: "us-no-mag", mag: null }),
        // null time -> dropped
        makeFeature(now, { id: "us-no-time", mag: 5.0, timeMs: null }),
        // missing id -> dropped
        { ...makeFeature(now, { id: "x", mag: 5.0 }), id: undefined },
      ],
      now
    );

    mockFeeds({ day: dayFeed });

    const { summary } = await buildEarthquakeSnapshotData();
    expect(summary.recent.map((e) => e.id)).toEqual(["us-good"]);
    expect(summary.heroStats.total24h).toBe(1);
  });

  describe("with feeds shaped like the live USGS responses", () => {
    beforeEach(() => {
      jest.spyOn(Date, "now").mockReturnValue(USGS_CAPTURE_NOW);
      mockFeeds({
        day: USGS_ALL_DAY_FIXTURE,
        week: USGS_WEEK_FIXTURE,
        significant: USGS_SIGNIFICANT_MONTH_FIXTURE,
      });
    });

    it("keeps a detail record for every region's strongest quake", async () => {
      const { summary } = await buildEarthquakeSnapshotData();

      expect(summary.regions.map((region) => region.region).sort()).toEqual([
        "Alaska",
        "CA",
        "Hawaii",
        "Indonesia",
        "Nevada",
        "New Caledonia",
      ]);
      const withoutDetail = summary.regions
        .filter(
          (region) =>
            !region.strongestId ||
            !Object.hasOwn(summary.quakeDetails, region.strongestId)
        )
        .map((region) => region.region);
      expect(withoutDetail).toEqual([]);
      // Boonville is a week old event that no other list carries.
      expect(summary.quakeDetails["nc75442207"].place).toBe(
        "10 km W of Boonville, CA"
      );
    });

    it("counts the 24 hour total from M2.5 and above, as the 7 day total does", async () => {
      const { summary } = await buildEarthquakeSnapshotData();

      // Ten quakes in the day feed, four of them M2.5 or above once the
      // M2.47 event rounds to 2.5 the way USGS lists it.
      expect(summary.heroStats.total24h).toBe(4);
      expect(summary.heroStats.total7d).toBe(8);
      expect(summary.heroStats.total24h).toBeLessThanOrEqual(
        summary.heroStats.total7d
      );
      expect(summary.recent).toHaveLength(summary.heroStats.total24h);
    });

    it("still reads felt reports and the strongest quake from every magnitude", async () => {
      const { summary } = await buildEarthquakeSnapshotData();

      // Three of the five felt quakes are below M2.5.
      expect(summary.heroStats.felt24h).toBe(5);
      expect(summary.heroStats.strongest24hMag).toBe(5.1);
      expect(summary.heroStats.strongest24hPlace).toBe(
        "90 km ENE of Tadine, New Caledonia"
      );
    });
  });
});

/** Never answers, and rejects only when the caller's signal aborts. */
function hangingFetch(_input: RequestInfo | URL, init?: RequestInit) {
  return new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal;
    signal?.addEventListener("abort", () => reject(signal.reason), {
      once: true,
    });
  });
}

// AbortSignal.timeout runs on a Node internal timer that fake timers cannot
// advance, so the tests swap in one built on setTimeout. The reason is a plain
// Error because a DOMException from outside Jest's sandbox fails instanceof.
function installFakeAbortTimeout() {
  jest.useFakeTimers();
  jest.spyOn(AbortSignal, "timeout").mockImplementation((ms: number) => {
    const controller = new AbortController();
    setTimeout(
      () =>
        controller.abort(
          Object.assign(new Error("The operation timed out."), {
            name: "TimeoutError",
          })
        ),
      ms
    );
    return controller.signal;
  });
}

describe("USGS fetch budget", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("keeps three 15 second attempts per feed for the snapshot builder", async () => {
    installFakeAbortTimeout();
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockImplementation(hangingFetch);

    const build = buildEarthquakeSnapshotData();
    const outcome = expect(build).rejects.toMatchObject({
      name: "TimeoutError",
    });
    await jest.advanceTimersByTimeAsync(47_999);
    expect(fetchSpy).toHaveBeenCalledTimes(9);
    await jest.advanceTimersByTimeAsync(1);

    await outcome;
  });

  it("stops after the attempts and timeout the caller passes", async () => {
    installFakeAbortTimeout();
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockImplementation(hangingFetch);

    const build = buildEarthquakeSnapshotData({
      timeoutMs: 4_000,
      attempts: 1,
    });
    const outcome = expect(build).rejects.toMatchObject({
      name: "TimeoutError",
    });
    await jest.advanceTimersByTimeAsync(4_000);

    await outcome;
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});

describe("getEarthquakeSummary live path", () => {
  beforeEach(() => {
    resetEarthquakeLiveCacheForTests();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("serves the committed snapshot within 5 seconds when USGS never answers", async () => {
    installFakeAbortTimeout();
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockImplementation(hangingFetch);

    let served: EarthquakeSummary | undefined;
    void getEarthquakeSummary({ preferLive: true }).then((summary) => {
      served = summary;
    });
    await jest.advanceTimersByTimeAsync(4_999);

    expect(served?.generatedAt).toBe(earthquakeSnapshot.summary.generatedAt);
    expect(served?.feedStatus).toBe("stale-fallback");
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it.each([
    [
      // USGS answers a missing feed with status 200 and this plain text body.
      "its plain text 404 page",
      () =>
        new Response("404 File Not Found", {
          status: 200,
          headers: {
            "content-type": "text/plain;charset=UTF-8",
            status: "404 Not Found",
          },
        }),
    ],
    [
      "an HTML error page",
      () =>
        new Response("<html>Service Unavailable</html>", {
          status: 503,
          headers: { "content-type": "text/html" },
        }),
    ],
    ["feeds with no quakes in them", () => jsonResponse(emptyCollection())],
  ])(
    "marks the committed snapshot as a fallback when USGS returns %s",
    async (_label, respond) => {
      jest
        .spyOn(global, "fetch")
        .mockImplementation(() => Promise.resolve(respond()));

      const summary = await getEarthquakeSummary({ preferLive: true });

      expect(summary.generatedAt).toBe(earthquakeSnapshot.summary.generatedAt);
      expect(summary.recent).toEqual(earthquakeSnapshot.summary.recent);
      expect(summary.feedStatus).toBe("stale-fallback");
    }
  );

  it("leaves a live summary unmarked", async () => {
    jest.spyOn(Date, "now").mockReturnValue(USGS_CAPTURE_NOW);
    mockFeeds({
      day: USGS_ALL_DAY_FIXTURE,
      week: USGS_WEEK_FIXTURE,
      significant: USGS_SIGNIFICANT_MONTH_FIXTURE,
    });

    const summary = await getEarthquakeSummary({ preferLive: true });

    expect(summary.generatedAt).toBe(new Date(USGS_CAPTURE_NOW).toISOString());
    expect(summary.feedStatus).toBeUndefined();
  });
});
