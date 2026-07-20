import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
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
          url: "https://isaacavazquez.com/fintech-tools/interchange-iq",
          image:
            "https://isaacavazquez.com/fintech-tools/interchange-iq/opengraph-image",
          dateModified: "2026-04-02",
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
