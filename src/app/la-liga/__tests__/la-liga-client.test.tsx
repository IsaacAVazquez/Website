import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import { LaLigaClient } from "../la-liga-client";
import { DEFAULT_LA_LIGA_STATE, getDefaultClubForView } from "../la-liga-state";

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

describe("LaLigaClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("hydrates from the URL state and keeps focused views shareable", async () => {
    const user = userEvent.setup();
    const defaultRelegationClub = getDefaultClubForView("relegation");
    currentSearchParams = new URLSearchParams("view=europe&club=bet");

    render(
      <LaLigaClient
        initialState={DEFAULT_LA_LIGA_STATE}
        summary={{
          season: laLigaSnapshot.season,
          matchday: laLigaSnapshot.matchday,
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

    // Derive the expected club from the pinned club id ("bet") rather than a
    // hardcoded name, mirroring the client's selectedClub ?? clubs[0] fallback,
    // so the test survives snapshot refreshes (club renames / relegation).
    const expectedClub =
      laLigaSnapshot.clubs.find((club) => club.id === "bet") ??
      laLigaSnapshot.clubs[0];

    // "bet" is an explicit, resolvable ?club= selection, so it opens the club
    // drawer (the standings-row click target) rather than only updating the
    // inline "Club Detail" tab as before.
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
});
