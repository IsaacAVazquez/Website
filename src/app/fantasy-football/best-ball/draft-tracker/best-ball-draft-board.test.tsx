import { fireEvent, render, screen, within } from "@testing-library/react";

import { sortBestBallRankings } from "@/lib/bestBall/rankings";
import type { Player } from "@/types";

import { BestBallDraftBoard } from "./best-ball-draft-board";

const player: Player = {
  id: "wr-floor",
  name: "Jaylin Noel",
  team: "HOU",
  position: "WR",
  averageRank: 193,
  rankEcr: 193,
  standardDeviation: 12.07,
  adp: 215.2,
  byeWeek: 8,
};

/**
 * The 2026-09-06 provider shape: rank_ave, rank_min, and rank_max sit at the
 * top of the board while rank_ecr lands 50-odd places lower on every other
 * player, which is more than the consistency test allows.
 */
function brokenBoard(): Player[] {
  return Array.from({ length: 16 }, (_, index) => {
    const rank = index + 1;
    const divergent = index % 2 === 0;
    return {
      id: `p-${rank}`,
      name: `Player ${rank}`,
      team: "KC",
      position: (["RB", "WR"] as const)[index % 2],
      averageRank: divergent ? rank + 53 : rank,
      rankEcr: divergent ? rank + 53 : rank,
      rankAverage: rank + 0.3,
      minRank: rank,
      maxRank: rank + 1,
      standardDeviation: 0.5,
      tier: divergent ? 7 : 1,
      positionRank: rank,
      adp: rank + 0.1,
      byeWeek: 8,
    };
  });
}

function renderBoard(
  overrides: {
    onDraftPlayer?: jest.Mock;
    onOpenDetail?: jest.Mock;
    players?: Player[];
    currentPick?: number;
    nextUserPick?: number | null;
  } = {}
) {
  return render(
    <BestBallDraftBoard
      players={sortBestBallRankings(overrides.players ?? [player], "bbm-vii")}
      currentPick={overrides.currentPick ?? 1}
      nextUserPick={overrides.nextUserPick}
      isComplete={false}
      adpAvailable
      onDraftPlayer={overrides.onDraftPlayer ?? jest.fn()}
      onOpenDetail={overrides.onOpenDetail ?? jest.fn()}
    />
  );
}

describe("BestBallDraftBoard", () => {
  it("labels the contest-floor placeholder as undrafted and explains the ECR fallback", () => {
    renderBoard();

    // The row is a list item; its name button and Draft button carry the
    // interactions, so find the row from the name button.
    const row = screen
      .getByRole("button", { name: "Open Jaylin Noel detail" })
      .closest("li") as HTMLElement;
    expect(
      within(row).getByRole("button", { name: "Draft Jaylin Noel at pick 1" })
    ).toBeInTheDocument();
    expect(within(row).getByText("Undrafted")).toBeInTheDocument();
    expect(within(row).getByText(/ADP Undrafted/)).toBeInTheDocument();
    expect(within(row).queryByText("215.2")).not.toBeInTheDocument();
    expect(within(row).getByText(/sits at the undrafted floor/i)).toBeInTheDocument();
  });

  it("keeps the order sentence in the market cell's title where the column already says it", () => {
    renderBoard({ players: brokenBoard().slice(1, 2) });

    const row = screen
      .getByRole("button", { name: "Open Player 2 detail" })
      .closest("li") as HTMLElement;
    // The ADP prints once, in its cell, and the sentence that restates it is not row text.
    expect(within(row).getByText("2.1")).toHaveAttribute(
      "title",
      "The current standard Underdog ADP is 2.1. The PPR best ball ECR is 2."
    );
    expect(within(row).queryByText(/The current standard Underdog ADP/)).not.toBeInTheDocument();
    expect(within(row).getByText("ADP 2.1")).toBeInTheDocument();
  });

  it("prints the position rank on the chip and leaves it off a withheld row", () => {
    renderBoard({ players: brokenBoard() });

    const consistent = screen
      .getByRole("button", { name: "Open Player 2 detail" })
      .closest("li") as HTMLElement;
    expect(within(consistent).getByText("WR2")).toBeInTheDocument();
    const withheld = screen
      .getByRole("button", { name: "Open Player 1 detail" })
      .closest("li") as HTMLElement;
    expect(within(withheld).getByText("RB")).toBeInTheDocument();
    expect(within(withheld).queryByText("RB1")).not.toBeInTheDocument();
  });

  it("marks where the board stands when the user's turn comes back, on the whole board only", () => {
    renderBoard({ players: brokenBoard(), currentPick: 2, nextUserPick: 5 });

    // Three picks come first (2, 3, and 4), so the line sits above the fourth row.
    const line = screen.getByText("Your turn #5").closest("li") as HTMLElement;
    expect(line).toHaveTextContent("Your turn #5 if picks follow this board");
    const items = Array.from(line.parentElement?.children ?? []);
    expect(items.indexOf(line)).toBe(3);
    expect(within(items[4] as HTMLElement).getByTestId("best-ball-board-draft")).toBeInTheDocument();

    // A filtered board is not the order the room drafts in.
    fireEvent.click(screen.getByRole("radio", { name: "WR" }));
    expect(screen.queryByText("Your turn #5")).not.toBeInTheDocument();
  });

  it("draws no turn line while the user is on the clock", () => {
    renderBoard({ players: brokenBoard(), currentPick: 5, nextUserPick: 5 });
    expect(screen.queryByText(/^Your turn #/)).not.toBeInTheDocument();
  });

  it("counts what is available and what a filter leaves", () => {
    renderBoard({ players: brokenBoard() });

    expect(screen.getByText("16 of 16 available")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "WR" }));
    expect(screen.getByText("8 of 16 available")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "WR" })).toBeChecked();
  });

  it("moves focus to the search when Clear search removes itself", () => {
    renderBoard({ players: brokenBoard() });

    fireEvent.click(screen.getByRole("radio", { name: "QB" }));
    expect(screen.getByText("No available player matches this search.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
    expect(screen.getByText("16 of 16 available")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search available players" })).toHaveFocus();
  });

  it("moves focus to the first added row when Show 100 more removes itself", () => {
    const players = Array.from({ length: 130 }, (_, index) => ({
      ...player,
      id: `deep-${index + 1}`,
      name: `Deep ${index + 1}`,
      averageRank: index + 1,
      rankEcr: index + 1,
      adp: index + 1.5,
    }));
    renderBoard({ players });

    expect(screen.getAllByTestId("best-ball-board-draft")).toHaveLength(120);
    fireEvent.click(screen.getByRole("button", { name: "Show 100 more players" }));

    expect(screen.getAllByTestId("best-ball-board-draft")).toHaveLength(130);
    expect(screen.queryByRole("button", { name: "Show 100 more players" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Deep 121 detail" })).toHaveFocus();
  });

  it("prints no consensus rank on a row the ranking layer has withheld", () => {
    renderBoard({ players: brokenBoard() });

    const withheld = screen
      .getByRole("button", { name: "Open Player 1 detail" })
      .closest("li") as HTMLElement;
    const provenance = withheld.querySelector("[data-consensus-withheld='true']");
    expect(provenance).not.toBeNull();
    expect(provenance?.getAttribute("title")).toMatch(/the ECR is withheld/);
    expect(provenance?.getAttribute("title")).not.toMatch(/ECR is 54/);
    expect(withheld.textContent).not.toMatch(/ECR is 54/);

    const consistent = screen
      .getByRole("button", { name: "Open Player 2 detail" })
      .closest("li") as HTMLElement;
    expect(consistent.querySelector("[data-consensus-withheld]")).toBeNull();
    expect(consistent.querySelector("span[title]")?.getAttribute("title")).toMatch(
      /The PPR best ball ECR is 2\./
    );
  });

  it("moves focus to the row that takes a drafted row's place", () => {
    const players = brokenBoard().slice(0, 3);
    const view = renderBoard({ players });

    const first = screen.getByRole("button", { name: "Draft Player 1 at pick 1" });
    first.focus();
    fireEvent.click(first);
    view.rerender(
      <BestBallDraftBoard
        players={sortBestBallRankings(players.slice(1), "bbm-vii")}
        currentPick={2}
        isComplete={false}
        adpAvailable
        onDraftPlayer={jest.fn()}
        onOpenDetail={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Draft Player 2 at pick 2" })).toHaveFocus();
  });

  it("expands the phone search in place and returns focus when it closes empty", () => {
    renderBoard();

    const toggle = screen.getByRole("button", { name: "Search available players" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);

    const input = screen.getByRole("textbox", { name: "Search available players" });
    expect(input).toHaveFocus();
    expect(screen.getByRole("button", { name: "Close search" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Search available players" })).toHaveFocus();
  });

  it("opens the detail from the name and logs only from the Draft button", () => {
    const onDraftPlayer = jest.fn();
    const onOpenDetail = jest.fn();
    renderBoard({ onDraftPlayer, onOpenDetail });

    fireEvent.click(screen.getByRole("button", { name: "Open Jaylin Noel detail" }));
    expect(onOpenDetail).toHaveBeenCalledWith(expect.objectContaining({ id: "wr-floor" }));
    expect(onDraftPlayer).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Draft Jaylin Noel at pick 1" }));
    expect(onDraftPlayer).toHaveBeenCalledWith(expect.objectContaining({ id: "wr-floor" }));
  });
});
