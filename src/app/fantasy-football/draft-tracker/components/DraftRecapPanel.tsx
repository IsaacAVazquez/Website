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
    <article className="home-card p-5 sm:p-6" aria-labelledby="draft-recap-heading">
      <p className="home-kicker mb-1">Model recap</p>
      <h3
        id="draft-recap-heading"
        className="m-0 text-xl font-semibold tracking-[-0.03em]"
      >
        How the recommendations held up
      </h3>
      <p
        className="m-0 mt-1.5 max-w-[72ch] text-xs leading-5"
        style={{ color: "var(--home-ink-muted)" }}
      >
        Scored against this room&apos;s final pick log and the board saved with each
        recommendation. {recap.totalTurns} of your {totalUserTurns} turns carried
        a recorded recommendation; turns logged before recording existed stay
        unscored.
      </p>

      <div
        className="mt-4 grid gap-px overflow-hidden rounded-lg border"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          borderColor: "var(--home-rule)",
          background: "var(--home-rule)",
        }}
      >
        {cells.map((cell) => (
          <div key={cell.key} className="px-3.5 py-2.5" style={{ background: "var(--home-paper)" }}>
            <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--home-ink-muted)" }}>
              {cell.label}
            </p>
            <p className="m-0 mt-1 font-mono text-lg leading-tight tabular-nums">{cell.value}</p>
            <p className="m-0 mt-0.5 font-mono text-3xs" style={{ color: "var(--home-ink-muted)" }}>
              {cell.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <p className={`m-0 ${MONO_LABEL_CLASS}`} style={{ color: "var(--home-ink-muted)" }}>
          Turn replay
        </p>
        <ul className="m-0 mt-1.5 list-none p-0">
          {recap.outcomes.map((outcome) => {
            const summary = describeOutcome(outcome);
            return (
            <li
              key={`turn-${outcome.record.pick}`}
              className="border-t py-2"
              style={{ borderColor: "color-mix(in srgb, var(--home-rule) 70%, transparent)" }}
            >
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <span className="w-10 flex-none font-mono text-sm" style={{ color: "var(--home-ink-muted)" }}>
                  #{outcome.record.pick}
                </span>
                <span className="text-sm font-semibold tracking-[-0.01em]">
                  You took {outcome.record.chosenPlayerName}
                </span>
                <span
                  className="font-mono text-3xs uppercase tracking-[0.08em]"
                  style={{
                    color: outcome.followedRecommendation
                      ? "var(--home-positive)"
                      : "var(--home-ink-muted)",
                  }}
                >
                  {outcome.followedRecommendation ? "recommended" : "off the card"}
                </span>
              </div>
              {summary ? (
                <p
                  className="m-0 mt-0.5 pl-[3.125rem] font-mono text-3xs leading-5"
                  style={{ color: "var(--home-ink-muted)" }}
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
