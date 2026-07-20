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

describe("PollingAggregatorClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
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
