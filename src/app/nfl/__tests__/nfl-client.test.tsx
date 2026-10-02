import { fireEvent, render, screen, within } from "@testing-library/react";
import { getNflSummarySnapshot, getNflTeamSnapshot } from "@/lib/nflSnapshot";
import { NflClient } from "../nfl-client";
import { nflSnapshot } from "@/data/nflSnapshot";
import type { NFLRouteState, NFLView } from "@/types/nfl";
import * as core from "../nfl-state.core";

const aliasMap = core.buildTeamAliasMap(nflSnapshot.teams);
const DEFAULT_NFL_STATE = core.resolveDefaultState(nflSnapshot.teams);
const getDefaultTeamForView = (view: NFLView) =>
  core.getDefaultTeam(nflSnapshot.teams, view, DEFAULT_NFL_STATE.team);
const buildNflHref = (state: NFLRouteState, base?: URLSearchParams) =>
  core.buildHref(state, DEFAULT_NFL_STATE, aliasMap, base);

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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("prints the snapshot date the same in every time zone", async () => {
    // A formatter built without a zone uses the reader's, and a US reader is
    // still on the evening before when a date-only value lands on UTC midnight.
    const RealDateTimeFormat = Intl.DateTimeFormat;
    jest.spyOn(Intl, "DateTimeFormat").mockImplementation(
      (locales, options) =>
        new RealDateTimeFormat(locales, {
          timeZone: "America/Los_Angeles",
          ...options,
        })
    );
    const summary = await getNflSummarySnapshot();
    const initialTeamSnapshot = await getNflTeamSnapshot(DEFAULT_NFL_STATE.team);

    render(
      <NflClient
        initialState={DEFAULT_NFL_STATE}
        summary={{ ...summary, updatedAt: "2026-09-22" }}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    );

    expect(screen.getByText(/snapshot Sep 22, 2026/)).toBeVisible();
  });

  it("says week 1 is in progress before any week is complete", async () => {
    const summary = await getNflSummarySnapshot();
    const initialTeamSnapshot = await getNflTeamSnapshot(DEFAULT_NFL_STATE.team);

    render(
      <NflClient
        initialState={DEFAULT_NFL_STATE}
        summary={{ ...summary, week: 0 }}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    );

    expect(screen.getByText(/· week 1 in progress ·/)).toBeVisible();
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
