import { AIStructuredData } from "@/components/AIStructuredData";
import { generateAIOptimizedMetadata } from "@/lib/seo";
import { profile, profileSameAs } from "@/lib/profile";
import { AboutV3 } from "@/components/about/AboutV3";

export const metadata = generateAIOptimizedMetadata({
  title: "About",
  description: profile.shortDescription,
  summary:
    "UC Berkeley Haas MBA candidate with six years across QA, analytics, product work, and fintech-style decision tools.",
  expertise: [
    "Product Management",
    "Product Strategy",
    "Quality Engineering",
    "Test Automation",
    "Data Analytics",
    "Cross-functional Leadership",
    "User Research",
    "SaaS Platforms",
    "Consumer Technology",
    "Fintech Product Development",
  ],
  context:
    "UC Berkeley Haas MBA Candidate • Consortium Fellow • MLT Professional Development Fellow • Based in Berkeley, California • Focused on SaaS, analytics, AI workflow, and fintech-style product work",
  author: {
    name: profile.name,
    title: profile.fullTitle,
    credentials: profile.credentials,
  },
  canonicalUrl: "https://isaacavazquez.com/about",
  dateModified: "2026-05-27",
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
            description:
              "Professional profile of Isaac Vazquez - product manager and UC Berkeley Haas MBA Candidate with a background in QA, analytics, and product work across SaaS, civic tech, and fintech-style tools.",
            person: {
              name: profile.name,
              jobTitle: profile.fullTitle,
              description: profile.description,
              url: "https://isaacavazquez.com",
              email: profile.email,
              sameAs: profileSameAs,
              expertise: [
                {
                  name: "Product Management",
                  proficiencyLevel: "Advanced",
                  yearsExperience: 3,
                },
                {
                  name: "Quality Assurance",
                  proficiencyLevel: "Expert",
                  yearsExperience: 6,
                },
                {
                  name: "Data Analysis",
                  proficiencyLevel: "Advanced",
                  yearsExperience: 6,
                },
                {
                  name: "Fintech Product Development",
                  proficiencyLevel: "Intermediate",
                  yearsExperience: 1,
                },
              ],
              alumniOf: profile.education,
            },
          },
        }}
      />

      <AboutV3 />
    </>
  );
}
