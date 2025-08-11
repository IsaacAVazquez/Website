import { ProjectsContent } from "@/components/ProjectsContent";
import { metadata } from "./metadata";
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData } from "@/lib/seo";

export { metadata };

// Projects data for structured data
const projectsStructuredData = [
  {
    name: "Civic Engagement Platform QA Framework",
    description: "Scalable QA framework for voter outreach tools reaching 60M+ voters with 30% faster releases",
    programmingLanguage: ["TypeScript", "JavaScript"],
    keywords: ["Cypress", "Jest", "React", "Node.js", "Quality Assurance"],
  },
  {
    name: "Test Automation Suite",
    description: "Unified automation framework enabling same-day validation with 50% defect reduction",
    programmingLanguage: ["Python", "JavaScript"],
    keywords: ["Selenium", "Docker", "CI/CD", "Test Automation"],
  },
  {
    name: "Portfolio Platform",
    description: "Modern portfolio website built with Next.js 15 featuring cyberpunk design and 99% Lighthouse score",
    programmingLanguage: ["TypeScript", "JavaScript"],
    keywords: ["Next.js", "Tailwind CSS", "Framer Motion", "Performance Optimization"],
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
          data={{
            ...project,
            dateCreated: "2024-01-01",
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