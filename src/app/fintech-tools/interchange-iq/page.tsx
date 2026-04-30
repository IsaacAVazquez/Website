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
    <section
      className="home-page min-h-screen"
      aria-label="Interchange IQ"
    >
      <div className="mx-auto w-full max-w-[1680px] px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8 xl:px-10 2xl:px-12">
        <InterchangeIQClient />
      </div>
    </section>
  );
}
