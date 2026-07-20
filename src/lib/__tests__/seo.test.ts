import {
  constructMetadata,
  fitMetaDescription,
  fitSearchTitle,
  generateAIOptimizedMetadata,
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
    expect(og.title).toBe(`My Page | ${siteConfig.name} Portfolio`);
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
      absolute: `Projects | ${siteConfig.name} Portfolio`,
    });
  });

  it("keeps social titles branded once for route-specific titles", () => {
    const metadata = constructMetadata({ title: "Projects" });
    const og = metadata.openGraph as { title: string };
    const twitter = metadata.twitter as { title: string };

    expect(og.title).toBe(`Projects | ${siteConfig.name} Portfolio`);
    expect(twitter.title).toBe(`Projects | ${siteConfig.name} Portfolio`);
  });
});

describe("generateAIOptimizedMetadata", () => {
  it("returns an uncluttered page title while branding social metadata once", () => {
    const metadata = generateAIOptimizedMetadata({
      title: "About",
      description: "Bay Area product manager",
    });

    expect(metadata.title).toEqual({
      absolute: `About | ${siteConfig.name} Portfolio`,
    });
    expect((metadata.openGraph as { title: string }).title).toBe(
      `About | ${siteConfig.name} Portfolio`
    );
    expect((metadata.twitter as { title: string }).title).toBe(
      `About | ${siteConfig.name} Portfolio`
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
