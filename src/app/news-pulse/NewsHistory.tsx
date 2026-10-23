"use client";

import { useEffect, useMemo, useState } from "react";
import { SOURCE_META } from "@/lib/news-pulse-sources";
import {
  clusterArticlesByStory,
  type NewsArticle,
} from "@/lib/news-pulse-utils";
import {
  NEWS_HISTORY_DAYS,
  NEWS_LAST_VISIT_KEY,
  newsArticleKey,
  type NewsObservation,
} from "@/lib/newsHistory";
import {
  readBrowserStorageString,
  writeBrowserStorageString,
} from "@/lib/browserStorage";
import {
  DATE_TIME_FORMATTER,
  formatStableDateTime,
} from "@/lib/date-formatters";

const timestamp = (value: string) =>
  formatStableDateTime(DATE_TIME_FORMATTER, new Date(value));

export function NewsHistory({
  history,
  fetchedAt,
}: {
  history: NewsObservation[];
  fetchedAt: string;
}) {
  const [previousVisit, setPreviousVisit] = useState<string | null | undefined>(
    undefined,
  );
  const [onlyNew, setOnlyNew] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  useEffect(() => {
    if (!history.length || !Number.isFinite(Date.parse(fetchedAt))) return;
    const saved = readBrowserStorageString(NEWS_LAST_VISIT_KEY).value;
    if (previousVisit === undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- retain the pre-visit timestamp once after hydration
      setPreviousVisit(
        saved && Number.isFinite(Date.parse(saved)) ? saved : null,
      );
    }
    if (
      !saved ||
      !Number.isFinite(Date.parse(saved)) ||
      Date.parse(saved) < Date.parse(fetchedAt)
    ) {
      writeBrowserStorageString(NEWS_LAST_VISIT_KEY, fetchedAt);
    }
  }, [history.length, fetchedAt, previousVisit]);
  const lookup = useMemo(
    () => new Map(history.map((item) => [newsArticleKey(item), item])),
    [history],
  );
  const changed = (item: NewsObservation) =>
    Boolean(
      previousVisit &&
      item.revisions.some(
        (revision) =>
          Date.parse(revision.observedAt) > Date.parse(previousVisit),
      ),
    );
  const archivedArticles = history.map((item): NewsArticle => ({
    source: item.source,
    sourceName: SOURCE_META[item.source].name,
    sourceColor: SOURCE_META[item.source].color,
    title: item.revisions.at(-1)?.title ?? "",
    link: item.link,
    description: "",
    category: "",
    pubDate: item.firstSeen,
  }));
  const grouped = clusterArticlesByStory(archivedArticles, 100);
  const groupedKeys = new Set(
    grouped.flatMap((cluster) => cluster.articles.map(newsArticleKey)),
  );
  const singles = archivedArticles
    .filter((article) => !groupedKeys.has(newsArticleKey(article)))
    .map((article) => ({
      id: newsArticleKey(article),
      label: article.title,
      representative: article,
      articles: [article],
      sources: { [article.source]: 1 },
      totalCount: 1,
    }));
  const clusters = [...grouped, ...singles];
  const matching = clusters.filter(
    (cluster) =>
      !onlyNew ||
      cluster.articles.some((article) => {
        const item = lookup.get(newsArticleKey(article));
        return item && changed(item);
      }),
  );
  const shown = matching.slice(0, visibleCount);
  const newCount = history.filter(changed).length;
  return (
    <section
      className="np-section np-history"
      aria-labelledby="np-history-title"
    >
      <div className="np-section-head">
        <h2 id="np-history-title" className="np-section-title">
          How coverage changed
        </h2>
        {previousVisit && (
          <label className="np-history-filter">
            <input
              type="checkbox"
              checked={onlyNew}
              onChange={(event) => setOnlyNew(event.target.checked)}
            />
            Changes since last visit ({newCount})
          </label>
        )}
      </div>
      <p className="np-muted np-small">
        Up to {NEWS_HISTORY_DAYS} days of observed headlines. Related stories
        are grouped by title similarity. Times show when this site observed a
        headline, and the feeds are checked when someone opens or refreshes this
        page.
      </p>
      {previousVisit ? (
        <p className="np-muted np-small">
          Compared with your last visit on {timestamp(previousVisit)}.
        </p>
      ) : (
        <p className="np-muted np-small">
          Your next visit can show what changed since this one.
        </p>
      )}
      {history.length === 0 ? (
        <p className="np-muted">
          History begins with the next successful feed refresh.
        </p>
      ) : shown.length === 0 ? (
        <p className="np-muted">No observed changes since your last visit.</p>
      ) : (
        <ul className="np-history-list">
          {shown.map((cluster) => (
            <li key={cluster.id}>
              <details>
                <summary>
                  <span>{cluster.representative.title}</span>
                  <span className="np-muted np-small">
                    {Object.keys(cluster.sources).length} outlets ·{" "}
                    {cluster.totalCount} headlines
                  </span>
                </summary>
                <ol className="np-observations">
                  {cluster.articles
                    .map((article) => lookup.get(newsArticleKey(article)))
                    .filter((item): item is NewsObservation => Boolean(item))
                    .sort(
                      (a, b) =>
                        Date.parse(a.firstSeen) - Date.parse(b.firstSeen),
                    )
                    .map((item) => (
                      <li key={newsArticleKey(item)}>
                        <p className="np-small">
                          {SOURCE_META[item.source].name} · first observed{" "}
                          {timestamp(item.firstSeen)}
                          {changed(item)
                            ? " · new or changed since your last visit"
                            : ""}
                        </p>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.revisions.at(-1)?.title}
                        </a>
                        {item.revisions.length > 1 && (
                          <ul
                            className="np-revisions"
                            aria-label="Observed headline changes"
                          >
                            {item.revisions.map((revision) => (
                              <li
                                key={`${revision.observedAt}-${revision.title}`}
                              >
                                <time dateTime={revision.observedAt}>
                                  {timestamp(revision.observedAt)}
                                </time>{" "}
                                · {revision.title}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                </ol>
              </details>
            </li>
          ))}
        </ul>
      )}
      {matching.length > visibleCount && (
        <button
          type="button"
          className="np-button"
          onClick={() => setVisibleCount((count) => count + 12)}
        >
          Show more observed stories
        </button>
      )}
    </section>
  );
}
