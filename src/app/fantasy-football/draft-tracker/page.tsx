import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { DraftTrackerClient } from "./draft-tracker-client";

export const metadata: Metadata = constructMetadata({
  title: "Fantasy Football Draft Tracker - Live Draft Analytics & Tools",
  description: "Track your fantasy football draft live with tier-based analytics, player rankings, and real-time decision support. Create, manage, and analyze your draft picks with advanced data insights.",
  canonicalUrl: "https://isaacavazquez.com/fantasy-football/draft-tracker",
});

export default function DraftTrackerPage() {
  return (
    <>
      <StructuredData 
        type="WebApplication" 
        data={{
          name: "Fantasy Football Draft Tracker",
          description: "Interactive fantasy football draft tracking tool with analytics and real-time insights",
          url: "https://isaacavazquez.com/fantasy-football/draft-tracker",
          applicationCategory: "Sports",
          operatingSystem: "Web Browser",
        }}
      />
      
      <DraftTrackerClient />
    </>
  );
}