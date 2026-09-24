import { StructuredData } from "@/components/StructuredData";
import { Catalog97Home } from "@/components/catalog97/Catalog97Home";
import { getHomepageFeaturedCaseStudies } from "@/constants/caseStudies";
import { getAllBlogPostPreviews } from "@/lib/blog";
import { getSnapshotReadouts } from "@/lib/catalog97Readouts";

export { metadata } from "./metadata";

export default async function Home() {
  // Newest pieces from the product clusters. Taken straight by date, this band
  // was two fantasy football posts and a Formula 1 recap every fall.
  const recentPosts = getAllBlogPostPreviews()
    .filter((post) => post.cluster)
    .slice(0, 2);

  return (
    <>
      <Catalog97Home
        featuredProjects={getHomepageFeaturedCaseStudies()}
        recentPosts={recentPosts}
        readouts={await getSnapshotReadouts()}
      />

      <StructuredData type="Person" />
      <StructuredData type="WebSite" />
    </>
  );
}
