import { positionClass } from "@/components/fantasy/positionClass";
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
  tierScarcity: "Positional scarcity",
  byeRisk: "Bye overlap",
  concentrationRisk: "Team concentration",
  spikeWeek: "Weekly projection spread",
};

// Below this a component rounds to "0" at one decimal, so it moved nothing a
// reader could see. Shared so the filter and the number formatter cannot
// drift apart and start hiding a value that would have printed.
const SCORE_EPSILON = 0.05;

function formatScore(value: number): string {
  if (Math.abs(value) < SCORE_EPSILON) return "0";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

export function BestBallRecommendations({
  recommendations,
  isUserPick,
  isComplete,
  adpAvailable,
  recommendationMode,
  recommendationReason,
  sourceIssue,
  onDraftPlayer,
  onOpenDetail,
}: {
  recommendations: readonly BestBallRecommendation[];
  isUserPick: boolean;
  isComplete: boolean;
  adpAvailable: boolean;
  recommendationMode: BestBallRecommendationMode;
  recommendationReason: string;
  sourceIssue: string | null;
  onDraftPlayer: (player: Player) => void;
  onOpenDetail: (player: Player) => void;
}) {
  const headingId = "best-ball-recommendations-heading";
  const heading =
    recommendationMode === "exact" ? "Best fits for your next pick" : "Board and roster guidance";
  const fitsLive =
    recommendationMode === "exact" &&
    sourceIssue === null &&
    isUserPick &&
    !isComplete &&
    recommendations.length > 0;

  // Your pick, with a usable source. This is the one state that puts a score
  // on screen, so it is the one state that prints the paragraph explaining the
  // score (protected framing since the 2026-08-23 loop: Draft Outlook explains
  // a different score, so both stay).
  if (fitsLive) {
    return (
      <section aria-labelledby={headingId} className="ffb-br-fits">
        <div className="ffb-strip-head">
          <h2 id={headingId} className="ffb-turn-tab">
            {heading}
          </h2>
        </div>
        {/*
          The reasons under each fit print the consensus rank as fact. Rows the
          ranking layer marks `consensusWithheld` never reach this branch,
          because the same self-consistency test that stamps them also sets
          `sourceIssue`.
        */}
        <div className="ffb-strip">
          {recommendations.map((recommendation, index) => {
            const { player } = recommendation;
            // Most of the nine components score zero for any one player, so
            // only the ones that moved the number print. "Why this player"
            // carries the full reasoning.
            const componentScores = (
              Object.entries(recommendation.components) as Array<
                [keyof BestBallRecommendation["components"], number]
              >
            ).filter(([, score]) => Math.abs(score) >= SCORE_EPSILON);

            return (
              <article key={player.id} className="ffb-strip-item ffb-br-fit">
                <div className="ffb-strip-line">
                  <span className={`ffb-chip ${positionClass(player.position)}`.trimEnd()}>
                    {player.position}
                    {player.positionRank ?? ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(player)}
                    aria-label={`Open ${player.name} detail`}
                    title={player.name}
                    className="ffb-c-name"
                  >
                    {player.name}
                  </button>
                  <span className="ffb-br-fit-score">
                    <span className="ffb-label ffb-muted">Score</span>{" "}
                    <span className="ffb-heavy">{recommendation.score.toFixed(1)}</span>
                  </span>
                </div>
                <p className="ffb-strip-note">
                  {player.team}
                  {adpAvailable
                    ? ` · ADP ${player.adp?.toFixed(1) ?? "not available"}`
                    : " · Matching ADP not sourced"}
                </p>

                {componentScores.length > 0 ? (
                  <dl className="ffb-pairs">
                    {componentScores.map(([component, score]) => (
                      <div key={component}>
                        <dt>
                          {component === "adpValue" && !adpAvailable
                            ? "Market ADP"
                            : COMPONENT_LABELS[component]}
                        </dt>
                        <dd className={score < 0 ? "ffb-bad" : undefined}>{formatScore(score)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                <details className="ffb-details">
                  <summary>Why this player</summary>
                  <ul className="ffb-details-body ffb-fine ffb-br-fit-why">
                    {recommendation.reasons.map((reason) => (
                      <li key={`${reason.component}-${reason.detail}`}>{reason.detail}</li>
                    ))}
                  </ul>
                </details>

                {/* The top fit is the action that is mine to take now, so it alone takes the highlighter. */}
                <button
                  type="button"
                  onClick={() => onDraftPlayer(player)}
                  className={index === 0 ? "ffb-btn ffb-btn-now ffb-btn-block" : "ffb-btn ffb-btn-block"}
                >
                  Log for my team
                </button>
              </article>
            );
          })}
        </div>
        <p data-testid="best-ball-score-explainer" className="ffb-method ffb-br-recnote">
          The score starts from how far the current pick sits past a player&apos;s expert consensus rank, then moves half a point for every pick the Underdog market disagrees with that rank, so consensus and market count the same. At most seven points of roster, scarcity, and correlation adjustments follow, where scarcity reads both the tier cliff and how many board spots the position gives up by waiting a turn. The consensus board is full PPR while these contests score half PPR. This is not a projected win rate.
        </p>
      </section>
    );
  }

  // Every other state is one short block that says why no fit is on screen.
  return (
    <section aria-labelledby={headingId} className="ffb-br-recline">
      <div className="ffb-sechead">
        <h2 id={headingId} className="ffb-h3">
          {heading}
        </h2>
      </div>
      {recommendationMode === "reference" ? (
        <div role="note" className="ffb-notice">
          <p className="ffb-notice-title">Reference guidance only</p>
          <p>
            {recommendationReason} Use the board and roster targets to plan the position or tier you
            want next.
          </p>
          <p data-testid="best-ball-score-explainer">
            The sourced board and roster targets remain available, but this preset does not produce exact player cards.
          </p>
        </div>
      ) : sourceIssue ? (
        // The pause is stated once, as the alert at the top of the page. This
        // line says what this part cannot do because of it, so it is a held
        // notice and not a second alert.
        <p className="ffb-notice ffb-notice-held">
          Exact player cards are unavailable because {sourceIssue}. The room can still log picks,
          but it will not present an unsupported board as a current recommendation.
        </p>
      ) : isComplete ? (
        <p className="ffb-copy">The draft is complete, so there is no next pick to fit.</p>
      ) : !isUserPick ? (
        <p className="ffb-copy">
          Exact player cards stay hidden until your turn because this model does not estimate the
          chance that each player survives the intervening picks. Use the board and roster targets
          to plan the position or tier you want next.
        </p>
      ) : (
        <p className="ffb-copy">Recommendations will appear when the room has available players.</p>
      )}
    </section>
  );
}
