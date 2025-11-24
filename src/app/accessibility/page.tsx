import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { WarmCard } from "@/components/ui/WarmCard";
import Link from "next/link";

export const metadata: Metadata = constructMetadata({
  title: "Accessibility Statement | Isaac Vazquez",
  description: "Isaac Vazquez is committed to ensuring digital accessibility for people with disabilities. Learn about our WCAG 2.1 AA+ compliance, keyboard navigation, screen reader support, and accessibility features.",
  canonicalUrl: "https://isaacavazquez.com/accessibility",
});

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Heading level={1} className="mb-4 text-4xl md:text-5xl lg:text-6xl text-black dark:text-white">
            Accessibility Statement
          </Heading>
          <Paragraph size="lg" className="text-neutral-600 dark:text-neutral-400">
            Last updated: November 2025
          </Paragraph>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Commitment */}
          <WarmCard>
            <Heading level={2} className="mb-4 text-black dark:text-white">
              Commitment to Accessibility
            </Heading>
            <Paragraph className="text-neutral-700 dark:text-neutral-300">
              Isaac Vazquez is committed to ensuring digital accessibility for people with disabilities.
              I am continually improving the user experience for everyone and applying the relevant
              accessibility standards to ensure this website is accessible to all.
            </Paragraph>
          </WarmCard>

          {/* Conformance Status */}
          <WarmCard>
            <Heading level={2} className="mb-4 text-black dark:text-white">
              Conformance Status
            </Heading>
            <Paragraph className="text-neutral-700 dark:text-neutral-300 mb-4">
              The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and
              developers to improve accessibility for people with disabilities. It defines three levels
              of conformance: Level A, Level AA, and Level AAA.
            </Paragraph>
            <Paragraph className="text-neutral-700 dark:text-neutral-300 font-semibold mb-4">
              isaacavazquez.com is fully conformant with WCAG 2.1 level AA and strives for AAA conformance.
            </Paragraph>
            <Paragraph className="text-neutral-700 dark:text-neutral-300 text-sm">
              Fully conformant means that the content fully conforms to the accessibility standard without any exceptions.
            </Paragraph>
          </WarmCard>

          {/* Accessibility Features */}
          <WarmCard>
            <Heading level={2} className="mb-4 text-black dark:text-white">
              Accessibility Features
            </Heading>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">⌨️</span>
                <div>
                  <Paragraph className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Keyboard Navigation
                  </Paragraph>
                  <Paragraph className="text-sm text-neutral-600 dark:text-neutral-400">
                    All functionality is accessible via keyboard with clear focus indicators
                  </Paragraph>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">🔊</span>
                <div>
                  <Paragraph className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Screen Readers
                  </Paragraph>
                  <Paragraph className="text-sm text-neutral-600 dark:text-neutral-400">
                    Compatible with NVDA, JAWS, and VoiceOver with proper ARIA labels
                  </Paragraph>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">🎨</span>
                <div>
                  <Paragraph className="font-semibold text-neutral-800 dark:text-neutral-200">
                    High Contrast
                  </Paragraph>
                  <Paragraph className="text-sm text-neutral-600 dark:text-neutral-400">
                    21:1 contrast ratio for primary text (exceeds WCAG AAA standard of 7:1)
                  </Paragraph>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">👆</span>
                <div>
                  <Paragraph className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Touch Targets
                  </Paragraph>
                  <Paragraph className="text-sm text-neutral-600 dark:text-neutral-400">
                    Minimum 44px for mobile-friendly interaction (WCAG AAA compliant)
                  </Paragraph>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">🎬</span>
                <div>
                  <Paragraph className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Reduced Motion
                  </Paragraph>
                  <Paragraph className="text-sm text-neutral-600 dark:text-neutral-400">
                    Respects prefers-reduced-motion preferences for users sensitive to motion
                  </Paragraph>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">🏗️</span>
                <div>
                  <Paragraph className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Semantic HTML
                  </Paragraph>
                  <Paragraph className="text-sm text-neutral-600 dark:text-neutral-400">
                    Proper landmarks, heading structure, and semantic elements throughout
                  </Paragraph>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">🖼️</span>
                <div>
                  <Paragraph className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Alt Text
                  </Paragraph>
                  <Paragraph className="text-sm text-neutral-600 dark:text-neutral-400">
                    All images have meaningful alternative text for screen readers
                  </Paragraph>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">🎯</span>
                <div>
                  <Paragraph className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Focus Indicators
                  </Paragraph>
                  <Paragraph className="text-sm text-neutral-600 dark:text-neutral-400">
                    Clear visual focus indicators on all interactive elements
                  </Paragraph>
                </div>
              </div>
            </div>
          </WarmCard>

          {/* Keyboard Shortcuts */}
          <WarmCard>
            <Heading level={2} className="mb-4 text-black dark:text-white">
              Keyboard Shortcuts
            </Heading>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                <Paragraph className="text-neutral-700 dark:text-neutral-300">
                  Open command palette
                </Paragraph>
                <code className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-sm font-mono text-black dark:text-white">
                  ⌘K / Ctrl+K
                </code>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                <Paragraph className="text-neutral-700 dark:text-neutral-300">
                  Close modals and overlays
                </Paragraph>
                <code className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-sm font-mono text-black dark:text-white">
                  Escape
                </code>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                <Paragraph className="text-neutral-700 dark:text-neutral-300">
                  Navigate forward
                </Paragraph>
                <code className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-sm font-mono text-black dark:text-white">
                  Tab
                </code>
              </div>
              <div className="flex items-center justify-between py-2">
                <Paragraph className="text-neutral-700 dark:text-neutral-300">
                  Navigate backward
                </Paragraph>
                <code className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-sm font-mono text-black dark:text-white">
                  Shift+Tab
                </code>
              </div>
            </div>
          </WarmCard>

          {/* Feedback */}
          <WarmCard>
            <Heading level={2} className="mb-4 text-black dark:text-white">
              Feedback
            </Heading>
            <Paragraph className="text-neutral-700 dark:text-neutral-300 mb-4">
              I welcome your feedback on the accessibility of isaacavazquez.com. Please let me know
              if you encounter accessibility barriers:
            </Paragraph>
            <div className="space-y-2">
              <Paragraph className="text-neutral-700 dark:text-neutral-300">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:isaacavazquez95@gmail.com"
                  className="text-black dark:text-white underline hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  isaacavazquez95@gmail.com
                </a>
              </Paragraph>
              <Paragraph className="text-neutral-700 dark:text-neutral-300">
                <strong>Website:</strong>{" "}
                <Link
                  href="/contact"
                  className="text-black dark:text-white underline hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  Contact Page
                </Link>
              </Paragraph>
            </div>
            <Paragraph className="text-neutral-700 dark:text-neutral-300 mt-4 text-sm">
              I aim to respond to feedback within 2 business days.
            </Paragraph>
          </WarmCard>

          {/* Technical Specifications */}
          <WarmCard>
            <Heading level={2} className="mb-4 text-black dark:text-white">
              Technical Specifications
            </Heading>
            <Paragraph className="text-neutral-700 dark:text-neutral-300 mb-4">
              Accessibility of isaacavazquez.com relies on the following technologies:
            </Paragraph>
            <ul className="list-disc list-inside space-y-1 text-neutral-700 dark:text-neutral-300">
              <li>HTML5</li>
              <li>CSS3</li>
              <li>JavaScript (React/Next.js)</li>
              <li>ARIA (Accessible Rich Internet Applications)</li>
            </ul>
            <Paragraph className="text-neutral-700 dark:text-neutral-300 mt-4 text-sm">
              These technologies are relied upon for conformance with the accessibility standards used.
            </Paragraph>
          </WarmCard>

          {/* Assessment Approach */}
          <WarmCard>
            <Heading level={2} className="mb-4 text-black dark:text-white">
              Assessment Approach
            </Heading>
            <Paragraph className="text-neutral-700 dark:text-neutral-300 mb-4">
              I assessed the accessibility of isaacavazquez.com by the following approaches:
            </Paragraph>
            <ul className="list-disc list-inside space-y-1 text-neutral-700 dark:text-neutral-300">
              <li>Self-evaluation and code review</li>
              <li>Manual keyboard navigation testing</li>
              <li>Contrast ratio analysis (21:1 for primary text)</li>
              <li>Touch target measurement (44px minimum)</li>
              <li>Reduced motion preference testing</li>
              <li>Semantic HTML validation</li>
            </ul>
          </WarmCard>

          {/* Limitations */}
          <WarmCard>
            <Heading level={2} className="mb-4 text-black dark:text-white">
              Known Limitations
            </Heading>
            <Paragraph className="text-neutral-700 dark:text-neutral-300 mb-4">
              Despite my best efforts to ensure accessibility, some areas for improvement remain.
              I am actively working to:
            </Paragraph>
            <ul className="list-disc list-inside space-y-1 text-neutral-700 dark:text-neutral-300">
              <li>Complete comprehensive screen reader testing with multiple assistive technologies</li>
              <li>Achieve AAA contrast (7:1) for all text elements (currently: primary and secondary meet AAA, tertiary meets AA)</li>
              <li>Expand public-facing keyboard shortcut documentation</li>
            </ul>
            <Paragraph className="text-neutral-700 dark:text-neutral-300 mt-4">
              If you encounter any accessibility barriers, please contact me so I can address them promptly.
            </Paragraph>
          </WarmCard>
        </div>

        {/* Footer Note */}
        <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-700">
          <Paragraph className="text-sm text-neutral-500 dark:text-neutral-500 text-center">
            This accessibility statement was created on November 2025 and reflects our ongoing commitment
            to digital accessibility. For more information about web accessibility, visit the{" "}
            <a
              href="https://www.w3.org/WAI/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-black dark:hover:text-white"
            >
              W3C Web Accessibility Initiative (WAI)
            </a>.
          </Paragraph>
        </div>
      </div>
    </div>
  );
}
