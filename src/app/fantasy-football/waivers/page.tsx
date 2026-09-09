import type { Metadata } from "next";
import ReactDOM from "react-dom";
import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { normalizeFantasyRouteScoring } from "@/lib/fantasy";
import { getNflRegularSeasonWeek } from "@/lib/fantasyUtils";
import { fantasySnapshotRevision } from "@/data/fantasySnapshotRevision.generated";
import {
  WeeklyBoardClient,
  type WeeklyRouteState,
} from "../weekly/weekly-client";

export const metadata: Metadata = constructMetadata({
  title: "Fantasy Football Waiver Targets",
  description:
    "In-season waiver adds where the weekly expert consensus rank runs ahead of how widely a player is rostered, with the rank, percentile, and rostered rate printed beside each gap.",
  canonicalUrl: "/fantasy-football/waivers",
  image: "/fantasy-football/waivers/opengraph-image",
  dateModified: fantasySnapshotRevision.slice(0, 10),
});

const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "Fantasy Football", url: "/fantasy-football" },
  { name: "Waivers", url: "/fantasy-football/waivers" },
];

interface WaiverTargetsPageProps {
  searchParams: Promise<{ scoring?: string }>;
}

export default async function WaiverTargetsPage({
  searchParams,
}: WaiverTargetsPageProps) {
  const params = await searchParams;
  // The waiver list spans the flex and quarterback boards, so the only route
  // state is scoring.
  const initialState: WeeklyRouteState = {
    scoring: normalizeFantasyRouteScoring(params.scoring),
    board: "flex",
  };
  // Same preload gate as the weekly board: nothing publishes before Week 1.
  if (getNflRegularSeasonWeek(new Date().getUTCFullYear()) > 0) {
    ReactDOM.preload(`/data/fantasy/weekly.json?v=${fantasySnapshotRevision}`, {
      as: "fetch",
    });
  }

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (
            generateBreadcrumbStructuredData(breadcrumbs) as {
              itemListElement: object[];
            }
          ).itemListElement,
        }}
      />
      <StructuredData
        type="SoftwareApplication"
        data={{
          name: "Fantasy Football Waiver Targets",
          description:
            "In-season waiver adds ranked by the gap between weekly consensus percentile and rostered percentage",
          url: "https://isaacvazquez.com/fantasy-football/waivers",
          applicationCategory: "Sports",
          operatingSystem: "Web Browser",
        }}
      />

      <WeeklyBoardClient initialState={initialState} view="waivers" />
    </>
  );
}
