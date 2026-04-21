import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  BLOG_CLUSTER_ORDER,
  LEAD_GEN_BLOG_SLUGS,
  LEAD_GEN_INTERNAL_LINK_RULES,
} from "../blog-config";

function readLeadGenPost(slug: string) {
  const filePath = path.join(process.cwd(), "content/blog", `${slug}.mdx`);
  const fileContents = fs.readFileSync(filePath, "utf8");
  return matter(fileContents);
}

describe("lead-gen blog content rules", () => {
  it("requires cluster, cover image, and CTA metadata for every priority post", () => {
    for (const slug of LEAD_GEN_BLOG_SLUGS) {
      const { data } = readLeadGenPost(slug);

      expect(data.coverImage).toBe(`/writing/${slug}/opengraph-image`);
      expect(typeof data.cluster).toBe("string");
      expect(BLOG_CLUSTER_ORDER).toContain(data.cluster);
      expect(data.cta).toEqual(
        expect.objectContaining({
          title: expect.any(String),
          description: expect.any(String),
          href: expect.stringMatching(/^\//),
        })
      );
    }
  });

  it("requires at least two related-writing links in every priority post body", () => {
    for (const slug of LEAD_GEN_BLOG_SLUGS) {
      const { content } = readLeadGenPost(slug);
      const writingLinks = content.match(/\]\(\/writing\//g) || [];

      expect(writingLinks.length).toBeGreaterThanOrEqual(
        LEAD_GEN_INTERNAL_LINK_RULES.minRelatedWritingLinks
      );
    }
  });
});
