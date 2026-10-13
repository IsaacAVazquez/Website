"use client";

import type { DraftAnalytics, DraftPick } from "@/types";
import {
  getEmergingRun,
  getLiveDraftSignals,
  getPickDelta,
} from "@/lib/draftAnalytics";
import { positionClass } from "@/components/fantasy/positionClass";

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

/** One flagged pick: the player, his position, the signed delta with its word, and where he went. */
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
    <div className="ffb-entry">
      <div className="ffb-entry-line">
        <span className={`ffb-chip ffb-chip-sm ${positionClass(pick.player.position)}`.trimEnd()}>
          {pick.player.position}
        </span>
        <p className="ffb-h4">{pick.player.name}</p>
        <span className={`ffb-badge ${label === "Steal" ? "ffb-good" : "ffb-warn"}`}>
          {label} {formatDelta(delta)}
        </span>
      </div>
      <p className="ffb-entry-note">
        {teamName} · Pick {pick.pickNumber} · Round {pick.round}
      </p>
    </div>
  );
}

/**
 * Live sidebar card while the draft runs, full summary once it completes.
 * Every number measures pick position against a pre-draft baseline, so it is a
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
      <section aria-labelledby="draft-signals-heading">
        <div className="ffb-sechead">
          <h3 id="draft-signals-heading" className="ffb-h3">
            Draft signals
          </h3>
        </div>
        <div className="ffb-stack ffb-stack-tight">
          {latestFlaggedPick === null && activeRun === null && !showEmerging ? (
            <p className="ffb-entry-note">
              Nothing unusual yet. Steals, reaches, and position runs show up here as picks come in.
            </p>
          ) : (
            <div className="ffb-entries">
              {latestFlaggedPick && (
                <PickValueRow
                  pick={latestFlaggedPick.pick}
                  label={latestFlaggedPick.kind === "steal" ? "Steal" : "Reach"}
                  teamName={getTeamName(latestFlaggedPick.pick.teamNumber)}
                />
              )}
              {activeRun && (
                <div className="ffb-entry">
                  <p className="ffb-h4">{activeRun.position} run in progress</p>
                  <p className="ffb-entry-note">
                    {activeRun.playersSelected} {activeRun.position}s gone since pick{" "}
                    {activeRun.startPick}. The run changes likely availability, but it does not make
                    a reach worthwhile on its own.
                  </p>
                </div>
              )}
              {showEmerging && emergingRun && (
                <div className="ffb-entry">
                  <p className="ffb-h4">{emergingRun.position}s starting to go</p>
                  <p className="ffb-entry-note">
                    {emergingRun.count} went in the last few picks. Compare the next options inside
                    their current tier before changing your plan.
                  </p>
                </div>
              )}
            </div>
          )}
          <p className="ffb-method">{describeBaseline(adpAvailable, adpUnavailableReason)}</p>
        </div>
      </section>
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
    <section className="ffb-dt-recap" aria-labelledby="draft-room-recap-heading">
      <div className="ffb-sechead ffb-sechead-lg">
        <h2 id="draft-room-recap-heading" className="ffb-h2">
          How the room drafted
        </h2>
      </div>
      <p className="ffb-prose">
        {describeBaseline(adpAvailable, adpUnavailableReason)} A positive total means a team kept landing players past
        where the market expected them to go. None of it predicts the season. It only summarizes
        market-price discipline. Draft Outlook is the separate room ranking because it also includes
        roster and lineup structure.
      </p>

      <div className="ffb-columns">
        <div className="ffb-stack">
          <div>
            <div className="ffb-sechead">
              <h3 className="ffb-h3">Biggest steal</h3>
            </div>
            {biggestSteal ? (
              <PickValueRow pick={biggestSteal} label="Steal" teamName={getTeamName(biggestSteal.teamNumber)} />
            ) : (
              <p className="ffb-entry-note">No pick beat its baseline by enough to count.</p>
            )}
          </div>

          <div>
            <div className="ffb-sechead">
              <h3 className="ffb-h3">Biggest reach</h3>
            </div>
            {biggestReach ? (
              <PickValueRow pick={biggestReach} label="Reach" teamName={getTeamName(biggestReach.teamNumber)} />
            ) : (
              <p className="ffb-entry-note">
                Nobody jumped a player far enough ahead of his baseline to count.
              </p>
            )}
          </div>

          {analytics.positionRunAnalysis.length > 0 && (
            <div>
              <div className="ffb-sechead">
                <h3 className="ffb-h3">Position runs</h3>
              </div>
              <ul className="ffb-entries">
                {analytics.positionRunAnalysis.map((run) => (
                  <li key={`run-${run.position}-${run.startPick ?? run.startRound}`} className="ffb-entry">
                    <p>
                      <span className="ffb-h4">{run.position} run</span>
                      <span className="ffb-muted">
                        {", "}
                        {run.playersSelected} picks
                        {run.startPick && run.endPick
                          ? ` between #${run.startPick} and #${run.endPick}`
                          : ` from round ${run.startRound} to ${run.endRound}`}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <div className="ffb-sechead">
            <h3 className="ffb-h3">Market value by team</h3>
          </div>
          <dl className="ffb-facts ffb-facts-sm">
            {rankedTeams.map((team) => (
              <div key={`team-value-${team.teamNumber}`} className="ffb-fact">
                <dt>
                  {getTeamName(team.teamNumber)}
                  {team.teamNumber === userTeamNumber ? " (you)" : ""}
                </dt>
                <dd className={(team.valueTotal ?? 0) >= 0 ? "ffb-good" : "ffb-warn"}>
                  {formatDelta(team.valueTotal ?? 0)}
                </dd>
                {team.weaknesses.length > 0 && (
                  <dd className="ffb-fact-note">Open starting slots at {team.weaknesses.join(", ")}</dd>
                )}
              </div>
            ))}
          </dl>

          {userAssessment && userAssessment.strengths.length > 0 && (
            <p className="ffb-fact-foot">Your roster runs deep at {userAssessment.strengths.join(", ")}.</p>
          )}
        </div>
      </div>
    </section>
  );
}
