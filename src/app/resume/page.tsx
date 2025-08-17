import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import ResumeClient from "./resume-client";

export const metadata = constructMetadata({
  title: "Resume",
  description: "View Isaac Vazquez's professional resume. QA Engineer with 6+ years of experience in test automation, performance testing, and ensuring software quality for millions of users.",
  canonicalUrl: "/resume",
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
        data={{ items: (generateBreadcrumbStructuredData(breadcrumbs) as any).itemListElement }}
      />
      
      {/* Resume/Professional Profile Schema */}
      <StructuredData 
        type="Person"
        data={{
          name: "Isaac Vazquez",
          jobTitle: "Product Strategist & Business Leader",
          description: "UC Berkeley Haas MBA student with 6+ years experience in QA engineering and product strategy",
          url: "https://isaacavazquez.com",
          email: "isaacavazquez95@gmail.com",
          sameAs: [
            "https://linkedin.com/in/isaac-vazquez",
            "https://github.com/IsaacAVazquez"
          ],
          worksFor: {
            "@type": "Organization",
            "name": "CiviTech"
          },
          alumniOf: [
            {
              "@type": "CollegeOrUniversity",
              "name": "UC Berkeley Haas School of Business",
              "description": "MBA candidate, expected May 2027"
            },
            {
              "@type": "CollegeOrUniversity", 
              "name": "Florida State University",
              "description": "Bachelor of Arts, Political Science and International Affairs, magna cum laude"
            }
          ],
          hasOccupation: {
            "@type": "Occupation",
            "name": "Quality Assurance Engineer",
            "description": "6+ years experience in test automation, performance testing, and system reliability"
          }
        }}
      />

      <ResumeClient />
    </>
  );
}