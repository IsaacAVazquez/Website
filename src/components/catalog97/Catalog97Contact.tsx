import Link from "next/link";
import { Catalog97Shell } from "./Catalog97Shell";
import { profile } from "@/lib/profile";

const elsewhere = [
  {
    label: "LinkedIn",
    value: "isaac-vazquez",
    href: profile.sameAs.linkedin,
    note: "Best for anything role-related or Haas-adjacent.",
  },
  {
    label: "GitHub",
    value: "IsaacAVazquez",
    href: profile.sameAs.github,
    note: "The source for most of what is running on this site.",
  },
];

/**
 * Contact, in the Catalog 97 language, and deliberately the shortest of the
 * seven routes.
 *
 * The design draws a four-field form on the left of the pine band and a direct
 * email panel on the right. There is no form backend in this repo, so the form
 * is not implemented — shipping the markup would look right and silently drop
 * every message sent through it. The design's own tobacco line above the band
 * says email is faster than the form and gets read first, so the direct panel
 * takes the full weight the form would have had, in the same two-column split.
 */
export function Catalog97Contact() {
  return (
    <Catalog97Shell>
      {/* Hero */}
      <section
        className="c97-band c97-band-tall"
        data-c97-surface="paper"
        style={{ paddingBottom: "var(--c97-sp-5)" }}
      >
        <div className="c97-shell">
          <p className="c97-kicker">Contact</p>
          <h1
            className="c97-display"
            style={{
              marginTop: "var(--c97-sp-3)",
              lineHeight: "var(--c97-lh-display)",
            }}
          >
            If you have something worth building.
          </h1>
          <p
            className="c97-prose"
            style={{
              marginTop: "var(--c97-sp-2)",
              maxWidth: "var(--c97-measure-body)",
            }}
          >
            Product roles, a second opinion on an analytics problem, or anything
            on this site that has stopped telling the truth. I answer everything
            within a couple of days.
          </p>
        </div>
      </section>

      {/* Tobacco line. Nothing on this band is smaller than --c97-fs-h2. */}
      <section className="c97-band" data-c97-surface="tobacco">
        <div className="c97-shell">
          <p
            className="c97-serif c97-h2"
            style={{ maxWidth: "var(--c97-measure-tight)" }}
          >
            Email is the fastest way to reach me, and I read it first.
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="c97-band c97-band-tall" data-c97-surface="pine">
        <div
          className="c97-shell"
          style={{
            display: "grid",
            // min() so the 280px floor cannot exceed a narrower shell, which is
            // 249px at a 320px viewport and would otherwise overflow the page.
            gridTemplateColumns:
              "repeat(auto-fit,minmax(min(100%, 280px),1fr))",
            gap: "var(--c97-sp-5)",
            alignItems: "start",
          }}
        >
          <div>
            <p className="c97-kicker">Write to me</p>
            <p
              className="c97-serif c97-h3"
              style={{
                marginTop: "var(--c97-sp-2)",
                wordBreak: "break-word",
              }}
            >
              <a href={`mailto:${profile.email}`} className="c97-link">
                {profile.email}
              </a>
            </p>
            <p
              className="c97-prose"
              style={{
                marginTop: "var(--c97-sp-2)",
                color: "var(--c97-ink-2)",
                maxWidth: "var(--c97-measure-body)",
              }}
            >
              If you want to talk about a specific project on this site, name it
              in the subject line and I will bring the numbers.
            </p>

            <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-4)" }}>
              Response time
            </p>
            <p
              className="c97-prose"
              style={{
                marginTop: "var(--c97-sp-2)",
                color: "var(--c97-ink-2)",
                maxWidth: "var(--c97-measure-body)",
              }}
            >
              Two working days, usually less. If it has been longer than that,
              send it again rather than assuming a no.
            </p>
          </div>

          <div>
            <p className="c97-kicker">Or go direct</p>
            <div
              style={{
                display: "grid",
                gap: "var(--c97-sp-4)",
                marginTop: "var(--c97-sp-2)",
              }}
            >
              {elsewhere.map((channel) => (
                <div key={channel.label}>
                  <p
                    className="c97-serif c97-lead"
                    style={{ wordBreak: "break-word" }}
                  >
                    <a
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c97-link"
                    >
                      {channel.value}
                    </a>
                  </p>
                  <p
                    className="c97-prose"
                    style={{
                      marginTop: "var(--c97-sp-1)",
                      color: "var(--c97-ink-2)",
                      maxWidth: "var(--c97-measure-body)",
                    }}
                  >
                    {channel.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="c97-band" data-c97-surface="camel">
        <div
          className="c97-shell"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--c97-sp-3)",
            alignItems: "end",
            justifyContent: "space-between",
          }}
        >
          <p
            className="c97-serif c97-h2"
            style={{ maxWidth: "var(--c97-measure-tight)" }}
          >
            The résumé has the short version, and the work index has the long
            one.
          </p>
          <div
            style={{
              display: "flex",
              gap: "var(--c97-sp-2)",
              flexWrap: "wrap",
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
