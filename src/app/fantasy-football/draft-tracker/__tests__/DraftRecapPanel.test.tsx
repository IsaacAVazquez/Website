import { render, screen } from "@testing-library/react";
import { DraftRecapPanel } from "../components/DraftRecapPanel";
import type { DraftTelemetryRecap, DraftTurnRecord } from "@/lib/draftTelemetry";

const record: DraftTurnRecord = {
  pick: 1,
  nextUserPick: 4,
  chosenPlayerId: "wr-1",
  chosenPlayerName: "wr-1",
  bestAvailableId: "wr-1",
  bestAvailableName: "wr-1",
  waitPosition: "RB",
  waitBaselineId: "rb-1",
  waitBaselineName: "rb-1",
  waitBaselineRank: 2,
  expectedSurvivorId: "rb-2",
  expectedSurvivorName: "rb-2",
  expectedSurvivorRank: 5,
  waitCostSpots: 3,
  waitCostPoints: 10,
  atRiskPlayerId: null,
  atRiskPlayerName: null,
  atRiskPosition: null,
  recommendedIds: ["wr-1"],
  modelVersion: "redraft-decision-v2",
  snapshotRevision: "2026-08-31T00:00:00.000Z",
  rankingAsOf: "2026-08-31T00:00:00.000Z",
  marketAsOf: "2026-08-31T00:00:00.000Z",
  vorpAsOf: "2026-08-31T00:00:00.000Z",
  waitCandidates: [],
  recordedAt: "2026-08-31T00:00:00.000Z",
};

const recap: DraftTelemetryRecap = {
  outcomes: [
    {
      record,
      measured: true,
      survivorSurvived: true,
      atRiskGone: null,
      followedRecommendation: true,
      realizedBestId: "rb-2",
      realizedBestName: "rb-2",
      realizedDropSpots: 3,
      realizedDropPoints: 10,
    },
  ],
  totalTurns: 1,
  recommendedHits: 1,
  survivalMeasured: 1,
  survivalCorrect: 1,
  atRiskMeasured: 0,
  atRiskGone: 0,
  realizedDropMeasured: 1,
  averagePredictedDropSpots: 3,
  averageRealizedDropSpots: 3,
  averagePredictedDropPoints: 10,
  averageRealizedDropPoints: 10,
};

describe("DraftRecapPanel", () => {
  it("renders the scorecard, the calibration column, and the realized best line", () => {
    render(<DraftRecapPanel recap={recap} totalUserTurns={2} />);

    expect(screen.getByText("How the recommendations held up")).toBeInTheDocument();
    // No at-risk calls were measured, so the cell explains instead of a dash.
    expect(screen.getByText("none scored")).toBeInTheDocument();
    // Predicted and realized points share one sub-line so they calibrate.
    expect(
      screen.getByText(/about 10 projected points predicted, 10 realized per turn/)
    ).toBeInTheDocument();
    expect(screen.getByText(/rb-2 was the best left/)).toBeInTheDocument();
    expect(screen.getByText(/You took wr-1/)).toBeInTheDocument();
  });

  it("renders nothing when no turns were recorded", () => {
    const { container } = render(
      <DraftRecapPanel
        recap={{ ...recap, outcomes: [], totalTurns: 0 }}
        totalUserTurns={2}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
