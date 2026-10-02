"use client";

import type { DraftAnalytics, DraftPick } from "@/types";
import {
  getEmergingRun,
  getLiveDraftSignals,
  getPickDelta,
} from "@/lib/draftAnalytics";
import { FANTASY_CHIP_CLASS, getPositionTone } from "@/lib/fantasyUtils";

interface DraftAnalyticsPanelProps {
  analytics: DraftAnalytics;
  picks: DraftPick[];
  currentPick: number;
  isDraftComplete: boolean;
  userTeamNumber: number;
  adpAvailable: boolean;
  adpUnavailableReason?: "stale" | "reference" | "missing";
  getTeamName?: (teamNumber: number) => string;
}

function defaultTeamName(teamNumber: number): string {
  return `Team ${teamNumber}`;
}

const STEAL_CHIP_STYLE = {
  borderColor: "color-mix(in srgb, var(--c97-positive) 28%, var(--c97-rule))",
  background: "color-mix(in srgb, var(--c97-positive) 10%, var(--c97-surface))",
} as const;

const REACH_CHIP_STYLE = {
  borderColor: "color-mix(in srgb, var(--c97-warning) 30%, var(--c97-rule))",
  background: "color-mix(in srgb, var(--c97-warning) 12%, var(--c97-surface))",
} as const;

const PANEL_TILE_STYLE = {
  borderColor: "var(--c97-rule)",
  background: "var(--c97-field)",
} as const;

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function describeBaseline(
  adpAvailable: boolean,
  adpUnavailableReason: "stale" | "reference" | "missing"
): string {
  if (adpAvailable) {
    return "Deltas compare each pick's slot with usable mock-draft ADP. An early consensus rank can substitute when ADP is missing, while thin ADP samples and deep consensus ranks stay unscored.";
  }

  const sourceSentence = adpUnavailableReason === "stale"
    ? "The mock-draft ADP source is stale, so it is excluded."
    : adpUnavailableReason === "reference"
      ? "The prior-season ADP is shown as a dated reference elsewhere, but it is excluded from these calculations."
      : "The current snapshot has no usable ADP source.";
  return `Deltas compare each pick's slot with an early published consensus rank. Deep ranks stay unscored because a board rank is not a reliable pick price there. ${sourceSentence}`;
}

function PickValueRow({
  pick,
  label,
  teamName,
}: {
  pick: DraftPick;
  label: "Steal" | "Reach";
  teamName: string;
}) {
  const delta = getPickDelta(pick) ?? 0;

  return (
    <div className="border px-4 py-3" style={PANEL_TILE_STYLE}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{pick.player.name}</p>
        <span className={FANTASY_CHIP_CLASS} style={getPositionTone(pick.player.position)}>
          {pick.player.position}
        </span>
        <span
          className={FANTASY_CHIP_CLASS}
          style={label === "Steal" ? STEAL_CHIP_STYLE : REACH_CHIP_STYLE}
        >
          {label} {formatDelta(delta)}
        </span>
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--c97-ink-2)" }}>
        {teamName} • Pick {pick.pickNumber} • Round {pick.round}
      </p>
    </div>
  );
}

/**
 * Live sidebar card while the draft runs, full summary once it completes.
 * Every number measures pick position against a pre-draft baseline — it is a
 * read on draft-day process, not a prediction of how the season goes.
 */
export function DraftAnalyticsPanel({
  analytics,
  picks,
  currentPick,
  isDraftComplete,
  userTeamNumber,
  adpAvailable,
  adpUnavailableReason = "missing",
  getTeamName = defaultTeamName,
}: DraftAnalyticsPanelProps) {
  if (!isDraftComplete) {
    const { latestFlaggedPick, activeRun } = getLiveDraftSignals(picks, currentPick);
    // Surface a forming run only when it isn't already the confirmed one, so the
    // soft and hard signals never describe the same position twice.
    const emergingRun = getEmergingRun(picks, currentPick);
    const showEmerging = emergingRun && (!activeRun || activeRun.position !== emergingRun.position);

    return (
      <article className="c97-panel">
        <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Draft signals</p>
        <div className="mt-3 grid gap-3">
          {latestFlaggedPick === null && activeRun === null && !showEmerging ? (
            <p className="text-sm leading-6" style={{ color: "var(--c97-ink-2)" }}>
              Nothing unusual yet. Steals, reaches, and position runs show up here as picks come in.
            </p>
          ) : (
            <>
              {latestFlaggedPick && (
                <PickValueRow
                  pick={latestFlaggedPick.pick}
                  label={latestFlaggedPick.kind === "steal" ? "Steal" : "Reach"}
                  teamName={getTeamName(latestFlaggedPick.pick.teamNumber)}
                />
              )}
              {activeRun && (
                <div className="border px-4 py-3" style={PANEL_TILE_STYLE}>
                  <p className="text-sm font-semibold">
                    {activeRun.position} run in progress
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--c97-ink-2)" }}>
                    {activeRun.playersSelected} {activeRun.position}s gone since pick{" "}
                    {activeRun.startPick}. The run changes likely availability, but it does not make
                    a reach worthwhile on its own.
                  </p>
                </div>
              )}
              {showEmerging && emergingRun && (
                <div
                  className="border border-l-[3px] px-4 py-3"
                  style={{ ...PANEL_TILE_STYLE, borderLeftColor: "var(--c97-accent)" }}
                >
                  {/* The accent wash this tile used to carry measured ink-2 at
                      4.25:1 on top of it. The stripe keeps the accent as a
                      marker instead of a full-tile tint, and the body text
                      prints in ink so it clears 4.5:1 without depending on the
                      tint's strength. */}
                  <p className="text-sm font-semibold">{emergingRun.position}s starting to go</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--c97-ink)" }}>
                    {emergingRun.count} went in the last few picks. Compare the next options inside
                    their current tier before changing your plan.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <p className="mt-3 max-w-[68ch] text-xs leading-5" style={{ color: "var(--c97-ink-2)" }}>
          {describeBaseline(adpAvailable, adpUnavailableReason)}
        </p>
      </article>
    );
  }

  const biggestSteal = analytics.steals[0] ?? null;
  const biggestReach = analytics.reaches[0] ?? null;
  const userAssessment =
    analytics.teamStrengths.find((team) => team.teamNumber === userTeamNumber) ?? null;
  const rankedTeams = [...analytics.teamStrengths].sort(
    (left, right) => (right.valueTotal ?? 0) - (left.valueTotal ?? 0)
  );

  return (
    <article className="c97-panel">
      <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>Draft recap</p>
      <h2 className="c97-serif c97-h3">How the room drafted</h2>
      <p className="mt-2 max-w-[68ch] text-sm leading-7" style={{ color: "var(--c97-ink-2)" }}>
        {describeBaseline(adpAvailable, adpUnavailableReason)} A positive total means a team kept landing players past
        where the market expected them to go. None of it predicts the season. It only summarizes
        market-price discipline. Draft Outlook is the separate room ranking because it also includes
        roster and lineup structure.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="grid gap-3">
          <p className="c97-kicker">Biggest steal</p>
          {biggestSteal ? (
            <PickValueRow pick={biggestSteal} label="Steal" teamName={getTeamName(biggestSteal.teamNumber)} />
          ) : (
            <p className="text-sm" style={{ color: "var(--c97-ink-2)" }}>
              No pick beat its baseline by enough to count.
            </p>
          )}

          <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-1)" }}>Biggest reach</p>
          {biggestReach ? (
            <PickValueRow pick={biggestReach} label="Reach" teamName={getTeamName(biggestReach.teamNumber)} />
          ) : (
            <p className="text-sm" style={{ color: "var(--c97-ink-2)" }}>
              Nobody jumped a player far enough ahead of his baseline to count.
            </p>
          )}

          {analytics.positionRunAnalysis.length > 0 && (
            <>
              <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-1)" }}>Position runs</p>
              <div className="grid gap-2">
                {analytics.positionRunAnalysis.map((run) => (
                  <div
                    key={`run-${run.position}-${run.startPick ?? run.startRound}`}
                    className="border px-4 py-3 text-sm"
                    style={PANEL_TILE_STYLE}
                  >
                    <span className="font-semibold">{run.position} run</span>
                    <span style={{ color: "var(--c97-ink-2)" }}>
                      {", "}
                      {run.playersSelected} picks
                      {run.startPick && run.endPick
                        ? ` between #${run.startPick} and #${run.endPick}`
                        : ` from round ${run.startRound} to ${run.endRound}`}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid gap-3 content-start">
          <p className="c97-kicker">Market value by team</p>
          <div className="grid gap-2">
            {rankedTeams.map((team) => (
              <div
                key={`team-value-${team.teamNumber}`}
                className="flex items-center justify-between gap-3 border px-4 py-3"
                style={PANEL_TILE_STYLE}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {getTeamName(team.teamNumber)}
                    {team.teamNumber === userTeamNumber ? " (you)" : ""}
                  </p>
                  {team.weaknesses.length > 0 && (
                    <p className="mt-1 truncate text-xs" style={{ color: "var(--c97-ink-2)" }}>
                      Open starting slots at {team.weaknesses.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={FANTASY_CHIP_CLASS}
                    style={(team.valueTotal ?? 0) >= 0 ? STEAL_CHIP_STYLE : REACH_CHIP_STYLE}
                  >
                    {formatDelta(team.valueTotal ?? 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {userAssessment && userAssessment.strengths.length > 0 && (
            <p className="text-xs leading-5" style={{ color: "var(--c97-ink-2)" }}>
              Your roster runs deep at {userAssessment.strengths.join(", ")}.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
