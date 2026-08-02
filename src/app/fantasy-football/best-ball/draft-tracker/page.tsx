import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { BestBallDraftTrackerClient } from "./draft-tracker-client";

export const metadata: Metadata = constructMetadata({
  title: "Best Ball Draft Assistant",
  description:
    "A manual best ball draft tracker with contest specific roster targets, a room-relative Draft Outlook, Best Ball Mania field economics, and expected return math.",
  canonicalUrl: "/fantasy-football/best-ball/draft-tracker",
  dateModified: "2026-08-02",
});

const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "Fantasy Football", url: "/fantasy-football" },
  { name: "Best Ball", url: "/fantasy-football/best-ball" },
  { name: "Draft Assistant", url: "/fantasy-football/best-ball/draft-tracker" },
];

export default async function BestBallDraftTrackerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedContest = Array.isArray(params.contest) ? params.contest[0] : params.contest;

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
          name: "Best Ball Draft Assistant",
          description:
            "Manual best ball room tracker with contest specific recommendations, roster construction signals, draft value, and expected return math",
          url: "https://isaacvazquez.com/fantasy-football/best-ball/draft-tracker",
          applicationCategory: "Sports",
          operatingSystem: "Web Browser",
        }}
      />
      <BestBallDraftTrackerClient initialContest={requestedContest} />
    </>
  );
}
