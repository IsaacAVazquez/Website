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

  it("renders the default table view without opening the club drawer or rewriting the route", async () => {
    render(
      <PremierLeagueClient
        initialState={DEFAULT_PREMIER_LEAGUE_STATE}
        summary={premierLeagueSnapshot.summary}
        initialTeamSnapshot={premierLeagueSnapshot.teamSnapshots["57"] ?? null}
      />
    );

    // The club drawer only opens for an explicit ?team= selection — a bare
    // visit renders the standings and Club Detail tab inline, no overlay.
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

    const [href] = mockPush.mock.calls.at(-1) ?? [];
    expect(href).toBe("/premier-league");
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
