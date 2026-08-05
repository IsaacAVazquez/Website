import Link from "next/link";
import { Catalog97Shell } from "./Catalog97Shell";
import { Catalog97Slot } from "./Catalog97Primitives";
import { careerTimeline } from "@/constants/personal";

const principles = [
  {
    title: "Show the compromise",
    body: "Every model gives something up somewhere. I would rather put that on the page than hide it behind a confident number.",
  },
  {
    title: "Fail toward yesterday",
    body: "A stale number with a date on it is useful. A blank panel at two in the morning is not.",
  },
  {
    title: "Lead with the problem",
    body: "The stack is the least interesting part of any project, so it goes last in the write-up and never in the headline.",
  },
];

/**
 * About, in the Catalog 97 language.
 *
 * The design pairs the opening prose with a portrait field and closes on the
 * chocolate timeline, with the camel pull quote bottom-aligned inside a tall
 * band between them. All three are kept.
 *
 * The three "How I work" principles come from the design because they describe
 * what this codebase actually does — fail-soft snapshots, stated uncertainty,
 * and problem-first write-ups are real conventions here. Nothing else from the
 * mockup's biography ships: the timeline is the real one in `personal.ts`.
 */
export function Catalog97About() {
  // Newest first, which is the order the design's timeline reads in.
  const timeline = [...careerTimeline].sort((a, b) => b.year - a.year);

  return (
    <Catalog97Shell>
      {/* Hero */}
      <section className="c97-band" data-c97-surface="paper">
        <div className="c97-shell">
          <p className="c97-kicker">About</p>
          <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-3)" }}>
            I build products, and I show the work behind them.
          </h1>
        </div>
      </section>

      {/*
        Opening prose and portrait field. Pine rather than paper: this is the
        substance of the route, and putting it on the instrument field is what
        gives /about its share of green without handing it to the timeline,
        which is long enough to swamp the page.
      */}
      <section className="c97-band c97-band-tall" data-c97-surface="pine">
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
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 280px),1fr))",
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
              Most of what I build exists to answer one question, which is
              whether the thing in front of us actually works.
            </p>
            <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
              I came to product through quality engineering, which means I spent
              years writing the harnesses and checks that catch a regression
              before a customer does. Six of those years ran across SaaS,
              analytics, and civic tech, most recently at Civitech, and
              I&rsquo;m finishing an MBA at Berkeley Haas now. The dashboards
              and ledgers on this site are the same instinct pointed somewhere
              lighter, and both halves want the same thing from a screen, which
              is a number I can trust and a note about how it was arrived at.
            </p>
            <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
              When something here is uncertain, it says so. When a feed fails,
              it keeps yesterday and prints the date rather than showing an
              empty page and letting you guess.
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
          <Catalog97Slot
            surface="stone"
            ratio="4 / 5"
            src="/images/headshot-home.webp"
            alt="Isaac Vazquez"
            sizes="(max-width: 790px) 100vw, 40vw"
          />
        </div>
      </section>

      {/* Pull quote */}
      <section className="c97-band c97-band-tall" data-c97-surface="camel">
        <div
          className="c97-shell"
          style={{
            display: "flex",
            alignItems: "flex-end",
            minHeight: "clamp(180px,20vw,240px)",
          }}
        >
          <p
            className="c97-serif c97-h2"
            style={{ maxWidth: "var(--c97-measure-body)" }}
          >
            The interesting part of quality work is not catching the bug. It is
            knowing which bug was always going to matter.
          </p>
        </div>
      </section>

      {/* How I work. Bone, so the route's two Pine bands are not adjacent. */}
      <section className="c97-band c97-band-taller" data-c97-surface="bone">
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
          <h2 className="c97-serif c97-h2">How I work</h2>
          <div
            className="c97-columns"
            style={{ marginTop: "var(--c97-sp-4)" }}
          >
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
      <section className="c97-band" data-c97-surface="chocolate">
        <div className="c97-shell">
          {/* Same 11px-above-26px inversion as "How I work" above. */}
          <h2 className="c97-serif c97-h2">The route here</h2>
          <div
            style={{
              display: "grid",
              gap: "var(--c97-sp-3)",
              marginTop: "var(--c97-sp-3)",
            }}
          >
            {timeline.map((entry) => (
              <div
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
                  <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-1)" }}>
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
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--c97-sp-2)",
              marginTop: "var(--c97-sp-5)",
            }}
          >
            <Link className="c97-btn c97-btn-invert" href="/resume">
              Résumé
            </Link>
            <Link className="c97-btn-ghost" href="/portfolio">
              The work
            </Link>
          </div>
        </div>
      </section>
    </Catalog97Shell>
  );
}
