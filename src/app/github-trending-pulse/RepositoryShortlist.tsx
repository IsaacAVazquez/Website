"use client";

import { useState } from "react";
import type { GitHubTrendingClientRepository } from "@/types/githubTrending";
import { useLocalStoragePersistenceStatus } from "@/hooks/useLocalStorageString";
import { REPO_SHORTLIST_KEY } from "./repoShortlist";

export function RepositoryShortlist({
  repositories,
  ids,
  onRemove,
  windowDays,
}: {
  repositories: GitHubTrendingClientRepository[];
  ids: number[];
  onRemove: (id: number) => void;
  windowDays: number;
}) {
  const [comparison, setComparison] = useState<number[] | null>(null);
  const persistence = useLocalStoragePersistenceStatus(REPO_SHORTLIST_KEY);
  const saved = repositories.filter((repo) => ids.includes(repo.id));
  const missing = ids.filter(
    (id) => !repositories.some((repo) => repo.id === id),
  );
  const selected =
    comparison === null
      ? saved.slice(0, 3).map((repo) => repo.id)
      : comparison.filter((id) => ids.includes(id));
  const compared = saved.filter((repo) => selected.includes(repo.id));
  return (
    <section className="gt-shortlist" aria-labelledby="gt-shortlist-title">
      <h2 id="gt-shortlist-title">Your repository shortlist</h2>
      <p className="gt-muted">
        Save repositories from the table, then compare up to four. Your
        shortlist stays in this browser.
      </p>
      {ids.length === 0 ? (
        <p>No repositories saved yet.</p>
      ) : (
        <>
          <ul className="gt-saved-list">
            {saved.map((repo) => (
              <li key={repo.id}>
                <label>
                  <input
                    type="checkbox"
                    aria-label={`Compare ${repo.fullName}`}
                    checked={selected.includes(repo.id)}
                    disabled={
                      !selected.includes(repo.id) && selected.length >= 4
                    }
                    onChange={() =>
                      setComparison(
                        selected.includes(repo.id)
                          ? selected.filter((id) => id !== repo.id)
                          : [...selected, repo.id],
                      )
                    }
                  />
                  {repo.fullName}
                </label>
                <button
                  type="button"
                  className="gt-link"
                  aria-label={`Remove saved ${repo.fullName}`}
                  onClick={() => onRemove(repo.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {missing.map((id) => (
            <p className="gt-muted" key={id}>
              A saved repository is no longer in this snapshot, so its details
              can’t be shown.{" "}
              <button
                type="button"
                className="gt-link"
                aria-label={`Remove saved repository ${id}`}
                onClick={() => onRemove(id)}
              >
                Remove it
              </button>
            </p>
          ))}
          {compared.length > 0 ? (
            <div
              className="gt-scroll"
              role="region"
              aria-label="Repository comparison (scrolls sideways)"
              tabIndex={0}
            >
              <table className="gt-table gt-compare-table">
                <caption className="sr-only">
                  Comparison of saved repositories
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Repository</th>
                    <th scope="col">Star growth</th>
                    <th scope="col">Total stars</th>
                    <th scope="col">Last pushed</th>
                    <th scope="col">License</th>
                  </tr>
                </thead>
                <tbody>
                  {compared.map((repo) => (
                    <tr key={repo.id}>
                      <th scope="row">
                        <a href={repo.url} target="_blank" rel="noreferrer">
                          {repo.fullName}
                        </a>
                      </th>
                      <td>
                        {repo.weeklyStarsStatus === "baseline"
                          ? "New baseline"
                          : `${repo.weeklyStars > 0 ? "+" : ""}${repo.weeklyStars.toLocaleString("en-US")} ${repo.weeklyStarsStatus === "measured" ? `over ${windowDays} days` : `since ${repo.weeklyStarsBaselineDate ?? "an unknown baseline"}`}`}
                      </td>
                      <td>{repo.stars.toLocaleString("en-US")}</td>
                      <td>{repo.pushedAt.slice(0, 10) || "Unknown"}</td>
                      <td>{repo.licenseSpdxId ?? "Not listed"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Check a saved repository to include it in the comparison.</p>
          )}
          <p className="gt-muted">
            Last pushed is the most recent push in the snapshot. Read the
            license itself before relying on it for your use.
          </p>
        </>
      )}
      {persistence === "memory-only" && (
        <p role="status" className="gt-muted">
          Shortlist changes last only while this tab is open because browser
          storage is unavailable.
        </p>
      )}
    </section>
  );
}
