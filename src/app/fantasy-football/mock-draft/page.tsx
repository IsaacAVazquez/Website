import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { MockDraftClient } from "./mock-draft-client";

export const metadata: Metadata = constructMetadata({
  title: "Fantasy Football Mock Draft Simulator",
  description:
    "Practice one-QB snake drafts against simulated opponents who pick from the published consensus board and market ADP, with visible source dates.",
  canonicalUrl: "/fantasy-football/mock-draft",
  dateModified: "2026-08-18",
});

const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "Fantasy Football", url: "/fantasy-football" },
  { name: "Mock Draft", url: "/fantasy-football/mock-draft" },
];

export default function MockDraftPage() {
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
          name: "Fantasy Football Mock Draft Simulator",
          description:
            "A practice draft room against simulated opponents built on the published consensus board and mock-draft ADP",
          url: "https://isaacvazquez.com/fantasy-football/mock-draft",
          applicationCategory: "Sports",
          operatingSystem: "Web Browser",
        }}
      />

      <MockDraftClient />
    </>
  );
}
