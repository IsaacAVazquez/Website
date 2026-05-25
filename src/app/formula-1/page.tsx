import { StructuredData } from "@/components/StructuredData";
import { formula1Snapshot } from "@/data/formula1Snapshot";
import { getFormula1Snapshot } from "@/lib/formula1Snapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { Formula1Client } from "./formula-1-client";
import { normalizeFormula1State } from "./formula-1-state";

export const metadata = constructMetadata({
  title: "Formula 1 Pulse",
  description:
    "Editorial Formula 1 dashboard for the current season with the next Grand Prix, driver and constructor standings, and race-by-race context from a checked-in OpenF1 snapshot.",
  canonicalUrl: "/formula-1",
  dateModified: formula1Snapshot.generatedAt.slice(0, 10),
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Interactive sports dashboards, snapshot-driven tooling, and exploratory data UX",
    expertise: [
      "Next.js",
      "Sports dashboard design",
      "Snapshot normalization",
      "Data product UX",
      "Deep-linkable state",
    ],
    industry: ["Sports", "Media", "Analytics"],
    topics: [
      "Formula 1 dashboard",
      "driver standings",
      "constructor standings",
      "Grand Prix calendar",
    ],
    contentType: "Software Application",
    context:
      "Standalone Formula 1 project by Isaac Vazquez that packages historical OpenF1 data into a fast, shareable season dashboard.",
    summary:
      "Formula 1 Pulse tracks the next Grand Prix, championship tables, and race-by-race context through a checked-in snapshot.",
    primaryFocus:
      "Snapshot-driven sports exploration, season-level dashboard UX, and fast route state sharing",
  },
});

interface Formula1PageProps {
  searchParams: Promise<{
    view?: string;
    meeting?: string;
  }>;
}

export default async function Formula1Page({ searchParams }: Formula1PageProps) {
  const initialState = normalizeFormula1State(await searchParams);
  const snapshot = await getFormula1Snapshot();
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Formula 1 Pulse", url: "/formula-1" },
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
          name: "Formula 1 Pulse",
          description:
            "Editorial Formula 1 dashboard with season standings, the next Grand Prix, and race-by-race context from a checked-in historical snapshot.",
          url: "https://isaacavazquez.com/formula-1",
          applicationCategory: "SportsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Current-season driver standings with last-race point gains",
            "Constructor standings with team-level movement",
            "Grand Prix calendar with schedules and classifications",
            "Snapshot-driven route that avoids a live runtime dependency",
          ],
          dateModified: snapshot.generatedAt,
        }}
      />
      <Formula1Client initialState={initialState} snapshot={snapshot} />
    </>
  );
}
