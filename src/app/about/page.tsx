import { AIStructuredData } from "@/components/AIStructuredData";
import { generateAIOptimizedMetadata } from "@/lib/seo";
import { profile, profileSameAs } from "@/lib/profile";
import { AboutInstrument } from "@/components/about/AboutInstrument";

export const metadata = generateAIOptimizedMetadata({
  title: "About Isaac Vazquez | Product Manager and Berkeley Haas MBA",
  description:
    "I'm Isaac Vazquez, a Berkeley Haas MBA candidate and product manager with six years across QA, analytics, SaaS, and civic tech.",
  canonicalUrl: "https://isaacavazquez.com/about",
  dateModified: "2026-07-16",
});

export default function AboutPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "About", url: "/about" },
  ];

  return (
    <>
      {/* Breadcrumb Schema */}
      <AIStructuredData
        schema={{
          type: "Breadcrumb",
          data: { items: breadcrumbs },
        }}
      />

      {/* ProfilePage Schema with comprehensive Person data */}
      <AIStructuredData
        schema={{
          type: "ProfilePage",
          data: {
            url: "https://isaacavazquez.com/about",
            lastReviewed: "2026-07-16",
            description:
              "Isaac Vazquez is a product manager and Berkeley Haas MBA candidate with six years across QA, analytics, SaaS, and civic tech.",
            person: {
              name: profile.name,
              jobTitle: profile.fullTitle,
              description: profile.description,
              url: "https://isaacavazquez.com/about",
              email: profile.email,
              sameAs: profileSameAs,
              knowsAbout: profile.knowsAbout,
              affiliation: [
                {
                  "@type": "CollegeOrUniversity",
                  name: profile.education[0].name,
                  description: profile.education[0].description,
                },
              ],
              alumniOf: [profile.education[1]],
              worksFor: {
                "@type": "Organization",
                name: profile.currentRole.organization,
              },
              hasOccupation: [
                {
                  "@type": "Occupation",
                  name: "Product Manager",
                  skills: profile.knowsAbout,
                },
              ],
            },
          },
        }}
      />

      <AboutInstrument />
    </>
  );
}
