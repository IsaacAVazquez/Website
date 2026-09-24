import Link from "next/link";
import Image from "next/image";
import styles from "./Catalog97Home.module.css";
import { Catalog97Shell } from "./Catalog97Shell";
import { Catalog97Collage, type CollagePanel } from "./Catalog97Collage";
import { PROJECT_PLATES } from "./projectPlates";
import {
  getProjectCardSummary,
  type CaseStudyData,
} from "@/constants/caseStudies";
import type { BlogPostPreview } from "@/lib/blog";
import { formatPtTime, type SnapshotReadouts } from "@/lib/catalog97Readouts";

export interface Catalog97HomeProps {
  featuredProjects: CaseStudyData[];
  recentPosts: BlogPostPreview[];
  readouts: SnapshotReadouts;
}

// Every plate here was generated for this page on 2026-09-23 as a finished
// riso print, so it renders untouched. They are illustrative, so no label on
// them claims the picture shows a real place.
const LAUNCH_PAD = "/images/home/retro-launch-pad.jpg";
const MATCHDAY = "/images/home/retro-matchday.jpg";
const TRANSIT = "/images/home/retro-transit.jpg";
const PORTRAIT = "/images/headshot-home.webp";

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

export function Catalog97Home({
  featuredProjects,
  recentPosts,
  readouts,
}: Catalog97HomeProps) {
  const { launch, premierLeague, laLiga, transit, investments } = readouts;
  // The two dashboards the collage does not carry, printed as small ink sheets under it.
  const stripTiles = [
    { href: "/la-liga", readout: laLiga, surface: "ink-vermilion" },
    { href: "/investments", readout: investments, surface: "ink-peach" },
  ] as const;

  // The dashboard doors in the collage, each a plate with its live readout pasted on.
  const boardPanels: CollagePanel[] = [
    {
      src: LAUNCH_PAD,
      sizes: "(max-width: 880px) 100vw, 45vw",
      position: "60% 50%",
      href: "/spacex-mission-control",
      label: "Spaceflight dashboard",
      card: launch ? (
        <>
          <span className="c97-kicker">Next launch</span>
          <span className={`c97-poster-sm ${styles.cardFigure}`}>
            {launch.mission}
          </span>
          <span className={`c97-tabular ${styles.small}`}>
            {launch.vehicle} · {launch.site} · {launch.windowLabel}
          </span>
          <span className={styles.source}>
            Launch Library 2 · pulled {formatPtTime(launch.pulledAt)}
          </span>
        </>
      ) : null,
    },
    {
      src: TRANSIT,
      href: "/bay-area-transit",
      label: "Bay Area transit dashboard",
      card: transit ? (
        <>
          <span className="c97-kicker">{transit.label}</span>
          <span className={`c97-poster-sm c97-tabular ${styles.cardFigure}`}>
            {transit.figure}
          </span>
          <span className={styles.small}>{transit.detail}</span>
          <span className={styles.source}>{transit.source}</span>
        </>
      ) : null,
    },
    {
      src: MATCHDAY,
      sizes: "(max-width: 880px) 100vw, 25vw",
      href: "/premier-league",
      label: "Premier League dashboard",
      card: premierLeague ? (
        <>
          <span className="c97-kicker">
            Premier League · Matchday {premierLeague.matchday}
          </span>
          <table className={styles.table}>
            <thead>
              <tr>
                <th colSpan={2} scope="col">
                  Club
                </th>
                <th scope="col">Pts</th>
              </tr>
            </thead>
            <tbody>
              {premierLeague.top.map((row) => (
                <tr key={row.position}>
                  <td className={styles.muted}>{row.position}</td>
                  <td>{row.name}</td>
                  <td className={styles.points}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <span className={styles.source}>
            football-data.org · pulled {formatPtTime(premierLeague.pulledAt)}
          </span>
        </>
      ) : null,
    },
  ];

  return (
    <Catalog97Shell>
      {/* The hero sheet: the poster headline and the portrait. */}
      <section
        className={`c97-band c97-sheet ${styles.hero}`}
        data-c97-surface="paper"
      >
        <div className="c97-shell">
          <div className={styles.heroGrid}>
            <div className={`c97-offset ${styles.portrait}`}>
              <Image
                src={PORTRAIT}
                alt="Isaac Vazquez"
                fill
                priority
                sizes="(max-width: 880px) 72vw, 42vw"
                className={styles.portraitImage}
              />
            </div>
            <div className={styles.heroCopy}>
              <h1 className={`c97-poster ${styles.headline}`}>
                I build test harnesses, and dashboards that run on public data.
              </h1>
              <div className={styles.actions}>
                <Link className="c97-btn c97-offset" href="/portfolio">
                  See the work
                </Link>
                <Link className="c97-btn-ghost" href="/contact">
                  Start a conversation
                </Link>
              </div>
              <p className={`c97-lead ${styles.lead}`}>
                I’m a product manager and builder at Berkeley Haas, MBA ’27, and
                I came to product through quality engineering at Civitech. The
                dashboards below read snapshots that a scheduled job pulls from
                public sources and commits to this site’s repository, so each
                one shows where its numbers came from and when.
              </p>
            </div>
          </div>
          <div className={styles.boardHead}>
            <h2 className="c97-poster-sm">Dashboards</h2>
            <Link href="/dashboards" className="c97-sectionlink">
              All dashboards
            </Link>
          </div>
          <Catalog97Collage panels={boardPanels} />
          <div className={styles.strip}>
            {stripTiles.map(({ href, readout, surface }) =>
              readout ? (
                <Link
                  key={href}
                  href={href}
                  className={`c97-tile ${styles.stripTile}`}
                  data-c97-surface={surface}
                >
                  <span className="c97-kicker">{readout.label}</span>
                  <span
                    className={`c97-poster-sm c97-tabular ${styles.cardFigure}`}
                  >
                    {readout.figure}
                  </span>
                  <span className={styles.small}>{readout.detail}</span>
                  <span className={styles.source}>{readout.source}</span>
                </Link>
              ) : null,
            )}
          </div>
        </div>
      </section>

      {/* Selected work, three plates across the page's lead ink. */}
      <section
        className="c97-band c97-band-tall c97-sheet"
        data-c97-surface="ink-blue"
        data-seam="torn"
      >
        <div className="c97-shell">
          <div className={styles.workHead}>
            <h2 className="c97-poster-sm">Selected work</h2>
            <div className={styles.workNote}>
              <p className={`c97-prose ${styles.workIntro}`}>
                Three projects and the question each one answers.
              </p>
              <Link href="/portfolio" className="c97-sectionlink">
                All projects
              </Link>
            </div>
          </div>
          <div className={styles.workGrid}>
            {featuredProjects.map((project) => (
              <Link
                key={project.slug}
                href={`/portfolio/${project.slug}`}
                className={styles.workCard}
              >
                <span className={`c97-offset ${styles.workPlate}`}>
                  <Image
                    src={
                      PROJECT_PLATES[project.slug] ??
                      `/images/projects/${project.slug}.svg`
                    }
                    alt=""
                    fill
                    sizes="(max-width: 880px) 100vw, 33vw"
                  />
                </span>
                <span className="c97-kicker c97-tabular">
                  {project.timeline}
                </span>
                <span className="c97-serif c97-h3">{project.title}</span>
                <span className={styles.workSummary}>
                  {getProjectCardSummary(project)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent writing */}
      {recentPosts.length > 0 ? (
        <section
          className="c97-band c97-band-tall c97-sheet"
          data-c97-surface="paper"
          data-seam="torn"
        >
          <div className="c97-shell">
            <div className={styles.sectionHead}>
              <h2 className="c97-poster-sm">Recent writing</h2>
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
        className={`c97-band c97-sheet ${styles.contactBand}`}
        data-c97-surface="ink-vermilion"
        data-seam="torn"
      >
        <div className={`c97-shell ${styles.contactRow}`}>
          <p className={`c97-poster-sm ${styles.contactMessage}`}>
            If you have a thing that needs proving, I would like to hear about
            it.
          </p>
          <Link className="c97-btn-outline c97-offset" href="/contact">
            Get in touch
          </Link>
        </div>
      </section>
    </Catalog97Shell>
  );
}
