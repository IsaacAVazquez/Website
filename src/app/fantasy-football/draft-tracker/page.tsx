import { Metadata } from "next";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { fantasySnapshotRevision } from "@/data/fantasySnapshotRevision.generated";
import { StructuredData } from "@/components/StructuredData";
import { DraftTrackerClient } from "./draft-tracker-client";

export const metadata: Metadata = constructMetadata({
  title: "Fantasy Football Draft Assistant",
  description:
    "Manual fantasy football draft assistant with snake-order tracking, roster pressure, a room-relative Draft Outlook, and an expected return calculator.",
  canonicalUrl: "/fantasy-football/draft-tracker",
  image: "/fantasy-football/draft-tracker/opengraph-image",
  dateModified: fantasySnapshotRevision.slice(0, 10),
});

const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "Fantasy Football", url: "/fantasy-football" },
  { name: "Draft Assistant", url: "/fantasy-football/draft-tracker" },
];

export default function DraftTrackerPage() {
  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as { itemListElement: object[] }).itemListElement,
        }}
      />
      <StructuredData
        type="SoftwareApplication"
        data={{
          name: "Fantasy Football Draft Assistant",
          description: "Manual fantasy football draft tracker with sourced rankings, snake-order awareness, room-relative draft value, and expected return math",
          url: "https://isaacvazquez.com/fantasy-football/draft-tracker",
          applicationCategory: "Sports",
          operatingSystem: "Web Browser",
        }}
      />

      <DraftTrackerClient />
    </>
  );
}
