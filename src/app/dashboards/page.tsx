import {
  getPortfolioProjects,
  getProjectCardSummary,
} from "@/constants/caseStudies";
import { getLiveToolGroups } from "@/constants/toolCategories";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { AIStructuredData } from "@/components/AIStructuredData";
import { Catalog97Dashboards } from "@/components/catalog97/Catalog97Dashboards";
import { formatPtTime, getSnapshotReadouts } from "@/lib/catalog97Readouts";

export const metadata = constructMetadata({
  title: "Isaac Vazquez Dashboards | Live Data Tools",
  description:
    "The instruments I built and keep running, from football ledgers to markets and spaceflight. Most dashboards read a committed snapshot that a scheduled job refreshes, some every few hours and some only weekly or in season, a few trackers are curated by hand, and the lifestyle tools and calculators keep their state in your browser.",
  canonicalUrl: "/dashboards",
  dateModified: "2026-09-14",
});

export default async function DashboardsPage() {
  const projects = getPortfolioProjects();
  const groups = getLiveToolGroups(projects);
  const tools = groups.flatMap((group) => group.tools);
  // Each tile carries its project's one-line summary, keyed by slug.
  const summaries = Object.fromEntries(
    projects.map((project) => [project.slug, getProjectCardSummary(project)]),
  );

  const readouts = await getSnapshotReadouts();

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Dashboards", url: "/dashboards" },
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
      <AIStructuredData
        schema={{
          type: "ItemList",
          data: {
            name: "Isaac Vazquez Dashboards",
            description:
              "Live data dashboards built by Isaac Vazquez, each backed by a committed snapshot.",
            url: "https://isaacvazquez.com/dashboards",
            items: tools.map((tool) => ({
              name: tool.title,
              description: tool.categoryLabel,
              url: tool.isExternal
                ? tool.href
                : `https://isaacvazquez.com${tool.href}`,
            })),
          },
        }}
      />

      <Catalog97Dashboards
        groups={groups}
        summaries={summaries}
        cardLines={readouts.cardLines}
        latestPull={readouts.latestPull ? formatPtTime(readouts.latestPull) : null}
        pullLog={readouts.pullLog.map((entry) => ({
          label: entry.label,
          time: formatPtTime(entry.pulledAt).replace(/ PT$/, ""),
        }))}
        staleNote={readouts.investments?.staleNote ?? null}
      />
    </>
  );
}
