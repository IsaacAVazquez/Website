import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { premierLeagueSnapshot } from "@/data/premierLeagueSnapshot";
import { PremierLeagueClient } from "../premier-league-client";
import { DEFAULT_PREMIER_LEAGUE_STATE } from "../premier-league-state";

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

describe("PremierLeagueClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("renders the leader sidebar without rewriting the default route", async () => {
    render(
      <PremierLeagueClient
        initialState={DEFAULT_PREMIER_LEAGUE_STATE}
        summary={premierLeagueSnapshot.summary}
        initialTeamSnapshot={premierLeagueSnapshot.teamSnapshots["57"] ?? null}
      />
    );

    // Assert against the actual league leader rather than a hardcoded club so
    // the test survives standings refreshes — the leader sidebar renders
    // summary.standings[0].team.name in the default state.
    expect(
      screen.getByRole("heading", {
        name: premierLeagueSnapshot.summary.standings[0].team.name,
      })
    ).toBeInTheDocument();
    await waitFor(() => expect(mockReplace).not.toHaveBeenCalled());
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
    currentSearchParams = new URLSearchParams("team=57");

    render(
      <PremierLeagueClient
        initialState={DEFAULT_PREMIER_LEAGUE_STATE}
        summary={premierLeagueSnapshot.summary}
        initialTeamSnapshot={premierLeagueSnapshot.teamSnapshots["57"] ?? null}
      />
    );

    await user.click(screen.getByRole("button", { name: /title chase/i }));

    const [href, options] = mockPush.mock.calls.at(-1) ?? [];
    expect(options).toEqual({ scroll: false });
    expect(href).toMatch(/^\/premier-league\?/);

    const nextParams = new URLSearchParams(href.split("?")[1] ?? "");
    expect(nextParams.get("view")).toBe("title-race");
    expect(nextParams.get("team")).toBe("57");
  });
});
