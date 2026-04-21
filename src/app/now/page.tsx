import { Metadata } from "next";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData } from "@/lib/seo";

// Hand-curated snapshot of what I'm focused on right now.
// Refresh when anything here goes stale — this page is meant to feel
// current, not archival.
const NOW_UPDATED = "2026-04-21";
const NOW_UPDATED_LABEL = "April 2026";
const NOW_LOCATION = "Berkeley, CA";

const focus = [
  {
    kicker: "Primary focus",
    title: "Haas MBA, year one",
    detail:
      "Finishing core coursework, recruiting for product internships, and running the MBA internship tracker as a side tool for my cohort.",
  },
  {
    kicker: "Building",
    title: "This site, in public",
    detail:
      "Shipping experimental dashboards, refining the writing archive, and treating the portfolio itself as a product. See the changelog for what's new.",
  },
  {
    kicker: "Writing",
    title: "Agentic AI and PM workflows",
    detail:
      "Working through a series on agentic product decisions — when agents help, when they get in the way, and what it means for PM craft.",
  },
];

const reading = [
  {
    title: "The Hard Thing About Hard Things",
    author: "Ben Horowitz",
    note: "Re-read while navigating an MBA group project that ran off the rails.",
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
    label: "MBA internship tracker",
    href: "/mba-internship-notifications",
    detail: "Role aggregation and notifications for my cohort.",
  },
  {
    label: "Investments research",
    href: "/investments",
    detail: "Portfolio tracker with a researcher sidebar for each symbol.",
  },
  {
    label: "Football dashboards",
    href: "/premier-league",
    detail: "Weekly snapshots for Premier League and La Liga.",
  },
  {
    label: "March Madness 2026",
    href: "/march-madness-2026",
    detail: "Seasonal bracket tooling — wrapping for the year.",
  },
];

const notBuilding = [
  "New side projects outside this site — the surface is wide enough already.",
  "A paid product. This is a portfolio, not a business.",
  "Social media content. I write here and that's it.",
];

export const metadata: Metadata = constructMetadata({
  title: "Now",
  description: `What Isaac Vazquez is focused on right now — current work, reading, side projects, and location. Updated ${NOW_UPDATED_LABEL}.`,
  canonicalUrl: "https://isaacavazquez.com/now",
  dateModified: NOW_UPDATED,
});

const sectionTitleStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
} as const;

const bodyStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink-muted)",
} as const;

const strongBodyStyle = {
  fontFamily: "var(--font-home-sans)",
  color: "var(--home-ink)",
  fontWeight: 600,
} as const;

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

      <section
        className="home-page home-section min-h-screen"
        aria-label="Now — current focus"
      >
        <div className="home-shell home-shell-tight space-y-10">
          <header className="space-y-4">
            <p className="home-kicker mb-0">
              Now · Updated {NOW_UPDATED_LABEL} · {NOW_LOCATION}
            </p>
            <h1
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
              What I&apos;m working on right now.
            </h1>
            <p className="home-body max-w-[52rem]">
              A living snapshot — not a résumé, not a backlog. If you&apos;re
              curious what I&apos;d talk about if we grabbed coffee today, this
              is it. Inspired by Derek Sivers&apos;{" "}
              <a
                href="https://nownownow.com/about"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
                style={{ color: "var(--home-haze)" }}
              >
                /now page movement
              </a>
              .
            </p>
          </header>

          <div className="space-y-6">
            <article className="home-card p-6 sm:p-8 space-y-5">
              <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
                Focus
              </h2>
              <div className="grid gap-5 sm:grid-cols-3">
                {focus.map((item) => (
                  <div key={item.title} className="space-y-2">
                    <p className="home-kicker mb-0">{item.kicker}</p>
                    <p className="mb-0 text-base" style={strongBodyStyle}>
                      {item.title}
                    </p>
                    <p className="mb-0 text-sm leading-6" style={bodyStyle}>
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="home-card p-6 sm:p-8 space-y-4">
              <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
                Reading
              </h2>
              <ul className="mb-0 space-y-4">
                {reading.map((book, index) => (
                  <li
                    key={book.title}
                    className="space-y-1 pb-4"
                    style={
                      index < reading.length - 1
                        ? { borderBottom: "1px solid var(--home-rule)" }
                        : undefined
                    }
                  >
                    <p className="mb-0 text-base" style={strongBodyStyle}>
                      {book.title}{" "}
                      <span
                        className="font-normal"
                        style={{ color: "var(--home-ink-muted)" }}
                      >
                        — {book.author}
                      </span>
                    </p>
                    <p className="mb-0 text-sm leading-6" style={bodyStyle}>
                      {book.note}
                    </p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="home-card p-6 sm:p-8 space-y-4">
              <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
                Currently building
              </h2>
              <p className="mb-0 text-base leading-7" style={bodyStyle}>
                The projects I&apos;m actively touching. Everything else on this
                site is on maintenance mode.
              </p>
              <ul className="mb-0 grid gap-3 sm:grid-cols-2">
                {building.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex flex-col gap-1 rounded-[1.2rem] border px-4 py-3 transition-[border-color,background-color]"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--home-rule) 82%, white)",
                        background:
                          "color-mix(in srgb, var(--home-paper-alt) 76%, white)",
                      }}
                    >
                      <span
                        className="text-sm"
                        style={strongBodyStyle}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-sm leading-6"
                        style={bodyStyle}
                      >
                        {item.detail}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>

            <article className="home-card p-6 sm:p-8 space-y-4">
              <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
                What I&apos;m not doing
              </h2>
              <p className="mb-0 text-base leading-7" style={bodyStyle}>
                Saying no is the more interesting part of a /now page. Here&apos;s
                what I&apos;m deliberately not working on.
              </p>
              <ul
                className="mb-0 list-disc space-y-1 pl-5 text-base leading-7"
                style={bodyStyle}
              >
                {notBuilding.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="home-card p-6 sm:p-8 space-y-3">
              <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
                Keep up
              </h2>
              <p className="mb-0 text-base leading-7" style={bodyStyle}>
                The{" "}
                <Link
                  href="/changelog"
                  className="underline underline-offset-2"
                  style={{ color: "var(--home-haze)" }}
                >
                  changelog
                </Link>{" "}
                tracks what shipped on this site. The{" "}
                <Link
                  href="/writing"
                  className="underline underline-offset-2"
                  style={{ color: "var(--home-haze)" }}
                >
                  writing archive
                </Link>{" "}
                is where longer thinking lands. For anything else,{" "}
                <Link
                  href="/contact"
                  className="underline underline-offset-2"
                  style={{ color: "var(--home-haze)" }}
                >
                  send a note
                </Link>
                .
              </p>
            </article>
          </div>

          <footer
            className="pt-6 text-center text-sm leading-6"
            style={{
              ...bodyStyle,
              borderTop: "1px solid var(--home-rule)",
            }}
          >
            Last updated {NOW_UPDATED_LABEL}. If anything on this page looks
            stale, it probably is — ping me.
          </footer>
        </div>
      </section>
    </>
  );
}
