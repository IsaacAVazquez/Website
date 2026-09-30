import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { Catalog97Resume } from "@/components/catalog97/Catalog97Resume";

export const metadata = constructMetadata({
  title: "Isaac Vazquez Resume | Product and Analytics",
  description:
    "My résumé covers campaign data at Open Progress, QA and product work at Civitech, a 2026 growth internship at Juno, and my Berkeley Haas MBA.",
  canonicalUrl: "/resume",
  dateModified: "2026-09-29",
});

export default function ResumePage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Résumé", url: "/resume" }
  ];

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <StructuredData 
        type="BreadcrumbList" 
        data={{ items: generateBreadcrumbStructuredData(breadcrumbs).itemListElement }}
      />
      
      <StructuredData type="Person" />

      <Catalog97Resume />
    </>
  );
}
