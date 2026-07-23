import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  BLOG_CLUSTER_ORDER,
  BLOG_TOPIC_PAGES,
  LEAD_GEN_BLOG_SLUGS,
  LEAD_GEN_INTERNAL_LINK_RULES,
  getBlogTopicPageForPost,
} from "../blog-config";
import { fitMetaDescription, fitSearchTitle } from "../seo";

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

      if (data.coverImage === `/images/writing/covers/${slug}.jpg`) {
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

describe("article search metadata rules", () => {
  it("fits every article title and description within the configured limits", () => {
    const files = fs
      .readdirSync(blogDirectory)
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));

    for (const file of files) {
      const { data } = matter(
        fs.readFileSync(path.join(blogDirectory, file), "utf8")
      );
      const title = fitSearchTitle(data.seo?.title || data.title);
      const description = fitMetaDescription(
        data.seo?.description || data.excerpt || data.title
      );
      const brandedTitle = `${title} | Isaac Vazquez`;

      expect(brandedTitle.length).toBeLessThanOrEqual(60);
      expect(description.length).toBeLessThanOrEqual(160);
    }
  });

  it("keeps publication and update dates valid and chronological", () => {
    const files = fs
      .readdirSync(blogDirectory)
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));

    for (const file of files) {
      const { data } = matter(
        fs.readFileSync(path.join(blogDirectory, file), "utf8")
      );
      expect(data.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      if (data.updatedAt) {
        expect(data.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(data.updatedAt >= data.publishedAt).toBe(true);
      }
    }
  });
});

describe("writing topic architecture", () => {
  it("assigns every article to one crawlable topic page", () => {
    const files = fs
      .readdirSync(blogDirectory)
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));

    expect(new Set(BLOG_TOPIC_PAGES.map((topic) => topic.slug)).size).toBe(
      BLOG_TOPIC_PAGES.length
    );

    for (const file of files) {
      const { data } = matter(
        fs.readFileSync(path.join(blogDirectory, file), "utf8")
      );
      expect(getBlogTopicPageForPost(data)).toBeDefined();
    }
  });
});

describe("primary-source citation rules", () => {
  it.each([
    "context-engineering-replacing-prompt-engineering",
    "evals-are-the-new-test-suite",
    "is-rag-dead-2026",
    "prompt-injection-is-a-product-problem",
    "what-an-ai-agent-actually-costs-in-production",
  ])("keeps primary-source links in %s", (slug) => {
    const { content } = readBlogPost(slug);
    const externalLinks = content.match(/\]\(https:\/\/[^)]+\)/g) || [];

    expect(externalLinks.length).toBeGreaterThan(0);
  });
});
