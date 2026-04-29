/* eslint-disable react-refresh/only-export-components */
import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { WineCellarClient } from "./wine-cellar-client";

export const metadata = constructMetadata({
  title: "Wine Cellar | Isaac Vazquez",
  description:
    "Personal wine reviewing app for logging tastings, rating bottles, and tracking the wines you've poured — saved locally in your browser.",
  canonicalUrl: "/wine-cellar",
  dateModified: "2026-04-28",
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Personal review apps, lightweight client-side tools, and editorial UX",
    expertise: [
      "Wine Reviewing",
      "Tasting Notes",
      "Personal Knowledge Apps",
      "Client-side Persistence",
      "Next.js",
    ],
    industry: ["Wine", "Hospitality", "Personal Knowledge Tools"],
    topics: [
      "Wine cellar tracking",
      "Tasting notes",
      "Bottle ratings",
      "Personal wine journal",
    ],
    contentType: "Software Application",
    context:
      "Standalone wine reviewing app built as a personal product project that demonstrates lightweight, browser-persisted journaling UX.",
    summary:
      "Wine cellar for logging tastings, rating bottles, and reviewing the wines you've poured.",
    primaryFocus:
      "Personal wine journaling, tasting note capture, and quick at-a-glance cellar stats",
  },
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
            "Personal wine reviewing app for logging tastings, rating bottles, and tracking your cellar — saved locally in your browser.",
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
