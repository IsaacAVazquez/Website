import { ContactV3 } from "@/components/contact/ContactV3";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
  title: "Contact",
  description:
    "Get in touch about product roles, analytics work, or fintech-focused projects.",
  canonicalUrl: "/contact",
  dateModified: "2026-05-26",
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
            "url": "https://isaacavazquez.com"
          }
        }}
      />

      <ContactV3 />
    </>
  );
}
