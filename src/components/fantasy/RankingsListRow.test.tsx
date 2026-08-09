import { render, screen } from "@testing-library/react";

import type { Player } from "@/types";

import { RankingsListRow } from "./RankingsListRow";

describe("RankingsListRow", () => {
  it("uses an auto-fitting metric grid before the fixed-width desktop layout", () => {
    const player: Player = {
      id: "rb-1",
      name: "Bijan Robinson",
      team: "ATL",
      position: "RB",
      averageRank: 1,
      rankEcr: 1,
      positionRank: 1,
      minRank: 1,
      maxRank: 3,
      ownership: 99,
      adp: 2,
      standardDeviation: 1,
    };

    render(
      <RankingsListRow
        player={player}
        publishedRank="1"
        descriptor="ATL · RB1"
        adpAvailable
        compact={false}
        isQueued={false}
        hasNote={false}
        inCompare={false}
        compareDisabled={false}
        onOpenDetail={jest.fn()}
        onToggleQueue={jest.fn()}
        onToggleCompare={jest.fn()}
      />
    );

    const metricStrip = screen.getByText("Expert range").parentElement?.parentElement;
    expect(metricStrip).toHaveClass("grid", "grid-cols-[repeat(auto-fit,minmax(6.25rem,1fr))]");
    expect(screen.getByText("Expert range").parentElement).toHaveClass(
      "@2xl:w-[6.5rem]",
      "@2xl:shrink-0"
    );
  });
});
