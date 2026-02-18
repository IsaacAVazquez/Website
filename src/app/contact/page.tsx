import { ContactContent } from "@/components/ContactContent";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
  title: "Contact Isaac Vazquez | Product Manager - Austin & Bay Area",
  description: "Connect with Isaac Vazquez for product management opportunities, consulting engagements, or civic tech collaborations. UC Berkeley MBA candidate available for PM roles in Austin TX and San Francisco Bay Area. Let's discuss product strategy, roadmapping, and cross-functional leadership.",
  canonicalUrl: "/contact",
  dateModified: "2025-02-05",
});

export default function Contact() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Contact", url: "/contact" }
  ];

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <StructuredData
        type="BreadcrumbList"
        data={{ items: (generateBreadcrumbStructuredData(breadcrumbs) as any).itemListElement }}
      />

      {/* Contact Page Schema */}
      <StructuredData
        type="ContactPage"
        data={{
          name: "Contact Isaac Vazquez",
          description: "Reach out to discuss product management opportunities, product strategy engagements, or civic tech initiatives with Isaac Vazquez.",
          mainEntity: {
            "@type": "Person",
            "name": "Isaac Vazquez",
            "email": "isaacavazquez95@gmail.com",
            "url": "https://isaacavazquez.com"
          }
        }}
      />

      <div className="min-h-screen w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[var(--surface-secondary)]">
        <div className="max-w-5xl mx-auto">
          <ContactContent />
        </div>
      </div>
    </>
  );
}
