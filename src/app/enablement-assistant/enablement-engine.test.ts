import {
  DEFAULT_TEAM_INTAKE,
  TOOLCHAIN_CATALOG,
  TROUBLESHOOTING_PROMPTS,
  type TeamIntake,
} from "./enablement-data";
import {
  BASE_SCORE,
  generateOnboardingPlan,
  matchTroubleshootingQuestion,
  recommendToolchains,
  RECOMMENDATION_CONFIDENCE_THRESHOLD,
  scoreToolchain,
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

  it("scores every stack as the starting score plus its factors, held between 0 and 100", () => {
    const intakes = [
      DEFAULT_TEAM_INTAKE,
      // The strongest fit runs past 100 before it is held.
      intakeWith({
        surface: "mobile",
        language: "swift",
        maturity: "mature",
        hasQualityEngineer: true,
        layers: ["unit", "integration", "e2e", "performance", "accessibility"],
      }),
      intakeWith({ language: "other", ci: "other" }),
    ];

    for (const entry of intakes) {
      for (const toolchain of TOOLCHAIN_CATALOG) {
        const { score, factors } = scoreToolchain(entry, toolchain);
        const raw = BASE_SCORE + factors.reduce((sum, factor) => sum + factor.points, 0);
        expect(score).toBe(Math.min(100, Math.max(0, raw)));
      }
    }
  });

  it("words the layer factor for no layers and for one layer", () => {
    const layerDetail = (layers: TeamIntake["layers"]) =>
      scoreToolchain(intakeWith({ layers }), TOOLCHAIN_CATALOG[0]).factors.find(
        (factor) => factor.label === "Needed test layers"
      )!.detail;

    expect(layerDetail([])).toBe("No test layers are selected.");
    expect(layerDetail(["unit"])).toBe("It covers the one selected test layer.");
    expect(layerDetail(["unit", "integration"])).toBe("It covers all 2 selected test layers.");
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

  it("says so in the first snippet when no layer is selected", () => {
    const plan = generateOnboardingPlan(intakeWith({ maturity: "none", layers: [] }));

    expect(plan[0].snippet).toContain("layers: None selected");
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

  it("answers every seeded question marked answerable, whichever stack is recommended", () => {
    const declined = TROUBLESHOOTING_PROMPTS.filter((prompt) => prompt.answerable).flatMap((prompt) =>
      TOOLCHAIN_CATALOG.filter(
        (toolchain) => matchTroubleshootingQuestion(prompt.question, toolchain.id).shouldEscalate
      ).map((toolchain) => `${prompt.question} on ${toolchain.id}`)
    );

    expect(declined).toEqual([]);
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
