import { StructuredData } from "@/components/StructuredData";
import { getMBAJobsData } from "@/lib/mbaJobsServer";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { MBAJobsClient } from "./mba-jobs-client";
import { normalizeMBAJobsState } from "./mba-jobs-state";

export const metadata = constructMetadata({
  title: "Job Search",
  description:
    "Live dashboard monitoring 32 tech company career pages and public job boards for MBA internships plus full-time business roles across product, PMM, strategy, operations, growth, and finance.",
  canonicalUrl: "/mba-internship-notifications",
  dateModified: "2026-07-23",
});

interface MBAJobsPageProps {
  searchParams: Promise<{
    q?: string;
    location?: string;
    sort?: string;
    category?: string;
    roleType?: string;
    roleFamily?: string;
    view?: string;
    external?: string;
  }>;
}

export default async function MBAJobsPage({ searchParams }: MBAJobsPageProps) {
  const initialState = normalizeMBAJobsState(await searchParams);
  const initialResult = await getMBAJobsData(
    undefined,
    initialState.external === "on"
  );
  const initialData = initialResult.isError
    ? undefined
    : {
        ...initialResult.body,
        jobs: initialResult.body.jobs.slice(0, 60),
      };
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Job Search", url: "/mba-internship-notifications" },
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
          name: "Job Search",
          description:
            "Career page and public job board monitor for MBA internships and full-time business roles across 32 tech companies, with optional external job leads.",
          url: "https://isaacavazquez.com/mba-internship-notifications",
          dateModified: "2026-07-23",
          applicationCategory: "BusinessApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "MBA internships",
            "full-time business roles",
            "product management",
            "PMM",
            "strategy and operations",
            "growth and finance",
            "tech recruiting",
          ],
        }}
      />
      <MBAJobsClient initialData={initialData} initialState={initialState} />
    </>
  );
}
