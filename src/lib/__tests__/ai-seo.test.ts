import {
  generateArticleSchema,
  generateProfilePageSchema,
  generateProjectSchema,
} from "../ai-seo";

describe("AI SEO structured-data generators", () => {
  it("does not fabricate article freshness dates", () => {
    const schema = generateArticleSchema({
      headline: "How to evaluate agentic AI products",
      description: "A PM framework for evaluating agentic AI products.",
      url: "https://isaacavazquez.com/writing/evaluate-agentic-ai-product-pm-framework",
    }) as Record<string, unknown>;

    expect(schema.datePublished).toBeUndefined();
    expect(schema.dateModified).toBeUndefined();
  });

  it("uses the published date as the article modified date when no separate modified date exists", () => {
    const schema = generateArticleSchema({
      headline: "How to evaluate agentic AI products",
      datePublished: "2026-04-10",
    }) as Record<string, unknown>;

    expect(schema.datePublished).toBe("2026-04-10");
    expect(schema.dateModified).toBe("2026-04-10");
  });

  it("uses the supplied canonical project URL for the project schema id", () => {
    const schema = generateProjectSchema({
      name: "TextOut Platform",
      description: "A case study about rebuilding a high-volume messaging platform.",
      url: "https://isaacavazquez.com/portfolio/textout-platform",
      datePublished: "2026-04-04",
      dateModified: "2026-04-04",
    }) as Record<string, unknown>;

    expect(schema["@id"]).toBe(
      "https://isaacavazquez.com/portfolio/textout-platform#project"
    );
    expect(schema.dateModified).toBe("2026-04-04");
  });

  it("only emits profile freshness when the caller provides a reviewed date", () => {
    const schema = generateProfilePageSchema({
      person: { name: "Isaac Vazquez" },
      url: "https://isaacavazquez.com/about",
    }) as Record<string, unknown>;

    expect(schema.dateModified).toBeUndefined();
  });
});
