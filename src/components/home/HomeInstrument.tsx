import Image from "next/image";
import Link from "next/link";
import type { CaseStudyData } from "@/constants/caseStudies";
import { getProjectCardSummary } from "@/constants/caseStudies";
import {
  TOOL_CATEGORY_DEFS,
  classifyToolSlug,
  type LiveToolGroup,
} from "@/constants/toolCategories";
import type { BlogPostPreview } from "@/lib/blog";
import { publishedDateFormatter } from "@/lib/utils";
import { ContactCta } from "@/components/ContactCta";
import { InstrumentCounter } from "@/components/home/InstrumentCounter";
import { PanelClock } from "@/components/home/PanelClock";
import { NowLine } from "@/components/home/NowLine";
import { ReadoutPanel } from "@/components/ui/ReadoutPanel";
import styles from "@/app/page.module.css";

export interface QuakePulse {
  /** Hourly counts over the snapshot's last 24h window, oldest first. */
  series: number[];
  total24h: number;
  /** ISO timestamp of the snapshot the series was derived from. */
  asOf: string | null;
}

interface HomeInstrumentProps {
  featuredProjects: CaseStudyData[];
  recentPosts: BlogPostPreview[];
  heroIndex: {
    projectCount: number;
    essayCount: number;
    liveToolCount: number;
  };
  liveToolGroups: LiveToolGroup[];
  quakePulse: QuakePulse;
}

// Month-and-year stamp for the live index cap. Derived from the most recent
// published post so the label tracks real content freshness, not wall clock.
const updatedMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

const asOfFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function ArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l14 0" />
      <path d="M13 18l6 -6" />
      <path d="M13 6l6 6" />
    </svg>
  );
}

function LiveDot() {
  return (
    <span className={styles.liveDot} aria-hidden="true">
      <span />
    </span>
  );
}

function categoryLabelFor(slug: string): string {
  const id = classifyToolSlug(slug);
  return TOOL_CATEGORY_DEFS.find((def) => def.id === id)?.label ?? "Project";
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Map an hourly count series onto sparkline coordinates in a 300x72 viewBox
 * with a little padding so the stroke never clips.
 */
const SPARK_W = 300;
const SPARK_H = 72;
const SPARK_PAD = 6;

function sparklineCoords(series: number[]): Array<{ x: number; y: number }> {
  const max = Math.max(...series, 1);
  const step = SPARK_W / Math.max(series.length - 1, 1);
  return series.map((count, index) => ({
    x: Math.round(index * step * 100) / 100,
    y:
      Math.round(
        (SPARK_H - SPARK_PAD - (count / max) * (SPARK_H - SPARK_PAD * 2)) * 100,
      ) / 100,
  }));
}

function sparklinePoints(series: number[]): string {
  return sparklineCoords(series)
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
}

function sparklineEnd(series: number[]): { x: number; y: number } {
  const coords = sparklineCoords(series);
  return coords[coords.length - 1] ?? { x: SPARK_W, y: SPARK_H / 2 };
}

export function HomeInstrument({
  featuredProjects,
  recentPosts,
  heroIndex,
  liveToolGroups,
  quakePulse,
}: HomeInstrumentProps) {
  const writingRows = recentPosts.slice(0, 3);

  // Most recent post timestamp drives the "Live index" freshness stamp.
  const lastUpdatedTs = recentPosts.reduce((latest, post) => {
    const ts = Date.parse(post.publishedAt);
    return Number.isNaN(ts) ? latest : Math.max(latest, ts);
  }, 0);
  const indexStamp =
    lastUpdatedTs > 0 ? updatedMonthFormatter.format(lastUpdatedTs) : null;

  const showSparkline = quakePulse.series.length >= 6;
  const quakeAsOf = quakePulse.asOf ? Date.parse(quakePulse.asOf) : NaN;
  const quakeAsOfLabel = Number.isNaN(quakeAsOf)
    ? null
    : asOfFormatter.format(quakeAsOf);

  return (
    <div className={styles.page}>
      {/* Hero — a contained ink plate with the claim + live index. The one
          full-bleed-feeling bold moment on the page; inverts in dark mode. */}
      <section
        className={styles.hero}
        aria-labelledby="home-hero-heading"
        data-testid="hero"
      >
        <div className={styles.shell}>
          <div className={styles.plate}>
          <div className={styles.heroGrid}>
            <div>
              <p className={styles.kicker}>
                Product manager &amp; builder · Berkeley, CA
              </p>
              <h1 id="home-hero-heading" className={styles.headline}>
                I build tools that make hard problems <em>easier</em> to act
                on<span className={styles.stop} aria-hidden="true">.</span>
              </h1>
              <p className={styles.dek}>
                Product manager and builder, Berkeley Haas MBA &rsquo;27.{" "}
                {heroIndex.liveToolCount} live tools in production, from
                investment research to earthquake tracking, all running on real
                data that refreshes itself.
              </p>
              <div className={styles.ctas}>
                <Link
                  className={`${styles.btn} ${styles.btnSolid}`}
                  href="/portfolio"
                >
                  See the work
                  <ArrowRight />
                </Link>
                <Link
                  className={`${styles.btn} ${styles.btnGhost}`}
                  href="/writing"
                >
                  Read the writing
                  <ArrowRight />
                </Link>
              </div>
            </div>

            <ReadoutPanel
              label={
                <>
                  <LiveDot />
                  Live index
                </>
              }
              stamp={
                <>
                  <PanelClock />
                  {indexStamp ? (
                    <span className={styles.capStamp}>· {indexStamp}</span>
                  ) : null}
                </>
              }
              rows={[
                {
                  label: "Projects shipped",
                  value: <InstrumentCounter value={heroIndex.projectCount} />,
                },
                {
                  label: "Tools in production",
                  value: <InstrumentCounter value={heroIndex.liveToolCount} />,
                },
                {
                  label: "Essays and notes",
                  value: <InstrumentCounter value={heroIndex.essayCount} />,
                },
              ]}
              footer={<NowLine />}
            >
              {showSparkline ? (
                <div className={styles.spark}>
                  <svg
                    viewBox="0 0 300 72"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={`Sparkline of ${quakePulse.total24h} recent earthquakes bucketed by hour`}
                  >
                    <line
                      className={styles.sparkGrid}
                      x1={SPARK_PAD}
                      y1={SPARK_H / 2}
                      x2={SPARK_W - SPARK_PAD}
                      y2={SPARK_H / 2}
                    />
                    <polygon
                      className={styles.sparkFill}
                      fill="var(--hp-signal)"
                      points={`${sparklinePoints(quakePulse.series)} 300,72 0,72`}
                    />
                    <polyline
                      className={styles.sparkLine}
                      fill="none"
                      stroke="var(--hp-signal)"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      pathLength={100}
                      points={sparklinePoints(quakePulse.series)}
                    />
                    <circle
                      className={styles.sparkPing}
                      cx={sparklineEnd(quakePulse.series).x}
                      cy={sparklineEnd(quakePulse.series).y}
                      r="3.5"
                      fill="none"
                      stroke="var(--hp-signal)"
                      strokeWidth="1.5"
                    />
                    <circle
                      className={styles.sparkDot}
                      cx={sparklineEnd(quakePulse.series).x}
                      cy={sparklineEnd(quakePulse.series).y}
                      r="3.5"
                      fill="var(--hp-signal)"
                    />
                  </svg>
                  <span className={styles.sparkCap}>
                    {quakePulse.total24h} recent quakes · by hour · USGS
                    {quakeAsOfLabel ? ` · as of ${quakeAsOfLabel}` : ""}
                  </span>
                </div>
              ) : null}
            </ReadoutPanel>
          </div>
          </div>
        </div>
      </section>

      {/* Selected work */}
      <section
        className={styles.section}
        id="projects"
        aria-labelledby="home-projects-heading"
      >
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <h2 id="home-projects-heading" className={styles.sectionTitle}>
              Selected work
            </h2>
            <Link className={styles.sectionLink} href="/portfolio">
              All {heroIndex.projectCount} projects
              <ArrowRight />
            </Link>
          </div>

          <div className={styles.workGrid} data-testid="home-projects">
            {featuredProjects.slice(0, 3).map((project, index) => {
              const href = project.link ?? `/portfolio/${project.slug}`;
              const isInternal = href.startsWith("/");
              const summary = getProjectCardSummary(project);
              const category = categoryLabelFor(project.slug);
              const isLive = Boolean(project.link);

              const inner = (
                <>
                  <div className={styles.cardArt} aria-hidden="true">
                    <Image
                      src={`/images/projects/${project.slug}.svg`}
                      alt=""
                      fill
                      unoptimized
                      sizes="(max-width: 1000px) 92vw, 30vw"
                    />
                  </div>
                  <div className={styles.cardTop}>
                    <span className={styles.cardNum} aria-hidden="true">
                      {pad2(index + 1)}
                    </span>
                    <span className={styles.cardCat}>{category}</span>
                    {isLive ? <span className={styles.live}>Live</span> : null}
                  </div>
                  <h3>{project.title}</h3>
                  <p>{summary}</p>
                  <div className={styles.cardFoot}>
                    <span>{project.timeline}</span>
                    <span aria-hidden="true">↗</span>
                  </div>
                </>
              );

              if (isInternal) {
                return (
                  <Link
                    key={project.slug}
                    className={styles.workCard}
                    href={href}
                  >
                    {inner}
                  </Link>
                );
              }

              return (
                <a
                  key={project.slug}
                  className={styles.workCard}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {inner}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* About band */}
      <section
        className={styles.section}
        id="about"
        aria-labelledby="home-about-heading"
      >
        <div className={styles.shell}>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutPhoto}>
              <Image
                src="/images/headshot-home.webp"
                alt="Isaac Vazquez"
                width={1200}
                height={1799}
                sizes="(max-width: 880px) 88vw, 24vw"
              />
            </div>
            <div className={styles.aboutBody}>
              <h2 id="home-about-heading">
                Product work where judgment and <em>follow-through</em> have to
                survive contact with users.
              </h2>
              <p>
                Most of my work sits where product judgment, AI workflows, and
                clear decision support have to hold together, from case
                studies, to PM writing, to interactive fintech tools built to
                make complex choices easier to inspect.
              </p>
              <p>
                I don&rsquo;t think product work gets stronger when it sounds
                more abstract. It gets stronger when tradeoffs are legible,
                scope is honest, and the product helps someone make a better
                decision without making them work harder for it.
              </p>
              <Link className={styles.aboutLink} href="/about">
                More about me
                <ArrowRight />
              </Link>
            </div>
            <div className={styles.aboutFacts} aria-label="Quick facts">
              <div className={styles.factRow}>
                <span className={styles.factLbl}>Focus</span>
                <span className={styles.factVal}>
                  AI workflows · fintech · analytics
                </span>
              </div>
              <div className={styles.factRow}>
                <span className={styles.factLbl}>Education</span>
                <span className={styles.factVal}>
                  Berkeley Haas MBA &rsquo;27 · Consortium Fellow
                </span>
              </div>
              <div className={styles.factRow}>
                <span className={styles.factLbl}>Background</span>
                <span className={styles.factVal}>
                  QA → product · 6+ years in civic tech
                </span>
              </div>
              <div className={styles.factRow}>
                <span className={styles.factLbl}>Based in</span>
                <span className={styles.factVal}>Berkeley, California</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live tools directory */}
      <section
        className={styles.section}
        id="tools"
        aria-labelledby="home-tools-heading"
      >
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitleWrap}>
              <h2 id="home-tools-heading" className={styles.sectionTitle}>
                Live tools
              </h2>
              <span className={styles.countBadge}>
                {heroIndex.liveToolCount} in production
              </span>
            </div>
            <Link className={styles.sectionLink} href="/portfolio">
              All projects
              <ArrowRight />
            </Link>
          </div>
          <p className={styles.sectionDek}>
            Every one of these runs in production on real data. Open any of
            them and poke at the real thing.
          </p>

          <div className={styles.toolGroups} data-testid="home-tools">
            {liveToolGroups.map((group) => (
              <div key={group.id} className={styles.toolGroup}>
                <span className={styles.toolGroupLabel}>
                  {group.label} · {pad2(group.tools.length)}
                </span>
                <ul className={styles.toolList}>
                  {group.tools.map((tool) => {
                    const inner = (
                      <>
                        <span>{tool.title}</span>
                        <span className={styles.go}>
                          {tool.isExternal ? "Visit" : "Open"}
                          <ArrowRight size={12} />
                        </span>
                      </>
                    );
                    return (
                      <li key={tool.slug}>
                        {tool.isExternal ? (
                          <a
                            className={styles.toolRow}
                            href={tool.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {inner}
                          </a>
                        ) : (
                          <Link className={styles.toolRow} href={tool.href}>
                            {inner}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Writing ledger */}
      <section
        className={`${styles.section} ${styles.sectionLast}`}
        id="writing"
        aria-labelledby="home-writing-heading"
      >
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <h2 id="home-writing-heading" className={styles.sectionTitle}>
              Recent writing
            </h2>
            <Link className={styles.sectionLink} href="/writing">
              All writing
              <ArrowRight />
            </Link>
          </div>

          <div className={styles.writeList} data-testid="home-writing">
            {writingRows.map((post) => (
              <Link
                key={post.slug}
                className={styles.writeRow}
                href={`/writing/${post.slug}`}
              >
                <span className={styles.folio}>
                  {publishedDateFormatter.format(new Date(post.publishedAt))}
                </span>
                <h3>{post.title}</h3>
                <span className={styles.rowMeta}>
                  {post.category} · {post.readingTime}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA — the same shared component full-footer pages use, so
          the homepage (compact footer) still ends on the standard ask. */}
      <ContactCta />
    </div>
  );
}
