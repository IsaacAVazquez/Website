import About from "@/components/About";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
  title: "About",
  description: "Learn more about Isaac Vazquez - QA engineer, civic tech advocate, and data enthusiast. Discover my journey, skills, and passion for building reliable software.",
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
      
      {/* Person Schema for About Page */}
      <StructuredData 
        type="Person"
        data={{
          name: "Isaac Vazquez",
          jobTitle: "Product Strategist & Business Leader",
          description: "UC Berkeley Haas MBA student and business leader exploring technology, strategy, and impact",
          url: "https://isaacavazquez.com",
          sameAs: [
            "https://linkedin.com/in/isaac-vazquez",
            "https://github.com/IsaacAVazquez"
          ],
          alumniOf: {
            "@type": "CollegeOrUniversity",
            "name": "UC Berkeley Haas School of Business"
          },
          knowsAbout: [
            "Product Strategy",
            "Business Leadership", 
            "Quality Assurance Engineering",
            "Data Analytics",
            "Fantasy Football Analytics",
            "Software Testing"
          ]
        }}
      />

      <div className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <About />
        </div>
      </div>
    </>
  );
}
