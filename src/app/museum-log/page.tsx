import { StructuredData } from "@/components/StructuredData";
import { museumSnapshot } from "@/data/museumSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { MuseumLogClient } from "./museum-log-client";
import { normalizeMuseumState } from "./museum-log-state";

/** The day the page's own design last changed; a later snapshot refresh moves the date past it. */
const REDESIGNED_ON = "2026-10-12";

/** The later of two ISO day keys, which compare as strings. */
function latestDate(a: string, b: string) {
  return a > b ? a : b;
}

export const metadata = constructMetadata({
  title: "Museum Log | A Letterboxd for museums",
  description:
    "A Letterboxd-style museum tracker. Browse a curated catalog, read curator reviews, save museums to your watchlist, and log visits with personal ratings.",
  canonicalUrl: "/museum-log",
  dateModified: latestDate(museumSnapshot.generatedAt.slice(0, 10), REDESIGNED_ON),
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
          url: "https://isaacvazquez.com/museum-log",
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
