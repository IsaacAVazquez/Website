import { constructMetadata } from "@/lib/seo";
import { InterchangeIQClient } from "./interchange-iq-client";

export const metadata = constructMetadata({
  title: "Interchange IQ",
  description:
    "I built a fee analyzer that models real interchange economics across Stripe, Square, PayPal, Adyen, and others so you can compare flat-rate and interchange+ pricing before committing.",
  canonicalUrl: "/fintech-tools/interchange-iq",
  image: "/fintech-tools/interchange-iq/opengraph-image",
  dateModified: "2026-04-02",
});

export default function InterchangeIQPage() {
  return (
    <section className="home-page home-section min-h-screen" aria-label="Interchange IQ">
      <div className="home-shell space-y-10">
        <header className="space-y-4 max-w-3xl">
          <p className="home-kicker mb-0">Fintech tools · Interchange IQ</p>
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
            Interchange IQ
          </h1>
          <p className="home-body">
            Most merchants don&apos;t know what they&apos;re actually paying for payment processing,
            or why. Move the sliders to see how volume, ticket size, and card mix change
            your total fees across seven processors.
          </p>
          <p
            className="mb-0 text-sm leading-6"
            style={{
              fontFamily: "var(--font-home-sans)",
              color: "color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))",
            }}
          >
            Interchange economics are at the core of every payments product. I modeled
            the real cost structure behind flat-rate and interchange+ pricing using published rate data.
          </p>
        </header>

        <InterchangeIQClient />
      </div>
    </section>
  );
}
