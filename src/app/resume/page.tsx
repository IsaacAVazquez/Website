import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import { AIStructuredData } from "@/components/AIStructuredData";
import { profile, profileSameAs } from "@/lib/profile";
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
    { name: "Résumé", url: "/resume" },
  ];

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (
            generateBreadcrumbStructuredData(breadcrumbs) as {
              itemListElement: object[];
            }
          ).itemListElement,
        }}
      />

      {/* ProfilePage Schema with comprehensive Person data */}
      <AIStructuredData
        schema={{
          type: "ProfilePage",
          data: {
            url: "https://isaacvazquez.com/resume",
            lastReviewed: "2026-09-29",
            description:
              "Isaac Vazquez's résumé: second-year Berkeley Haas MBA candidate with experience spanning QA systems, analytics, civic technology, and product growth.",
            person: {
              name: profile.name,
              jobTitle: profile.fullTitle,
              description: profile.description,
              url: "https://isaacvazquez.com/resume",
              email: profile.email,
              sameAs: profileSameAs,
              knowsAbout: profile.knowsAbout,
              affiliation: [
                {
                  "@type": "CollegeOrUniversity",
                  name: profile.education[0].name,
                  description: profile.education[0].description,
                  url: profile.education[0].url,
                },
              ],
              alumniOf: [profile.education[1]],
            },
          },
        }}
      />

      <Catalog97Resume />
    </>
  );
}
