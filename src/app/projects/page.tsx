import { ProjectsContent } from "@/components/ProjectsContent";
import { metadata } from "./metadata";
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData } from "@/lib/seo";

export { metadata };

// Project data for structured data
const projectsStructuredData = [
  {
    name: "Civic Engagement Platform QA Framework",
    description: "Scalable QA framework for voter outreach tools reaching 60M+ voters",
    programmingLanguage: ["JavaScript", "TypeScript"],
    keywords: ["Cypress", "Jest", "React Testing", "Node.js Testing"],
  },
  {
    name: "Test Automation Suite",
    description: "Unified automation framework enabling same-day validation",
    programmingLanguage: ["Python", "JavaScript"],
    keywords: ["Selenium", "Docker", "CI/CD", "Test Automation"],
  },
  {
    name: "Data Analytics Dashboard",
    description: "Interactive dashboards for campaign performance monitoring",
    programmingLanguage: ["Python", "SQL"],
    keywords: ["SQL", "Tableau", "Python", "APIs", "Data Analytics"],
  },
  {
    name: "Fantasy Football Tier Visualization",
    description: "Interactive tier visualization using clustering algorithms",
    programmingLanguage: ["TypeScript", "JavaScript"],
    keywords: ["D3.js", "K-Means", "Data Visualization", "Fantasy Sports"],
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
        data={{ items: generateBreadcrumbStructuredData(breadcrumbs).itemListElement }}
      />
      
      {/* Project Structured Data */}
      {projectsStructuredData.map((project, index) => (
        <StructuredData
          key={index}
          type="SoftwareApplication"
          data={{
            ...project,
            dateCreated: "2023-01-01",
            applicationCategory: "WebApplication",
          }}
        />
      ))}

      <div className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ProjectsContent />
        </div>
      </div>
    </>
  );
}