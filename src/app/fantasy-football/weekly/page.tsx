import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { fantasySnapshotRevision } from "@/data/fantasySnapshotRevision.generated";
import { WeeklyBoardClient } from "./weekly-client";

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

export default function WeeklyBoardPage() {
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

      <WeeklyBoardClient />
    </>
  );
}
