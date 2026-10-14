import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { EarthquakeSummary, QuakeEvent } from "@/types/earthquake";
import { EarthquakeClient } from "../earthquake-client";
import { DEFAULT_EARTHQUAKE_STATE } from "../earthquake-state";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
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

// A feed time after the fixture quake puts it inside the 24-hour window, so the trace and the plot draw it.
const drawn: EarthquakeSummary = { ...summary, feedUpdated: "2026-09-27T14:00:00.000Z" };

// A quake the live feed holds and the served snapshot does not.
const newer: QuakeEvent = { ...quake, id: "us6000u1w7", place: "Off the coast of Oregon" };

function client(served: EarthquakeSummary = summary) {
  return <EarthquakeClient initialState={DEFAULT_EARTHQUAKE_STATE} summary={served} />;
}

function renderClient(served: EarthquakeSummary = summary) {
  return render(client(served));
}

describe("EarthquakeClient", () => {
  beforeEach(() => {
    // By default the live read never answers, so the page keeps the summary it was served.
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // jsdom has no scrollIntoView, so a case that needs one sets it and this takes it away again.
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it("prints feed and quake times in UTC and says so", () => {
    renderClient();

    expect(
      screen.getByText(/feed updated Sep 27, 12:05\sPM UTC/)
    ).toBeInTheDocument();
    // The log row prints the quake's clock time; the full date opens with its detail.
    expect(screen.getByText(/13:30 UTC/)).toBeInTheDocument();
  });

  it("labels both quake counts as M2.5 and above in the trace's caption", () => {
    renderClient();

    expect(
      screen.getByText(
        "42 quakes of M2.5 or more in the past 24 hours and 319 over the past week. 17 of any magnitude drew a Did You Feel It? report."
      )
    ).toBeInTheDocument();
    // The day's strongest quake is labelled on the trace and, at phone width, in the caption.
    expect(screen.getByText(/The strongest was M5\.1, 90 km ENE of Tadine, New Caledonia\./)).toBeInTheDocument();
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
    rerender(client());

    const detail = screen.getByTestId("quake-inline-detail");
    expect(row.nextElementSibling).toBe(detail);
    expect(
      within(detail).getByRole("heading", { level: 3, name: "12 km SSE of Fern Forest, Hawaii" })
    ).toBeInTheDocument();
    // The row prints the clock alone, so the detail is where the quake's full date reads.
    expect(within(detail).getByText(/Sep 27, 1:30\sPM UTC/)).toBeInTheDocument();
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

  it("puts the log's tabs right after the trace, and a tab pushes its view", () => {
    renderClient();

    const trace = screen.getByRole("region", { name: "The past 24 hours" });
    const tablist = screen.getByRole("tablist", { name: "Earthquake view switcher" });
    expect(trace.compareDocumentPosition(tablist) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(tablist).getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Recent",
      "Significant",
      "Regions",
    ]);

    fireEvent.click(within(tablist).getByRole("tab", { name: "Significant" }));
    expect(mockPush).toHaveBeenLastCalledWith("/earthquake-pulse?view=significant", { scroll: false });
  });

  it("leaves the epicentre plot and its caption out when no quake falls in the trace's window", () => {
    // The fixture quake's origin time is after the feed time, so the 24-hour window is empty.
    const { container } = renderClient();
    expect(screen.queryByText(/Epicentres from the trace above/)).toBeNull();
    expect(container.querySelector(".eq-board")).toHaveAttribute("data-plot", "none");
    expect(screen.getByRole("tablist", { name: "Earthquake view switcher" })).toBeInTheDocument();
  });

  it("draws a quake inside the window on the trace and the plot, and a pick on either pushes its id", () => {
    const { container } = renderClient(drawn);

    expect(screen.getByRole("img", { name: /Epicentres of the past day's 1 quake on/ })).toBeInTheDocument();
    expect(screen.getByText(/Epicentres from the trace above/)).toBeInTheDocument();
    expect(container.querySelector(".eq-board")).not.toHaveAttribute("data-plot");

    fireEvent.click(container.querySelector(".eq-trace-svg rect") as Element);
    expect(mockPush).toHaveBeenLastCalledWith("/earthquake-pulse?quake=hv75044217", { scroll: false });
    mockPush.mockClear();
    fireEvent.click(container.querySelector(".eq-plot-svg circle") as Element);
    expect(mockPush).toHaveBeenLastCalledWith("/earthquake-pulse?quake=hv75044217", { scroll: false });
  });

  it("exposes a log row as a disclosure that is closed until its detail opens", () => {
    const { rerender } = renderClient();
    const row = screen.getByRole("button", { name: /Fern Forest/ });

    // The newest quake is marked by default, and that is not an open detail.
    expect(row).toHaveAttribute("aria-expanded", "false");
    expect(row).not.toHaveAttribute("aria-current");

    currentSearchParams = new URLSearchParams("quake=hv75044217");
    rerender(client());
    expect(row).toHaveAttribute("aria-expanded", "true");
  });

  it("exposes a region row as a disclosure for its strongest quake", () => {
    const withRegion: EarthquakeSummary = {
      ...summary,
      regions: [{ region: "Hawaii", count: 3, maxMagnitude: 3.3, strongestId: quake.id }],
    };
    currentSearchParams = new URLSearchParams("view=regions");
    const { rerender } = renderClient(withRegion);
    const row = screen.getByRole("button", { name: /Hawaii/ });
    expect(row).toHaveAttribute("aria-expanded", "false");

    currentSearchParams = new URLSearchParams("view=regions&quake=hv75044217");
    rerender(client(withRegion));
    expect(row).toHaveAttribute("aria-expanded", "true");
    expect(row).not.toHaveAttribute("aria-current");
  });

  it("dates each row of the 30-day Significant list, and leaves the 24-hour log on the clock alone", () => {
    const older: QuakeEvent = {
      ...quake,
      id: "us7000r3kx",
      magnitude: 6.5,
      place: "Kamchatka Peninsula, Russia",
      time: "2026-09-11T21:23:55.000Z",
    };
    const withSignificant: EarthquakeSummary = {
      ...summary,
      significant: [older],
      quakeDetails: { ...summary.quakeDetails, [older.id]: older },
    };
    currentSearchParams = new URLSearchParams("view=significant");
    const { rerender } = renderClient(withSignificant);

    const significantRow = screen.getByRole("button", { name: /Kamchatka/ });
    expect(significantRow).toHaveTextContent("Sep 11");
    expect(significantRow).toHaveTextContent("21:23 UTC");

    currentSearchParams = new URLSearchParams();
    rerender(client(withSignificant));
    expect(screen.getByRole("button", { name: /Fern Forest/ })).not.toHaveTextContent("Sep 27");
  });

  it("keeps the heading outline unbroken when a quake's detail opens", () => {
    currentSearchParams = new URLSearchParams("quake=hv75044217");
    renderClient();

    expect(screen.getAllByRole("heading").map((heading) => Number(heading.tagName.slice(1)))).toEqual([1, 2, 3]);
    expect(screen.getByRole("region", { name: "Earthquake log" })).toContainElement(
      screen.getByRole("heading", { level: 2, name: "Earthquake log" })
    );
  });

  it("holds a linked quake the served snapshot does not know until the live read answers, then opens it", async () => {
    respondWith({ ...summary, recent: [newer, quake], quakeDetails: { ...summary.quakeDetails, [newer.id]: newer } });
    currentSearchParams = new URLSearchParams("quake=us6000u1w7");
    renderClient();

    expect(await screen.findByTestId("quake-inline-detail")).toHaveTextContent("Off the coast of Oregon");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("carries a linked quake through a tab press while the live read is still out", () => {
    currentSearchParams = new URLSearchParams("quake=us6000u1w7");
    renderClient();

    fireEvent.click(screen.getByRole("tab", { name: "Significant" }));
    expect(mockPush).toHaveBeenLastCalledWith("/earthquake-pulse?quake=us6000u1w7&view=significant", { scroll: false });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("drops a linked quake from the URL once the live read answers without it", async () => {
    respondWith(summary);
    currentSearchParams = new URLSearchParams("quake=us6000u1w7");
    renderClient();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/earthquake-pulse", { scroll: false }));
    expect(screen.queryByTestId("quake-inline-detail")).toBeNull();
  });

  it("brings the top of the log back into view when a tab is pressed from the stuck toolbar", () => {
    const { container } = renderClient();
    const log = container.querySelector(".eq-log") as HTMLElement;
    log.scrollIntoView = jest.fn();
    const rect = jest.spyOn(log, "getBoundingClientRect").mockReturnValue({ top: 0 } as DOMRect);

    // The log's top is on screen, so the page stays where it is.
    fireEvent.click(screen.getByRole("tab", { name: "Significant" }));
    expect(log.scrollIntoView).not.toHaveBeenCalled();

    rect.mockReturnValue({ top: -400 } as DOMRect);
    fireEvent.click(screen.getByRole("tab", { name: "Regions" }));
    expect(log.scrollIntoView).toHaveBeenCalledWith({ block: "start" });
  });

  it("brings a detail opened from the trace into view, and leaves one opened from its own row where it is", () => {
    const scrollIntoView = jest.fn();
    // On the prototype, since the detail does not exist until the pick lands.
    Element.prototype.scrollIntoView = scrollIntoView;
    jest.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ top: 2000 } as DOMRect);
    const { container, rerender } = renderClient(drawn);

    fireEvent.click(container.querySelector(".eq-trace-svg rect") as Element);
    currentSearchParams = new URLSearchParams("quake=hv75044217");
    rerender(client(drawn));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByTestId("quake-inline-detail"));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center" });

    const row = screen.getByRole("button", { name: /Fern Forest/ });
    fireEvent.click(row);
    currentSearchParams = new URLSearchParams();
    rerender(client(drawn));
    fireEvent.click(row);
    currentSearchParams = new URLSearchParams("quake=hv75044217");
    rerender(client(drawn));
    expect(screen.getByTestId("quake-inline-detail")).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
