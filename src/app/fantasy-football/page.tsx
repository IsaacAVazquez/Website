import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { FantasyFootballClient } from "./fantasy-football-client";
import { normalizeFantasyState } from "./fantasy-state";

export const metadata = constructMetadata({
  title: "Fantasy Football Rankings | Isaac Vazquez",
  description:
    "Snapshot-backed fantasy football rankings with overall and position boards, scoring toggles, search, and a linked draft assistant.",
  canonicalUrl: "/fantasy-football",
  dateModified: "2026-03-18",
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
            "Published fantasy football rankings and draft assistant with snapshot-backed overall and position boards.",
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
                text: "The public rankings use published snapshots, so the update time shown on the page is the source of truth for freshness.",
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
