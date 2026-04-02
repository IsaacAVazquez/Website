import { constructMetadata } from "@/lib/seo";
import { InterchangeIQClient } from "./interchange-iq-client";

export const metadata = constructMetadata({
  title: "Interchange IQ — Payment Processor Fee Analyzer | Isaac Vazquez",
  description:
    "Compare payment processing costs across Stripe, Square, PayPal, Adyen, and others using real 2024 interchange rate data. Adjust volume, avg ticket, and card mix for live fee comparisons and breakeven analysis.",
  canonicalUrl: "/fintech-tools/interchange-iq",
});

export default function InterchangeIQPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-primary)] py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-10">
          <p className="section-kicker mb-4">Fintech Tools</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            Interchange IQ
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-2">
            Most merchants don&apos;t know what they&apos;re actually paying for payment processing —
            or why. Adjust the sliders to see how volume, average ticket size, and card mix
            affect total fees across major processors.
          </p>
          <p className="text-sm text-[var(--text-tertiary)] max-w-2xl">
            Interchange economics are at the core of every payments product. This tool models
            the real cost structure behind flat-rate and interchange+ pricing using published rate data.
          </p>
        </div>

        <InterchangeIQClient />
      </div>
    </main>
  );
}
