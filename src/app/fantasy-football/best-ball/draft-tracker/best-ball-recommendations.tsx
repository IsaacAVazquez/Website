import { ChevronDown } from "lucide-react";
import type {
  BestBallRecommendation,
  BestBallRecommendationMode,
} from "@/lib/bestBall/types";
import type { Player } from "@/types";

const COMPONENT_LABELS: Record<keyof BestBallRecommendation["components"], string> = {
  baseRank: "Board order",
  adpValue: "Underdog ADP",
  rosterNeed: "Roster fit",
  stackSchedule: "Stack",
  gameStack: "Week 17 game stack",
  tierScarcity: "Tier cliff",
  byeRisk: "Bye overlap",
  concentrationRisk: "Team concentration",
  spikeWeek: "Weekly projection spread",
};

// Below this a component rounds to "0" at one decimal, so it moved nothing a
// reader could see. Shared so the chip filter and the number formatter cannot
// drift apart and start hiding a value that would have printed.
const SCORE_EPSILON = 0.05;

function formatScore(value: number): string {
  if (Math.abs(value) < SCORE_EPSILON) return "0";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

export function BestBallRecommendations({
  recommendations,
  isUserPick,
  adpAvailable,
  recommendationMode,
  recommendationReason,
  sourceIssue,
  onDraftPlayer,
}: {
  recommendations: readonly BestBallRecommendation[];
  isUserPick: boolean;
  adpAvailable: boolean;
  recommendationMode: BestBallRecommendationMode;
  recommendationReason: string;
  sourceIssue: string | null;
  onDraftPlayer: (player: Player) => void;
}) {
  const description = recommendationMode === "exact"
    ? "The score starts with current standard Underdog ADP, where one point equals one market pick, then applies at most seven points of roster and correlation adjustments. PPR best ball ECR is a separate reference. This is not a projected win rate."
    : "The sourced board and roster targets remain available, but this preset does not produce exact player cards.";

  return (
    <section className="home-card p-5 sm:p-6" aria-labelledby="best-ball-recommendations-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="home-kicker mb-1">Your next pick</p>
          {/* text-2xl tops out at 34px, exactly where an open room's h1 sits, so this
              would render at its parent's size. text-xl is the step the rest of the room uses. */}
          <h2 id="best-ball-recommendations-heading" className="text-xl font-semibold">
            {recommendationMode === "exact"
              ? "Best fits for your next pick"
              : "Board and roster guidance"}
          </h2>
        </div>
        <p className="max-w-[34ch] text-xs leading-5" style={{ color: "var(--home-ink-muted)" }}>
          {description}
        </p>
      </div>

      {recommendationMode === "reference" ? (
        <div
          role="note"
          className="mt-4 rounded-[var(--radius-2xl)] border px-4 py-3 text-sm leading-6"
          style={{
            borderColor: "var(--home-rule)",
            background: "color-mix(in srgb, var(--home-paper-alt) 58%, var(--home-paper))",
          }}
        >
          <p className="font-semibold">Reference guidance only</p>
          <p className="mt-1" style={{ color: "var(--home-ink-muted)" }}>
            {recommendationReason} Use the board and roster targets to plan the position or tier you
            want next.
          </p>
        </div>
      ) : sourceIssue ? (
        <p
          role="alert"
          className="mt-4 text-sm leading-6"
          style={{ color: "var(--home-negative)" }}
        >
          Exact player cards are unavailable because {sourceIssue}. The room can still log picks,
          but it will not present an unsupported board as a current recommendation.
        </p>
      ) : !isUserPick ? (
        <p className="mt-4 text-sm leading-6" style={{ color: "var(--home-ink-muted)" }}>
          Exact player cards stay hidden until your turn because this model does not estimate the
          chance that each player survives the intervening picks. Use the board and roster targets
          to plan the position or tier you want next.
        </p>
      ) : recommendations.length > 0 ? (
        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          {recommendations.map((recommendation, index) => {
            // All nine components used to print on every card, and most of them
            // score zero for any given player, which buried the two or three
            // that actually moved the number. Only the contributing ones get a
            // chip; "Why this player" below still carries the full reasoning.
            const componentScores = (
              Object.entries(recommendation.components) as Array<
                [keyof BestBallRecommendation["components"], number]
              >
            ).filter(([, score]) => Math.abs(score) >= SCORE_EPSILON);

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
                        : " · Matching ADP not sourced"}
                    </p>
                  </div>
                  {/* The top card's background is a signal-soft wash, where pure signal
                      measures 4.32:1 at 12px. The 72%-toward-ink mix used across the rest
                      of the fantasy surfaces clears AA on both card backgrounds. */}
                  <span
                    className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums"
                    style={{
                      borderColor: "var(--home-rule)",
                      color: "color-mix(in srgb, var(--home-signal) 72%, var(--home-ink))",
                    }}
                  >
                    {recommendation.score.toFixed(1)}
                  </span>
                </div>

                {componentScores.length > 0 ? (
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
                          ? "Market ADP"
                          : COMPONENT_LABELS[component]}{" "}
                        {formatScore(score)}
                      </span>
                    ))}
                  </div>
                ) : null}

                <details className="group mt-3 text-xs leading-5">
                  {/* display:flex strips the native disclosure marker, so the
                      chevron is the explicit sign this label opens. */}
                  <summary className="flex min-h-[44px] cursor-pointer items-center gap-1.5 font-semibold">
                    Why this player
                    <ChevronDown
                      className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                      style={{ color: "var(--home-ink-muted)" }}
                    />
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
