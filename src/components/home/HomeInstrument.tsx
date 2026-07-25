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

/*
 * DIRECTION CONTRACT — "The Atlas" (redesign, mode: persuade; seed 12bae448, reroll 1, index 5)
 * THESIS: home is a surveyed chart of a body of built work, read at a glance as
 *   territory. It refuses the portfolio-as-list and the single hero sentence.
 * OWN-WORLD: Working Instrument evolved into a survey chart — limestone paper,
 *   graphite ink, one signal accent, mono readouts, plus graticule linework,
 *   plate numbers, grid refs, a legend, and corner ticks. Cartographic marks
 *   carry real information: the three featured projects are plotted on the
 *   overview map at coordinates their cards echo, domains label real regions.
 * STORY: a peer reads the scale of what Isaac ships in one viewport (building
 *   first), believes he is a serious builder who also thinks clearly, and opens
 *   the work or the writing.
 * FIRST VIEWPORT: a chart plate. A title cartouche (name, the kept claim, real
 *   Berkeley coordinates) leads; the graticule field beside it plots the
 *   featured work and carries the live "field readings" and the index legend.
 * FORM: survey chart; #5 of the grounded list, the assigned roll; light-first.
 */

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

// A survey corner tick, repeated at the four corners of a large plate to read
// as a registered chart sheet. Reserved for the hero and about plates; the
// small work cards stay clean.
function CornerTicks() {
  return (
    <span className={styles.ticks} aria-hidden="true">
      <span className={styles.tickTL} />
      <span className={styles.tickTR} />
      <span className={styles.tickBL} />
      <span className={styles.tickBR} />
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

// The domains the work spans, labeled as faint regions on the overview
// graticule (context, no markers). Real focus areas on a 100×100 field.
const TERRITORY = [
  { label: "Civic tech", x: 17, y: 26 },
  { label: "Fintech", x: 58, y: 19 },
  { label: "AI tooling", x: 85, y: 44 },
  { label: "Analytics", x: 40, y: 66 },
  { label: "Writing", x: 20, y: 84 },
];

// The three featured projects, plotted as the signal markers on the overview
// map. Each grid ref is echoed on the matching card, so the ref locates a real
// site on the chart rather than referencing nothing. Positions are a schematic
// layout, not a geographic claim.
const PROJECT_PLOTS = [
  { x: 33, y: 47, ref: "B·2" },
  { x: 66, y: 33, ref: "D·1" },
  { x: 79, y: 63, ref: "E·3" },
];

export function HomeInstrument({
  featuredProjects,
  recentPosts,
  heroIndex,
  liveToolGroups,
  liveFeed,
}: HomeInstrumentProps) {
  const writingRows = recentPosts.slice(0, 3);
  const heroProjects = featuredProjects.slice(0, 3);
  const toolTotal = liveToolGroups.reduce(
    (sum, group) => sum + group.tools.length,
    0
  );
  const toolCategories = liveToolGroups.map((group) => group.label);

  return (
    <div className={styles.page}>
      {/* Plate 00 — the overview chart. A title cartouche leads; the graticule
          field plots the featured work and carries live field readings. */}
      <section
        className={styles.hero}
        aria-labelledby="home-hero-heading"
        data-testid="hero"
      >
        <div className={styles.shell}>
          <div className={styles.plate}>
            <CornerTicks />
            <div className={styles.plateBar}>
              <span className={styles.plateNo}>Plate 00</span>
              <span className={styles.plateName}>The overview</span>
              <span className={styles.plateCoord}>37.8715°N · 122.2730°W</span>
            </div>

            <div className={styles.heroGrid}>
              <div className={styles.cartouche}>
                <p className={styles.kicker}>
                  Isaac Vazquez · Product manager &amp; builder · Berkeley, CA
                </p>
                <h1 id="home-hero-heading" className={styles.headline}>
                  I build tools that make hard problems <em>easier</em> to act
                  on<span className={styles.stop} aria-hidden="true">.</span>
                </h1>
                <p className={styles.dek}>
                  Product manager and builder, Berkeley Haas MBA &rsquo;27. What
                  you&rsquo;re looking at is a survey of the work, and{" "}
                  {heroIndex.liveToolCount} of these tools are live in
                  production right now, running on real data that refreshes
                  itself.
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

                <dl className={styles.index} aria-label="Survey index">
                  <div className={`${styles.indexCell} ${styles.indexPrimary}`}>
                    <dt>Projects</dt>
                    <dd>{pad2(heroIndex.projectCount)}</dd>
                  </div>
                  <div className={styles.indexCell}>
                    <dt>Live tools</dt>
                    <dd>{pad2(heroIndex.liveToolCount)}</dd>
                  </div>
                  <div className={styles.indexCell}>
                    <dt>Essays</dt>
                    <dd>{pad2(heroIndex.essayCount)}</dd>
                  </div>
                </dl>
              </div>

              <div className={styles.chartField}>
                <div className={styles.chartMap} aria-hidden="true">
                  <span className={styles.compass}>N</span>
                  {TERRITORY.map((zone) => (
                    <span
                      key={zone.label}
                      className={styles.zone}
                      style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                    >
                      {zone.label}
                    </span>
                  ))}
                  {heroProjects.map((project, index) => {
                    const plot = PROJECT_PLOTS[index];
                    if (!plot) return null;
                    return (
                      <span
                        key={project.slug}
                        className={styles.plot}
                        style={{ left: `${plot.x}%`, top: `${plot.y}%` }}
                      >
                        <span className={styles.plotDot} />
                        <span className={styles.plotRef}>{plot.ref}</span>
                      </span>
                    );
                  })}
                  <span className={styles.legend}>
                    <span className={styles.legendDot} />
                    <span className={styles.legendText}>Surveyed site</span>
                  </span>
                </div>
                <HomeLiveFeed data={liveFeed} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plate 01 — surveyed sites (selected work). Exactly three links. */}
      <section
        className={styles.section}
        id="projects"
        aria-labelledby="home-projects-heading"
      >
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitleWrap}>
              <span className={styles.sectionPlate}>Plate 01</span>
              <h2 id="home-projects-heading" className={styles.sectionTitle}>
                Selected work
              </h2>
            </div>
            <Link className={styles.sectionLink} href="/portfolio">
              All {heroIndex.projectCount} projects
              <ArrowRight />
            </Link>
          </div>
          <p className={styles.sectionDek}>
            The three sites plotted on the map above, each with what it actually
            moved.
          </p>

          <div className={styles.workGrid} data-testid="home-projects">
            {heroProjects.map((project, index) => {
              const href = project.link ?? `/portfolio/${project.slug}`;
              const isInternal = href.startsWith("/");
              const summary = getProjectCardSummary(project);
              const category = categoryLabelFor(project.slug);
              const isLive = Boolean(project.link);
              const gridRef = PROJECT_PLOTS[index]?.ref ?? "";

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
                    {gridRef ? (
                      <span className={styles.cardGridRef}>{gridRef}</span>
                    ) : null}
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
                    <span className={styles.cardGo} aria-hidden="true">
                      Survey
                      <ArrowRight size={12} />
                    </span>
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

      {/* Plate 02 — the surveyor (about). */}
      <section
        className={styles.section}
        id="about"
        aria-labelledby="home-about-heading"
      >
        <div className={styles.shell}>
          <div className={styles.plate}>
            <CornerTicks />
            <div className={styles.plateBar}>
              <span className={styles.plateNo}>Plate 02</span>
              <span className={styles.plateName}>The surveyor</span>
            </div>
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
                  I build product work where judgment and follow-through have to
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
              <dl className={styles.aboutFacts} aria-label="Surveyor's legend">
                <div className={styles.factRow}>
                  <dt className={styles.factLbl}>Focus</dt>
                  <dd className={styles.factVal}>
                    AI workflows · fintech · analytics
                  </dd>
                </div>
                <div className={styles.factRow}>
                  <dt className={styles.factLbl}>Education</dt>
                  <dd className={styles.factVal}>
                    Berkeley Haas MBA &rsquo;27 · Consortium Fellow
                  </dd>
                </div>
                <div className={styles.factRow}>
                  <dt className={styles.factLbl}>Background</dt>
                  <dd className={styles.factVal}>
                    QA → product · 6+ years in civic tech
                  </dd>
                </div>
                <div className={styles.factRow}>
                  <dt className={styles.factLbl}>Based in</dt>
                  <dd className={styles.factVal}>Berkeley, California</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Plate 03 — the wider territory (tools, deliberately demoted). One quiet
          strip; tools are personal work, not the pitch. */}
      <section
        className={styles.section}
        id="tools"
        aria-labelledby="home-tools-heading"
      >
        <div className={styles.shell}>
          <div className={styles.territory} data-testid="home-tools">
            <div className={styles.territoryHead}>
              <span className={styles.sectionPlate}>Plate 03</span>
              <h2 id="home-tools-heading" className={styles.territoryTitle}>
                The wider territory
              </h2>
            </div>
            <p className={styles.territoryCopy}>
              Past the featured sites, {toolTotal} smaller tools run across{" "}
              {toolCategories.slice(0, -1).join(", ")}
              {toolCategories.length > 1 ? ", and " : ""}
              {toolCategories[toolCategories.length - 1]}. Mostly things I built
              because I wanted them to exist, all live on real data.
            </p>
            <Link className={styles.territoryLink} href="/portfolio">
              Open the full map
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Plate 04 — field log (recent writing). Exactly three links. */}
      <section
        className={`${styles.section} ${styles.sectionLast}`}
        id="writing"
        aria-labelledby="home-writing-heading"
      >
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitleWrap}>
              <span className={styles.sectionPlate}>Plate 04</span>
              <h2 id="home-writing-heading" className={styles.sectionTitle}>
                Recent writing
              </h2>
            </div>
            <Link className={styles.sectionLink} href="/writing">
              All writing
              <ArrowRight />
            </Link>
          </div>
          <p className={styles.sectionDek}>
            Field log. What I&rsquo;ve been thinking through lately.
          </p>

          <div className={styles.writeList} data-testid="home-writing">
            {writingRows.map((post, index) => (
              <Link
                key={post.slug}
                className={styles.writeRow}
                href={`/writing/${post.slug}`}
              >
                <span className={styles.folioNo} aria-hidden="true">
                  {pad2(index + 1)}
                </span>
                <span className={styles.folio}>
                  {publishedDateFormatter.format(new Date(post.publishedAt))}
                </span>
                <h3>{post.title}</h3>
                <span className={styles.rowMeta}>
                  {post.category} · {post.readingTime}
                </span>
                <span className={styles.rowGo} aria-hidden="true">
                  <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA — the shared component, so the homepage still ends on the
          standard ask. */}
      <ContactCta />
    </div>
  );
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
  liveFeed: HomeLiveFeedData;
}
