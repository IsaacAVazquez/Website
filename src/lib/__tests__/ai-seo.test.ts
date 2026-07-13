import {
  generateAIMetaTags,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateEnhancedPersonSchema,
  generateFAQSchema,
  generateItemListSchema,
  generateNavigationSchema,
  generatePageSummary,
  generateProfessionalServiceSchema,
  generateProfilePageSchema,
  generateProjectSchema,
  type PersonSchemaData,
} from "../ai-seo";

// generateArticleSchema handles string authors/keywords at runtime (via typeof /
// Array.isArray guards), but ArticleSchemaData types them narrower. Cast the raw
// strings so tsc is satisfied while still exercising those runtime branches.
const stringAuthor = (name: string) => name as unknown as PersonSchemaData;
const stringKeywords = (value: string) => value as unknown as string[];

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

  it("emits profile freshness and mainEntity when a reviewed date is supplied", () => {
    const schema = generateProfilePageSchema({
      person: { name: "Isaac Vazquez" },
      lastReviewed: "2026-05-01",
    }) as Record<string, unknown>;

    expect(schema.dateModified).toBe("2026-05-01");
    expect((schema.mainEntity as Record<string, unknown>)["@type"]).toBe(
      "Person"
    );
  });
});

describe("generateAIMetaTags", () => {
  it("returns an empty object when nothing is provided", () => {
    expect(generateAIMetaTags({})).toEqual({});
  });

  it("serializes list fields with commas and duplicates topics into article:tag", () => {
    const tags = generateAIMetaTags({
      expertise: ["Product", "QA"],
      specialty: "AI products",
      profession: "PM",
      industry: ["SaaS", "Civic"],
      topics: ["evals", "agents"],
      contentType: "article",
      context: "portfolio",
      summary: "A short summary",
      primaryFocus: "product strategy",
    });

    expect(tags.expertise).toBe("Product, QA");
    expect(tags.industry).toBe("SaaS, Civic");
    expect(tags.topics).toBe("evals, agents");
    expect(tags["article:tag"]).toBe("evals, agents");
    expect(tags["content-type"]).toBe("article");
    expect(tags["primary-focus"]).toBe("product strategy");
  });

  it("skips empty arrays", () => {
    const tags = generateAIMetaTags({ expertise: [], industry: [], topics: [] });
    expect(tags.expertise).toBeUndefined();
    expect(tags.topics).toBeUndefined();
  });
});

describe("generateEnhancedPersonSchema", () => {
  it("applies site defaults when only minimal data is supplied", () => {
    const schema = generateEnhancedPersonSchema({}) as Record<string, unknown>;
    expect(schema["@type"]).toBe("Person");
    expect(Array.isArray(schema.sameAs)).toBe(true);
    expect(schema.jobTitle).toBeUndefined();
    expect(schema.knowsAbout).toBeUndefined();
  });

  it("maps every optional block when fully populated", () => {
    const schema = generateEnhancedPersonSchema({
      name: "Isaac",
      jobTitle: "PM",
      email: "hi@example.com",
      telephone: "+1-555-0100",
      address: { addressLocality: "Austin", addressRegion: "TX" },
      knowsAbout: ["Product"],
      expertise: [
        {
          name: "Testing",
          proficiencyLevel: "Expert",
          yearsExperience: 8,
          description: "QA",
        },
      ],
      awards: [
        { name: "Award A", dateAwarded: "2025", awarder: "Org" },
        { name: "Award B", awarder: { name: "Committee" } },
      ],
      alumniOf: [
        {
          "@type": "CollegeOrUniversity",
          name: "FSU",
          address: { addressLocality: "Tallahassee" },
          url: "https://fsu.edu",
          startDate: "2012",
          endDate: "2016",
        },
      ],
      worksFor: {
        name: "Civitech",
        description: "Civic tech",
        url: "https://civitech.io",
        address: { addressLocality: "Austin" },
      },
      hasOccupation: [
        {
          "@type": "Occupation",
          name: "PM",
          skills: ["roadmapping"],
          responsibilities: ["strategy"],
          occupationLocation: { "@type": "City", name: "Austin" },
          startDate: "2020",
          endDate: "2024",
          employer: { name: "Civitech" },
        },
      ],
      memberOf: [{ name: "PMA", description: "Assoc", url: "https://pma.org" }],
      seeks: "Product leadership roles",
    }) as Record<string, unknown>;

    expect(schema.jobTitle).toBe("PM");
    expect(schema.email).toBe("hi@example.com");
    expect(schema.telephone).toBe("+1-555-0100");
    expect((schema.address as Record<string, unknown>)["@type"]).toBe(
      "PostalAddress"
    );
    expect(schema.knowsAbout).toEqual(["Product"]);
    const credentials = schema.hasCredential as Array<Record<string, unknown>>;
    expect(credentials[0].validFor).toBe("P8Y");
    const awards = schema.award as Array<Record<string, unknown>>;
    expect(awards[0].awarder).toBe("Org");
    expect((awards[1].awarder as Record<string, unknown>).name).toBe(
      "Committee"
    );
    expect((schema.alumniOf as Array<Record<string, unknown>>)[0].url).toBe(
      "https://fsu.edu"
    );
    expect((schema.worksFor as Record<string, unknown>).name).toBe("Civitech");
    expect(
      (schema.hasOccupation as Array<Record<string, unknown>>)[0].skills
    ).toEqual(["roadmapping"]);
    expect((schema.memberOf as Array<Record<string, unknown>>)[0].name).toBe(
      "PMA"
    );
    expect(schema.seeks).toBe("Product leadership roles");
  });
});

describe("generateProfessionalServiceSchema", () => {
  it("falls back to defaults when nothing is provided", () => {
    const schema = generateProfessionalServiceSchema({}) as Record<
      string,
      unknown
    >;
    expect(schema["@type"]).toBe("ProfessionalService");
    expect(Array.isArray(schema.serviceType)).toBe(true);
    expect((schema.provider as Record<string, unknown>)["@type"]).toBe("Person");
    expect(schema.audience).toBeUndefined();
  });

  it("expands the provider schema and includes an audience when given", () => {
    const schema = generateProfessionalServiceSchema({
      name: "Advisory",
      provider: { name: "Isaac", jobTitle: "PM" },
      serviceType: ["Discovery"],
      areaServed: ["Remote"],
      audience: { "@type": "ProfessionalAudience", audienceType: "Founders" },
    }) as Record<string, unknown>;

    expect(schema.name).toBe("Advisory");
    expect((schema.provider as Record<string, unknown>).jobTitle).toBe("PM");
    expect((schema.audience as Record<string, unknown>).audienceType).toBe(
      "Founders"
    );
  });
});

describe("generateArticleSchema (rich fields)", () => {
  it("normalizes images, multiple authors, keywords, and metadata blocks", () => {
    const schema = generateArticleSchema({
      headline: "Piece",
      image: ["a.png", "b.png"],
      author: [{ name: "Isaac" }, stringAuthor("Guest Writer")],
      publisher: { name: "Self", url: "https://isaacavazquez.com" },
      articleSection: "Essays",
      articleBody: "Body text",
      wordCount: 1200,
      keywords: ["a", "b"],
      about: [{ "@type": "Thing", name: "AI" }],
      mentions: [{ "@type": "Thing", name: "Next.js" }],
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".x"] },
      genre: "Technical",
      audience: { "@type": "Audience", audienceType: "PMs" },
    }) as Record<string, unknown>;

    expect(schema.image).toEqual(["a.png", "b.png"]);
    expect(Array.isArray(schema.author)).toBe(true);
    expect((schema.author as unknown[]).length).toBe(2);
    expect(schema.articleSection).toBe("Essays");
    expect(schema.wordCount).toBe(1200);
    expect(schema.keywords).toBe("a, b");
    expect(schema.genre).toBe("Technical");
    expect((schema.publisher as Record<string, unknown>).url).toBe(
      "https://isaacavazquez.com"
    );
  });

  it("unwraps a single author into an object rather than an array", () => {
    const schema = generateArticleSchema({
      headline: "Piece",
      author: stringAuthor("Solo Author"),
      keywords: stringKeywords("single-string"),
    }) as Record<string, unknown>;

    expect(Array.isArray(schema.author)).toBe(false);
    expect((schema.author as Record<string, unknown>).name).toBe("Solo Author");
    expect(schema.keywords).toBe("single-string");
  });
});

describe("generateProjectSchema (rich fields)", () => {
  it("derives the id from the slug and maps skills, tech, and narrative", () => {
    const schema = generateProjectSchema({
      name: "QA Platform",
      description: "desc",
      image: "cover.png",
      author: { name: "Isaac" },
      creator: { name: "Isaac" },
      keywords: ["qa"],
      programmingLanguage: ["TypeScript"],
      applicationCategory: "DeveloperApplication",
      about: [{ "@type": "Thing", name: "Testing" }],
      skillsUsed: ["Playwright"],
      problemSolved: "flaky tests",
      solutionDescription: "stable harness",
      impact: "faster releases",
      technologies: ["Jest"],
      isPartOf: { "@type": "Thing", name: "Portfolio" },
    }) as Record<string, unknown>;

    expect(schema["@id"]).toBe(
      "https://isaacavazquez.com/portfolio/qa-platform#project"
    );
    expect(schema.image).toEqual(["cover.png"]);
    expect((schema.teaches as Array<Record<string, unknown>>)[0].name).toBe(
      "Playwright"
    );
    expect(schema.abstract).toContain("Problem: flaky tests");
    expect(schema.abstract).toContain("Impact: faster releases");
    expect((schema.mentions as Array<Record<string, unknown>>)[0].name).toBe(
      "Jest"
    );
    expect(schema.isPartOf).toEqual({ "@type": "Thing", name: "Portfolio" });
  });
});

describe("generateFAQSchema", () => {
  it("builds question/answer pairs with optional author and date", () => {
    const schema = generateFAQSchema([
      { question: "Q1?", answer: "A1", dateCreated: "2026-01-01" },
      { question: "Q2?", answer: "A2", author: { name: "Isaac" } },
    ]) as Record<string, unknown>;

    const entities = schema.mainEntity as Array<Record<string, unknown>>;
    expect(entities).toHaveLength(2);
    const first = entities[0].acceptedAnswer as Record<string, unknown>;
    expect(first.dateCreated).toBe("2026-01-01");
    const second = entities[1].acceptedAnswer as Record<string, unknown>;
    expect((second.author as Record<string, unknown>).name).toBe("Isaac");
  });
});

describe("generateBreadcrumbSchema", () => {
  it("resolves relative and absolute item urls", () => {
    const schema = generateBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "External", url: "https://example.com", position: 5 },
    ]) as Record<string, unknown>;

    const items = schema.itemListElement as Array<Record<string, unknown>>;
    expect(items[0].item).toBe("https://isaacavazquez.com/");
    expect(items[1].item).toBe("https://example.com");
    expect(items[1].position).toBe(5);
  });
});

describe("generateItemListSchema", () => {
  it("counts items and includes optional per-item fields", () => {
    const schema = generateItemListSchema({
      name: "Portfolio",
      items: [
        { name: "One", url: "/one", description: "d", image: "i.png" },
        { name: "Two", url: "/two" },
      ],
    }) as Record<string, unknown>;

    expect(schema.numberOfItems).toBe(2);
    const items = schema.itemListElement as Array<Record<string, unknown>>;
    expect(items[0].description).toBe("d");
    expect(items[0].image).toBe("i.png");
    expect(items[1].description).toBeUndefined();
  });
});

describe("generateNavigationSchema", () => {
  it("builds webpage parts with resolved ids and urls", () => {
    const schema = generateNavigationSchema([
      { name: "About", url: "/about" },
      { name: "Ext", url: "https://example.com/x" },
    ]) as Record<string, unknown>;

    const parts = schema.hasPart as Array<Record<string, unknown>>;
    expect(parts[0]["@id"]).toBe("https://isaacavazquez.com/about#webpage");
    expect(parts[1]["@id"]).toBe("https://example.com/x#webpage");
    expect(parts[1].url).toBe("https://example.com/x");
  });
});

describe("generatePageSummary", () => {
  it("produces structured and natural-language summaries with optional fields", () => {
    const summary = generatePageSummary({
      title: "About",
      purpose: "introduce Isaac",
      mainTopics: ["product", "qa"],
      targetAudience: "recruiters",
      keyTakeaways: ["hire him"],
      context: "portfolio site",
    });

    expect(summary.structured.title).toBe("About");
    expect((summary.structured as Record<string, unknown>).targetAudience).toBe(
      "recruiters"
    );
    expect(summary.text).toContain('titled "About"');
    expect(summary.text).toContain("Key takeaways: hire him");
    expect(summary.text).not.toMatch(/\s{2,}/);
  });

  it("omits optional clauses when not provided", () => {
    const summary = generatePageSummary({
      title: "Now",
      purpose: "show current work",
      mainTopics: ["projects"],
    });

    expect(
      (summary.structured as Record<string, unknown>).targetAudience
    ).toBeUndefined();
    expect(summary.text).not.toContain("Target audience");
    expect(summary.text).not.toContain("Key takeaways");
  });
});
