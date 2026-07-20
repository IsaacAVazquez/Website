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

const monoChipStyle = {
  fontFamily: "var(--font-jetbrains-mono)",
  background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
  border: "1px solid var(--home-rule)",
  color: "var(--home-ink)",
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
    <section className="home-page home-section min-h-screen" aria-label="Analytics event reference">
      <div className="home-shell home-shell-tight space-y-10">
        <header className="space-y-4">
          <p className="home-kicker mb-0">Internal reference · Not indexed</p>
          <h1
            className="mb-0"
            style={{
              fontFamily: "var(--font-home-sans)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--home-ink)",
              fontSize: "clamp(2rem, 5vw, 2.8rem)",
            }}
          >
            Analytics event reference
          </h1>
          <p className="mb-0 max-w-2xl" style={bodyStyle}>
            Every Google Analytics 4 event this site emits, with its parameters and what
            triggers it. Tracking only runs when{" "}
            <code style={{ ...monoChipStyle, padding: "0.1rem 0.4rem", borderRadius: 6 }}>
              NEXT_PUBLIC_GA_MEASUREMENT_ID
            </code>{" "}
            is set to a real measurement id — so local development, CI, and the test suite stay
            free of third-party scripts.
          </p>
        </header>

        <article className="home-card p-6 sm:p-7 space-y-4">
          <h2 className="text-xl mb-0" style={sectionTitleStyle}>
            Setup
          </h2>
          <p className="mb-0" style={bodyStyle}>
            Add the measurement id to the environment. When present, gtag.js loads after
            interactive and the Content-Security-Policy widens to allow Google&apos;s endpoints.
          </p>
          <CodeSample
            code={setupSnippet}
            language="bash"
            id="env-setup"
            location="analytics_reference"
          />
        </article>

        <article className="home-card p-6 sm:p-7 space-y-4">
          <h2 className="text-xl mb-0" style={sectionTitleStyle}>
            Naming conventions
          </h2>
          <ul className="mb-0 space-y-2" style={bodyStyle}>
            {namingRules.map((rule) => (
              <li key={rule}>• {rule}</li>
            ))}
          </ul>
          <CodeSample
            code={usageSnippet}
            language="ts"
            id="usage-example"
            location="analytics_reference"
          />
        </article>

        <div className="space-y-6">
          <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
            Events ({ANALYTICS_EVENTS.length})
          </h2>

          {ANALYTICS_EVENTS.map((event) => (
            <article key={event.name} className="home-card p-6 sm:p-7 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <code
                  className="inline-flex items-center rounded-md px-2.5 py-1 text-sm font-semibold"
                  style={monoChipStyle}
                >
                  {event.name}
                </code>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    background: "var(--home-ink)",
                    color: "var(--home-paper)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {event.category}
                </span>
              </div>

              <p className="mb-0" style={bodyStyle}>
                {event.description}
              </p>
              <p className="mb-0 text-sm" style={bodyStyle}>
                <span style={{ color: "var(--home-ink)", fontWeight: 600 }}>Trigger:</span>{" "}
                {event.trigger}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm" style={bodyStyle}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--home-rule)" }}>
                      <th className="py-2 pr-4 text-left" style={{ color: "var(--home-ink)" }}>
                        Parameter
                      </th>
                      <th className="py-2 pr-4 text-left" style={{ color: "var(--home-ink)" }}>
                        Description
                      </th>
                      <th className="py-2 text-left" style={{ color: "var(--home-ink)" }}>
                        Example
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.parameters.map((param) => (
                      <tr
                        key={param.name}
                        style={{ borderBottom: "1px solid var(--home-rule)" }}
                      >
                        <td className="py-2 pr-4 align-top">
                          <code
                            style={{
                              fontFamily: "var(--font-jetbrains-mono)",
                              color: "var(--home-ink)",
                            }}
                          >
                            {param.name}
                          </code>
                        </td>
                        <td className="py-2 pr-4 align-top">{param.description}</td>
                        <td className="py-2 align-top">
                          <code style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                            {param.example}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>

        <p className="mb-0 text-sm" style={bodyStyle}>
          Source of truth:{" "}
          <code style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--home-ink)" }}>
            src/lib/analytics.ts
          </code>{" "}
          (events:{" "}
          {Object.values(GA_EVENT).join(", ")}
          ).
        </p>
      </div>
    </section>
  );
}
