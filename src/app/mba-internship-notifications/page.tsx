import { StructuredData } from "@/components/StructuredData";
import { getMBAJobsData } from "@/lib/mbaJobsServer";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { MBA_COMPANIES } from "@/constants/mba-companies";
import { MBAJobsClient } from "./mba-jobs-client";
import { JOB_PAGE_SIZE, normalizeMBAJobsState } from "./mba-jobs-state";

const POLLED_BOARD_COUNT = MBA_COMPANIES.filter((company) => company.atsType !== "manual").length;
const PAGE_DESCRIPTION = `Live dashboard polling ${POLLED_BOARD_COUNT} public tech company job boards for full-time business roles across product, PMM, strategy, operations, growth, finance, chief of staff, and MBA leadership programs, with an application pipeline and fit scoring.`;

export const metadata = constructMetadata({
  title: "Full-Time Job Search Tracker | Tech Business Roles",
  description: PAGE_DESCRIPTION,
  canonicalUrl: "/mba-internship-notifications",
  dateModified: "2026-10-09",
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
  // The first paint carries one page of cards; the full list arrives with the
  // browser's own fetch. The true size travels separately so the hero's count
  // never reads the slice as the feed.
  const initialData = initialResult.isError
    ? undefined
    : {
        ...initialResult.body,
        jobs: initialResult.body.jobs.slice(0, JOB_PAGE_SIZE),
      };
  const initialJobCount = initialResult.isError ? undefined : initialResult.body.jobs.length;
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
          description: PAGE_DESCRIPTION,
          url: "https://isaacvazquez.com/mba-internship-notifications",
          dateModified: "2026-10-09",
          applicationCategory: "BusinessApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "full-time job search",
            "MBA leadership programs",
            "chief of staff",
            "full-time business roles",
            "product management",
            "PMM",
            "strategy and operations",
            "growth and finance",
            "tech recruiting",
          ],
        }}
      />
      <MBAJobsClient
        initialData={initialData}
        initialJobCount={initialJobCount}
        initialState={initialState}
      />
    </>
  );
}
