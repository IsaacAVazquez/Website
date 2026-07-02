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
  getTeamName?: (teamNumber: number) => string;
}

function defaultTeamName(teamNumber: number): string {
  return `Team ${teamNumber}`;
}

const STEAL_CHIP_STYLE = {
  borderColor: "color-mix(in srgb, var(--home-positive) 28%, var(--home-rule))",
  background: "color-mix(in srgb, var(--home-positive) 10%, var(--home-paper))",
} as const;

const REACH_CHIP_STYLE = {
  borderColor: "color-mix(in srgb, var(--home-warning) 30%, var(--home-rule))",
  background: "color-mix(in srgb, var(--home-warning) 12%, var(--home-paper))",
} as const;

const PANEL_TILE_STYLE = {
  borderColor: "var(--home-rule)",
  background: "color-mix(in srgb, var(--home-paper-alt) 55%, var(--home-elev-mix))",
} as const;

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function describeBaseline(adpAvailable: boolean): string {
  return adpAvailable
    ? "Deltas compare each pick's slot to mock-draft ADP, falling back to the consensus rank when a player has no ADP reading."
    : "Deltas compare each pick's slot to the published consensus rank. The current snapshot has no ADP data.";
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
    <div className="rounded-[var(--radius-3xl)] border px-4 py-3" style={PANEL_TILE_STYLE}>
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
      <p className="mt-1 text-xs" style={{ color: "var(--home-ink-muted)" }}>
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
  getTeamName = defaultTeamName,
}: DraftAnalyticsPanelProps) {
  if (!isDraftComplete) {
    const { latestFlaggedPick, activeRun } = getLiveDraftSignals(picks, currentPick);
    // Surface a forming run only when it isn't already the confirmed one, so the
    // soft and hard signals never describe the same position twice.
    const emergingRun = getEmergingRun(picks, currentPick);
    const showEmerging = emergingRun && (!activeRun || activeRun.position !== emergingRun.position);

    return (
      <article className="home-card p-5 sm:p-6">
        <p className="home-kicker mb-1">Draft signals</p>
        <div className="mt-3 grid gap-3">
          {latestFlaggedPick === null && activeRun === null && !showEmerging ? (
            <p className="text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
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
                <div className="rounded-[var(--radius-3xl)] border px-4 py-3" style={PANEL_TILE_STYLE}>
                  <p className="text-sm font-semibold">
                    {activeRun.position} run in progress
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--home-ink-muted)" }}>
                    {activeRun.playersSelected} {activeRun.position}s gone since pick{" "}
                    {activeRun.startPick}. If you want one, the shelf is emptying.
                  </p>
                </div>
              )}
              {showEmerging && emergingRun && (
                <div
                  className="rounded-[var(--radius-3xl)] border px-4 py-3"
                  style={{
                    borderColor: "color-mix(in srgb, var(--home-signal) 36%, var(--home-rule))",
                    background: "color-mix(in srgb, var(--home-signal) 10%, var(--home-paper))",
                  }}
                >
                  <p className="text-sm font-semibold">{emergingRun.position}s starting to go</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--home-ink-muted)" }}>
                    {emergingRun.count} off the board in the last few picks — a run may be forming.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <p className="mt-3 text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
          {describeBaseline(adpAvailable)}
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
    <article className="home-card p-5 sm:p-6">
      <p className="home-kicker mb-1">Draft recap</p>
      <h2 className="text-2xl font-semibold">How the room drafted</h2>
      <p className="mt-2 max-w-[68ch] text-sm leading-7" style={{ color: "var(--home-ink-muted)" }}>
        {describeBaseline(adpAvailable)} A positive total means a team kept landing players past
        where the market expected them to go. None of it predicts the season. It only grades
        draft-day discipline.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="grid gap-3">
          <p className="home-kicker mb-0">Biggest steal</p>
          {biggestSteal ? (
            <PickValueRow pick={biggestSteal} label="Steal" teamName={getTeamName(biggestSteal.teamNumber)} />
          ) : (
            <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
              No pick beat its baseline by enough to count.
            </p>
          )}

          <p className="home-kicker mb-0 mt-2">Biggest reach</p>
          {biggestReach ? (
            <PickValueRow pick={biggestReach} label="Reach" teamName={getTeamName(biggestReach.teamNumber)} />
          ) : (
            <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
              Nobody jumped a player far enough ahead of his baseline to count.
            </p>
          )}

          {analytics.positionRunAnalysis.length > 0 && (
            <>
              <p className="home-kicker mb-0 mt-2">Position runs</p>
              <div className="grid gap-2">
                {analytics.positionRunAnalysis.map((run) => (
                  <div
                    key={`run-${run.position}-${run.startPick ?? run.startRound}`}
                    className="rounded-[var(--radius-3xl)] border px-4 py-3 text-sm"
                    style={PANEL_TILE_STYLE}
                  >
                    <span className="font-semibold">{run.position} run</span>
                    <span style={{ color: "var(--home-ink-muted)" }}>
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
          <p className="home-kicker mb-0">Value by team</p>
          <div className="grid gap-2">
            {rankedTeams.map((team) => (
              <div
                key={`team-value-${team.teamNumber}`}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-3xl)] border px-4 py-3"
                style={PANEL_TILE_STYLE}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {getTeamName(team.teamNumber)}
                    {team.teamNumber === userTeamNumber ? " (you)" : ""}
                  </p>
                  {team.weaknesses.length > 0 && (
                    <p className="mt-1 truncate text-xs" style={{ color: "var(--home-ink-muted)" }}>
                      Still thin at {team.weaknesses.join(", ")}
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
                  <span
                    className={FANTASY_CHIP_CLASS}
                    title="Grade ranks this team's net draft value against the rest of the room"
                    style={{
                      borderColor: "var(--home-rule)",
                      background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
                    }}
                  >
                    {team.overallGrade}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {userAssessment && userAssessment.strengths.length > 0 && (
            <p className="text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
              Your roster runs deep at {userAssessment.strengths.join(", ")}.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
