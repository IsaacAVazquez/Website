import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { TechStartup, TechStartupSegment, TechStartupSnapshot } from "@/types/techStartup";
import { TechStartupClient } from "../tech-startup-client";
import { DEFAULT_TECH_STARTUP_STATE } from "../tech-startup-state";

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

const NOW = Date.parse("2026-10-03T12:00:00Z");

function startup(overrides: Partial<TechStartup> & Pick<TechStartup, "id" | "name">): TechStartup {
  return {
    description: `${overrides.name} builds things.`,
    sector: "sector-ai",
    stage: "stage-late",
    headquarters: "San Francisco, CA",
    country: "US",
    founded: 2019,
    website: `https://${overrides.id}.example.com`,
    totalRaised: 1_000_000_000,
    valuation: 10_000_000_000,
    employees: "501-1,000",
    lastRound: {
      stage: "Series D",
      amount: 500_000_000,
      date: "2026-05",
      leadInvestors: ["Lead Capital"],
    },
    notableInvestors: ["Fund One", "Fund Two"],
    tags: ["Agents"],
    momentumScore: 50,
    ...overrides,
  };
}

const STARTUPS: TechStartup[] = [
  startup({
    id: "orbit",
    name: "Orbit",
    momentumScore: 72.25,
    valuation: 20_000_000_000,
    totalRaised: 2_000_000_000,
    lastRound: {
      stage: "Series E",
      amount: 1_000_000_000,
      date: "2026-02",
      leadInvestors: [],
      sourceUrl: "https://www.example-news.com/orbit-round",
    },
  }),
  startup({
    id: "ledger",
    name: "Ledger",
    sector: "sector-fintech",
    stage: "stage-growth",
    momentumScore: 90,
    valuation: null,
    totalRaised: 300_000_000,
    lastRound: { stage: "Series B", amount: null, date: "2026-08", leadInvestors: ["Alpha", "Beta"] },
  }),
  startup({
    id: "nimbus",
    name: "Nimbus",
    momentumScore: 40,
    valuation: 5_000_000_000,
    totalRaised: 4_000_000_000,
    lastRound: { stage: "Series C", amount: 250_000_000, date: "2025-12", leadInvestors: ["Gamma"] },
  }),
];

function segment(overrides: Partial<TechStartupSegment> & Pick<TechStartupSegment, "key" | "label" | "kind" | "startupIds">): TechStartupSegment {
  return {
    startupCount: overrides.startupIds.length,
    totalRaised: 0,
    totalValuation: 0,
    topStartupId: overrides.startupIds[0] ?? null,
    ...overrides,
  };
}

const SNAPSHOT: TechStartupSnapshot = {
  generatedAt: "2026-10-03T10:00:00Z",
  asOf: "2026-09-15",
  verified: true,
  sourceLabel: "Curated research",
  sourceUrl: "https://example.com",
  disclaimer: "Figures are from public reporting.",
  currency: "USD",
  startups: STARTUPS,
  sectors: [
    segment({ key: "sector-ai", label: "AI", kind: "sector", startupIds: ["orbit", "nimbus"], totalValuation: 25_000_000_000 }),
    segment({ key: "sector-fintech", label: "Fintech", kind: "sector", startupIds: ["ledger"] }),
    segment({ key: "sector-robotics", label: "Robotics", kind: "sector", startupIds: [] }),
  ],
  stages: [
    segment({ key: "stage-late", label: "Late stage", kind: "stage", startupIds: ["orbit", "nimbus"] }),
    segment({ key: "stage-growth", label: "Growth", kind: "stage", startupIds: ["ledger"] }),
  ],
  totals: {
    startups: 3,
    sectors: 3,
    stages: 2,
    totalRaised: 6_300_000_000,
    totalValuation: 25_000_000_000,
    unicornCount: 2,
  },
};

function renderClient(snapshot: TechStartupSnapshot = SNAPSHOT) {
  return render(<TechStartupClient initialState={DEFAULT_TECH_STARTUP_STATE} snapshot={snapshot} />);
}

function tableNames() {
  const table = screen.getByRole("table");
  return within(table)
    .getAllByRole("button")
    .map((button) => button.textContent);
}

function group(name: string) {
  return screen.getByRole("group", { name });
}

describe("TechStartupClient", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(NOW);
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the totals and the snapshot's age once mounted", async () => {
    renderClient();

    expect(screen.getByRole("heading", { level: 1, name: "Tech Startup Tracker" })).toBeInTheDocument();
    expect(screen.getByText("Startups tracked").parentElement).toHaveTextContent("3");
    expect(screen.getByText("3 sectors, 2 stages")).toBeInTheDocument();
    expect(screen.getByText("Unicorns").parentElement).toHaveTextContent("2");
    expect(
      await screen.findByText("Curated research · figures as of Sep 2026 · updated 2h ago")
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /The largest is Orbit/ })).toBeInTheDocument();
    await waitFor(() => expect(mockReplace).not.toHaveBeenCalled());
  });

  it("ranks by momentum by default and pushes a new sort", () => {
    renderClient();

    expect(tableNames()).toEqual(["Ledger", "Orbit", "Nimbus"]);
    expect(within(group("Sort startups")).getByRole("button", { name: "Momentum" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.click(within(group("Sort startups")).getByRole("button", { name: "Total raised" }));
    expect(mockPush).toHaveBeenLastCalledWith("/tech-startup-tracker?sort=raised", { scroll: false });
  });

  it.each([
    ["valuation", ["Orbit", "Nimbus", "Ledger"]],
    ["raised", ["Nimbus", "Orbit", "Ledger"]],
    ["recent", ["Ledger", "Orbit", "Nimbus"]],
  ])("orders the table by %s from the URL", (sort, expected) => {
    currentSearchParams = new URLSearchParams(`sort=${sort}`);
    renderClient();
    expect(tableNames()).toEqual(expected);
  });

  it("filters to a sector from the URL and lists only its companies", () => {
    currentSearchParams = new URLSearchParams("segment=sector-ai");
    renderClient();

    expect(tableNames()).toEqual(["Orbit", "Nimbus"]);
    expect(within(group("Filter by segment")).getByRole("button", { name: "AI" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(within(group("Filter by segment")).getByRole("button", { name: "All sectors" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    fireEvent.click(within(group("Filter by segment")).getByRole("button", { name: "All sectors" }));
    expect(mockPush).toHaveBeenLastCalledWith("/tech-startup-tracker", { scroll: false });
  });

  it("switches grouping and segment, dropping the open startup", () => {
    currentSearchParams = new URLSearchParams("startup=orbit");
    renderClient();

    fireEvent.click(within(group("Group startups by")).getByRole("button", { name: "Stage" }));
    expect(mockPush).toHaveBeenLastCalledWith("/tech-startup-tracker?view=stage", { scroll: false });

    fireEvent.click(within(group("Filter by segment")).getByRole("button", { name: "Fintech" }));
    expect(mockPush).toHaveBeenLastCalledWith("/tech-startup-tracker?segment=sector-fintech", { scroll: false });
  });

  it("lists stage segments with counts and leaders in the stage view", () => {
    currentSearchParams = new URLSearchParams("view=stage");
    renderClient();

    expect(within(group("Filter by segment")).getByRole("button", { name: "All stages" })).toBeInTheDocument();
    const leaders = screen.getByRole("complementary", { name: "Snapshot leaders" });
    expect(within(leaders).getByRole("button", { name: /Late stage.*2 companies · Orbit/ })).toBeInTheDocument();
    expect(within(leaders).getByRole("button", { name: /Growth.*1 company · Ledger/ })).toBeInTheDocument();

    fireEvent.click(within(leaders).getByRole("button", { name: /Growth/ }));
    expect(mockPush).toHaveBeenLastCalledWith("/tech-startup-tracker?view=stage&segment=stage-growth", {
      scroll: false,
    });
  });

  it("explains an empty segment instead of drawing a blank table", () => {
    currentSearchParams = new URLSearchParams("segment=sector-robotics");
    renderClient();

    expect(screen.getByText("No startups match this filter")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("No disclosed valuations in this filter.")).toBeInTheDocument();
    const leaders = screen.getByRole("complementary", { name: "Snapshot leaders" });
    expect(within(leaders).getByRole("button", { name: /Robotics.*0 companies$/ })).toBeInTheDocument();
  });

  it("opens a startup from its name or its row, but not from the Visit link", () => {
    renderClient();

    fireEvent.click(screen.getByRole("button", { name: "Nimbus" }));
    expect(mockPush).toHaveBeenLastCalledWith("/tech-startup-tracker?startup=nimbus", { scroll: false });

    mockPush.mockClear();
    const row = screen.getByRole("button", { name: "Ledger" }).closest("tr") as HTMLElement;
    fireEvent.click(within(row).getByRole("link", { name: /visit/i }));
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.click(row);
    expect(mockPush).toHaveBeenLastCalledWith("/tech-startup-tracker?startup=ledger", { scroll: false });
  });

  it("expands a deep-linked startup with its round details and closes it again", () => {
    currentSearchParams = new URLSearchParams("startup=orbit");
    renderClient();

    const toggle = screen.getByRole("button", { name: "Orbit" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const detail = document.getElementById(toggle.getAttribute("aria-controls") as string) as HTMLElement;
    expect(within(detail).getByText("Headquarters").nextElementSibling).toHaveTextContent("San Francisco, CA");
    expect(within(detail).getByText("Founded").nextElementSibling).toHaveTextContent("2019");
    expect(within(detail).getByText("Momentum").nextElementSibling).toHaveTextContent("72.3");
    expect(within(detail).getByText("Announced").nextElementSibling).toHaveTextContent("Feb 2026");
    expect(within(detail).getByText("Round led by").nextElementSibling).toHaveTextContent("Undisclosed");
    expect(within(detail).getByRole("link", { name: "example-news.com" })).toHaveAttribute(
      "href",
      "https://www.example-news.com/orbit-round"
    );
    expect(within(detail).getByText("Fund Two")).toBeInTheDocument();
    expect(within(detail).getByText("Agents")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ledger" })).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(mockPush).toHaveBeenLastCalledWith("/tech-startup-tracker", { scroll: false });
  });

  it("prints undisclosed figures and named leads for a startup without a valuation", () => {
    currentSearchParams = new URLSearchParams("startup=ledger");
    renderClient();

    const row = screen.getByRole("button", { name: "Ledger" }).closest("tr") as HTMLElement;
    expect(within(row).getAllByText("Undisclosed")).toHaveLength(1);
    expect(within(row).getByText("Undisclosed · Aug 2026")).toBeInTheDocument();
    const detail = row.nextElementSibling as HTMLElement;
    expect(within(detail).getByText("Round led by").nextElementSibling).toHaveTextContent("Alpha, Beta");
    expect(within(detail).getByText("Round size").nextElementSibling).toHaveTextContent("Undisclosed");
    expect(within(detail).queryByText("Round source")).toBeNull();
  });

  it("carries the columns a phone hides into the open row", () => {
    currentSearchParams = new URLSearchParams("startup=orbit");
    renderClient();

    const toggle = screen.getByRole("button", { name: "Orbit" });
    const detail = document.getElementById(toggle.getAttribute("aria-controls") as string) as HTMLElement;
    expect(within(detail).getByText("Total raised").nextElementSibling).toHaveTextContent("$2B");
    expect(within(detail).getByText("Late stage")).toBeInTheDocument();
    expect(within(detail).getByRole("link", { name: "Visit" })).toHaveAttribute(
      "href",
      "https://orbit.example.com"
    );
  });

  it("prints the filters ahead of the treemap they redraw", () => {
    renderClient();

    const filters = screen.getByRole("region", { name: "Startup filters" });
    const treemap = screen.getByRole("img", { name: /The largest is Orbit/ });
    expect(filters.compareDocumentPosition(treemap) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("drops a startup that is outside the visible segment from the URL", async () => {
    currentSearchParams = new URLSearchParams("segment=sector-fintech&startup=orbit&sort=bogus");
    renderClient();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/tech-startup-tracker?segment=sector-fintech", { scroll: false })
    );
    expect(tableNames()).toEqual(["Ledger"]);
  });

  describe("source freshness", () => {
    it("stays quiet for verified figures inside the review window", () => {
      renderClient();
      expect(screen.queryByRole("status")).toBeNull();
      expect(screen.getByText("Figures are from public reporting.")).toBeInTheDocument();
    });

    it("warns about unverified figures and says so in the disclaimer", () => {
      renderClient({ ...SNAPSHOT, verified: false });
      expect(screen.getByRole("status")).toHaveTextContent(/past the review window or still\s+unverified/);
      expect(screen.getByText(/have not been individually verified/)).toBeInTheDocument();
    });

    it("links the short notice beside the list to the full notice under it", () => {
      renderClient({ ...SNAPSHOT, verified: false });

      const link = screen.getByRole("link", { name: "Read the full notice" });
      const notice = document.getElementById(
        (link.getAttribute("href") as string).slice(1)
      ) as HTMLElement;
      expect(within(notice).getByText(/Figures are from public reporting\./)).toBeInTheDocument();
      expect(within(notice).getByText(/directional research, not current\s+financial facts/)).toBeInTheDocument();
      // The short line is the only live region, so the full text is not announced twice.
      expect(within(notice).queryByRole("status")).toBeNull();
    });

    it.each([
      ["older than six months", "2026-03-01"],
      ["unreadable", "not-a-date"],
    ])("warns when the as-of date is %s", (_label, asOf) => {
      renderClient({ ...SNAPSHOT, asOf });
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("prints an unreadable as-of date as given", () => {
      renderClient({ ...SNAPSHOT, asOf: "not-a-date" });
      expect(screen.getByText(/figures as of not-a-date/)).toBeInTheDocument();
    });
  });
});
