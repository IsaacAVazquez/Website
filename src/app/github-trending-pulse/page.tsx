import { StructuredData } from "@/components/StructuredData";
import { githubTrendingSnapshot } from "@/data/githubTrendingSnapshot";
import { getGitHubTrendingClientSnapshot } from "@/lib/githubTrendingSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { GitHubTrendingClient } from "./github-trending-client";
import { normalizeGitHubTrendingState } from "./github-trending-state";

export const metadata = constructMetadata({
  title: "GitHub Trending Pulse",
  description:
    "Daily-refreshed dashboard tracking active public GitHub repositories by language and topic, with weekly star movement from checked-in snapshots.",
  canonicalUrl: "/github-trending-pulse",
  dateModified: githubTrendingSnapshot.generatedAt.slice(0, 10),
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
  // Trimmed view: the full snapshot's build bookkeeping (starHistory alone is
  // ~half the serialized weight) must not ship in the RSC payload.
  const snapshot = await getGitHubTrendingClientSnapshot();
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
