import { StructuredData } from "@/components/StructuredData";
import { AIStructuredData } from "@/components/AIStructuredData";
import { HomePageContent } from "@/components/home/HomePageContent";
import { getHomepageFeaturedCaseStudies } from "@/constants/caseStudies";
import { getLatestBlogPostPreviews } from "@/lib/blog";

export { metadata } from "./metadata";

export default function Home() {
  const featuredProjects = getHomepageFeaturedCaseStudies();
  const latestPosts = getLatestBlogPostPreviews(3);

  return (
    <div className="w-full scroll-smooth bg-[var(--surface-primary)]">
      <HomePageContent
        featuredProjects={featuredProjects}
        latestPosts={latestPosts}
      />

      <StructuredData type="ProfilePage" />
      <StructuredData type="WebSite" />
      <AIStructuredData
        schema={{
          type: "Person",
          data: {
            name: "Isaac Vazquez",
            jobTitle: "Technical Product Manager & UC Berkeley Haas MBA Candidate",
            description:
              "Technical Product Manager and UC Berkeley Haas MBA Candidate '27 with 6+ years experience in SaaS and consumer products, with a background spanning QA, analytics, and product execution.",
            url: "https://isaacavazquez.com",
            image: "https://isaacavazquez.com/opengraph-image",
            email: "IsaacVazquez@berkeley.edu",
            sameAs: [
              "https://linkedin.com/in/isaac-vazquez",
              "https://github.com/IsaacAVazquez",
            ],
            address: {
              addressLocality: "Berkeley",
              addressRegion: "CA",
              addressCountry: "US",
            },
            knowsAbout: [
              "Product Management",
              "Product Strategy",
              "Product Discovery",
              "Cross-functional Leadership",
              "Quality Assurance",
              "Test Automation",
              "Consumer Technology",
              "SaaS Platforms",
              "Data Analysis",
              "Fintech Product Development",
              "Investment Research Tools",
              "Agile/Scrum",
            ],
            expertise: [
              {
                name: "Product Management",
                proficiencyLevel: "Advanced",
                yearsExperience: 3,
                description: "Product strategy, discovery, roadmapping, and cross-functional leadership",
              },
              {
                name: "Quality Assurance",
                proficiencyLevel: "Expert",
                yearsExperience: 6,
                description: "Test automation, quality strategy, release management, and continuous improvement",
              },
            ],
            alumniOf: [
              {
                "@type": "CollegeOrUniversity",
                name: "UC Berkeley Haas School of Business",
                description: "MBA Candidate (Class of 2027)",
              },
              {
                "@type": "CollegeOrUniversity",
                name: "Florida State University",
                description: "Bachelor of Arts - Political Science and International Affairs",
              },
            ],
            worksFor: {
              "@type": "Organization",
              name: "Civitech",
              description: "Civic technology company providing voter engagement platforms",
              url: "https://civitech.io",
            },
          },
        }}
      />
    </div>
  );
}
