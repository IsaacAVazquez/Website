import { FantasyFootballLandingContent } from "@/components/FantasyFootballLandingContent";
import { metadata } from "./metadata";
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData } from "@/lib/seo";

export { metadata };

// Fantasy Football data for structured data
const fantasyFootballStructuredData = [
  {
    name: "Interactive Fantasy Football Tier Graph",
    description: "Advanced clustering algorithms analyze 300+ players with real-time D3.js visualization",
    programmingLanguage: ["TypeScript", "JavaScript"],
    keywords: ["D3.js", "K-Means", "Data Visualization", "Fantasy Sports", "React"],
  },
  {
    name: "Fantasy Football Draft Tier Cards",
    description: "Comprehensive draft interface with tier visualization and real-time player tracking",
    programmingLanguage: ["TypeScript", "JavaScript"],
    keywords: ["React", "Next.js", "Fantasy Sports", "Real-time Data"],
  },
  {
    name: "Fantasy Football Data Management",
    description: "Administrative interface for real-time data collection, processing, and performance monitoring",
    programmingLanguage: ["TypeScript", "JavaScript"],
    keywords: ["API Integration", "Data Processing", "Caching", "Performance"],
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
      
      {/* Fantasy Football Structured Data */}
      {fantasyFootballStructuredData.map((project, index) => (
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

      <div className="min-h-screen w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#FFFCF7] dark:bg-gradient-to-br dark:from-[#1C1410] dark:via-[#2D1B12] dark:to-[#1C1410]">
        <div className="max-w-7xl mx-auto">
          <FantasyFootballLandingContent />
        </div>
      </div>
    </>
  );
}