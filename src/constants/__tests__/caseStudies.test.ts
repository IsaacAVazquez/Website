import { getHomepageFeaturedCaseStudies, getPortfolioProjects } from "../caseStudies";

const expectedPortfolioSlugs = [
  "investment-analytics-platform",
  "interchange-iq",
  "news-pulse-dashboard",
  "ai-dev-tool-ecosystem",
  "frontier-model-tracker",
  "github-trending-pulse",
  "decision-lab",
  "food-map",
  "museum-log",
  "wine-cellar",
  "recipe-finder",
  "budget-planner",
  "mba-role-tracker",
  "polling-aggregator",
  "spacex-mission-control",
  "premier-league-pulse",
  "la-liga-pulse",
  "fantasy-football-analytics",
  "nfl-pulse",
  "formula-1-pulse",
  "pga-tour-pulse",
  "mlb-pulse",
  "nba-pulse",
  "march-madness-2026",
] as const;

describe("caseStudies helpers", () => {
  it("returns the full ordered portfolio index", () => {
    const projects = getPortfolioProjects();

    expect(projects.map((project) => project.slug)).toEqual(expectedPortfolioSlugs);
    expect(new Set(projects.map((project) => project.slug)).size).toBe(
      projects.length
    );
  });

  it("includes each live project route in the portfolio", () => {
    const projectLinks = new Set(
      getPortfolioProjects().flatMap((project) => (project.link ? [project.link] : []))
    );

    expect(projectLinks).toEqual(
      new Set([
        "/investments",
        "/fintech-tools/interchange-iq",
        "/news-pulse",
        "/ai-dev-tools",
        "/frontier-models",
        "/github-trending-pulse",
        "/decision-lab",
        "/food-map",
        "/museum-log",
        "/wine-cellar",
        "/recipe-finder",
        "/fintech-tools/budget-planner",
        "/mba-internship-notifications",
        "/polling-aggregator",
        "/spacex-mission-control",
        "/premier-league",
        "/la-liga",
        "/fantasy-football",
        "/nfl",
        "/formula-1",
        "/golf",
        "/mlb",
        "/nba",
        "/march-madness-2026",
      ])
    );
  });

  it("keeps homepage featured projects separate from the full portfolio order", () => {
    const featured = getHomepageFeaturedCaseStudies();

    expect(featured.map((project) => project.slug)).toEqual([
      "investment-analytics-platform",
      "news-pulse-dashboard",
      "interchange-iq",
    ]);
  });
});
