import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { DraftTierColumns } from "./DraftTierColumns";
import type {
  FantasySnapshot,
  FantasySnapshotSliceMap,
  FantasySnapshotSliceMetadata,
} from "@/lib/fantasy";
import type { Player } from "@/types";

function makePlayer(
  partial: Partial<Player> & Pick<Player, "id" | "name" | "team" | "position">
): Player {
  return {
    averageRank: 1,
    rankEcr: 1,
    ...partial,
  } as Player;
}

function availableSlice(playerCount: number): FantasySnapshotSliceMetadata {
  return {
    available: true,
    sourceKind: "position_consensus",
    rangeKind: "position",
    playerCount,
    updatedAt: "2026-06-01T00:00:00.000Z",
  };
}

function unavailableSlice(): FantasySnapshotSliceMetadata {
  return { available: false, sourceKind: "unavailable", rangeKind: "none", playerCount: 0 };
}

function buildSnapshot(positions: {
  QB?: Player[];
  RB?: Player[];
  WR?: Player[];
  TE?: Player[];
}): FantasySnapshot {
  const sliceMetadata: FantasySnapshotSliceMap = {
    overall: availableSlice(0),
    qb: availableSlice(positions.QB?.length ?? 0),
    rb: availableSlice(positions.RB?.length ?? 0),
    wr: availableSlice(positions.WR?.length ?? 0),
    te: availableSlice(positions.TE?.length ?? 0),
    flex: unavailableSlice(),
    k: unavailableSlice(),
    dst: unavailableSlice(),
  };

  return {
    schemaVersion: 1,
    season: 2026,
    week: 0,
    generatedAt: "2026-06-01T00:00:00.000Z",
    upstreamUpdatedAt: "2026-06-01T00:00:00.000Z",
    scoringFormat: "PPR",
    source: "test",
    positions: {
      QB: positions.QB ?? [],
      RB: positions.RB ?? [],
      WR: positions.WR ?? [],
      TE: positions.TE ?? [],
      FLEX: [],
      K: [],
      DST: [],
    },
    overall: [],
    sliceMetadata,
  };
}

const snapshot = buildSnapshot({
  // RB: a 1-player top tier (a cliff) above a deeper tier 2.
  RB: [
    makePlayer({ id: "rb1", name: "Bijan Robinson", team: "ATL", position: "RB", tier: 1, positionRank: 1 }),
    makePlayer({ id: "rb2", name: "Jahmyr Gibbs", team: "DET", position: "RB", tier: 2, positionRank: 2 }),
    makePlayer({ id: "rb3", name: "Saquon Barkley", team: "PHI", position: "RB", tier: 2, positionRank: 3 }),
  ],
  // QB: a healthy top tier (no cliff).
  QB: [
    makePlayer({ id: "qb1", name: "Josh Allen", team: "BUF", position: "QB", tier: 1, positionRank: 1 }),
    makePlayer({ id: "qb2", name: "Lamar Jackson", team: "BAL", position: "QB", tier: 1, positionRank: 2 }),
    makePlayer({ id: "qb3", name: "Jayden Daniels", team: "WAS", position: "QB", tier: 1, positionRank: 3 }),
  ],
  WR: [makePlayer({ id: "wr1", name: "Ja'Marr Chase", team: "CIN", position: "WR", tier: 1, positionRank: 1 })],
  TE: [makePlayer({ id: "te1", name: "Brock Bowers", team: "LV", position: "TE", tier: 1, positionRank: 1 })],
});

describe("DraftTierColumns", () => {
  it("renders one column per skill position, grouped by tier", () => {
    render(
      <DraftTierColumns
        snapshot={snapshot}
        draftedPlayerIds={new Set()}
        onDraftPlayer={jest.fn()}
        isDraftComplete={false}
        rosterNeeds={[]}
      />
    );

    expect(screen.getByLabelText("QB tier column")).toBeInTheDocument();
    expect(screen.getByLabelText("RB tier column")).toBeInTheDocument();
    expect(screen.getByLabelText("WR tier column")).toBeInTheDocument();
    expect(screen.getByLabelText("TE tier column")).toBeInTheDocument();

    const rbColumn = screen.getByLabelText("RB tier column");
    expect(within(rbColumn).getByText("Tier 1")).toBeInTheDocument();
    expect(within(rbColumn).getByText("Tier 2")).toBeInTheDocument();
    expect(within(rbColumn).getByText("Bijan Robinson")).toBeInTheDocument();
  });

  it("flags a tier cliff only when the current tier is nearly empty", () => {
    render(
      <DraftTierColumns
        snapshot={snapshot}
        draftedPlayerIds={new Set()}
        onDraftPlayer={jest.fn()}
        isDraftComplete={false}
        rosterNeeds={[]}
      />
    );

    // RB top tier has a single player left -> cliff. QB top tier has three.
    expect(within(screen.getByLabelText("RB tier column")).getByText(/Tier 1 cliff/i)).toBeInTheDocument();
    expect(within(screen.getByLabelText("QB tier column")).queryByText(/cliff/i)).not.toBeInTheDocument();
  });

  it("hides drafted players and logs a pick when a player is clicked", () => {
    const onDraftPlayer = jest.fn();
    render(
      <DraftTierColumns
        snapshot={snapshot}
        draftedPlayerIds={new Set(["rb2"])}
        onDraftPlayer={onDraftPlayer}
        isDraftComplete={false}
        rosterNeeds={[]}
      />
    );

    // rb2 was drafted, so it should not appear on the board.
    expect(screen.queryByText("Jahmyr Gibbs")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Draft Bijan Robinson/i }));
    expect(onDraftPlayer).toHaveBeenCalledTimes(1);
    expect(onDraftPlayer).toHaveBeenCalledWith(expect.objectContaining({ id: "rb1" }));
  });

  it("marks roster-need positions", () => {
    render(
      <DraftTierColumns
        snapshot={snapshot}
        draftedPlayerIds={new Set()}
        onDraftPlayer={jest.fn()}
        isDraftComplete={false}
        rosterNeeds={["RB"]}
      />
    );

    expect(within(screen.getByLabelText("RB tier column")).getByText("Need")).toBeInTheDocument();
    expect(within(screen.getByLabelText("QB tier column")).queryByText("Need")).not.toBeInTheDocument();
  });
});
