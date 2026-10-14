import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getMlbSummarySnapshot, getMlbTeamSnapshot } from "@/lib/mlbSnapshot";
import type { MlbGame } from "@/types/mlb";
import { MlbClient } from "../mlb-client";
import { mlbSnapshot } from "@/data/mlbSnapshot";
import type { MlbRouteState, MlbView } from "@/types/mlb";
import * as core from "../mlb-state.core";

const aliasMap = core.buildTeamAliasMap(mlbSnapshot.teams);
const DEFAULT_MLB_STATE = core.resolveDefaultState(mlbSnapshot.standings, mlbSnapshot.teams);
const getDefaultTeamForView = (view: MlbView) =>
  core.getDefaultTeam(mlbSnapshot.standings, view, DEFAULT_MLB_STATE.team);
const buildMlbHref = (state: MlbRouteState, base?: URLSearchParams) =>
  core.buildHref(state, DEFAULT_MLB_STATE, aliasMap, base);

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();

// A Division Series game against a bracket placeholder, which is no club.
const divisionSeriesGame: MlbGame = {
  id: "849828",
  utcDate: "2026-10-03T10:33:00Z",
  status: "Scheduled",
  matchday: null,
  stage: "D",
  startTimeTbd: true,
  ifNecessary: false,
  homeTeam: {
    id: "119",
    name: "Los Angeles Dodgers",
    shortName: "Dodgers",
    abbreviation: "LAD",
    crest: null,
  },
  awayTeam: {
    id: "5532",
    name: "NL 3/6 Winner",
    shortName: "NL 3/6 Winner",
    abbreviation: "5532",
    crest: null,
  },
  score: { winner: null, home: null, away: null },
};

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

  afterEach(() => {
    jest.restoreAllMocks();
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
    // A plain visit selects the first club without opening its drawer.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

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

  it("prints the snapshot date as published for a viewer west of UTC", async () => {
    // Stands in for a US viewer wherever the suite runs. A formatter that
    // names its own zone is unaffected.
    const RealDateTimeFormat = Intl.DateTimeFormat;
    jest.spyOn(Intl, "DateTimeFormat").mockImplementation(((
      locales?: string | string[],
      options?: Intl.DateTimeFormatOptions
    ) =>
      new RealDateTimeFormat(locales, {
        timeZone: "America/Los_Angeles",
        ...options,
      })) as typeof Intl.DateTimeFormat);

    render(
      <MlbClient
        initialState={DEFAULT_MLB_STATE}
        summary={{ ...(await getMlbSummarySnapshot()), updatedAt: "2026-09-27" }}
        initialTeamSnapshot={await getMlbTeamSnapshot(DEFAULT_MLB_STATE.team)}
      />
    );

    expect(screen.getByText(/updated Sep 27, 2026/)).toBeVisible();
  });

  it("labels a postseason game with its round", async () => {
    render(
      <MlbClient
        initialState={DEFAULT_MLB_STATE}
        summary={{
          ...(await getMlbSummarySnapshot()),
          recentGames: [],
          upcomingGames: [
            divisionSeriesGame,
            { ...divisionSeriesGame, id: "823164", stage: "R", startTimeTbd: false },
            { ...divisionSeriesGame, id: "823165", stage: null, startTimeTbd: false },
          ],
        }}
        initialTeamSnapshot={await getMlbTeamSnapshot(DEFAULT_MLB_STATE.team)}
      />
    );
    fireEvent.click(screen.getByRole("tab", { name: "Games" }));

    // The games print under their round, and a regular season game under its own label.
    expect(screen.getByText("Division Series")).toBeVisible();
    expect(screen.getByText("Regular season")).toBeVisible();
    // A game type the feed did not name still gets a label of its own.
    expect(screen.getByText("Other games")).toBeVisible();
  });

  it("prints all six divisions on one board and opens a picked team in a drawer", async () => {
    const user = userEvent.setup();
    const summary = await getMlbSummarySnapshot();
    const team = summary.standings.find((row) => row.division === "NL West" && row.divisionRank === 2)!;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => getMlbTeamSnapshot(team.id),
    }) as unknown as typeof fetch;
    // The router is a mock, so a push has to be fed back in as the next
    // search params for the page to see the URL it asked for.
    mockPush.mockImplementation((href: string) => {
      currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    const ui = () => (
      <MlbClient initialState={DEFAULT_MLB_STATE} summary={summary} initialTeamSnapshot={null} />
    );
    const view = render(ui());

    // The scoreboard is the page: every division is its own table, every team a button.
    expect(screen.getAllByRole("table", { name: /^(AL|NL) (East|Central|West) standings$/ })).toHaveLength(6);
    expect(screen.getByRole("table", { name: "NL West standings" })).toBeInTheDocument();

    const opener = screen.getByRole("button", { name: `Show ${team.name} details` });
    await user.click(opener);
    view.rerender(ui());

    const drawer = await screen.findByRole("dialog", { name: `${team.name} detail` });
    expect(within(drawer).getByText("Runs allowed")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("opens a bare wild card link on the wild card races", async () => {
    currentSearchParams = new URLSearchParams("view=wildcard");
    render(
      <MlbClient
        initialState={{ ...DEFAULT_MLB_STATE, view: "wildcard" }}
        summary={await getMlbSummarySnapshot()}
        initialTeamSnapshot={null}
      />
    );

    expect(screen.getByRole("button", { name: /wild card/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("table", { name: "AL Wild Card standings" })).toBeInTheDocument();
    // The figure is measured against the third slot, not against the first team out.
    expect(screen.getByText(/lead over the last wild card slot/i)).toBeInTheDocument();
    expect(screen.queryByText(/first team out/i)).not.toBeInTheDocument();
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
    currentSearchParams = new URLSearchParams("view=wildcard");
    // Never settles, so the test ends with the request still open.
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;

    render(
      <MlbClient
        initialState={{ ...DEFAULT_MLB_STATE, view: "wildcard" }}
        summary={await getMlbSummarySnapshot()}
        initialTeamSnapshot={null}
      />
    );

    // The pill's centre is at 450 and the row's at 150.
    expect(screen.getByRole("group", { name: "Standings view" }).scrollLeft).toBe(300);
  });

  it("loads the view's first team's own snapshot on a bare view link", async () => {
    // The server loads the default team for a link that names no team, and
    // the wild card view opens on its own first team.
    const firstInView = getDefaultTeamForView("wildcard");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => getMlbTeamSnapshot(firstInView),
    }) as unknown as typeof fetch;
    currentSearchParams = new URLSearchParams("view=wildcard");
    render(
      <MlbClient
        initialState={{ ...DEFAULT_MLB_STATE, view: "wildcard" }}
        summary={await getMlbSummarySnapshot()}
        initialTeamSnapshot={await getMlbTeamSnapshot(DEFAULT_MLB_STATE.team)}
      />
    );

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(`/api/mlb/teams/${firstInView}`, expect.anything())
    );
  });

  it("keeps a tie for fifth on a leaders list and stops there", async () => {
    const summary = await getMlbSummarySnapshot();
    const [leader] = summary.hittingLeaders.runsBattedIn;
    const runsBattedIn = [1, 2, 3, 4, 5, 5, 7].map((rank, index) => ({
      ...leader,
      rank,
      name: `Hitter ${index + 1}`,
    }));

    render(
      <MlbClient
        initialState={DEFAULT_MLB_STATE}
        summary={{ ...summary, hittingLeaders: { ...summary.hittingLeaders, runsBattedIn } }}
        initialTeamSnapshot={await getMlbTeamSnapshot(DEFAULT_MLB_STATE.team)}
      />
    );
    fireEvent.click(screen.getByRole("tab", { name: "League leaders" }));

    expect(screen.getByText("Hitter 5")).toBeInTheDocument();
    expect(screen.getByText("Hitter 6")).toBeInTheDocument();
    expect(screen.queryByText("Hitter 7")).not.toBeInTheDocument();
  });

  it("writes the summary as a finish once postseason games are on the slate", async () => {
    const summary = await getMlbSummarySnapshot();
    const { container } = render(
      <MlbClient
        initialState={DEFAULT_MLB_STATE}
        summary={{
          ...summary,
          standings: summary.standings.map((row, index) => ({ ...row, streak: index === 0 ? "W5" : "L1" })),
          recentGames: [],
          upcomingGames: [divisionSeriesGame],
        }}
        initialTeamSnapshot={await getMlbTeamSnapshot(DEFAULT_MLB_STATE.team)}
      />
    );

    const text = container.querySelector(".sb-summary")?.textContent ?? "";
    expect(text).toMatch(/^The .+ finished with the best record at \d+-\d+, the .+ finished closest with the .+ games back, and the .+ ended the regular season on the longest win streak at 5 games\.$/);
    expect(text).not.toMatch(/are on|have the|W5/);
  });

  it("writes the summary as a race during the regular season", async () => {
    const summary = await getMlbSummarySnapshot();
    const { container } = render(
      <MlbClient
        initialState={DEFAULT_MLB_STATE}
        summary={{
          ...summary,
          standings: summary.standings.map((row, index) => ({ ...row, streak: index === 0 ? "W1" : "L1" })),
          recentGames: [],
          upcomingGames: [{ ...divisionSeriesGame, stage: "R" }],
        }}
        initialTeamSnapshot={await getMlbTeamSnapshot(DEFAULT_MLB_STATE.team)}
      />
    );

    expect(container.querySelector(".sb-summary")?.textContent).toMatch(
      /^The .+ have the best record at \d+-\d+, the .+ is the closest race with the .+ games back, and the .+ are on the longest win streak at 1 game\.$/
    );
  });

  it("says in the row which clubs lead a division or hold a wild card slot", async () => {
    const summary = await getMlbSummarySnapshot();
    const leader = summary.standings.find((row) => row.divisionRank === 1)!;
    const holder = summary.standings.find(
      (row) => row.divisionRank > 1 && row.wildCardRank !== null && row.wildCardRank <= 3
    )!;
    render(
      <MlbClient
        initialState={DEFAULT_MLB_STATE}
        summary={summary}
        initialTeamSnapshot={await getMlbTeamSnapshot(DEFAULT_MLB_STATE.team)}
      />
    );

    // The button's name replaces the mark printed inside it, so the row says it again.
    const rowOf = (name: string) =>
      within(screen.getByRole("button", { name: `Show ${name} details` }).closest("tr")!);
    expect(rowOf(leader.name).getByText("Leads the division")).toBeInTheDocument();
    expect(rowOf(holder.name).getByText("Holds a wild card slot")).toBeInTheDocument();
  });

  it("presses a team's row only while its drawer is open", async () => {
    const user = userEvent.setup();
    const summary = await getMlbSummarySnapshot();
    const team = summary.standings.find((row) => row.division === "NL West" && row.divisionRank === 2)!;
    mockPush.mockImplementation((href: string) => {
      currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    const initialTeamSnapshot = await getMlbTeamSnapshot(DEFAULT_MLB_STATE.team);
    const ui = () => (
      <MlbClient initialState={DEFAULT_MLB_STATE} summary={summary} initialTeamSnapshot={initialTeamSnapshot} />
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => getMlbTeamSnapshot(team.id),
    }) as unknown as typeof fetch;
    const view = render(ui());

    // No drawer is open on a plain visit, so no team reads as pressed.
    expect(screen.queryAllByRole("button", { name: /^Show .+ details$/, pressed: true })).toHaveLength(0);

    const opener = screen.getByRole("button", { name: `Show ${team.name} details` });
    await user.click(opener);
    view.rerender(ui());

    await screen.findByRole("dialog", { name: `${team.name} detail` });
    expect(opener).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the drawer closed when a view switch lands on a team that Back dismissed", async () => {
    const user = userEvent.setup();
    const summary = await getMlbSummarySnapshot();
    const team = summary.standings.find((row) => row.id === getDefaultTeamForView("wildcard"))!;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => getMlbTeamSnapshot(team.id),
    }) as unknown as typeof fetch;
    mockPush.mockImplementation((href: string) => {
      currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    const ui = () => <MlbClient initialState={DEFAULT_MLB_STATE} summary={summary} initialTeamSnapshot={null} />;
    const view = render(ui());

    await user.click(screen.getByRole("button", { name: `Show ${team.name} details` }));
    view.rerender(ui());
    await screen.findByRole("dialog", { name: `${team.name} detail` });

    // Back takes the team out of the URL without telling the drawer.
    currentSearchParams = new URLSearchParams();
    view.rerender(ui());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Wild card/ }));
    view.rerender(ui());
    expect(screen.getByRole("table", { name: "AL Wild Card standings" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("leaves the division place out of the drawer when the feed sent no rank", async () => {
    const summary = await getMlbSummarySnapshot();
    const team = summary.standings.find((row) => row.division === "NL West" && row.divisionRank === 2)!;
    currentSearchParams = new URLSearchParams(`team=${team.id}`);
    render(
      <MlbClient
        initialState={{ ...DEFAULT_MLB_STATE, team: team.id }}
        summary={{
          ...summary,
          standings: summary.standings.map((row) => (row.id === team.id ? { ...row, divisionRank: 0 } : row)),
        }}
        initialTeamSnapshot={await getMlbTeamSnapshot(team.id)}
      />
    );

    const drawer = screen.getByRole("dialog", { name: `${team.name} detail` });
    expect(within(drawer).getByText(team.division)).toBeInTheDocument();
    expect(within(drawer).queryByText(/in the division/)).not.toBeInTheDocument();
  });

  it("returns to the default board when Back lands on the bare URL", async () => {
    const user = userEvent.setup();
    const summary = await getMlbSummarySnapshot();
    const team = summary.standings.find((row) => row.division === "NL West" && row.divisionRank === 2)!;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => getMlbTeamSnapshot(team.id),
    }) as unknown as typeof fetch;
    mockPush.mockImplementation((href: string) => {
      currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
    });
    // The server renders the page again after a push, so the prop follows the
    // pushed URL, and Back to the bare URL leaves it there.
    let initialState: MlbRouteState = DEFAULT_MLB_STATE;
    const ui = () => <MlbClient initialState={initialState} summary={summary} initialTeamSnapshot={null} />;
    const view = render(ui());

    await user.click(screen.getByRole("button", { name: `Show ${team.name} details` }));
    initialState = { view: "all", team: team.id };
    view.rerender(ui());
    await screen.findByRole("dialog", { name: `${team.name} detail` });

    currentSearchParams = new URLSearchParams();
    view.rerender(ui());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^National League/ }));
    initialState = { view: "nl", team: getDefaultTeamForView("nl") };
    view.rerender(ui());
    expect(screen.getAllByRole("table")).toHaveLength(3);

    currentSearchParams = new URLSearchParams();
    view.rerender(ui());
    expect(screen.getByRole("button", { name: /^All divisions/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("table")).toHaveLength(6);
    // The URL is already the one the page wants, so nothing is written over it.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("prints a bracket placeholder that is not a club as plain text", async () => {
    render(
      <MlbClient
        initialState={DEFAULT_MLB_STATE}
        summary={{ ...(await getMlbSummarySnapshot()), recentGames: [], upcomingGames: [divisionSeriesGame] }}
        initialTeamSnapshot={await getMlbTeamSnapshot(DEFAULT_MLB_STATE.team)}
      />
    );

    expect(screen.getByText("NL 3/6 Winner")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "NL 3/6 Winner" })).toBeNull();
    // The club on the other side of the row still opens its drawer.
    expect(screen.getByRole("button", { name: "Dodgers" })).toBeInTheDocument();
  });
});
