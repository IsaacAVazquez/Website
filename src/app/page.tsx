import { StructuredData } from "@/components/StructuredData";
import { AIStructuredData } from "@/components/AIStructuredData";
import { HomePageContent } from "@/components/home/HomePageContent";
import {
  getHomepageFeaturedCaseStudies,
  getPortfolioProjects,
} from "@/constants/caseStudies";
import {
  getAllBlogPostPreviews,
  getHomepageProofOfWorkBlogPostPreviews,
} from "@/lib/blog";
import { profile, profileSameAs } from "@/lib/profile";

export { metadata } from "./metadata";

export default function Home() {
  const featuredProjects = getHomepageFeaturedCaseStudies();
  const proofOfWorkPosts = getHomepageProofOfWorkBlogPostPreviews();

  // Hero meta strip + quick-fact chips read live counts and the latest
  // writing entry so the editorial hero stays accurate as content ships.
  const allPosts = getAllBlogPostPreviews();
  const allProjects = getPortfolioProjects();
  const liveTools = allProjects.filter((p) => Boolean(p.link)).length;
  const heroIndex = {
    projectCount: allProjects.length,
    essayCount: allPosts.length,
    liveToolCount: liveTools,
  };
  const latestPost = allPosts[0] ?? null;
  const featuredEssay = allPosts.find((p) => !p.cluster) ?? latestPost;

  return (
    <div className="w-full scroll-smooth bg-[var(--home-paper)]">
      <HomePageContent
        featuredProjects={featuredProjects}
        proofOfWorkPosts={proofOfWorkPosts}
        heroIndex={heroIndex}
        latestPost={latestPost}
        featuredEssay={featuredEssay}
      />

      <StructuredData type="ProfilePage" />
      <StructuredData type="WebSite" />
      <AIStructuredData
        schema={{
          type: "Person",
          data: {
            name: profile.name,
            jobTitle: profile.fullTitle,
            description: profile.description,
            url: "https://isaacavazquez.com",
            image: "https://isaacavazquez.com/opengraph-image",
            email: profile.email,
            sameAs: profileSameAs,
            address: {
              addressLocality: profile.location.locality,
              addressRegion: profile.location.region,
              addressCountry: profile.location.country,
            },
            knowsAbout: profile.knowsAbout,
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
                name: profile.education[0].name,
                description: profile.education[0].description,
              },
              {
                "@type": "CollegeOrUniversity",
                name: profile.education[1].name,
                description: profile.education[1].description,
              },
            ],
            worksFor: {
              "@type": "Organization",
              name: profile.employer.name,
              description: profile.employer.description,
              url: profile.employer.url,
            },
          },
        }}
      />
    </div>
  );
}
