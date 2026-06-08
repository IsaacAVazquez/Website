import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { FoodMapClient } from "./food-map-client";
import { normalizeFoodMapState } from "./food-map-state";

export const metadata = constructMetadata({
  title: "Food Map",
  description:
    "A curated, deep-linkable map of where to eat across Austin, San Francisco, New York, New Orleans, LA, and Tokyo — filterable by city, curator (Anthony Bourdain, Isaac's picks, top-rated on Google), and cuisine.",
  canonicalUrl: "/food-map",
  dateModified: "2026-06-08",
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Editorial product surfaces, deep-linkable filtering, and curated city guides",
    expertise: [
      "Next.js",
      "Editorial UI",
      "Deep-linkable state",
      "Curated content design",
    ],
    industry: ["Food & Beverage", "Travel", "Local Guides"],
    topics: [
      "where to eat",
      "curated food map",
      "anthony bourdain restaurants",
      "multi-city restaurant guide",
    ],
    contentType: "Software Application",
    context:
      "Standalone food map by Isaac Vazquez: a curator-driven, multi-city restaurant guide on an interactive map.",
    summary:
      "Curator-driven restaurant map across six cities with city, curator, and cuisine filters and a shareable URL state.",
    primaryFocus:
      "Curated city guides, editorial product UX, and deep-linkable filtering models",
  },
});

interface FoodMapPageProps {
  searchParams: Promise<{
    city?: string;
    curator?: string;
    cuisine?: string;
    pick?: string;
  }>;
}

export default async function FoodMapPage({ searchParams }: FoodMapPageProps) {
  const initialState = normalizeFoodMapState(await searchParams);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Food Map", url: "/food-map" },
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
          name: "Food Map",
          description:
            "Curator-driven restaurant map across Austin, San Francisco, New York, New Orleans, LA, and Tokyo with city, curator, and cuisine filters and a shareable URL state.",
          url: "https://isaacavazquez.com/food-map",
          applicationCategory: "LifestyleApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "where to eat",
            "curated food map",
            "anthony bourdain restaurants",
            "deep-linkable filters",
          ],
        }}
      />
      <FoodMapClient initialState={initialState} />
    </>
  );
}
