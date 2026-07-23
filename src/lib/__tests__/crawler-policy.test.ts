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

function directiveLines(userAgent: string, directive: "Allow" | "Disallow") {
  return rulesFor(userAgent)
    .split("\n")
    .filter((line) => line.startsWith(`${directive}: `))
    .sort();
}

const RETRIEVAL_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
];

const PUBLIC_GENERATIVE_AGENTS = ["Google-Extended"];

const TRAINING_AGENTS = [
  "GPTBot",
  "ClaudeBot",
  "CCBot",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "Amazonbot",
  "cohere-ai",
];

describe("public crawler policy", () => {
  it.each(RETRIEVAL_AGENTS)("allows %s to retrieve public pages", (userAgent) => {
    const rules = rulesFor(userAgent);

    expect(rules).toContain("Allow: /");
    expect(rules).not.toContain("Disallow: /\n");
  });

  it.each(RETRIEVAL_AGENTS)("lets %s fetch the RSS feed", (userAgent) => {
    expect(rulesFor(userAgent)).toContain("Allow: /api/rss");
  });

  it.each(PUBLIC_GENERATIVE_AGENTS)(
    "allows %s to use public pages for grounding",
    (userAgent) => {
      expect(rulesFor(userAgent)).toContain("Allow: /");
      expect(rulesFor(userAgent)).toContain("Allow: /api/rss");
      expect(rulesFor(userAgent)).not.toContain("Disallow: /\n");
    }
  );

  it.each(TRAINING_AGENTS)(
    "blocks the %s training crawler from everything",
    (userAgent) => {
      expect(directiveLines(userAgent, "Disallow")).toEqual(["Disallow: /"]);
    }
  );

  it.each(["*", "OAI-SearchBot", "Google-Extended", "Googlebot"])(
    "keeps rendering assets fetchable for %s so pages index styled and hydrated",
    (userAgent) => {
      // Googlebot has no named group, so it inherits * — assert both resolve
      // to a group that re-allows /_next/static under the /_next/ disallow.
      const rules = rulesFor(userAgent === "Googlebot" ? "*" : userAgent);

      expect(rules).toContain("Allow: /_next/static/");
      expect(rules).toContain("Allow: /_next/image");
    }
  );

  it.each(["*", "OAI-SearchBot", "Google-Extended", "Googlebot"])(
    "blocks the exact /admin route for %s",
    (userAgent) => {
      const rules = rulesFor(userAgent === "Googlebot" ? "*" : userAgent);

      expect(rules).toContain("Disallow: /admin");
    }
  );

  it("keeps the retrieval group's rules in sync with the * group", () => {
    // A named group fully replaces * (RFC 9309), so any path blocked or
    // re-allowed for anonymous crawlers must be mirrored for retrieval bots.
    expect(directiveLines("OAI-SearchBot", "Disallow")).toEqual(
      directiveLines("*", "Disallow")
    );
    expect(directiveLines("OAI-SearchBot", "Allow")).toEqual(
      directiveLines("*", "Allow")
    );
  });

  it("keeps Google-Extended exclusions in sync with the public group", () => {
    expect(directiveLines("Google-Extended", "Disallow")).toEqual(
      directiveLines("*", "Disallow")
    );
    expect(directiveLines("Google-Extended", "Allow")).toEqual(
      directiveLines("*", "Allow")
    );
  });

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

  it.each([
    "/mba-internship-notifications",
    "/news-pulse",
    "/changelog",
    "/resume",
    "/score-pools",
    "/score-pools/tracker",
    "/score-pools/settings",
    "/world-cup-2026",
  ])("records the audit implementation for %s", (pathname) => {
    const entry = getPublicSitemapEntries().find(
      ({ loc }: { loc: string }) => loc === pathname
    );

    expect(new Date(entry?.lastmod ?? 0).getTime()).toBeGreaterThanOrEqual(
      new Date("2026-07-23T00:00:00.000Z").getTime()
    );
  });
});
