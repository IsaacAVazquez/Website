import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  BLOG_CLUSTER_ORDER,
  LEAD_GEN_BLOG_SLUGS,
  LEAD_GEN_INTERNAL_LINK_RULES,
} from "../blog-config";

const blogDirectory = path.join(process.cwd(), "content/blog");

function readBlogPost(slug: string) {
  const filePath = path.join(blogDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(filePath, "utf8");
  return matter(fileContents);
}

function readLeadGenPost(slug: string) {
  return readBlogPost(slug);
}

function getWorldCupPostSlugs() {
  return fs
    .readdirSync(blogDirectory)
    .filter((file) => file.includes("world-cup") && file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

const WORLD_CUP_TEAM_COVER_IMAGES: Record<string, string> = {
  "world-cup-2026-contenders-1-spain":
    "/images/writing/world-cup-team-photos/spain.jpg",
  "world-cup-2026-contenders-2-france":
    "/images/writing/world-cup-team-photos/france.jpg",
  "world-cup-2026-contenders-3-england":
    "/images/writing/world-cup-team-photos/england.jpg",
  "world-cup-2026-contenders-4-argentina":
    "/images/writing/world-cup-team-photos/argentina.jpg",
  "world-cup-2026-contenders-5-brazil":
    "/images/writing/world-cup-team-photos/brazil.jpg",
  "world-cup-2026-contenders-6-portugal":
    "/images/writing/world-cup-team-photos/portugal.jpg",
  "world-cup-2026-contenders-7-germany":
    "/images/writing/world-cup-team-photos/germany.jpg",
  "world-cup-2026-contenders-8-netherlands":
    "/images/writing/world-cup-team-photos/netherlands.jpg",
  "world-cup-2026-contenders-9-morocco":
    "/images/writing/world-cup-team-photos/morocco.jpg",
  "world-cup-2026-contenders-10-belgium":
    "/images/writing/world-cup-team-photos/belgium.jpg",
};

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

describe("World Cup blog content rules", () => {
  it("uses explicit object cover metadata for every World Cup article", () => {
    const slugs = getWorldCupPostSlugs();

    expect(slugs.length).toBeGreaterThan(0);

    for (const slug of slugs) {
      const { data } = readBlogPost(slug);
      const teamCoverImage = WORLD_CUP_TEAM_COVER_IMAGES[slug];

      if (teamCoverImage) {
        expect(data.coverImage).toBe(teamCoverImage);
        expect(data.coverImageAlt).toEqual(expect.any(String));
        expect(data.coverImageCredit).toEqual(
          expect.stringContaining("Wikimedia Commons")
        );
        expect(data.coverImageCreditUrl).toEqual(
          expect.stringMatching(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
        );
        continue;
      }

      expect(data.coverImage).toBe(`/writing/${slug}/opengraph-image`);
    }
  });
});
