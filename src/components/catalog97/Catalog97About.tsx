import Link from "next/link";
import { Catalog97Shell } from "./Catalog97Shell";
import { Catalog97Slot } from "./Catalog97Primitives";
import { careerTimeline } from "@/constants/personal";
import { ABOUT_FAQ } from "@/constants/aboutFaq";

const principles = [
  {
    title: "Check what produces the number",
    body: "Before I act on a metric, I read the query or the event behind it. At Juno, correcting one click event moved the funnel's biggest drop off a step earlier, to members who had an approved rate and never clicked through to a lender.",
  },
  {
    title: "Watch customers use the real thing",
    body: "At Civitech I ran TextOut's alpha demos by having customers work through their own workflows in the new builds. Those sessions showed the messaging window was cutting off message content, so I wrote the user story and the business case, and the fix shipped within a week.",
  },
  {
    title: "Put the limits next to the number",
    body: "At Juno the simple comparison made advising meetings look like they multiplied conversion, but most of those meetings happened after the conversion they were credited with. The matched estimate I built came out at a fraction of the headline, and placebo checks suggested most of what was left was selection.",
  },
];

/**
 * About, in the Catalog 97 language.
 *
 * The design pairs the opening prose with a portrait field and closes on the
 * chocolate timeline, with the saffron pull quote bottom-aligned inside a tall
 * band between them. All three are kept.
 *
 * The three "How I work" principles are working habits, each paired with the
 * example that shows it, taken from the Civitech and Juno write-ups under
 * /writing. Nothing from the mockup's biography ships, and the timeline is the
 * real one in `personal.ts`.
 */
export function Catalog97About() {
  // Newest first, which is the order the design's timeline reads in. The source
  // array is chronological, so reversing it also orders same-year entries
  // correctly, which a sort on the year alone did not.
  const timeline = [...careerTimeline].reverse();

  return (
    <Catalog97Shell>
      {/* Hero, the proofed sheet. */}
      <section
        className="c97-band c97-sheet"
        data-c97-surface="paper"
      >
        <div className="c97-shell">
          <h1 className="c97-poster">
            Before I trust a number, I check what&rsquo;s producing it.
          </h1>
        </div>
      </section>

      {/*
        Opening prose and portrait field. Blue rather than paper: this is the
        substance of the route, and putting it on the instrument field is what
        gives /about its share of blue without handing it to the timeline,
        which is long enough to swamp the page.
      */}
      <section
        className="c97-band c97-band-tall c97-sheet"
        data-c97-surface="ink-blue"
        data-seam="torn"
        data-c97-monet
      >
        <div
          className="c97-shell"
          style={{
            display: "grid",
            /*
              The track floor is wrapped in min() so it can never exceed the
              container. At a bare 280px the track stayed 280px wide inside a
              264px shell at a 320px viewport, which pushed this band's content
              16px into the right gutter while every other band kept its 28px,
              and below about a 308px viewport it became real horizontal
              overflow. min(100%, 280px) is the same guard the home hero uses.
            */
            gridTemplateColumns:
              "repeat(auto-fit,minmax(min(100%, 280px),1fr))",
            gap: "var(--c97-sp-5)",
            alignItems: "start",
          }}
        >
          <div>
            <p
              className="c97-serif c97-lead"
              style={{
                lineHeight: "var(--c97-lh-body)",
                color: "var(--c97-ink-2)",
                maxWidth: "var(--c97-measure-body)",
              }}
            >
              I&rsquo;m a second-year MBA candidate at Berkeley Haas, and before
              that I spent six years in campaign data and QA, where a lot of my
              job turned into product work.
            </p>
            <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
              I studied political science and international affairs at Florida
              State and started out in digital and data work for campaigns at
              Open Progress. When Civitech, a campaign software company in
              Austin, acquired Open Progress, I moved over in January 2022 as
              the only QA analyst on its applications engineering team, and
              over three and a half years the job grew
              well past testing into product work, from owning the vision for a
              texting platform, to leading a pricing initiative, to turning
              leadership and user feedback into requirements for a new
              platform&rsquo;s launch.
            </p>
            <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
              I left Civitech in August 2025 to start at Haas, because I wanted
              to move fully into product work, and I spent summer 2026 as the
              MBA growth intern at Juno, a fintech company that negotiates group
              rates on student loans. Now I&rsquo;m looking for a full-time role
              in product management, product marketing, or program management
              that starts after I graduate in May 2027, and I&rsquo;m interested
              in consumer tech broadly.
            </p>
            <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
              I picked up the habit of checking a number before trusting it in
              QA, and my summer at Juno showed me it carries over to growth and
              product work almost unchanged, since almost every useful thing I
              did there started with finding out whether a number measured what
              everyone assumed it measured. The tools on this site follow the
              same rule, so most dashboards show where their numbers came from
              and when, and a failed refresh keeps the last good snapshot and
              prints its date.
            </p>
          </div>

          {/*
            The design's own AboutPage leaves this an empty stone field and
            captions it as a direction for a picture that does not exist yet,
            "natural light, pulled toward yellow", unlike its HomePage, which
            names a real asset. Isaac asked for the headshot here rather than a
            second empty field, so this is deliberately a different photograph
            from the one that direction describes, and the direction still
            stands for whenever that portrait gets taken.

            The Stone field stays painted underneath, so a photograph that is
            still decoding, or that fails outright, leaves the composition
            intact rather than punching a hole in the band.
          */}
          <div data-c97-paint="portrait">
            <Catalog97Slot
              surface="stone"
              ratio="4 / 5"
              src="/images/headshot-home.webp"
              alt="Isaac Vazquez"
              sizes="(max-width: 790px) 100vw, 40vw"
              priority
              offset
            />
          </div>
        </div>
      </section>

      {/* Pull quote */}
      <section
        className="c97-band c97-band-tall c97-sheet"
        data-c97-surface="ink-saffron"
        data-seam="torn"
      >
        <div
          className="c97-shell"
          style={{
            display: "flex",
            alignItems: "flex-end",
            minHeight: "clamp(180px,20vw,240px)",
          }}
        >
          <p className="c97-poster-sm" style={{ maxWidth: "24ch" }}>
            QA put me close to both the customer and the code, and I learned to
            use that position to decide what the product should do next.
          </p>
        </div>
      </section>

      {/* How I work. Bone, so the route's two Blue bands are not adjacent. */}
      <section
        className="c97-band c97-band-taller c97-sheet"
        data-c97-surface="bone"
        data-seam="deckle"
      >
        <div className="c97-shell">
          {/*
            `c97-kicker` put this h2 at 11px directly above three 26px h3
            children, so the nesting read backwards on the page. --c97-fs-h2 is
            32px against 26px here and clamps to 24px against 20px at 390, which
            clears its children at both ends. The same swap was made on
            /portfolio and /dashboards, and the trap to avoid is reaching for
            --c97-fs-h3 instead, which collapses to within a pixel of the child
            step once both clamps bottom out.
          */}
          <h2 className="c97-poster-sm">How I work</h2>
          <div className="c97-columns" style={{ marginTop: "var(--c97-sp-4)" }}>
            {principles.map((principle) => (
              <div key={principle.title}>
                <h3
                  className="c97-serif c97-h3"
                  style={{ maxWidth: "var(--c97-measure-tight)" }}
                >
                  {principle.title}
                </h3>
                <p
                  className="c97-prose"
                  style={{
                    marginTop: "var(--c97-sp-1)",
                    color: "var(--c97-ink-2)",
                    maxWidth: "var(--c97-measure-body)",
                  }}
                >
                  {principle.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The route here */}
      <section
        className="c97-band c97-sheet"
        data-c97-surface="chocolate"
        data-seam="torn"
      >
        <div className="c97-shell">
          {/* Same 11px-above-26px inversion as "How I work" above. */}
          <h2 className="c97-poster-sm">The route here</h2>
          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: "var(--c97-sp-3)",
              marginTop: "var(--c97-sp-3)",
            }}
          >
            {timeline.map((entry) => (
              <li
                key={`${entry.year}-${entry.role}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "var(--c97-sp-4)",
                  alignItems: "baseline",
                }}
              >
                <div
                  className="c97-serif c97-tabular"
                  style={{
                    fontSize: "var(--c97-fs-body)",
                    color: "var(--c97-ink-2)",
                    minWidth: "5ch",
                  }}
                >
                  {entry.year}
                </div>
                <div>
                  <h3 className="c97-serif c97-h3">{entry.role}</h3>
                  <p
                    className="c97-kicker"
                    style={{ marginTop: "var(--c97-sp-1)" }}
                  >
                    {entry.company}
                  </p>
                  <p
                    className="c97-prose"
                    style={{
                      marginTop: "var(--c97-sp-1)",
                      color: "var(--c97-ink-2)",
                    }}
                  >
                    {entry.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--c97-sp-2)",
              marginTop: "var(--c97-sp-5)",
            }}
          >
            <Link className="c97-btn c97-btn-invert c97-offset" href="/resume">
              Résumé
            </Link>
            <Link className="c97-btn-ghost" href="/portfolio">
              The work
            </Link>
          </div>
        </div>
      </section>

      {/* Frequently asked questions */}
      <section
        className="c97-band c97-sheet"
        data-c97-surface="bone"
        aria-label="Frequently asked questions"
      >
        <div className="c97-shell">
          <p className="c97-kicker">Recruiting & background</p>
          <h2 className="c97-poster-sm" style={{ marginTop: "var(--c97-sp-1)" }}>
            Questions I get asked most.
          </h2>
          <div
            style={{
              display: "grid",
              gap: "var(--c97-sp-4)",
              marginTop: "var(--c97-sp-4)",
            }}
          >
            {ABOUT_FAQ.map((faq) => (
              <div
                key={faq.question}
                style={{
                  borderTop: "1px solid var(--c97-rule)",
                  paddingTop: "var(--c97-sp-3)",
                }}
              >
                <h3 className="c97-serif c97-h3">{faq.question}</h3>
                <p
                  className="c97-prose"
                  style={{
                    marginTop: "var(--c97-sp-2)",
                    color: "var(--c97-ink-2)",
                    maxWidth: "var(--c97-measure-body)",
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Catalog97Shell>
  );
}
