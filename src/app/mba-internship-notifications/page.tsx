import { StructuredData } from "@/components/StructuredData";
import { getMBAJobsData } from "@/lib/mbaJobsServer";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { MBA_COMPANIES } from "@/constants/mba-companies";
import { MBAJobsClient } from "./mba-jobs-client";
import { normalizeMBAJobsState } from "./mba-jobs-state";

const POLLED_BOARD_COUNT = MBA_COMPANIES.filter((company) => company.atsType !== "manual").length;
const PAGE_DESCRIPTION = `Live dashboard polling ${POLLED_BOARD_COUNT} public tech company job boards for full-time business roles across product, PMM, strategy, operations, growth, finance, chief of staff, and MBA leadership programs, with an application pipeline and fit scoring.`;

export const metadata = constructMetadata({
  title: "Full-Time Job Search Tracker | Tech Business Roles",
  description: PAGE_DESCRIPTION,
  canonicalUrl: "/mba-internship-notifications",
  dateModified: "2026-10-07",
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
          description: PAGE_DESCRIPTION,
          url: "https://isaacvazquez.com/mba-internship-notifications",
          dateModified: "2026-10-07",
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
      <MBAJobsClient initialData={initialData} initialState={initialState} />
    </>
  );
}
