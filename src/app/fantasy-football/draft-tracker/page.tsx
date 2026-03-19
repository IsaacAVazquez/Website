import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { DraftTrackerClient } from "./draft-tracker-client";

export const metadata: Metadata = constructMetadata({
  title: "Fantasy Football Draft Assistant | Isaac Vazquez",
  description:
    "Manual fantasy football draft assistant with snake-order tracking, local persistence, and the same published snapshot board used on the public rankings page.",
  canonicalUrl: "/fantasy-football/draft-tracker",
  dateModified: "2026-03-18",
});

export default function DraftTrackerPage() {
  return (
    <>
      <StructuredData 
        type="WebApplication" 
        data={{
          name: "Fantasy Football Draft Assistant",
          description: "Manual fantasy football draft tracker with best-available rankings and snake-order awareness",
          url: "https://isaacavazquez.com/fantasy-football/draft-tracker",
          applicationCategory: "Sports",
          operatingSystem: "Web Browser",
        }}
      />
      
      <DraftTrackerClient />
    </>
  );
}
