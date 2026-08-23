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

      <section className="home-page min-h-screen bg-[var(--home-paper)] text-[var(--home-ink)]">
        <div className="home-shell home-shell-wide home-section space-y-8 sm:space-y-10">
          <header className="grid gap-7 border-b border-[var(--home-rule)] pb-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end">
            <div className="space-y-4">
              <p className="home-kicker mb-0">Open source signal</p>
              <h1 className="max-w-[15ch] text-4xl font-semibold leading-[0.96] tracking-[-0.045em] sm:text-6xl">
                Agent Build Index
              </h1>
              <p className="max-w-[62ch] text-base leading-7 text-[var(--home-ink-muted)] sm:text-lg">
                I track the public agent repositories gaining attention on
                GitHub because the movement is more useful than another market
                map. This is a weekly read of measured star changes, with the
                source and gaps left visible.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href="/github-trending-pulse?view=topic&segment=topic-agents"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[var(--home-ink)] bg-[var(--home-ink)] px-5 text-sm font-semibold text-[var(--home-paper)] transition-[background-color,border-color,color] hover:border-[var(--home-signal)] hover:bg-[var(--home-signal)] focus-visible:border-[var(--home-signal)] focus-visible:bg-[var(--home-signal)]"
                >
                  Explore the full agent table
                </Link>
                <Link
                  href="/ai-dev-tools"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper)] px-5 text-sm font-semibold text-[var(--home-ink)] transition-[background-color,border-color] hover:border-[var(--home-ink)] hover:bg-[var(--home-paper-raised)] focus-visible:border-[var(--home-ink)] focus-visible:bg-[var(--home-paper-raised)]"
                >
                  Compare AI dev tools
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 border border-[var(--home-rule)] bg-[var(--home-paper-alt)]">
              <div className="border-b border-r border-[var(--home-rule)] p-4 sm:p-5">
                <p className="home-kicker mb-2">{index.windowDays}d movement</p>
                <p className="text-2xl font-semibold tabular-nums sm:text-3xl">
                  {movementLabel(agentSegment?.weeklyStars ?? 0)}
                </p>
              </div>
              <div className="border-b border-[var(--home-rule)] p-4 sm:p-5">
                <p className="home-kicker mb-2">Repos</p>
                <p className="text-2xl font-semibold tabular-nums sm:text-3xl">
                  {index.repositories.length}
                </p>
              </div>
              <div className="border-r border-[var(--home-rule)] p-4 sm:p-5">
                <p className="home-kicker mb-2">Total stars</p>
                <p className="text-2xl font-semibold tabular-nums sm:text-3xl">
                  {formatGitHubCompactNumber(agentSegment?.totalStars ?? 0)}
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="home-kicker mb-2">Measured</p>
                <p className="text-2xl font-semibold tabular-nums sm:text-3xl">
                  {index.measuredRepositoryCount}/{index.repositories.length}
                </p>
              </div>
            </div>
          </header>

          <section
            className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]"
            aria-labelledby="agent-index-ranking-heading"
          >
            <div className="home-card overflow-hidden">
              <div className="border-b border-[var(--home-rule)] px-5 py-5 sm:px-6">
                <p className="home-kicker mb-1">Current ranking</p>
                <h2
                  id="agent-index-ranking-heading"
                  className="text-2xl font-semibold tracking-[-0.025em]"
                >
                  The repositories moving fastest this week
                </h2>
                <p className="mt-2 max-w-[66ch] text-sm leading-6 text-[var(--home-ink-muted)]">
                  The weekly figure uses a persisted baseline rather than a
                  single scrape. A new repository stays labeled as a partial
                  or new baseline until enough history exists.
                </p>
                {index.repositories.length > rankedRepositories.length ? (
                  <p className="mt-2 text-sm leading-6 text-[var(--home-ink-muted)]">
                    Showing the top {rankedRepositories.length} of{" "}
                    {index.repositories.length} tracked repositories.
                  </p>
                ) : null}
              </div>

              {index.repositories.length > 0 ? (
                <ol className="divide-y divide-[var(--home-rule)]">
                  {rankedRepositories.map((repository, position) => (
                    <li
                      key={repository.id}
                      className="grid gap-3 px-5 py-4 sm:grid-cols-[2.25rem_minmax(0,1fr)_auto] sm:items-center sm:px-6"
                    >
                      <span className="font-mono text-sm tabular-nums text-[var(--home-ink-muted)]">
                        {(position + 1).toString().padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <a
                          href={repository.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] items-center font-semibold text-[var(--home-ink)] underline decoration-[var(--home-rule)] underline-offset-4 transition-[color,decoration-color] hover:text-[var(--home-signal)] hover:decoration-[var(--home-signal)] focus-visible:text-[var(--home-signal)]"
                        >
                          {repository.fullName}
                          <span className="sr-only"> (opens on GitHub in a new tab)</span>
                        </a>
                        <p className="line-clamp-2 text-sm leading-6 text-[var(--home-ink-muted)]">
                          {repository.description || "No description published."}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-0.5">
                        <span className="font-mono text-sm font-semibold tabular-nums text-[var(--home-signal)]">
                          {movementLabel(repository.weeklyStars)}
                        </span>
                        <span className="text-xs text-[var(--home-ink-muted)]">
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
                <p className="px-5 py-8 text-sm leading-6 text-[var(--home-ink-muted)] sm:px-6">
                  The agent segment is waiting on its next successful snapshot.
                </p>
              )}
            </div>

            <aside className="space-y-5" aria-label="Snapshot context">
              <section
                className="home-card p-5 sm:p-6"
                aria-labelledby="topic-movement-heading"
              >
                <p className="home-kicker mb-1">Topic comparison</p>
                <h2
                  id="topic-movement-heading"
                  className="text-xl font-semibold tracking-[-0.02em]"
                >
                  Where the tracked attention sits
                </h2>
                <div className="mt-5 space-y-4">
                  {index.topicSegments.map((topic) => {
                    const width = Math.max(
                      3,
                      Math.round(
                        (topic.weeklyStars / maxTopicMovement) * 100
                      )
                    );
                    return (
                      <div key={topic.key}>
                        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-semibold">{topic.label}</span>
                          <span className="font-mono text-xs tabular-nums text-[var(--home-ink-muted)]">
                            {movementLabel(topic.weeklyStars)}
                          </span>
                        </div>
                        <div
                          className="h-2 overflow-hidden rounded-full bg-[var(--home-rule)]"
                          aria-hidden="true"
                        >
                          <div
                            className="h-full rounded-full bg-[var(--home-signal)]"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-5 text-sm leading-6 text-[var(--home-ink-muted)]">
                  {leadingTopic?.key === agentSegment?.key
                    ? `Agents lead the tracked topic groups in this snapshot with ${movementLabel(agentSegment?.weeklyStars ?? 0)} stars over ${index.windowDays} days.`
                    : `The agent group recorded ${movementLabel(agentSegment?.weeklyStars ?? 0)} stars over ${index.windowDays} days in this snapshot.`}
                </p>
              </section>

              <section
                className="home-card p-5 sm:p-6"
                aria-label="Snapshot notes"
              >
                <p className="home-kicker mb-1">Snapshot notes</p>
                <h2 className="text-xl font-semibold tracking-[-0.02em]">
                  What the number does and does not mean
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--home-ink-muted)]">
                  Stars measure attention and say nothing by themselves about
                  product quality or usage. I use the index to see what
                  developers are examining, then I read the repository and
                  product before drawing a conclusion.
                </p>
                <dl className="mt-5 space-y-3 border-t border-[var(--home-rule)] pt-4 text-sm">
                  <div>
                    <dt className="text-[var(--home-ink-muted)]">Generated</dt>
                    <dd className="mt-1 font-semibold">
                      {formatDateTime(index.generatedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--home-ink-muted)]">Source</dt>
                    <dd className="mt-1 font-semibold">{index.sourceLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--home-ink-muted)]">
                      Activity window
                    </dt>
                    <dd className="mt-1 font-semibold">
                      Repositories pushed in the last{" "}
                      {index.activityWindowDays} days
                    </dd>
                  </div>
                </dl>
              </section>
            </aside>
          </section>

          <section
            className="grid gap-6 border-y border-[var(--home-rule)] py-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)] lg:items-center"
            aria-label="Newsletter signup"
          >
            <div>
              <p className="home-kicker mb-2">Follow the work</p>
              <h2 className="max-w-[22ch] text-2xl font-semibold leading-[1.06] tracking-[-0.03em]">
                I send the builds and findings that hold up after the first
                look.
              </h2>
              <p className="mt-3 max-w-[58ch] text-sm leading-7 text-[var(--home-ink-muted)]">
                The index refreshes daily, but I only send a note when the
                movement points to something worth explaining.
              </p>
            </div>
            <NewsletterSignup source="agent_build_index" />
          </section>
        </div>
      </section>
    </>
  );
}
