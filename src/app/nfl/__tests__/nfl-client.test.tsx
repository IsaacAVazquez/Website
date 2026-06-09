import { fireEvent, render, screen, within } from "@testing-library/react";
import { getNflSummarySnapshot, getNflTeamSnapshot } from "@/lib/nflSnapshot";
import { NflClient } from "../nfl-client";
import {
  buildNflHref,
  DEFAULT_NFL_STATE,
  getDefaultTeamForView,
} from "../nfl-state";

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

describe("NflClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("renders standings, navigates conference filters, and switches detail tabs", async () => {
    const summary = await getNflSummarySnapshot();
    const initialTeamSnapshot = await getNflTeamSnapshot(DEFAULT_NFL_STATE.team);

    render(
      <NflClient
        initialState={DEFAULT_NFL_STATE}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: /nfl pulse/i })).toBeVisible();
    expect(screen.getByRole("region", { name: /nfl standings/i })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /^afc/i }));
    expect(mockPush).toHaveBeenLastCalledWith(
      buildNflHref({ view: "afc", team: getDefaultTeamForView("afc") }, currentSearchParams),
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
