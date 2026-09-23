import Link from "next/link";
import Image from "next/image";
import styles from "./Catalog97Home.module.css";
import { Catalog97Shell } from "./Catalog97Shell";
import { Catalog97Reveal } from "./Catalog97Reveal";
import {
  getProjectCardSummary,
  type CaseStudyData,
} from "@/constants/caseStudies";
import type { BlogPostPreview } from "@/lib/blog";
import {
  formatPtDate,
  formatPtTime,
  type SnapshotReadouts,
} from "@/lib/catalog97Readouts";

export interface Catalog97HomeProps {
  featuredProjects: CaseStudyData[];
  recentPosts: BlogPostPreview[];
  readouts: SnapshotReadouts;
}

// Every image here was generated for this page on 2026-09-23 as a finished
// riso print, so it renders untouched. They are illustrative, so the alt text
// and captions never claim a real place.
const LAUNCH_PAD = "/images/home/retro-launch-pad.jpg";
const LIFTOFF = "/images/home/retro-liftoff.jpg";
const LIFTOFF_ALT =
  "Illustration of a rocket lifting off beside its launch tower, printed in blue and cream";
const MATCHDAY = "/images/home/retro-matchday.jpg";
const TRANSIT = "/images/home/retro-transit.jpg";

// Projects with a printed plate; any other featured project shows its diagram SVG.
const WORK_PLATES: Record<string, string> = {
  "investment-analytics-platform": "/images/home/retro-markets.jpg",
  "news-pulse-dashboard": "/images/home/retro-press.jpg",
  "interchange-iq": "/images/home/retro-card.jpg",
};

/** "15 Aug 2026" in UTC, the date a post was published. */
function formatPostDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date
        .toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        })
        .replace(/\bSept\b/, "Sep");
}

/** A finished print that fills its frame and scales in as it reveals. */
function Plate({
  src,
  sizes,
  alt = "",
  position,
}: {
  src: string;
  sizes: string;
  alt?: string;
  position?: string;
}) {
  return (
    <div className={styles.plate} data-reveal="">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={styles.plateImage}
        style={position ? { objectPosition: position } : undefined}
      />
    </div>
  );
}

export function Catalog97Home({
  featuredProjects,
  recentPosts,
  readouts,
}: Catalog97HomeProps) {
  const { launch, premierLeague, laLiga, transit, investments, latestPull } =
    readouts;
  const asOf = latestPull ? formatPtDate(latestPull) : null;
  const figureTiles = [
    { href: "/la-liga", readout: laLiga },
    { href: "/bay-area-transit", readout: transit },
    { href: "/investments", readout: investments },
  ];

  return (
    <Catalog97Shell>
      <Catalog97Reveal />

      <section className={`c97-band ${styles.hero}`} data-c97-surface="paper">
        <div className="c97-shell">
          <div className={styles.heroMeta}>
            <p className="c97-kicker">
              Isaac Vazquez · Product and analytics · Berkeley, California
            </p>
            {asOf ? (
              <p className="c97-kicker c97-tabular">Data as of {asOf}</p>
            ) : null}
          </div>
          <h1 className={styles.headline}>
            I build test harnesses, and dashboards that run on public data.
          </h1>
          <div className={styles.heroFoot}>
            <p className={`c97-lead ${styles.lead}`}>
              I’m a product manager and builder at Berkeley Haas, MBA ’27, and I
              came to product through quality engineering at Civitech. The
              dashboards below read snapshots that a scheduled job pulls from
              public sources and commits to this site’s repository, so each one
              shows where its numbers came from and when.
            </p>
            <div className={styles.actions}>
              <Link className="c97-btn" href="/portfolio">
                See the work
              </Link>
              <Link className="c97-btn-ghost" href="/contact">
                Start a conversation
              </Link>
            </div>
          </div>

          {/* The collage repeats what the board below says, so it is decoration. */}
          <div className={styles.collage} aria-hidden="true">
            <figure className={styles.panel}>
              <Plate
                src={LAUNCH_PAD}
                sizes="(max-width: 880px) 100vw, 45vw"
                position="60% 50%"
              />
              <figcaption
                className={styles.captionDark}
                style={{ right: "var(--c97-sp-2)", top: "var(--c97-sp-2)" }}
              >
                {launch?.site ?? "Next launch"}
              </figcaption>
            </figure>
            <figure className={styles.panel}>
              <Plate src={TRANSIT} sizes="(max-width: 880px) 50vw, 34vw" />
              {asOf ? (
                <figcaption
                  className={styles.captionLight}
                  style={{ left: "var(--c97-sp-2)", top: "var(--c97-sp-2)" }}
                >
                  Snapshots, {asOf}
                </figcaption>
              ) : null}
            </figure>
            <figure className={styles.panel}>
              <Plate src={MATCHDAY} sizes="(max-width: 880px) 50vw, 25vw" />
              {premierLeague ? (
                <figcaption
                  className={styles.captionLight}
                  style={{ left: "var(--c97-sp-2)", top: "var(--c97-sp-2)" }}
                >
                  Matchday {premierLeague.matchday}
                </figcaption>
              ) : null}
            </figure>
          </div>
        </div>
      </section>

      {/* Dashboards board, every figure read from a committed snapshot. */}
      <section className="c97-band c97-band-continues" data-c97-surface="paper">
        <div className="c97-shell">
          <div className={styles.sectionHead}>
            <h2 className={`c97-serif ${styles.sectionTitle}`}>Dashboards</h2>
            <Link href="/dashboards" className="c97-sectionlink">
              All dashboards
            </Link>
          </div>
          <div className={styles.bento}>
            {launch ? (
              <Link href="/spacex-mission-control" className={styles.feature}>
                <Plate
                  src={LIFTOFF}
                  alt={LIFTOFF_ALT}
                  sizes="(max-width: 880px) 100vw, 66vw"
                  position="70% 50%"
                />
                <div className={styles.featureText} data-c97-surface="espresso">
                  <span className="c97-kicker">Spaceflight · Next launch</span>
                  <span className="c97-serif c97-h2">
                    {launch.mission} on {launch.vehicle}
                  </span>
                  <span className={`c97-tabular ${styles.small}`}>
                    {launch.site} · {launch.windowLabel}
                  </span>
                  {launch.lastLabel ? (
                    <span className={styles.small}>{launch.lastLabel}</span>
                  ) : null}
                  <span className={styles.source}>
                    Launch Library 2 · pulled {formatPtTime(launch.pulledAt)}
                  </span>
                </div>
              </Link>
            ) : null}

            {premierLeague ? (
              <Link
                href="/premier-league"
                className={`${styles.tile} ${styles.tileTall}`}
              >
                <span className="c97-kicker">
                  Premier League · Matchday {premierLeague.matchday}
                </span>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th colSpan={2} scope="col">
                        Club
                      </th>
                      <th scope="col">P</th>
                      <th scope="col">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {premierLeague.top.map((row) => (
                      <tr key={row.position}>
                        <td className={styles.muted}>{row.position}</td>
                        <td>{row.name}</td>
                        <td className={styles.muted}>{row.played}</td>
                        <td className={styles.points}>{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <span className={styles.detail}>{premierLeague.summary}</span>
                <span className={styles.source}>
                  football-data.org · pulled{" "}
                  {formatPtTime(premierLeague.pulledAt)}
                </span>
              </Link>
            ) : null}

            {figureTiles.map(({ href, readout }) =>
              readout ? (
                <Link key={href} href={href} className={styles.tile}>
                  <span className="c97-kicker">{readout.label}</span>
                  <span className="c97-serif c97-h2 c97-tabular">
                    {readout.figure}
                  </span>
                  <span className={styles.detail}>{readout.detail}</span>
                  <span className={styles.source}>{readout.source}</span>
                </Link>
              ) : null,
            )}
          </div>
        </div>
      </section>

      {/* Selected work */}
      <section className="c97-band c97-band-continues" data-c97-surface="paper">
        <div className={`c97-shell ${styles.split}`}>
          <div className={styles.sticky}>
            <h2 className={`c97-serif ${styles.sectionTitle}`}>
              Selected work
            </h2>
            <p className={`c97-prose ${styles.splitIntro}`}>
              Three projects and the question each one answers.
            </p>
            <Link href="/portfolio" className="c97-sectionlink">
              All projects
            </Link>
          </div>
          <div className={styles.ledger}>
            {featuredProjects.map((project) => {
              const thumb =
                WORK_PLATES[project.slug] ??
                `/images/projects/${project.slug}.svg`;
              return (
                <Link
                  key={project.slug}
                  href={`/portfolio/${project.slug}`}
                  className={styles.entry}
                >
                  <span className={styles.entryCopy}>
                    <span className="c97-kicker c97-tabular">
                      {project.timeline}
                    </span>
                    <span className="c97-serif c97-h2">{project.title}</span>
                    <span className={styles.detail}>
                      {getProjectCardSummary(project)}
                    </span>
                  </span>
                  <span className={styles.thumb}>
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      sizes="220px"
                      className={styles.plateImage}
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent writing */}
      {recentPosts.length > 0 ? (
        <section className="c97-band c97-band-tall" data-c97-surface="paper">
          <div className="c97-shell">
            <div className={styles.sectionHead}>
              <h2 className={`c97-serif ${styles.sectionTitle}`}>
                Recent writing
              </h2>
              <Link href="/writing" className="c97-sectionlink">
                All writing
              </Link>
            </div>
            <div className={styles.posts}>
              {recentPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/writing/${post.slug}`}
                  className={styles.post}
                >
                  <span className={styles.postCopy}>
                    <span className="c97-serif c97-h3">{post.title}</span>
                    <span className={styles.detail}>{post.excerpt}</span>
                  </span>
                  <span className="c97-kicker c97-tabular">
                    {formatPostDate(post.publishedAt)} · {post.category}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Compact closing invitation. */}
      <section
        className={`c97-band ${styles.contactBand}`}
        data-c97-surface="ink-vermilion"
      >
        <div className={`c97-shell ${styles.contactRow}`}>
          <p className={`c97-serif c97-h2 ${styles.contactMessage}`}>
            If you have a thing that needs proving, I would like to hear about
            it.
          </p>
          <Link className="c97-btn-outline" href="/contact">
            Get in touch
          </Link>
        </div>
      </section>
    </Catalog97Shell>
  );
}
