import { SOURCE_META, type NewsFeedId } from "@/lib/news-pulse-sources";
import type { TopicCluster } from "@/lib/news-pulse-utils";
import { coverageMatrix, leadStory, type StoryCluster } from "./front-page";

interface NewsFrontPageProps {
  clusters: StoryCluster[];
  topics: TopicCluster[];
  outlets: NewsFeedId[];
  dateline: string;
}

/**
 * The route's signature: the day's biggest cross-outlet story, each outlet's
 * own headline for it, and a coverage matrix of outlet against topic. When
 * the pull has no cross-outlet story yet, it says so instead of rendering an
 * empty front page.
 */
export function NewsFrontPage({ clusters, topics, outlets, dateline }: NewsFrontPageProps) {
  const lead = leadStory(clusters);
  const matrix = coverageMatrix(topics, outlets);

  return (
    <div>
      <p className="c97-meta">Front page · pulled {dateline}</p>

      {lead ? (
        <div style={{ marginTop: "var(--c97-sp-3)" }}>
          <h2 className="c97-serif c97-h2">{lead.representative.title}</h2>
          <ul className="c97-news-lead-outlets">
            {lead.articles.map((article) => (
              <li key={`${article.source}-${article.link}`}>
                <span
                  className="c97-chip"
                  style={{
                    background: `color-mix(in srgb, ${article.sourceColor} 30%, var(--c97-surface))`,
                    color: "var(--c97-ink)",
                  }}
                >
                  {article.sourceName}
                </span>
                <a href={article.link} target="_blank" rel="noopener noreferrer">
                  {article.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="c97-meta" style={{ marginTop: "var(--c97-sp-3)" }}>
          No cross-outlet story yet in this pull.
        </p>
      )}

      {matrix.topics.length > 0 ? (
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Coverage by outlet and topic (scrollable)"
          tabIndex={0}
          style={{ marginTop: "var(--c97-sp-5)" }}
        >
          <table className="c97-table c97-news-coverage-matrix" style={{ minWidth: "560px" }}>
            <caption className="c97-kicker" style={{ textAlign: "left", marginBottom: "var(--c97-sp-2)" }}>
              Coverage by outlet and topic
            </caption>
            <thead>
              <tr>
                <th scope="col">Outlet</th>
                {matrix.topics.map((topic) => (
                  <th key={topic} scope="col">
                    {topic}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row) => (
                <tr key={row.outlet}>
                  <th scope="row">{SOURCE_META[row.outlet].name}</th>
                  {row.counts.map((count, index) => {
                    const intensity = matrix.max > 0 ? count / matrix.max : 0;
                    return (
                      <td key={matrix.topics[index]}>
                        {count > 0 ? (
                          <span className="c97-news-coverage-cell">
                            <span
                              className="c97-news-coverage-fill"
                              style={{ opacity: Math.max(0.15, intensity) }}
                              aria-hidden="true"
                            />
                            <span className="c97-mono c97-news-coverage-count">
                              {count}
                            </span>
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
