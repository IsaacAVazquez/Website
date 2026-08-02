import type { BestBallRecommendation } from "@/lib/bestBall/types";
import type { Player } from "@/types";

const COMPONENT_LABELS: Record<keyof BestBallRecommendation["components"], string> = {
  baseRank: "Board order",
  adpValue: "Underdog ADP",
  rosterNeed: "Roster fit",
  stackSchedule: "Stack",
  byeRisk: "Bye overlap",
  concentrationRisk: "Team concentration",
  spikeWeek: "Weekly variance proxy",
};

function formatScore(value: number): string {
  if (Math.abs(value) < 0.05) return "0";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

export function BestBallRecommendations({
  recommendations,
  isUserPick,
  adpAvailable,
  onDraftPlayer,
}: {
  recommendations: readonly BestBallRecommendation[];
  isUserPick: boolean;
  adpAvailable: boolean;
  onDraftPlayer: (player: Player) => void;
}) {
  return (
    <section className="home-card p-5 sm:p-6" aria-labelledby="best-ball-recommendations-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="home-kicker mb-1">Your next pick</p>
          <h2 id="best-ball-recommendations-heading" className="text-2xl font-semibold">
            Best fits for your next pick
          </h2>
        </div>
        <p className="max-w-[34ch] text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
          {adpAvailable
            ? "The board starts with current standard Underdog ADP. The PPR best ball expert consensus ranking, or ECR, is shown as a separate reference. These scores compare the players available now and are not projected win rates."
            : "The source rank is the Superflex consensus order. This snapshot has no separate Superflex ADP, so ADP contributes no score. These scores compare the players available now and are not projected win rates."}
        </p>
      </div>

      {recommendations.length > 0 ? (
        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          {recommendations.map((recommendation, index) => {
            const componentScores = Object.entries(recommendation.components) as Array<
              [keyof BestBallRecommendation["components"], number]
            >;

            return (
              <article
                key={recommendation.player.id}
                className="rounded-[var(--radius-3xl)] border p-4"
                style={{
                  borderColor:
                    index === 0
                      ? "color-mix(in srgb, var(--home-signal) 52%, var(--home-rule))"
                      : "var(--home-rule)",
                  background:
                    index === 0
                      ? "color-mix(in srgb, var(--home-signal-soft) 38%, var(--home-paper))"
                      : "color-mix(in srgb, var(--home-paper-alt) 58%, var(--home-paper))",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{recommendation.player.name}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--home-ink-muted)" }}>
                      {recommendation.player.position} · {recommendation.player.team}
                      {adpAvailable
                        ? ` · ADP ${recommendation.player.adp?.toFixed(1) ?? "not available"}`
                        : " · Superflex ADP not sourced"}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums"
                    style={{ borderColor: "var(--home-rule)", color: "var(--home-signal)" }}
                  >
                    {recommendation.score.toFixed(1)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {componentScores.map(([component, score]) => (
                    <span
                      key={component}
                      className="rounded-full border px-2 py-1 text-2xs font-medium"
                      style={{
                        borderColor: "var(--home-rule)",
                        color: score < 0 ? "var(--home-negative)" : "var(--home-ink-muted)",
                      }}
                    >
                      {component === "adpValue" && !adpAvailable
                        ? "Superflex ADP"
                        : COMPONENT_LABELS[component]}{" "}
                      {formatScore(score)}
                    </span>
                  ))}
                </div>

                <details className="mt-3 text-xs leading-5">
                  <summary className="flex min-h-[44px] cursor-pointer items-center font-semibold">
                    Why this player
                  </summary>
                  <ul className="grid gap-1.5 pb-1" style={{ color: "var(--home-ink-muted)" }}>
                    {recommendation.reasons.map((reason) => (
                      <li key={`${reason.component}-${reason.detail}`}>{reason.detail}</li>
                    ))}
                  </ul>
                </details>

                {isUserPick ? (
                  <button
                    type="button"
                    onClick={() => onDraftPlayer(recommendation.player)}
                    className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
                    style={{
                      borderColor: "var(--home-ink)",
                      background: "var(--home-ink)",
                      color: "var(--home-paper)",
                    }}
                  >
                    Log for my team
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm" style={{ color: "var(--home-ink-muted)" }}>
          Recommendations will appear when the room has available players.
        </p>
      )}
    </section>
  );
}
