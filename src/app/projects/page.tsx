import ProjectsContent from "@/components/ProjectsContent";
import { metadata } from "./metadata";
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData } from "@/lib/seo";

export { metadata };

// Project data for structured data
const projectsStructuredData = [
  {
    name: "Civic Engagement Platform - Voter Outreach Tools",
    description: "Built scalable QA framework for voter outreach tools reaching 60M+ voters with 99.9% uptime during 2022 midterm elections",
    programmingLanguage: ["TypeScript", "JavaScript"],
    keywords: ["Cypress", "Jest", "React", "Node.js", "Civic Tech", "QA Automation"],
    dateCreated: "2022-01-01",
    applicationCategory: "WebApplication",
  },
  {
    name: "Test Automation Suite - Enterprise Framework",
    description: "Led design and implementation of unified automation framework reducing defects by 50% and achieving 300% ROI",
    programmingLanguage: ["Python", "JavaScript"],
    keywords: ["Selenium", "Docker", "CI/CD", "Test Automation", "Python"],
    dateCreated: "2023-01-01",
    applicationCategory: "DeveloperApplication",
  },
  {
    name: "Data Analytics Dashboard - Campaign Insights",
    description: "Designed interactive performance dashboards reducing decision time by 40% and improving conversion rates by 25%",
    programmingLanguage: ["SQL", "Python", "JavaScript"],
    keywords: ["Tableau", "SQL", "Python", "Data Visualization", "Analytics"],
    dateCreated: "2020-01-01",
    applicationCategory: "WebApplication",
  },
  {
    name: "Fantasy Football Tier Rankings",
    description: "Interactive tier visualization using clustering algorithms to analyze 300+ player rankings",
    programmingLanguage: ["TypeScript", "JavaScript"],
    keywords: ["D3.js", "K-Means", "React", "Data Visualization", "Fantasy Sports"],
    dateCreated: "2024-01-01",
    applicationCategory: "WebApplication",
  },
];

export default function ProjectsPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Projects", url: "/projects" }
  ];

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <StructuredData
        type="BreadcrumbList"
        data={{ items: (generateBreadcrumbStructuredData(breadcrumbs) as any).itemListElement }}
      />

      {/* Projects Structured Data */}
      {projectsStructuredData.map((project, index) => (
        <StructuredData
          key={index}
          type="SoftwareApplication"
          data={project}
        />
      ))}

      <ProjectsContent />
    </>
  );
}