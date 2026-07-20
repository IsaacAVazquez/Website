import { StructuredData } from "@/components/StructuredData";
import { earthquakeSnapshot } from "@/data/earthquakeSnapshot";
import { getEarthquakeSummary } from "@/lib/earthquakeSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { EarthquakeClient } from "./earthquake-client";
import { normalizeEarthquakeState } from "./earthquake-state";

export const metadata = constructMetadata({
  title: "Earthquake Pulse",
  description:
    "Frequently refreshed global earthquake monitor covering the past 24 hours of seismic activity, significant quakes worldwide, magnitude distribution, and the busiest regions.",
  canonicalUrl: "/earthquake-pulse",
  dateModified: earthquakeSnapshot.summary.generatedAt?.slice(0, 10),
  aiMetadata: {
    profession: "Product Manager",
    specialty:
      "Data dashboards, deep-linkable product surfaces, and snapshot-backed analytics UX",
    expertise: [
      "Next.js",
      "Data dashboard design",
      "Geospatial data UX",
      "Snapshot-driven applications",
      "Deep-linkable state",
    ],
    industry: ["Science", "Media", "Analytics"],
    topics: [
      "earthquake monitoring",
      "USGS seismic data",
      "magnitude distribution",
      "global seismic activity",
    ],
    contentType: "Software Application",
    context:
      "Standalone earthquake dashboard by Isaac Vazquez that refreshes from USGS and retains a checked-in last-good fallback.",
    summary:
      "Global earthquake monitor for the past 24 hours, significant worldwide quakes, and regional activity.",
    primaryFocus:
      "Live seismic context, magnitude distribution, and mobile-friendly data product UX",
  },
});

interface EarthquakePageProps {
  searchParams: Promise<{
    view?: string;
    quake?: string;
  }>;
}

export default async function EarthquakePulsePage({
  searchParams,
}: EarthquakePageProps) {
  const initialState = normalizeEarthquakeState(await searchParams);
  const summary = await getEarthquakeSummary();
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Earthquake Pulse", url: "/earthquake-pulse" },
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
          name: "Earthquake Pulse",
          description:
            "Frequently refreshed global earthquake monitor for the past 24 hours of seismic activity, significant quakes worldwide, and regional breakdowns.",
          url: "https://isaacavazquez.com/earthquake-pulse",
          applicationCategory: "ReferenceApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Recent and significant earthquake views backed by shareable URL state",
            "Selected-quake detail with depth, felt reports, and tsunami flags",
            "Magnitude distribution and busiest-region breakdowns over the past week",
            "Checked-in last-good fallback when USGS is unavailable",
          ],
          dateModified: earthquakeSnapshot.summary.generatedAt ?? "",
        }}
      />
      <EarthquakeClient initialState={initialState} summary={summary} />
    </>
  );
}
