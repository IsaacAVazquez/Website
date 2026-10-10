import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { toLocalDateKey } from "@/lib/date-formatters";
import type { Museum, MuseumSnapshot, UserMuseumState } from "@/types/museum";
import { MuseumLogClient } from "../museum-log-client";
import { DEFAULT_MUSEUM_STATE } from "../museum-log-state";

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

const STORAGE_KEY = "museum_log_user_state_v1";

function museum(overrides: Partial<Museum> & Pick<Museum, "id" | "slug" | "name">): Museum {
  return {
    city: "New York",
    country: "USA",
    region: "northeast",
    type: "art",
    founded: 1900,
    blurb: `${overrides.name} blurb.`,
    highlights: [`${overrides.name} highlight`],
    curatorRating: 4,
    curatorBlurb: "",
    popularity: 50,
    visitMinutesAvg: 90,
    admissionUSD: 25,
    exhibits: [],
    ...overrides,
  };
}

const ATLAS = museum({
  id: "atlas",
  slug: "atlas-art",
  name: "Atlas Art Museum",
  curatorRating: 4.5,
  popularity: 40,
  websiteUrl: "https://atlas.example.org",
  exhibits: [
    { id: "ex-now", title: "Always On", startDate: "2000-01-01", endDate: null, blurb: "The permanent hang.", ticketed: true },
    { id: "ex-soon", title: "Far Future", startDate: "2999-01-01", endDate: "2999-06-01", blurb: "Not yet.", ticketed: false },
    { id: "ex-past", title: "Long Gone", startDate: "2001-01-01", endDate: "2001-06-01", blurb: "Closed.", ticketed: false },
  ],
});

const BEACON = museum({
  id: "beacon",
  slug: "beacon-science",
  name: "Beacon Science Center",
  city: "Boston",
  type: "science",
  curatorRating: 4.5,
  popularity: 90,
  visitMinutesAvg: 45,
});

const CORVID = museum({
  id: "corvid",
  slug: "corvid-history",
  name: "Corvid History House",
  city: "Lisbon",
  country: "Portugal",
  region: "europe",
  type: "history",
  curatorRating: 3,
  popularity: 70,
  founded: 0,
  admissionUSD: null,
});

const SNAPSHOT: MuseumSnapshot = {
  generatedAt: "2026-09-01T16:00:00Z",
  sourceLabel: "Curated",
  curatorName: "Isaac",
  curatorBio: "Museums I would send a friend to.",
  museums: [ATLAS, BEACON, CORVID],
  reviews: [
    {
      id: "rev-1",
      museumId: "atlas",
      rating: 4.5,
      headline: "A gallery worth the trip",
      body: "Go early.",
      dateVisited: "2025-05-10",
      exhibitTitle: "Always On",
      tags: ["paintings"],
      liked: true,
      recommendedFor: "First-timers",
    },
    { id: "rev-2", museumId: "corvid", rating: 3, headline: "Small and odd", body: "Quick stop.", dateVisited: "2025-08-01", tags: [] },
    { id: "rev-ghost", museumId: "ghost", rating: 5, headline: "Ghost review", body: "", dateVisited: "2025-09-01", tags: [], liked: true },
  ],
  visitLog: [
    { id: "log-1", museumId: "atlas", date: "2025-05-10", rating: 4.5, exhibitTitle: "Always On", note: "Crowded but great" },
    { id: "log-2", museumId: "beacon", date: "2025-07-04", rating: 4 },
    { id: "log-ghost", museumId: "ghost", date: "2025-09-09", rating: 2 },
  ],
  lists: [
    {
      id: "list-1",
      slug: "east-coast",
      title: "East Coast weekend",
      description: "Two days, two museums.",
      curator: "Isaac",
      museumIds: ["atlas", "beacon", "ghost"],
      updatedAt: "2025-10-01",
    },
  ],
};

function seed(state: Partial<UserMuseumState> | string) {
  window.localStorage.setItem(
    STORAGE_KEY,
    typeof state === "string" ? state : JSON.stringify({ visited: [], watchlist: [], liked: [], ...state })
  );
}

function stored(): UserMuseumState {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as UserMuseumState;
}

/** The router is a mock, so each push is fed back in as the next URL before a rerender. */
function renderFollowingPushes(snapshot: MuseumSnapshot = SNAPSHOT) {
  mockPush.mockImplementation((href: string) => {
    currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
  });
  const ui = () => <MuseumLogClient initialState={DEFAULT_MUSEUM_STATE} snapshot={snapshot} />;
  const view = render(ui());
  return { ...view, settle: () => view.rerender(ui()) };
}

function renderClient(snapshot: MuseumSnapshot = SNAPSHOT) {
  return render(<MuseumLogClient initialState={DEFAULT_MUSEUM_STATE} snapshot={snapshot} />);
}

function readout(label: string) {
  return screen.getByText(label, { selector: "dt" }).parentElement as HTMLElement;
}

const sidePanel = () => screen.getByRole("complementary", { name: "Museum Log side panel" });

function cardNames() {
  return screen
    .getAllByRole("button", { name: /^Open .* detail$/ })
    .map((button) => button.getAttribute("aria-label")?.replace(/^Open | detail$/g, ""));
}

describe("MuseumLogClient interactions", () => {
  const scrollIntoView = jest.fn();

  beforeAll(() => {
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
    scrollIntoView.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("opens on a first visit with catalog totals and the curator's lists as fallbacks", () => {
    renderClient();

    expect(readout("Museums you've visited")).toHaveTextContent("0of 3 catalogued");
    expect(readout("Cities")).toHaveTextContent("3");
    expect(readout("Exhibits on now")).toHaveTextContent("1museum has one running");
    // The figures print after the stub plate they describe.
    expect(
      screen.getByText("Log your first visit").compareDocumentPosition(readout("Cities")) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.getByText("Log your first visit")).toBeInTheDocument();
    expect(screen.getByText("3 museums catalogued, 3 curator reviews, and 3 visits in the curator’s diary.", { exact: false })).toBeInTheDocument();

    const panel = sidePanel();
    expect(within(panel).getByText(/these come from the curator.s diary/)).toBeInTheDocument();
    expect(within(panel).getByText(/these are the curator.s favorites/)).toBeInTheDocument();
    // The diary entry for a museum outside the catalog is skipped.
    expect(within(panel).getByRole("button", { name: /Beacon Science Center/ })).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("sorts and filters the catalog, and narrows it with search", () => {
    renderClient();

    expect(screen.getByText("3 museums in the catalog")).toBeInTheDocument();
    // Ties on rating fall back to popularity.
    expect(cardNames()).toEqual(["Beacon Science Center", "Atlas Art Museum", "Corvid History House"]);

    fireEvent.click(screen.getByRole("button", { name: "Popularity" }));
    expect(mockPush).toHaveBeenLastCalledWith("/museum-log?sort=popular", { scroll: false });
    fireEvent.change(screen.getByRole("combobox", { name: "Type" }), { target: { value: "science" } });
    expect(mockPush).toHaveBeenLastCalledWith("/museum-log?type=science", { scroll: false });
    fireEvent.change(screen.getByRole("combobox", { name: "Region" }), { target: { value: "europe" } });
    expect(mockPush).toHaveBeenLastCalledWith("/museum-log?region=europe", { scroll: false });

    fireEvent.change(screen.getByRole("searchbox", { name: "Filter museums" }), { target: { value: "lisbon" } });
    expect(cardNames()).toEqual(["Corvid History House"]);
    expect(screen.getByText('1 museum in the catalog · matching "lisbon"')).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Filter museums" }), { target: { value: "zzz" } });
    expect(screen.getByText(/No museums match the current filters/)).toBeInTheDocument();
  });

  it.each([
    ["popular", ["Beacon Science Center", "Corvid History House", "Atlas Art Museum"]],
    ["alpha", ["Atlas Art Museum", "Beacon Science Center", "Corvid History House"]],
    ["recent", ["Beacon Science Center", "Atlas Art Museum", "Corvid History House"]],
  ])("orders the catalog by %s from the URL", (sort, expected) => {
    currentSearchParams = new URLSearchParams(`sort=${sort}`);
    renderClient();
    expect(cardNames()).toEqual(expected);
  });

  it("applies type and region filters from the URL", () => {
    currentSearchParams = new URLSearchParams("type=art&region=northeast");
    renderClient();
    expect(screen.getByText("1 museum in the catalog · Art · Northeast US")).toBeInTheDocument();
    expect(cardNames()).toEqual(["Atlas Art Museum"]);
  });

  it("logs and clears a quick visit, and logging drops the museum from the watchlist", () => {
    renderClient();
    const actions = () => screen.getByRole("group", { name: "Actions for Atlas Art Museum" });

    fireEvent.click(within(actions()).getByRole("button", { name: "Save Atlas Art Museum to watchlist" }));
    expect(within(actions()).getByRole("button", { name: "Remove Atlas Art Museum from watchlist" })).toHaveAttribute("aria-pressed", "true");
    expect(stored().watchlist).toEqual(["atlas"]);

    fireEvent.click(within(actions()).getByRole("button", { name: "Log a visit to Atlas Art Museum" }));
    // A quick visit never borrows the curator's 4.5.
    expect(stored().visited).toEqual([{ museumId: "atlas", date: toLocalDateKey() }]);
    expect(stored().watchlist).toEqual([]);
    expect(within(actions()).getByRole("button", { name: "Mark Atlas Art Museum as not visited" })).toHaveTextContent("Visited");
    expect(screen.getByText(/^Your visit .* · not rated$/)).toBeInTheDocument();
    expect(readout("Museums you've visited")).toHaveTextContent("1of 3 catalogued");
    expect(screen.queryByText("Log your first visit")).toBeNull();
    expect(within(sidePanel()).queryByText(/curator.s diary/)).toBeNull();

    fireEvent.click(within(actions()).getByRole("button", { name: "Mark Atlas Art Museum as not visited" }));
    expect(stored().visited).toEqual([]);
    expect(readout("Museums you've visited")).toHaveTextContent("0of 3 catalogued");
  });

  it("puts liked museums in the side panel instead of the curator's picks", () => {
    renderClient();
    const actions = screen.getByRole("group", { name: "Actions for Corvid History House" });

    fireEvent.click(within(actions).getByRole("button", { name: "Like" }));
    expect(within(actions).getByRole("button", { name: "Liked" })).toHaveAttribute("aria-pressed", "true");
    expect(stored().liked).toEqual(["corvid"]);
    expect(within(sidePanel()).queryByText(/curator.s favorites/)).toBeNull();
    expect(within(sidePanel()).getByRole("button", { name: /Corvid History House History · Lisbon/ })).toBeInTheDocument();

    fireEvent.click(within(actions).getByRole("button", { name: "Liked" }));
    expect(stored().liked).toEqual([]);
  });

  it("restores saved visits and keeps only the valid ones from a damaged store", () => {
    seed({
      visited: [
        { museumId: "beacon", date: "2026-02-01", rating: 4 },
        { museumId: "atlas", date: "2026-03-01", rating: 9 },
        { museumId: "corvid", date: "not-a-date", rating: 3 },
      ],
      watchlist: ["corvid", "corvid", 7],
      liked: "nope",
    } as unknown as UserMuseumState);
    renderClient();

    expect(readout("Museums you've visited")).toHaveTextContent("1of 3 catalogued");
    expect(screen.getByRole("button", { name: "Mark Beacon Science Center as not visited" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log a visit to Atlas Art Museum" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Corvid History House from watchlist" })).toBeInTheDocument();
  });

  it("falls back to an empty log when the store is unreadable", () => {
    seed("{broken");
    renderClient();
    expect(readout("Museums you've visited")).toHaveTextContent("0of 3 catalogued");
    expect(screen.getByText("Log your first visit")).toBeInTheDocument();
  });

  it("picks up a visit logged in another tab", () => {
    renderClient();
    const payload = JSON.stringify({ visited: [{ museumId: "corvid", date: "2026-01-05", rating: 3 }], watchlist: [], liked: [] });
    window.localStorage.setItem(STORAGE_KEY, payload);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: payload }));
    });
    expect(readout("Museums you've visited")).toHaveTextContent("1of 3 catalogued");
    expect(screen.getByRole("button", { name: "Mark Corvid History House as not visited" })).toBeInTheDocument();
  });

  it("warns when browser storage refuses writes but keeps the change in this tab", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    renderClient();

    fireEvent.click(screen.getByRole("button", { name: "Log a visit to Beacon Science Center" }));
    expect(screen.getByRole("status")).toHaveTextContent(/browser storage is unavailable/);
    expect(readout("Museums you've visited")).toHaveTextContent("1of 3 catalogued");
  });

  it("lists curator reviews and the stamped diary, newest first, skipping unknown museums", () => {
    currentSearchParams = new URLSearchParams("view=journal");
    renderClient();

    expect(screen.getByRole("heading", { name: "Isaac’s reviews" })).toBeInTheDocument();
    expect(screen.queryByText("Ghost review")).toBeNull();
    const headlines = screen.getAllByText(/^(A gallery worth the trip|Small and odd)$/).map((node) => node.textContent);
    expect(headlines).toEqual(["Small and odd", "A gallery worth the trip"]);
    expect(screen.getByText("Recommended for: First-timers")).toBeInTheDocument();
    expect(screen.getByText("paintings")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Liked").length).toBeGreaterThan(0);
    expect(screen.getByText("“Crowded but great”")).toBeInTheDocument();
    expect(screen.getByText("Visited July 4, 2025")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Corvid History House" })[0]);
    expect(mockPush).toHaveBeenLastCalledWith("/museum-log?museum=corvid-history", { scroll: false });
  });

  it("opens a catalogue from its preview and lists its museums in order", () => {
    const { settle } = renderFollowingPushes();
    fireEvent.click(screen.getByRole("button", { name: "Lists" }));
    settle();

    const preview = screen.getByRole("button", { name: /East Coast weekend/ });
    expect(preview).toHaveTextContent("Exhibition catalogue · 2 museums");
    fireEvent.click(preview);
    expect(mockPush).toHaveBeenLastCalledWith("/museum-log?list=east-coast", { scroll: false });
    settle();

    expect(screen.getByRole("heading", { name: "East Coast weekend" })).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText(/^New York · Est\. 1900 · \$25 · On view now$/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Log a visit to Beacon Science Center" }));
    expect(stored().visited.map((visit) => visit.museumId)).toEqual(["beacon"]);

    fireEvent.click(screen.getByRole("button", { name: "Atlas Art Museum" }));
    // The list param also rides along here (see the report); only the museum is asserted.
    expect(new URLSearchParams(mockPush.mock.calls.at(-1)?.[0].split("?")[1]).get("museum")).toBe("atlas-art");

    currentSearchParams = new URLSearchParams("list=east-coast");
    settle();
    fireEvent.click(screen.getByRole("button", { name: "← All catalogues" }));
    expect(mockPush).toHaveBeenLastCalledWith("/museum-log?view=lists", { scroll: false });
  });

  it("shows a museum's detail with its exhibits, history, and lists", () => {
    currentSearchParams = new URLSearchParams("museum=atlas-art");
    renderClient();

    const detail = screen.getByRole("region", { name: "Atlas Art Museum detail" });
    expect(within(detail).getByRole("heading", { level: 2, name: "Atlas Art Museum" })).toBeInTheDocument();
    expect(within(detail).getByText("Art · Northeast US")).toBeInTheDocument();
    expect(within(detail).getByText("USA · 1h 30m average visit")).toBeInTheDocument();
    expect(within(detail).getByText("Curator review")).toBeInTheDocument();
    expect(within(detail).getByText("Atlas Art Museum highlight")).toBeInTheDocument();
    expect(within(detail).getByText("current")).toHaveClass("c97-chip-positive");
    expect(within(detail).getByText("upcoming")).toHaveClass("c97-chip-warning");
    expect(within(detail).getByText("ended")).toBeInTheDocument();
    expect(within(detail).getByText(/– Permanent$/)).toBeInTheDocument();
    expect(within(detail).getByText("Timed entry")).toBeInTheDocument();
    expect(within(detail).getByRole("link", { name: "Visit official site" })).toHaveAttribute("href", "https://atlas.example.org");
    expect(within(detail).getByText("Past visits")).toBeInTheDocument();

    expect(within(sidePanel()).getByText("Other museums in Northeast US")).toBeInTheDocument();
    fireEvent.click(within(sidePanel()).getByRole("button", { name: /Beacon Science Center/ }));
    expect(mockPush).toHaveBeenLastCalledWith("/museum-log?museum=beacon-science", { scroll: false });

    fireEvent.click(within(detail).getByRole("button", { name: "East Coast weekend · 3 museums" }));
    expect(mockPush).toHaveBeenLastCalledWith("/museum-log?list=east-coast", { scroll: false });
  });

  it("says in words when no exhibit in the catalog is running", () => {
    const quiet = { ...SNAPSHOT, museums: SNAPSHOT.museums.map((m) => ({ ...m, exhibits: [] })) };
    renderClient(quiet);
    expect(readout("Exhibits on now")).toHaveTextContent("0none listed as running");
  });

  it("says so when a museum has no neighbours in its region", () => {
    currentSearchParams = new URLSearchParams("museum=corvid-history");
    renderClient();
    expect(within(sidePanel()).getByText("No other museums catalogued in this region yet.")).toBeInTheDocument();
    const detail = screen.getByRole("region", { name: "Corvid History House detail" });
    expect(within(detail).queryByText("Exhibition calendar")).toBeNull();
    expect(within(detail).getByText("Free")).toBeInTheDocument();
  });

  it("rates and logs a visit from the detail form, then removes it", () => {
    currentSearchParams = new URLSearchParams("museum=beacon-science");
    renderClient();
    const detail = screen.getByRole("region", { name: "Beacon Science Center detail" });
    const form = within(detail).getByRole("form", { name: "Rate and log this museum visit" });

    // The slider starts with no rating, never the curator's 4.5, and nothing saves until it moves.
    expect(within(form).getByRole("slider", { name: "Your rating, 0 to 5 stars" })).toHaveValue("0");
    expect(within(form).getByText("Not rated")).toBeInTheDocument();
    expect(within(form).queryByRole("img", { name: /^Rating/ })).toBeNull();
    expect(within(form).getByRole("button", { name: "Log visit" })).toBeDisabled();
    fireEvent.submit(form);
    expect(stored().visited ?? []).toEqual([]);

    fireEvent.change(within(form).getByRole("slider", { name: "Your rating, 0 to 5 stars" }), { target: { value: "7" } });
    expect(within(form).getByRole("button", { name: "Log visit" })).toBeEnabled();
    expect(within(form).getByRole("img", { name: "Rating 3.5 out of 5" })).toBeInTheDocument();
    fireEvent.change(within(form).getByRole("textbox", { name: "Visit note" }), { target: { value: "  Kids loved it  " } });
    fireEvent.click(within(form).getByRole("button", { name: "Log visit" }));

    expect(stored().visited).toEqual([{ museumId: "beacon", date: toLocalDateKey(), rating: 3.5, note: "Kids loved it" }]);
    expect(within(detail).getByText(/^Visited on /)).toBeInTheDocument();
    expect(within(detail).getByText("“Kids loved it”")).toBeInTheDocument();
    expect(within(detail).getByText("· you")).toBeInTheDocument();
    expect(within(detail).getByText("Your activity")).toHaveFocus();

    fireEvent.click(within(detail).getByRole("button", { name: "Remove visit" }));
    expect(stored().visited).toEqual([]);
    expect(within(detail).getByRole("form", { name: "Rate and log this museum visit" })).toBeInTheDocument();
    expect(within(detail).getByText("Your activity")).toHaveFocus();
  });

  it.each(["journal", "lists"])("only shows museum search in Discover, not %s", (view) => {
    currentSearchParams = new URLSearchParams(`view=${view}`);
    renderClient();
    expect(screen.queryByRole("searchbox", { name: "Filter museums" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: view === "journal" ? "Journal" : "Lists", pressed: true })).toBeVisible();
  });

  it("logs a quick visit from the detail actions without a rating, then takes the reader's own", () => {
    currentSearchParams = new URLSearchParams("museum=corvid-history");
    renderClient();
    const detail = screen.getByRole("region", { name: "Corvid History House detail" });
    fireEvent.click(within(detail).getByRole("button", { name: "Log a visit to Corvid History House" }));
    expect(stored().visited).toEqual([{ museumId: "corvid", date: toLocalDateKey() }]);
    expect(within(detail).queryByText("· you")).toBeNull();
    expect(within(detail).getByText(/You have not rated this visit/)).toBeInTheDocument();

    const form = within(detail).getByRole("form", { name: "Rate this museum visit" });
    fireEvent.change(within(form).getByRole("slider", { name: "Your rating, 0 to 5 stars" }), { target: { value: "8" } });
    fireEvent.click(within(form).getByRole("button", { name: "Save rating" }));
    expect(stored().visited).toEqual([{ museumId: "corvid", date: toLocalDateKey(), rating: 4 }]);
    expect(within(detail).getByText("· you")).toBeInTheDocument();
    expect(within(detail).queryByRole("form")).toBeNull();

    fireEvent.click(within(detail).getByRole("button", { name: "Save Corvid History House to watchlist" }));
    fireEvent.click(within(detail).getByRole("button", { name: "Like" }));
    expect(stored()).toEqual(expect.objectContaining({ watchlist: ["corvid"], liked: ["corvid"] }));
  });

  it("restores a saved unrated visit on a return visit", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ visited: [{ museumId: "atlas", date: "2026-03-01" }], watchlist: [], liked: [] }),
    );
    renderClient();
    expect(readout("Museums you've visited")).toHaveTextContent("1of 3 catalogued");
    expect(screen.getByText(/^Your visit .* · not rated$/)).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it("goes back to Discover from a museum opened out of a catalogue, not to Lists", () => {
    currentSearchParams = new URLSearchParams("list=east-coast&museum=atlas-art");
    renderClient();
    fireEvent.click(screen.getByRole("button", { name: "← Back to catalog" }));
    expect(mockPush).toHaveBeenLastCalledWith("/museum-log", { scroll: false });
  });

  it("offers a jump from the hero to the catalog heading", () => {
    renderClient();
    expect(screen.getByRole("link", { name: "Browse the catalog" })).toHaveAttribute("href", "#museum-log-catalog");
    expect(screen.getByRole("heading", { level: 2, name: "Discover" })).toHaveAttribute("id", "museum-log-catalog");
  });

  it("offers a way back when the museum in the URL does not exist", () => {
    currentSearchParams = new URLSearchParams("museum=nowhere");
    renderClient();
    const region = screen.getByRole("region", { name: "Museum not found" });
    fireEvent.click(within(region).getByRole("button", { name: "Back to catalog" }));
    expect(mockPush).toHaveBeenLastCalledWith("/museum-log", { scroll: false });
  });

  it("moves focus to the detail heading on open and back to the catalog heading on return", () => {
    const { settle } = renderFollowingPushes();

    fireEvent.click(screen.getByRole("button", { name: "Open Atlas Art Museum detail" }));
    settle();
    expect(screen.getByRole("heading", { level: 2, name: "Atlas Art Museum" })).toHaveFocus();
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: "smooth", block: "start" });

    fireEvent.click(screen.getByRole("button", { name: "← Back to catalog" }));
    expect(mockPush).toHaveBeenLastCalledWith("/museum-log", { scroll: false });
    settle();
    expect(screen.getByRole("heading", { level: 2, name: "Discover" })).toHaveFocus();
  });

  it("does not steal focus on a cold load of a museum link", () => {
    currentSearchParams = new URLSearchParams("museum=atlas-art");
    renderClient();
    expect(screen.getByRole("heading", { level: 2, name: "Atlas Art Museum" })).not.toHaveFocus();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
