import { SOURCE_META, type NewsFeedId } from "@/lib/news-pulse-sources";
import type { TopicCluster } from "@/lib/news-pulse-utils";
import { coverageMatrix, leadStory, type StoryCluster } from "./front-page";

interface NewsFrontPageProps {
  clusters: StoryCluster[];
  topics: TopicCluster[];
  outlets: NewsFeedId[];
}

const MORE_STORIES = 5;

function outletCounts(cluster: StoryCluster, outlets: NewsFeedId[]): string {
  return outlets
    .filter((source) => (cluster.sources[source] ?? 0) > 0)
    .map((source) => `${SOURCE_META[source].name} ${cluster.sources[source]}`)
    .join(" · ");
}

/**
 * The route's signature, set as a broadsheet front page. The banner is the
 * day's biggest cross-outlet story with each outlet's own headline for it,
 * the next stories run down the right column with their outlet counts, and a
 * coverage matrix of outlet against topic closes the page. When the pull has
 * no cross-outlet story yet, it says so instead of rendering an empty front.
 *
 * Under lg the banner's outlet headlines and the topic coverage each open in
 * place, and the matrix, wider than a phone column, prints as a list by topic.
 */
export function NewsFrontPage({ clusters, topics, outlets }: NewsFrontPageProps) {
  const lead = leadStory(clusters);
  const more = clusters.filter((cluster) => cluster !== lead).slice(0, MORE_STORIES);
  const matrix = coverageMatrix(topics, outlets);

  const leadOutlets = lead ? (
    <ul className="np-lead-outlets">
      {lead.articles.map((article) => (
        <li key={`${article.source}-${article.link}`}>
          <span className="np-outlet">
            <span className="np-swatch" style={{ background: article.sourceColor }} aria-hidden="true" />
            {article.sourceName}
          </span>
          <a href={article.link} target="_blank" rel="noopener noreferrer">
            {article.title}
          </a>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <section className="np-front" aria-label="Front page">
      <div className="np-front-grid">
        <div className="np-lead">
          {lead ? (
            <>
              <p className="np-kicker">
                Lead story · {Object.keys(lead.sources).length} outlets, {lead.totalCount} headlines
              </p>
              <h2 className="np-banner">{lead.representative.title}</h2>
              <div className="np-lg-only">{leadOutlets}</div>
              <details className="np-disclosure np-sm-only">
                {/* The label carries two counts, so it wraps on a narrow column. */}
                <summary>
                  <span data-when="closed">
                    Show {lead.articles.length} headlines from {Object.keys(lead.sources).length} outlets
                  </span>
                  <span data-when="open">Hide the outlet headlines</span>
                </summary>
                {leadOutlets}
              </details>
            </>
          ) : (
            <p className="np-muted">No cross-outlet story yet in this pull.</p>
          )}
        </div>

        {more.length > 0 ? (
          <div className="np-more">
            <h2 className="np-kicker">Also across outlets</h2>
            <ul aria-label="Story clusters" className="np-more-list">
              {more.map((cluster) => (
                <li key={cluster.id}>
                  <a
                    href={cluster.representative.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="np-more-headline"
                  >
                    {cluster.representative.title}
                  </a>
                  <p className="np-muted np-small">
                    {cluster.totalCount} headlines across {Object.keys(cluster.sources).length} outlets.{" "}
                    {outletCounts(cluster, outlets)}
                  </p>
                  <details className="np-disclosure">
                    <summary>
                      <span data-when="closed">Show all {cluster.totalCount} headlines</span>
                      <span data-when="open">Hide the headlines</span>
                    </summary>
                    <ul className="np-cluster-headlines">
                      {cluster.articles.map((article) => (
                        <li key={`${article.source}-${article.link}`}>
                          <span className="np-outlet">{article.sourceName}</span>
                          <a href={article.link} target="_blank" rel="noopener noreferrer">
                            {article.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {matrix.topics.length > 0 ? (
        <>
          <details className="np-disclosure np-sm-only">
            <summary>
              <span data-when="closed">Show coverage by topic</span>
              <span data-when="open">Hide coverage by topic</span>
            </summary>
            <ul aria-label="Coverage by topic" className="np-topic-list">
              {matrix.topics.map((topic, index) => (
                <li key={topic}>
                  <p className="np-kicker">{topic}</p>
                  <p className="np-small">
                    {matrix.rows
                      .filter((row) => row.counts[index] > 0)
                      .map((row) => `${SOURCE_META[row.outlet].name} ${row.counts[index]}`)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </details>

          <div
            className="np-lg-only np-scroll"
            role="region"
            aria-label="Coverage by outlet and topic (scrollable)"
            tabIndex={0}
          >
            <table className="np-table np-matrix">
              <caption className="np-kicker">Coverage by outlet and topic</caption>
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
                            // A square whose opacity carries the count, with the number in ink
                            // beside it, since a number printed on the fill failed contrast.
                            <span className="np-cell">
                              <span
                                className="np-cell-fill"
                                style={{ opacity: Math.max(0.15, intensity) }}
                                aria-hidden="true"
                              />
                              {count}
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
        </>
      ) : null}
    </section>
  );
}
