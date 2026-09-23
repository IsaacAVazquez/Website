import Link from "next/link";
import Image from "next/image";
import styles from "./Catalog97Home.module.css";
import { Catalog97Shell } from "./Catalog97Shell";
import { Catalog97Plate, Catalog97Slot } from "./Catalog97Primitives";
import {
  getProjectCardSummary,
  type CaseStudyData,
} from "@/constants/caseStudies";
import type { LiveToolGroup } from "@/constants/toolCategories";
import type { BlogPostPreview } from "@/lib/blog";
import type { HomeLiveFeedData } from "@/components/home/HomeLiveFeed";

export interface Catalog97HomeProps {
  featuredProjects: CaseStudyData[];
  recentPosts: BlogPostPreview[];
  heroIndex: {
    projectCount: number;
    essayCount: number;
    liveToolCount: number;
  };
  liveToolGroups: LiveToolGroup[];
  liveFeed: HomeLiveFeedData;
}

// "Sep 16" in UTC, so the server render and the schedule it came from agree.
function formatUtcDay(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function Catalog97Home({
  featuredProjects,
  recentPosts,
  heroIndex,
  liveToolGroups,
  liveFeed,
}: Catalog97HomeProps) {
  // The first tool from each category, so the dashboards table shows breadth.
  // Flattening every group and taking the first five gave four Fintech rows.
  const dashboardTools = liveToolGroups.flatMap((group) =>
    group.tools.slice(0, 1).map((tool) => ({ ...tool, groupLabel: group.label })),
  );

  const [leadPost, ...followingPosts] = recentPosts;

  return (
    <Catalog97Shell>
      <section className={`c97-band ${styles.hero}`} data-c97-surface="paper">
        <div className={`c97-shell ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className="c97-kicker">Isaac Vazquez · Product and analytics</p>
            <h1 className={`c97-display ${styles.headline}`}>
              I build tools that make <em>hard problems</em> easier to act on.
            </h1>
            <p className={`c97-prose ${styles.intro}`}>
              I’m a product manager and builder at Berkeley Haas, MBA ’27.
              I came to product through quality engineering at Civitech.
              Here you’ll find my work, the tools I build, and what I’m learning.
            </p>
            <div className={styles.actions}>
              <Link className="c97-btn" href="/portfolio">See the work <span aria-hidden="true">↗</span></Link>
              <Link className="c97-btn-ghost" href="/contact">Start a conversation</Link>
            </div>
          </div>
          <div className={styles.portrait}>
            <div className={styles.photoFrame}>
              <Catalog97Slot surface="tobacco" ratio="4 / 5" src="/images/headshot-home.webp" alt="Isaac Vazquez" priority />
            </div>
            <div className={styles.portraitNote} data-c97-surface="pine">
              <span className="c97-kicker">Based in</span>
              <span className="c97-serif c97-h3">Berkeley, California</span>
              <span className={styles.noteArrow} aria-hidden="true">↗</span>
            </div>
          </div>
        </div>
        <div className={`c97-shell ${styles.index}`}>
          <span className="c97-kicker">Explore the site</span>
          <Link href="/portfolio"><span>{heroIndex.projectCount}</span> Projects <span aria-hidden="true">↗</span></Link>
          <Link href="/dashboards"><span>{heroIndex.liveToolCount}</span> Live tools <span aria-hidden="true">↗</span></Link>
          <Link href="/writing"><span>{heroIndex.essayCount}</span> Essays <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      {/* 02 — Selected work */}
      <section className="c97-band c97-band-tall" data-c97-surface="pine">
        <div
          className="c97-shell"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--c97-sp-5)",
          }}
        >
          <div style={{ flex: "0 1 190px" }}>
            <Catalog97Plate value="02" />
            <h2
              className="c97-serif c97-h2"
              style={{
                marginTop: "var(--c97-sp-2)",
                color: "var(--c97-ink)",
              }}
            >
              Selected work
            </h2>
            <Link
              href="/portfolio"
              className="c97-sectionlink"
              style={{ marginTop: "var(--c97-sp-1)" }}
            >
              All {heroIndex.projectCount} projects
            </Link>
            {/*
              A track-record figure in place of the tool count this route used
              to lead with. $4M is the pricing strategy result on the résumé and
              the 2023 entry in personal.ts, so change all three together.
            */}
            <div style={{ marginTop: "var(--c97-sp-4)" }}>
              <div
                className="c97-serif c97-tabular"
                style={{
                  fontSize: "var(--c97-fs-h1)",
                  lineHeight: "var(--c97-lh-display)",
                  color: "var(--c97-ink)",
                }}
              >
                $4M
              </div>
              <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-2)" }}>
                Added revenue from a pricing strategy I led at Civitech
              </p>
            </div>
          </div>

          <div className={styles.projects}>
            {featuredProjects.map((project, index) => (
              <article key={project.slug} className={styles.project}>
                <Link href={`/portfolio/${project.slug}`} className={styles.projectImage} tabIndex={-1} aria-hidden="true">
                  <Image src={`/images/projects/${project.slug}.svg`} alt="" width={720} height={480} />
                  <span className={styles.projectNumber}>{String(index + 1).padStart(2, "0")}</span>
                </Link>
                <div className={styles.projectCopy}>
                  <p className="c97-kicker">{project.role} · {project.timeline}</p>
                  <h3 className="c97-serif c97-h3">
                    <Link href={`/portfolio/${project.slug}`}>{project.title}<span aria-hidden="true"> ↗</span></Link>
                  </h3>
                  <p className="c97-prose">{getProjectCardSummary(project)}</p>
                  <p className={styles.projectMetric}>{project.metrics}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 03 — Live dashboards */}
      <section className="c97-band c97-band-tall" data-c97-surface="chocolate">
        <div className="c97-shell">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--c97-sp-2) var(--c97-sp-4)",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2 className="c97-serif c97-h2">Live dashboards</h2>
              <Link href="/dashboards" className="c97-sectionlink">
                All {heroIndex.liveToolCount}
              </Link>
            </div>
            <Catalog97Plate value="03" />
          </div>

          <p className={`c97-prose ${styles.dashboardIntro}`}>
            I build tools to follow the things I’m curious about, from markets
            and earthquakes to the next launch. Explore a reading or open a tool below.
          </p>
          <div className={styles.readouts}>
            {liveFeed.quake ? (
              <Link href="/earthquake-pulse" className={styles.readout} data-c97-surface="bone">
                <span className={styles.readoutLabel}>Earthquake Pulse <span aria-hidden="true">↗</span></span>
                <span className={styles.readoutValue}>M{liveFeed.quake.magnitude.toFixed(1)}</span>
                <span className={styles.readoutDetail}>{liveFeed.quake.place}</span>
                <svg className={styles.quakeBars} viewBox="0 0 300 56" preserveAspectRatio="none" role="img" aria-label="Relative magnitudes of recent earthquakes, oldest to newest">
                  {liveFeed.quake.recentMagnitudes.map((magnitude, index, values) => {
                    const height = Math.max(2, magnitude / Math.max(0.1, ...values) * 52);
                    return <rect key={index} x={index * 300 / values.length} y={56 - height} width={Math.max(1, 300 / values.length - 5)} height={height} />;
                  })}
                </svg>
                <span className={styles.readoutFoot}>Latest quake · {liveFeed.quake.agoLabel} · {liveFeed.quake.depthKm} km deep</span>
              </Link>
            ) : null}
            {liveFeed.market ? (
              <Link href="/investments" className={styles.readout} data-c97-surface="paper">
                <span className={styles.readoutLabel}>Market snapshot <span aria-hidden="true">↗</span></span>
                <span className={styles.readoutValue}>{liveFeed.market.delta}</span>
                <span className={styles.readoutDetail}>{liveFeed.market.name} · {liveFeed.market.symbol}</span>
                <div className={styles.marketReading}>
                  <span className="c97-kicker">Daily change</span>
                  <span className="c97-serif c97-h2">{liveFeed.market.changePct > 0 ? "+" : ""}{liveFeed.market.changePct.toFixed(2)}%</span>
                </div>
                <span className={styles.readoutFoot}>{liveFeed.market.asOfLabel ? `Close on ${liveFeed.market.asOfLabel}` : "Snapshot close"} · ${liveFeed.market.price}</span>
              </Link>
            ) : null}
            {liveFeed.launch ? (
              <Link href="/spacex-mission-control" className={styles.readout} data-c97-surface="pine">
                <span className={styles.readoutLabel}>SpaceX Mission Control <span aria-hidden="true">↗</span></span>
                <span className={styles.readoutValue}>{formatUtcDay(liveFeed.launch.dateUtc)}</span>
                <span className={styles.readoutDetail}>{liveFeed.launch.mission}</span>
                <div className={styles.launchOrbit} aria-hidden="true"><span>↗</span></div>
                <span className={styles.readoutFoot}>Next launch · {liveFeed.launch.vehicle}</span>
              </Link>
            ) : null}
          </div>
          <p className={`c97-kicker ${styles.sourceNote}`}>{liveFeed.sourceNote}</p>
          <div className={styles.toolDirectory}>
            {dashboardTools.slice(0, 6).map((tool, index) => {
              const content = <>
                <span className={styles.toolOrdinal} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span><span className="c97-kicker">{tool.groupLabel}</span><span className={`c97-serif c97-h3 ${styles.toolTitle}`}>{tool.title}</span></span>
                <span className={styles.toolArrow} aria-hidden="true">↗</span>
              </>;
              return tool.isExternal ? (
                <a key={tool.slug} href={tool.href} target="_blank" rel="noopener noreferrer" className={styles.toolLink}>{content}</a>
              ) : (
                <Link key={tool.slug} href={tool.href} className={styles.toolLink}>{content}</Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 04 — Recent writing */}
      {leadPost ? (
        <section className="c97-band c97-band-tall" data-c97-surface="bone">
          <div className="c97-shell">
            <h2 className="c97-serif c97-h2">Recent writing</h2>

            <article className={styles.leadArticle}>
              {leadPost.coverImage && !leadPost.coverImage.includes("opengraph-image") ? (
                <Link href={`/writing/${leadPost.slug}`} className={styles.articleImage} tabIndex={-1} aria-hidden="true">
                  <Image src={leadPost.coverImage} alt="" fill sizes="(max-width: 790px) 100vw, 50vw" />
                </Link>
              ) : (
                <div className={styles.editorialCover} data-c97-surface="paper" aria-hidden="true">
                  <span className="c97-kicker">Essays &amp; field notes</span>
                  <span className={styles.editorialNumber}>04</span>
                  <span className="c97-serif c97-h3">What I’m learning<br />as I build.</span>
                </div>
              )}
              <div>
                <p className="c97-kicker">From my notebook · {leadPost.category}</p>
                <h3 className="c97-serif c97-h2"><Link href={`/writing/${leadPost.slug}`}>{leadPost.title}</Link></h3>
                <p className="c97-prose">{leadPost.excerpt}</p>
                <p className="c97-meta">{leadPost.readingTime}</p>
                <Link href={`/writing/${leadPost.slug}`} className="c97-sectionlink">Read the essay <span aria-hidden="true">↗</span></Link>
              </div>
            </article>

            {followingPosts.map((post) => (
              <div
                key={post.slug}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: "var(--c97-sp-1) var(--c97-sp-4)",
                  marginTop: "var(--c97-sp-5)",
                }}
              >
                <div style={{ flex: "1 1 420px" }}>
                  {/* --c97-fs-lead, so the lead post above keeps its tier. */}
                  <h3 className="c97-serif c97-lead">
                    <Link
                      href={`/writing/${post.slug}`}
                      style={{ textDecoration: "none" }}
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p
                    className="c97-prose"
                    style={{
                      marginTop: "var(--c97-sp-1)",
                      color: "var(--c97-ink-2)",
                    }}
                  >
                    {post.excerpt}
                  </p>
                </div>
                <p className="c97-meta">
                  <span className="c97-tabular">{post.readingTime}</span>
                  <span>{post.category}</span>
                </p>
              </div>
            ))}

            <Link
              href="/writing"
              className="c97-sectionlink"
              style={{ marginTop: "var(--c97-sp-3)" }}
            >
              All writing
            </Link>
          </div>
        </section>
      ) : null}

      {/* Compact closing invitation. */}
      <section className={`c97-band ${styles.contactBand}`} data-c97-surface="tobacco">
        <div className={`c97-shell ${styles.contactRow}`}>
          <p className={`c97-serif c97-h2 ${styles.contactMessage}`}>
            If you have a thing that needs proving, I would like to hear about it.
          </p>
          <Link className="c97-btn-outline" href="/contact">
            Get in touch
          </Link>
        </div>
      </section>
    </Catalog97Shell>
  );
}
