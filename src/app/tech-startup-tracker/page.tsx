import { StructuredData } from "@/components/StructuredData";
import { techStartupSnapshot } from "@/data/techStartupSnapshot";
import { getTechStartupSnapshot } from "@/lib/techStartupSnapshot";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { TechStartupClient } from "./tech-startup-client";
import { normalizeTechStartupState } from "./tech-startup-state";

export const metadata = constructMetadata({
  title: "Tech Startup Tracker",
  description:
    "Curated dashboard of notable tech startups by sector and funding stage, with valuations, total raised, latest rounds, and a momentum score from a checked-in snapshot.",
  canonicalUrl: "/tech-startup-tracker",
  dateModified: techStartupSnapshot.generatedAt.slice(0, 10),
});

interface TechStartupPageProps {
  searchParams: Promise<{
    view?: string;
    segment?: string;
    sort?: string;
    startup?: string;
  }>;
}

export default async function TechStartupTrackerPage({
  searchParams,
}: TechStartupPageProps) {
  const initialState = normalizeTechStartupState(await searchParams);
  const snapshot = await getTechStartupSnapshot();
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Tech Startup Tracker", url: "/tech-startup-tracker" },
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
          name: "Tech Startup Tracker",
          description:
            "Curated dashboard of notable tech startups by sector and funding stage, with valuations, total raised, latest rounds, and a momentum score from a checked-in snapshot.",
          url: "https://isaacavazquez.com/tech-startup-tracker",
          applicationCategory: "BusinessApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          featureList: [
            "Sector and funding-stage segmentation of notable startups",
            "Valuation, total raised, latest round, and momentum sorting",
            "Deep-linkable filters, sorting, and startup detail state",
            "Transparent curated snapshot with as-of date and disclosure",
          ],
          dateModified: snapshot.generatedAt,
        }}
      />
      <TechStartupClient initialState={initialState} snapshot={snapshot} />
    </>
  );
}
