import { generateAIOptimizedMetadata, generatePersonStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import About from "@/components/About";

export const metadata = generateAIOptimizedMetadata({
  title: "About Isaac Vazquez | Product Manager & UC Berkeley MBA Candidate",
  description: "Bay Area-based product manager pursuing MBA at UC Berkeley Haas. Building mission-driven products that balance user insight, data, and disciplined execution. Former QA engineer with 6+ years experience in civic tech and SaaS.",
  summary: "Technical Product Manager with 6+ years in civic tech and SaaS, currently pursuing MBA at UC Berkeley Haas",
  expertise: [
    "Product Management",
    "Product Strategy",
    "Quality Engineering",
    "Test Automation",
    "Data Analytics",
    "Cross-functional Leadership",
    "User Research",
    "Civic Technology",
    "SaaS Platforms",
  ],
  context: "UC Berkeley Haas MBA Candidate • Consortium Fellow • MLT Professional Development Fellow • Based in Bay Area",
  author: {
    name: "Isaac Vazquez",
    title: "Technical Product Manager & UC Berkeley Haas MBA Candidate",
    credentials: [
      "UC Berkeley Haas MBA Candidate '27",
      "Consortium Fellow",
      "MLT Professional Development Fellow",
      "6+ years in civic tech and SaaS",
    ],
  },
});

export default function AboutPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "About", url: "/about" }
  ];

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <StructuredData
        type="BreadcrumbList"
        data={{ items: (generateBreadcrumbStructuredData(breadcrumbs) as any).itemListElement }}
      />

      {/* Person Schema with detailed background */}
      <StructuredData
        type="Person"
        data={{
          name: "Isaac Vazquez",
          jobTitle: "Technical Product Manager & UC Berkeley Haas MBA Candidate",
          description: "Product manager with technical background building mission-driven products in civic tech and SaaS",
          url: "https://isaacavazquez.com",
          sameAs: [
            "https://linkedin.com/in/isaac-vazquez",
            "https://github.com/IsaacAVazquez"
          ]
        }}
      />

      <About />
    </>
  );
}
