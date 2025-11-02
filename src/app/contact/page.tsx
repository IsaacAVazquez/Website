import { ContactContent } from "@/components/ContactContent";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
  title: "Contact",
  description: "Get in touch with Isaac Vazquez to talk product management roles, product strategy projects, or mission-driven tech collaborations across Austin and the Bay Area.",
  canonicalUrl: "/contact",
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

      <div className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0A0A0B] dark:via-[#0F172A] dark:to-[#1E293B]">
        <div className="max-w-4xl mx-auto">
          <ContactContent />
        </div>
      </div>
    </>
  );
}
