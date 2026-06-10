import { fireEvent, render, screen, within } from "@testing-library/react";
import { getNbaSummarySnapshot, getNbaTeamSnapshot } from "@/lib/nbaSnapshot";
import { NbaClient } from "../nba-client";
import {
  buildNbaHref,
  DEFAULT_NBA_STATE,
  getDefaultTeamForView,
} from "../nba-state";

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

describe("NbaClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("renders standings, navigates view filters, and switches detail tabs", async () => {
    const summary = await getNbaSummarySnapshot();
    const initialTeamSnapshot = await getNbaTeamSnapshot(DEFAULT_NBA_STATE.team);

    render(
      <NbaClient
        initialState={DEFAULT_NBA_STATE}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: /nba pulse/i })).toBeVisible();
    expect(screen.getByRole("region", { name: /nba standings/i })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /western conference/i }));
    expect(mockPush).toHaveBeenLastCalledWith(
      buildNbaHref({ view: "west", team: getDefaultTeamForView("west") }, currentSearchParams),
      { scroll: false }
    );

    const detailTabs = screen.getByRole("tablist", { name: "Team and league details" });
    fireEvent.click(within(detailTabs).getByRole("tab", { name: "Schedule" }));
    expect(within(detailTabs).getByRole("tab", { name: "Schedule" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
