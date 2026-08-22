import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";

import { BestBallClient } from "./best-ball-client";
import { normalizeBestBallState } from "./best-ball-state";

export const metadata = constructMetadata({
  title: "Best Ball Rankings and Draft Strategy",
  description:
    "2026 best ball rankings, Underdog ADP, contest specific strategy, room-relative Draft Outlook, and expected return math for Best Ball Mania and related formats.",
  canonicalUrl: "/fantasy-football/best-ball",
  dateModified: "2026-08-22",
});

interface BestBallPageProps {
  searchParams: Promise<{
    contest?: string;
    position?: string;
    q?: string;
  }>;
}

export default async function BestBallPage({ searchParams }: BestBallPageProps) {
  const initialState = normalizeBestBallState(await searchParams);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Fantasy Football", url: "/fantasy-football" },
    { name: "Best Ball", url: "/fantasy-football/best-ball" },
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
        type="SportsApplication"
        data={{
          name: "Best Ball Rankings and Draft Assistant",
          description:
            "A sourced 2026 best ball rankings board with contest specific draft guidance and a manual draft tracker.",
          url: "/fantasy-football/best-ball",
          dateModified: "2026-08-22",
          applicationCategory: "SportsApplication",
          operatingSystem: "Web browser",
          featureList: [
            "Current Underdog ADP board",
            "PPR best ball consensus reference",
            "Published Underdog average draft position",
            "Best Ball Mania, Puppy, Eliminator, Weekly Winners, Sit and Go, and Superflex guidance",
            "Week 17 opponent context",
            "Linked manual draft assistant",
            "Room-relative Draft Outlook and expected return calculator",
          ],
        }}
      />
      <BestBallClient initialState={initialState} />
    </>
  );
}
