import Link from "next/link";
import { Catalog97Shell } from "./Catalog97Shell";
import { Catalog97Slot } from "./Catalog97Primitives";
import { ABOUT_FAQ } from "@/constants/aboutFaq";
import styles from "./Catalog97About.module.css";

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
 * About, as one profile piece (2026-10-18).
 *
 * Three bands. The paper hero holds the headline, the opening paragraph, the
 * two exits, and the portrait on the first screen, and the biography continues
 * on the same paper. "How I work" is the page's one ink sheet. The FAQ closes
 * the page on bone. The timeline that used to follow told the chronology the
 * biography and the résumé both already tell, so it is gone, and the pull
 * quote and the second pair of buttons went with it.
 *
 * The print spec reads the portrait as `img.c97-slot-img`, counts one deckle
 * seam, and expects a `c97-columns` of three, and the paint reveal reads the
 * `data-c97-monet` section, so those four stay as they are.
 */
export function Catalog97About() {
  return (
    <Catalog97Shell>
      {/* Hero, the proofed sheet, with the portrait beside the headline. */}
      <section className="c97-band c97-sheet" data-c97-surface="paper" data-c97-monet>
        <div className="c97-shell">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <h1 className={`c97-poster ${styles.headline}`}>
                Before I trust a number, I check what&rsquo;s producing it.
              </h1>
              <p
                className="c97-lead"
                style={{
                  maxWidth: "var(--c97-measure-wide)",
                  lineHeight: "var(--c97-lh-body)",
                  textWrap: "pretty",
                }}
              >
                I&rsquo;m a second-year MBA candidate at Berkeley Haas, and before
                that I spent six years in campaign data and QA, where a lot of my
                job turned into product work.
              </p>
              <div className={styles.actions}>
                <Link className="c97-btn c97-offset" href="/portfolio">
                  See the work
                </Link>
                <Link className="c97-btn-ghost" href="/resume">
                  Résumé
                </Link>
              </div>
            </div>

            {/*
              The headshot, by Isaac's ask, rather than the empty stone field
              the design drew here. The Stone field stays painted underneath,
              so a photograph that is still decoding leaves the composition
              intact.
            */}
            <div className={styles.portrait} data-c97-paint="portrait">
              <Catalog97Slot
                surface="stone"
                ratio="4 / 5"
                src="/images/headshot-home.webp"
                alt="Isaac Vazquez"
                sizes="(max-width: 880px) 72vw, 40vw"
                priority
                offset
              />
            </div>
          </div>
        </div>
      </section>

      {/* The biography, continuing the hero's paper. */}
      <section className="c97-band c97-band-continues" data-c97-surface="paper">
        <div
          className="c97-shell"
          style={{ display: "grid", gap: "var(--c97-sp-2)" }}
        >
          <p className="c97-prose" style={{ maxWidth: "var(--c97-measure-wide)" }}>
            I studied political science and international affairs at Florida
            State and started out in digital and data work for campaigns at
            Open Progress. When Civitech, a campaign software company in
            Austin, acquired Open Progress, I moved over in January 2022 as
            the only QA analyst on its applications engineering team, and
            over three and a half years the job grew well past testing into
            product work, from owning the vision for a texting platform, to
            leading a pricing initiative, to turning leadership and user
            feedback into requirements for a new platform&rsquo;s launch.
          </p>
          <p className="c97-prose" style={{ maxWidth: "var(--c97-measure-wide)" }}>
            I left Civitech in August 2025 to start at Haas, because I wanted
            to move fully into product work, and I spent summer 2026 as the
            MBA growth intern at Juno, a fintech company that negotiates group
            rates on student loans. Now I&rsquo;m looking for a full-time role
            in product management, product marketing, or program management
            that starts after I graduate in May 2027, and I&rsquo;m interested
            in consumer tech broadly.
          </p>
          <p className="c97-prose" style={{ maxWidth: "var(--c97-measure-wide)" }}>
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
      </section>

      {/* How I work, the page's one ink sheet. */}
      <section
        className="c97-band c97-band-tall c97-sheet"
        data-c97-surface="ink-blue"
        data-seam="torn"
      >
        <div className="c97-shell">
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

      {/* The questions recruiters ask, which the FAQ structured data repeats. */}
      <section
        className="c97-band c97-sheet"
        data-c97-surface="bone"
        data-seam="deckle"
        aria-label="Frequently asked questions"
      >
        <div className="c97-shell">
          <h2 className="c97-poster-sm">Questions I get asked most</h2>
          <div
            style={{
              display: "grid",
              gap: "var(--c97-sp-3)",
              marginTop: "var(--c97-sp-4)",
            }}
          >
            {ABOUT_FAQ.map((faq) => (
              <div
                key={faq.question}
                style={{
                  borderTop: "1px solid var(--c97-rule)",
                  paddingTop: "var(--c97-sp-2)",
                }}
              >
                <h3 className="c97-serif c97-h3">{faq.question}</h3>
                <p
                  className="c97-prose"
                  style={{
                    marginTop: "var(--c97-sp-1)",
                    color: "var(--c97-ink-2)",
                    maxWidth: "var(--c97-measure-wide)",
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
