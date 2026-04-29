import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { AI_DEV_TOOLS_GENERATED_AT, aiDevTools } from "./ai-dev-tools-data";
import { AiDevToolsClient } from "./ai-dev-tools-client";
import { normalizeAiDevToolsState } from "./ai-dev-tools-state";

export const metadata = constructMetadata({
  title: "AI Dev Tool Ecosystem",
  description:
    "Directory of AI coding and agent tools with pricing tiers, model support, GitHub stars, release cadence, and deep-linkable filters.",
  canonicalUrl: "/ai-dev-tools",
  dateModified: AI_DEV_TOOLS_GENERATED_AT.slice(0, 10),
  aiMetadata: {
    profession: "Product Manager",
    specialty:
      "Developer tools, AI coding agents, market maps, and decision-ready product comparison surfaces",
    expertise: [
      "AI developer tools",
      "Coding agents",
      "Developer experience",
      "Deep-linkable filtering",
      "Next.js",
    ],
    industry: ["Artificial Intelligence", "Developer Tools", "Software"],
    topics: [
      "AI coding tools",
      "AI agents",
      "Cursor",
      "Claude Code",
      "GitHub Copilot",
      "Devin",
      "Cline",
    ],
    contentType: "Software Application",
    context:
      "Standalone AI dev tool directory by Isaac Vazquez comparing coding assistants and agents across pricing, model support, GitHub traction, and release cadence.",
    summary:
      "Filterable directory of AI coding and agent tools including Cursor, Claude Code, GitHub Copilot, Devin, Cline, OpenCode, Kilo Code, and more.",
    primaryFocus:
      "AI developer tool market comparison, model access, pricing, open-source traction, and release velocity",
  },
});

interface AiDevToolsPageProps {
  searchParams: Promise<{
    category?: string;
    pricing?: string;
    model?: string;
    source?: string;
    q?: string;
    tool?: string;
  }>;
}

export default async function AiDevToolsPage({ searchParams }: AiDevToolsPageProps) {
  const initialState = normalizeAiDevToolsState(await searchParams);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "AI Dev Tool Ecosystem", url: "/ai-dev-tools" },
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
          name: "AI Dev Tool Ecosystem",
          description:
            "Filterable directory of AI coding and agent tools with pricing tiers, model support, GitHub stars, and release cadence.",
          url: "https://isaacavazquez.com/ai-dev-tools",
          applicationCategory: "DeveloperApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          dateModified: AI_DEV_TOOLS_GENERATED_AT,
          featureList: [
            "Filter by category, pricing model, model support, and source status",
            "Deep-linkable tool selection and query state",
            "Tool details with pricing, model support, GitHub stars, release cadence, and source links",
          ],
          keywords: aiDevTools.map((tool) => tool.name),
        }}
      />
      <AiDevToolsClient initialState={initialState} />
    </>
  );
}
