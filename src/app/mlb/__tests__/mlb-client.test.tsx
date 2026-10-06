import { fireEvent, render, screen, within } from "@testing-library/react";
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

    render(
      <MlbClient
        initialState={DEFAULT_MLB_STATE}
        summary={{
          ...(await getMlbSummarySnapshot()),
          recentGames: [],
          upcomingGames: [
            divisionSeriesGame,
            { ...divisionSeriesGame, id: "823164", stage: "R", startTimeTbd: false },
          ],
        }}
        initialTeamSnapshot={await getMlbTeamSnapshot(DEFAULT_MLB_STATE.team)}
      />
    );
    fireEvent.click(screen.getByRole("tab", { name: "Games" }));

    expect(screen.getByText("Division Series")).toBeVisible();
    expect(screen.getByText("League fixture")).toBeVisible();
  });

  it("shows one division board at a time and opens the picked team in a drawer", async () => {
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

    // The board starts on the selected club's division and prints no other.
    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: `Show ${team.name} details` })).not.toBeInTheDocument();

    const divisions = screen.getByRole("group", { name: "Division" });
    await user.click(within(divisions).getByRole("button", { name: "NL West" }));
    expect(screen.getByRole("table", { name: "NL West standings" })).toBeInTheDocument();
    expect(screen.getAllByRole("table")).toHaveLength(1);

    const opener = screen.getByRole("button", { name: `Show ${team.name} details` });
    await user.click(opener);
    view.rerender(ui());

    const drawer = await screen.findByRole("dialog", { name: `${team.name} detail` });
    expect(within(drawer).getByText("Runs allowed")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
