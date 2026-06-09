import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { profile, profileSameAs } from "@/lib/profile";
import ResumeClient from "./resume-client";

export const metadata = constructMetadata({
  title: "Resume",
  description:
    "Resume for Isaac Vazquez, a product manager and UC Berkeley Haas MBA Candidate with 6+ years across QA, analytics, civic tech, and fintech-style product work.",
  canonicalUrl: "/resume",
  dateModified: "2025-02-05",
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
      
      {/* Resume/Professional Profile Schema */}
      <StructuredData
        type="Person"
        data={{
          name: profile.name,
          jobTitle: profile.fullTitle,
          description: profile.description,
          url: "https://isaacavazquez.com",
          email: profile.email,
          sameAs: profileSameAs,
          worksFor: {
            "@type": "Organization",
            "name": profile.employer.name,
            "url": profile.employer.url,
            "description": profile.employer.description,
          },
          alumniOf: profile.education,
          hasOccupation: {
            "@type": "Occupation",
            "name": "Product Manager",
            "description": "Product manager with 6+ years across QA, analytics, cross-functional delivery, and decision-support product work"
          }
        }}
      />

      {/* JobPosting Schema - Seeking PM/APM Roles */}
      <StructuredData
        type="JobPosting"
        data={{
          title: "Associate Product Manager / Product Manager",
          description: "UC Berkeley Haas MBA Candidate seeking PM or APM roles in Austin TX or the San Francisco Bay Area. 6+ years in quality assurance leadership, data analytics, and SaaS product development with expertise in product strategy, cross-functional collaboration, SQL, and test automation.",
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
