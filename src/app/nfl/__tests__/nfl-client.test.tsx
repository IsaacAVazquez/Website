import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
// The conference whose first team is not the league's default, so a link that
// names only that view selects a team the server did not load.
const otherView = (["nfc", "afc"] as const).find(
  (view) => getDefaultTeamForView(view) !== DEFAULT_NFL_STATE.team
)!;

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
    // A plain visit selects the first team without opening its drawer.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^afc/i }));
    expect(mockPush).toHaveBeenLastCalledWith(
      buildNflHref({ view: "afc", team: getDefaultTeamForView("afc") }, currentSearchParams),
      { scroll: false }
    );

    // Schedule is the tab the page opens on, so the switch is to the other one.
    const detailTabs = screen.getByRole("tablist", { name: "Team and league details" });
    expect(within(detailTabs).getByRole("tab", { name: "Schedule" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    fireEvent.click(within(detailTabs).getByRole("tab", { name: "Stat leaders" }));
    expect(within(detailTabs).getByRole("tab", { name: "Stat leaders" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("heading", { level: 3, name: "Top passing yards" })).toBeVisible();
  });

  it("calls the regular season over once week 18 is complete, with playoff games still to come", async () => {
    const summary = await getNflSummarySnapshot();
    const initialTeamSnapshot = await getNflTeamSnapshot(DEFAULT_NFL_STATE.team);

    render(
      <NflClient
        initialState={DEFAULT_NFL_STATE}
        summary={{
          ...summary,
          week: 18,
          upcomingFixtures: [{ ...summary.recentFixtures[0]!, status: "SCHEDULED", gameType: "WC" }],
        }}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    );

    expect(screen.getByText("Regular season over")).toBeVisible();
  });

  it("says where the seeds come from without saying the snapshot has none", async () => {
    const summary = await getNflSummarySnapshot();
    const initialTeamSnapshot = await getNflTeamSnapshot(DEFAULT_NFL_STATE.team);

    render(
      <NflClient
        initialState={DEFAULT_NFL_STATE}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    );

    expect(screen.getByText(/division rank and conference rank/)).toBeVisible();
    expect(screen.queryByText(/carries no seeds/)).not.toBeInTheDocument();
  });

  it("fetches the view's first team when a link names only the view", async () => {
    currentSearchParams = new URLSearchParams(`view=${otherView}`);
    // Never settles, so the test ends with the request still open.
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    const summary = await getNflSummarySnapshot();
    // The server reads no team from that link, so it loads the default one.
    const initialTeamSnapshot = await getNflTeamSnapshot(DEFAULT_NFL_STATE.team);

    render(
      <NflClient
        initialState={{ view: otherView, team: DEFAULT_NFL_STATE.team }}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    );

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/nfl/teams/${getDefaultTeamForView(otherView)}`,
      expect.anything()
    );
  });

  it("brings the pressed view pill into the switch row on a link to a later view", async () => {
    // jsdom lays nothing out, so the pressed pill is given a box outside the row's.
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      return (
        this.getAttribute("aria-pressed") === "true"
          ? { left: 400, width: 100, right: 500 }
          : { left: 0, width: 300, right: 300 }
      ) as DOMRect;
    });
    currentSearchParams = new URLSearchParams("view=playoffs");
    const team = getDefaultTeamForView("playoffs");
    const summary = await getNflSummarySnapshot();
    const initialTeamSnapshot = await getNflTeamSnapshot(team);

    render(
      <NflClient
        initialState={{ view: "playoffs", team }}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    );

    // The pill's centre is at 450 and the row's at 150.
    expect(screen.getByRole("group", { name: "Conference and seeding view" }).scrollLeft).toBe(300);
  });

  it("marks no team as pressed until its drawer is open", async () => {
    const user = userEvent.setup();
    const summary = await getNflSummarySnapshot();
    const team = summary.teams.find((entry) => entry.id === DEFAULT_NFL_STATE.team)!;
    const initialTeamSnapshot = await getNflTeamSnapshot(team.id);

    render(
      <NflClient
        initialState={DEFAULT_NFL_STATE}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    );

    const opener = screen.getByRole("button", { name: `Show ${team.name} details` });
    expect(opener).toHaveAttribute("aria-pressed", "false");
    expect(
      within(screen.getByRole("region", { name: "Divisions" })).queryByRole("button", { pressed: true })
    ).not.toBeInTheDocument();

    await user.click(opener);
    expect(await screen.findByRole("dialog", { name: `${team.name} detail` })).toBeVisible();
    expect(opener).toHaveAttribute("aria-pressed", "true");
  });

  it("dates each upcoming game in the team drawer", async () => {
    const user = userEvent.setup();
    const summary = await getNflSummarySnapshot();
    const team = summary.teams.find((entry) => entry.id === DEFAULT_NFL_STATE.team)!;
    const teamSnapshot = await getNflTeamSnapshot(team.id);
    // The same kickoff two Sundays apart, around a bye.
    const upcoming = (id: string, utcDate: string) => ({
      ...summary.recentFixtures[0]!,
      id,
      utcDate,
      status: "SCHEDULED",
      score: { winner: null, home: null, away: null },
    });

    render(
      <NflClient
        initialState={DEFAULT_NFL_STATE}
        summary={summary}
        initialTeamSnapshot={{
          ...teamSnapshot,
          recentFixtures: [],
          upcomingFixtures: [upcoming("first", "2026-10-18T17:00:00Z"), upcoming("second", "2026-11-01T18:00:00Z")],
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: `Show ${team.name} details` }));
    const drawer = await screen.findByRole("dialog", { name: `${team.name} detail` });
    expect(within(drawer).getByText("Oct 18")).toBeVisible();
    expect(within(drawer).getByText("Nov 1")).toBeVisible();
  });

  it("opens the picked team in a drawer beside the table and returns focus on Escape", async () => {
    const user = userEvent.setup();
    const summary = await getNflSummarySnapshot();
    const team = summary.teams[3]!;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => getNflTeamSnapshot(team.id),
    }) as unknown as typeof fetch;
    // The router is a mock, so a push has to be fed back in as the next
    // search params for the page to see the URL it asked for.
    mockPush.mockImplementation((href: string) => {
      currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    const ui = () => (
      <NflClient initialState={DEFAULT_NFL_STATE} summary={summary} initialTeamSnapshot={null} />
    );
    const view = render(ui());

    const opener = screen.getByRole("button", { name: `Show ${team.name} details` });
    await user.click(opener);
    view.rerender(ui());

    expect(mockPush).toHaveBeenLastCalledWith(
      buildNflHref({ view: "league", team: team.id }),
      { scroll: false }
    );
    const drawer = await screen.findByRole("dialog", { name: `${team.name} detail` });
    // The columns a phone drops from the table are in the drawer.
    expect(within(drawer).getByText("Points against")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("shuts the drawer on Back to the plain page while the server's state still names the team", async () => {
    const user = userEvent.setup();
    const summary = await getNflSummarySnapshot();
    const team = summary.teams[3]!;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => getNflTeamSnapshot(team.id),
    }) as unknown as typeof fetch;
    mockPush.mockImplementation((href: string) => {
      currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    const ui = (initialState: NFLRouteState) => (
      <NflClient initialState={initialState} summary={summary} initialTeamSnapshot={null} />
    );
    const view = render(ui(DEFAULT_NFL_STATE));

    await user.click(screen.getByRole("button", { name: `Show ${team.name} details` }));
    // The push renders the server page again, for the team's link this time.
    const pushedState: NFLRouteState = { view: "league", team: team.id };
    view.rerender(ui(pushedState));
    await screen.findByRole("dialog", { name: `${team.name} detail` });

    // Back empties the URL and leaves the page with the props of the link it left.
    currentSearchParams = new URLSearchParams();
    view.rerender(ui(pushedState));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // The team is not written back into the URL either.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("keeps a drawer that Back closed shut when the view moves to its team", async () => {
    const user = userEvent.setup();
    const summary = await getNflSummarySnapshot();
    const team = summary.teams.find((entry) => entry.id === getDefaultTeamForView(otherView))!;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => getNflTeamSnapshot(team.id),
    }) as unknown as typeof fetch;
    mockPush.mockImplementation((href: string) => {
      currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    const ui = () => (
      <NflClient initialState={DEFAULT_NFL_STATE} summary={summary} initialTeamSnapshot={null} />
    );
    const view = render(ui());

    await user.click(screen.getByRole("button", { name: `Show ${team.name} details` }));
    view.rerender(ui());
    await screen.findByRole("dialog", { name: `${team.name} detail` });

    // Back takes the team out of the URL, which shuts the drawer without its own close.
    currentSearchParams = new URLSearchParams();
    view.rerender(ui());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // That team leads its conference, so the conference view selects it again.
    await user.click(screen.getByRole("button", { name: new RegExp(`^${otherView} `, "i") }));
    view.rerender(ui());
    expect(currentSearchParams.get("team")).toBe(team.id);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
