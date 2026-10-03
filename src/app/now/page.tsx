import { Metadata } from "next";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData } from "@/lib/seo";

// Hand-curated snapshot of what I'm focused on right now.
// Refresh when anything here goes stale, since this page is meant to feel
// current, not archival.
const NOW_UPDATED = "2026-10-01";
const NOW_UPDATED_LABEL = "October 2026";
const NOW_LOCATION = "Berkeley, CA";

const focus = [
  {
    kicker: "Primary focus",
    title: "Second year at Haas",
    detail:
      "I'm in my second year of the MBA and looking for a full-time role in product management, product marketing, or program management that starts after I graduate in May 2027.",
  },
  {
    kicker: "Finished in August",
    title: "My summer at Juno",
    detail:
      "I spent May to August 2026 as the MBA growth intern at Juno, and in September I published write-ups of that summer and of my three and a half years at Civitech.",
  },
  {
    kicker: "Building",
    title: "One design for the whole site",
    detail:
      "In September I finished moving every page on this site onto one design system, printed in riso colors, and gave each project its own signature visual.",
  },
];

const building = [
  {
    label: "Job Search",
    href: "/mba-internship-notifications",
    detail: "Career page monitoring and an application pipeline for my full-time search.",
  },
  {
    label: "Fantasy football weekly board",
    href: "/fantasy-football/weekly",
    detail: "In-season weekly rankings and waiver targets from the FantasyPros consensus.",
  },
  {
    label: "Investments research",
    href: "/investments",
    detail: "Portfolio tracker with a researcher sidebar and a retirement planner.",
  },
  {
    label: "Bay Area Transit Pulse",
    href: "/bay-area-transit",
    detail: "Live BART departures, lines, and advisories for my home system.",
  },
];

const notBuilding = [
  "A paid product, since this site is a portfolio.",
  "Social media content. I write here and that's it.",
];

/* The mosaic's field cycle, one tile per project in `building`. */
const TILE_SURFACES = ["ink-blue", "ink-saffron", "stone", "chocolate"] as const;

export const metadata: Metadata = constructMetadata({
  title: "What I'm Building Now | Isaac Vazquez",
  description: `What I'm focused on as of ${NOW_UPDATED_LABEL}, from my second year at Haas and my full-time search to what I'm building.`,
  canonicalUrl: "https://isaacvazquez.com/now",
  dateModified: NOW_UPDATED,
});

export default function NowPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Now", url: "/now" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as {
            itemListElement: object[];
          }).itemListElement,
        }}
      />
      <StructuredData
        type="WebPage"
        data={{
          title: "What I'm Building Now",
          description: `What Isaac Vazquez is focused on as of ${NOW_UPDATED_LABEL}, from second year at Haas to active projects.`,
          url: "https://isaacvazquez.com/now",
          dateModified: NOW_UPDATED,
        }}
      />

      {/* Hero */}
      <section
        className="c97-band"
        data-c97-surface="paper"
        aria-label="Now, current focus"
      >
        <div className="c97-shell">
          <p className="c97-kicker">
            Now · Updated {NOW_UPDATED_LABEL} · {NOW_LOCATION}
          </p>
          <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-3)" }}>
            What I&apos;m working on right now.
          </h1>
          <p
            className="c97-lead"
            style={{
              marginTop: "var(--c97-sp-3)",
              maxWidth: "var(--c97-measure-wide)",
            }}
          >
            This is what I&apos;m spending my time on as of{" "}
            {NOW_UPDATED_LABEL}, which is roughly what I&apos;d talk about if
            we grabbed coffee. The idea comes from Derek Sivers&apos;{" "}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="c97-link"
            >
              /now page movement
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
        </div>
      </section>

      {/* Focus */}
      <section className="c97-band c97-band-continues" data-c97-surface="paper">
        <div className="c97-shell">
          <h2 className="c97-serif c97-h2">Focus</h2>
          <div className="c97-columns" style={{ marginTop: "var(--c97-sp-4)" }}>
            {focus.map((item) => (
              <div key={item.title}>
                <p className="c97-kicker">{item.kicker}</p>
                <h3
                  className="c97-serif c97-h3"
                  style={{ marginTop: "var(--c97-sp-1)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="c97-prose"
                  style={{
                    marginTop: "var(--c97-sp-1)",
                    color: "var(--c97-ink-2)",
                  }}
                >
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Currently building */}
      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell">
          <h2 className="c97-serif c97-h2">Currently building</h2>
          <p
            className="c97-prose"
            style={{
              marginTop: "var(--c97-sp-2)",
              color: "var(--c97-ink-2)",
            }}
          >
            The projects I&apos;m spending the most time on. The rest of the
            site keeps running, and most dashboards refresh on their own
            schedules, while any that miss a refresh keep their last snapshot
            and show its date.
          </p>
          <div className="c97-mosaic" style={{ marginTop: "var(--c97-sp-4)" }}>
            {building.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                data-c97-surface={TILE_SURFACES[index % TILE_SURFACES.length]}
                className="c97-tile"
              >
                <span className="c97-kicker">{item.label}</span>
                <span
                  className="c97-prose"
                  style={{ maxWidth: "var(--c97-measure-body)" }}
                >
                  {item.detail}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What I'm not doing */}
      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="deckle">
        <div className="c97-shell">
          <h2 className="c97-serif c97-h2">What I&apos;m not doing</h2>
          <p
            className="c97-prose"
            style={{
              marginTop: "var(--c97-sp-2)",
              color: "var(--c97-ink-2)",
            }}
          >
            Saying no is the more interesting part of a /now page. Here&apos;s
            what I&apos;m deliberately not working on.
          </p>
          <ul className="c97-list" style={{ marginTop: "var(--c97-sp-3)" }}>
            {notBuilding.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Keep up */}
      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell">
          <h2 className="c97-serif c97-h2">Keep up</h2>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
            The{" "}
            <Link href="/changelog" className="c97-link">
              changelog
            </Link>{" "}
            tracks what shipped on this site. The{" "}
            <Link href="/writing" className="c97-link">
              writing archive
            </Link>{" "}
            is where longer thinking lands. For anything else,{" "}
            <Link href="/contact" className="c97-link">
              send a note
            </Link>
            .
          </p>
          <p className="c97-meta" style={{ marginTop: "var(--c97-sp-4)" }}>
            <span>
              Last updated {NOW_UPDATED_LABEL}. If anything on this page looks
              stale, it probably is. Ping me.
            </span>
          </p>
        </div>
      </section>
    </>
  );
}
