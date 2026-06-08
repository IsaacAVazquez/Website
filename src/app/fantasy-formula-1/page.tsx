import { StructuredData } from "@/components/StructuredData";
import { formula1Snapshot } from "@/data/formula1Snapshot";
import { getFormula1Snapshot } from "@/lib/formula1Snapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { FantasyFormula1Client } from "./fantasy-formula-1-client";
import { normalizeFantasyFormula1State } from "./fantasy-formula-1-state";

export const metadata = constructMetadata({
  title: "Fantasy Formula 1 Optimizer",
  description:
    "Fantasy Formula 1 team optimizer that uses the checked-in OpenF1 season snapshot, model-based prices, and official-style roster constraints for practical lineup planning.",
  canonicalUrl: "/fantasy-formula-1",
  dateModified: formula1Snapshot.generatedAt.slice(0, 10),
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Interactive sports dashboards, fantasy tools, and data product UX",
    expertise: [
      "Next.js",
      "Fantasy sports tooling",
      "Formula 1 analytics",
      "Optimization UX",
      "Snapshot-driven interfaces",
    ],
    industry: ["Sports", "Media", "Analytics"],
    topics: ["Fantasy Formula 1", "Formula 1 optimizer", "F1 fantasy team builder"],
    contentType: "Software Application",
    context:
      "Standalone Fantasy Formula 1 project by Isaac Vazquez that turns a checked-in OpenF1 snapshot into a practical team optimizer.",
    summary:
      "Fantasy Formula 1 Optimizer helps users build five-driver, two-constructor lineups under a model budget using a transparent heuristic.",
    primaryFocus:
      "Fantasy sports decision support, lineup optimization, and snapshot-backed sports data UX",
  },
});

interface FantasyFormula1PageProps {
  searchParams: Promise<{
    view?: string;
    sort?: string;
    focus?: string;
  }>;
}

export default async function FantasyFormula1Page({
  searchParams,
}: FantasyFormula1PageProps) {
  const initialState = normalizeFantasyFormula1State(await searchParams);
  const snapshot = await getFormula1Snapshot();
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Fantasy Formula 1", url: "/fantasy-formula-1" },
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
          name: "Fantasy Formula 1 Optimizer",
          description:
            "Fantasy Formula 1 lineup optimizer with official-style roster constraints, model prices, and OpenF1 snapshot inputs.",
          url: "https://isaacavazquez.com/fantasy-formula-1",
          applicationCategory: "SportsApplication",
          operatingSystem: "Web browser",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Five-driver and two-constructor lineup builder",
            "Model-based asset prices and race-weekend projections",
            "Budget-aware optimizer with locked picks",
            "Local browser persistence by season",
          ],
          dateModified: snapshot.generatedAt,
        }}
      />
      <FantasyFormula1Client initialState={initialState} snapshot={snapshot} />
    </>
  );
}
