import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";
import HomeContent from "@/components/HomeContent";

export const metadata = constructMetadata({
  title: "Isaac Vazquez - Technical Product Manager | UC Berkeley MBA Candidate",
  description: "Product Manager & UC Berkeley Haas MBA Candidate '27 seeking APM/PM roles in Austin TX and San Francisco Bay Area. 6+ years experience in civic tech, SaaS, quality assurance leadership, and data analytics. Technical background with expertise in product strategy, cross-functional collaboration, and data-driven decision making.",
  canonicalUrl: "/",
});

export default function Home() {
  return (
    <>
      {/* ProfilePage Structured Data for Homepage */}
      <StructuredData type="ProfilePage" />

      <HomeContent />
    </>
  );
}