import { fireEvent, render, screen, within } from "@testing-library/react";
import { getMlbSummarySnapshot, getMlbTeamSnapshot } from "@/lib/mlbSnapshot";
import { MlbClient } from "../mlb-client";
import {
  buildMlbHref,
  DEFAULT_MLB_STATE,
  getDefaultTeamForView,
} from "../mlb-state";

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

describe("MlbClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("renders standings, navigates league filters, and switches detail tabs", async () => {
    const summary = await getMlbSummarySnapshot();
    const initialTeamSnapshot = await getMlbTeamSnapshot(DEFAULT_MLB_STATE.team);

    render(
      <MlbClient
        initialState={DEFAULT_MLB_STATE}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: /mlb pulse/i })).toBeVisible();
    expect(screen.getByRole("region", { name: /mlb standings/i })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /american league/i }));
    expect(mockPush).toHaveBeenLastCalledWith(
      buildMlbHref({ view: "al", team: getDefaultTeamForView("al") }, currentSearchParams),
      { scroll: false }
    );

    const detailTabs = screen.getByRole("tablist", { name: "Team and league details" });
    fireEvent.click(within(detailTabs).getByRole("tab", { name: "Games" }));
    expect(within(detailTabs).getByRole("tab", { name: "Games" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
