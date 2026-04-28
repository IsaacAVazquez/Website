import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { FoodMapClient } from "./food-map-client";
import { normalizeFoodMapState } from "./food-map-state";

export const metadata = constructMetadata({
  title: "Food Map | Isaac Vazquez",
  description:
    "A curated, deep-linkable map of the Austin restaurants I send people to first, filterable by neighborhood, cuisine, and meal.",
  canonicalUrl: "/food-map",
  dateModified: "2026-04-28",
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
      "austin restaurants",
      "austin food map",
      "curated city guide",
      "neighborhood food map",
    ],
    contentType: "Software Application",
    context:
      "Standalone food map by Isaac Vazquez that turns a personal Austin shortlist into a deep-linkable product surface.",
    summary:
      "Curated Austin restaurant map with neighborhood, cuisine, and meal filters and a shareable URL state.",
    primaryFocus:
      "Curated city guides, editorial product UX, and deep-linkable filtering models",
  },
});

interface FoodMapPageProps {
  searchParams: Promise<{
    neighborhood?: string;
    cuisine?: string;
    meal?: string;
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
            "Curated Austin restaurant map with neighborhood, cuisine, and meal filters and a shareable URL state.",
          url: "https://isaacavazquez.com/food-map",
          applicationCategory: "LifestyleApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "austin food map",
            "austin restaurants",
            "curated guide",
            "deep-linkable filters",
          ],
        }}
      />
      <FoodMapClient initialState={initialState} />
    </>
  );
}
