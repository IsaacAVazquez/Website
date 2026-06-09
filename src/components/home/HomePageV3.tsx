import Image from "next/image";
import Link from "next/link";
import type { CaseStudyData } from "@/constants/caseStudies";
import type { BlogPostPreview } from "@/lib/blog";
import { publishedDateFormatter } from "@/lib/utils";
import styles from "@/app/page.module.css";

interface HomePageV3Props {
  featuredProjects: CaseStudyData[];
  recentPosts: BlogPostPreview[];
  heroIndex: {
    projectCount: number;
    essayCount: number;
    liveToolCount: number;
  };
}

// Three cover variants ship in the CSS module. We cycle through them so
// each "Selected work" card picks up a distinct treatment without us
// having to encode it on the case-study itself.
const COVER_VARIANTS = ["cov-research", "cov-memo", "cov-fantasy"] as const;
const TAG_VARIANTS = ["is-acid", "is-haze", "is-outline"] as const;

function ArrowRightSm() {
  return (
    <svg
      width="14"
      height="14"
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

function ArrowRightMd() {
  return (
    <svg
      width="16"
      height="16"
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

function MailIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
      <path d="M3 7l9 6l9 -6" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
      <path d="M8 11l0 5" />
      <path d="M8 8l0 .01" />
      <path d="M12 16l0 -5" />
      <path d="M16 16v-3a2 2 0 0 0 -4 0" />
    </svg>
  );
}

function classes(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function HomePageV3({
  featuredProjects,
  recentPosts,
  heroIndex,
}: HomePageV3Props) {
  const writingCards = recentPosts.slice(0, 3);

  return (
    <div className={styles.page}>
      {/* Hero (acid band) */}
      <section className={styles["h-hero"]} aria-labelledby="home-hero-wordmark" data-testid="hero">
        <div className={styles.shell}>
          <div className={styles["h-hero-top"]}>
            <div className={styles["h-kicker-row"]}>
              <span className={styles.dept}>Studio &middot; 01</span>
              <span>Isaac Vazquez &middot; Portfolio</span>
              <span>&mdash;</span>
              <span>Vol. 2026</span>
            </div>
            <div className={styles["h-hero-right"]}>
              <span className={styles.pin}>Currently &middot; AI decision tools</span>
            </div>
          </div>

          <h1 id="home-hero-wordmark" className={styles["h-wordmark"]}>
            ISAAC VAZQUEZ
          </h1>

          <div className={styles["h-hero-subline"]}>
            <p className={styles["h-tagline"]}>
              Product manager &amp; builder making hard problems <em>easier</em> to act on.
            </p>
            <div className={styles["h-sideblock"]}>
              <div className={styles["h-stat-strip"]}>
                <div>
                  <span className={styles.lbl}>Projects</span>
                  <span className={styles.val}>{heroIndex.projectCount}</span>
                </div>
                <div>
                  <span className={styles.lbl}>Essays</span>
                  <span className={styles.val}>{heroIndex.essayCount}</span>
                </div>
                <div>
                  <span className={styles.lbl}>Live tools</span>
                  <span className={styles.val}>{heroIndex.liveToolCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meta band: ink strip with 4 cells, sits at the bottom of the acid hero */}
        <div className={styles["h-meta-band"]}>
          <div className={styles.shell}>
            <div className={styles["h-meta-cells"]}>
              <div className={styles["h-meta-cell"]}>
                <span className={styles.lbl}>Role</span>
                <span className={styles.val}>
                  Product manager <em>&amp;</em> builder
                </span>
              </div>
              <div className={styles["h-meta-cell"]}>
                <span className={styles.lbl}>Focus</span>
                <span className={styles.val}>AI workflows &middot; Fintech &middot; Analytics</span>
              </div>
              <div className={styles["h-meta-cell"]}>
                <span className={styles.lbl}>Education</span>
                <span className={styles.val}>
                  Berkeley Haas <em>&middot;</em> MBA &rsquo;27
                </span>
              </div>
              <div className={styles["h-meta-cell"]}>
                <span className={styles.lbl}>Index</span>
                <span className={styles.val}>
                  {heroIndex.projectCount} projects &middot; {heroIndex.essayCount} writings &middot;{" "}
                  {heroIndex.liveToolCount} tools
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee band */}
      <div className={styles["h-band"]} aria-hidden="true">
        <div className={styles["h-band-inner"]}>
          <div className={styles.marquee}>
            <span className={styles.hot}>Now &middot; Decision memo for AI workflows</span>
            <span>Vol. 2026</span>
            <span>{heroIndex.projectCount} projects shipped</span>
            <span>{heroIndex.essayCount} essays + notes</span>
            <span>{heroIndex.liveToolCount} live tools in production</span>
            <span>Berkeley Haas &rsquo;27</span>
            <span className={styles.hot}>Now &middot; Decision memo for AI workflows</span>
            <span>Vol. 2026</span>
            <span>{heroIndex.projectCount} projects shipped</span>
            <span>{heroIndex.essayCount} essays + notes</span>
            <span>{heroIndex.liveToolCount} live tools in production</span>
            <span className={styles.hot}>Berkeley Haas &rsquo;27</span>
          </div>
        </div>
      </div>

      {/* Bio / about */}
      <section className={styles["h-bio"]} aria-labelledby="home-bio-heading">
        <div className={styles["h-bio-grid"]}>
          <div className={styles["h-bio-photo"]}>
            <Image
              src="/images/headshot-home.webp"
              alt="Isaac Vazquez"
              width={1200}
              height={1799}
              priority
              sizes="(max-width: 880px) 100vw, 42vw"
            />
            <div className={styles["photo-meta"]}>
              <span>Portrait &middot; 2025</span>
              <span className={styles.corner}>&#8599;</span>
            </div>
          </div>
          <div className={styles["h-bio-body"]}>
            <span className={styles.akicker}>About</span>
            <h2 id="home-bio-heading">
              Product work where judgment &amp; <em>follow-through</em> have to survive contact
              with users.
            </h2>
            <p>
              Most of my work lives where product judgment, AI workflows, and clear decision
              support have to hold together at the same time &mdash; case studies,
              PM-focused writing, and interactive fintech tools built to make complex choices
              easier to inspect.
            </p>
            <div className={styles["h-bio-actions"]}>
              <Link className={styles["h-btn"]} href="/portfolio">
                View projects
                <ArrowRightSm />
              </Link>
              <Link
                className={classes(styles["h-btn"], styles["is-paper"])}
                href="/writing"
              >
                Read writing
                <ArrowRightSm />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className={styles["h-section"]} id="projects" aria-labelledby="home-projects-heading">
        <div className={styles.shell}>
          <div className={styles["h-section-head"]}>
            <div className={styles.left}>
              <span className={styles["h-section-kicker"]}>
                <span className={styles.num}>03</span> Selected work
              </span>
              <h2 id="home-projects-heading" className={styles["h-section-title"]}>
                Product surfaces that show how I <em>think</em> in practice.
              </h2>
            </div>
            <Link className={styles["h-section-link"]} href="/portfolio">
              All projects
              <ArrowRightMd />
            </Link>
          </div>

          <div className={styles["h-proj-grid"]} data-testid="home-projects">
            {featuredProjects.slice(0, 3).map((project, index) => {
              const href = project.link ?? `/portfolio/${project.slug}`;
              const isInternal = href.startsWith("/");
              const cover = COVER_VARIANTS[index % COVER_VARIANTS.length];
              const tagTone = TAG_VARIANTS[index % TAG_VARIANTS.length];
              const blurb =
                project.overview.impact.trim() || project.description.trim();
              const tagLabel = project.tools[0] ?? "Product";
              const id = String(index + 1).padStart(2, "0");

              const inner = (
                <>
                  <div className={styles.num}>
                    <span className={styles.id}>&#8470;&nbsp;{id}</span>
                    <span>Case study</span>
                  </div>
                  <div className={styles.img} aria-hidden="true" />
                  <h3>{project.title}</h3>
                  <p>{blurb}</p>
                  <div className={styles.footrow}>
                    <span className={classes(styles["h-tag"], styles[tagTone])}>
                      {tagLabel}
                    </span>
                    <span className={styles["meta-mono"]}>
                      {project.timeline} &middot; {project.role}
                    </span>
                  </div>
                </>
              );

              const cardClass = classes(styles["h-proj"], styles[cover]);

              if (isInternal) {
                return (
                  <Link key={project.slug} className={cardClass} href={href}>
                    {inner}
                  </Link>
                );
              }

              return (
                <a
                  key={project.slug}
                  className={cardClass}
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

      {/* Manifesto (inverted ink) */}
      <section className={styles["h-manifesto"]} aria-labelledby="home-manifesto-heading">
        <div className={styles.shell}>
          <div className={styles["h-manifesto-grid"]}>
            <div className={styles["h-manifesto-num"]}>04</div>
            <div className={styles["h-manifesto-body"]}>
              <p
                id="home-manifesto-heading"
                className={styles["h-manifesto-statement"]}
              >
                A clearer way to make ambitious <em>product</em> work feel usable.{" "}
                <strong>Tradeoffs legible. Scope honest. Follow-through visible.</strong>
              </p>
            </div>
            <div className={styles["h-manifesto-aside"]}>
              <span className={styles.akicker}>Point of view</span>
              <p className={styles.ascopy}>
                I don&rsquo;t think product work gets stronger when it sounds more abstract.
                It gets stronger when tradeoffs are legible, scope is honest, and the product
                helps someone make a better decision without making them work harder for it.
              </p>
              <div className={styles.pillrow}>
                <span>Reliability</span>
                <span>Decision support</span>
                <span>Analytics</span>
                <span>Workflow design</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Writing */}
      <section
        className={classes(styles["h-section"], styles["h-write"])}
        id="writing"
        aria-labelledby="home-writing-heading"
      >
        <div className={styles.shell}>
          <div className={styles["h-section-head"]}>
            <div className={styles.left}>
              <span className={styles["h-section-kicker"]}>
                <span className={styles.num}>05</span> Proof of work
              </span>
              <h2 id="home-writing-heading" className={styles["h-section-title"]}>
                Writing on PM, <em>AI workflows</em>, and fintech tools.
              </h2>
            </div>
            <Link className={styles["h-section-link"]} href="/writing">
              The archive
              <ArrowRightMd />
            </Link>
          </div>

          <div className={styles["h-write-grid"]} data-testid="home-writing">
            {writingCards.map((post, index) => {
              const tagTone = TAG_VARIANTS[index % TAG_VARIANTS.length];
              const id = String(index + 1).padStart(2, "0");
              const formattedDate = publishedDateFormatter.format(
                new Date(post.publishedAt)
              );

              return (
                <Link
                  key={post.slug}
                  className={styles["h-write-card"]}
                  href={`/writing/${post.slug}`}
                >
                  <div className={styles.num}>
                    <span className={styles.id}>&#8470;&nbsp;{id}</span>
                    <span>
                      {post.category} &middot; {post.readingTime}
                    </span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <div className={styles.footrow}>
                    <span className={classes(styles["h-tag"], styles[tagTone])}>
                      {post.category}
                    </span>
                    <span className={styles["meta-mono"]}>{formattedDate}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Practice stats */}
      <section
        className={classes(styles["h-section"], styles["h-stats"])}
        aria-labelledby="home-stats-heading"
      >
        <div className={styles.shell}>
          <div className={styles["h-section-head"]}>
            <div className={styles.left}>
              <span className={styles["h-section-kicker"]}>
                <span className={styles.num}>06</span> Practice at a glance
              </span>
              <h2 id="home-stats-heading" className={styles["h-section-title"]}>
                The numbers behind the <em>practice</em>.
              </h2>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--h-muted)",
              }}
            >
              Live &middot; refreshed today
            </span>
          </div>

          <div className={styles["h-stats-grid"]}>
            <div className={classes(styles["h-stat-cell"], styles["is-feature"])}>
              <span className={styles.lbl}>Projects shipped</span>
              <span className={styles.val}>
                {heroIndex.projectCount} <em>active</em>
              </span>
              <span className={styles.sub}>{heroIndex.liveToolCount} live tools in production</span>
            </div>
            <div className={styles["h-stat-cell"]}>
              <span className={styles.lbl}>Live tools</span>
              <span className={styles.val}>
                {String(heroIndex.liveToolCount).padStart(2, "0")}
              </span>
              <span className={styles.sub}>Fintech &middot; analytics &middot; fantasy</span>
            </div>
            <div className={styles["h-stat-cell"]}>
              <span className={styles.lbl}>Pieces written</span>
              <span className={styles.val}>{heroIndex.essayCount}</span>
              <span className={styles.sub}>Essays + notes</span>
            </div>
            <div className={styles["h-stat-cell"]}>
              <span className={styles.lbl}>Focus</span>
              <span className={classes(styles.val, styles["val-sm"])}>AI &middot; Fintech &middot; PM</span>
              <span className={styles.sub}>Where the practice lives</span>
            </div>
            <div className={styles["h-stat-cell"]}>
              <span className={styles.lbl}>Education</span>
              <span className={classes(styles.val, styles["val-sm"])}>Berkeley Haas</span>
              <span className={styles.sub}>MBA &rsquo;27 &middot; Consortium Fellow</span>
            </div>
            <div className={styles["h-stat-cell"]}>
              <span className={styles.lbl}>Most recent</span>
              <span className={classes(styles.val, styles["val-sm"])}>
                {writingCards[0]?.title ?? "Latest essay"}
              </span>
              <span className={styles.sub}>
                {writingCards[0]
                  ? publishedDateFormatter.format(new Date(writingCards[0].publishedAt))
                  : "Updated regularly"}
              </span>
            </div>
            <div className={styles["h-stat-cell"]}>
              <span className={styles.lbl}>Based in</span>
              <span className={classes(styles.val, styles["val-sm"])}>Berkeley, CA</span>
              <span className={styles.sub}>San Francisco Bay Area</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className={styles["h-cta"]} id="contact" aria-labelledby="home-cta-heading">
        <div className={styles.shell}>
          <div className={styles["h-cta-grid"]}>
            <div>
              <span className={styles.kicker}>Contact &middot; Currently open</span>
              <h2 id="home-cta-heading">
                Building something that needs <em>judgment</em> and follow-through?
              </h2>
              <p>
                Especially interested in product, analytics, fintech, and workflow tools where
                clear thinking has to survive real delivery.
              </p>
            </div>
            <div className={styles["h-cta-actions"]}>
              <a
                className={classes(styles["h-btn"], styles["is-acid"])}
                href="mailto:IsaacVazquez@berkeley.edu"
              >
                Send email
                <MailIcon />
              </a>
              <Link
                className={classes(styles["h-btn"], styles["is-ghost-paper"])}
                href="/resume"
              >
                View r&eacute;sum&eacute;
                <DocIcon />
              </Link>
              <a
                className={classes(styles["h-btn"], styles["is-ghost-paper"])}
                href="https://linkedin.com/in/isaac-vazquez"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
                <LinkedInIcon />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
