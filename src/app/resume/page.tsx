import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import ResumeClient from "./resume-client";

export const metadata = constructMetadata({
  title: "Resume - Isaac Vazquez | Product Manager & UC Berkeley MBA Candidate",
  description: "Isaac Vazquez resume: UC Berkeley Haas MBA Candidate '27, Consortium Fellow. Technical Product Manager with 6+ years leading quality engineering, data analytics, and civic tech initiatives at Civitech, Open Progress, and Florida State University. Skills in product strategy, cross-functional leadership, stakeholder management, SQL, test automation, and Agile methodologies.",
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

      {/* JobPosting Schema - Seeking PM/APM Roles */}
      <StructuredData
        type="JobPosting"
        data={{
          title: "Seeking: Associate Product Manager / Product Manager",
          description: "UC Berkeley Haas MBA Candidate '27 seeking Product Manager or Associate Product Manager roles in Austin TX or San Francisco Bay Area. 6+ years experience in quality assurance leadership, data analytics, and civic tech. Technical background with expertise in product strategy, cross-functional collaboration, SQL, test automation (Cypress), and Agile methodologies. Passionate about building mission-driven products in civic tech, SaaS, and social impact sectors.",
          datePosted: "2024-08-15",
          validThrough: "2027-05-31",
          employmentType: ["FULL_TIME"],
          jobLocationType: "TELECOMMUTE",
        }}
      />

      <ResumeClient />
    </>
  );
}