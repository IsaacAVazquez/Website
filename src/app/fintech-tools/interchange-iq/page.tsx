import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData, laterDate } from "@/lib/seo";
import { PROCESSOR_RATES_AS_OF } from "@/lib/interchangeIq";
import { InterchangeIQClient } from "./interchange-iq-client";

// The later of the day the processor rates were last read and the last redesign.
const dateModified = laterDate(PROCESSOR_RATES_AS_OF, "2026-10-12");

export const metadata = constructMetadata({
  title: "Interchange IQ",
  description:
    "I built a fee analyzer that sets blended interchange averages against the published rates of Stripe, Square, Shopify, and PayPal, with assumed interchange+ contracts behind a toggle.",
  canonicalUrl: "/fintech-tools/interchange-iq",
  image: "/fintech-tools/interchange-iq/opengraph-image",
  dateModified,
});

export default function InterchangeIQPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Interchange IQ", url: "/fintech-tools/interchange-iq" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (
            generateBreadcrumbStructuredData(breadcrumbs) as {
              itemListElement: object[];
            }
          ).itemListElement,
        }}
      />
      <StructuredData
        type="SoftwareApplication"
        data={{
          name: "Interchange IQ",
          description:
            "Payment fee analyzer comparing flat-rate and interchange-plus processor economics with adjustable volume, ticket size, and card mix.",
          url: "https://isaacvazquez.com/fintech-tools/interchange-iq",
          image:
            "https://isaacvazquez.com/fintech-tools/interchange-iq/opengraph-image",
          dateModified,
          applicationCategory: "FinanceApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "payment processing fees",
            "interchange rates",
            "processor comparison",
            "fintech pricing",
          ],
        }}
      />
      <InterchangeIQClient />
    </>
  );
}
