import type {
  BestBallContestPreset,
  BestBallRosterAnalysis,
} from "@/lib/bestBall/types";
import type { BestBallDraftPick } from "./best-ball-draft-state";
import { DraftValuePanel, type ExpectedReturnFormState } from "@/components/fantasy";
import type { DraftValueReport } from "@/lib/fantasyTeamValue";

const POSITIONS = ["QB", "RB", "WR", "TE"] as const;

const PANEL_TILE_STYLE = {
  borderColor: "var(--home-rule)",
  background: "color-mix(in srgb, var(--home-paper-alt) 62%, var(--home-elev-mix))",
} as const;

function targetTone(drafted: number, minimum: number, maximum: number): string {
  if (drafted > maximum) return "var(--home-negative)";
  if (drafted >= minimum) return "var(--home-positive)";
  return "var(--home-ink-muted)";
}

export function BestBallBuildPanel({
  analysis,
  preset,
  userPicks,
  currentPick,
  nextUserPick,
  totalPicks,
  draftValue,
  week17Available,
  draftValueUnavailableReason,
  calculatorValue,
  onCalculatorChange,
  headingId,
}: {
  analysis: BestBallRosterAnalysis;
  preset: BestBallContestPreset;
  userPicks: readonly BestBallDraftPick[];
  currentPick: number;
  nextUserPick: number | null;
  totalPicks: number;
  draftValue: DraftValueReport | null;
  week17Available: boolean;
  draftValueUnavailableReason?: string | null;
  calculatorValue: ExpectedReturnFormState;
  onCalculatorChange: (value: ExpectedReturnFormState) => void;
  headingId: string;
}) {
  const completion = Math.min(100, Math.round((currentPick - 1) / totalPicks * 100));
  const usesWeek17Correlation =
    preset.strategyProfileId === "standard-tournament";

  return (
    <div className="grid gap-4">
      <div>
        <p className="home-kicker mb-1">My build</p>
        <h2 id={headingId} className="text-2xl font-semibold">
          {userPicks.length} of {preset.rosterSize} players
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
          {nextUserPick
            ? `Your next pick is ${nextUserPick}. The room is ${completion}% complete.`
            : "Your roster is complete."}
        </p>
      </div>

      <div>
        <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--home-stone)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${completion}%`, background: "var(--home-signal)" }}
            role="progressbar"
            aria-label="Draft room completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completion}
          />
        </div>
      </div>

      <div className="border-t pt-4" style={{ borderColor: "var(--home-rule)" }}>
        <DraftValuePanel
          report={draftValue}
          unavailableReason={draftValueUnavailableReason}
          headingId={`${headingId}-draft-outlook`}
          economics={preset.economics}
          economicsSourceUrl={preset.economics?.sourceUrl}
          defaultEntryCost={preset.economics?.entryFee}
          calculatorValue={calculatorValue}
          onCalculatorChange={onCalculatorChange}
        />
      </div>

      <section aria-labelledby={`${headingId}-targets`}>
        <h3 id={`${headingId}-targets`} className="text-sm font-semibold">
          Roster targets that update
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {POSITIONS.map((position) => {
            const target = analysis.targets.targets[position];
            return (
              <div
                key={position}
                className="rounded-[var(--radius-2xl)] border px-3 py-3"
                style={PANEL_TILE_STYLE}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{position}</span>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: targetTone(target.drafted, target.minimum, target.maximum) }}
                  >
                    {target.drafted} / {target.recommended}
                  </span>
                </div>
                <p className="mt-1 text-2xs" style={{ color: "var(--home-ink-muted)" }}>
                  Range {target.minimum} to {target.maximum}
                </p>
                <p className="mt-2 text-2xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
                  {target.reason}
                </p>
              </div>
            );
          })}
        </div>
        {analysis.targets.reasons.length > 0 ? (
          <ul className="mt-3 grid gap-1 text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
            {analysis.targets.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby={`${headingId}-connections`}>
        <h3 id={`${headingId}-connections`} className="text-sm font-semibold">
          Stack connections
        </h3>
        {analysis.stacks.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {analysis.stacks.slice(0, 4).map((stack) => (
              <div
                key={stack.team}
                className="rounded-[var(--radius-2xl)] border px-3 py-3 text-xs leading-5"
                style={PANEL_TILE_STYLE}
              >
                <span className="font-semibold">{stack.team}</span>{" "}
                <span style={{ color: "var(--home-ink-muted)" }}>
                  {stack.quarterbacks.map((player) => player.name).join(", ")} with{" "}
                  {stack.passCatchers.map((player) => player.name).join(", ")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
            A quarterback paired with one of his pass catchers will appear here.
          </p>
        )}
      </section>

      <section aria-labelledby={`${headingId}-coverage`}>
        <h3 id={`${headingId}-coverage`} className="text-sm font-semibold">
          Bye week coverage
        </h3>
        {analysis.byeConflicts.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {analysis.byeConflicts.slice(0, 3).map((conflict) => (
              <div
                key={conflict.byeWeek}
                className="rounded-[var(--radius-2xl)] border px-3 py-3 text-xs leading-5"
                style={{
                  ...PANEL_TILE_STYLE,
                  borderColor: "color-mix(in srgb, var(--home-warning) 45%, var(--home-rule))",
                }}
              >
                <span className="font-semibold">Week {conflict.byeWeek}</span>{" "}
                <span style={{ color: "var(--home-ink-muted)" }}>
                  {conflict.count} players, including{" "}
                  {conflict.players.slice(0, 3).map((player) => player.name).join(", ")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
            No bye overlap is showing yet.
          </p>
        )}
      </section>

      <section aria-labelledby={`${headingId}-week17`}>
        <h3 id={`${headingId}-week17`} className="text-sm font-semibold">
          Week 17 correlation
        </h3>
        {usesWeek17Correlation && !week17Available ? (
          <p className="mt-2 text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
            Week 17 guidance is paused until the published schedule refreshes.
          </p>
        ) : usesWeek17Correlation && analysis.week17Pairs.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {analysis.week17Pairs.slice(0, 3).map((pair) => (
              <div
                key={pair.teams.join("-")}
                className="rounded-[var(--radius-2xl)] border px-3 py-3 text-xs leading-5"
                style={PANEL_TILE_STYLE}
              >
                <span className="font-semibold">{pair.teams.join(" vs ")}</span>
                <p className="mt-1" style={{ color: "var(--home-ink-muted)" }}>
                  {pair.teams
                    .flatMap((team) => pair.playersByTeam[team] ?? [])
                    .map((player) => player.name)
                    .join(", ")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
            {usesWeek17Correlation
              ? "Use this as a close call tiebreaker after the main roster needs are covered."
              : "This contest profile does not add a separate Week 17 opponent adjustment."}
          </p>
        )}
      </section>

      <section aria-labelledby={`${headingId}-roster`}>
        <h3 id={`${headingId}-roster`} className="text-sm font-semibold">
          Roster
        </h3>
        {userPicks.length > 0 ? (
          <ol className="mt-2 grid gap-2">
            {[...userPicks].reverse().map((pick) => (
              <li
                key={pick.pickNumber}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-2xl)] border px-3 py-3 text-xs"
                style={PANEL_TILE_STYLE}
              >
                <span className="min-w-0 truncate font-semibold">{pick.player.name}</span>
                <span className="shrink-0 tabular-nums" style={{ color: "var(--home-ink-muted)" }}>
                  {pick.player.position} {pick.pickNumber}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
            Your selections will appear here as you log the room.
          </p>
        )}
      </section>
    </div>
  );
}
