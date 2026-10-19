import Link from "next/link";
import type { ReactNode } from "react";
import { Catalog97Shell } from "./Catalog97Shell";
import { Catalog97Slot } from "./Catalog97Primitives";
import { ABOUT_FAQ } from "@/constants/aboutFaq";
import styles from "./Catalog97About.module.css";

/*
 * The checked notes. Each one was read against the page it cites before it
 * went in, and where the two disagreed the note changed, so the wording here
 * follows the write-up and not the other way round.
 */
const notes = [
  {
    body: "I ran TextOut's alpha demos by having client administrators and power users work through their own workflows in the new builds. Those sessions showed the messaging window was cutting off message content, and the fix shipped within a week.",
    source: { label: "Civitech write-up", href: "/writing/civitech-quality-and-product-work" },
  },
  {
    body: "$4M in additional revenue in 2024, from a cross-functional pricing strategy across engineering, sales, and finance.",
    source: { label: "Résumé", href: "/resume" },
  },
  {
    body: "Once the click event was corrected, the largest loss moved a step earlier, to members who had an approved rate and never clicked through to a lender.",
    source: { label: "Juno write-up", href: "/writing/juno-mba-growth-internship" },
  },
  {
    body: "The snapshot dashboards print their source and as-of date, and a failed refresh keeps the last good copy instead of wiping it.",
    source: { label: "Dashboards", href: "/dashboards" },
  },
];

/** A marked claim and the superscript that points to its note. */
function Claim({ n, children }: { n: number; children: ReactNode }) {
  return (
    <>
      <mark className={styles.claim}>{children}</mark>
      <a className={styles.ref} href={`#note-${n}`} aria-label={`Note ${n}`}>
        {n}
      </a>
    </>
  );
}

/**
 * About, as a proof (2026-10-19).
 *
 * One paper sheet, read the way a proofreader leaves a document. The portrait
 * is the plate on the left, the biography is the document on the right, and
 * four of its claims carry a mark that points to a checked note in the margin,
 * each with its source. The FAQ closes the sheet as a specimen strip. There is
 * no second surface, so the deckle seam and the three-column "How I work" sheet
 * that the print spec used to read on this route are gone, and the spec reads
 * them elsewhere. The portrait keeps `Catalog97Slot` and the paint reveal.
 */
export function Catalog97About() {
  return (
    <Catalog97Shell>
      <section className="c97-band" data-c97-surface="paper" data-c97-monet>
        <div className={`c97-shell ${styles.proof}`}>
          {/* The plate. The headshot, by Isaac's ask, on the stone field the design drew here. */}
          <div className={styles.plate} data-c97-paint="portrait">
            <Catalog97Slot
              surface="stone"
              ratio="4 / 5"
              src="/images/headshot-home.webp"
              alt="Isaac Vazquez"
              sizes="(max-width: 880px) 72vw, 260px"
              priority
              offset
            />
            <p className={`c97-kicker ${styles.caption}`}>
              <span>Plate 1 · portrait</span>
            </p>
          </div>

          {/* The document. */}
          <div className={styles.document}>
            <h1 className={`c97-poster ${styles.headline}`}>
              Before I trust a number, I check what&rsquo;s producing it.
            </h1>

            <div className={styles.body}>
              <p className="c97-prose">
                I&rsquo;m a second-year MBA candidate at Berkeley Haas, and before
                that I spent six years in campaign data and QA, where a lot of my
                job turned into product work.
              </p>
              <p className="c97-prose">
                I studied political science and international affairs at Florida
                State and started out in digital and data work for campaigns at
                Open Progress. When Civitech, a campaign software company in
                Austin, acquired Open Progress, I moved over in January 2022 as
                the only QA analyst on its applications engineering team, and
                over three and a half years the job grew well past testing into
                product work, from{" "}
                <Claim n={1}>owning the vision for a texting platform</Claim>, to{" "}
                <Claim n={2}>leading a pricing initiative</Claim>, to turning
                leadership and user feedback into requirements for a new
                platform&rsquo;s launch.
              </p>
              <p className="c97-prose">
                I left Civitech in August 2025 to start at Haas, and I spent
                summer 2026 as the MBA growth intern at Juno, a fintech company
                that negotiates group rates on student loans, where{" "}
                <Claim n={3}>
                  correcting one click event moved the funnel&rsquo;s biggest
                  drop off a step earlier
                </Claim>
                . Now I&rsquo;m looking for a full-time role in product
                management, product marketing, or program management that starts
                after I graduate in May 2027, and I&rsquo;m interested in
                consumer tech broadly.
              </p>
              <p className="c97-prose">
                I picked up the habit of checking a number before trusting it in
                QA, and my summer at Juno showed me it carries over almost
                unchanged.{" "}
                <Claim n={4}>The tools on this site follow the same rule</Claim>,
                so most dashboards show where their numbers came from and when,
                and a failed refresh keeps the last good snapshot and prints its
                date.
              </p>
            </div>

            <aside className={styles.margin} aria-label="Checked notes">
              {notes.map((note, index) => {
                const n = index + 1;
                return (
                  <div key={n} id={`note-${n}`} className={styles.note}>
                    <p className={styles.noteLabel}>{n} · checked</p>
                    <p className={styles.noteBody}>{note.body}</p>
                    <p className={`c97-kicker ${styles.source}`}>
                      Source · <Link href={note.source.href}>{note.source.label}</Link>
                    </p>
                  </div>
                );
              })}
            </aside>
          </div>

          {/* The questions recruiters ask, which the FAQ structured data repeats. */}
          <section
            className={styles.specimen}
            data-specimen
            aria-label="Frequently asked questions"
          >
            <h2 className={styles.specimenTitle}>
              Specimen
              <br />
              Questions I get asked
            </h2>
            {ABOUT_FAQ.map((faq) => (
              <div key={faq.question} className={styles.question}>
                <h3 className="c97-serif">{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </section>
        </div>
      </section>
    </Catalog97Shell>
  );
}
