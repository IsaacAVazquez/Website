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
import { HomeLiveFeed } from "@/components/home/HomeLiveFeed";
import type { HomeLiveFeedData } from "@/components/home/HomeLiveFeed";
import styles from "@/app/page.module.css";

interface HomeInstrumentProps {
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

function categoryLabelFor(slug: string): string {
  const id = classifyToolSlug(slug);
  return TOOL_CATEGORY_DEFS.find((def) => def.id === id)?.label ?? "Project";
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function HomeInstrument({
  featuredProjects,
  recentPosts,
  heroIndex,
  liveToolGroups,
  liveFeed,
}: HomeInstrumentProps) {
  const writingRows = recentPosts.slice(0, 3);

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

            <HomeLiveFeed data={liveFeed} />
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
