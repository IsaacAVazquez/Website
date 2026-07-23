import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import ResumeClient from "./resume-client";

export const metadata = constructMetadata({
  title: "Isaac Vazquez Resume | Product and Analytics",
  description:
    "My resume covers six years across civic tech, QA, analytics, and product work, plus my Berkeley Haas MBA and current product focus.",
  canonicalUrl: "/resume",
  dateModified: "2026-07-23",
});

export default function ResumePage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Resume", url: "/resume" }
  ];

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <StructuredData 
        type="BreadcrumbList" 
        data={{ items: generateBreadcrumbStructuredData(breadcrumbs).itemListElement }}
      />
      
      <StructuredData type="Person" />

      <ResumeClient />
    </>
  );
}
