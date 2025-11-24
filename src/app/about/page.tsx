import { AIStructuredData } from "@/components/AIStructuredData";
import { generateAIOptimizedMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import About from "@/components/About";

export const metadata = generateAIOptimizedMetadata({
  title: "About Isaac Vazquez | Product Manager & UC Berkeley MBA Candidate",
  description: "Bay Area-based product manager pursuing MBA at UC Berkeley Haas. Building mission-driven products that balance user insight, data, and disciplined execution. Former QA engineer with 6+ years experience in civic tech and SaaS.",
  summary: "Technical Product Manager with 6+ years in civic tech and SaaS, currently pursuing MBA at UC Berkeley Haas",
  expertise: [
    "Product Management",
    "Product Strategy",
    "Quality Engineering",
    "Test Automation",
    "Data Analytics",
    "Cross-functional Leadership",
    "User Research",
    "Civic Technology",
    "SaaS Platforms",
  ],
  context: "UC Berkeley Haas MBA Candidate • Consortium Fellow • MLT Professional Development Fellow • Based in Bay Area",
  author: {
    name: "Isaac Vazquez",
    title: "Technical Product Manager & UC Berkeley Haas MBA Candidate",
    credentials: [
      "UC Berkeley Haas MBA Candidate '27",
      "Consortium Fellow",
      "MLT Professional Development Fellow",
      "6+ years in civic tech and SaaS",
    ],
  },
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
              "Professional profile of Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate with expertise in product strategy, quality engineering, and civic technology.",
            person: {
              name: "Isaac Vazquez",
              jobTitle: "Technical Product Manager & UC Berkeley Haas MBA Candidate",
              description:
                "Product manager with technical background building mission-driven products in civic tech and SaaS. Expertise in product strategy, user research, quality assurance, and data-driven decision making.",
              url: "https://isaacavazquez.com",
              email: "isaacavazquez95@gmail.com",
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

      {/* ProfilePage Schema for About Page */}
      <StructuredData
        type="ProfilePage"
        data={{
          name: "About Isaac Vazquez - Product Manager Profile",
          description: "Learn about Isaac Vazquez's journey from quality engineering to product management, including his experience at Civitech, Florida State University, and UC Berkeley Haas MBA program.",
          url: "https://isaacavazquez.com/about",
        }}
      />

      {/* Person Schema with detailed background */}
      <StructuredData
        type="Person"
        data={{
          name: "Isaac Vazquez",
          jobTitle: "Technical Product Manager & UC Berkeley Haas MBA Candidate",
          description: "Product manager with technical background building mission-driven products in civic tech and SaaS",
          url: "https://isaacavazquez.com",
          sameAs: [
            "https://linkedin.com/in/isaac-vazquez",
            "https://github.com/IsaacAVazquez"
          ]
        }}
      />

      <About />
    </>
  );
}
