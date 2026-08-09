import { render, screen, within } from "@testing-library/react";

import { sortBestBallRankings } from "@/lib/bestBall/rankings";
import type { Player } from "@/types";

import { BestBallDraftBoard } from "./best-ball-draft-board";

describe("BestBallDraftBoard", () => {
  it("labels the contest-floor placeholder as undrafted and explains the ECR fallback", () => {
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
    const ranked = sortBestBallRankings([player], "bbm-vii");

    render(
      <BestBallDraftBoard
        players={ranked}
        currentPick={1}
        currentTeamNumber={1}
        isComplete={false}
        adpAvailable
        onDraftPlayer={jest.fn()}
      />
    );

    const row = screen.getByRole("button", { name: "Log Jaylin Noel at pick 1" });
    expect(within(row).getByText("Undrafted")).toBeInTheDocument();
    expect(within(row).getByText(/ADP Undrafted/)).toBeInTheDocument();
    expect(within(row).queryByText("215.2")).not.toBeInTheDocument();
    expect(within(row).getByText(/sits at the undrafted floor/i)).toBeInTheDocument();
  });
});
