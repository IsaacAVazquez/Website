"use client";

import type {
  DraftTelemetryRecap,
  DraftTurnOutcome,
} from "@/lib/draftTelemetry";

function ratio(numerator: number, denominator: number): string {
  return denominator === 0 ? "none scored" : `${numerator} of ${denominator}`;
}

function describeOutcome(outcome: DraftTurnOutcome): string {
  const { record } = outcome;
  const parts: string[] = [];
  if (record.atRiskPlayerName) {
    const verdict =
      record.atRiskPlayerId === record.chosenPlayerId
        ? "you took him"
        : outcome.atRiskGone === null
          ? "unscored"
          : outcome.atRiskGone
            ? `gone by #${record.nextUserPick}`
            : "still there";
    parts.push(`at risk ${record.atRiskPlayerName} (${verdict})`);
  }
  if (record.expectedSurvivorName) {
    const verdict =
      record.expectedSurvivorId === record.chosenPlayerId
        ? "you took him"
        : outcome.survivorSurvived === null
          ? "unscored"
          : outcome.survivorSurvived
            ? "survived"
            : "taken early";
    parts.push(`survivor ${record.expectedSurvivorName} (${verdict})`);
  }
  if (record.waitCostSpots !== null || outcome.realizedDropSpots !== null) {
    // One unit per line: points only when both sides have a points reading,
    // so the pair never prints as "22 pts predicted, 9 spots realized".
    const bothPoints =
      record.waitCostPoints !== null && outcome.realizedDropPoints !== null;
    const predicted = bothPoints
      ? `${Math.round(record.waitCostPoints as number)} pts`
      : record.waitCostSpots !== null
        ? `${Math.round(record.waitCostSpots)} spots`
        : "unscored";
    const realized = bothPoints
      ? `${Math.round(outcome.realizedDropPoints as number)} pts`
      : outcome.realizedDropSpots !== null
        ? `${Math.round(outcome.realizedDropSpots)} spots`
        : "unscored";
    parts.push(
      `wait cost ${predicted} predicted, ${realized} realized${
        record.waitPosition ? ` at ${record.waitPosition}` : ""
      }${
        outcome.realizedBestName && outcome.realizedBestName !== record.chosenPlayerName
          ? ` (${outcome.realizedBestName} was the best left)`
          : ""
      }`
    );
  }
  return parts.join(" · ");
}

/**
 * Post-draft scorecard for the decision strip: how the recorded
 * recommendations held up against what the room actually did, plus a
 * turn-by-turn replay of what the strip showed at each of the user's picks.
 */
export function DraftRecapPanel({
  recap,
  totalUserTurns,
}: {
  recap: DraftTelemetryRecap;
  totalUserTurns: number;
}) {
  if (recap.totalTurns === 0) return null;

  const cells = [
    {
      key: "hits",
      label: "Followed a recommendation",
      value: ratio(recap.recommendedHits, recap.totalTurns),
      sub: "your pick matched a recommended player",
    },
    {
      key: "survival",
      label: "Survivor calls right",
      value: ratio(recap.survivalCorrect, recap.survivalMeasured),
      sub: "expected survivor lasted to your next turn",
    },
    {
      key: "risk",
      label: "At-risk calls right",
      value: ratio(recap.atRiskGone, recap.atRiskMeasured),
      sub: "flagged player was gone by your next turn",
    },
    {
      key: "wait",
      label: "Wait cost, predicted vs realized",
      value:
        recap.averagePredictedDropSpots === null &&
        recap.averageRealizedDropSpots === null
          ? "not measured"
          : `${recap.averagePredictedDropSpots ?? "n/a"} / ${
              recap.averageRealizedDropSpots ?? "n/a"
            } spots`,
      sub:
        recap.averagePredictedDropPoints !== null &&
        recap.averageRealizedDropPoints !== null
          ? `about ${Math.round(recap.averagePredictedDropPoints)} projected points predicted, ${Math.round(recap.averageRealizedDropPoints)} realized per turn`
          : recap.averageRealizedDropPoints !== null
            ? `realized about ${Math.round(recap.averageRealizedDropPoints)} projected points per turn`
            : "average drop at the priced position",
    },
  ];

  return (
    <section className="ffb-dt-recap" aria-labelledby="draft-recap-heading">
      <div className="ffb-sechead">
        <h3 id="draft-recap-heading" className="ffb-h3">
          How the recommendations held up
        </h3>
      </div>
      <p className="ffb-method">
        Scored against this room&apos;s final pick log and the board saved with each
        recommendation. {recap.totalTurns} of your {totalUserTurns} turns carried
        a recorded recommendation; turns logged before recording existed stay
        unscored.
      </p>

      <dl className="ffb-stats ffb-dt-recap-stats">
        {cells.map((cell) => (
          <div key={cell.key} className="ffb-stat">
            <dt>{cell.label}</dt>
            <dd>{cell.value}</dd>
            <dd className="ffb-stat-note">{cell.sub}</dd>
          </div>
        ))}
      </dl>

      <div>
        <h4 className="ffb-label ffb-dt-replay-head">Turn replay</h4>
        <ol className="ffb-dt-entries">
          {recap.outcomes.map((outcome) => {
            const summary = describeOutcome(outcome);
            return (
              <li key={`turn-${outcome.record.pick}`} className="ffb-dt-entry">
                <div className="ffb-dt-entry-line">
                  <span className="ffb-dt-replay-pick">#{outcome.record.pick}</span>{" "}
                  <span className="ffb-h4">You took {outcome.record.chosenPlayerName}</span>{" "}
                  <span className={`ffb-badge ${outcome.followedRecommendation ? "ffb-good" : "ffb-muted"}`}>
                    {outcome.followedRecommendation ? "recommended" : "off the card"}
                  </span>
                </div>
                {summary ? <p className="ffb-dt-entry-note ffb-dt-replay-note">{summary}</p> : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
