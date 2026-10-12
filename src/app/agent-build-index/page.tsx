import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import "./agent-build-index.css";
import { StructuredData } from "@/components/StructuredData";
import { githubTrendingSnapshot } from "@/data/githubTrendingSnapshot";
import { getAgentBuildIndex } from "@/lib/agentBuildIndex";
import { formatGitHubCompactNumber } from "@/lib/githubTrending";
import { DISPLAY_TIME_ZONE } from "@/lib/date-formatters";
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

// This renders in a server component with no client boundary, so it never
// hydrates, but it still had no timeZone pinned and would print whatever
// zone the server happens to run in instead of the site's Pacific convention.
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: DISPLAY_TIME_ZONE,
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
      <StructuredData
        type="Dataset"
        data={{
          name: "Open-Source AI Agent Repository and Velocity Index",
          description:
            "A weekly index of public open-source AI agent repositories on GitHub, tracking star counts and measured seven-day star movement.",
          url: `${siteConfig.url}${PATH}`,
          keywords: [
            "AI agents",
            "autonomous agents",
            "GitHub stars",
            "developer tools",
            "agent architecture",
            "open source AI",
          ],
          variableMeasured: [
            "Repository Name",
            "Star Count",
            "Weekly Star Movement",
            "Topic Segments",
          ],
          dateModified: index.generatedAt,
          license: "https://creativecommons.org/publicdomain/zero/1.0/",
        }}
      />

      <div className="abi-root">
        <div className="c97-shell c97-frame abi-page">
          <header className="abi-head">
            <h1 className="abi-title">Agent Build Index</h1>
            <p className="abi-lede">
              I track the public agent repositories gaining attention on GitHub because the
              movement is more useful than another market map. This is a weekly read of measured
              star changes, with the source and gaps left visible.
            </p>
            <p className="abi-status">
              {index.sourceLabel} · snapshot {formatDateTime(index.generatedAt)} · repositories
              pushed in the last {index.activityWindowDays} days ·{" "}
              {index.measuredRepositoryCount} of {index.repositories.length} measured over the
              full {index.windowDays} days
            </p>
            <p className="abi-links">
              <Link
                href="/github-trending-pulse?view=topic&segment=topic-agents"
                className="abi-link"
              >
                Explore the full agent table
              </Link>
              <Link href="/ai-dev-tools" className="abi-link">
                Compare AI dev tools
              </Link>
            </p>
          </header>

          <section className="abi-ranking" aria-labelledby="agent-index-ranking-heading">
            <div className="abi-section-head">
              <h2 id="agent-index-ranking-heading" className="abi-h2">
                The repositories moving fastest this week
              </h2>
              {index.repositories.length > rankedRepositories.length ? (
                <p className="abi-note">
                  Showing the top {rankedRepositories.length} of {index.repositories.length}{" "}
                  tracked repositories.
                </p>
              ) : null}
            </div>

            {index.repositories.length > 0 ? (
              <ol className="abi-list">
                {rankedRepositories.map((repository, position) => (
                  <li key={repository.id} className="abi-row">
                    <span className="abi-rank">
                      {(position + 1).toString().padStart(2, "0")}
                    </span>
                    <div className="abi-repo">
                      <h3 className="abi-name">
                        <a href={repository.url} target="_blank" rel="noopener noreferrer">
                          {repository.fullName}
                          <span className="sr-only"> (opens on GitHub in a new tab)</span>
                        </a>
                      </h3>
                      <p className="abi-desc">
                        {repository.description || "No description published."}
                      </p>
                    </div>
                    <p className="abi-move">
                      <span className="abi-move-value">{movementLabel(repository.weeklyStars)}</span>
                      <span className="abi-move-status">
                        {repository.weeklyStarsStatus === "measured"
                          ? `${index.windowDays}d measured`
                          : repository.weeklyStarsStatus === "partial"
                            ? "Partial window"
                            : "New baseline"}
                      </span>
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="abi-note">The agent segment is waiting on its next successful snapshot.</p>
            )}
            <p className="abi-note">
              The weekly figure uses a persisted baseline rather than a single scrape. A new
              repository stays labeled as a partial or new baseline until enough history exists.
            </p>
          </section>

          <div className="abi-context">
            <section aria-labelledby="topic-movement-heading">
              <h2 id="topic-movement-heading" className="abi-h3">
                Where the tracked attention sits
              </h2>
              <ul className="abi-topics">
                {index.topicSegments.map((topic) => {
                  const width = Math.max(
                    3,
                    Math.round((topic.weeklyStars / maxTopicMovement) * 100)
                  );
                  return (
                    <li
                      key={topic.key}
                      className="abi-topic"
                      data-current={topic.key === agentSegment?.key || undefined}
                    >
                      <span className="abi-topic-label">{topic.label}</span>
                      <span className="abi-topic-track" aria-hidden="true">
                        <span style={{ width: `${width}%` }} />
                      </span>
                      <span className="abi-topic-value">{movementLabel(topic.weeklyStars)}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="abi-note">
                {leadingTopic?.key === agentSegment?.key
                  ? `Agents lead the tracked topic groups in this snapshot with ${movementLabel(agentSegment?.weeklyStars ?? 0)} stars over ${index.windowDays} days, across ${formatGitHubCompactNumber(agentSegment?.totalStars ?? 0)} total stars.`
                  : `The agent group recorded ${movementLabel(agentSegment?.weeklyStars ?? 0)} stars over ${index.windowDays} days in this snapshot, across ${formatGitHubCompactNumber(agentSegment?.totalStars ?? 0)} total stars.`}
              </p>
            </section>

            <section aria-labelledby="agent-index-meaning-heading">
              <h2 id="agent-index-meaning-heading" className="abi-h3">
                What the number does and does not mean
              </h2>
              <p className="abi-prose">
                Stars measure attention and say nothing by themselves about product quality or
                usage. I use the index to see what developers are examining, then I read the
                repository and product before drawing a conclusion.
              </p>
            </section>
          </div>

          <section className="abi-signup" aria-label="Newsletter signup">
            <div className="abi-signup-text">
              <h2 className="abi-h3">
                I send the builds and findings that hold up after the first look.
              </h2>
              <p className="abi-prose">
                The index refreshes daily, but I only send a note when the movement points to
                something worth explaining.
              </p>
            </div>
            <div className="abi-signup-form">
              <NewsletterSignup source="agent_build_index" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
