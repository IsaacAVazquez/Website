import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { FANTASY_FOOTBALL_FAQ } from "./fantasy-faq";
import { FantasyFootballClient } from "./fantasy-football-client";
import { normalizeFantasyState } from "./fantasy-state";

export const metadata = constructMetadata({
  title: "Fantasy Football Rankings",
  description:
    "Snapshot-backed fantasy football rankings with scoring toggles, a linked draft assistant, room-relative Draft Outlook, and an expected return calculator.",
  canonicalUrl: "/fantasy-football",
  dateModified: "2026-08-02",
});

interface FantasyFootballPageProps {
  searchParams: Promise<{
    position?: string;
    scoring?: string;
    view?: string;
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
            "Room-relative draft value and expected return calculator",
          ],
        }}
      />
      <StructuredData
        type="FAQPage"
        data={{
          questions: FANTASY_FOOTBALL_FAQ.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }}
      />
      <FantasyFootballClient initialState={initialState} />
    </>
  );
}
