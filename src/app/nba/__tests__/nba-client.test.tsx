import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getNbaSummarySnapshot, getNbaTeamSnapshot } from "@/lib/nbaSnapshot";
import { NbaClient } from "../nba-client";
import { nbaSnapshot } from "@/data/nbaSnapshot";
import type { NbaRouteState, NbaView } from "@/types/nba";
import * as core from "../nba-state.core";

const { east, west } = nbaSnapshot.teamsByConference;
const aliasMap = core.buildTeamAliasMap([...east, ...west]);
const DEFAULT_NBA_STATE = core.resolveDefaultState(east, west);
const getDefaultTeamForView = (view: NbaView) =>
  core.getDefaultTeam(east, west, view, DEFAULT_NBA_STATE.team);
const buildNbaHref = (state: NbaRouteState, base?: URLSearchParams) =>
  core.buildHref(state, DEFAULT_NBA_STATE, aliasMap, base);

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
        teamColors={{}}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: /nba pulse/i })).toBeVisible();
    expect(screen.getByRole("region", { name: /nba standings/i })).toBeVisible();
    // A plain visit selects the first seed without opening its drawer.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

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

  it("dates the snapshot in UTC and says when the standings are final", async () => {
    const committed = await getNbaSummarySnapshot();
    const initialTeamSnapshot = await getNbaTeamSnapshot(DEFAULT_NBA_STATE.team);
    const withGamesPlayed = (gamesPlayed: number) => ({
      ...committed,
      season: "2025-26",
      updatedAt: "2026-06-20",
      teamsByConference: {
        east: committed.teamsByConference.east.map((team) => ({ ...team, gamesPlayed })),
        west: committed.teamsByConference.west.map((team) => ({ ...team, gamesPlayed })),
      },
    });

    const { unmount } = render(
      <NbaClient
        initialState={DEFAULT_NBA_STATE}
        summary={withGamesPlayed(82)}
        initialTeamSnapshot={initialTeamSnapshot}
        teamColors={{}}
      />
    );
    expect(
      screen.getByText(
        "ESPN · Season 2025-26 · final regular season standings · 30 teams · snapshot Jun 20, 2026"
      )
    ).toBeVisible();
    unmount();

    render(
      <NbaClient
        initialState={DEFAULT_NBA_STATE}
        summary={withGamesPlayed(41)}
        initialTeamSnapshot={initialTeamSnapshot}
        teamColors={{}}
      />
    );
    expect(
      screen.getByText("ESPN · Season 2025-26 · 30 teams · snapshot Jun 20, 2026")
    ).toBeVisible();
  });

  it("opens the picked team in a drawer beside the table and returns focus on Escape", async () => {
    const user = userEvent.setup();
    const summary = await getNbaSummarySnapshot();
    const team = east[3]!;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => getNbaTeamSnapshot(team.id),
    }) as unknown as typeof fetch;
    // The router is a mock, so a push has to be fed back in as the next
    // search params for the page to see the URL it asked for.
    mockPush.mockImplementation((href: string) => {
      currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    const ui = () => (
      <NbaClient
        initialState={DEFAULT_NBA_STATE}
        summary={summary}
        initialTeamSnapshot={null}
        teamColors={{}}
      />
    );
    const view = render(ui());

    const opener = screen.getByRole("button", { name: `Show ${team.name} details` });
    await user.click(opener);
    view.rerender(ui());

    expect(mockPush).toHaveBeenLastCalledWith(
      buildNbaHref({ view: "east", team: team.id }),
      { scroll: false }
    );
    const drawer = await screen.findByRole("dialog", { name: `${team.name} detail` });
    // The columns a phone drops from the table are in the drawer.
    expect(within(drawer).getByText("Diff/g")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("opens the drawer for a link that names a team", async () => {
    const summary = await getNbaSummarySnapshot();
    const team = east[3]!;
    currentSearchParams = new URLSearchParams(`team=${team.id}`);

    render(
      <NbaClient
        initialState={{ view: "east", team: team.id }}
        summary={summary}
        initialTeamSnapshot={await getNbaTeamSnapshot(team.id)}
        teamColors={{}}
      />
    );

    expect(screen.getByRole("dialog", { name: `${team.name} detail` })).toBeInTheDocument();
  });
});
