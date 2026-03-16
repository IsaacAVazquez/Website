import { ContactContent } from "@/components/ContactContent";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
  title: "Contact Isaac Vazquez | Product Manager & Fintech Builder",
  description:
    "Connect with Isaac Vazquez about product roles, fintech product conversations, or analytics-heavy platform work. UC Berkeley Haas MBA candidate open to PM opportunities and select advisory projects.",
  canonicalUrl: "/contact",
  dateModified: "2026-03-16",
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
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as { itemListElement: object[] })
            .itemListElement,
        }}
      />

      {/* Contact Page Schema */}
      <StructuredData
        type="ContactPage"
        data={{
          name: "Contact Isaac Vazquez",
          description:
            "Reach out to discuss product management opportunities, fintech product work, or analytics-driven platform initiatives with Isaac Vazquez.",
          mainEntity: {
            "@type": "Person",
            "name": "Isaac Vazquez",
            "email": "IsaacVazquez@berkeley.edu",
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
