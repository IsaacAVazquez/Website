import { StructuredData } from "@/components/StructuredData";
import { githubTrendingSnapshot } from "@/data/githubTrendingSnapshot";
import { getGitHubTrendingSnapshot } from "@/lib/githubTrendingSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { GitHubTrendingClient } from "./github-trending-client";
import { normalizeGitHubTrendingState } from "./github-trending-state";

// eslint-disable-next-line react-refresh/only-export-components -- Next.js route modules export metadata alongside the page component.
export const metadata = constructMetadata({
  title: "GitHub Trending Pulse",
  description:
    "Daily-refreshed dashboard tracking active public GitHub repositories by language and topic, with weekly star movement from checked-in snapshots.",
  canonicalUrl: "/github-trending-pulse",
  dateModified: githubTrendingSnapshot.generatedAt.slice(0, 10),
  aiMetadata: {
    profession: "Product Manager",
    specialty:
      "Developer tooling dashboards, public API data products, and snapshot-driven trend tracking",
    expertise: [
      "GitHub API",
      "Developer tools",
      "Snapshot pipelines",
      "Trend analysis",
      "Next.js",
    ],
    industry: ["Developer Tools", "Open Source", "Software"],
    topics: [
      "GitHub trending repositories",
      "Open source momentum",
      "Weekly star deltas",
      "Developer tool tracking",
    ],
    contentType: "Software Application",
    context:
      "Standalone GitHub Trending Pulse dashboard by Isaac Vazquez that tracks active public repositories by language and topic using the public GitHub API.",
    summary:
      "GitHub Trending Pulse tracks active repositories, language and topic segments, and weekly star movement from daily snapshots.",
    primaryFocus:
      "Data freshness and open source momentum tracking for developer tooling research",
  },
});

interface GitHubTrendingPageProps {
  searchParams: Promise<{
    view?: string;
    segment?: string;
    sort?: string;
    repo?: string;
  }>;
}

export default async function GitHubTrendingPulsePage({
  searchParams,
}: GitHubTrendingPageProps) {
  const initialState = normalizeGitHubTrendingState(await searchParams);
  const snapshot = await getGitHubTrendingSnapshot();
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "GitHub Trending Pulse", url: "/github-trending-pulse" },
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
          name: "GitHub Trending Pulse",
          description:
            "Daily-refreshed dashboard tracking active public GitHub repositories by language and topic, with weekly star movement from checked-in snapshots.",
          url: "https://isaacavazquez.com/github-trending-pulse",
          applicationCategory: "DeveloperApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Daily generated snapshot from the public GitHub Search API",
            "Language and topic filtering",
            "Weekly star movement from persisted snapshot history",
            "Deep-linkable filters, sorting, and repository detail state",
          ],
          dateModified: snapshot.generatedAt,
        }}
      />
      <GitHubTrendingClient initialState={initialState} snapshot={snapshot} />
    </>
  );
}
