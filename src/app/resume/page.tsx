import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import ResumeClient from "./resume-client";

export const metadata = constructMetadata({
  title: "Resume",
  description: "Isaac Vazquez resume: Berkeley Haas MBA Candidate '27, Consortium Fellow. Product-focused technologist with 6+ years in QA, data analytics, and technology.",
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
          jobTitle: "MBA Candidate & Product-Focused Technologist",
          description: "UC Berkeley Haas MBA Candidate '27 with 6+ years experience in quality assurance, data analytics, and technology",
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
            "name": "Product Manager",
            "description": "Technical Product Manager with 6+ years experience in product development, cross-functional leadership, and system reliability"
          }
        }}
      />

      <ResumeClient />
    </>
  );
}