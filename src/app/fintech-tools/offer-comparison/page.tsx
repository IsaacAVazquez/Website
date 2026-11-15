import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { OfferComparisonClient } from "./offer-comparison-client";

export const metadata = constructMetadata({
  title: "Offer Comparison Calculator",
  description:
    "I built an offer comparison calculator that lines up two or three job offers year by year across a four year equity vest, counting base, target bonus, signing bonus, vesting schedule, and retirement match, so the offer that wins year one and the offer that wins over four years can both show.",
  canonicalUrl: "/fintech-tools/offer-comparison",
  dateModified: "2026-11-02",
  image: "/fintech-tools/offer-comparison/opengraph-image",
});

export default function OfferComparisonPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Offer Comparison Calculator", url: "/fintech-tools/offer-comparison" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as { itemListElement: object[] })
            .itemListElement,
        }}
      />
      <StructuredData
        type="SoftwareApplication"
        data={{
          name: "Offer Comparison Calculator",
          description:
            "Year by year, pre-tax comparison of two or three job offers across a four year equity vest, kept entirely in the browser.",
          url: "https://isaacvazquez.com/fintech-tools/offer-comparison",
          image: "https://isaacvazquez.com/fintech-tools/offer-comparison/opengraph-image",
          applicationCategory: "FinanceApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "job offer comparison",
            "total compensation calculator",
            "equity vesting schedule",
            "signing bonus",
            "personal finance",
            "fintech project",
          ],
        }}
      />
      <OfferComparisonClient />
    </>
  );
}
