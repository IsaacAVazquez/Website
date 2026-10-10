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

  it("prints each series' newest poll date beside its headline average, with the stale state", () => {
    currentSearchParams = new URLSearchParams("view=approval");
    render(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={datedSnapshot}
        staleSeries={{ approval: true, genericBallot: false }}
      />
    );

    const readout = (label: string) =>
      screen.getByText(label, { selector: "dt" }).parentElement as HTMLElement;
    expect(readout("Approval net")).toHaveTextContent(
      "Newest poll Aug 28, 2026, which is more than 14 days old"
    );
    expect(readout("Generic ballot margin")).toHaveTextContent(/Newest poll Sep 8, 2026$/);
    // Days to election is a count, so it carries no poll date.
    expect(readout("Days to election")).not.toHaveTextContent(/Newest poll/);

    // The approval view's two averages carry the same line under their headings.
    const underHeading = (name: RegExp) =>
      screen.getByRole("heading", { level: 3, name }).nextElementSibling as HTMLElement;
    expect(underHeading(/Presidential approval/)).toHaveTextContent(
      "Newest poll Aug 28, 2026, which is more than 14 days old"
    );
    expect(underHeading(/Generic ballot/)).toHaveTextContent(/^Newest poll Sep 8, 2026$/);
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
    expect(screen.getByRole("note")).toHaveTextContent(
      /without a party or an incumbency flag, so I print the names as the pollsters gave them/
    );
  });

  it("renders the overview and navigates view tabs", () => {
    render(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={pollingSnapshot}
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /polling aggregator/i })
    ).toBeVisible();

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
    expect(screen.getByText(/Senate: VoteHub has published no senate poll/)).toBeVisible();

    rerender(
      <PollingAggregatorClient initialState={DEFAULT_POLLING_STATE} snapshot={senateOnly} />
    );

    expect(screen.getByRole("button", { name: "Senate" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Governors" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Senate: 2 races polled, 1 within 3 points\. The closest is Maine, where Maine Leader leads Maine Runner-up by 0\.5 points across 4 polls\./
      )
    ).toBeVisible();
    // The hero counts the race polls with the national ones.
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
    expect(mockPush).toHaveBeenLastCalledWith("/polling-aggregator?view=senate&race=senate-oh", {
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

  it("says so when a deep-linked race view has no polls", () => {
    currentSearchParams = new URLSearchParams("view=governors");
    render(
      <PollingAggregatorClient initialState={DEFAULT_POLLING_STATE} snapshot={senateOnly} />
    );

    expect(screen.queryByRole("table", { name: /race averages/ })).not.toBeInTheDocument();
    expect(
      screen.getByText(/VoteHub has published no governor poll from the last four months/)
    ).toBeVisible();
  });
});
