import { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

// Hand-curated release notes for this site. Newest first.
// Each entry is a short headline plus two or three sentences of detail.
// Add new releases at the top of the array — grouping by month is derived.
interface ReleaseNote {
  date: string; // ISO yyyy-mm-dd
  category: string;
  headline: string;
  detail: string;
}

const releaseNotes: ReleaseNote[] = [
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
    date: "2026-04-05",
    category: "Update",
    headline: "SEO archive and homepage content refresh",
    detail:
      "The SEO archive structure was rebuilt, and the homepage narrative was updated to match the current focus. The two changes shipped together so the story and the structure stayed in sync.",
  },
  {
    date: "2026-03-28",
    category: "Fix",
    headline: "SpaceX mission control stability fixes",
    detail:
      "Image caching for mission imagery was stabilized so launch photos load reliably. A hydration mismatch on the SpaceX dashboard was sorted out at the same time.",
  },
  {
    date: "2026-03-15",
    category: "Writing",
    headline: "Agentic AI writing series",
    detail:
      "A set of articles on agentic AI shipped across marketing, customer support, product management, and architecture. They were later rewritten for a sharper, more opinionated voice.",
  },
  {
    date: "2026-03-02",
    category: "Feature",
    headline: "Investments research sidebar and metric tooltips",
    detail:
      "The investments surface gained MetricTooltip and ResearchSidebar components, plus a round of layout tweaks. Symbol-reset behavior also became clearer and more predictable.",
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
