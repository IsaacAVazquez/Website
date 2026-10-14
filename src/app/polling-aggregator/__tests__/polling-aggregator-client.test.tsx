import { fireEvent, render, screen, within } from "@testing-library/react";
import { pollingSnapshot } from "@/data/pollingSnapshot";
import type { Race } from "@/types/polling";
import { PollingAggregatorClient } from "../polling-aggregator-client";
import { DEFAULT_POLLING_STATE } from "../polling-aggregator-state";

function makeRace(state: string, stateAbbr: string, margin: number, pollCount: number): Race {
  const id = `senate-${stateAbbr.toLowerCase()}`;
  return {
    id,
    state,
    stateAbbr,
    office: "Senate",
    year: 2026,
    candidates: [
      { name: `${state} Leader`, support: 48 + margin },
      { name: `${state} Runner-up`, support: 48 },
    ],
    margin,
    pollCount,
    lastPolled: "2026-10-01",
    polls: Array.from({ length: pollCount }, (_, index) => ({
      id: `${id}-${index}`,
      pollster: `Pollster ${index + 1}`,
      sponsor: index === 0 ? "A Sponsor" : undefined,
      startDate: "2026-09-28",
      endDate: index === 0 ? "2026-10-01" : "2026-09-20",
      sampleSize: 600,
      sampleType: "LV",
      moe: null,
      methodology: "unknown",
      candidates: [
        { name: `${state} Leader`, support: 48 + margin },
        { name: `${state} Runner-up`, support: 48 },
        { name: "Someone Else", support: 2 },
      ],
    })),
  };
}

const ohio = makeRace("Ohio", "OH", 7.3, 3);
const maine = makeRace("Maine", "ME", 0.5, 4);
const noRaces = { ...pollingSnapshot, senateRaces: [], governorRaces: [] };
const senateOnly = { ...noRaces, senateRaces: [ohio, maine] };

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

// The seed is regenerated daily, so the dates under test are pinned here.
const datedSnapshot = {
  ...pollingSnapshot,
  approvalPolls: [
    { ...pollingSnapshot.approvalPolls[0], endDate: "2026-08-17" },
    { ...pollingSnapshot.approvalPolls[1], endDate: "2026-08-28" },
  ],
  genericBallotPolls: [
    { ...pollingSnapshot.genericBallotPolls[0], endDate: "2026-09-08" },
  ],
};

describe("PollingAggregatorClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("states the newest poll date for each series in place of an updated stamp", () => {
    render(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={datedSnapshot}
      />
    );

    const meta = screen.getByText(/polls tracked/i);
    expect(meta).toHaveTextContent("VoteHub Polling API, CC BY 4.0");
    expect(meta).toHaveTextContent("newest approval poll Aug 28, 2026");
    expect(meta).toHaveTextContent("newest generic ballot poll Sep 8, 2026");
    expect(meta).not.toHaveTextContent(/updated/i);
  });

  it("does not promise race ratings the page does not have", () => {
    render(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={datedSnapshot}
      />
    );

    expect(screen.queryByText(/race ratings below/i)).not.toBeInTheDocument();
  });

  it("prints the stale source sentence inside the source note", () => {
    const sentence =
      "The newest approval poll I have from VoteHub ended Aug 28, 2026, so the approval average describes polling up to that date.";
    const { rerender } = render(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={datedSnapshot}
        staleSourceNote={sentence}
      />
    );

    expect(screen.getByRole("note")).toHaveTextContent(sentence);

    rerender(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={datedSnapshot}
      />
    );

    expect(screen.getByRole("note")).not.toHaveTextContent(/The newest approval poll I have/);
  });

  it("prints the national averages on the chart's summary, with the poll dates in its source line", () => {
    render(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={datedSnapshot}
      />
    );

    // The averages are the tracker's own summary beside the chart, printed once.
    const figure = (label: string) =>
      screen.getByText(label, { selector: "dt" }).parentElement as HTMLElement;
    expect(figure("Approval net")).toHaveTextContent(
      `${datedSnapshot.approvalAvg.approve.toFixed(1)}% approve`
    );
    expect(figure("Generic ballot margin")).toHaveTextContent(
      `D ${datedSnapshot.genericBallotAvg.dem.toFixed(1)}% vs R`
    );
    // Days to the election moved into the source line, so no third figure is printed.
    expect(screen.queryByText("Days to election", { selector: "dt" })).toBeNull();
    expect(screen.getByRole("note")).toHaveTextContent(/midterms/);
  });

  it("attributes the polling source and explains the race-data limit", () => {
    render(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={pollingSnapshot}
      />
    );

    expect(screen.getByRole("link", { name: /votehub polling api/i })).toHaveAttribute(
      "href",
      "https://votehub.com/polls/api/"
    );
    // The race-data limit qualifies the race rows, so it prints under the race table.
    expect(
      screen.getByText(/without a party or an incumbency flag, so I print the names as the pollsters gave them/)
    ).toBeVisible();
  });

  it("opens on the Senate races and navigates view tabs", () => {
    render(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={pollingSnapshot}
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /polling aggregator/i })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Senate" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "Overview" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Approval" }));
    expect(mockPush).toHaveBeenLastCalledWith("/polling-aggregator?view=approval", {
      scroll: false,
    });
  });

  it("offers a race tab only when the snapshot has races for it", () => {
    const { rerender } = render(
      <PollingAggregatorClient initialState={DEFAULT_POLLING_STATE} snapshot={noRaces} />
    );

    expect(screen.queryByRole("button", { name: "Senate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Governors" })).not.toBeInTheDocument();
    // With no race polls the board opens on the approval and ballot poll tables.
    expect(screen.getByRole("button", { name: "Approval" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("table", { name: "Presidential approval polls" })).toBeVisible();

    rerender(
      <PollingAggregatorClient initialState={DEFAULT_POLLING_STATE} snapshot={senateOnly} />
    );

    expect(screen.getByRole("button", { name: "Senate" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Governors" })).not.toBeInTheDocument();
    expect(screen.getByText(/2 polled, closest first\. 1 of 2 within 3 points\./)).toBeVisible();
    // The source line counts the race polls with the national ones.
    expect(screen.getByText(/polls tracked/i)).toHaveTextContent(
      `${noRaces.approvalPolls.length + noRaces.genericBallotPolls.length + 7} polls tracked`
    );
  });

  it("renders the Senate view closest race first, with the selected race's polls beside it", () => {
    currentSearchParams = new URLSearchParams("view=senate");
    const { rerender } = render(
      <PollingAggregatorClient initialState={DEFAULT_POLLING_STATE} snapshot={senateOnly} />
    );

    const table = screen.getByRole("table", { name: "Senate race averages" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Maine");
    expect(rows[0]).toHaveTextContent("Maine Leader");
    expect(rows[0]).toHaveTextContent("+0.5");
    expect(rows[1]).toHaveTextContent("Ohio");
    expect(within(rows[0]).getByRole("button", { name: "Show the Maine Senate race" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("heading", { level: 3, name: "Maine" })).toBeVisible();
    expect(
      screen.getByText(
        "Average of the 4 polls from Sep 20, 2026 to Oct 1, 2026 that asked about both names."
      )
    ).toBeVisible();
    expect(screen.getByText("for A Sponsor")).toBeVisible();
    expect(screen.getAllByText("Someone Else 2%")).toHaveLength(4);

    fireEvent.click(within(rows[1]).getByRole("button", { name: "Show the Ohio Senate race" }));
    // Senate is the default view, so the URL carries only the race.
    expect(mockPush).toHaveBeenLastCalledWith("/polling-aggregator?race=senate-oh", {
      scroll: false,
    });

    currentSearchParams = new URLSearchParams("view=senate&race=senate-oh");
    rerender(
      <PollingAggregatorClient initialState={DEFAULT_POLLING_STATE} snapshot={senateOnly} />
    );
    expect(screen.getByRole("heading", { level: 3, name: "Ohio" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Ohio Senate race selected. Ohio Leader 55.3 percent, Ohio Runner-up 48.0 percent, margin +7.3 over 3 polls."
    );
  });

  it("falls back to the first view with polls when the requested one has none", () => {
    // A governors link with no governor polls, and a legacy Overview link, land on Senate.
    for (const query of ["view=governors", "view=overview"]) {
      currentSearchParams = new URLSearchParams(query);
      const { unmount } = render(
        <PollingAggregatorClient initialState={DEFAULT_POLLING_STATE} snapshot={senateOnly} />
      );
      expect(screen.getByRole("button", { name: "Senate" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("table", { name: "Senate race averages" })).toBeVisible();
      unmount();
    }

    // With no Senate polls, the default view opens on Governors from the first render.
    currentSearchParams = new URLSearchParams();
    render(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={{ ...noRaces, governorRaces: [{ ...ohio, id: "governor-oh", office: "Governor" }] }}
      />
    );
    expect(screen.getByRole("button", { name: "Governors" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("table", { name: "Governor race averages" })).toBeVisible();
    expect(screen.getByText(/VoteHub has published no senate poll from the last four months/)).toBeVisible();
  });

  it("says so when the view it was asked for has no polls", () => {
    currentSearchParams = new URLSearchParams("view=governors");
    const { unmount } = render(
      <PollingAggregatorClient initialState={DEFAULT_POLLING_STATE} snapshot={senateOnly} />
    );
    expect(
      screen.getByText(/VoteHub has published no governor poll from the last four months/)
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Senate" })).toHaveAttribute("aria-pressed", "true");
    unmount();

    // A legacy Overview link asked for no race view, so it has nothing to explain.
    currentSearchParams = new URLSearchParams("view=overview");
    render(<PollingAggregatorClient initialState={DEFAULT_POLLING_STATE} snapshot={senateOnly} />);
    expect(screen.queryByText(/VoteHub has published no/)).not.toBeInTheDocument();
  });

  it("names the year at both ends of the trend and prints each tick as a month", () => {
    render(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={{
          ...datedSnapshot,
          approvalTrend: [
            { date: "2025-10-15", approve: 44, disapprove: 52 },
            { date: "2026-10-15", approve: 40, disapprove: 56 },
          ],
        }}
      />
    );

    expect(screen.getByText("Monthly averages, Oct 2025 to Oct 2026")).toBeVisible();
    const chart = screen.getByRole("img", { name: /from Oct 2025 to Oct 2026/ });
    expect(Array.from(chart.querySelectorAll("[data-tick-parity]"), (tick) => tick.textContent)).toEqual([
      "Oct",
      "Oct",
    ]);
    expect(screen.getByRole("rowheader", { name: "Oct 2026" })).toBeInTheDocument();
  });

  it("keeps the top gridline label inside the chart's box at the phone type size", () => {
    render(<PollingAggregatorClient initialState={DEFAULT_POLLING_STATE} snapshot={datedSnapshot} />);

    const chart = screen.getByRole("img", { name: /Presidential approval trend/ });
    const boxTop = Number(chart.getAttribute("viewBox")?.split(" ")[1]);
    const baselines = Array.from(chart.querySelectorAll('text[text-anchor="end"]'), (label) =>
      Number(label.getAttribute("y"))
    );
    expect(baselines).toHaveLength(3);
    // Phone and paper set the type at 25 units, and a figure stands about three quarters of that over its baseline.
    expect(Math.min(...baselines) - 25 * 0.75).toBeGreaterThanOrEqual(boxTop);
  });

  it("calls a level race a tie and puts neither name over the other", () => {
    render(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={{ ...noRaces, senateRaces: [makeRace("Oregon", "OR", 0, 2), ohio] }}
      />
    );

    const table = screen.getByRole("table", { name: "Senate race averages" });
    const [oregonRow, ohioRow] = within(table).getAllByRole("row").slice(1);
    expect(oregonRow).toHaveTextContent("tied with Oregon Runner-up");
    expect(oregonRow).toHaveTextContent("Even");
    expect(oregonRow).not.toHaveTextContent(/\bover\b/);
    expect(ohioRow).toHaveTextContent("over Ohio Runner-up");
  });

  it("steps down the heading levels one at a time on the race and the poll views", () => {
    for (const query of ["", "view=approval"]) {
      currentSearchParams = new URLSearchParams(query);
      const { unmount } = render(
        <PollingAggregatorClient initialState={DEFAULT_POLLING_STATE} snapshot={senateOnly} />
      );
      const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName[1]));
      levels.forEach((level, index) => {
        expect(level - (levels[index - 1] ?? 0)).toBeLessThanOrEqual(1);
      });
      unmount();
    }
  });

  it("counts calendar days to the election on the visitor's own date", () => {
    const noteAt = (localTime: Date) => {
      jest.spyOn(Date, "now").mockReturnValue(localTime.getTime());
      const { unmount } = render(
        <PollingAggregatorClient initialState={DEFAULT_POLLING_STATE} snapshot={datedSnapshot} />
      );
      const text = screen.getByRole("note").textContent;
      unmount();
      return text;
    };

    expect(noteAt(new Date(2026, 9, 12, 11))).toContain("22 days to the Nov 3 midterms.");
    // Late on the eve is still the eve, and the morning of the day is the day.
    expect(noteAt(new Date(2026, 10, 2, 23))).toContain("1 day to the Nov 3 midterms.");
    expect(noteAt(new Date(2026, 10, 3, 7))).toContain("election day, Nov 3, 2026.");
    expect(noteAt(new Date(2026, 10, 4, 7))).toContain("midterms Nov 3, 2026.");
    jest.restoreAllMocks();
  });
});
