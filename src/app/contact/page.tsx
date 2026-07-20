import { ContactInstrument } from "@/components/contact/ContactInstrument";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
  title: "Contact Isaac Vazquez | Product and Analytics",
  description:
    "Get in touch with me about product roles, Berkeley Haas, analytics work, or the AI and fintech tools I'm building.",
  canonicalUrl: "/contact",
  dateModified: "2026-06-18",
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
            "Get in touch with Isaac Vazquez about product work, analytics, or fintech projects.",
          mainEntity: {
            "@type": "Person",
            "name": "Isaac Vazquez",
            "email": "IsaacVazquez@berkeley.edu",
            "url": "https://isaacavazquez.com/about"
          }
        }}
      />

      <ContactInstrument />
    </>
  );
}
