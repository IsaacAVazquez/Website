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
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Personal finance modeling, fintech product thinking, and decision-support UX",
    expertise: [
      "Rent vs. Buy Analysis",
      "Financial Modeling",
      "Opportunity Cost",
      "Mortgage Amortization",
      "Next.js",
    ],
    industry: ["Fintech", "Personal Finance", "Real Estate"],
    topics: [
      "Rent versus buy",
      "Break-even analysis",
      "Home affordability",
      "Net worth projection",
    ],
    contentType: "Software Application",
    context:
      "Standalone housing-decision tool built as a public product project that models the full net-worth tradeoff between renting and buying rather than just the monthly payment.",
    summary:
      "Rent-vs-buy calculator with a month-by-month net-worth model, opportunity-cost accounting, and a break-even year.",
    primaryFocus:
      "Housing decisions, opportunity cost, and transparent break-even analysis between renting and buying",
  },
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
