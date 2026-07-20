import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { WineCellarClient } from "./wine-cellar-client";

export const metadata = constructMetadata({
  title: "Wine Cellar",
  description:
    "Personal wine reviewing app for logging tastings, rating bottles, and tracking the wines you've poured. Saved locally in your browser.",
  canonicalUrl: "/wine-cellar",
  dateModified: "2026-04-28",
});

export default function WineCellarPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Wine Cellar", url: "/wine-cellar" },
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
          name: "Wine Cellar",
          description:
            "Personal wine reviewing app for logging tastings, rating bottles, and tracking your cellar. Saved locally in your browser.",
          url: "https://isaacavazquez.com/wine-cellar",
          applicationCategory: "LifestyleApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "wine reviewing app",
            "wine cellar",
            "tasting notes",
            "wine journal",
            "personal wine tracker",
          ],
        }}
      />
      <WineCellarClient />
    </>
  );
}
