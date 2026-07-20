import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { SpaceXMissionControlClient } from "./spacex-mission-control-client";
import { loadMissionControlInitialData } from "./spacex-mission-control-data";
import { normalizeMissionControlState } from "./spacex-mission-control-state";

export const metadata = constructMetadata({
  title: "SpaceX Mission Control",
  description:
    "Mission-control-style SpaceX launch board with next-launch visibility, past and upcoming mission browsing, and relationship-aware mission detail panels.",
  canonicalUrl: "/spacex-mission-control",
  image: "/spacex-mission-control/opengraph-image",
  dateModified: "2026-04-01",
});

interface SpaceXMissionControlPageProps {
  searchParams: Promise<{
    status?: string;
    launch?: string;
    panel?: string;
  }>;
}

export default async function SpaceXMissionControlPage({
  searchParams,
}: SpaceXMissionControlPageProps) {
  const initialState = normalizeMissionControlState(await searchParams);
  const initialData = await loadMissionControlInitialData(initialState);
  // eslint-disable-next-line react-hooks/purity -- Server component (async); Date.now() is evaluated once per request, not during a client render
  const renderedAtMs = Date.now();
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "SpaceX Mission Control", url: "/spacex-mission-control" },
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
        type="SoftwareApplication"
        data={{
          name: "SpaceX Mission Control",
          description:
            "Mission-control-style SpaceX launch board with a next-launch hero, deep-linked mission detail panels, and local API-backed data normalization.",
          url: "https://isaacavazquez.com/spacex-mission-control",
          applicationCategory: "WebApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Next-launch hero with precision-aware timing",
            "Upcoming and past launch board",
            "Deep-linkable mission detail rail",
            "Relationship-aware rocket, crew, payload, capsule, and pad data",
          ],
        }}
      />
      <SpaceXMissionControlClient
        initialState={initialState}
        initialData={initialData}
        renderedAtMs={renderedAtMs}
      />
    </>
  );
}
