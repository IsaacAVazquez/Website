import { Metadata } from "next";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData } from "@/lib/seo";

// Hand-curated snapshot of what I'm focused on right now.
// Refresh when anything here goes stale — this page is meant to feel
// current, not archival.
const NOW_UPDATED = "2026-06-10";
const NOW_UPDATED_LABEL = "June 2026";
const NOW_LOCATION = "Berkeley, CA";

const focus = [
  {
    kicker: "Primary focus",
    title: "Haas MBA, between years",
    detail:
      "First year is in the books. I'm spending the summer putting the coursework to work and keeping the MBA internship tracker sharp for the next recruiting cycle.",
  },
  {
    kicker: "Building",
    title: "World Cup Pulse",
    detail:
      "A tournament hub for the first 48-team World Cup, live for the June 11 kickoff. Group tables, the knockout bracket, and the third-place race, refreshed every six hours.",
  },
  {
    kicker: "Writing",
    title: "Two series at once",
    detail:
      "A daily countdown through the top ten World Cup contenders, alongside the ongoing agentic AI series on evals, costs, and what agents change about PM craft.",
  },
];

const reading = [
  {
    title: "The Hard Thing About Hard Things",
    author: "Ben Horowitz",
    note: "Re-read while getting through an MBA group project that ran off the rails.",
  },
  {
    title: "High Output Management",
    author: "Andy Grove",
    note: "Still the clearest lens I have for thinking about leverage.",
  },
  {
    title: "The Age of AI",
    author: "Henry Kissinger, Eric Schmidt, Daniel Huttenlocher",
    note: "Keeps me honest about the bigger picture behind the tooling work.",
  },
];

const building = [
  {
    label: "World Cup 2026 hub",
    href: "/world-cup-2026",
    detail: "Groups, knockout rounds, and the third-place race for all 48 teams.",
  },
  {
    label: "MBA internship tracker",
    href: "/mba-internship-notifications",
    detail: "Role aggregation and notifications for my cohort.",
  },
  {
    label: "Investments research",
    href: "/investments",
    detail: "Portfolio tracker with a researcher sidebar and a new retirement planner.",
  },
  {
    label: "Bay Area Transit Pulse",
    href: "/bay-area-transit",
    detail: "Live BART departures, lines, and advisories for my home system.",
  },
];

const notBuilding = [
  "New side projects outside this site. The surface is wide enough already.",
  "A paid product. This is a portfolio, not a business.",
  "Social media content. I write here and that's it.",
];

/* The mosaic's field cycle, one tile per project in `building`. */
const TILE_SURFACES = ["pine", "camel", "stone", "chocolate"] as const;

export const metadata: Metadata = constructMetadata({
  title: "What I'm Building Now | Isaac Vazquez",
  description: `What Isaac Vazquez is focused on right now, including current work, reading, side projects, and location. Updated ${NOW_UPDATED_LABEL}.`,
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
            A living snapshot. Not a résumé, not a backlog. If you&apos;re
            curious what I&apos;d talk about if we grabbed coffee today, this
            is it. Inspired by Derek Sivers&apos;{" "}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="c97-link"
            >
              /now page movement
            </a>
            .
          </p>
        </div>
      </section>

      {/* Focus */}
      <section className="c97-band c97-band-continues" data-c97-surface="paper">
        <div className="c97-shell">
          <p className="c97-kicker">Now</p>
          <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
            Focus
          </h2>
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

      {/* Reading */}
      <section className="c97-band" data-c97-surface="bone">
        <div className="c97-shell">
          <p className="c97-kicker">Now</p>
          <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
            Reading
          </h2>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              marginTop: "var(--c97-sp-4)",
            }}
          >
            {reading.map((book) => (
              <li
                key={book.title}
                className="c97-row c97-row-stack-sm"
                style={{
                  borderTop: "1px solid var(--c97-rule)",
                  paddingBlock: "var(--c97-sp-3)",
                }}
              >
                <div>
                  <h3 className="c97-serif c97-h3">{book.title}</h3>
                  <p
                    className="c97-prose"
                    style={{
                      marginTop: "var(--c97-sp-1)",
                      color: "var(--c97-ink-2)",
                    }}
                  >
                    {book.note}
                  </p>
                </div>
                <p className="c97-meta">
                  <span>{book.author}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Currently building */}
      <section className="c97-band" data-c97-surface="paper">
        <div className="c97-shell">
          <p className="c97-kicker">Now</p>
          <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
            Currently building
          </h2>
          <p
            className="c97-prose"
            style={{
              marginTop: "var(--c97-sp-2)",
              color: "var(--c97-ink-2)",
            }}
          >
            The projects I&apos;m actively touching. Everything else on this
            site is on maintenance mode.
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
      <section className="c97-band" data-c97-surface="bone">
        <div className="c97-shell">
          <p className="c97-kicker">Now</p>
          <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
            What I&apos;m not doing
          </h2>
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
      <section className="c97-band" data-c97-surface="paper">
        <div className="c97-shell">
          <p className="c97-kicker">Now</p>
          <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
            Keep up
          </h2>
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
