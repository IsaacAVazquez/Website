import { StructuredData } from "@/components/StructuredData";
import { bayAreaTransitSnapshot } from "@/data/bayAreaTransitSnapshot";
import {
  getTransitStationBoard,
  getTransitSummary,
} from "@/lib/bayAreaTransitSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { BayAreaTransitClient } from "./bay-area-transit-client";
import { normalizeTransitState } from "./bay-area-transit-state";

export const metadata = constructMetadata({
  title: "Bay Area Transit Pulse",
  description:
    "BART dashboard for the Bay Area with a stable line directory, frequently refreshed departure boards, and active service alerts in one calm screen.",
  canonicalUrl: "/bay-area-transit",
  image: "/bay-area-transit/opengraph-image",
  dateModified: bayAreaTransitSnapshot.summary.system?.generatedAt?.slice(0, 10),
});

interface TransitPageProps {
  searchParams: Promise<{
    view?: string;
    station?: string;
  }>;
}

export default async function BayAreaTransitPage({
  searchParams,
}: TransitPageProps) {
  const initialState = normalizeTransitState(await searchParams);
  const summary = await getTransitSummary();
  const defaultStation = summary.defaultStation;
  const validStationIds = new Set(
    summary.stations.map((station) => station.id)
  );
  const selectedStationId = validStationIds.has(initialState.station ?? "")
    ? initialState.station
    : defaultStation;
  const initialStationBoard = selectedStationId
    ? await getTransitStationBoard(selectedStationId).catch(() => null)
    : null;
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Bay Area Transit Pulse", url: "/bay-area-transit" },
  ];

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
          name: "Bay Area Transit Pulse",
          description:
            "BART dashboard for Bay Area lines, frequently refreshed station departures, and service alerts.",
          url: "https://isaacavazquez.com/bay-area-transit",
          applicationCategory: "TravelApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Line directory with official BART colors and end-to-end routes",
            "Per-station departure boards backed by shareable URL state",
            "Active service alerts and elevator outages",
            "Last-good snapshot fallback when a BART feed is unavailable",
          ],
          dateModified: bayAreaTransitSnapshot.summary.system?.generatedAt ?? "",
        }}
      />
      <BayAreaTransitClient
        initialState={initialState}
        summary={summary}
        initialStationBoard={initialStationBoard}
      />
    </>
  );
}
