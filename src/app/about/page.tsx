import { constructMetadata } from "@/lib/seo";
import { AIStructuredData } from "@/components/AIStructuredData";
import About from "@/components/About";

export const metadata = constructMetadata({
  title: "About Isaac Vazquez | Product Manager & UC Berkeley MBA Candidate",
  description:
    "Bay Area-based product manager pursuing MBA at UC Berkeley Haas. Building mission-driven products that balance user insight, data, and disciplined execution. Former QA engineer with 6+ years experience in civic tech and SaaS.",
  canonicalUrl: "/about",
  aiMetadata: {
    profession: "Technical Product Manager",
    specialty: "Product Management, Quality Engineering, MBA Education",
    expertise: [
      "Product Strategy",
      "Product Discovery",
      "User Research",
      "Quality Assurance Leadership",
      "Data Analysis",
      "Cross-functional Collaboration",
    ],
    industry: ["Civic Technology", "SaaS", "Education Technology"],
    topics: [
      "Product Management Career",
      "Quality Engineering Background",
      "UC Berkeley Haas MBA",
      "Civic Tech Experience",
      "Career Transition Story",
    ],
    contentType: "Professional Profile Page",
    context:
      "Detailed professional profile of Isaac Vazquez, showcasing his career journey from Political Science graduate to QA engineer to product manager, now pursuing MBA at UC Berkeley Haas.",
    summary:
      "Comprehensive professional background including education at UC Berkeley Haas and Florida State University, professional experience at Civitech and Open Progress, expertise in product management and quality engineering, and career trajectory in civic technology.",
    primaryFocus:
      "Professional background, career journey, education, and product management expertise",
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

      <About />
    </>
  );
}
