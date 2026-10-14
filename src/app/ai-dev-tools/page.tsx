import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData, laterDate } from "@/lib/seo";
import { AI_DEV_TOOLS_GENERATED_AT, aiDevTools } from "./ai-dev-tools-data";
import { AiDevToolsClient } from "./ai-dev-tools-client";

export const metadata = constructMetadata({
  title: "AI Dev Tool Ecosystem",
  description:
    "Directory of AI coding and agent tools with pricing tiers, model support, GitHub stars, release cadence, and deep-linkable filters.",
  canonicalUrl: "/ai-dev-tools",
  dateModified: laterDate(AI_DEV_TOOLS_GENERATED_AT.slice(0, 10), "2026-10-12"),
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
  // Read only to keep the page rendered per request, so the client's
  // useSearchParams has the URL's filters and tool in the server HTML.
  await searchParams;
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
          url: "https://isaacvazquez.com/ai-dev-tools",
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
      <AiDevToolsClient />
    </>
  );
}
