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

/** The plot's marks, as the percentages it was given. */
function marks() {
  const plot = screen.getByRole("img");
  const read = (name: string) => plot.style.getPropertyValue(name);
  return {
    min: read("--ffb-min"),
    max: read("--ffb-max"),
    avg: read("--ffb-avg"),
    sdLo: read("--ffb-sd-lo"),
    sdHi: read("--ffb-sd-hi"),
  };
}

/** Each tick as its label and where its guide sits, read from the label row and the guides. */
function ticks(container: HTMLElement) {
  const labels = Array.from(container.querySelectorAll<HTMLElement>(".ffb-ov-axis-labels > span"));
  const guides = Array.from(container.querySelectorAll<HTMLElement>(".ffb-ov-axis-guide"));
  expect(guides.map((guide) => guide.style.getPropertyValue("--ffb-ov-at"))).toEqual(
    labels.map((label) => label.style.getPropertyValue("--ffb-ov-at"))
  );
  return labels.map((label) => `${label.textContent} ${label.style.getPropertyValue("--ffb-ov-at")}`);
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

  it("keeps the compare modal's shared scale as a straight line from its first rank to its last", () => {
    const { container } = render(<RankDistributionBar player={player()} scaleMin={1} scaleMax={25} compact />);

    // (7 - 1) / 24, (20 - 1) / 24, and (13.4 - 1) / 24.
    expect(marks()).toMatchObject({ min: "25.00%", max: "79.17%", avg: "51.67%" });
    expect(container.querySelector(".ffb-ov-axis-guide")).toBeNull();
    expect(container.querySelector(".ffb-ov-axis-labels")).toBeNull();
    expect(screen.queryByText("Best 7")).not.toBeInTheDocument();
  });

  it("fits a tight player on three rounds, so the line is about a fifth of the plot", () => {
    const { container } = render(
      <RankDistributionBar
        player={player({ minRank: 1, maxRank: 7, rankAverage: 2.4, standardDeviation: 1.4 })}
      />
    );

    // Ranks 1 to 36. A rank is a slot one wide, so 1 to 7 runs from 0 to 7/36.
    expect(ticks(container)).toEqual(["R1 0.00%", "R2 33.33%", "R3 66.67%"]);
    expect(marks()).toEqual({
      min: "0.00%",
      max: "19.44%",
      avg: "5.28%", // (2.4 - 1 + 0.5) / 36
      sdLo: "1.39%", // (2.4 - 1.4 - 1 + 0.5) / 36
      sdHi: "9.17%", // (2.4 + 1.4 - 1 + 0.5) / 36
    });
    expect(screen.getByText("Best 1")).toBeInTheDocument();
    expect(screen.getByText("Worst 7")).toBeInTheDocument();
  });

  it("fits a volatile player with a round of room each side, so the line is most of the plot", () => {
    const { container } = render(
      <RankDistributionBar
        player={player({ minRank: 19, maxRank: 80, rankAverage: 40.7, standardDeviation: 12 })}
      />
    );

    // Rounds 2 to 7 hold 19 to 80, and a round each side makes R1 to R8, ranks 1 to 96.
    expect(ticks(container)).toEqual([
      "R1 0.00%",
      "R2 12.50%",
      "R3 25.00%",
      "R4 37.50%",
      "R5 50.00%",
      "R6 62.50%",
      "R7 75.00%",
      "R8 87.50%",
    ]);
    expect(marks()).toMatchObject({ min: "18.75%", max: "83.33%", avg: "41.88%" });
  });

  it("starts a late player's scale a round before the best rank, not at the first pick", () => {
    const { container } = render(
      <RankDistributionBar player={player({ minRank: 130, maxRank: 140, rankAverage: 135 })} />
    );

    // 130 to 140 sit in rounds 11 and 12, so the scale is R10 to R13, ranks 109 to 156.
    expect(ticks(container)).toEqual(["R10 0.00%", "R11 25.00%", "R12 50.00%", "R13 75.00%"]);
    expect(marks()).toMatchObject({ min: "43.75%", max: "66.67%" });
  });

  it("takes the shared fit's doubled ticks once the scale passes sixteen rounds", () => {
    const { container } = render(
      <RankDistributionBar player={player({ minRank: 10, maxRank: 230, rankAverage: 120 })} />
    );

    // Rounds 1 to 20 hold 10 to 230 and a round after makes 21. The ticks double, which rounds the window up to 22 rounds, ranks 1 to 264.
    expect(ticks(container).map((tick) => tick.split(" ")[0])).toEqual([
      "R1", "R3", "R5", "R7", "R9", "R11", "R13", "R15", "R17", "R19", "R21",
    ]);
    expect(marks().max).toBe("87.12%"); // 230 / 264
  });

  it("draws every other tick where a full set of labels would crowd the plot", () => {
    const { container } = render(
      <RankDistributionBar player={player({ minRank: 1, maxRank: 170, rankAverage: 80 })} />
    );

    // Rounds 1 to 15 hold 1 to 170 and a round after makes sixteen, ranks 1 to 192. Sixteen labels do not fit, so eight print.
    expect(ticks(container).map((tick) => tick.split(" ")[0])).toEqual([
      "R1", "R3", "R5", "R7", "R9", "R11", "R13", "R15",
    ]);
    expect(marks().max).toBe("88.54%"); // 170 / 192
  });

  it("draws on the scale a caller passes, with a guide and a label at each of its ticks", () => {
    const { container } = render(
      <RankDistributionBar
        player={player()}
        scale={{
          min: 1,
          max: 120,
          ticks: [
            { at: 1, label: "R1" },
            { at: 13, label: "R2" },
            { at: 61, label: "R6" },
          ],
        }}
      />
    );

    expect(ticks(container)).toEqual(["R1 0.00%", "R2 10.00%", "R6 50.00%"]);
    expect(marks()).toEqual({
      min: "5.00%", // (7 - 1) / 120
      max: "16.67%", // (20 - 1 + 1) / 120
      avg: "10.75%", // (13.4 - 1 + 0.5) / 120
      sdLo: "8.08%", // (13.4 - 3.2 - 1 + 0.5) / 120
      sdHi: "13.42%", // (13.4 + 3.2 - 1 + 0.5) / 120
    });
  });

  it("gives a range of one rank a slot of its own width", () => {
    render(<RankDistributionBar player={player({ minRank: 1, maxRank: 1, rankAverage: 1 })} />);

    // One slot of 36, with the average in the middle of it.
    expect(marks()).toMatchObject({ min: "0.00%", max: "2.78%", avg: "1.39%" });
  });

  it("leaves the Best, Avg, Worst line out for a caller that prints those numbers elsewhere", () => {
    render(<RankDistributionBar player={player()} showEnds={false} />);

    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.queryByText("Best 7")).not.toBeInTheDocument();
    expect(screen.queryByText("Avg 13.4")).not.toBeInTheDocument();
    expect(screen.queryByText("Worst 20")).not.toBeInTheDocument();
  });

  it("says so when the board has no expert range", () => {
    render(<RankDistributionBar player={player({ minRank: undefined, maxRank: undefined })} />);

    expect(screen.getByText("Expert range unavailable for this board.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
