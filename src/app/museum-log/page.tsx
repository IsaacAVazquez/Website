import { StructuredData } from "@/components/StructuredData";
import { museumSnapshot } from "@/data/museumSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { MuseumLogClient } from "./museum-log-client";
import { normalizeMuseumState } from "./museum-log-state";

export const metadata = constructMetadata({
  title: "Museum Log | A Letterboxd for museums",
  description:
    "A Letterboxd-style museum tracker. Browse a curated catalog, read curator reviews, save museums to your watchlist, and log visits with personal ratings.",
  canonicalUrl: "/museum-log",
  dateModified: museumSnapshot.generatedAt.slice(0, 10),
});

interface MuseumLogPageProps {
  searchParams: Promise<{
    view?: string;
    museum?: string;
    list?: string;
    sort?: string;
    type?: string;
    region?: string;
  }>;
}

export default async function MuseumLogPage({ searchParams }: MuseumLogPageProps) {
  const initialState = normalizeMuseumState(await searchParams);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Museum Log", url: "/museum-log" },
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
          name: "Museum Log",
          description:
            "A Letterboxd-style museum tracker with a curated catalog, curator reviews, themed lists, and a personal visit log and watchlist.",
          url: "https://isaacavazquez.com/museum-log",
          applicationCategory: "LifestyleApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Curated catalog of museums with type and region filters",
            "Curator reviews with star ratings, tags, and exhibit notes",
            "Curator visit log timeline",
            "Themed lists (e.g. essentials, free museums, great buildings)",
            "Personal watchlist, likes, and visit log saved to localStorage",
            "Deep-linkable views, museum details, and lists",
          ],
        }}
      />
      <MuseumLogClient initialState={initialState} snapshot={museumSnapshot} />
    </>
  );
}
