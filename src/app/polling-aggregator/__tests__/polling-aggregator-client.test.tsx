import { fireEvent, render, screen } from "@testing-library/react";
import { pollingSnapshot } from "@/data/pollingSnapshot";
import { PollingAggregatorClient } from "../polling-aggregator-client";
import { DEFAULT_POLLING_STATE } from "../polling-aggregator-state";

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

    expect(screen.getByRole("note")).not.toHaveTextContent(/newest/i);
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
    expect(screen.getByText(/candidate-party metadata/i)).toBeVisible();
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

  it("does not offer race tabs without verified candidate-party metadata", () => {
    render(
      <PollingAggregatorClient
        initialState={DEFAULT_POLLING_STATE}
        snapshot={pollingSnapshot}
      />
    );

    expect(screen.queryByRole("button", { name: "Senate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Governors" })).not.toBeInTheDocument();
  });
});
