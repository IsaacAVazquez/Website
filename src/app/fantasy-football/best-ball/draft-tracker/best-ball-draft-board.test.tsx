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

function renderBoard(overrides: { onDraftPlayer?: jest.Mock; onOpenDetail?: jest.Mock } = {}) {
  render(
    <BestBallDraftBoard
      players={sortBestBallRankings([player], "bbm-vii")}
      currentPick={1}
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
