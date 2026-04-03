import { ContactContent } from "@/components/ContactContent";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
  title: "Contact",
  description:
    "Connect with Isaac Vazquez about product roles, projects, analytics work, and fintech-style product opportunities.",
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

      <div className="min-h-screen w-full bg-[var(--surface-primary)] page-section">
        <div className="page-shell-tight">
          <ContactContent />
        </div>
      </div>
    </>
  );
}
