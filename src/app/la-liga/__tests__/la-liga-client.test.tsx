import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import { LaLigaClient } from "../la-liga-client";
import { DEFAULT_LA_LIGA_STATE } from "../la-liga-state";

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

    expect(screen.getByRole("heading", { name: "Real Betis Balompié" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /relegation fight/i }));

    expect(mockPush).toHaveBeenCalledWith("/la-liga?view=relegation&club=sev", {
      scroll: false,
    });
  });

  it("canonicalizes hidden club selections for a focused view", async () => {
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
        initialTeamSnapshot={laLigaSnapshot.teamSnapshots.sev ?? null}
      />
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/la-liga?view=relegation&club=sev", {
        scroll: false,
      })
    );

    expect(screen.getByRole("heading", { name: "Sevilla FC" })).toBeInTheDocument();
  });
});
