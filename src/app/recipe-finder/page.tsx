import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { RecipeFinderClient } from "./recipe-finder-client";

export const metadata = constructMetadata({
  title: "Recipe Finder",
  description:
    "Recipe aggregator and ingredient-based search. Add the ingredients you have on hand and surface recipes you can actually cook tonight, ranked by what you're missing.",
  canonicalUrl: "/recipe-finder",
  dateModified: "2026-04-29",
});

export default function RecipeFinderPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Recipe Finder", url: "/recipe-finder" },
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
          name: "Recipe Finder",
          description:
            "Ingredient-based recipe search. Add what's in your pantry; the tool ranks recipes by how many ingredients you already have.",
          url: "https://isaacavazquez.com/recipe-finder",
          applicationCategory: "LifestyleApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "recipe finder",
            "ingredient search",
            "pantry recipes",
            "what to cook",
            "recipe aggregator",
          ],
        }}
      />
      <RecipeFinderClient />
    </>
  );
}
