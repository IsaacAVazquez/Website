import { getHomepageFeaturedCaseStudies, getPortfolioProjects } from "../caseStudies";

describe("caseStudies helpers", () => {
  it("returns the full ordered portfolio index", () => {
    const projects = getPortfolioProjects();

    expect(projects.map((project) => project.slug)).toEqual([
      "investment-analytics-platform",
      "civic-engagement-platform",
      "data-analytics-dashboard",
      "interchange-iq",
      "test-automation-suite",
      "performance-monitoring",
      "news-pulse-dashboard",
      "budget-planner",
      "spacex-mission-control",
      "fantasy-football-analytics",
      "la-liga-pulse",
      "march-madness-2026",
    ]);
  });

  it("keeps homepage featured projects separate from the full portfolio order", () => {
    const featured = getHomepageFeaturedCaseStudies();

    expect(featured.map((project) => project.slug)).toEqual([
      "investment-analytics-platform",
      "news-pulse-dashboard",
      "spacex-mission-control",
    ]);
  });
});
