import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { RentVsBuyClient } from "./rent-vs-buy-client";

export const metadata = constructMetadata({
  title: "Rent vs. Buy Calculator",
  description:
    "I built a rent-vs-buy calculator that runs a month-by-month net-worth model, credits the renter the opportunity cost of a buyer's down payment, and finds the exact year buying pulls ahead.",
  canonicalUrl: "/fintech-tools/rent-vs-buy",
  dateModified: "2026-07-20",
  image: "/fintech-tools/rent-vs-buy/opengraph-image",
});

export default function RentVsBuyPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Rent vs. Buy Calculator", url: "/fintech-tools/rent-vs-buy" },
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
          name: "Rent vs. Buy Calculator",
          description:
            "Month-by-month rent-vs-buy net-worth model with opportunity-cost accounting and a break-even year, kept entirely in the browser.",
          url: "https://isaacavazquez.com/fintech-tools/rent-vs-buy",
          image: "https://isaacavazquez.com/fintech-tools/rent-vs-buy/opengraph-image",
          applicationCategory: "FinanceApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "rent vs buy calculator",
            "break-even year",
            "home affordability",
            "opportunity cost",
            "personal finance",
            "fintech project",
          ],
        }}
      />
      <RentVsBuyClient />
    </>
  );
}
