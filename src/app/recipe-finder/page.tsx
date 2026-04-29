/* eslint-disable react-refresh/only-export-components */
import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { RecipeFinderClient } from "./recipe-finder-client";

export const metadata = constructMetadata({
  title: "Recipe Finder | Isaac Vazquez",
  description:
    "Recipe aggregator and ingredient-based search. Add the ingredients you have on hand and surface recipes you can actually cook tonight, ranked by what you're missing.",
  canonicalUrl: "/recipe-finder",
  dateModified: "2026-04-29",
  aiMetadata: {
    profession: "Product Manager",
    specialty:
      "Pantry-aware recipe search, ingredient-driven discovery, and lightweight client-side scoring",
    expertise: [
      "Recipe Search",
      "Ingredient Matching",
      "Client-side Persistence",
      "Search UX",
      "Next.js",
    ],
    industry: ["Food", "Consumer", "Product Management"],
    topics: [
      "Recipe aggregator",
      "Ingredient-based recipe search",
      "Pantry tracking",
      "Cook with what you have",
    ],
    contentType: "Software Application",
    context:
      "Standalone tool that lets a user enter ingredients in their pantry and ranks recipes by how many of those ingredients they cover. Curated recipe corpus, no external API at runtime.",
    summary:
      "Type in the ingredients you have on hand and see which recipes you can cook, ordered by best match.",
    primaryFocus:
      "Ingredient-based recipe discovery, pantry-aware ranking, and quick weeknight cooking decisions",
  },
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
