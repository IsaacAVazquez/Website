import type { CSSProperties } from "react";
import { positionClass } from "@/components/fantasy/positionClass";
import type {
  BestBallContestPreset,
  BestBallRosterAnalysis,
} from "@/lib/bestBall/types";
import type { BestBallDraftPick } from "./best-ball-draft-state";

const POSITIONS = ["QB", "RB", "WR", "TE"] as const;

/**
 * Where a position stands against its range, as a word and a status ink. The
 * count beside it never carries the reading by colour alone.
 */
function targetStatus(
  drafted: number,
  minimum: number,
  maximum: number
): { word: string; tone: string } {
  if (drafted > maximum) return { word: `over by ${drafted - maximum}`, tone: "ffb-bad" };
  if (drafted >= minimum) return { word: "in range", tone: "ffb-good" };
  return { word: `${minimum - drafted} short`, tone: "ffb-muted" };
}

/**
 * My build: the count, then roster targets, stacks, byes, Week 17 pairs, and
 * the roster, each a ruled list. Best ball has no lineup slots, so this is the
 * room's own block and not the shared roster. It renders in the rail and in
 * the phone's build sheet, under a different heading id in each.
 */
export function BestBallBuildPanel({
  analysis,
  preset,
  userPicks,
  currentPick,
  totalPicks,
  week17Available,
  headingId,
}: {
  analysis: BestBallRosterAnalysis;
  preset: BestBallContestPreset;
  userPicks: readonly BestBallDraftPick[];
  currentPick: number;
  totalPicks: number;
  week17Available: boolean;
  headingId: string;
}) {
  const completion = Math.min(100, Math.round((currentPick - 1) / totalPicks * 100));
  const usesWeek17Correlation =
    preset.strategyProfileId === "standard-tournament";
  // A reason that already prints beside its position does not print again under the four.
  const otherReasons = analysis.targets.reasons.filter(
    (reason) => !POSITIONS.some((position) => analysis.targets.targets[position].reason === reason)
  );

  return (
    <div className="ffb-br-build">
      <div>
        {/* The heading is the count, which is the name the build sheet's dialog takes. */}
        <div className="ffb-sechead">
          <span className="ffb-h3">My build</span>{" "}
          <h2 id={headingId} className="ffb-sechead-note">
            {userPicks.length} of {preset.rosterSize} players
          </h2>
        </div>
        <p className="ffb-fine">The room is {completion}% complete.</p>
        <span
          className="ffb-meter ffb-br-progress"
          style={{ "--ffb-value": `${completion}%` } as CSSProperties}
          role="progressbar"
          aria-label="Draft room completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completion}
        />
      </div>

      <section aria-labelledby={`${headingId}-targets`}>
        <div className="ffb-sechead">
          <h3 id={`${headingId}-targets`} className="ffb-h3">
            Roster targets that update
          </h3>
        </div>
        <dl className="ffb-facts ffb-facts-sm">
          {POSITIONS.map((position) => {
            const target = analysis.targets.targets[position];
            const status = targetStatus(target.drafted, target.minimum, target.maximum);
            return (
              <div key={position} className="ffb-fact">
                <dt>
                  <span className={`ffb-chip ffb-chip-sm ${positionClass(position)}`}>{position}</span>
                </dt>
                <dd>
                  {target.drafted} / {target.recommended}
                </dd>
                <dd className="ffb-fact-note">
                  Range {target.minimum} to {target.maximum}, <span className={status.tone}>{status.word}</span>.{" "}
                  {target.reason}
                </dd>
              </div>
            );
          })}
        </dl>
        {otherReasons.length > 0 ? (
          <ul className="ffb-br-list ffb-fact-foot">
            {otherReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby={`${headingId}-connections`}>
        <div className="ffb-sechead">
          <h3 id={`${headingId}-connections`} className="ffb-h3">
            Stack connections
          </h3>
        </div>
        {analysis.stacks.length > 0 ? (
          <ul className="ffb-br-list">
            {analysis.stacks.slice(0, 4).map((stack) => (
              <li key={stack.team}>
                <span className="ffb-label">{stack.team}</span>{" "}
                <span className="ffb-muted">
                  {stack.quarterbacks.map((player) => player.name).join(", ")} with{" "}
                  {stack.passCatchers.map((player) => player.name).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ffb-fine">
            A quarterback paired with one of his pass catchers will appear here.
          </p>
        )}
      </section>

      <section aria-labelledby={`${headingId}-coverage`}>
        <div className="ffb-sechead">
          <h3 id={`${headingId}-coverage`} className="ffb-h3">
            Bye week coverage
          </h3>
        </div>
        {analysis.byeConflicts.length > 0 ? (
          <ul className="ffb-br-list">
            {analysis.byeConflicts.slice(0, 3).map((conflict) => (
              <li key={conflict.byeWeek}>
                <span className="ffb-label ffb-warn">Week {conflict.byeWeek} overlap</span>{" "}
                <span className="ffb-muted">
                  {conflict.count} players, including{" "}
                  {conflict.players.slice(0, 3).map((player) => player.name).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ffb-fine">No bye overlap is showing yet.</p>
        )}
      </section>

      <section aria-labelledby={`${headingId}-week17`}>
        <div className="ffb-sechead">
          <h3 id={`${headingId}-week17`} className="ffb-h3">
            Week 17 correlation
          </h3>
        </div>
        {usesWeek17Correlation && !week17Available ? (
          <p className="ffb-fine">
            Week 17 guidance is paused until the published schedule refreshes.
          </p>
        ) : usesWeek17Correlation && analysis.week17Pairs.length > 0 ? (
          <ul className="ffb-br-list">
            {analysis.week17Pairs.slice(0, 3).map((pair) => (
              <li key={pair.teams.join("-")}>
                <span className="ffb-label">{pair.teams.join(" vs ")}</span>{" "}
                <span className="ffb-muted">
                  {pair.teams
                    .flatMap((team) => pair.playersByTeam[team] ?? [])
                    .map((player) => player.name)
                    .join(", ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ffb-fine">
            {usesWeek17Correlation
              ? "Use this as a close call tiebreaker after the main roster needs are covered."
              : "This contest profile does not add a separate Week 17 opponent adjustment."}
          </p>
        )}
      </section>

      <section aria-labelledby={`${headingId}-roster`}>
        <div className="ffb-sechead">
          <h3 id={`${headingId}-roster`} className="ffb-h3">
            Roster
          </h3>
        </div>
        {userPicks.length > 0 ? (
          <ol className="ffb-br-list ffb-br-roster">
            {[...userPicks].reverse().map((pick) => (
              <li key={pick.pickNumber}>
                <span className={`ffb-chip ffb-chip-sm ${positionClass(pick.player.position)}`.trimEnd()}>
                  {pick.player.position}
                </span>
                <span className="ffb-br-roster-name">{pick.player.name}</span>
                <span className="ffb-muted">
                  {pick.player.team} · Pick {pick.pickNumber}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="ffb-fine">Your selections will appear here as you log the room.</p>
        )}
      </section>
    </div>
  );
}
