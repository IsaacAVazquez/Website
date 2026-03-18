import { AIStructuredData } from "@/components/AIStructuredData";
import { generateAIOptimizedMetadata } from "@/lib/seo";
import About from "@/components/About";

export const metadata = generateAIOptimizedMetadata({
  title: "About Isaac Vazquez | Product Manager & UC Berkeley MBA Candidate",
  description:
    "Bay Area product manager with a QA-to-product background and experience across analytics, platform reliability, and product execution.",
  summary:
    "Technical Product Manager with 6+ years in SaaS and analytics-intensive product work, currently pursuing an MBA at UC Berkeley Haas",
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
    "UC Berkeley Haas MBA Candidate • Consortium Fellow • MLT Professional Development Fellow • Based in the Bay Area • Focused on SaaS, analytics, and fintech-style product work",
  author: {
    name: "Isaac Vazquez",
    title: "Technical Product Manager & UC Berkeley Haas MBA Candidate",
    credentials: [
      "UC Berkeley Haas MBA Candidate '27",
      "Consortium Fellow",
      "MLT Professional Development Fellow",
      "6+ years in SaaS and consumer technology",
    ],
  },
  canonicalUrl: "https://isaacavazquez.com/about",
  dateModified: "2025-02-05",
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
              "Professional profile of Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate with expertise in product strategy, quality engineering, analytics, and fintech-style product work.",
            person: {
              name: "Isaac Vazquez",
              jobTitle: "Technical Product Manager & UC Berkeley Haas MBA Candidate",
              description:
                "Product manager with a technical background building products across SaaS, civic technology, and fintech-style platforms. Expertise in product strategy, user research, quality assurance, and data-driven decision making.",
              url: "https://isaacavazquez.com",
              email: "IsaacVazquez@berkeley.edu",
              sameAs: [
                "https://linkedin.com/in/isaac-vazquez",
                "https://github.com/IsaacAVazquez",
                "https://twitter.com/isaacvazquez",
              ],
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
              alumniOf: [
                {
                  "@type": "CollegeOrUniversity",
                  name: "UC Berkeley Haas School of Business",
                  description: "MBA Candidate (Class of 2027)",
                  degree: "Master of Business Administration",
                  startDate: "2025-08",
                  endDate: "2027-05",
                },
                {
                  "@type": "CollegeOrUniversity",
                  name: "Florida State University",
                  description: "Bachelor of Arts - Political Science and International Affairs",
                  degree: "Bachelor of Arts",
                  endDate: "2018",
                },
              ],
            },
          },
        }}
      />

      <About />
    </>
  );
}
