/**
 * @jest-environment node
 */
jest.mock("@/lib/earthquakeData", () => ({
  buildEarthquakeSnapshotData: jest.fn(),
}));

import { earthquakeSnapshot } from "@/data/earthquakeSnapshot";
import { buildEarthquakeSnapshotData } from "@/lib/earthquakeData";
import {
  getEarthquakeSummary,
  resetEarthquakeLiveCacheForTests,
} from "@/lib/earthquakeSnapshot";
import type { EarthquakeSummary } from "@/types/earthquake";

const mockBuild = buildEarthquakeSnapshotData as jest.MockedFunction<
  typeof buildEarthquakeSnapshotData
>;

function liveSummary(generatedAt: string): EarthquakeSummary {
  return {
    ...earthquakeSnapshot.summary,
    generatedAt,
  };
}

describe("getEarthquakeSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetEarthquakeLiveCacheForTests();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the committed snapshot without fetching when preferLive is off", async () => {
    const summary = await getEarthquakeSummary();

    expect(summary).toBe(earthquakeSnapshot.summary);
    expect(mockBuild).not.toHaveBeenCalled();
  });

  it("collapses concurrent live requests into a single USGS fetch", async () => {
    let resolveBuild: (value: { summary: EarthquakeSummary }) => void;
    mockBuild.mockReturnValue(
      new Promise((resolve) => {
        resolveBuild = resolve;
      }) as ReturnType<typeof buildEarthquakeSnapshotData>
    );

    const first = getEarthquakeSummary({ preferLive: true });
    const second = getEarthquakeSummary({ preferLive: true });
    resolveBuild!({ summary: liveSummary("2026-07-20T10:00:00.000Z") });

    const [a, b] = await Promise.all([first, second]);

    expect(mockBuild).toHaveBeenCalledTimes(1);
    expect(a.generatedAt).toBe("2026-07-20T10:00:00.000Z");
    expect(b).toBe(a);
  });

  it("serves the cached live summary until the TTL lapses, then refetches", async () => {
    jest.useFakeTimers();
    mockBuild.mockResolvedValue({
      summary: liveSummary("2026-07-20T10:00:00.000Z"),
    } as Awaited<ReturnType<typeof buildEarthquakeSnapshotData>>);

    await getEarthquakeSummary({ preferLive: true });
    await getEarthquakeSummary({ preferLive: true });
    expect(mockBuild).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(61_000);
    await getEarthquakeSummary({ preferLive: true });
    expect(mockBuild).toHaveBeenCalledTimes(2);
  });

  it("falls back to the committed snapshot on failure without negative-caching", async () => {
    mockBuild.mockRejectedValueOnce(new Error("USGS unavailable"));

    const fallback = await getEarthquakeSummary({ preferLive: true });
    expect(fallback).toBe(earthquakeSnapshot.summary);

    mockBuild.mockResolvedValueOnce({
      summary: liveSummary("2026-07-20T11:00:00.000Z"),
    } as Awaited<ReturnType<typeof buildEarthquakeSnapshotData>>);

    const recovered = await getEarthquakeSummary({ preferLive: true });
    expect(recovered.generatedAt).toBe("2026-07-20T11:00:00.000Z");
    expect(mockBuild).toHaveBeenCalledTimes(2);
  });
});
