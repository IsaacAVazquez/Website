import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { TravelPlannerClient } from "./travel-planner-client";

export const metadata = constructMetadata({
  title: "Travel Planner",
  description:
    "Plan trips, track day-by-day itineraries with planned costs, export the itinerary to a calendar, and journal as you go. Browser-persisted, no account required.",
  canonicalUrl: "/travel",
  dateModified: "2026-10-22",
});

export default function TravelPlannerPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Travel Planner", url: "/travel" },
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
          name: "Travel Planner",
          description:
            "Browser-persisted travel planner for trip dates, day-by-day itineraries, planned costs, a calendar export, and trip journaling.",
          url: "https://isaacvazquez.com/travel",
          applicationCategory: "TravelApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "travel planner",
            "trip itinerary",
            "travel journal",
            "vacation planning",
            "trip tracker",
          ],
        }}
      />
      <TravelPlannerClient />
    </>
  );
}
