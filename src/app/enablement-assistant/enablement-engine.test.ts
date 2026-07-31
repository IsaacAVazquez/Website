import {
  DEFAULT_TEAM_INTAKE,
  type TeamIntake,
} from "./enablement-data";
import {
  generateOnboardingPlan,
  matchTroubleshootingQuestion,
  recommendToolchains,
  RECOMMENDATION_CONFIDENCE_THRESHOLD,
} from "./enablement-engine";

function intakeWith(overrides: Partial<TeamIntake>): TeamIntake {
  return {
    ...DEFAULT_TEAM_INTAKE,
    layers: [...DEFAULT_TEAM_INTAKE.layers],
    ...overrides,
  };
}

describe("enablement recommendation engine", () => {
  it("recommends the web standard for a TypeScript web team and explains every score factor", () => {
    const recommendation = recommendToolchains(DEFAULT_TEAM_INTAKE);

    expect(recommendation.primary.toolchain.id).toBe("web-typescript");
    expect(recommendation.primary.score).toBeGreaterThanOrEqual(
      RECOMMENDATION_CONFIDENCE_THRESHOLD
    );
    expect(recommendation.shouldEscalate).toBe(false);
    expect(recommendation.primary.factors.map((factor) => factor.label)).toEqual([
      "Product surface",
      "Primary language",
      "Needed test layers",
      "CI integration",
      "Migration shape",
      "Team ownership",
    ]);
  });

  it("changes the recommendation when the surface and language change", () => {
    const recommendation = recommendToolchains(
      intakeWith({
        surface: "mobile",
        language: "swift",
        maturity: "mature",
        hasQualityEngineer: true,
        layers: ["unit", "integration", "e2e", "performance", "accessibility"],
      })
    );

    expect(recommendation.primary.toolchain.id).toBe("ios-native");
    expect(recommendation.runnerUp.toolchain.id).toBe("mobile-cross-platform");
  });

  it("routes an unsupported language and custom CI system to a human", () => {
    const recommendation = recommendToolchains(
      intakeWith({
        language: "other",
        ci: "other",
      })
    );

    expect(recommendation.primary.score).toBeLessThan(
      RECOMMENDATION_CONFIDENCE_THRESHOLD
    );
    expect(recommendation.shouldEscalate).toBe(true);
    expect(generateOnboardingPlan(intakeWith({ language: "other", ci: "other" }))).toEqual(
      []
    );
  });
});

describe("enablement onboarding plan", () => {
  it("builds a first-setup plan for a team without automation", () => {
    const plan = generateOnboardingPlan(
      intakeWith({
        maturity: "none",
      })
    );

    expect(plan).toHaveLength(5);
    expect(plan[0].title).toBe("Name the first workflows");
    expect(plan[1].title).toContain("workspace");
    expect(plan.every((step) => step.owner && step.effort && step.snippet)).toBe(true);
  });

  it("builds a parallel migration plan for a mature suite", () => {
    const matureIntake = intakeWith({ maturity: "mature" });
    const plan = generateOnboardingPlan(matureIntake);

    expect(plan).toHaveLength(5);
    expect(plan[0].title).toBe("Inventory the existing suite");
    expect(plan.map((step) => step.title)).toContain("Run both stacks in parallel");
    expect(plan.map((step) => step.title)).toContain(
      "Move critical coverage and retire the old job"
    );
  });
});

describe("enablement troubleshooting retrieval", () => {
  it("returns a seeded answer above the confidence threshold", () => {
    const result = matchTroubleshootingQuestion(
      "Playwright cannot find the Chromium browser in CI",
      "web-typescript"
    );

    expect(result.shouldEscalate).toBe(false);
    expect(result.article?.id).toBe("playwright-browsers");
  });

  it("declines a deliberately unsupported private integration question", () => {
    const result = matchTroubleshootingQuestion(
      "Can you debug our private device farm VPN handshake?",
      "mobile-cross-platform"
    );

    expect(result.shouldEscalate).toBe(true);
    expect(result.article).toBeNull();
  });
});
