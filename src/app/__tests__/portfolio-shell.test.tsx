import { render, screen } from "@testing-library/react";
import Home from "../page";
import PortfolioPage from "../portfolio/page";

jest.mock("@/components/StructuredData", () => ({
  StructuredData: () => null,
}));

jest.mock("@/components/AIStructuredData", () => ({
  AIStructuredData: () => null,
}));

jest.mock("@/constants/caseStudies", () => {
  const actual = jest.requireActual("@/constants/caseStudies");

  return {
    ...actual,
    // Catalog97Home reads title/timeline/overview.summary off each featured
    // project, so the stub has to carry those fields.
    getHomepageFeaturedCaseStudies: () => [
      {
        slug: "project-a",
        title: "Project A",
        description: "Project A description",
        timeline: "2026",
        overview: { summary: "What project A does.", impact: "" },
      },
    ],
  };
});

const stubPost = {
  slug: "post-a",
  title: "Post A",
  excerpt: "What post A is about.",
  readingTime: "5 min read",
  category: "Product",
  publishedAt: "2026-06-01",
};

jest.mock("@/lib/blog", () => ({
  getAllBlogPostPreviews: () => [stubPost],
  getLatestBlogPostPreviews: () => [stubPost],
  getHomepageProofOfWorkBlogPostPreviews: () => [stubPost],
}));

// Keep Jest away from the committed earthquake snapshot (it is large) — the
// shell test only cares about page semantics, not the live pulse data.
jest.mock("@/lib/earthquakeSnapshot", () => ({
  getEarthquakeSummary: async () => ({
    generatedAt: "2026-07-01T00:00:00.000Z",
    feedUpdated: null,
    heroStats: { total24h: 0, total7d: 0 },
    recent: [],
    significant: [],
    magnitudeBuckets: [],
    regions: [],
    quakeDetails: {},
  }),
}));

describe("Portfolio shell page semantics", () => {
  /*
   * These two routes moved to Catalog 97, where Catalog97Shell owns the page's
   * single <main> and ConditionalLayout stands down. The invariant being
   * guarded is unchanged — exactly one main landmark and exactly one h1 — but
   * the main now lives inside the page component rather than around it.
   */
  it("gives the homepage exactly one main landmark and one h1", async () => {
    const { container } = render(await Home());

    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /i build tools that make hard problems easier to act on/i,
      })
    ).toBeVisible();
  });

  it("gives the portfolio index exactly one main landmark and one h1", () => {
    const { container } = render(<PortfolioPage />);

    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /everything i.{0,3}ve shipped, and the decisions behind it/i,
      })
    ).toBeVisible();
  });
});
