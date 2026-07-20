import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { TravelDealLabClient } from "./travel-deal-lab-client";

export const metadata = constructMetadata({
  title: "Travel Deal Lab",
  description:
    "Optimize a trip's cost without the busywork. Get booking-window timing, a fare deal-score, a cash-vs-points check, a budget split, and the playbook and tools for finding deals on flights and hotels. Browser-persisted, no account required.",
  canonicalUrl: "/travel-deals",
  dateModified: "2026-07-07",
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
