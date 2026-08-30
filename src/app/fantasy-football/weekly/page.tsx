import type { Metadata } from "next";
import ReactDOM from "react-dom";
import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { normalizeFantasyRouteScoring } from "@/lib/fantasy";
import { getNflRegularSeasonWeek } from "@/lib/fantasyUtils";
import { fantasySnapshotRevision } from "@/data/fantasySnapshotRevision.generated";
import { WeeklyBoardClient, type WeeklyRouteState } from "./weekly-client";

export const metadata: Metadata = constructMetadata({
  title: "Fantasy Football Weekly Rankings and Waiver Targets",
  description:
    "In-season weekly consensus rankings for flex and quarterback, plus the waiver adds where expert rank runs ahead of how widely a player is rostered.",
  canonicalUrl: "/fantasy-football/weekly",
  image: "/fantasy-football/weekly/opengraph-image",
  dateModified: fantasySnapshotRevision.slice(0, 10),
});

const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "Fantasy Football", url: "/fantasy-football" },
  { name: "Weekly", url: "/fantasy-football/weekly" },
];

interface WeeklyBoardPageProps {
  searchParams: Promise<{
    scoring?: string;
    board?: string;
  }>;
}

export default async function WeeklyBoardPage({ searchParams }: WeeklyBoardPageProps) {
  const params = await searchParams;
  // Kept in step with normalizeWeeklyBoard in weekly-client.tsx. The helper
  // cannot be shared from there because every export of a "use client" module
  // becomes a client reference, which a server component cannot call.
  const initialState: WeeklyRouteState = {
    scoring: normalizeFantasyRouteScoring(params.scoring),
    board: params.board === "quarterbacks" ? "quarterbacks" : "flex",
  };
  // The board's fetch cannot start until the client bundle has downloaded and
  // hydrated, so the critical path ran HTML, then JS, then JSON in series. This
  // URL matches useFantasyWeeklySnapshot's request exactly, so the in-flight
  // preload is reused rather than duplicated.
  // The builder publishes nothing before Week 1, so preloading earlier only
  // adds a guaranteed 404 to every visit. Calendar year is the right season
  // here: in January the board is finished and the preload is not worth it.
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
          items: (generateBreadcrumbStructuredData(breadcrumbs) as { itemListElement: object[] })
            .itemListElement,
        }}
      />
      <StructuredData
        type="SoftwareApplication"
        data={{
          name: "Fantasy Football Weekly Rankings and Waiver Targets",
          description:
            "In-season weekly flex and quarterback consensus rankings with a rank-versus-rostered waiver list",
          url: "https://isaacvazquez.com/fantasy-football/weekly",
          applicationCategory: "Sports",
          operatingSystem: "Web Browser",
        }}
      />

      <WeeklyBoardClient initialState={initialState} />
    </>
  );
}
