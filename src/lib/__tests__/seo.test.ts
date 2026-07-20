import {
  absoluteUrl,
  calculateReadingTime,
  constructMetadata,
  fitMetaDescription,
  fitSearchTitle,
  generateAIOptimizedMetadata,
  generateArticleStructuredData,
  generateOrganizationStructuredData,
  generateProjectStructuredData,
  safeJsonLd,
  siteConfig,
} from "../seo";

describe('constructMetadata', () => {
  it('uses siteConfig defaults when called with no arguments', () => {
    const metadata = constructMetadata();
    expect(metadata.description).toBe(siteConfig.description);
  });

  it('default title template contains siteConfig.name', () => {
    const metadata = constructMetadata();
    const title = metadata.title as { default: string; template: string };
    expect(title.default).toContain(siteConfig.name);
  });

  it('custom description overrides the default', () => {
    const metadata = constructMetadata({ description: 'Custom description' });
    expect(metadata.description).toBe('Custom description');
  });

  it('sets noIndex robots when noIndex is true', () => {
    const metadata = constructMetadata({ noIndex: true });
    const robots = metadata.robots as { index: boolean; follow: boolean };
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(true);
  });

  it('allows crawling by default (noIndex: false)', () => {
    const metadata = constructMetadata({ noIndex: false });
    const robots = metadata.robots as { index: boolean; follow: boolean };
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
  });

  it('sets alternates.canonical to provided canonicalUrl', () => {
    const metadata = constructMetadata({ canonicalUrl: '/about' });
    expect(metadata.alternates?.canonical).toBe('/about');
  });

  it('openGraph description matches the resolved description', () => {
    const metadata = constructMetadata({ description: 'OG description test' });
    const og = metadata.openGraph as { description: string };
    expect(og.description).toBe('OG description test');
  });

  it('openGraph title contains siteConfig.name', () => {
    const metadata = constructMetadata({ title: 'My Page' });
    const og = metadata.openGraph as { title: string };
    expect(og.title).toBe(`My Page | ${siteConfig.name}`);
  });

  it('includes authors with siteConfig.name', () => {
    const metadata = constructMetadata();
    expect(metadata.authors).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: siteConfig.name })])
    );
  });

  it("returns an absolute page title when a custom title is provided", () => {
    const metadata = constructMetadata({ title: "Projects" });

    expect(metadata.title).toEqual({
      absolute: `Projects | ${siteConfig.name}`,
    });
  });

  it("keeps social titles branded once for route-specific titles", () => {
    const metadata = constructMetadata({ title: "Projects" });
    const og = metadata.openGraph as { title: string };
    const twitter = metadata.twitter as { title: string };

    expect(og.title).toBe(`Projects | ${siteConfig.name}`);
    expect(twitter.title).toBe(`Projects | ${siteConfig.name}`);
  });

  it("brands long titles and article titles the same as short website titles", () => {
    const longTitle = "March Madness 2026 Bracket Analysis";
    const long = constructMetadata({ title: longTitle });
    const article = constructMetadata({ title: "A Post", ogType: "article" });

    expect(long.title).toEqual({
      absolute: `${longTitle} | ${siteConfig.name}`,
    });
    expect(article.title).toEqual({
      absolute: `A Post | ${siteConfig.name}`,
    });
  });

  it("does not double-brand a title that already names the site", () => {
    const branded = `What I'm Building Now | ${siteConfig.name}`;
    const metadata = constructMetadata({ title: branded });

    expect(metadata.title).toEqual({ absolute: branded });
  });
});

describe("generateAIOptimizedMetadata", () => {
  it("returns an uncluttered page title while branding social metadata once", () => {
    const metadata = generateAIOptimizedMetadata({
      title: "About",
      description: "Bay Area product manager",
    });

    expect(metadata.title).toEqual({
      absolute: `About | ${siteConfig.name}`,
    });
    expect((metadata.openGraph as { title: string }).title).toBe(
      `About | ${siteConfig.name}`
    );
    expect((metadata.twitter as { title: string }).title).toBe(
      `About | ${siteConfig.name}`
    );
  });

  it("does not emit custom AI meta tags or expand the visible description", () => {
    const metadata = generateAIOptimizedMetadata({
      title: "About",
      description: "A plain description that matches the visible page.",
      summary: "A search-only summary",
      expertise: ["Product Management", "AI Workflows"],
      context: "Search-only context",
    });

    expect(metadata.description).toBe(
      "A plain description that matches the visible page."
    );
    expect(metadata.other).toEqual({});
  });
});

describe("absoluteUrl", () => {
  it("returns the site url when given no path", () => {
    expect(absoluteUrl()).toBe(siteConfig.url);
  });

  it("passes absolute http(s) urls through untouched", () => {
    expect(absoluteUrl("https://example.com/x")).toBe("https://example.com/x");
  });

  it("prefixes relative paths with the site origin and a leading slash", () => {
    expect(absoluteUrl("about")).toBe(`${siteConfig.url}/about`);
    expect(absoluteUrl("/about")).toBe(`${siteConfig.url}/about`);
  });
});

describe("calculateReadingTime", () => {
  it("rounds up to whole minutes at 200 wpm", () => {
    expect(calculateReadingTime("word ".repeat(200).trim())).toBe(1);
    expect(calculateReadingTime("word ".repeat(201).trim())).toBe(2);
    expect(calculateReadingTime("just a few words")).toBe(1);
  });
});

describe("generateProjectStructuredData", () => {
  it("builds a SoftwareApplication node with sensible defaults", () => {
    const data = generateProjectStructuredData({
      name: "QA Platform",
      description: "A testing platform",
      author: "Isaac Vazquez",
    }) as Record<string, unknown>;

    expect(data["@type"]).toBe("SoftwareApplication");
    expect(data.name).toBe("QA Platform");
    expect(data.applicationCategory).toBe("WebApplication");
    expect((data.author as Record<string, unknown>).name).toBe("Isaac Vazquez");
  });

  it("honors provided category, keywords, and dateModified", () => {
    const data = generateProjectStructuredData({
      name: "N",
      description: "D",
      author: "A",
      keywords: ["a", "b"],
      applicationCategory: "DeveloperApplication",
      dateModified: "2026-01-01T00:00:00.000Z",
    }) as Record<string, unknown>;

    expect(data.keywords).toBe("a, b");
    expect(data.applicationCategory).toBe("DeveloperApplication");
    expect(data.dateModified).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("generateArticleStructuredData", () => {
  it("falls back to defaults for author, image, and dateModified", () => {
    const data = generateArticleStructuredData({
      title: "Post",
      description: "About the post",
      datePublished: "2026-02-01",
      url: "https://isaacavazquez.com/writing/post",
    }) as Record<string, unknown>;

    expect(data["@type"]).toBe("Article");
    expect(data.headline).toBe("Post");
    expect(data.dateModified).toBe("2026-02-01");
    expect((data.author as Record<string, unknown>).name).toBe(siteConfig.name);
    expect(data.image).toContain(siteConfig.url);
  });

  it("uses explicit author, image, keywords, and dateModified", () => {
    const data = generateArticleStructuredData({
      title: "Post",
      description: "D",
      author: "Guest",
      datePublished: "2026-02-01",
      dateModified: "2026-03-01",
      image: "https://cdn.example/cover.png",
      keywords: ["seo", "next"],
      url: "https://isaacavazquez.com/writing/post",
    }) as Record<string, unknown>;

    expect((data.author as Record<string, unknown>).name).toBe("Guest");
    expect(data.image).toBe("https://cdn.example/cover.png");
    expect(data.dateModified).toBe("2026-03-01");
    expect(data.keywords).toBe("seo, next");
  });
});

describe("generateOrganizationStructuredData", () => {
  it("omits the location node when no location is given", () => {
    const data = generateOrganizationStructuredData({
      name: "Civitech",
      description: "Civic tech",
    }) as Record<string, unknown>;
    expect(data["@type"]).toBe("Organization");
    expect(data.location).toBeUndefined();
  });

  it("adds a Place node when a location is given", () => {
    const data = generateOrganizationStructuredData({
      name: "Civitech",
      description: "Civic tech",
      location: "Austin, TX",
      foundingDate: "2019",
    }) as Record<string, unknown>;
    expect((data.location as Record<string, unknown>)["@type"]).toBe("Place");
    expect((data.location as Record<string, unknown>).name).toBe("Austin, TX");
    expect(data.foundingDate).toBe("2019");
  });
});

describe("generateAIOptimizedMetadata (enhanced description + dates)", () => {
  it("sets noindex robots when requested", () => {
    const metadata = generateAIOptimizedMetadata({
      title: "Hidden",
      description: "Base",
      noIndex: true,
    });
    const robots = metadata.robots as { index: boolean };
    expect(robots.index).toBe(false);
  });
});

describe("safeJsonLd", () => {
  it("escapes < > & so a value cannot break out of a <script> block", () => {
    const out = safeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c");
    expect(out).toContain("\\u003e");
  });

  it("escapes ampersands", () => {
    expect(safeJsonLd({ v: "a & b" })).toContain("\\u0026");
  });

  it("escapes the U+2028/U+2029 JS line terminators", () => {
    const value = `x${String.fromCharCode(0x2028)}y${String.fromCharCode(0x2029)}z`;
    const out = safeJsonLd({ value });
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
    expect(out).not.toContain(String.fromCharCode(0x2028));
    expect(out).not.toContain(String.fromCharCode(0x2029));
  });

  it("remains valid JSON that round-trips to the original value", () => {
    const data = { name: "</script>", note: "a & b", n: 42 };
    expect(JSON.parse(safeJsonLd(data))).toEqual(data);
  });
});

describe("search metadata fitting", () => {
  it("keeps titles within the search display budget", () => {
    const title = fitSearchTitle(
      "AI Product Manager Interview Questions: What Is Actually Asked in 2026"
    );

    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith("…")).toBe(false);
  });

  it("keeps descriptions within the search display budget", () => {
    const description = fitMetaDescription(
      "A practical explanation of how product teams should evaluate AI agents, including quality, operational risk, model tradeoffs, measurement, security, cost, and where human judgment belongs."
    );

    expect(description.length).toBeLessThanOrEqual(160);
    expect(description.endsWith("…")).toBe(true);
  });
});
