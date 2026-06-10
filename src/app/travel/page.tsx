import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { TravelPlannerClient } from "./travel-planner-client";

export const metadata = constructMetadata({
  title: "Travel Planner",
  description:
    "Plan trips, track day-by-day itineraries, and journal as you go. Browser-persisted, no account required.",
  canonicalUrl: "/travel",
  dateModified: "2026-05-04",
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Travel planning UX, itinerary tracking, and trip journaling",
    expertise: [
      "Trip Planning",
      "Itinerary Management",
      "Travel Journaling",
      "Client-side Persistence",
      "Next.js",
    ],
    industry: ["Travel", "Personal Productivity", "Product Management"],
    topics: [
      "Trip planning",
      "Itinerary tracking",
      "Travel journaling",
      "Browser-persisted travel notes",
    ],
    contentType: "Software Application",
    context:
      "Standalone travel planner tool that lets you draft trips, lay out a day-by-day itinerary, check off stops, and keep a per-trip journal. State is saved in your browser.",
    summary:
      "Travel planner for trip dates, day-by-day activities, and per-day journal entries.",
    primaryFocus:
      "Trip planning, itinerary tracking, and reflective travel journaling",
  },
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
            "Browser-persisted travel planner for trip dates, day-by-day itineraries, and trip journaling.",
          url: "https://isaacavazquez.com/travel",
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
