import { render, screen } from "@testing-library/react";
import { RankDistributionBar } from "./RankDistributionBar";
import type { Player } from "@/types";

function player(overrides: Partial<Player> = {}): Player {
  return {
    id: "player-1",
    name: "Example Player",
    team: "SF",
    position: "WR",
    averageRank: 10,
    rankEcr: 10,
    rankAverage: 13.4,
    minRank: 7,
    maxRank: 20,
    standardDeviation: 3.2,
    ...overrides,
  };
}

describe("RankDistributionBar", () => {
  it("plots the actual expert mean instead of the consensus ECR", () => {
    render(<RankDistributionBar player={player()} scaleMin={1} scaleMax={25} />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Expert rank range 7 to 20, average 13.4"
    );
    expect(screen.getByText("Avg 13.4")).toBeInTheDocument();
  });

  it("does not label ECR as the expert mean when the source omits it", () => {
    render(<RankDistributionBar player={player({ rankAverage: undefined })} />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Expert rank range 7 to 20"
    );
    expect(screen.queryByText(/^Avg /)).not.toBeInTheDocument();
  });
});
