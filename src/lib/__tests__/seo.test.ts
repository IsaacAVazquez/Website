import {
  constructMetadata,
  generateAIOptimizedMetadata,
  safeJsonLd,
  siteConfig,
} from "../seo";

jest.mock('@/lib/ai-seo', () => ({
  generateAIMetaTags: jest.fn(() => ({})),
}));

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

  it("returns a page title string when a custom title is provided", () => {
    const metadata = constructMetadata({ title: "Projects" });

    expect(metadata.title).toBe("Projects");
  });

  it("keeps social titles branded once for route-specific titles", () => {
    const metadata = constructMetadata({ title: "Projects" });
    const og = metadata.openGraph as { title: string };
    const twitter = metadata.twitter as { title: string };

    expect(og.title).toBe(`Projects | ${siteConfig.name}`);
    expect(twitter.title).toBe(`Projects | ${siteConfig.name}`);
  });
});

describe("generateAIOptimizedMetadata", () => {
  it("returns an uncluttered page title while branding social metadata once", () => {
    const metadata = generateAIOptimizedMetadata({
      title: "About",
      description: "Bay Area product manager",
    });

    expect(metadata.title).toBe("About");
    expect((metadata.openGraph as { title: string }).title).toBe(
      `About | ${siteConfig.name}`
    );
    expect((metadata.twitter as { title: string }).title).toBe(
      `About | ${siteConfig.name}`
    );
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
