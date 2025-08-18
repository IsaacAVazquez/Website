import About from "@/components/About";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
  title: "About",
  description: "Product Manager with technical foundation and UC Berkeley MBA education. Bridging engineering excellence with strategic product vision across Austin and Bay Area markets.",
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
          jobTitle: "Product Manager & UC Berkeley MBA Student",
          description: "Product Manager with technical foundation developing world-class product management skills at UC Berkeley Haas",
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
            "Product Management",
            "Product Strategy",
            "Technical Product Management", 
            "Cross-functional Leadership",
            "Data Analytics",
            "User Experience Design",
            "Business Strategy"
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
