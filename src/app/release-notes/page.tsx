import { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

// Hand-curated release notes for this site. Newest first.
// Each entry is a short headline plus two or three sentences of detail.
// Add new releases at the top of the array. Grouping by month is derived.
interface ReleaseNote {
  date: string; // ISO yyyy-mm-dd
  category: string;
  headline: string;
  detail: string;
}

const releaseNotes: ReleaseNote[] = [
  {
    date: "2026-07-02",
    category: "Update",
    headline: "Editorial polish, investments utilities, and reliability fixes",
    detail:
      "A broad styling pass tightened the editorial system across routes, added shared holding-color utilities for investment visuals, refreshed the design docs, and expanded portfolio-search coverage. Fantasy snapshot loading now times out into the API fallback, older draft-tracker saves hydrate safely, and investments quotes keep the last good value visible when refresh fails.",
  },
  {
    date: "2026-06-30",
    category: "Writing",
    headline: "Writing voice rules get stricter",
    detail:
      "The writing voice guide was updated so site copy, documentation, UI text, and articles all follow the same plainspoken rules. The agent memory docs were synced at the same time.",
  },
  {
    date: "2026-06-25",
    category: "Launch",
    headline: "Arcade, World Cup group coverage, and Formula 1 polish",
    detail:
      "A synthwave reflex game launched at /arcade, World Cup group-stage coverage joined the writing archive, and Formula 1 Pulse got a stronger racing-flavored visual identity. The 404 page also picked up a retro treatment.",
  },
  {
    date: "2026-06-24",
    category: "Feature",
    headline: "Header search, portfolio tiles, and tool polish",
    detail:
      "The header now has live search results, the portfolio grid has per-project pixel-art tiles, and search ranking works more predictably in production. AI Dev Tools, News Pulse, fantasy football, and investments all picked up focused polish.",
  },
  {
    date: "2026-06-23",
    category: "Update",
    headline: "Release notes, writing topics, and platform hardening",
    detail:
      "The /release-notes page launched as a month-grouped companion to the changelog, and writing topic pages made the archive easier to browse. GA4 tracking, sitemap priority metadata, staged CSP, accessibility fixes, and client-bundle trimming landed in the same sweep.",
  },
  {
    date: "2026-06-19",
    category: "Feature",
    headline: "Fantasy football overhaul and portfolio search",
    detail:
      "The fantasy board gained a player drawer, watchlist, notes, comparison, tier breaks, draft timers, history, custom team names, exports, and clearer value/reach signals. The portfolio index added project search and moved the marquee band into a better browsing position.",
  },
  {
    date: "2026-06-18",
    category: "Writing",
    headline: "Project build breakdowns and dashboard hardening",
    detail:
      "Two dozen build-breakdown articles joined the writing archive, giving the project catalog a clearer implementation layer. Contact copy, Formula 1 Pulse, fantasy snapshot freshness, SpaceX freshness checks, and header alignment moved forward too.",
  },
  {
    date: "2026-06-15",
    category: "Fix",
    headline: "Correctness, crash fixes, and SEO cleanup",
    detail:
      "A broad fix sweep touched dashboard builders, local-storage tools, RSS, search, SEO metadata, the MBA email path, recipe parsing, and wine-cellar parsing. It was the reliability pass after a fast run of launches.",
  },
  {
    date: "2026-06-10",
    category: "Writing",
    headline: "A writing surge across horology, the AI rally, and agents",
    detail:
      "A dozen new pieces landed on the writing surface in a single push. They range from a two-part horology history to a researched take on the AI mega-cap rally and a series on what it actually feels like to build with AI agents in production.",
  },
  {
    date: "2026-06-10",
    category: "Feature",
    headline: "Real position data in the investments research column",
    detail:
      "The research view now shows your actual position alongside a price chart with cost-basis and moving-average overlays, plus cleaner news cards. Everything is drawn from real data, with no fabricated figures filling the gaps.",
  },
  {
    date: "2026-06-09",
    category: "Launch",
    headline: "Three new Pulse dashboards in one day",
    detail:
      "Earthquake Pulse, Bay Area Transit Pulse, and a tech startup tracker all shipped together. They cover global seismic activity from USGS feeds, live BART departures and advisories, and a curated set of notable startups.",
  },
  {
    date: "2026-06-09",
    category: "Feature",
    headline: "Travel planner gains time windows and sturdier storage",
    detail:
      "Itinerary stops picked up time windows with overlap detection, and days now carry color-coding and progress. A storage bug that could corrupt saved trips is also fixed.",
  },
  {
    date: "2026-06-09",
    category: "Update",
    headline: "Design tokens, performance, and a fix sweep",
    detail:
      "Off-system colors moved onto shared design tokens, and the dashboards gained loading states with lazy-loaded panels. A long list of smaller fixes landed across the surfaces that shipped over the previous weeks.",
  },
  {
    date: "2026-06-08",
    category: "Launch",
    headline: "World Cup Pulse and a contenders countdown",
    detail:
      "A 2026 World Cup dashboard launched that works as a tournament hub before kickoff and becomes a live dashboard once play starts. It arrived next to a ten-part contenders series on the writing surface.",
  },
  {
    date: "2026-06-08",
    category: "Feature",
    headline: "Retirement planner inside the investments dashboard",
    detail:
      "A full retirement projection engine joined the investments surface. It derives return assumptions from your allocation, runs Monte Carlo confidence bands, and stays honest about what the numbers can and cannot tell you.",
  },
  {
    date: "2026-06-08",
    category: "Feature",
    headline: "Food map goes multi-city",
    detail:
      "The food map was rebuilt on Leaflet as a multi-city, curator-driven surface. It launched with Miami, Atlanta, Copenhagen, and San Sebastián alongside the original Austin guide.",
  },
  {
    date: "2026-06-08",
    category: "Feature",
    headline: "Fantasy F1 optimizer and a sharper draft board",
    detail:
      "A fantasy Formula 1 lineup optimizer launched alongside a tier-grouped draft board view. The rankings list also became denser and easier to scan in a single glance.",
  },
  {
    date: "2026-05-31",
    category: "Update",
    headline: "About and portfolio refresh, plus quieter maintenance",
    detail:
      "The about and portfolio surfaces were refreshed, and shared stats panels landed on the homepage and writing archive. The sports data modules picked up some quiet hardening at the same time.",
  },
  {
    date: "2026-05-26",
    category: "Feature",
    headline: "Writing archive V3 and steadier errors",
    detail:
      "The writing archive gained a stronger browsing and filtering experience. Shared error handling and logging were cleaned up so component failures report more consistently.",
  },
  {
    date: "2026-05-11",
    category: "Update",
    headline: "MBA job tracking and snapshot checks",
    detail:
      "The MBA job workflow picked up a tracking pass, and the league snapshot quality gate became less brittle. That kept generated data checks focused on the actual snapshot body.",
  },
  {
    date: "2026-05-04",
    category: "Launch",
    headline: "Travel planner",
    detail:
      "A new /travel surface launched for planning trips with day-by-day itineraries and a per-trip journal. Everything stays in your browser, so nothing leaves the device.",
  },
  {
    date: "2026-04-29",
    category: "Launch",
    headline: "Nine launches in one wave",
    detail:
      "Four new sports and data dashboards shipped alongside five personal tools over two days. They ranged from NBA and MLB Pulse to a wine cellar and a museum log.",
  },
  {
    date: "2026-04-26",
    category: "Design",
    headline: "Editorial V3 redesign",
    detail:
      "The V3 editorial design system rolled out across the homepage hero, the writing archive layout, and a rebuilt three-column investments dashboard. It set the visual standard the rest of the site now follows.",
  },
  {
    date: "2026-04-25",
    category: "Fix",
    headline: "Full-site design audit cleanup",
    detail:
      "A design and UX audit turned into fixes across the shell, writing, dashboards, fantasy, fintech, and the MBA tracker. Empty states, tabs, announcements, dropdowns, URL state, pagination, and dashboard polish all moved forward.",
  },
  {
    date: "2026-04-22",
    category: "Update",
    headline: "Fantasy and investments hardening",
    detail:
      "The fantasy football tool surface got a broad rework, and the investments refresh pipeline gained clearer data-freshness messaging. Dark-mode elevation and touch-target issues were tightened too.",
  },
  {
    date: "2026-04-21",
    category: "Launch",
    headline: "Now and changelog surfaces",
    detail:
      "/now and /changelog became first-class routes, giving the site a clearer current-focus page and a running shipped log. Four April deep dives also joined the writing archive.",
  },
  {
    date: "2026-04-20",
    category: "Feature",
    headline: "MBA internship tracker styling refresh",
    detail:
      "The MBA tracker picked up a tighter layout, compact company filters, and an expanded source list. It also earned a feature slot on the homepage.",
  },
  {
    date: "2026-04-10",
    category: "Launch",
    headline: "MBA internship notifications dashboard",
    detail:
      "A new dashboard at /mba-internship-notifications aggregates internship roles from across the web. It sends notifications when a matching posting lands.",
  },
  {
    date: "2026-04-08",
    category: "Launch",
    headline: "Political polling aggregator",
    detail:
      "A polling aggregator dashboard launched with its own component set and route styling. The surrounding contact, writing-card, and journey components got structural cleanup in the same stretch.",
  },
  {
    date: "2026-04-05",
    category: "Update",
    headline: "SEO archive and homepage content refresh",
    detail:
      "The SEO archive structure was rebuilt, and the homepage narrative was updated to match the current focus. The two changes shipped together so the story and the structure stayed in sync.",
  },
  {
    date: "2026-04-02",
    category: "Launch",
    headline: "News Pulse, SpaceX, and Interchange IQ",
    detail:
      "News Pulse, SpaceX Mission Control, and Interchange IQ all became standalone tools. Investments refresh automation, price-freshness labels, search and RSS coverage, quote fallbacks, and bundle cleanup landed around the same time.",
  },
  {
    date: "2026-03-30",
    category: "Update",
    headline: "News media case study and fantasy freshness",
    detail:
      "A news media AI strategy case study joined the portfolio track, and fantasy snapshot freshness handling got a follow-up fix after the corrected data model shipped. The canonical AGENTS guide landed too.",
  },
  {
    date: "2026-03-28",
    category: "Fix",
    headline: "SpaceX mission control stability fixes",
    detail:
      "Image caching for mission imagery was stabilized so launch photos load reliably. A hydration mismatch on the SpaceX dashboard was sorted out at the same time.",
  },
  {
    date: "2026-03-21",
    category: "Fix",
    headline: "Fantasy snapshot integrity fix",
    detail:
      "A real fantasy bug was fixed where overall rankings could drift away from the matching position boards. Overall and flex boards now derive from the same current position data, with regression coverage around the path.",
  },
  {
    date: "2026-03-19",
    category: "Update",
    headline: "Investments goes static, fantasy gets a canonical board",
    detail:
      "Investments research moved from heavy live section fetches to curated static snapshots, shrinking the published dataset from roughly 240 MB to roughly 2.2 MB. Fantasy football was rebuilt around one canonical rankings board and a simplified draft tracker powered by checked-in snapshots.",
  },
  {
    date: "2026-03-18",
    category: "Feature",
    headline: "Investments deep links and live quote split",
    detail:
      "The investments workspace became URL-backed, with deep links for view, symbol, and section. Live quote data split away from historical snapshots, and symbol search got richer metadata and better keyboard behavior.",
  },
  {
    date: "2026-03-17",
    category: "Feature",
    headline: "March Madness traffic pass and shell cleanup",
    detail:
      "March Madness became a search-oriented landing page with metadata, structured data, deep links, and a companion writing piece. The shell also simplified its navigation, footer CTAs, and full-width app route handling.",
  },
  {
    date: "2026-03-16",
    category: "Feature",
    headline: "Investments becomes a public fintech proof point",
    detail:
      "Investments moved into the main navigation, gained recruiter-facing metadata, and switched research from live section fetches to curated static snapshots. The change made the surface smaller, faster, and easier to explain.",
  },
  {
    date: "2026-03-15",
    category: "Writing",
    headline: "Agentic AI writing series",
    detail:
      "A set of articles on agentic AI shipped across marketing, customer support, product management, and architecture. They were later rewritten for a sharper, more opinionated voice.",
  },
  {
    date: "2026-03-06",
    category: "Docs",
    headline: "Core documentation reset",
    detail:
      "The source-of-truth docs were corrected for the actual Next.js 16 site, including routes, components, APIs, development notes, testing, and the fantasy and investments surfaces.",
  },
  {
    date: "2026-03-02",
    category: "Feature",
    headline: "Investments research sidebar and metric tooltips",
    detail:
      "The investments surface gained MetricTooltip and ResearchSidebar components, plus a round of layout tweaks. Symbol-reset behavior also became clearer and more predictable.",
  },
  {
    date: "2026-02-18",
    category: "Docs",
    headline: "Onboarding and documentation cleanup",
    detail:
      "Onboarding, API, performance, and troubleshooting docs were added, and the documentation index was synced to the current guide set. Markdown links were cleaned up so the docs could be used as a real entry point.",
  },
  {
    date: "2026-02-10",
    category: "Launch",
    headline: "Portfolio, resume, writing, and the first investments page",
    detail:
      "The rebuilt platform got its first real content wave with new portfolio, resume, and writing surfaces. The first investments page shipped with Yahoo Finance research panels, and fantasy football tooling came back with RB tiers and a draft tracker.",
  },
  {
    date: "2026-01-30",
    category: "Foundation",
    headline: "Next.js 16 rebuild",
    detail:
      "The current site started with a ground-up rebuild on Next.js 16, React, TypeScript strict mode, and Tailwind CSS v4. Fantasy analytics, structured data, NextAuth for /admin, next-sitemap, and the first version of the modern design system all landed here.",
  },
];

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

interface MonthGroup {
  key: string; // yyyy-mm
  label: string; // "June 2026"
  notes: ReleaseNote[];
}

function groupByMonth(notes: ReleaseNote[]): MonthGroup[] {
  const sorted = [...notes].sort((a, b) => b.date.localeCompare(a.date));
  const groups: MonthGroup[] = [];

  for (const note of sorted) {
    const key = note.date.slice(0, 7);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        label: monthFormatter.format(new Date(`${note.date}T00:00:00Z`)),
        notes: [],
      };
      groups.push(group);
    }
    group.notes.push(note);
  }

  return groups;
}

const latestDate = [...releaseNotes].sort((a, b) =>
  b.date.localeCompare(a.date)
)[0]?.date;

export const metadata: Metadata = constructMetadata({
  title: "Release Notes",
  description:
    "Site updates in reverse chronological order, grouped by month. New features, dashboards, writing, and fixes as they shipped.",
  canonicalUrl: "https://isaacavazquez.com/release-notes",
  dateModified: latestDate || undefined,
});

const headingStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
} as const;

const bodyStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink-muted)",
} as const;

export default function ReleaseNotesPage() {
  const groups = groupByMonth(releaseNotes);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Release Notes", url: "/release-notes" },
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

      <section
        className="home-page home-section min-h-screen"
        aria-labelledby="release-notes-heading"
      >
        <div className="home-shell home-shell-tight space-y-12">
          <header className="space-y-4">
            <p className="home-kicker mb-0">Release Notes</p>
            <h1
              id="release-notes-heading"
              className="mb-0"
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
                fontWeight: 600,
                lineHeight: 0.95,
                letterSpacing: "-0.06em",
                color: "var(--home-ink)",
              }}
            >
              Every update, month by month.
            </h1>
            <p className="home-body max-w-[52rem]">
              What shipped on this site, newest first and grouped by month. Each
              note is a date, a headline, and a couple of sentences on what
              changed. For the longer-form running log see the{" "}
              <Link
                href="/changelog"
                className="underline underline-offset-2"
                style={{ color: "var(--home-signal)" }}
              >
                changelog
              </Link>
              , and for what I&apos;m focused on right now see the{" "}
              <Link
                href="/now"
                className="underline underline-offset-2"
                style={{ color: "var(--home-signal)" }}
              >
                /now page
              </Link>
              .
            </p>
          </header>

          <div className="space-y-12">
            {groups.map((group) => (
              <section
                key={group.key}
                aria-label={`Releases in ${group.label}`}
                className="space-y-5"
              >
                <h2
                  className="mb-0 flex items-baseline gap-3 text-xl"
                  style={headingStyle}
                >
                  <span>{group.label}</span>
                  <span
                    className="text-sm font-normal"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    {group.notes.length}{" "}
                    {group.notes.length === 1 ? "update" : "updates"}
                  </span>
                </h2>

                <ol
                  className="mb-0 space-y-3"
                  style={{ listStyle: "none", paddingLeft: 0 }}
                >
                  {group.notes.map((note, index) => (
                    <li key={`${note.date}-${index}`}>
                      <article className="home-card p-5 sm:p-6 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <time
                            dateTime={note.date}
                            className="home-meta mb-0 tabular-nums"
                          >
                            {dayFormatter.format(
                              new Date(`${note.date}T00:00:00Z`)
                            )}
                          </time>
                          <span className="resume-chip">{note.category}</span>
                        </div>

                        <h3
                          className="mb-0 text-lg leading-snug"
                          style={headingStyle}
                        >
                          {note.headline}
                        </h3>

                        <p
                          className="mb-0 text-base leading-7"
                          style={bodyStyle}
                        >
                          {note.detail}
                        </p>
                      </article>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>

          <footer
            className="pt-6 text-center text-sm leading-6"
            style={{
              ...bodyStyle,
              borderTop: "1px solid var(--home-rule)",
            }}
          >
            That&apos;s the record so far. Built in public, one release at a
            time.
          </footer>
        </div>
      </section>
    </>
  );
}
