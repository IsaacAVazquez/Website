import { StructuredData } from "@/components/StructuredData";
import { formula1Snapshot } from "@/data/formula1Snapshot";
import { getFormula1Meeting, getFormula1Summary } from "@/lib/formula1Snapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { Formula1Client } from "./formula-1-client";
import { normalizeFormula1State, resolveFormula1State } from "./formula-1-state";

export const metadata = constructMetadata({
  title: "Formula 1 Pulse",
  description:
    "Formula 1 dashboard for the current season with the next Grand Prix, driver and constructor standings, and race-by-race context from a checked-in OpenF1 snapshot.",
  canonicalUrl: "/formula-1",
  dateModified: formula1Snapshot.generatedAt.slice(0, 10),
});

interface Formula1PageProps {
  searchParams: Promise<{
    view?: string;
    meeting?: string;
  }>;
}

export default async function Formula1Page({ searchParams }: Formula1PageProps) {
  const initialState = normalizeFormula1State(await searchParams);
  const summary = await getFormula1Summary();
  // Seed the initially selected meeting server-side so a direct or deep-linked
  // load paints its full detail without a client fetch.
  const resolvedState = resolveFormula1State(initialState, summary);
  const initialMeeting = resolvedState.meeting
    ? await getFormula1Meeting(resolvedState.meeting).catch(() => null)
    : null;
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
            "Formula 1 dashboard with season standings, the next Grand Prix, and race-by-race context from a checked-in historical snapshot.",
          url: "https://isaacavazquez.com/formula-1",
          applicationCategory: "SportsApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Current-season driver standings with last-race point gains",
            "Constructor standings with team-level movement",
            "Grand Prix calendar with schedules and classifications",
            "Snapshot-driven route that avoids a live runtime dependency",
          ],
          dateModified: summary.generatedAt,
        }}
      />
      <Formula1Client
        initialState={initialState}
        summary={summary}
        initialMeeting={initialMeeting}
      />
    </>
  );
}
