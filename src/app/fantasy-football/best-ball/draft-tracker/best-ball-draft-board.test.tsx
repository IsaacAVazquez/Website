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
  } = {}
) {
  return render(
    <BestBallDraftBoard
      players={sortBestBallRankings(overrides.players ?? [player], "bbm-vii")}
      currentPick={overrides.currentPick ?? 1}
      currentTeamNumber={1}
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

    // The row is a plain container now; its name button and Draft button carry
    // the interactions, so find the row from the name button.
    const row = screen
      .getByRole("button", { name: "Open Jaylin Noel detail" })
      .closest("div") as HTMLElement;
    expect(
      within(row).getByRole("button", { name: "Draft Jaylin Noel at pick 1" })
    ).toBeInTheDocument();
    expect(within(row).getByText("Undrafted")).toBeInTheDocument();
    expect(within(row).getByText(/ADP Undrafted/)).toBeInTheDocument();
    expect(within(row).queryByText("215.2")).not.toBeInTheDocument();
    expect(within(row).getByText(/sits at the undrafted floor/i)).toBeInTheDocument();
  });

  it("prints no consensus rank on a row the ranking layer has withheld", () => {
    renderBoard({ players: brokenBoard() });

    const withheld = screen
      .getByRole("button", { name: "Open Player 1 detail" })
      .closest("div") as HTMLElement;
    const provenance = withheld.querySelector("[data-consensus-withheld='true']");
    expect(provenance).not.toBeNull();
    expect(provenance?.getAttribute("title")).toMatch(/the ECR is withheld/);
    expect(provenance?.getAttribute("title")).not.toMatch(/ECR is 54/);
    expect(withheld.textContent).not.toMatch(/ECR is 54/);

    const consistent = screen
      .getByRole("button", { name: "Open Player 2 detail" })
      .closest("div") as HTMLElement;
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
        currentTeamNumber={2}
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
