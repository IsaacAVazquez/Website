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
    "Snapshot-backed BART dashboard for the Bay Area, with lines and colors, live-style departure boards by station, and active service alerts in one calm screen.",
  canonicalUrl: "/bay-area-transit",
  image: "/bay-area-transit/opengraph-image",
  dateModified: bayAreaTransitSnapshot.summary.system?.generatedAt?.slice(0, 10),
  aiMetadata: {
    profession: "Product Manager",
    specialty:
      "Civic dashboards, deep-linkable product surfaces, and snapshot-backed analytics UX",
    expertise: [
      "Next.js",
      "Transit dashboard design",
      "Bay Area / BART data",
      "Snapshot-driven applications",
      "Deep-linkable state",
    ],
    industry: ["Transportation", "Civic Tech", "Analytics"],
    topics: [
      "BART departures",
      "Bay Area transit",
      "service alerts",
      "rail line map",
    ],
    contentType: "Software Application",
    context:
      "Standalone Bay Area transit dashboard by Isaac Vazquez that packages a checked-in BART snapshot into a clean, shareable product surface.",
    summary:
      "Bay Area BART dashboard for scanning lines, station departures, and service alerts.",
    primaryFocus:
      "Snapshot-backed transit context, station-level departures, and mobile-friendly civic product UX",
  },
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
            "Snapshot-backed BART dashboard for Bay Area lines, station departures, and service alerts.",
          url: "https://isaacavazquez.com/bay-area-transit",
          applicationCategory: "TravelApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Line directory with official BART colors and end-to-end routes",
            "Per-station departure boards backed by shareable URL state",
            "Active service alerts and elevator outages",
            "Local snapshot rendering without a live third-party runtime dependency",
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
