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
    getHomepageFeaturedCaseStudies: () => [{ slug: "project-a" }],
  };
});

jest.mock("@/lib/blog", () => ({
  getAllBlogPostPreviews: () => [{ slug: "post-a" }],
  getLatestBlogPostPreviews: () => [{ slug: "post-a" }],
  getHomepageProofOfWorkBlogPostPreviews: () => [{ slug: "post-a" }],
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

jest.mock("@/components/home/HomeInstrument", () => ({
  HomeInstrument: () => (
    <div data-testid="home-page-content">
      <section data-testid="hero">
        <h1>I build tools that make hard problems easier to act on.</h1>
      </section>
      <section>
        <h2>Selected work</h2>
      </section>
      <section>
        <h2>About</h2>
      </section>
      <section>
        <h2>Live tools</h2>
      </section>
      <section>
        <h2>Recent writing</h2>
      </section>
      <section>
        <h2>Contact</h2>
      </section>
    </div>
  ),
}));

jest.mock("@/components/portfolio/PortfolioInstrument", () => ({
  PortfolioInstrument: () => (
    <div data-testid="portfolio-page-content">
      <h1>All projects across product, analytics, and tooling.</h1>
    </div>
  ),
}));

describe("Portfolio shell page semantics", () => {
  it("keeps the homepage page component free of nested main landmarks", async () => {
    const { container } = render(await Home());

    expect(container.querySelectorAll("main")).toHaveLength(0);
    expect(screen.getByTestId("hero")).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(5);
  });

  it("keeps the portfolio index page free of nested main landmarks", () => {
    const { container } = render(<PortfolioPage />);

    expect(container.querySelectorAll("main")).toHaveLength(0);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /all projects across product, analytics, and tooling/i,
      })
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
