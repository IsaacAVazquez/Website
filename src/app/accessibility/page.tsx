import { Metadata } from "next";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import Link from "next/link";

const accessibilityDescription =
  "How I approach digital accessibility on this site, including WCAG 2.1 AA conformance, keyboard navigation, screen reader support, and reduced motion.";

export const metadata: Metadata = constructMetadata({
  title: "Accessibility Statement | Isaac Vazquez",
  description: accessibilityDescription,
  canonicalUrl: "https://isaacvazquez.com/accessibility",
  dateModified: "2026-07-16",
});

const accessibilityFeatures = [
  {
    title: "Keyboard navigation",
    detail: "Every interaction works from the keyboard with clear focus indicators.",
  },
  {
    title: "Screen reader support",
    detail: "Compatible with NVDA, JAWS, and VoiceOver. ARIA is used where semantic HTML isn't enough.",
  },
  {
    title: "High contrast",
    detail: "Primary text exceeds WCAG AAA (7:1). Body type sits at 21:1 in light mode.",
  },
  {
    title: "44px touch targets",
    detail: "Interactive controls target at least 44px for comfortable mobile use, and I am still bringing a few smaller ones up to that size.",
  },
  {
    title: "Reduced motion",
    detail: "Animations respect prefers-reduced-motion. Reveal transitions collapse when the OS asks for it.",
  },
  {
    title: "Semantic HTML",
    detail: "Real landmarks, correct heading order, and native elements wherever possible.",
  },
  {
    title: "Meaningful alt text",
    detail: "Every image that conveys information has descriptive alt text.",
  },
  {
    title: "Visible focus",
    detail: "Clear visual focus rings on every interactive element.",
  },
];

const keyboardShortcuts = [
  { action: "Close modals and overlays", keys: "Escape" },
  { action: "Navigate forward", keys: "Tab" },
  { action: "Navigate backward", keys: "Shift + Tab" },
];

const technicalSpecs = ["HTML5", "CSS3", "JavaScript (React / Next.js)", "ARIA (Accessible Rich Internet Applications)"];

const assessmentApproach = [
  "Self-evaluation and code review",
  "Manual keyboard navigation testing",
  "Contrast ratio analysis (21:1 for primary text)",
  "Touch target measurement (44px minimum)",
  "Reduced motion preference testing",
  "Semantic HTML validation",
];

const knownLimitations = [
  "Broader screen reader testing with multiple assistive technologies",
  "AAA contrast (7:1) for every text element. Primary and secondary meet AAA today, tertiary meets AA",
  "More public-facing keyboard shortcut documentation",
];

const secondaryProseStyle = {
  marginTop: "var(--c97-sp-2)",
  color: "var(--c97-ink-2)",
} as const;

export default function AccessibilityPage() {
  return (
    <>
      <StructuredData
        type="WebPage"
        data={{
          title: "Accessibility Statement",
          description: accessibilityDescription,
          url: "https://isaacvazquez.com/accessibility",
          dateModified: "2026-07-16",
        }}
      />
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (
            generateBreadcrumbStructuredData([
              { name: "Home", url: "/" },
              { name: "Accessibility", url: "/accessibility" },
            ]) as { itemListElement: object[] }
          ).itemListElement,
        }}
      />

      {/* Hero */}
      <section
        className="c97-band"
        data-c97-surface="paper"
        aria-label="Accessibility statement"
      >
        <div className="c97-shell">
          <p className="c97-kicker">Accessibility · Updated April 2026</p>
          <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-3)" }}>
            How I approach accessibility on this site.
          </h1>
          <p
            className="c97-lead"
            style={{
              marginTop: "var(--c97-sp-3)",
              maxWidth: "var(--c97-measure-wide)",
            }}
          >
            I take accessibility seriously. I build and test this site against WCAG standards and keep
            improving it so that everyone can use it, regardless of ability.
          </p>
        </div>
      </section>

      {/* Conformance status */}
      <section className="c97-band c97-band-continues" data-c97-surface="paper">
        <div className="c97-shell">
          <p className="c97-kicker">Accessibility</p>
          <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
            Conformance status
          </h2>
          <p className="c97-prose" style={secondaryProseStyle}>
            WCAG defines three conformance levels (A, AA, AAA) for how well a site supports people
            with disabilities.
          </p>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)" }}>
            I build this site to conform with WCAG 2.1 Level AA, and I aim for AAA where I can.
          </p>
          <p className="c97-prose" style={secondaryProseStyle}>
            What that means in practice is that I test against the AA success criteria and keep fixing the
            gaps I find, rather than treating the standard as met without exception.
          </p>
        </div>
      </section>

      {/* Accessibility features */}
      <section className="c97-band" data-c97-surface="bone">
        <div className="c97-shell">
          <p className="c97-kicker">Accessibility</p>
          <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
            Accessibility features
          </h2>
          <div className="c97-columns" style={{ marginTop: "var(--c97-sp-4)" }}>
            {accessibilityFeatures.map((feature) => (
              <div key={feature.title}>
                <h3 className="c97-serif c97-h3">{feature.title}</h3>
                <p
                  className="c97-prose"
                  style={{
                    marginTop: "var(--c97-sp-1)",
                    color: "var(--c97-ink-2)",
                  }}
                >
                  {feature.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keyboard shortcuts */}
      <section className="c97-band" data-c97-surface="paper">
        <div className="c97-shell">
          <p className="c97-kicker">Accessibility</p>
          <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>
            Keyboard shortcuts
          </h2>
          <div
            role="region"
            aria-label="Keyboard shortcuts"
            tabIndex={0}
            style={{ overflowX: "auto", marginTop: "var(--c97-sp-4)" }}
          >
            <table className="c97-table">
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Key</th>
                </tr>
              </thead>
              <tbody>
                {keyboardShortcuts.map((shortcut) => (
                  <tr key={shortcut.action}>
                    <td>{shortcut.action}</td>
                    <td>
                      <kbd className="c97-kbd">{shortcut.keys}</kbd>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Feedback, specifications, approach, limitations */}
      <section className="c97-band" data-c97-surface="bone">
        <div className="c97-shell">
          <div className="c97-columns">
            <div>
              {/* h2 elements at the h3 step, so the heading order holds. */}
              <h2 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-2)" }}>
                Feedback
              </h2>
              <p className="c97-prose" style={secondaryProseStyle}>
                I welcome feedback on accessibility. If you run into a barrier, please reach out.
              </p>
              <ul className="c97-list" style={{ marginTop: "var(--c97-sp-2)" }}>
                <li>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:IsaacVazquez@berkeley.edu" className="c97-link">
                    IsaacVazquez@berkeley.edu
                  </a>
                </li>
                <li>
                  <strong>Website:</strong>{" "}
                  <Link href="/contact" className="c97-link">
                    Contact page
                  </Link>
                </li>
              </ul>
              <p className="c97-prose" style={secondaryProseStyle}>
                I aim to respond to accessibility feedback within two business days.
              </p>
            </div>

            <div>
              <h2 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-2)" }}>
                Technical specifications
              </h2>
              <p className="c97-prose" style={secondaryProseStyle}>
                The site is built on these technologies for accessibility conformance.
              </p>
              <ul className="c97-list" style={{ marginTop: "var(--c97-sp-2)" }}>
                {technicalSpecs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="c97-prose" style={secondaryProseStyle}>
                I rely on these to meet the accessibility standards described above.
              </p>
            </div>

            <div>
              <h2 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-2)" }}>
                Assessment approach
              </h2>
              <p className="c97-prose" style={secondaryProseStyle}>
                I assess the site using these approaches.
              </p>
              <ul className="c97-list" style={{ marginTop: "var(--c97-sp-2)" }}>
                {assessmentApproach.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-2)" }}>
                Known limitations
              </h2>
              <p className="c97-prose" style={secondaryProseStyle}>
                There are a few areas I am still improving.
              </p>
              <ul className="c97-list" style={{ marginTop: "var(--c97-sp-2)" }}>
                {knownLimitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="c97-prose" style={secondaryProseStyle}>
                If you run into a barrier, please reach out so I can fix it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing note */}
      <section className="c97-band" data-c97-surface="paper">
        <div className="c97-shell">
          <p className="c97-prose" style={{ color: "var(--c97-ink-2)" }}>
            This statement was written in November 2025 and I update it as the site changes. For more
            on web accessibility, visit the{" "}
            <a
              href="https://www.w3.org/WAI/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="W3C Web Accessibility Initiative (opens in a new tab)"
              className="c97-link"
            >
              W3C Web Accessibility Initiative
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
