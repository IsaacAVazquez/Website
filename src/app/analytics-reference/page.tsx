import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { CodeSample } from "@/components/analytics/CodeSample";
import { ANALYTICS_EVENTS, GA_EVENT } from "@/lib/analytics";

export const metadata: Metadata = constructMetadata({
  title: "Analytics Event Reference",
  description:
    "Internal reference for the Google Analytics 4 event tracking wired into this site: event names, parameters, triggers, and setup.",
  canonicalUrl: "/analytics-reference",
  noIndex: true,
});

/*
 * Inline code drawn like a chip: the mono face on the field tint, the same
 * treatment `.c97-article :not(pre) > code` gives a Markdown code span.
 */
const inlineCodeStyle = {
  background: "var(--c97-field)",
  padding: "0 0.35em",
  fontSize: "0.875em",
} as const;

const setupSnippet = `# .env.local — production only; leave unset for dev / CI / tests
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`;

const usageSnippet = `import { trackNavigationClick } from "@/lib/analytics";

trackNavigationClick({
  link_text: "Writing",
  link_url: "/writing",
  nav_location: "header_primary",
});`;

const namingRules = [
  "Event and parameter names are lower snake_case.",
  "Event names stay under 40 characters; parameter names under 40.",
  "String parameter values are clamped to 100 characters.",
  "Every helper is a no-op on the server, when analytics is disabled, or before gtag loads.",
];

export default function AnalyticsReferencePage() {
  return (
    <>
      <section
        className="c97-band"
        data-c97-surface="paper"
        aria-label="Analytics event reference"
      >
        <div className="c97-shell">
          <p className="c97-kicker">Internal reference · Not indexed</p>
          <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-2)" }}>
            Analytics event reference
          </h1>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-3)" }}>
            Every Google Analytics 4 event this site emits, with its parameters and what
            triggers it. Tracking only runs when{" "}
            <code className="c97-mono" style={inlineCodeStyle}>
              NEXT_PUBLIC_GA_MEASUREMENT_ID
            </code>{" "}
            is set to a real measurement id — so local development, CI, and the test suite stay
            free of third-party scripts.
          </p>
        </div>
      </section>

      <section className="c97-band" data-c97-surface="bone">
        <div className="c97-shell c97-columns">
          <div>
            <p className="c97-kicker">Environment</p>
            <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
              Setup
            </h2>
            <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
              Add the measurement id to the environment. When present, gtag.js loads after
              interactive and the Content-Security-Policy widens to allow Google&apos;s endpoints.
            </p>
            <div style={{ marginTop: "var(--c97-sp-3)" }}>
              <CodeSample
                code={setupSnippet}
                language="bash"
                id="env-setup"
                location="analytics_reference"
              />
            </div>
          </div>

          <div>
            <p className="c97-kicker">Conventions</p>
            <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
              Naming conventions
            </h2>
            <ul className="c97-list" style={{ marginTop: "var(--c97-sp-2)" }}>
              {namingRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <div style={{ marginTop: "var(--c97-sp-3)" }}>
              <CodeSample
                code={usageSnippet}
                language="ts"
                id="usage-example"
                location="analytics_reference"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="c97-band" data-c97-surface="paper">
        <div className="c97-shell">
          <p className="c97-kicker">Event list</p>
          <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
            Events ({ANALYTICS_EVENTS.length})
          </h2>

          <div style={{ marginTop: "var(--c97-sp-4)" }}>
            {ANALYTICS_EVENTS.map((event) => (
              <article
                key={event.name}
                style={{
                  borderTop: "1px solid var(--c97-rule)",
                  paddingBlock: "var(--c97-sp-4)",
                  display: "grid",
                  gap: "var(--c97-sp-2)",
                }}
              >
                <p className="c97-meta" style={{ alignItems: "center" }}>
                  <code className="c97-mono" style={{ ...inlineCodeStyle, fontSize: "var(--c97-fs-small)", textTransform: "none", letterSpacing: 0, color: "var(--c97-ink)" }}>
                    {event.name}
                  </code>
                  <span className="c97-chip">{event.category}</span>
                </p>

                <p className="c97-prose">{event.description}</p>

                <div>
                  <p className="c97-kicker">Trigger</p>
                  <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)" }}>
                    {event.trigger}
                  </p>
                </div>

                <div
                  role="region"
                  aria-label={`${event.name} parameters`}
                  tabIndex={0}
                  style={{ overflowX: "auto" }}
                >
                  <table className="c97-table">
                    <thead>
                      <tr>
                        <th scope="col">Parameter</th>
                        <th scope="col">Description</th>
                        <th scope="col">Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.parameters.map((param) => (
                        <tr key={param.name}>
                          <td>
                            <code className="c97-mono">{param.name}</code>
                          </td>
                          <td>{param.description}</td>
                          <td>
                            <code className="c97-mono">{param.example}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>

          <p
            className="c97-prose"
            style={{
              marginTop: "var(--c97-sp-4)",
              color: "var(--c97-ink-2)",
              maxWidth: "none",
            }}
          >
            Source of truth:{" "}
            <code className="c97-mono" style={inlineCodeStyle}>
              src/lib/analytics.ts
            </code>{" "}
            (events:{" "}
            {Object.values(GA_EVENT).join(", ")}
            ).
          </p>
        </div>
      </section>
    </>
  );
}
