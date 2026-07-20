import { Metadata } from "next";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import Link from "next/link";

export const metadata: Metadata = constructMetadata({
  title: "Accessibility",
  description: "How I approach digital accessibility on this site, including WCAG 2.1 AA conformance, keyboard navigation, screen reader support, and reduced motion.",
  canonicalUrl: "/accessibility",
  dateModified: "2025-02-05",
});

const accessibilityFeatures = [
  {
    emoji: "⌨️",
    title: "Keyboard navigation",
    detail: "Every interaction works from the keyboard with clear focus indicators.",
  },
  {
    emoji: "🔊",
    title: "Screen reader support",
    detail: "Compatible with NVDA, JAWS, and VoiceOver. ARIA is used where semantic HTML isn't enough.",
  },
  {
    emoji: "🎨",
    title: "High contrast",
    detail: "Primary text exceeds WCAG AAA (7:1). Body type sits at 21:1 in light mode.",
  },
  {
    emoji: "👆",
    title: "44px touch targets",
    detail: "Interactive controls target at least 44px for comfortable mobile use, and I am still bringing a few smaller ones up to that size.",
  },
  {
    emoji: "🎬",
    title: "Reduced motion",
    detail: "Animations respect prefers-reduced-motion. Reveal transitions collapse when the OS asks for it.",
  },
  {
    emoji: "🏗️",
    title: "Semantic HTML",
    detail: "Real landmarks, correct heading order, and native elements wherever possible.",
  },
  {
    emoji: "🖼️",
    title: "Meaningful alt text",
    detail: "Every image that conveys information has descriptive alt text.",
  },
  {
    emoji: "🎯",
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

const cardBaseStyle = {
  fontFamily: "var(--font-home-sans)",
} as const;

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

export default function AccessibilityPage() {
  return (
    <section className="home-page home-section min-h-screen" aria-label="Accessibility statement">
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
      <div className="home-shell home-shell-tight space-y-10">
        <header className="space-y-4">
          <p className="home-kicker mb-0">Accessibility · Updated April 2026</p>
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
            How I approach accessibility on this site.
          </h1>
          <p className="home-body max-w-[52rem]">
            I take accessibility seriously. I build and test this site against WCAG standards and keep
            improving it so that everyone can use it, regardless of ability.
          </p>
        </header>

        <div className="space-y-6" style={cardBaseStyle}>
          <article className="home-card p-6 sm:p-8 space-y-3">
            <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
              Conformance status
            </h2>
            <p className="mb-0 text-base leading-7" style={bodyStyle}>
              WCAG defines three conformance levels (A, AA, AAA) for how well a site supports people
              with disabilities.
            </p>
            <p className="mb-0 text-base leading-7" style={strongBodyStyle}>
              I build this site to conform with WCAG 2.1 Level AA, and I aim for AAA where I can.
            </p>
            <p className="mb-0 text-sm leading-6" style={bodyStyle}>
              What that means in practice is that I test against the AA success criteria and keep fixing the
              gaps I find, rather than treating the standard as met without exception.
            </p>
          </article>

          <article className="home-card p-6 sm:p-8 space-y-5">
            <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
              Accessibility features
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {accessibilityFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <span className="text-xl leading-none" aria-hidden="true">
                    {feature.emoji}
                  </span>
                  <div className="space-y-1">
                    <p className="mb-0 text-sm" style={strongBodyStyle}>
                      {feature.title}
                    </p>
                    <p className="mb-0 text-sm leading-6" style={bodyStyle}>
                      {feature.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="home-card p-6 sm:p-8 space-y-4">
            <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
              Keyboard shortcuts
            </h2>
            <dl className="space-y-0">
              {keyboardShortcuts.map((shortcut, index) => (
                <div
                  key={shortcut.action}
                  className="flex items-center justify-between gap-4 py-3"
                  style={
                    index < keyboardShortcuts.length - 1
                      ? { borderBottom: "1px solid var(--home-rule)" }
                      : undefined
                  }
                >
                  <dt className="mb-0 text-sm" style={bodyStyle}>
                    {shortcut.action}
                  </dt>
                  <dd className="mb-0">
                    <kbd
                      className="rounded-md px-3 py-1 font-mono text-sm"
                      style={{
                        background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
                        color: "var(--home-ink)",
                        border: "1px solid var(--home-rule)",
                      }}
                    >
                      {shortcut.keys}
                    </kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </article>

          <article className="home-card p-6 sm:p-8 space-y-4">
            <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
              Feedback
            </h2>
            <p className="mb-0 text-base leading-7" style={bodyStyle}>
              I welcome feedback on accessibility. If you run into a barrier, please reach out.
            </p>
            <ul className="mb-0 space-y-2">
              <li className="mb-0 text-base leading-7" style={bodyStyle}>
                <strong style={{ color: "var(--home-ink)" }}>Email:</strong>{" "}
                <a
                  href="mailto:IsaacVazquez@berkeley.edu"
                  className="underline underline-offset-2"
                  style={{ color: "var(--home-signal)" }}
                >
                  IsaacVazquez@berkeley.edu
                </a>
              </li>
              <li className="mb-0 text-base leading-7" style={bodyStyle}>
                <strong style={{ color: "var(--home-ink)" }}>Website:</strong>{" "}
                <Link
                  href="/contact"
                  className="underline underline-offset-2"
                  style={{ color: "var(--home-signal)" }}
                >
                  Contact page
                </Link>
              </li>
            </ul>
            <p className="mb-0 text-sm leading-6" style={bodyStyle}>
              I aim to respond to accessibility feedback within two business days.
            </p>
          </article>

          <article className="home-card p-6 sm:p-8 space-y-4">
            <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
              Technical specifications
            </h2>
            <p className="mb-0 text-base leading-7" style={bodyStyle}>
              The site is built on these technologies for accessibility conformance.
            </p>
            <ul
              className="mb-0 list-disc space-y-1 pl-5 text-base leading-7"
              style={bodyStyle}
            >
              {technicalSpecs.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mb-0 text-sm leading-6" style={bodyStyle}>
              I rely on these to meet the accessibility standards described above.
            </p>
          </article>

          <article className="home-card p-6 sm:p-8 space-y-4">
            <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
              Assessment approach
            </h2>
            <p className="mb-0 text-base leading-7" style={bodyStyle}>
              I assess the site using these approaches.
            </p>
            <ul
              className="mb-0 list-disc space-y-1 pl-5 text-base leading-7"
              style={bodyStyle}
            >
              {assessmentApproach.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="home-card p-6 sm:p-8 space-y-4">
            <h2 className="text-2xl mb-0" style={sectionTitleStyle}>
              Known limitations
            </h2>
            <p className="mb-0 text-base leading-7" style={bodyStyle}>
              There are a few areas I am still improving.
            </p>
            <ul
              className="mb-0 list-disc space-y-1 pl-5 text-base leading-7"
              style={bodyStyle}
            >
              {knownLimitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mb-0 text-base leading-7" style={bodyStyle}>
              If you run into a barrier, please reach out so I can fix it.
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
          This statement was written in November 2025 and I update it as the site changes. For more
          on web accessibility, visit the{" "}
          <a
            href="https://www.w3.org/WAI/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="W3C Web Accessibility Initiative (opens in a new tab)"
            className="underline underline-offset-2"
            style={{ color: "var(--home-signal)" }}
          >
            W3C Web Accessibility Initiative
          </a>
          .
        </footer>
      </div>
    </section>
  );
}
