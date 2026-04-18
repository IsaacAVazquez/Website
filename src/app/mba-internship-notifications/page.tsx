import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { MBAJobsClient } from "./mba-jobs-client";
import { normalizeMBAJobsState } from "./mba-jobs-state";

export const metadata = constructMetadata({
  title: "Job Search | Isaac Vazquez",
  description:
    "Live dashboard monitoring 32 tech company career pages and public job boards for MBA internships plus full-time business roles across product, PMM, strategy, operations, growth, and finance.",
  canonicalUrl: "/mba-internship-notifications",
  dateModified: "2026-04-15",
  aiMetadata: {
    profession: "Product Manager",
    specialty:
      "MBA recruiting intelligence, career page monitoring, and business-role market analysis",
    expertise: [
      "MBA Recruiting",
      "Career Page Monitoring",
      "Product Management",
      "Next.js",
    ],
    industry: ["Technology", "MBA Recruiting", "Human Resources Technology"],
    topics: [
      "MBA role tracker",
      "tech company recruiting",
      "MBA internships",
      "full-time business roles",
      "APM and PMM recruiting",
    ],
    contentType: "Software Application",
    context:
      "Portfolio tool by Isaac Vazquez (UC Berkeley Haas MBA candidate) tracking MBA internships and full-time business roles across Greenhouse, Lever, and Ashby job boards plus curated manual career portals at major tech companies.",
    summary:
      "Real-time dashboard polling public job boards across 32 tech companies for MBA internships and full-time business roles, with new-since-last-visit detection, browser notifications, and email digests.",
    primaryFocus:
      "MBA recruiting market intelligence and career page monitoring automation",
  },
});

interface MBAJobsPageProps {
  searchParams: Promise<{
    q?: string;
    location?: string;
    sort?: string;
    category?: string;
    roleType?: string;
    roleFamily?: string;
  }>;
}

export default async function MBAJobsPage({ searchParams }: MBAJobsPageProps) {
  const initialState = normalizeMBAJobsState(await searchParams);
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
            "Career page and public job board monitor for MBA internships and full-time business roles across 32 tech companies.",
          url: "https://isaacavazquez.com/mba-internship-notifications",
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
      <MBAJobsClient initialState={initialState} />
    </>
  );
}
