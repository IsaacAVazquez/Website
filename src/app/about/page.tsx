import { AIStructuredData } from "@/components/AIStructuredData";
import { generateAIOptimizedMetadata } from "@/lib/seo";
import { profile, profileSameAs } from "@/lib/profile";
import { Catalog97About } from "@/components/catalog97/Catalog97About";
import { ABOUT_FAQ } from "@/constants/aboutFaq";

export const metadata = generateAIOptimizedMetadata({
  title: "About Isaac Vazquez | Berkeley Haas MBA Candidate",
  description:
    "I'm a second-year Berkeley Haas MBA moving into product, after six years in campaign data and QA and a summer on Juno's MBA growth team.",
  canonicalUrl: "/about",
  dateModified: "2026-10-01",
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
            url: "https://isaacvazquez.com/about",
            lastReviewed: "2026-10-01",
            description:
              "Isaac Vazquez is a second-year Berkeley Haas MBA candidate moving into product, with six years in campaign data and QA and a summer 2026 growth internship at Juno.",
            person: {
              name: profile.name,
              jobTitle: profile.fullTitle,
              description: profile.description,
              url: "https://isaacvazquez.com/about",
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

      {/* FAQ Schema for recruiter, role, and background queries */}
      <AIStructuredData
        schema={{
          type: "FAQ",
          data: {
            items: ABOUT_FAQ.map((faq) => ({
              question: faq.question,
              answer: faq.answer,
            })),
          },
        }}
      />

      <Catalog97About />
    </>
  );
}
