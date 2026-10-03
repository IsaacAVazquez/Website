"use client";

import { MONO_LABEL_CLASS } from "@/lib/fantasyUtils";
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
    <article className="c97-panel" aria-labelledby="draft-recap-heading">
      <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Model recap</p>
      <h3 id="draft-recap-heading" className="c97-serif c97-h3">
        How the recommendations held up
      </h3>
      <p
        className="m-0 max-w-[72ch] text-xs leading-5"
        style={{ marginTop: "var(--c97-sp-0)", color: "var(--c97-ink-2)" }}
      >
        Scored against this room&apos;s final pick log and the board saved with each
        recommendation. {recap.totalTurns} of your {totalUserTurns} turns carried
        a recorded recommendation; turns logged before recording existed stay
        unscored.
      </p>

      <div
        className="grid gap-px overflow-hidden border"
        style={{
          marginTop: "var(--c97-sp-2)",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
          borderColor: "var(--c97-rule)",
          background: "var(--c97-rule)",
        }}
      >
        {cells.map((cell) => (
          <div key={cell.key} style={{ paddingInline: "var(--c97-sp-2)", paddingBlock: "var(--c97-sp-1)", background: "var(--c97-surface)" }}>
            <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--c97-ink-2)" }}>
              {cell.label}
            </p>
            <p className="m-0 font-mono text-lg leading-tight tabular-nums" style={{ marginTop: "var(--c97-sp-0)" }}>{cell.value}</p>
            <p className="m-0 mt-0.5 font-mono text-3xs" style={{ color: "var(--c97-ink-2)" }}>
              {cell.sub}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "var(--c97-sp-2)" }}>
        <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--c97-ink-2)" }}>
          Turn replay
        </p>
        <ul className="m-0 list-none p-0" style={{ marginTop: "var(--c97-sp-0)" }}>
          {recap.outcomes.map((outcome) => {
            const summary = describeOutcome(outcome);
            return (
            <li
              key={`turn-${outcome.record.pick}`}
              className="border-t"
              style={{ paddingBlock: "var(--c97-sp-1)", borderColor: "color-mix(in srgb, var(--c97-rule) 70%, transparent)" }}
            >
              <div className="flex flex-wrap items-baseline gap-y-0.5" style={{ columnGap: "var(--c97-sp-1)" }}>
                <span className="w-10 flex-none font-mono text-sm" style={{ color: "var(--c97-ink-2)" }}>
                  #{outcome.record.pick}
                </span>
                <span className="text-sm font-semibold tracking-[-0.01em]">
                  You took {outcome.record.chosenPlayerName}
                </span>
                <span
                  className="font-mono text-3xs uppercase tracking-[0.08em]"
                  style={{
                    color: outcome.followedRecommendation
                      ? "var(--c97-positive)"
                      : "var(--c97-ink-2)",
                  }}
                >
                  {outcome.followedRecommendation ? "recommended" : "off the card"}
                </span>
              </div>
              {summary ? (
                <p
                  className="m-0 mt-0.5 pl-[calc(2.5rem+var(--c97-sp-1))] font-mono text-3xs leading-5"
                  style={{ color: "var(--c97-ink-2)" }}
                >
                  {summary}
                </p>
              ) : null}
            </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
