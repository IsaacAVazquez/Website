import { StructuredData } from "@/components/StructuredData";
import { Catalog97Home } from "@/components/catalog97/Catalog97Home";
import { getHomepageFeaturedCaseStudies } from "@/constants/caseStudies";
import { getHomepageProofOfWorkBlogPostPreviews } from "@/lib/blog";
import { getSnapshotReadouts } from "@/lib/catalog97Readouts";

export { metadata } from "./metadata";

export default async function Home() {
  return (
    <>
      <Catalog97Home
        featuredProjects={getHomepageFeaturedCaseStudies()}
        // Pinned on purpose: the write-ups of the Juno and Civitech jobs are
        // the real work behind the site, and picking the newest clustered
        // posts would push one off with the next post published.
        recentPosts={getHomepageProofOfWorkBlogPostPreviews()}
        readouts={await getSnapshotReadouts()}
      />

      <StructuredData type="Person" />
      <StructuredData type="WebSite" />
    </>
  );
}
