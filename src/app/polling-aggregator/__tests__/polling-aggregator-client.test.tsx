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

  it("navigates race selection in the Senate table", () => {
    const firstRace = pollingSnapshot.senateRaces[0];

    render(
      <PollingAggregatorClient
        initialState={{ view: "senate", race: null }}
        snapshot={pollingSnapshot}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: `Show ${firstRace.state} ${firstRace.office} race`,
      })
    );

    expect(mockPush).toHaveBeenLastCalledWith(
      `/polling-aggregator?view=senate&race=${firstRace.id}`,
      { scroll: false }
    );
  });
});
