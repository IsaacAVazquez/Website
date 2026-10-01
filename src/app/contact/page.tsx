import { Catalog97Contact } from "@/components/catalog97/Catalog97Contact";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
  title: "Contact Isaac Vazquez | Product and Analytics",
  description:
    "Email me about full-time product roles, Berkeley Haas, an analytics problem, or anything on this site that looks wrong to you.",
  canonicalUrl: "/contact",
  dateModified: "2026-10-01",
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
            "How to reach Isaac Vazquez about product management, product marketing, and program management roles, Berkeley Haas, or the work on this site.",
          mainEntity: {
            "@type": "Person",
            "name": "Isaac Vazquez",
            "email": "IsaacVazquez@berkeley.edu",
            "url": "https://isaacvazquez.com/about"
          }
        }}
      />

      <Catalog97Contact />
    </>
  );
}
