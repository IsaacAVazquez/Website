import React from "react";
import { render, screen } from "@testing-library/react";

import { DraftAnalyticsPanel } from "./DraftAnalyticsPanel";
import { computeDraftAnalytics } from "@/lib/draftAnalytics";
import type { DraftPick, Player, TeamRoster } from "@/types";

function makePlayer(
  partial: Partial<Player> & Pick<Player, "id" | "name" | "position">
): Player {
  return {
    team: "SF",
    averageRank: 1,
    standardDeviation: 1,
    ...partial,
  } as Player;
}

function makePick(overrides: Partial<DraftPick> & { player: Player }): DraftPick {
  return {
    pickNumber: 1,
    round: 1,
    teamNumber: 1,
    timestamp: new Date("2026-08-30T00:00:00Z"),
    ...overrides,
  };
}

function makeRoster(teamNumber: number, picks: DraftPick[]): TeamRoster {
  const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 };
  for (const pick of picks) {
    const position = pick.player.position as keyof typeof positionCounts;
    if (position in positionCounts) {
      positionCounts[position] += 1;
    }
  }
  return { teamNumber, picks, positionCounts, totalValue: 0, projectedPoints: 0 };
}

describe("DraftAnalyticsPanel", () => {
  it("shows an honest empty state while the draft is live and uneventful", () => {
    render(
      <DraftAnalyticsPanel
        analytics={computeDraftAnalytics([], [])}
        picks={[]}
        currentPick={1}
        isDraftComplete={false}
        userTeamNumber={1}
        adpAvailable
      />
    );

    expect(screen.getByText("Draft signals")).toBeVisible();
    expect(screen.getByText(/Nothing unusual yet/)).toBeVisible();
  });

  it("surfaces the latest steal and an active position run during a live draft", () => {
    const picks = [
      makePick({ pickNumber: 25, round: 3, player: makePlayer({ id: "s1", name: "Bargain Back", position: "RB", adp: 10 }) }),
      makePick({ pickNumber: 27, round: 3, player: makePlayer({ id: "rb2", name: "Run Back Two", position: "RB", adp: 27 }) }),
      makePick({ pickNumber: 29, round: 3, player: makePlayer({ id: "rb3", name: "Run Back Three", position: "RB", adp: 30 }) }),
    ];

    render(
      <DraftAnalyticsPanel
        analytics={computeDraftAnalytics(picks, [])}
        picks={picks}
        currentPick={30}
        isDraftComplete={false}
        userTeamNumber={1}
        adpAvailable
      />
    );

    expect(screen.getByText("Bargain Back")).toBeVisible();
    expect(screen.getByText(/Steal \+15/)).toBeVisible();
    expect(screen.getByText(/RB run in progress/)).toBeVisible();
  });

  it("renders the full recap with team grades when the draft completes", () => {
    const teamOnePicks = [
      makePick({ pickNumber: 20, round: 2, teamNumber: 1, player: makePlayer({ id: "v1", name: "Steal One", position: "RB", adp: 5 }) }),
    ];
    const teamTwoPicks = [
      makePick({ pickNumber: 3, round: 1, teamNumber: 2, player: makePlayer({ id: "r1", name: "Reach One", position: "WR", adp: 40 }) }),
    ];
    const picks = [...teamOnePicks, ...teamTwoPicks];
    const teams = [makeRoster(1, teamOnePicks), makeRoster(2, teamTwoPicks)];

    render(
      <DraftAnalyticsPanel
        analytics={computeDraftAnalytics(picks, teams)}
        picks={picks}
        currentPick={3}
        isDraftComplete
        userTeamNumber={1}
        adpAvailable
      />
    );

    expect(screen.getByText("How the room drafted")).toBeVisible();
    expect(screen.getByText("Biggest steal")).toBeVisible();
    expect(screen.getByText("Steal One")).toBeVisible();
    expect(screen.getByText("Biggest reach")).toBeVisible();
    expect(screen.getByText("Reach One")).toBeVisible();
    expect(screen.getByText("Team 1 (you)")).toBeVisible();
    expect(screen.getByText("A+")).toBeVisible();
    expect(screen.getByText("D")).toBeVisible();
  });

  it("discloses the consensus-only baseline when the snapshot has no ADP", () => {
    render(
      <DraftAnalyticsPanel
        analytics={computeDraftAnalytics([], [])}
        picks={[]}
        currentPick={1}
        isDraftComplete={false}
        userTeamNumber={1}
        adpAvailable={false}
      />
    );

    expect(screen.getByText(/The current snapshot has no ADP data/)).toBeVisible();
  });
});
