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
    { name: "Fantasy Football", url: "/projects" }
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

      <div className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0A0A0B] dark:via-[#0F172A] dark:to-[#1E293B]">
        <div className="max-w-7xl mx-auto">
          <FantasyFootballLandingContent />
        </div>
      </div>
    </>
  );
}