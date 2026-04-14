import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { MBAJobsClient } from "./mba-jobs-client";
import { normalizeMBAJobsState } from "./mba-jobs-state";

export const metadata = constructMetadata({
  title: "MBA Internship Tracker | Isaac Vazquez",
  description:
    "Live dashboard monitoring 32 tech company career pages and public job boards for MBA internship and summer associate roles. Get browser notifications and email digests when new roles appear.",
  canonicalUrl: "/mba-internship-notifications",
  dateModified: "2026-04-14",
  aiMetadata: {
    profession: "Product Manager",
    specialty:
      "MBA recruiting intelligence, career page monitoring, and internship market analysis",
    expertise: [
      "MBA Recruiting",
      "Career Page Monitoring",
      "Product Management",
      "Next.js",
    ],
    industry: ["Technology", "MBA Recruiting", "Human Resources Technology"],
    topics: [
      "MBA internship tracker",
      "tech company recruiting",
      "MBA summer associate roles",
      "APM programs",
    ],
    contentType: "Software Application",
    context:
      "Portfolio tool by Isaac Vazquez (UC Berkeley Haas MBA candidate) tracking MBA internship postings across Greenhouse, Lever, and Ashby job boards plus curated manual career portals at major tech companies.",
    summary:
      "Real-time dashboard polling public job boards across 32 tech companies for MBA internship roles, with new-since-last-visit detection, browser notifications, and email digests.",
    primaryFocus:
      "MBA recruiting market intelligence and career page monitoring automation",
  },
});

interface MBAJobsPageProps {
  searchParams: Promise<{ sort?: string; category?: string }>;
}

export default async function MBAJobsPage({ searchParams }: MBAJobsPageProps) {
  const initialState = normalizeMBAJobsState(await searchParams);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "MBA Internship Tracker", url: "/mba-internship-notifications" },
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
          name: "MBA Internship Notifications",
          description:
            "Career page and public job board monitor for MBA internship and summer associate roles across 32 tech companies.",
          url: "https://isaacavazquez.com/mba-internship-notifications",
          applicationCategory: "BusinessApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "MBA internship",
            "summer associate",
            "APM",
            "strategy intern",
            "tech recruiting",
          ],
        }}
      />
      <MBAJobsClient initialState={initialState} />
    </>
  );
}
