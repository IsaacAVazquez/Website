"use client";

import { ProjectWorkspace } from "@/components/ProjectWorkspace";
import { effectiveResult } from "@/lib/scorePools/poolAnalysis";
import { scoreReviewedPick } from "@/lib/scorePools/pickReview";
import type { StoredPool } from "@/lib/scorePools/persistence";
import type { ScorePoolLeagueSnapshot } from "@/types/scorePools";
import { formatScoreline } from "./score-pools-ui";

export function PickReview({
  pool,
  league,
}: {
  pool: StoredPool;
  league: ScorePoolLeagueSnapshot;
}) {
  const rows = Object.entries(pool.submissions);
  const reviewed = rows.filter(([, pick]) => pick.review);
  const missing = rows.length - reviewed.length;
  return (
    <ProjectWorkspace
      id="pick-review"
      title="Review saved recommendations"
      description="Compare your pick with the recommendation and alternatives recorded when you saved it. Points here use the rules saved with that pick, which can differ from the tracker after you change settings."
    >
      {!reviewed.length && (
        <p className="pw-note">
          No pre-match recommendations recorded yet. Save picks on the pick
          sheet before they lock to start a review history.
        </p>
      )}
      {missing > 0 && (
        <p className="pw-note">
          {missing} saved {missing === 1 ? "pick has" : "picks have"} no
          pre-match reading. Picks saved after the match locked, or before this review
          existed, are not measured.
        </p>
      )}
      <ul className="pw-list">
        {reviewed.map(([id, submission]) => {
          const review = submission.review!;
          const fixture = league.fixtures.find((game) => game.id === id);
          const result = fixture ? effectiveResult(fixture, pool) : null;
          const scores = result
            ? scoreReviewedPick(submission.score, result, review)
            : null;
          return (
            <li key={id}>
              <h3>
                {fixture
                  ? `${fixture.homeTeam} vs ${fixture.awayTeam}`
                  : `${id} (not in the current snapshot)`}
              </h3>
              <p>
                Your pick {formatScoreline(submission.score)} ·{" "}
                {scores ? `${scores.chosen} points` : "Waiting for a result"}
              </p>
              <p className="pw-note">
                Recorded {review.recordedAt} · source snapshot {review.sourceAt}{" "}
                ·{" "}
                {review.rules.basis === "ninetyMinutes"
                  ? "90-minute result"
                  : "Final result"}{" "}
                · exact / difference / outcome points {review.rules.exact} /{" "}
                {review.rules.correctDifference} / {review.rules.correctOutcome}
                {review.rules.penaltiesCountAsWin
                  ? " · shootout winner counts"
                  : ""}
              </p>
              <div
                className="pw-scroll"
                tabIndex={0}
                role="region"
                aria-label={`Saved alternatives for ${fixture?.homeTeam ?? id}`}
              >
                <table className="pw-table">
                  <caption>Choices available at save time</caption>
                  <thead>
                    <tr>
                      <th scope="col">Choice</th>
                      <th scope="col">Scoreline</th>
                      <th scope="col">Expected points then</th>
                      <th scope="col">Actual points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[review.recommended, ...review.alternatives].map(
                      (choice, i) => (
                        <tr key={choice.label}>
                          <th scope="row">{choice.label}</th>
                          <td>{formatScoreline(choice.score)}</td>
                          <td>{choice.expectedPoints.toFixed(2)}</td>
                          <td>{scores?.choices[i].points ?? "Pending"}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
              {review.odds && (
                <p className="pw-note">
                  Saved decimal odds · home {review.odds.moneyline.home}, draw{" "}
                  {review.odds.moneyline.draw ?? "unquoted"}, away{" "}
                  {review.odds.moneyline.away}; totals{" "}
                  {review.odds.totals
                    ? `${review.odds.totals.line}, over ${review.odds.totals.over ?? "unquoted"}, under ${review.odds.totals.under ?? "unquoted"}`
                    : "unquoted"}{" "}
                  ·{" "}
                  {review.odds.manual
                    ? "entered by hand"
                    : (review.odds.bookmaker ?? "Published market")}{" "}
                  · {review.odds.fetchedAt}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {reviewed.length > 0 && (
        <p className="pw-note">
          These results describe the recorded picks. A small set of matches
          cannot establish prediction accuracy or a betting advantage. Provider
          corrections can change the actual points.
        </p>
      )}
    </ProjectWorkspace>
  );
}
