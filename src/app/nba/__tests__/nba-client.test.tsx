import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getNbaSummarySnapshot, getNbaTeamSnapshot } from "@/lib/nbaSnapshot";
import { NbaClient } from "../nba-client";
import { nbaSnapshot } from "@/data/nbaSnapshot";
import type { NbaFixture, NbaRouteState, NbaSummarySnapshot, NbaTeam, NbaView } from "@/types/nba";
import * as core from "../nba-state.core";

const { east, west } = nbaSnapshot.teamsByConference;
const aliasMap = core.buildTeamAliasMap([...east, ...west]);
const DEFAULT_NBA_STATE = core.resolveDefaultState(east, west);
const getDefaultTeamForView = (view: NbaView) =>
  core.getDefaultTeam(east, west, view, DEFAULT_NBA_STATE.team);
const buildNbaHref = (state: NbaRouteState, base?: URLSearchParams) =>
  core.buildHref(state, DEFAULT_NBA_STATE, aliasMap, base);

/** The summary with chosen East records, keyed by seed, so a test does not lean on the committed table. */
const withEastRecords = (
  summary: NbaSummarySnapshot,
  records: Record<number, [wins: number, losses: number]>
): NbaSummarySnapshot => ({
  ...summary,
  teamsByConference: {
    ...summary.teamsByConference,
    east: summary.teamsByConference.east.map((team, index) => {
      const record = records[index + 1];
      return { ...team, conferenceSeed: index + 1, ...(record ? { wins: record[0], losses: record[1] } : {}) };
    }),
  },
});

const fixtureTeam = (team: NbaTeam) => ({
  id: team.id,
  name: team.name,
  shortName: team.shortName,
  abbreviation: team.abbreviation,
  crest: null,
});

/** A finished game, 8:30 PM Eastern on June 13. */
const finishedGame = (score: NbaFixture["score"]): NbaFixture => ({
  id: "finished-game",
  utcDate: "2026-06-14T00:30:00Z",
  status: "FINISHED",
  matchday: null,
  stage: "Playoffs",
  homeTeam: fixtureTeam(west[0]!),
  awayTeam: fixtureTeam(east[3]!),
  score,
});

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

  afterEach(() => {
    jest.restoreAllMocks();
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
      // The default view prints both conferences, so the pick stays on it.
      buildNbaHref({ view: DEFAULT_NBA_STATE.view, team: team.id }),
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

  it("fetches the view's first team when a link names only the view", async () => {
    currentSearchParams = new URLSearchParams("view=west");
    // Never settles, so the test ends with the request still open.
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    const summary = await getNbaSummarySnapshot();
    // The server reads no team from that link, so it loads the default one.
    const initialTeamSnapshot = await getNbaTeamSnapshot(DEFAULT_NBA_STATE.team);

    render(
      <NbaClient
        initialState={{ view: "west", team: DEFAULT_NBA_STATE.team }}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
        teamColors={{}}
      />
    );

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/nba/teams/${getDefaultTeamForView("west")}`,
      expect.anything()
    );
  });

  it("keeps the drawer closed when a view switch lands on a team that Back closed", async () => {
    const user = userEvent.setup();
    const summary = await getNbaSummarySnapshot();
    const team = west[0]!;
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
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

    await user.click(screen.getByRole("button", { name: `Show ${team.name} details` }));
    view.rerender(ui());
    expect(await screen.findByRole("dialog", { name: `${team.name} detail` })).toBeInTheDocument();

    // Back leaves the team's URL, which closes the drawer without its own close.
    currentSearchParams = new URLSearchParams();
    view.rerender(ui());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // The West's first team is the one that was open.
    await user.click(screen.getByRole("button", { name: /western conference/i }));
    view.rerender(ui());
    expect(screen.getByRole("button", { name: /western conference/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("goes back to the plain board while the page still holds the state of the link it left", async () => {
    const summary = await getNbaSummarySnapshot();
    const team = west[1]!;
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    // Back changes the URL and leaves the props the server sent for the link.
    const ui = () => (
      <NbaClient
        initialState={{ view: "west", team: team.id }}
        summary={summary}
        initialTeamSnapshot={null}
        teamColors={{}}
      />
    );
    currentSearchParams = new URLSearchParams(`view=west&team=${team.id}`);
    const view = render(ui());
    expect(screen.getByRole("dialog", { name: `${team.name} detail` })).toBeInTheDocument();

    currentSearchParams = new URLSearchParams();
    view.rerender(ui());

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /both conferences/i })).toHaveAttribute("aria-pressed", "true");
    // The bare URL is already the default board, so nothing rewrites it.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("marks no team as pressed until its drawer is open", async () => {
    const user = userEvent.setup();
    const summary = await getNbaSummarySnapshot();
    const team = east[0]!;

    render(
      <NbaClient
        initialState={DEFAULT_NBA_STATE}
        summary={summary}
        initialTeamSnapshot={await getNbaTeamSnapshot(team.id)}
        teamColors={{}}
      />
    );

    const opener = screen.getByRole("button", { name: `Show ${team.name} details` });
    expect(opener).toHaveAttribute("aria-pressed", "false");

    await user.click(opener);
    expect(await screen.findByRole("dialog", { name: `${team.name} detail` })).toBeVisible();
    expect(opener).toHaveAttribute("aria-pressed", "true");
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
    currentSearchParams = new URLSearchParams("view=play-in");
    const team = getDefaultTeamForView("play-in");
    const summary = await getNbaSummarySnapshot();

    render(
      <NbaClient
        initialState={{ view: "play-in", team }}
        summary={summary}
        initialTeamSnapshot={await getNbaTeamSnapshot(team)}
        teamColors={{}}
      />
    );

    // The pill's centre is at 450 and the row's at 150.
    expect(screen.getByRole("group", { name: "Conference and seeding view" }).scrollLeft).toBe(300);
  });

  it("keeps the name of the data job out of the off-season note", async () => {
    const committed = await getNbaSummarySnapshot();
    const finished = (team: NbaTeam) => ({ ...team, gamesPlayed: 82 });

    const { container } = render(
      <NbaClient
        initialState={DEFAULT_NBA_STATE}
        summary={{
          ...committed,
          upcomingFixtures: [],
          teamsByConference: {
            east: committed.teamsByConference.east.map(finished),
            west: committed.teamsByConference.west.map(finished),
          },
        }}
        initialTeamSnapshot={await getNbaTeamSnapshot(DEFAULT_NBA_STATE.team)}
        teamColors={{}}
      />
    );

    expect(screen.getByText("Off-season")).toBeVisible();
    expect(container).not.toHaveTextContent(/refresh lane/i);
  });

  it("counts a one game cushion in the singular", async () => {
    const summary = withEastRecords(await getNbaSummarySnapshot(), { 6: [46, 36], 7: [45, 37] });
    const team = summary.teamsByConference.east[5]!;
    currentSearchParams = new URLSearchParams(`team=${team.id}`);

    render(
      <NbaClient
        initialState={{ view: "league", team: team.id }}
        summary={summary}
        initialTeamSnapshot={await getNbaTeamSnapshot(team.id)}
        teamColors={{}}
      />
    );

    const drawer = screen.getByRole("dialog", { name: `${team.name} detail` });
    expect(within(drawer).getByText(/a cushion of 1 game over the play-in line/)).toBeInTheDocument();
  });

  it("measures a gap in games from wins and losses when schedules are uneven", async () => {
    // One win and two losses apart is a game and a half.
    const summary = withEastRecords(await getNbaSummarySnapshot(), { 6: [31, 18], 7: [30, 20] });
    const team = summary.teamsByConference.east[6]!;
    currentSearchParams = new URLSearchParams(`team=${team.id}`);

    render(
      <NbaClient
        initialState={{ view: "league", team: team.id }}
        summary={summary}
        initialTeamSnapshot={await getNbaTeamSnapshot(team.id)}
        teamColors={{}}
      />
    );

    const drawer = screen.getByRole("dialog", { name: `${team.name} detail` });
    expect(within(drawer).getByText(/1\.5 games back of a top-six seed/)).toBeInTheDocument();
  });

  it("measures the top seed against the first play-in team, as the ladder's line does", async () => {
    const user = userEvent.setup();
    const summary = withEastRecords(await getNbaSummarySnapshot(), { 1: [60, 22], 6: [46, 36], 7: [45, 37] });
    const team = summary.teamsByConference.east[0]!;

    render(
      <NbaClient
        initialState={DEFAULT_NBA_STATE}
        summary={summary}
        initialTeamSnapshot={await getNbaTeamSnapshot(team.id)}
        teamColors={{}}
      />
    );

    await user.click(screen.getByRole("button", { name: `Show ${team.name} details` }));
    const drawer = await screen.findByRole("dialog", { name: `${team.name} detail` });
    expect(within(drawer).getByText(/sit 15 games clear of the play-in cutoff/)).toBeInTheDocument();
  });

  it("dates each result on the Schedule tab", async () => {
    const summary = await getNbaSummarySnapshot();

    render(
      <NbaClient
        initialState={DEFAULT_NBA_STATE}
        summary={{ ...summary, recentFixtures: [finishedGame({ winner: "AWAY_TEAM", home: 90, away: 94 })] }}
        initialTeamSnapshot={await getNbaTeamSnapshot(DEFAULT_NBA_STATE.team)}
        teamColors={{}}
      />
    );

    expect(screen.getByText("Jun 13")).toBeVisible();
  });

  it("reads a drawer game with a winner and no score as final", async () => {
    const summary = await getNbaSummarySnapshot();
    const team = east[3]!;
    currentSearchParams = new URLSearchParams(`team=${team.id}`);

    render(
      <NbaClient
        initialState={{ view: "league", team: team.id }}
        summary={summary}
        initialTeamSnapshot={{
          ...(await getNbaTeamSnapshot(team.id)),
          recentFixtures: [finishedGame({ winner: "AWAY_TEAM", home: null, away: null })],
          upcomingFixtures: [],
        }}
        teamColors={{}}
      />
    );

    const drawer = screen.getByRole("dialog", { name: `${team.name} detail` });
    expect(within(drawer).getByText("Final")).toBeInTheDocument();
    expect(within(drawer).getByText(`, ${team.shortName} won`)).toBeInTheDocument();
  });

  it("names the leaders link by the words a visitor sees", async () => {
    const user = userEvent.setup();
    const summary = await getNbaSummarySnapshot();

    render(
      <NbaClient
        initialState={DEFAULT_NBA_STATE}
        summary={summary}
        initialTeamSnapshot={await getNbaTeamSnapshot(DEFAULT_NBA_STATE.team)}
        teamColors={{}}
      />
    );

    await user.click(screen.getByRole("tab", { name: "Stat leaders" }));
    expect(screen.getByRole("link", { name: "ESPN stats (opens in a new tab)" })).toHaveTextContent(/^ESPN stats/);
  });
});
