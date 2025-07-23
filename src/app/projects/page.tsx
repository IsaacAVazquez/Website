import { FantasyFootballLandingContent } from "@/components/FantasyFootballLandingContent";
import { metadata } from "./metadata";
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData } from "@/lib/seo";

export { metadata };

// Fantasy Football data for structured data
const fantasyFootballStructuredData = [
  {
    name: "Interactive Fantasy Football Tier Visualizations",
    description: "Advanced clustering algorithms analyze 300+ players with real-time data visualization",
    programmingLanguage: ["TypeScript", "JavaScript"],
    keywords: ["D3.js", "K-Means", "Data Visualization", "Fantasy Sports", "React"],
  },
  {
    name: "Fantasy Football Draft Command Center",
    description: "Comprehensive draft interface with tier visualization and real-time player tracking",
    programmingLanguage: ["TypeScript", "JavaScript"],
    keywords: ["React", "Next.js", "Fantasy Sports", "Real-time Data"],
  },
  {
    name: "Fantasy Football Analytics Pipeline",
    description: "Automated data collection and processing with smart caching and performance optimization",
    programmingLanguage: ["TypeScript", "JavaScript"],
    keywords: ["API Integration", "Data Processing", "Caching", "Performance"],
  },
  {
    name: "Fantasy Football Mobile Experience",
    description: "Responsive design with touch interactions and offline capabilities",
    programmingLanguage: ["TypeScript", "JavaScript"],
    keywords: ["Mobile Optimization", "Responsive Design", "PWA", "Touch UI"],
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

      <div className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FantasyFootballLandingContent />
        </div>
      </div>
    </>
  );
}