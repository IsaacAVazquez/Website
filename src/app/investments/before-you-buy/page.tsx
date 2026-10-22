import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { BeforeYouBuyClient } from "./before-you-buy-client";

export const metadata = constructMetadata({
  title: "Before You Buy",
  description:
    "Edit a portfolio and compare two stock purchases using the same amount, with allocation changes and historical market behavior side by side. An independent concept for Google Finance.",
  canonicalUrl: "/investments/before-you-buy",
  dateModified: "2026-10-21",
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
            "Edit portfolio holdings and compare two purchases using the same amount and shared historical dates, with position weights, direct sector exposure, beta, correlation, and the market's five worst days. An independent concept by Isaac Vazquez, not affiliated with or endorsed by Google.",
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
