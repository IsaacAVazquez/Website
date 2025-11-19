import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import About from "@/components/About";

export const metadata = constructMetadata({
  title: "About Isaac Vazquez | Product Manager & UC Berkeley MBA Candidate",
  description: "Bay Area-based product manager pursuing MBA at UC Berkeley Haas. Building mission-driven products that balance user insight, data, and disciplined execution. Former QA engineer with 6+ years experience in civic tech and SaaS.",
  canonicalUrl: "/about",
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

      {/* ProfilePage Schema for About Page */}
      <StructuredData
        type="ProfilePage"
        data={{
          name: "About Isaac Vazquez - Product Manager Profile",
          description: "Learn about Isaac Vazquez's journey from quality engineering to product management, including his experience at Civitech, Florida State University, and UC Berkeley Haas MBA program.",
          url: "https://isaacavazquez.com/about",
        }}
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
