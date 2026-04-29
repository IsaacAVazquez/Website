import { StructuredData } from "@/components/StructuredData";
import { frontierModelsSnapshot } from "@/data/frontierModelsSnapshot";
import { getFrontierModelsSnapshot } from "@/lib/frontierModelsSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { FrontierModelsClient } from "./frontier-models-client";
import { normalizeFrontierModelsState } from "./frontier-models-state";

// eslint-disable-next-line react-refresh/only-export-components -- Next.js route modules export metadata alongside the page component.
export const metadata = constructMetadata({
  title: "Frontier Model Tracker",
  description:
    "Curated tracker of frontier large language models with context windows, pricing, modality coverage, and editorial notes — built for product teams sizing the AI tier-collapse landscape.",
  canonicalUrl: "/frontier-models",
  dateModified: frontierModelsSnapshot.generatedAt.slice(0, 10),
  aiMetadata: {
    profession: "Product Manager",
    specialty:
      "Editorial AI tooling dashboards, model economics, and decision-ready market trackers",
    expertise: [
      "Large language models",
      "Model economics",
      "Pricing analysis",
      "Snapshot-driven dashboards",
      "Deep-linkable state",
    ],
    industry: ["Artificial Intelligence", "Developer Tools", "Software"],
    topics: [
      "Frontier model tracker",
      "LLM pricing",
      "Context windows",
      "Reasoning models",
      "Model selection",
    ],
    contentType: "Software Application",
    context:
      "Standalone Frontier Model Tracker by Isaac Vazquez that curates leading LLM specs into a fast, shareable comparison surface.",
    summary:
      "Frontier Model Tracker compares leading large language models across price, context window, modality, and reasoning support.",
    primaryFocus:
      "Decision-ready model comparison for product teams sizing AI workloads",
  },
});

interface FrontierModelsPageProps {
  searchParams: Promise<{
    view?: string;
    provider?: string;
    modality?: string;
    tier?: string;
    model?: string;
  }>;
}

export default async function FrontierModelsPage({
  searchParams,
}: FrontierModelsPageProps) {
  const initialState = normalizeFrontierModelsState(await searchParams);
  const snapshot = await getFrontierModelsSnapshot();
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Frontier Model Tracker", url: "/frontier-models" },
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
          name: "Frontier Model Tracker",
          description:
            "Curated, editorially maintained dashboard comparing frontier large language models across price, context window, modality coverage, and reasoning support.",
          url: "https://isaacavazquez.com/frontier-models",
          applicationCategory: "DeveloperApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Sortable, filterable model table with editorial notes",
            "Cost-versus-context scatter plot across providers",
            "Filter by provider, modality, and price tier",
            "Deep-linkable view, filter, and selection state",
          ],
          dateModified: snapshot.generatedAt,
        }}
      />
      <FrontierModelsClient initialState={initialState} snapshot={snapshot} />
    </>
  );
}
