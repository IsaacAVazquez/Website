import { ContactContent } from "@/components/ContactContent";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
  title: "Contact",
  description: "Get in touch with Isaac Vazquez. Let's discuss QA engineering, test automation, civic tech, or your next project. I'm always open to new opportunities and collaborations.",
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
          description: "Get in touch with Isaac Vazquez for QA engineering, product strategy, and business consulting opportunities",
          mainEntity: {
            "@type": "Person",
            "name": "Isaac Vazquez",
            "email": "isaacavazquez95@gmail.com",
            "url": "https://isaacavazquez.com"
          }
        }}
      />

      <div className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ContactContent />
        </div>
      </div>
    </>
  );
}