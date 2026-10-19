import Link from "next/link";
import { Catalog97Shell } from "./Catalog97Shell";
import { profile } from "@/lib/profile";

const elsewhere = [
  {
    label: "LinkedIn",
    value: "isaac-vazquez",
    href: profile.sameAs.linkedin,
    note: "Best for anything about roles or Haas.",
  },
  {
    label: "GitHub",
    value: "IsaacAVazquez",
    href: profile.sameAs.github,
    note: "The source for most of what is running on this site.",
  },
];

// A 44px tap height for the channel links without moving them off their line,
// the same padding and cancelling margin the header wordmark uses.
const touchTarget = {
  display: "inline-block",
  paddingBlock: "var(--c97-touch-y)",
  marginBlock: "calc(-1 * var(--c97-touch-y))",
} as const;

/**
 * Contact, as one screen (2026-10-18).
 *
 * The headline, which `e2e/footer-cta.spec.ts` pins, then the address as the
 * largest thing on the page, the paragraph about what to write, and the
 * response time, all on the first screen. One blue sheet holds the other two
 * channels and the exits. The vermilion line, the peach band, and the Email
 * me button that stood in for the address are gone.
 *
 * There is no form backend in this repo, so there is no form, since shipping
 * the markup would look right and silently drop every message sent through it.
 */
export function Catalog97Contact() {
  return (
    <Catalog97Shell>
      {/* Hero, the proofed sheet, with the address on it. */}
      <section className="c97-band c97-sheet" data-c97-surface="paper">
        <div className="c97-shell">
          <h1 className="c97-poster">I&rsquo;d like to hear from you.</h1>
          <p
            className="c97-lead"
            style={{
              marginTop: "var(--c97-sp-3)",
              maxWidth: "var(--c97-measure-wide)",
              lineHeight: "var(--c97-lh-body)",
            }}
          >
            I&rsquo;m looking for a full-time role in product management,
            product marketing, or program management that starts after I
            graduate from Haas in May 2027, and I&rsquo;m always glad to
            compare notes with people working on product, analytics, or fintech.
            If something on this site looks wrong to you, I want to hear about
            that too.
          </p>
          <p
            className="c97-serif c97-h2"
            style={{ marginTop: "var(--c97-sp-4)", wordBreak: "break-word" }}
          >
            <a href={`mailto:${profile.email}`} className="c97-link" style={touchTarget}>
              {profile.email}
            </a>
          </p>
          <p
            className="c97-prose"
            style={{
              marginTop: "var(--c97-sp-2)",
              color: "var(--c97-ink-2)",
              maxWidth: "var(--c97-measure-wide)",
            }}
          >
            Email is the fastest way to reach me, and I read it first. If you
            want to talk about a specific project on this site, name it in the
            subject line so I can pull up the details before I reply. I usually
            reply within two working days, so if it has been longer than that,
            send it again.
          </p>
        </div>
      </section>

      {/* The other channels and the exits, on the page's one ink sheet. */}
      <section
        className="c97-band c97-sheet"
        data-c97-surface="ink-blue"
        data-seam="torn"
      >
        <div className="c97-shell">
          <h2 className="c97-poster-sm">Elsewhere</h2>
          <div
            style={{
              display: "grid",
              gap: "var(--c97-sp-3)",
              marginTop: "var(--c97-sp-3)",
            }}
          >
            {elsewhere.map((channel) => (
              <div key={channel.label}>
                <p className="c97-serif c97-lead" style={{ wordBreak: "break-word" }}>
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="c97-link"
                    aria-label={`${channel.label}, ${channel.value}, opens in a new tab`}
                    style={touchTarget}
                  >
                    {channel.label} · {channel.value}
                  </a>
                </p>
                <p
                  className="c97-prose"
                  style={{
                    marginTop: "var(--c97-sp-1)",
                    color: "var(--c97-ink-2)",
                    maxWidth: "var(--c97-measure-wide)",
                  }}
                >
                  {channel.note}
                </p>
              </div>
            ))}
          </div>
          <p
            className="c97-prose"
            style={{ marginTop: "var(--c97-sp-4)", maxWidth: "var(--c97-measure-wide)" }}
          >
            The <Link className="c97-link" href="/resume">résumé</Link> has the
            short version of my background, and the{" "}
            <Link className="c97-link" href="/portfolio">work index</Link> has the
            long one.
          </p>
        </div>
      </section>
    </Catalog97Shell>
  );
}
