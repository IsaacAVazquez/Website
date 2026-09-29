import { render, screen } from "@testing-library/react";
import type { EarthquakeSummary, QuakeEvent } from "@/types/earthquake";
import { EarthquakeClient } from "../earthquake-client";
import { DEFAULT_EARTHQUAKE_STATE } from "../earthquake-state";

const quake: QuakeEvent = {
  id: "hv75044217",
  magnitude: 3.3,
  magType: "ml",
  place: "12 km SSE of Fern Forest, Hawaii",
  region: "Hawaii",
  time: "2026-09-27T13:30:36.020Z",
  depthKm: 6.2,
  longitude: -155.1,
  latitude: 19.4,
  tsunami: false,
  felt: 6,
  alert: null,
  significance: 171,
  url: "https://earthquake.usgs.gov/earthquakes/eventpage/hv75044217",
  tier: "minor",
};

const summary: EarthquakeSummary = {
  generatedAt: "2026-09-27T12:05:55.567Z",
  feedUpdated: "2026-09-27T12:05:13.000Z",
  heroStats: {
    total24h: 42,
    total7d: 319,
    felt24h: 17,
    strongest24hMag: 5.1,
    strongest24hPlace: "90 km ENE of Tadine, New Caledonia",
    significant30d: 7,
    largest7dMag: 6.6,
    tsunamiAlerts7d: 0,
    deepestKm: 584,
  },
  recent: [quake],
  significant: [],
  magnitudeBuckets: [],
  regions: [],
  quakeDetails: { [quake.id]: quake },
};

function respondWith(next: EarthquakeSummary | null) {
  global.fetch = jest.fn(async () => ({
    ok: next !== null,
    json: async () => next,
  })) as unknown as typeof fetch;
}

function renderClient() {
  return render(
    <EarthquakeClient initialState={DEFAULT_EARTHQUAKE_STATE} summary={summary} />
  );
}

describe("EarthquakeClient", () => {
  beforeEach(() => {
    respondWith(null);
  });

  it("prints feed and quake times in UTC and says so", () => {
    renderClient();

    expect(
      screen.getByText(/feed updated Sep 27, 12:05\sPM UTC/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Sep 27, 1:30\sPM UTC/)).toBeInTheDocument();
  });

  it("labels both quake counts as M2.5 and above", () => {
    renderClient();

    expect(screen.getByText("M2.5+ quakes in 24h")).toBeInTheDocument();
    expect(
      screen.getByText("319 M2.5+ over the past week")
    ).toBeInTheDocument();
    expect(
      screen.getByText("of any magnitude, with a Did You Feel It? report")
    ).toBeInTheDocument();
  });

  it("says when the API served the committed snapshot in place of USGS", async () => {
    respondWith({ ...summary, feedStatus: "stale-fallback" });
    renderClient();

    expect(
      await screen.findByText(/USGS could not be reached/)
    ).toBeInTheDocument();
  });

  it("does not mention a fallback while USGS is answering", async () => {
    respondWith({ ...summary, feedUpdated: "2026-09-27T12:10:13.000Z" });
    renderClient();

    expect(
      await screen.findByText(/feed updated Sep 27, 12:10\sPM UTC/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/could not be reached/)).not.toBeInTheDocument();
  });

  it("describes the page as a live read with a daily snapshot behind it", () => {
    renderClient();

    expect(screen.getByText("Data note")).toBeInTheDocument();
    expect(
      screen.getByText(
        /reads the public USGS Earthquake Hazards Program feeds each time it loads/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/falls back to a snapshot saved once a day/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/refreshed on a schedule/)).not.toBeInTheDocument();
  });
});
