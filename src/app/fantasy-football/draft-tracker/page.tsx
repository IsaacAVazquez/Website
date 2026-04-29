import { Metadata } from "next";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { DraftTrackerClient } from "./draft-tracker-client";

export const metadata: Metadata = constructMetadata({
  title: "Fantasy Football Draft Assistant",
  description:
    "Manual fantasy football draft assistant with snake-order tracking, local persistence, roster-pressure cues, and the same published snapshot board used on the public rankings page.",
  canonicalUrl: "/fantasy-football/draft-tracker",
  dateModified: "2026-04-21",
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
          description: "Manual fantasy football draft tracker with sourced best-available rankings and snake-order awareness",
          url: "https://isaacavazquez.com/fantasy-football/draft-tracker",
          applicationCategory: "Sports",
          operatingSystem: "Web Browser",
        }}
      />

      <DraftTrackerClient />
    </>
  );
}
