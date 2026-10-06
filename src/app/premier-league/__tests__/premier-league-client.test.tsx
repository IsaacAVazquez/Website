import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { premierLeagueSnapshot } from "@/data/premierLeagueSnapshot";
import { PremierLeagueClient } from "../premier-league-client";
import { DEFAULT_PREMIER_LEAGUE_STATE, filterStandingsForView } from "../premier-league-state";

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

// In the app the drawer loads the first time a club is opened. Here it is the
// real drawer, mounted directly, so these tests stay about the page and stay
// synchronous.
jest.mock("@/components/football/DeferredClubDrawer", () => ({
  DeferredClubDrawer: jest.requireActual("@/components/football/ClubDrawer").ClubDrawer,
}));

describe("PremierLeagueClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("renders the default table view without opening the club drawer or rewriting the route", async () => {
    render(
      <PremierLeagueClient
        initialState={DEFAULT_PREMIER_LEAGUE_STATE}
        summary={premierLeagueSnapshot.summary}
        initialTeamSnapshot={
          // A plain visit shows the leader, so that is the snapshot the page sends.
          premierLeagueSnapshot.teamSnapshots[premierLeagueSnapshot.summary.standings[0]!.team.id] ?? null
        }
      />
    );

    // The club drawer only opens for an explicit ?team= selection — a bare
    // visit renders the standings and Club detail tab inline, no overlay.
    expect(screen.getByRole("heading", { name: "Standings" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(mockReplace).not.toHaveBeenCalled());
  });

  it("opens the club drawer for a deep-linked club and closes it on Escape", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams("team=57");

    render(
      <PremierLeagueClient
        initialState={DEFAULT_PREMIER_LEAGUE_STATE}
        summary={premierLeagueSnapshot.summary}
        initialTeamSnapshot={premierLeagueSnapshot.teamSnapshots["57"] ?? null}
      />
    );

    const club = premierLeagueSnapshot.summary.standings.find((row) => row.team.id === "57");
    expect(club).toBeDefined();
    expect(
      screen.getByRole("dialog", { name: `${club!.team.name} detail` })
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    // Closing hides the overlay and leaves the selection in the URL, so the
    // ladder, the table, and Club detail stay on the club that was open.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  describe("from a plain visit", () => {
    // The router is a mock, so a push has to be fed back in as the next
    // search params for the page to see the URL it asked for.
    function renderFollowingPushes() {
      mockPush.mockImplementation((href: string) => {
        currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
      });
      const ui = () => (
        <PremierLeagueClient
          initialState={DEFAULT_PREMIER_LEAGUE_STATE}
          summary={premierLeagueSnapshot.summary}
          initialTeamSnapshot={null}
        />
      );
      const view = render(ui());
      return { settle: () => view.rerender(ui()) };
    }

    it.each(["Fixtures", "Top scorers"])("switching to the %s tab opens no drawer", async (name) => {
      const user = userEvent.setup();
      const { settle } = renderFollowingPushes();

      await user.click(screen.getByRole("tab", { name }));
      settle();

      expect(mockPush).toHaveBeenCalled();
      expect(screen.getByRole("tab", { name })).toHaveAttribute("aria-selected", "true");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it.each([/title chase/i, /relegation fight/i])("the %s filter opens no drawer", async (name) => {
      const user = userEvent.setup();
      const { settle } = renderFollowingPushes();

      await user.click(screen.getByRole("button", { name }));
      settle();

      expect(mockPush).toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("picking a club in the table opens that club's drawer", async () => {
      const user = userEvent.setup();
      const { settle } = renderFollowingPushes();
      const club = premierLeagueSnapshot.summary.standings[6]!;

      await user.click(screen.getByRole("button", { name: `Show ${club.team.name} details` }));
      settle();

      expect(screen.getByRole("dialog", { name: `${club.team.name} detail` })).toBeInTheDocument();
    });

    it("opens a club from the lookup under the readouts", async () => {
      const user = userEvent.setup();
      const { settle } = renderFollowingPushes();
      const club = premierLeagueSnapshot.summary.standings[9]!;

      await user.selectOptions(screen.getByRole("combobox", { name: "Find a club" }), club.team.id);
      // Choosing alone opens nothing, so a keyboard can walk the list.
      expect(mockPush).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Open club" }));
      settle();

      expect(screen.getByRole("dialog", { name: `${club.team.name} detail` })).toBeInTheDocument();
    });

    it("gives focus back to the ladder marker that opened the drawer", async () => {
      const user = userEvent.setup();
      const { settle } = renderFollowingPushes();
      const club = premierLeagueSnapshot.summary.standings[3]!;
      // The ladder draws a wide and a narrow chart, and CSS shows one of them.
      const marker = screen.getAllByRole("button", {
        name: `Show ${club.team.tla || club.team.shortName} details`,
      })[0]!;

      // The marker is an SVG group, which is the opener the modal hook used to drop.
      expect(marker).toBeInstanceOf(SVGElement);
      marker.focus();
      await user.keyboard("{Enter}");
      settle();
      expect(screen.getByRole("dialog", { name: `${club.team.name} detail` })).toBeInTheDocument();

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(marker).toHaveFocus();
    });
  });

  it("canonicalizes invalid query params back to the default route", async () => {
    currentSearchParams = new URLSearchParams("view=bad&team=invalid");

    render(
      <PremierLeagueClient
        initialState={DEFAULT_PREMIER_LEAGUE_STATE}
        summary={premierLeagueSnapshot.summary}
        initialTeamSnapshot={premierLeagueSnapshot.teamSnapshots["57"] ?? null}
      />
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/premier-league", { scroll: false })
    );
  });

  it("keeps a valid selected club when changing filters", async () => {
    const user = userEvent.setup();
    // The club has to sit inside the title-race view of whatever standings the
    // committed snapshot carries, or the client rightly swaps it for the view's
    // leader; a hardcoded id went stale the day the table moved.
    const titleRaceTeamId = String(
      filterStandingsForView(premierLeagueSnapshot.summary.standings, "title-race")[0]!.team.id
    );
    currentSearchParams = new URLSearchParams(`team=${titleRaceTeamId}`);

    render(
      <PremierLeagueClient
        initialState={DEFAULT_PREMIER_LEAGUE_STATE}
        summary={premierLeagueSnapshot.summary}
        initialTeamSnapshot={premierLeagueSnapshot.teamSnapshots[titleRaceTeamId] ?? null}
      />
    );

    await user.click(screen.getByRole("button", { name: /title chase/i }));

    const [href, options] = mockPush.mock.calls.at(-1) ?? [];
    expect(options).toEqual({ scroll: false });
    expect(href).toMatch(/^\/premier-league\?/);

    const nextParams = new URLSearchParams(href.split("?")[1] ?? "");
    expect(nextParams.get("view")).toBe("title-race");
    expect(nextParams.get("team")).toBe(titleRaceTeamId);
  });

  it("links to the Premier League stats page and credits football-data.org for the data", () => {
    currentSearchParams = new URLSearchParams("detail=scorers");

    render(
      <PremierLeagueClient
        initialState={DEFAULT_PREMIER_LEAGUE_STATE}
        summary={premierLeagueSnapshot.summary}
        initialTeamSnapshot={null}
      />
    );

    expect(screen.getByRole("link", { name: /official/i })).toHaveAttribute(
      "href",
      "https://www.premierleague.com/en/stats/top/players/goals"
    );
    expect(screen.getByText(/checked-in football-data\.org snapshot/)).toBeInTheDocument();
  });
});
