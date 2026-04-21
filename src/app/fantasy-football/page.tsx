import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { FantasyFootballClient } from "./fantasy-football-client";
import { normalizeFantasyState } from "./fantasy-state";

export const metadata = constructMetadata({
  title: "Fantasy Football Rankings | Isaac Vazquez",
  description:
    "Snapshot-backed fantasy football rankings sourced from FantasyPros public consensus pages, with freshness metadata, scoring toggles, and a linked draft assistant.",
  canonicalUrl: "/fantasy-football",
  dateModified: "2026-04-15",
});

interface FantasyFootballPageProps {
  searchParams: Promise<{
    position?: string;
    scoring?: string;
  }>;
}

export default async function FantasyFootballPage({ searchParams }: FantasyFootballPageProps) {
  const initialState = normalizeFantasyState(await searchParams);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Fantasy Football", url: "/fantasy-football" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as { itemListElement: object[] }).itemListElement,
        }}
      />
      <StructuredData
        type="SportsApplication"
        data={{
          name: "Fantasy Football Rankings",
          description:
            "Published fantasy football rankings and draft assistant with sourced overall and position boards.",
          applicationCategory: "SportsApplication",
          operatingSystem: "Web browser",
          featureList: [
            "Overall and position-specific rankings",
            "PPR, Half PPR, and Standard scoring",
            "Published snapshot timestamps",
            "Manual draft tracker with local persistence",
          ],
        }}
      />
      <StructuredData
        type="FAQPage"
        data={{
          questions: [
            {
              "@type": "Question",
              name: "How often are the fantasy rankings updated?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "The public rankings show both when FantasyPros last updated the consensus board and when this repo rebuilt the published snapshot.",
              },
            },
            {
              "@type": "Question",
              name: "Can I view overall and position-only rankings?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. The board supports overall plus published position-specific views, and any unsupported scoring-position combinations are labeled as unavailable instead of showing derived fallback data.",
              },
            },
            {
              "@type": "Question",
              name: "Does the draft tracker use the same rankings data?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. The draft tracker reads the same published snapshot data as the public rankings board so the two surfaces stay aligned.",
              },
            },
          ],
        }}
      />
      <FantasyFootballClient initialState={initialState} />
    </>
  );
}
