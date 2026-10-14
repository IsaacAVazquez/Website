import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  REDRAFT_DRAFT_DECISION_MODEL_VERSION,
  describeRedraftWait,
  type RedraftDraftDecisionReport,
  type RedraftPositionDecision,
  type RedraftWaitReading,
} from "@/lib/redraftDraftDecision";
import type { Player } from "@/types";

import { RedraftDecisionPanel } from "../RedraftDecisionPanel";

const OFF_CLOCK: RedraftWaitReading = {
  kind: "unmeasurable",
  nextPick: 24,
  reason: "off-clock",
  coverage: "unavailable",
};

function player(id: string, name: string, position: Player["position"]): Player {
  return { id, name, team: "BUF", position, averageRank: 10, rankEcr: 10 };
}

function decision(
  position: RedraftPositionDecision["position"],
  best: Player,
  wait: RedraftWaitReading = OFF_CLOCK,
): RedraftPositionDecision {
  return {
    position,
    need: "starter",
    bestAvailable: {
      player: best,
      expertRank: 10,
      value: 42.2,
      starterValue: null,
      depthValue: null,
      starterCutoff: 95,
      rosterCutoff: 139,
      coverage: "supported",
    },
    tier: {
      tier: 1,
      positionRank: 2,
      remaining: 4,
      nextTier: 2,
      nextTierPositionRank: 5,
      overallBoardGap: 10,
      signal: null,
      coverage: "supported",
    },
    wait,
    scarcityScore: null,
  };
}

function report(positions: RedraftPositionDecision[]): RedraftDraftDecisionReport {
  return {
    modelVersion: REDRAFT_DRAFT_DECISION_MODEL_VERSION,
    guidanceAvailable: true,
    userOnClock: false,
    nextUserPick: 24,
    followingUserPick: 25,
    playerValues: [],
    positions,
    mostAtRisk: positions[1] ?? null,
  };
}

describe("RedraftDecisionPanel", () => {
  it("prints the next-turn sentence once when every position carries the same one", () => {
    const allen = player("qb-1", "Josh Allen", "QB");
    const onOpenPlayer = jest.fn();
    render(
      <RedraftDecisionPanel
        report={report([decision("QB", allen), decision("TE", player("te-1", "Brock Bowers", "TE"))])}
        onOpenPlayer={onOpenPlayer}
      />
    );

    // The room heads every block under its own h2 with an h3, and this panel is one of those blocks.
    expect(screen.getByRole("heading", { level: 3, name: "What changes if you wait" })).toBeInTheDocument();
    expect(screen.getAllByText(describeRedraftWait(OFF_CLOCK))).toHaveLength(1);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    // Status keeps its words, so the row at risk says so in text.
    expect(screen.getAllByText("Most at risk")).toHaveLength(1);
    expect(screen.getAllByText("Starter open")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Open Josh Allen detail" }));
    expect(onOpenPlayer).toHaveBeenCalledWith(allen);
  });

  it("gives each row its own next-turn sentence once they differ", () => {
    const survivor = player("qb-2", "Jalen Hurts", "QB");
    const measured: RedraftWaitReading = {
      kind: "measured",
      nextPick: 24,
      survivor: { player: survivor, expertRank: 30, rankCost: 12, replacementDrop: 6.5, pointsDrop: null },
      plausibleSurvivor: null,
      saferSurvivor: null,
      coverage: "supported",
    };
    render(
      <RedraftDecisionPanel
        report={report([
          decision("QB", player("qb-1", "Josh Allen", "QB"), measured),
          decision("TE", player("te-1", "Brock Bowers", "TE")),
        ])}
        onOpenPlayer={jest.fn()}
      />
    );

    expect(screen.getByText(describeRedraftWait(measured))).toBeInTheDocument();
    expect(screen.getByText(describeRedraftWait(OFF_CLOCK))).toBeInTheDocument();
  });

  it("renders nothing without guidance", () => {
    const { container } = render(
      <RedraftDecisionPanel
        report={{ ...report([decision("QB", player("qb-1", "Josh Allen", "QB"))]), guidanceAvailable: false }}
        onOpenPlayer={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
