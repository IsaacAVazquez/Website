import { fireEvent, render, screen, within } from "@testing-library/react";
import type { EarthquakeSummary, QuakeEvent } from "@/types/earthquake";
import { EarthquakeClient } from "../earthquake-client";
import { DEFAULT_EARTHQUAKE_STATE } from "../earthquake-state";

const mockPush = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useSearchParams: () => currentSearchParams,
}));

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
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
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

  it("opens a picked quake's detail right under its log row and closes it on a second press", () => {
    const { rerender } = renderClient();
    const row = screen.getByRole("button", { name: /Fern Forest/ });

    // Nothing is open until a quake is picked, so the log starts as a plain list.
    expect(screen.queryByTestId("quake-inline-detail")).toBeNull();
    fireEvent.click(row);
    expect(mockPush).toHaveBeenLastCalledWith("/earthquake-pulse?quake=hv75044217", { scroll: false });

    currentSearchParams = new URLSearchParams("quake=hv75044217");
    rerender(<EarthquakeClient initialState={DEFAULT_EARTHQUAKE_STATE} summary={summary} />);

    const detail = screen.getByTestId("quake-inline-detail");
    expect(row.nextElementSibling).toBe(detail);
    expect(
      within(detail).getByRole("heading", { level: 3, name: "12 km SSE of Fern Forest, Hawaii" })
    ).toBeInTheDocument();
    expect(within(detail).getByText("Coordinates")).toBeInTheDocument();

    fireEvent.click(row);
    expect(mockPush).toHaveBeenLastCalledWith("/earthquake-pulse", { scroll: false });
  });

  it("keeps a picked quake's detail in the log panel when the open view does not list it", () => {
    currentSearchParams = new URLSearchParams("view=significant&quake=hv75044217");
    renderClient();

    const detail = screen.getByTestId("quake-inline-detail");
    expect(screen.getByRole("tabpanel")).toContainElement(detail);
    expect(within(detail).getByRole("heading", { level: 3, name: /Fern Forest/ })).toBeInTheDocument();
    expect(screen.getByText("No significant quakes in the past 30 days.")).toBeInTheDocument();
  });

  it("offers the log's views under the summary, and a jump lands on the matching tab", () => {
    renderClient();

    const jumps = screen.getByRole("group", { name: "Jump to a log view" });
    expect(within(jumps).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Recent",
      "Significant",
      "Regions",
    ]);
    // The jumps sit in the hero's action slot, so they print ahead of the figures and the seismogram.
    const figures = document.querySelector(".c97-project-hero-readouts") as HTMLElement;
    expect(jumps.compareDocumentPosition(figures) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(within(jumps).getByRole("button", { name: "Significant" }));
    expect(mockPush).toHaveBeenLastCalledWith("/earthquake-pulse?view=significant", { scroll: false });
    expect(screen.getByRole("tab", { name: "Significant" })).toHaveFocus();
  });
});
