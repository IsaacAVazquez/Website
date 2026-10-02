import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { BeforeYouBuyClient } from "./before-you-buy-client";

export const metadata = constructMetadata({
  title: "Before You Buy",
  description:
    "A product concept for Google Finance that shows what a stock would do to your portfolio before you buy it. An independent concept, not affiliated with Google.",
  canonicalUrl: "/investments/before-you-buy",
  dateModified: "2026-10-01",
  image: "/investments/before-you-buy/opengraph-image",
});

export default function BeforeYouBuyPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Investments", url: "/investments" },
    { name: "Before You Buy", url: "/investments/before-you-buy" },
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
          name: "Before You Buy",
          description:
            "A product concept for Google Finance that compares a portfolio before and after one purchase on sector weights, beta, correlation, and the market's five worst days of the past year. An independent concept by Isaac Vazquez, not affiliated with or endorsed by Google.",
          url: "https://isaacvazquez.com/investments/before-you-buy",
          image: "https://isaacvazquez.com/investments/before-you-buy/opengraph-image",
          applicationCategory: "FinanceApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "portfolio analysis",
            "product concept",
            "fintech product",
            "diversification",
            "portfolio beta",
          ],
        }}
      />
      <BeforeYouBuyClient />
    </>
  );
}
