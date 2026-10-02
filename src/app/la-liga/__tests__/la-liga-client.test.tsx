import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import { LaLigaClient } from "../la-liga-client";
import type { LaLigaView } from "@/types/la-liga";
import { getDefaultClub, resolveDefaultState } from "../la-liga-state.core";

const DEFAULT_LA_LIGA_STATE = resolveDefaultState(laLigaSnapshot.clubs);
const getDefaultClubForView = (view: LaLigaView) =>
  getDefaultClub(laLigaSnapshot.clubs, view, DEFAULT_LA_LIGA_STATE.club);

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

describe("LaLigaClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("hydrates from the URL state and keeps focused views shareable", async () => {
    const user = userEvent.setup();
    const defaultRelegationClub = getDefaultClubForView("relegation");
    // Pin a club that is actually visible in the europe view. A hardcoded id
    // ("bet") broke when a snapshot refresh moved that club out of European
    // contention: an explicit ?club= that the view cannot resolve falls back
    // to the default selection and never opens the drawer.
    const europeClubId = getDefaultClubForView("europe");
    currentSearchParams = new URLSearchParams(`view=europe&club=${europeClubId}`);

    render(
      <LaLigaClient
        initialState={DEFAULT_LA_LIGA_STATE}
        summary={{
          season: laLigaSnapshot.season,
          matchday: laLigaSnapshot.matchday,
          generatedAt: laLigaSnapshot.generatedAt,
          updatedAt: laLigaSnapshot.updatedAt,
          sourceLabel: laLigaSnapshot.sourceLabel,
          sourceUrls: laLigaSnapshot.sourceUrls,
          clubs: laLigaSnapshot.clubs,
          scorers: laLigaSnapshot.scorers,
          assists: laLigaSnapshot.assists,
          recentFixtures: laLigaSnapshot.recentFixtures.slice(0, 8),
          upcomingFixtures: laLigaSnapshot.upcomingFixtures.slice(0, 8),
          teams: laLigaSnapshot.teams,
        }}
        initialTeamSnapshot={laLigaSnapshot.teamSnapshots[europeClubId] ?? null}
      />
    );

    // Derive the expected club from the pinned club id rather than a
    // hardcoded name, mirroring the client's selectedClub ?? clubs[0] fallback,
    // so the test survives snapshot refreshes (club renames / relegation).
    const expectedClub =
      laLigaSnapshot.clubs.find((club) => club.id === europeClubId) ??
      laLigaSnapshot.clubs[0];

    // The pinned id is an explicit, resolvable ?club= selection, so it opens
    // the club drawer (the standings-row click target) rather than only
    // updating the inline "Club Detail" tab as before.
    expect(
      screen.getByRole("dialog", { name: `${expectedClub.name} detail` })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /relegation fight/i }));

    expect(mockPush).toHaveBeenCalledWith(
      `/la-liga?view=relegation&club=${defaultRelegationClub}`,
      {
        scroll: false,
      }
    );
  });

  it("opens the club drawer on an explicit selection and closes it on Escape", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams("club=bet");

    render(
      <LaLigaClient
        initialState={DEFAULT_LA_LIGA_STATE}
        summary={{
          season: laLigaSnapshot.season,
          matchday: laLigaSnapshot.matchday,
          generatedAt: laLigaSnapshot.generatedAt,
          updatedAt: laLigaSnapshot.updatedAt,
          sourceLabel: laLigaSnapshot.sourceLabel,
          sourceUrls: laLigaSnapshot.sourceUrls,
          clubs: laLigaSnapshot.clubs,
          scorers: laLigaSnapshot.scorers,
          assists: laLigaSnapshot.assists,
          recentFixtures: laLigaSnapshot.recentFixtures.slice(0, 8),
          upcomingFixtures: laLigaSnapshot.upcomingFixtures.slice(0, 8),
          teams: laLigaSnapshot.teams,
        }}
        initialTeamSnapshot={laLigaSnapshot.teamSnapshots.bet ?? null}
      />
    );

    const expectedClub = laLigaSnapshot.clubs.find((club) => club.id === "bet");
    expect(expectedClub).toBeDefined();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  describe("picking a club", () => {
    const summary = {
      season: laLigaSnapshot.season,
      matchday: laLigaSnapshot.matchday,
      generatedAt: laLigaSnapshot.generatedAt,
      updatedAt: laLigaSnapshot.updatedAt,
      sourceLabel: laLigaSnapshot.sourceLabel,
      sourceUrls: laLigaSnapshot.sourceUrls,
      clubs: laLigaSnapshot.clubs,
      scorers: laLigaSnapshot.scorers,
      assists: laLigaSnapshot.assists,
      recentFixtures: laLigaSnapshot.recentFixtures.slice(0, 8),
      upcomingFixtures: laLigaSnapshot.upcomingFixtures.slice(0, 8),
      teams: laLigaSnapshot.teams,
    };
    const ui = () => (
      <LaLigaClient initialState={DEFAULT_LA_LIGA_STATE} summary={summary} initialTeamSnapshot={null} />
    );
    const byPosition = [...laLigaSnapshot.clubs].sort((a, b) => a.position - b.position);

    // The router is a mock, so a push has to be fed back in as the next
    // search params for the page to see the URL it asked for.
    function followPushes() {
      mockPush.mockImplementation((href: string) => {
        currentSearchParams = new URLSearchParams(href.split("?")[1] ?? "");
      });
    }

    it("opens the drawer on the club that was picked and never on the last one", async () => {
      const user = userEvent.setup();
      // The route stays where it was until the rerender below, the way a
      // real navigation lags the click.
      let pushed = "";
      mockPush.mockImplementation((href: string) => {
        pushed = href;
      });
      const club = byPosition[6]!;
      const view = render(ui());

      await user.click(screen.getByRole("button", { name: `Show ${club.name} details` }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      currentSearchParams = new URLSearchParams(pushed.split("?")[1] ?? "");
      view.rerender(ui());
      expect(screen.getByRole("dialog", { name: `${club.name} detail` })).toBeInTheDocument();
    });

    it("leaves a focused view when the ladder club sits outside it", async () => {
      const user = userEvent.setup();
      followPushes();
      const leader = byPosition[0]!;
      currentSearchParams = new URLSearchParams("view=relegation");
      const view = render(ui());

      const dot = view.container.querySelector(
        `svg[data-variant="wide"] [data-ladder-hit="dot"][data-club-id="${leader.id}"]`
      )!;
      await user.click(dot);
      view.rerender(ui());

      expect(currentSearchParams.get("view")).toBeNull();
      expect(screen.getByRole("dialog", { name: `${leader.name} detail` })).toBeInTheDocument();
    });
  });

  it("canonicalizes hidden club selections for a focused view", async () => {
    const defaultRelegationClub = getDefaultClubForView("relegation");
    const defaultRelegationTeam =
      laLigaSnapshot.teamSnapshots[defaultRelegationClub]?.team?.name;
    expect(defaultRelegationTeam).toBeDefined();
    currentSearchParams = new URLSearchParams("view=relegation&club=barcelona");

    render(
      <LaLigaClient
        initialState={DEFAULT_LA_LIGA_STATE}
        summary={{
          season: laLigaSnapshot.season,
          matchday: laLigaSnapshot.matchday,
          generatedAt: laLigaSnapshot.generatedAt,
          updatedAt: laLigaSnapshot.updatedAt,
          sourceLabel: laLigaSnapshot.sourceLabel,
          sourceUrls: laLigaSnapshot.sourceUrls,
          clubs: laLigaSnapshot.clubs,
          scorers: laLigaSnapshot.scorers,
          assists: laLigaSnapshot.assists,
          recentFixtures: laLigaSnapshot.recentFixtures.slice(0, 8),
          upcomingFixtures: laLigaSnapshot.upcomingFixtures.slice(0, 8),
          teams: laLigaSnapshot.teams,
        }}
        initialTeamSnapshot={laLigaSnapshot.teamSnapshots[defaultRelegationClub] ?? null}
      />
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        `/la-liga?view=relegation&club=${defaultRelegationClub}`,
        {
          scroll: false,
        }
      )
    );

    expect(
      screen.getByRole("heading", { name: defaultRelegationTeam as string })
    ).toBeInTheDocument();
  });

  it("links to the LALIGA stats page and credits football-data.org for the data", () => {
    currentSearchParams = new URLSearchParams("detail=scorers");

    render(
      <LaLigaClient
        initialState={DEFAULT_LA_LIGA_STATE}
        summary={{
          season: laLigaSnapshot.season,
          matchday: laLigaSnapshot.matchday,
          generatedAt: laLigaSnapshot.generatedAt,
          updatedAt: laLigaSnapshot.updatedAt,
          sourceLabel: laLigaSnapshot.sourceLabel,
          sourceUrls: laLigaSnapshot.sourceUrls,
          clubs: laLigaSnapshot.clubs,
          scorers: laLigaSnapshot.scorers,
          assists: laLigaSnapshot.assists,
          recentFixtures: laLigaSnapshot.recentFixtures.slice(0, 8),
          upcomingFixtures: laLigaSnapshot.upcomingFixtures.slice(0, 8),
          teams: laLigaSnapshot.teams,
        }}
        initialTeamSnapshot={null}
      />
    );

    expect(screen.getByRole("link", { name: /official/i })).toHaveAttribute(
      "href",
      "https://www.laliga.com/en-GB/stats/laliga-easports/scorers"
    );
    expect(screen.getByText(/checked-in football-data\.org snapshot/)).toBeInTheDocument();
    expect(screen.queryByText(/official LALIGA table/)).not.toBeInTheDocument();
  });
});
