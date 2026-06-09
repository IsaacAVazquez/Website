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
  return <InterchangeIQClient />;
}
