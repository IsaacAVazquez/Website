import {
  getHomepageFeaturedCaseStudies,
  getPortfolioProjects,
  getProjectCardOutcome,
} from "../caseStudies";

const expectedPortfolioSlugs = [
  "investment-analytics-platform",
  "interchange-iq",
  "news-pulse-dashboard",
  "ai-dev-tool-ecosystem",
  "frontier-model-tracker",
  "github-trending-pulse",
  "tech-startup-tracker",
  "decision-lab",
  "food-map",
  "museum-log",
  "wine-cellar",
  "recipe-finder",
  "travel-planner",
  "travel-deal-lab",
  "budget-planner",
  "rent-vs-buy-calculator",
  "mba-role-tracker",
  "polling-aggregator",
  "spacex-mission-control",
  "bay-area-transit-pulse",
  "premier-league-pulse",
  "la-liga-pulse",
  "world-cup-pulse",
  "fantasy-football-analytics",
  "nfl-pulse",
  "formula-1-pulse",
  "fantasy-formula-1-optimizer",
  "pga-tour-pulse",
  "earthquake-pulse",
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
        "/tech-startup-tracker",
        "/decision-lab",
        "/food-map",
        "/museum-log",
        "/wine-cellar",
        "/recipe-finder",
        "/travel",
        "/travel-deals",
        "/fintech-tools/budget-planner",
        "/fintech-tools/rent-vs-buy",
        "/mba-internship-notifications",
        "/polling-aggregator",
        "/spacex-mission-control",
        "/bay-area-transit",
        "/premier-league",
        "/la-liga",
        "/world-cup-2026",
        "/fantasy-football",
        "/nfl",
        "/formula-1",
        "/fantasy-formula-1",
        "/golf",
        "/earthquake-pulse",
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

  it("uses user-facing impact for portfolio card outcomes", () => {
    const project = getPortfolioProjects().find(
      (p) => p.slug === "investment-analytics-platform"
    );

    expect(project).toBeDefined();
    // getProjectCardOutcome leads with the overview impact line.
    expect(getProjectCardOutcome(project!)).toBe(project!.overview.impact);
  });
});
