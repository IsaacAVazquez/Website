import { editionChanges, readAgentEditions } from "@/lib/agentEditions";
import type { AgentEdition } from "@/lib/agentEditions";

export function WeeklyEditions({ editions }: { editions: AgentEdition[] }) {
  const rows = readAgentEditions(editions);
  return (
    <section className="abi-ranking" aria-labelledby="weekly-editions-heading">
      <div className="abi-section-head">
        <h2 id="weekly-editions-heading" className="abi-h2">
          Weekly editions
        </h2>
      </div>
      <p className="abi-note">
        Each edition keeps the last successful observation from its UTC week,
        beginning Monday. This week can change until the next week begins. The
        archive keeps 52 editions, starting with the first week this site actually
        recorded.
      </p>
      {!rows.length && (
        <p className="abi-note">
          The archive starts with the next successful agent snapshot.
        </p>
      )}
      {rows.map((edition, i) => {
        const previous = rows[i + 1];
        const changes = previous ? editionChanges(edition, previous) : null;
        return (
          <details
            key={edition.weekStart}
            className="abi-edition"
            open={i === 0}
          >
            <summary>
              Week beginning {edition.weekStart} · observed{" "}
              {edition.observedAt.slice(0, 10)} at{" "}
              {edition.observedAt.slice(11, 16)} UTC
            </summary>
            {changes && (
              <p className="abi-note">
                Compared with the week beginning {previous.weekStart}.
                New to this tracked group ·{" "}
                {changes.entrants.map((repo) => repo.fullName).join(", ") ||
                  "None"}
                . No longer in this group ·{" "}
                {changes.departed.map((repo) => repo.fullName).join(", ") ||
                  "None"}
                . A departure can reflect the search window or selection limits.
              </p>
            )}
            <div
              className="abi-archive-scroll"
              role="region"
              tabIndex={0}
              aria-label={`Edition ${edition.weekStart}`}
            >
              <table className="abi-archive-table">
                <caption>Recorded ranking and seven-day star movement</caption>
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Repository</th>
                    <th scope="col">Rank change</th>
                    <th scope="col">7-day stars</th>
                    <th scope="col">Measurement</th>
                    <th scope="col">Total stars</th>
                  </tr>
                </thead>
                <tbody>
                  {edition.repositories.map((repo) => {
                    const prior = previous?.repositories.find(
                      (row) => row.id === repo.id,
                    );
                    const delta = prior ? prior.rank - repo.rank : 0;
                    return (
                      <tr key={repo.id}>
                        <td>{repo.rank}</td>
                        <th scope="row">
                          <a
                            href={`https://github.com/${repo.fullName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {repo.fullName}
                            <span className="sr-only">
                              {" "}
                              (opens on GitHub in a new tab)
                            </span>
                          </a>
                        </th>
                        <td>
                          {!previous
                            ? "First edition"
                            : !prior
                              ? "New to group"
                              : delta > 0
                                ? `Up ${delta}`
                                : delta < 0
                                  ? `Down ${-delta}`
                                  : "Unchanged"}
                        </td>
                        <td>
                          {repo.status === "baseline"
                            ? "Unknown"
                            : repo.weeklyStars.toLocaleString("en-US")}
                        </td>
                        <td>
                          {repo.status === "measured"
                            ? "Full window"
                            : repo.status === "partial"
                              ? "Partial window"
                              : "New baseline"}
                        </td>
                        <td>{repo.stars.toLocaleString("en-US")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        );
      })}
    </section>
  );
}
