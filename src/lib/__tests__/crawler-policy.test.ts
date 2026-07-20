import fs from "fs";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getPublicSitemapEntries } = require("../../../src/lib/sitemap.js") as {
  getPublicSitemapEntries: () => Array<{ loc: string; lastmod: string }>;
};

const robots = fs.readFileSync("public/robots.txt", "utf8");
const nextConfig = fs.readFileSync("next.config.mjs", "utf8");

function rulesFor(userAgent: string) {
  const groups = robots
    .split(/\n\s*\n/)
    .filter((group) => group.includes(`User-agent: ${userAgent}`));

  return groups.join("\n");
}

describe("public crawler policy", () => {
  it.each([
    "OAI-SearchBot",
    "ChatGPT-User",
    "Claude-SearchBot",
    "Claude-User",
    "PerplexityBot",
    "Perplexity-User",
  ])("allows %s to retrieve public pages", (userAgent) => {
    const rules = rulesFor(userAgent);

    expect(rules).toContain("Allow: /");
    expect(rules).not.toContain("Disallow: /\n");
  });

  it.each(["GPTBot", "ClaudeBot", "CCBot"])(
    "blocks the %s training crawler",
    (userAgent) => {
      expect(rulesFor(userAgent)).toContain("Disallow: /");
    }
  );

  it("publishes the canonical host and sitemap", () => {
    expect(robots).toContain("Host: isaacavazquez.com");
    expect(robots).toContain(
      "Sitemap: https://isaacavazquez.com/sitemap.xml"
    );
  });
});

describe("legacy release notes URL", () => {
  it("permanently redirects to the canonical changelog", () => {
    expect(nextConfig).toMatch(
      /source:\s*['"]\/release-notes['"][\s\S]*?destination:\s*['"]\/changelog['"][\s\S]*?permanent:\s*true/
    );
  });
});

describe("SEO page sitemap freshness", () => {
  it.each([
    "/",
    "/about",
    "/accessibility",
    "/arcade",
    "/resume",
    "/portfolio",
    "/writing",
  ])(
    "records the SEO update for %s",
    (pathname) => {
      const entry = getPublicSitemapEntries().find(
        ({ loc }: { loc: string }) => loc === pathname
      );

      expect(entry?.lastmod).toBe("2026-07-16T00:00:00.000Z");
    }
  );
});
