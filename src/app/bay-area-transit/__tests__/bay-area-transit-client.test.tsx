import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { TransitStationBoard, TransitSummary } from "@/types/bayAreaTransit";
import { BayAreaTransitClient } from "../bay-area-transit-client";
import { DEFAULT_TRANSIT_STATE } from "../bay-area-transit-state";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

const NOW = Date.parse("2026-10-03T19:00:00Z");
const GENERATED_AT = new Date(NOW).toISOString();

const SUMMARY: TransitSummary = {
  system: {
    name: "Bay Area Rapid Transit",
    abbr: "BART",
    source: "BART API",
    feedTime: "12:00:00 PM PDT",
    generatedAt: GENERATED_AT,
    seed: false,
  },
  heroStats: { lineCount: 2, stationCount: 3, activeAdvisories: 0, elevatorOutages: 0, trainsTracked: 4 },
  lines: [
    {
      id: "antioch-sfo",
      routeId: "ROUTE 1",
      name: "Antioch to SFO",
      colorName: "Yellow",
      hexColor: "#ffff33",
      origin: "ANTC",
      destination: "SFIA",
      stationCount: 12,
    },
    {
      id: "richmond-berryessa",
      routeId: "ROUTE 3",
      name: "Richmond to Berryessa",
      colorName: "Orange",
      hexColor: "#ff9933",
      origin: "",
      destination: "",
      stationCount: 9,
    },
  ],
  stations: [
    { id: "embr", abbr: "EMBR", name: "Embarcadero", city: "San Francisco", latitude: 37.793, longitude: -122.397, lines: ["Yellow", "Orange"] },
    { id: "mont", abbr: "MONT", name: "Montgomery St.", city: "San Francisco", latitude: 37.789, longitude: -122.401, lines: ["Yellow"] },
    { id: "rich", abbr: "RICH", name: "Richmond", city: "", latitude: 37.937, longitude: -122.353, lines: ["Purple"] },
  ],
  advisories: [],
  elevator: [],
  sectionStatus: { advisories: "fresh", elevator: "fresh", departures: "fresh" },
  defaultStation: "embr",
};

function board(id: string, name: string, destination: string): TransitStationBoard {
  return {
    id,
    abbr: id.toUpperCase(),
    name,
    generatedAt: GENERATED_AT,
    departures: [
      {
        destination,
        destinationAbbr: destination.slice(0, 4).toUpperCase(),
        minutes: 4,
        platform: "2",
        direction: "North",
        length: 8,
        colorName: "YELLOW",
        hexColor: "#ffff33",
        delaySeconds: 0,
        bikesAllowed: true,
      },
    ],
  };
}

type Responder = (url: string) => Promise<unknown>;

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });
}

const never = () => new Promise(() => {});

function mockFetch(responder: Responder) {
  const fn = jest.fn((url: string) => responder(url));
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

function renderClient(
  props: Partial<React.ComponentProps<typeof BayAreaTransitClient>> = {}
) {
  const ui = (extra: typeof props = {}) => (
    <BayAreaTransitClient
      initialState={DEFAULT_TRANSIT_STATE}
      summary={SUMMARY}
      initialStationBoard={board("embr", "Embarcadero", "Antioch")}
      {...props}
      {...extra}
    />
  );
  const view = render(ui());
  return { ...view, rerenderWith: (extra: typeof props = {}) => view.rerender(ui(extra)) };
}

describe("BayAreaTransitClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(NOW);
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
    // By default the summary refresh never answers, so the page keeps its props.
    mockFetch(never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("shows only the hero when there is no transit snapshot yet", () => {
    renderClient({ summary: { ...SUMMARY, system: null } });
    expect(screen.getByText("The transit snapshot is not available yet.")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("prints the network totals, the default station's board, and every line", async () => {
    renderClient();

    expect(screen.getByRole("heading", { level: 1, name: "Bay Area Transit Pulse" })).toBeInTheDocument();
    // The hero carries no readouts; the alert count rides on the Alerts tab, bare at zero.
    expect(screen.getByRole("tab", { name: "Alerts" })).toBeInTheDocument();
    expect(screen.getByText(/^BART API · feed 12:00:00 PM PDT · refreshed /)).toBeInTheDocument();
    expect(screen.queryByText(/seed data/)).toBeNull();

    expect(screen.getByRole("heading", { level: 2, name: "Embarcadero" })).toBeInTheDocument();
    expect(screen.getByText("Antioch")).toBeInTheDocument();
    expect(screen.getByText("4 min")).toBeInTheDocument();

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("id", "transit-tabpanel-lines");
    expect(within(panel).getByRole("heading", { name: "Antioch to SFO" })).toBeInTheDocument();
    expect(within(panel).getByText("Yellow line")).toBeInTheDocument();
    expect(within(panel).getByText("ANTC → SFIA")).toBeInTheDocument();
    expect(within(panel).getByText("12 stops")).toBeInTheDocument();
    // A line without endpoints prints dashes rather than an empty arrow.
    expect(within(panel).getByText("— → —")).toBeInTheDocument();

    // The server board covers the default station, so only the summary refresh goes out.
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/bay-area-transit/summary", expect.objectContaining({ cache: "no-store" }));
    await waitFor(() => expect(mockReplace).not.toHaveBeenCalled());
  });

  it("switches views by click and by arrow, Home, and End keys", () => {
    renderClient();

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Lines", "Alerts"]);

    fireEvent.click(screen.getByRole("tab", { name: "Alerts" }));
    expect(mockPush).toHaveBeenLastCalledWith("/bay-area-transit?view=advisories", { scroll: false });

    const lines = screen.getByRole("tab", { name: "Lines" });
    expect(lines).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Alerts" })).toHaveAttribute("tabindex", "-1");

    mockPush.mockClear();
    fireEvent.keyDown(lines, { key: "ArrowRight" });
    expect(mockPush).toHaveBeenLastCalledWith("/bay-area-transit?view=advisories", { scroll: false });
    expect(screen.getByRole("tab", { name: "Alerts" })).toHaveFocus();

    lines.focus();
    mockPush.mockClear();
    fireEvent.keyDown(lines, { key: "ArrowLeft" });
    expect(mockPush).toHaveBeenLastCalledWith("/bay-area-transit?view=advisories", { scroll: false });
    expect(screen.getByRole("tab", { name: "Alerts" })).toHaveFocus();

    mockPush.mockClear();
    fireEvent.keyDown(lines, { key: "End" });
    expect(mockPush).toHaveBeenLastCalledWith("/bay-area-transit?view=advisories", { scroll: false });

    mockPush.mockClear();
    fireEvent.keyDown(lines, { key: "Home" });
    // Home lands on the view already in the URL, so nothing is pushed.
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.keyDown(lines, { key: "a" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("lists every station on the board with its line dots, and closes the list on a pick", () => {
    renderClient();
    const finder = within(document.querySelector(".c97-transit-finder") as HTMLElement);

    // The list starts closed, so the board sits right under the search field.
    expect(finder.queryByRole("button", { name: /Richmond/ })).toBeNull();
    const toggle = screen.getByRole("button", { name: "Show all 3 stations" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const board = toggle.closest(".c97-transit-board") as HTMLElement;
    expect(within(board).getByRole("heading", { level: 2, name: "Embarcadero" })).toBeInTheDocument();

    const embr = within(board).getByRole("button", { name: /Embarcadero/ });
    expect(embr).toHaveAttribute("aria-current", "true");
    expect(within(embr).getByRole("img", { name: "Yellow line" })).toBeInTheDocument();
    expect(within(embr).getByRole("img", { name: "Orange line" })).toBeInTheDocument();

    const rich = within(board).getByRole("button", { name: /Richmond/ });
    expect(rich).not.toHaveAttribute("aria-current");
    expect(within(rich).getByText("Bay Area")).toBeInTheDocument();
    expect(within(rich).getByRole("img", { name: "Purple line" })).toBeInTheDocument();

    fireEvent.click(within(board).getByRole("button", { name: /Montgomery/ }));
    expect(mockPush).toHaveBeenLastCalledWith("/bay-area-transit?station=mont", { scroll: false });
    // The list closes and focus goes back to the control that opened it.
    expect(finder.queryByRole("button", { name: /Richmond/ })).toBeNull();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("searches stations by name or city and returns focus to the field on a keyboard pick", () => {
    renderClient();
    const search = screen.getByLabelText("Find a station");
    const finder = within(search.closest(".c97-transit-finder") as HTMLElement);

    fireEvent.change(search, { target: { value: "zzz" } });
    expect(finder.getByRole("status")).toHaveTextContent("No station matches that search.");

    fireEvent.change(search, { target: { value: "san fran" } });
    expect(finder.getByRole("button", { name: /Embarcadero/ })).toBeInTheDocument();
    expect(finder.getByRole("button", { name: /Montgomery/ })).toBeInTheDocument();
    expect(finder.queryByRole("button", { name: /Richmond/ })).toBeNull();
    // The whole-list toggle steps aside while a search is typed.
    expect(screen.queryByRole("button", { name: /Show all/ })).toBeNull();

    fireEvent.change(search, { target: { value: " MONT " } });
    expect(finder.queryByRole("button", { name: /Embarcadero/ })).toBeNull();
    // fireEvent's click carries no click count, which is how a keyboard press arrives.
    fireEvent.click(finder.getByRole("button", { name: /Montgomery/ }));

    expect(mockPush).toHaveBeenLastCalledWith("/bay-area-transit?station=mont", { scroll: false });
    expect(search).toHaveValue("");
    expect(search).toHaveFocus();
    expect(finder.queryByRole("button", { name: /Montgomery/ })).toBeNull();
  });

  it("scrolls the finder to the top on a tap without focusing the field", () => {
    renderClient();
    const search = screen.getByLabelText("Find a station") as HTMLInputElement;
    const finderEl = search.closest(".c97-transit-finder") as HTMLElement;
    const finder = within(finderEl);
    finderEl.scrollIntoView = jest.fn();

    fireEvent.change(search, { target: { value: "rich" } });
    fireEvent.click(finder.getByRole("button", { name: /Richmond/ }), { detail: 1 });

    expect(mockPush).toHaveBeenLastCalledWith("/bay-area-transit?station=rich", { scroll: false });
    // Top of the screen, so the board under the finder is in view wherever the field sat.
    expect(finderEl.scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    expect(search).not.toHaveFocus();
  });

  it("loads the board for a deep-linked station", async () => {
    currentSearchParams = new URLSearchParams("view=stations&station=mont");
    let answer: (value: unknown) => void = () => {};
    const fetchMock = mockFetch((url) =>
      url.includes("/stations/")
        ? new Promise((resolve) => {
            answer = resolve;
          })
        : never()
    );

    // The server sends the board for the station in the URL, and here it had none.
    renderClient({ initialStationBoard: null });
    expect(screen.getByRole("heading", { level: 2, name: "Montgomery St." })).toBeInTheDocument();
    expect(screen.getByText("Loading departures…")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/bay-area-transit/stations/mont", expect.anything());

    await act(async () => {
      answer(await jsonResponse(board("mont", "Montgomery St.", "Daly City")));
    });
    expect(await screen.findByText("Daly City")).toBeInTheDocument();
    expect(screen.queryByText("Loading departures…")).toBeNull();
    // The retired Departures view drops out of the URL and the station stays.
    expect(mockReplace).toHaveBeenCalledWith("/bay-area-transit?station=mont", { scroll: false });
  });

  it("treats a 404 board as a station with no trains rather than an error", async () => {
    currentSearchParams = new URLSearchParams("station=rich");
    mockFetch((url) => (url.includes("/stations/") ? jsonResponse({ error: "Not found" }, 404) : never()));

    // The server sends the board for the station in the URL, and here it had none.
    renderClient({ initialStationBoard: null });
    expect(await screen.findByText("No trains are scheduled at Richmond right now.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a failed board with a retry that loads it again", async () => {
    currentSearchParams = new URLSearchParams("station=mont");
    let attempts = 0;
    const fetchMock = mockFetch((url) => {
      if (!url.includes("/stations/")) return never();
      attempts += 1;
      return attempts === 1
        ? jsonResponse({ error: "BART is down" }, 503)
        : jsonResponse(board("mont", "Montgomery St.", "Millbrae"));
    });

    // The server sends the board for the station in the URL, and here it had none.
    renderClient({ initialStationBoard: null });
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("BART is down");

    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Millbrae")).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) => url.includes("/stations/"))).toHaveLength(2);
  });

  it("falls back to a generic message when the board error has none", async () => {
    currentSearchParams = new URLSearchParams("station=mont");
    mockFetch((url) => (url.includes("/stations/") ? jsonResponse({}, 500) : never()));

    // The server sends the board for the station in the URL, and here it had none.
    renderClient({ initialStationBoard: null });
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load station board.");
  });

  it("keeps the alerts view when a station is picked on the map", () => {
    currentSearchParams = new URLSearchParams("view=advisories");
    const { container } = renderClient();

    fireEvent.click(container.querySelectorAll('.c97-transit-map svg[role="img"] g')[1]);
    expect(mockPush).toHaveBeenLastCalledWith(
      expect.stringMatching(/^\/bay-area-transit\?view=advisories&station=[a-z]+$/),
      { scroll: false }
    );
  });

  it("reports normal service when there are no alerts", () => {
    currentSearchParams = new URLSearchParams("view=advisories");
    renderClient();
    expect(screen.getByText(/No delays reported and all elevators in service/)).toBeInTheDocument();
  });

  it("lists advisories and elevator outages", () => {
    currentSearchParams = new URLSearchParams("view=advisories");
    renderClient({
      summary: {
        ...SUMMARY,
        heroStats: { ...SUMMARY.heroStats, activeAdvisories: 2 },
        advisories: [
          { id: "a1", type: "DELAY", description: "Ten minute delay in the Transbay Tube.", station: "EMBR", posted: "" },
          { id: "a2", type: "", description: "Single tracking near Richmond.", station: null, posted: "" },
        ],
        elevator: [{ id: "e1", description: "Montgomery street elevator is out.", posted: "" }],
      },
    });

    expect(screen.getByRole("tab", { name: "Alerts · 3" })).toBeInTheDocument();
    expect(screen.getByText("DELAY · EMBR")).toBeInTheDocument();
    expect(screen.getByText("Ten minute delay in the Transbay Tube.")).toBeInTheDocument();
    expect(screen.getByText("Advisory")).toBeInTheDocument();
    expect(screen.getByText("Montgomery street elevator is out.")).toBeInTheDocument();
    expect(screen.queryByText(/No delays reported/)).toBeNull();
  });

  it("flags feeds held from the last good snapshot instead of showing a false zero", () => {
    currentSearchParams = new URLSearchParams("view=advisories");
    renderClient({
      summary: {
        ...SUMMARY,
        system: { ...SUMMARY.system!, seed: true, feedTime: "" },
        sectionStatus: { advisories: "stale-fallback", elevator: "unavailable", departures: "fresh" },
      },
    });

    expect(
      screen.getByText(/feed time unavailable · refreshed .* · seed data · advisories, elevator from the last good snapshot$/)
    ).toBeInTheDocument();
    expect(screen.getByText(/did not return fresh advisories, elevator data/)).toBeInTheDocument();
    expect(screen.queryByText(/No delays reported/)).toBeNull();
    expect(screen.getByText(/This is a hand-authored seed shipped with the app/)).toBeInTheDocument();
  });

  it("says so when the snapshot has no station to show", () => {
    renderClient({ summary: { ...SUMMARY, defaultStation: null }, initialStationBoard: null });
    expect(screen.getByText("No station is available in the current snapshot.")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("replaces the summary when the refresh answers, and refreshes again each minute while visible", async () => {
    const intervalSpy = jest.spyOn(window, "setInterval");
    const fresh: TransitSummary = {
      ...SUMMARY,
      advisories: [{ id: "a1", type: "DELAY", description: "Delay.", station: null, posted: "" }],
    };
    const fetchMock = mockFetch((url) =>
      url.endsWith("/summary")
        ? jsonResponse(fresh)
        : jsonResponse(board("embr", "Embarcadero", "Pittsburg/Bay Point"))
    );

    renderClient();
    expect(await screen.findByRole("tab", { name: "Alerts · 1" })).toBeInTheDocument();
    // The refresh clears the held boards, so the default station's board is fetched fresh.
    expect(await screen.findByText("Pittsburg/Bay Point")).toBeInTheDocument();

    const tick = intervalSpy.mock.calls.find(([, delay]) => delay === 60_000)?.[0] as () => void;
    const summaryCalls = () => fetchMock.mock.calls.filter(([url]) => url.endsWith("/summary")).length;
    expect(summaryCalls()).toBe(1);

    await act(async () => tick());
    expect(summaryCalls()).toBe(2);

    const visibility = jest.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    await act(async () => tick());
    expect(summaryCalls()).toBe(2);
    visibility.mockRestore();
  });

  it("keeps the last good summary when the refresh fails", async () => {
    const fetchMock = mockFetch(() => jsonResponse({ error: "nope" }, 500));
    renderClient();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.getByRole("tab", { name: "Alerts" })).toBeInTheDocument();
    expect(screen.getByText("Antioch")).toBeInTheDocument();
  });

  it("drops an unknown station from the URL and shows the default board", async () => {
    currentSearchParams = new URLSearchParams("view=advisories&station=zzzz");
    renderClient();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/bay-area-transit?view=advisories", { scroll: false })
    );
    expect(screen.getByRole("heading", { level: 2, name: "Embarcadero" })).toBeInTheDocument();
  });
});
