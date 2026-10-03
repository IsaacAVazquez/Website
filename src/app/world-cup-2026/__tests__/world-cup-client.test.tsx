import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { worldCupSnapshot } from "@/data/worldCupSnapshot";
import type { WorldCupSummarySnapshot, WorldCupTeamSnapshot } from "@/types/worldCup";
import { WorldCupClient } from "../world-cup-client";
import { DEFAULT_WORLD_CUP_STATE } from "../world-cup-state";

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

const { teamSnapshots, ...summary } = worldCupSnapshot;
const SUMMARY: WorldCupSummarySnapshot = summary;
const MEXICO = teamSnapshots.mexico as WorldCupTeamSnapshot;

const EMPTY_SUMMARY: WorldCupSummarySnapshot = {
  ...SUMMARY,
  groups: [],
  knockout: [],
  recentFixtures: [],
  upcomingFixtures: [],
  scorers: [],
};

function renderClient(
  props: Partial<React.ComponentProps<typeof WorldCupClient>> = {}
) {
  return render(
    <WorldCupClient
      initialState={DEFAULT_WORLD_CUP_STATE}
      summary={SUMMARY}
      initialTeamSnapshot={null}
      {...props}
    />
  );
}

function readout(label: string) {
  const term = screen.getByText(label, { selector: "dt" });
  return term.parentElement as HTMLElement;
}

describe("WorldCupClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("leads with the champion, the final, and the group tables on a plain visit", async () => {
    renderClient();

    expect(screen.getByRole("heading", { level: 1, name: "World Cup Pulse" })).toBeInTheDocument();
    expect(within(readout("Champion")).getByText("Spain")).toBeInTheDocument();
    expect(within(readout("Champion")).getByText("Beat Argentina in the final")).toBeInTheDocument();
    expect(within(readout("Final")).getByText("Spain 1-0 Argentina")).toBeInTheDocument();
    expect(within(readout("Final")).getByText("MetLife Stadium")).toBeInTheDocument();
    expect(within(readout("Matches")).getByText("104")).toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "Group stage" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "world-cup-tab-groups");
    expect(screen.getAllByRole("table", { name: /^Group [A-L] standings$/ })).toHaveLength(12);

    const race = screen.getByRole("table", { name: "Third-place wildcard race" });
    const raceRows = within(race).getAllByRole("row").slice(1);
    expect(raceRows).toHaveLength(12);
    expect(within(race).getAllByText("In a qualifying place")).toHaveLength(8);
    expect(within(race).getAllByText("Outside the cut")).toHaveLength(4);
    fireEvent.click(within(raceRows[0]).getByRole("button"));
    expect(mockPush).toHaveBeenLastCalledWith(expect.stringMatching(/^\/world-cup-2026\?team=[a-z-]+$/), {
      scroll: false,
    });
    mockPush.mockClear();

    // Format card in the aside, since no team is picked.
    expect(screen.getByText("A bigger, three-country World Cup")).toBeInTheDocument();
    expect(screen.getByText("June 11 to July 19, 2026")).toBeInTheDocument();
    expect(screen.getByText("16 stadiums · 3 nations")).toBeInTheDocument();

    // A completed snapshot carries no scorers, so the golden boot table stays hidden.
    expect(screen.queryByRole("table", { name: "Top scorers" })).toBeNull();
    await waitFor(() => expect(mockReplace).not.toHaveBeenCalled());
  });

  it("labels group rows by qualifying zone and signs goal difference", () => {
    renderClient();
    const groupA = screen.getByRole("table", { name: "Group A standings" });
    const rows = within(groupA).getAllByRole("row").slice(1);

    expect(within(rows[0]).getByText("In a direct qualifying place")).toBeInTheDocument();
    expect(within(rows[0]).getByText("+6")).toBeInTheDocument();
    expect(within(rows[2]).getByText("In the third-place wildcard race")).toBeInTheDocument();
    expect(within(rows[3]).queryByText(/qualifying|wildcard/)).toBeNull();
    expect(within(rows[3]).getByText("-4")).toBeInTheDocument();
  });

  it("pushes view changes and team picks into the URL", () => {
    renderClient();

    fireEvent.click(screen.getByRole("tab", { name: "Knockout bracket" }));
    expect(mockPush).toHaveBeenLastCalledWith("/world-cup-2026?view=knockout", { scroll: false });

    fireEvent.click(screen.getByRole("tab", { name: "Match schedule" }));
    expect(mockPush).toHaveBeenLastCalledWith("/world-cup-2026?view=schedule", { scroll: false });

    // Picking the current view is a no-op.
    mockPush.mockClear();
    fireEvent.click(screen.getByRole("tab", { name: "Group stage" }));
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Show Mexico details" }));
    expect(mockPush).toHaveBeenLastCalledWith("/world-cup-2026?team=mexico", { scroll: false });
  });

  it("opens a team from the bracket in the hero", () => {
    const { container } = renderClient();
    const bracketName = Array.from(container.querySelectorAll(".c97-bracket-svg text")).find(
      (node) => node.textContent === "ARG"
    );
    fireEvent.click(bracketName as Element);
    expect(mockPush).toHaveBeenLastCalledWith("/world-cup-2026?team=argentina", { scroll: false });
  });

  it("ignores a team id that is not in the tournament", () => {
    const stranger = {
      ...SUMMARY,
      knockout: SUMMARY.knockout.map((round) =>
        round.name === "Final"
          ? {
              ...round,
              fixtures: [
                { ...round.fixtures[0], homeTeam: { ...round.fixtures[0].homeTeam, id: "atlantis", code: "ATL" } },
              ],
            }
          : round
      ),
    };
    const { container } = renderClient({ summary: stranger });
    const atlantis = Array.from(container.querySelectorAll(".c97-bracket-svg text")).find(
      (node) => node.textContent === "ATL"
    );
    fireEvent.click(atlantis as Element);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("lists every knockout round from the URL's view", () => {
    currentSearchParams = new URLSearchParams("view=knockout");
    renderClient();

    expect(screen.getByRole("tab", { name: "Knockout bracket" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Every tie from the Round of 32 to the final, round by round.")).toBeInTheDocument();
    const panel = screen.getByRole("tabpanel");
    for (const [round, ties] of [
      ["Round of 32", "16 ties"],
      ["Round of 16", "8 ties"],
      ["Final", "1 ties"],
    ]) {
      const heading = within(panel).getByRole("heading", { level: 3, name: round });
      expect(heading.parentElement).toHaveTextContent(ties);
    }
  });

  it("shows the schedule's recent slate and the upcoming list when present", () => {
    currentSearchParams = new URLSearchParams("view=schedule");
    const upcoming = { ...SUMMARY.recentFixtures[0], id: "next-1", status: "SCHEDULED" };
    renderClient({ summary: { ...SUMMARY, upcomingFixtures: [upcoming] } });

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("Recent slate")).toBeInTheDocument();
    expect(within(panel).getByText("Next up")).toBeInTheDocument();
    // Group fixtures carry their group as the eyebrow label.
    expect(within(panel).getAllByText(/^Group [A-L]$/).length).toBeGreaterThan(0);
  });

  it("explains each view while the tournament has no data", () => {
    const { rerender } = renderClient({ summary: EMPTY_SUMMARY });
    expect(screen.getByText("Group standings open with the first whistle")).toBeInTheDocument();
    expect(screen.getByText("The bracket fills in once the knockout stage is drawn.")).toBeInTheDocument();
    expect(within(readout("Champion")).getByText("—")).toBeInTheDocument();
    expect(within(readout("Final")).getByText("—")).toBeInTheDocument();

    currentSearchParams = new URLSearchParams("view=knockout");
    rerender(<WorldCupClient initialState={DEFAULT_WORLD_CUP_STATE} summary={EMPTY_SUMMARY} initialTeamSnapshot={null} />);
    expect(screen.getByText("The bracket builds after the group stage")).toBeInTheDocument();

    currentSearchParams = new URLSearchParams("view=schedule");
    rerender(<WorldCupClient initialState={DEFAULT_WORLD_CUP_STATE} summary={EMPTY_SUMMARY} initialTeamSnapshot={null} />);
    expect(screen.getByText("The full schedule lands here")).toBeInTheDocument();
  });

  it("describes the third-place race before any group match is played", () => {
    const unplayed = {
      ...SUMMARY,
      groups: SUMMARY.groups.map((group) => ({
        ...group,
        standings: group.standings.map((row) => ({ ...row, played: 0 })),
      })),
    };
    renderClient({ summary: unplayed });
    expect(screen.getByText(/This World Cup keeps eight third-placed teams/)).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "Third-place wildcard race" })).toBeNull();
  });

  it("prints the top ten scorers when the snapshot has them", () => {
    const scorers = Array.from({ length: 12 }, (_, index) => ({
      rank: index + 1,
      name: `Scorer ${index + 1}`,
      teamId: "spain",
      teamCode: "ESP",
      goals: 12 - index,
      assists: 1,
      penalties: 0,
    }));
    renderClient({ summary: { ...SUMMARY, scorers } });

    const table = screen.getByRole("table", { name: "Top scorers" });
    expect(within(table).getAllByRole("row")).toHaveLength(11);
    expect(within(table).getByText("Scorer 10")).toBeInTheDocument();
    expect(within(table).queryByText("Scorer 11")).toBeNull();
  });

  it("pins a deep-linked team's standing, form, and results, and clears it", () => {
    currentSearchParams = new URLSearchParams("team=mexico");
    renderClient({ initialTeamSnapshot: MEXICO });

    const card = screen.getByTestId("world-cup-selected-team");
    expect(card).toHaveAttribute("aria-live", "polite");
    expect(within(card).getByRole("heading", { name: "Mexico" })).toBeInTheDocument();
    expect(within(card).getByText("Group A")).toBeInTheDocument();
    expect(within(card).getByText("MEX")).toBeInTheDocument();
    expect(within(card).getByText("Pos").nextElementSibling).toHaveTextContent("1");
    expect(within(card).getByText("GD").nextElementSibling).toHaveTextContent("+6");
    expect(within(card).getByText("W-D-L").nextElementSibling).toHaveTextContent("3-0-0");
    expect(within(card).getByText("Form (last 5)")).toBeInTheDocument();
    expect(within(card).getByText("Recent results")).toBeInTheDocument();
    expect(within(card).queryByText("Upcoming")).toBeNull();
    expect(screen.getByRole("button", { name: "Show Mexico details" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("A bigger, three-country World Cup")).toBeNull();

    fireEvent.click(within(card).getByRole("button", { name: "Clear selected team" }));
    expect(mockPush).toHaveBeenLastCalledWith("/world-cup-2026", { scroll: false });
  });

  it("lists a team's upcoming fixtures, three at most", () => {
    currentSearchParams = new URLSearchParams("team=mexico");
    const upcoming = MEXICO.recentFixtures.map((fixture, index) => ({
      ...fixture,
      id: `upcoming-${index}`,
      status: "SCHEDULED",
    }));
    renderClient({ initialTeamSnapshot: { ...MEXICO, upcomingFixtures: upcoming } });

    const card = screen.getByTestId("world-cup-selected-team");
    const section = within(card).getByText("Upcoming").parentElement as HTMLElement;
    expect(upcoming.length).toBeGreaterThan(3);
    expect(within(section).getAllByText("Mexico")).toHaveLength(3);
  });

  it("says so when a team's snapshot has nothing to show", () => {
    currentSearchParams = new URLSearchParams("team=mexico");
    const bare: WorldCupTeamSnapshot = {
      ...MEXICO,
      standing: null,
      recentFixtures: [],
      upcomingFixtures: [],
      form: { ...MEXICO.form, sequence: [] },
    };
    renderClient({ initialTeamSnapshot: bare });
    expect(screen.getByText("This snapshot has no standings or fixtures for Mexico.")).toBeInTheDocument();
  });

  it("loads a team snapshot that the server did not send", async () => {
    currentSearchParams = new URLSearchParams("team=mexico");
    let resolve: (value: unknown) => void = () => {};
    global.fetch = jest.fn(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    ) as unknown as typeof fetch;

    renderClient();
    expect(screen.getByRole("status")).toHaveTextContent("Loading team snapshot…");
    expect(global.fetch).toHaveBeenCalledWith("/api/world-cup/teams/mexico", expect.anything());

    await act(async () => {
      resolve({ ok: true, json: async () => MEXICO });
    });
    expect(await screen.findByText("Form (last 5)")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows the API error when a team snapshot fails to load", async () => {
    currentSearchParams = new URLSearchParams("team=mexico");
    global.fetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({ error: "Team snapshot unavailable" }),
    })) as unknown as typeof fetch;

    renderClient();
    expect(await screen.findByRole("alert")).toHaveTextContent("Team snapshot unavailable");
  });

  it("canonicalizes an unknown view and team back to the default route", async () => {
    currentSearchParams = new URLSearchParams("view=bad&team=atlantis");
    renderClient();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/world-cup-2026", { scroll: false }));
    expect(screen.getByRole("tab", { name: "Group stage" })).toHaveAttribute("aria-selected", "true");
  });

  it("falls back to the raw dates when the tournament window will not parse", () => {
    renderClient({
      summary: { ...SUMMARY, tournament: { ...SUMMARY.tournament, startDate: "TBD", endDate: "later" } },
    });
    expect(screen.getByText("TBD to later")).toBeInTheDocument();
  });
});
