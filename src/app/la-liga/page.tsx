import { StructuredData } from "@/components/StructuredData";
import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import {
  getLaLigaSummarySnapshot,
  getLaLigaTeamSnapshot,
} from "@/lib/laLigaSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { LaLigaClient } from "./la-liga-client";
import { normalizeLaLigaState } from "./la-liga-state";

export const metadata = constructMetadata({
  title: "La Liga Pulse",
  description:
    "Interactive La Liga dashboard with standings, title-race context, European qualification cutoffs, relegation pressure, and official snapshot leaderboards.",
  canonicalUrl: "/la-liga",
  image: "/la-liga/opengraph-image",
  dateModified: laLigaSnapshot.updatedAt,
});

interface LaLigaPageProps {
  searchParams: Promise<{
    view?: string;
    club?: string;
  }>;
}

export default async function LaLigaPage({ searchParams }: LaLigaPageProps) {
  const initialState = normalizeLaLigaState(await searchParams);
  const summary = await getLaLigaSummarySnapshot();
  const initialTeamSnapshot = await getLaLigaTeamSnapshot(initialState.club).catch(() => null);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "La Liga Pulse", url: "/la-liga" },
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
          name: "La Liga Pulse",
          description:
            "Interactive La Liga standings dashboard with title-race, European qualification, and relegation views backed by a curated official snapshot.",
          url: "https://isaacavazquez.com/la-liga",
          applicationCategory: "SportsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Competition-pressure filters for title race, Europe, and relegation",
            "Deep-linkable club selection and URL state",
            "Official snapshot standings and leaderboard context",
            "Fast local-first rendering without a live third-party runtime dependency",
          ],
          dateModified: laLigaSnapshot.updatedAt,
        }}
      />
      <LaLigaClient
        initialState={initialState}
        summary={summary}
        initialTeamSnapshot={initialTeamSnapshot}
      />
    </>
  );
}
