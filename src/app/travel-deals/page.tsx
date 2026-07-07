import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { TravelDealLabClient } from "./travel-deal-lab-client";

export const metadata = constructMetadata({
  title: "Travel Deal Lab",
  description:
    "Optimize a trip's cost without the busywork. Get booking-window timing, a fare deal-score, a cash-vs-points check, a budget split, and the playbook and tools for finding deals on flights and hotels. Browser-persisted, no account required.",
  canonicalUrl: "/travel-deals",
  dateModified: "2026-07-07",
  aiMetadata: {
    profession: "Product Manager",
    specialty:
      "Travel cost optimization, fare and award valuation, and booking-window timing",
    expertise: [
      "Travel Deal Finding",
      "Fare Analysis",
      "Points and Miles Valuation",
      "Trip Budgeting",
      "Next.js",
    ],
    industry: ["Travel", "Personal Finance", "Product Management"],
    topics: [
      "How to find travel deals",
      "When to book flights",
      "Cheap flight strategy",
      "Hotel deal finding",
      "Points and miles redemption value",
      "Trip budget planning",
    ],
    contentType: "Software Application",
    context:
      "Standalone travel optimization tool. Enter a trip's region, dates, length, party size, and budget to get booking-window guidance, a fare deal-score against a typical band, a cash-vs-points valuation, and a suggested budget split, plus a curated playbook of deal-finding tactics and recommended search tools. Fare bands are curated editorial estimates, not live prices, and state is saved in the browser.",
    summary:
      "Figure out when to book, whether a fare or award is a good deal, how to split a budget, and which tactics and tools to use to find deals on flights and hotels.",
    primaryFocus:
      "Travel deal finding, fare and points valuation, booking timing, and trip budgeting",
  },
});

export default function TravelDealLabPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Travel Deal Lab", url: "/travel-deals" },
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
          name: "Travel Deal Lab",
          description:
            "Travel cost optimizer: booking-window timing, fare deal-scoring, cash-vs-points valuation, budget split, and a curated deal-finding playbook and toolkit.",
          url: "https://isaacavazquez.com/travel-deals",
          applicationCategory: "TravelApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "travel deals",
            "how to find flight deals",
            "when to book flights",
            "hotel deals",
            "points and miles value",
            "trip budget planner",
          ],
        }}
      />
      <TravelDealLabClient />
    </>
  );
}
