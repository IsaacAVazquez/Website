import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { StructuredData } from "@/components/StructuredData";
import { githubTrendingSnapshot } from "@/data/githubTrendingSnapshot";
import { getAgentBuildIndex } from "@/lib/agentBuildIndex";
import { formatGitHubCompactNumber } from "@/lib/githubTrending";
import {
  constructMetadata,
  generateBreadcrumbStructuredData,
  siteConfig,
} from "@/lib/seo";

const index = getAgentBuildIndex(githubTrendingSnapshot);
const PATH = "/agent-build-index";
const RANKED_LIMIT = 10;

export const metadata = constructMetadata({
  title: "Agent Build Index",
  description:
    "A weekly read on the public AI agent repositories gaining attention on GitHub, ranked by measured star movement with source and freshness context.",
  canonicalUrl: PATH,
  dateModified: index.generatedAt.slice(0, 10),
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Waiting on the next snapshot"
    : DATE_FORMATTER.format(date);
}

function movementLabel(value: number): string {
  if (value === 0) return "No change";
  const sign = value > 0 ? "+" : "\u2212";
  return `${sign}${formatGitHubCompactNumber(Math.abs(value))}`;
}

export default function AgentBuildIndexPage() {
  const agentSegment = index.agentSegment;
  const leadingTopic = index.topicSegments[0];
  const maxTopicMovement = Math.max(
    1,
    ...index.topicSegments.map((topic) => topic.weeklyStars)
  );
  const rankedRepositories = index.repositories.slice(0, RANKED_LIMIT);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Agent Build Index", url: PATH },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (
            generateBreadcrumbStructuredData(breadcrumbs) as {
              itemListElement: object[];
            }
          ).itemListElement,
        }}
      />
      <StructuredData
        type="SoftwareApplication"
        data={{
          name: "Agent Build Index",
          description:
            "A weekly index of active public AI agent repositories ranked by measured GitHub star movement.",
          url: `${siteConfig.url}${PATH}`,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web browser",
          featureList: [
            "Measured seven-day GitHub star movement",
            "Focused AI agent repository ranking",
            "Comparison with adjacent developer topics",
            "Source and snapshot freshness disclosure",
          ],
          dateModified: index.generatedAt,
        }}
      />

      {/* Hero */}
      <section className="c97-band" data-c97-surface="paper">
        <div
          className="c97-shell"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))",
            gap: "var(--c97-sp-5)",
            alignItems: "end",
          }}
        >
          <div>
            <p className="c97-kicker">Open source signal</p>
            <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-2)" }}>
              Agent Build Index
            </h1>
            <p className="c97-lead" style={{ marginTop: "var(--c97-sp-3)" }}>
              I track the public agent repositories gaining attention on
              GitHub because the movement is more useful than another market
              map. This is a weekly read of measured star changes, with the
              source and gaps left visible.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--c97-sp-2)",
                marginTop: "var(--c97-sp-4)",
              }}
            >
              <Link
                href="/github-trending-pulse?view=topic&segment=topic-agents"
                className="c97-btn"
              >
                Explore the full agent table
              </Link>
              <Link href="/ai-dev-tools" className="c97-btn-ghost">
                Compare AI dev tools
              </Link>
            </div>
          </div>

          <div
            className="c97-panel"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "var(--c97-sp-3)",
            }}
          >
            <div className="c97-stat">
              <p className="c97-stat-label">{index.windowDays}d movement</p>
              <p className="c97-stat-value c97-tabular">
                {movementLabel(agentSegment?.weeklyStars ?? 0)}
              </p>
            </div>
            <div className="c97-stat">
              <p className="c97-stat-label">Repos</p>
              <p className="c97-stat-value c97-tabular">
                {index.repositories.length}
              </p>
            </div>
            <div className="c97-stat">
              <p className="c97-stat-label">Total stars</p>
              <p className="c97-stat-value c97-tabular">
                {formatGitHubCompactNumber(agentSegment?.totalStars ?? 0)}
              </p>
            </div>
            <div className="c97-stat">
              <p className="c97-stat-label">Measured</p>
              <p className="c97-stat-value c97-tabular">
                {index.measuredRepositoryCount}/{index.repositories.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ranking */}
      <section
        className="c97-band"
        data-c97-surface="bone"
        aria-labelledby="agent-index-ranking-heading"
      >
        <div className="c97-shell">
          <p className="c97-kicker">Current ranking</p>
          <h2
            id="agent-index-ranking-heading"
            className="c97-serif c97-h2"
            style={{ marginTop: "var(--c97-sp-2)" }}
          >
            The repositories moving fastest this week
          </h2>
          <p
            className="c97-prose"
            style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
          >
            The weekly figure uses a persisted baseline rather than a
            single scrape. A new repository stays labeled as a partial
            or new baseline until enough history exists.
          </p>
          {index.repositories.length > rankedRepositories.length ? (
            <p
              className="c97-prose"
              style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}
            >
              Showing the top {rankedRepositories.length} of{" "}
              {index.repositories.length} tracked repositories.
            </p>
          ) : null}

          {index.repositories.length > 0 ? (
            <ol
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                marginTop: "var(--c97-sp-4)",
              }}
            >
              {rankedRepositories.map((repository, position) => (
                <li
                  key={repository.id}
                  className="c97-row c97-row-numbered c97-row-stack-sm"
                  style={{
                    borderTop: "1px solid var(--c97-rule)",
                    paddingBlock: "var(--c97-sp-3)",
                  }}
                >
                  <span
                    className="c97-mono"
                    style={{
                      fontSize: "var(--c97-fs-small)",
                      color: "var(--c97-label)",
                    }}
                  >
                    {(position + 1).toString().padStart(2, "0")}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h3 className="c97-serif c97-h3">
                      <a
                        href={repository.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="c97-link"
                        style={{
                          display: "inline-block",
                          minHeight: 44,
                          textDecorationColor: "var(--c97-rule)",
                        }}
                      >
                        {repository.fullName}
                        <span className="sr-only"> (opens on GitHub in a new tab)</span>
                      </a>
                    </h3>
                    <p
                      className="c97-prose line-clamp-2"
                      style={{
                        marginTop: "var(--c97-sp-1)",
                        color: "var(--c97-ink-2)",
                      }}
                    >
                      {repository.description || "No description published."}
                    </p>
                  </div>
                  <div
                    className="c97-stat"
                    style={{ gap: 0, justifyItems: "end", textAlign: "end" }}
                  >
                    <span
                      className="c97-mono"
                      style={{
                        fontSize: "var(--c97-fs-lead)",
                        lineHeight: "var(--c97-lh-tight)",
                        color: "var(--c97-accent)",
                      }}
                    >
                      {movementLabel(repository.weeklyStars)}
                    </span>
                    <span className="c97-kicker">
                      {repository.weeklyStarsStatus === "measured"
                        ? `${index.windowDays}d measured`
                        : repository.weeklyStarsStatus === "partial"
                          ? "Partial window"
                          : "New baseline"}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p
              className="c97-prose"
              style={{ marginTop: "var(--c97-sp-4)", color: "var(--c97-ink-2)" }}
            >
              The agent segment is waiting on its next successful snapshot.
            </p>
          )}
        </div>
      </section>

      {/* Snapshot context */}
      <section className="c97-band" data-c97-surface="paper">
        <aside className="c97-shell c97-columns" aria-label="Snapshot context">
          <section aria-labelledby="topic-movement-heading">
            <p className="c97-kicker">Topic comparison</p>
            <h2
              id="topic-movement-heading"
              className="c97-serif c97-h3"
              style={{ marginTop: "var(--c97-sp-2)" }}
            >
              Where the tracked attention sits
            </h2>
            <div
              style={{
                display: "grid",
                gap: "var(--c97-sp-2)",
                marginTop: "var(--c97-sp-3)",
              }}
            >
              {index.topicSegments.map((topic) => {
                const width = Math.max(
                  3,
                  Math.round(
                    (topic.weeklyStars / maxTopicMovement) * 100
                  )
                );
                return (
                  <div key={topic.key}>
                    <p
                      className="c97-meta"
                      style={{
                        justifyContent: "space-between",
                        color: "var(--c97-ink)",
                        marginBottom: "var(--c97-sp-1)",
                      }}
                    >
                      <span>{topic.label}</span>
                      <span className="c97-mono" style={{ color: "var(--c97-label)" }}>
                        {movementLabel(topic.weeklyStars)}
                      </span>
                    </p>
                    <span className="c97-meter" aria-hidden="true">
                      <span style={{ width: `${width}%` }} />
                    </span>
                  </div>
                );
              })}
            </div>
            <p
              className="c97-prose"
              style={{ marginTop: "var(--c97-sp-3)", color: "var(--c97-ink-2)" }}
            >
              {leadingTopic?.key === agentSegment?.key
                ? `Agents lead the tracked topic groups in this snapshot with ${movementLabel(agentSegment?.weeklyStars ?? 0)} stars over ${index.windowDays} days.`
                : `The agent group recorded ${movementLabel(agentSegment?.weeklyStars ?? 0)} stars over ${index.windowDays} days in this snapshot.`}
            </p>
          </section>

          <section aria-label="Snapshot notes">
            <p className="c97-kicker">Snapshot notes</p>
            <h2
              className="c97-serif c97-h3"
              style={{ marginTop: "var(--c97-sp-2)" }}
            >
              What the number does and does not mean
            </h2>
            <p
              className="c97-prose"
              style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
            >
              Stars measure attention and say nothing by themselves about
              product quality or usage. I use the index to see what
              developers are examining, then I read the repository and
              product before drawing a conclusion.
            </p>
            <dl
              style={{
                display: "grid",
                gap: "var(--c97-sp-3)",
                margin: 0,
                marginTop: "var(--c97-sp-3)",
                borderTop: "1px solid var(--c97-rule)",
                paddingTop: "var(--c97-sp-3)",
              }}
            >
              <div className="c97-stat">
                <dt className="c97-stat-label">Generated</dt>
                <dd className="c97-prose" style={{ margin: 0 }}>
                  {formatDateTime(index.generatedAt)}
                </dd>
              </div>
              <div className="c97-stat">
                <dt className="c97-stat-label">Source</dt>
                <dd className="c97-prose" style={{ margin: 0 }}>
                  {index.sourceLabel}
                </dd>
              </div>
              <div className="c97-stat">
                <dt className="c97-stat-label">Activity window</dt>
                <dd className="c97-prose" style={{ margin: 0 }}>
                  Repositories pushed in the last{" "}
                  {index.activityWindowDays} days
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </section>

      {/* Newsletter */}
      <section
        className="c97-band c97-band-tall"
        data-c97-surface="pine"
        aria-label="Newsletter signup"
      >
        <div
          className="c97-shell"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))",
            gap: "var(--c97-sp-5)",
            alignItems: "center",
          }}
        >
          <div>
            <p className="c97-kicker">Follow the work</p>
            <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
              I send the builds and findings that hold up after the first
              look.
            </h2>
            <p
              className="c97-prose"
              style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
            >
              The index refreshes daily, but I only send a note when the
              movement points to something worth explaining.
            </p>
          </div>
          <NewsletterSignup source="agent_build_index" />
        </div>
      </section>
    </>
  );
}
