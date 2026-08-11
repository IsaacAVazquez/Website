import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BestBallDraftTrackerClient } from "../draft-tracker-client";
import type { Player } from "@/types";

const mockReplace = jest.fn();
let mockSourceDate = new Date().toISOString();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/fantasy-football/best-ball/draft-tracker",
}));

const mockPlayers: Player[] = [
  ["wr-1", "Ja'Marr Chase", "CIN", "WR", 1, 1.2, 10],
  ["rb-1", "Bijan Robinson", "ATL", "RB", 2, 2.1, 5],
  ["wr-2", "Puka Nacua", "LAR", "WR", 3, 3.2, 8],
  ["qb-1", "Josh Allen", "BUF", "QB", 12, 14.1, 7],
  ["te-1", "Brock Bowers", "LV", "TE", 15, 16.4, 8],
  ["wr-3", "Amon-Ra St. Brown", "DET", "WR", 4, 4.5, 8],
].map(([id, name, team, position, rank, adp, bye]) => ({
  id: String(id),
  name: String(name),
  team: String(team),
  position: position as Player["position"],
  averageRank: Number(rank),
  rankEcr: Number(rank),
  standardDeviation: 1,
  adp: Number(adp),
  byeWeek: Number(bye),
  superflexRank: position === "QB" ? 1 : Number(rank) + 6,
}));

jest.mock("@/hooks/useBestBallSnapshot", () => ({
  useBestBallSnapshot: () => ({
    snapshot: {
      schemaVersion: 2,
      season: 2026,
      generatedAt: mockSourceDate,
      players: mockPlayers,
      rankingSource: {
        provider: "FantasyPros",
        url: "https://example.com/rankings",
        asOf: mockSourceDate,
      },
      adpSource: {
        provider: "Underdog ADP",
        url: "https://example.com/adp",
        asOf: mockSourceDate,
      },
      superflexSource: {
        provider: "FantasyPros",
        url: "https://example.com/superflex",
        asOf: mockSourceDate,
      },
      scheduleSource: {
        provider: "ESPN",
        url: "https://example.com/schedule",
        asOf: mockSourceDate,
      },
      week17Opponents: { CIN: "BAL", BAL: "CIN", LAR: "TB", TB: "LAR" },
    },
    isLoading: false,
    error: null,
    retry: jest.fn(),
  }),
}));

describe("BestBallDraftTrackerClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockReplace.mockClear();
    mockSourceDate = new Date().toISOString();
  });

  it("opens a room, logs the snake pick, and undoes it", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

    expect(await screen.findByRole("heading", { name: "Choose your draft slot" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Open draft room from slot 1" }));

    expect(
      screen.getByRole("heading", { name: "You are on the clock at pick 1" })
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Best fits for your next pick" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Log for my team" }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Log Ja'Marr Chase at pick 1" }));

    expect(screen.getByRole("heading", { name: "Slot 2 is on the clock" })).toBeVisible();
    await waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem("fantasy-best-ball-draft-v1-2026-bbm-vii") ?? "{}"
        ).picks
      ).toHaveLength(1)
    );
    fireEvent.click(screen.getByRole("button", { name: "Undo last pick" }));
    expect(
      screen.getByRole("heading", { name: "You are on the clock at pick 1" })
    ).toBeVisible();
  });

  it("keeps Weekly Winners board and roster guidance without exact player cards", async () => {
    render(<BestBallDraftTrackerClient initialContest="weekly-winners" />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );

    expect(screen.getByRole("heading", { name: "Board and roster guidance" })).toBeVisible();
    expect(screen.getByText("Reference guidance only")).toBeVisible();
    expect(screen.getByText(/Weekly Winners player pools and slates vary/)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Log the player selected" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Roster targets that update" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Log for my team" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Weekly projection spread 0/)).not.toBeInTheDocument();
  });

  it("does not present standard-lineup ADP as a Superflex room price", async () => {
    render(<BestBallDraftTrackerClient initialContest="superflex" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );

    expect(screen.getAllByText("Source rank").length).toBeGreaterThan(0);
    expect(screen.queryByText(/ADP 1\.2/)).not.toBeInTheDocument();
    expect(screen.getByText("Reference guidance only")).toBeVisible();
    expect(screen.getByText(/no matching Superflex room ADP/i)).toBeVisible();
  });

  it("states a stale exact source separately from catalog reference reasons", async () => {
    mockSourceDate = "2020-01-01T00:00:00.000Z";
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/ranking source is stale/i);
    expect(screen.queryByText("Reference guidance only")).not.toBeInTheDocument();
  });

  it("opens the mobile build dialog and returns focus when it closes", async () => {
    render(<BestBallDraftTrackerClient initialContest="eliminator" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );

    const trigger = screen.getByRole("button", { name: /My build/ });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "0 of 18 players" })).toBeVisible();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("requires confirmation before resetting from the mobile build sheet", async () => {
    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open draft room from slot 1" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Log Ja'Marr Chase at pick 1" }));
    fireEvent.click(screen.getByRole("button", { name: /My build/ }));

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Reset this room" }));
    expect(within(dialog).getByRole("button", { name: "Confirm reset" })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Keep room" })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm reset" }));

    expect(await screen.findByRole("heading", { name: "Choose your draft slot" })).toBeVisible();
  });

  it("keeps a legacy overloaded-format room as a local backup", async () => {
    const key = "fantasy-best-ball-draft-v1-2026-bbm-vii";
    const raw = JSON.stringify({
      schemaVersion: 1,
      season: 2026,
      contestId: "bbm-vii",
      userSlot: 1,
      rules: {
        contestId: "bbm-vii",
        rulesSchemaVersion: 1,
        format: "tournament",
        scoring: "HALF_PPR",
        teams: 12,
        rounds: 18,
        rosterSize: 18,
        lineup: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 },
      },
      picks: [],
      startedAt: null,
      updatedAt: "2026-08-02T12:00:00.000Z",
    });
    window.localStorage.setItem(key, raw);

    render(<BestBallDraftTrackerClient initialContest="bbm-vii" />);

    expect(await screen.findByText(/kept the prior save as a local backup/i)).toBeVisible();
    expect(window.localStorage.getItem(`${key}-previous`)).toBe(raw);
  });
});
