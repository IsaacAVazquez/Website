import {
  CI_OPTIONS,
  DOCUMENTATION_GAPS,
  ENABLEMENT_TEAM_SNAPSHOTS,
  LABELS,
  TOOLCHAIN_CATALOG,
  TROUBLESHOOTING_ARTICLES,
  type AutomationMaturity,
  type CiSystem,
  type TeamIntake,
  type ToolchainCatalogEntry,
  type TroubleshootingArticle,
} from "./enablement-data";

export const RECOMMENDATION_CONFIDENCE_THRESHOLD = 56;
export const TROUBLESHOOTING_CONFIDENCE_THRESHOLD = 0.55;

export interface ScoreFactor {
  label: string;
  points: number;
  detail: string;
}

export interface ScoredToolchain {
  toolchain: ToolchainCatalogEntry;
  score: number;
  factors: ScoreFactor[];
}

export interface ToolchainRecommendation {
  primary: ScoredToolchain;
  runnerUp: ScoredToolchain;
  shouldEscalate: boolean;
  threshold: number;
}

export interface OnboardingPlanStep {
  id: string;
  order: number;
  title: string;
  description: string;
  owner: string;
  effort: string;
  prerequisites: string;
  snippet: string;
}

export interface TroubleshootingMatch {
  article: TroubleshootingArticle | null;
  confidence: number;
  shouldEscalate: boolean;
  matchedTerms: string[];
}

export interface ProgramMetrics {
  teamCount: number;
  totalQuestions: number;
  resolvedQuestions: number;
  resolutionRate: number;
  standardTeams: number;
  adoptionRate: number;
  driftTeams: number;
  topGapCount: number;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function maturityComplexityTarget(maturity: AutomationMaturity): 1 | 2 | 3 {
  if (maturity === "mature") return 3;
  if (maturity === "scripts") return 2;
  return 1;
}

export function scoreToolchain(
  intake: TeamIntake,
  toolchain: ToolchainCatalogEntry
): ScoredToolchain {
  const factors: ScoreFactor[] = [];
  let score = 18;

  const surfaceMatch = toolchain.surfaces.includes(intake.surface);
  const surfacePoints = surfaceMatch ? 24 : -24;
  score += surfacePoints;
  factors.push({
    label: "Product surface",
    points: surfacePoints,
    detail: surfaceMatch
      ? `${toolchain.name} is designed for ${LABELS.surfaces[intake.surface].toLowerCase()} teams.`
      : `${toolchain.name} is not designed around a ${LABELS.surfaces[intake.surface].toLowerCase()} surface.`,
  });

  const languageMatch = toolchain.languages.includes(intake.language);
  const languagePoints = languageMatch ? 18 : intake.language === "other" ? -16 : -13;
  score += languagePoints;
  factors.push({
    label: "Primary language",
    points: languagePoints,
    detail: languageMatch
      ? `${LABELS.languages[intake.language]} is a native fit for this stack.`
      : `The catalog does not have a reliable ${LABELS.languages[intake.language]} path for this stack.`,
  });

  const matchedLayers = intake.layers.filter((layer) => toolchain.layers.includes(layer));
  const missingLayers = intake.layers.filter((layer) => !toolchain.layers.includes(layer));
  const layerPoints =
    intake.layers.length === 0
      ? -8
      : Math.round(
          (matchedLayers.length / intake.layers.length) * 22 -
            (missingLayers.length / intake.layers.length) * 12
        );
  score += layerPoints;
  factors.push({
    label: "Needed test layers",
    points: layerPoints,
    detail:
      missingLayers.length === 0
        ? `It covers all ${matchedLayers.length} selected test layers.`
        : `It covers ${matchedLayers.length} of ${intake.layers.length}; ${missingLayers
            .map((layer) => LABELS.layers[layer].toLowerCase())
            .join(", ")} would need a separate path.`,
  });

  const ciMatch = intake.ci !== "other" && toolchain.ciSystems.includes(intake.ci);
  const ciPoints = ciMatch ? 9 : intake.ci === "other" ? -11 : -7;
  score += ciPoints;
  factors.push({
    label: "CI integration",
    points: ciPoints,
    detail: ciMatch
      ? `${LABELS.ci[intake.ci]} has a supported integration in the seeded standard.`
      : `${LABELS.ci[intake.ci]} needs a human review before I can recommend the integration.`,
  });

  const complexityTarget = maturityComplexityTarget(intake.maturity);
  const complexityDistance = Math.abs(toolchain.complexity - complexityTarget);
  const maturityPoints = complexityDistance === 0 ? 8 : complexityDistance === 1 ? 2 : -7;
  score += maturityPoints;
  factors.push({
    label: "Migration shape",
    points: maturityPoints,
    detail:
      complexityDistance === 0
        ? `The setup depth fits a team at the ${LABELS.maturity[intake.maturity].toLowerCase()} stage.`
        : `The setup depth is ${toolchain.complexity > complexityTarget ? "heavier" : "lighter"} than I would normally use for a team at this stage.`,
  });

  let ownershipPoints = 3;
  let ownershipDetail = "The stack can be owned by the product team with central guidance.";
  if (toolchain.needsQualityEngineer && !intake.hasQualityEngineer) {
    ownershipPoints = -7;
    ownershipDetail =
      "This stack usually needs dedicated quality ownership, and the team does not have that role.";
  } else if (toolchain.needsQualityEngineer && intake.hasQualityEngineer) {
    ownershipPoints = 5;
    ownershipDetail = "The dedicated quality engineer makes the heavier operating work realistic.";
  } else if (intake.teamSize === "small" && toolchain.complexity === 3) {
    ownershipPoints = -4;
    ownershipDetail = "This is a heavy stack for a team of 2 to 5 people to maintain.";
  }
  score += ownershipPoints;
  factors.push({
    label: "Team ownership",
    points: ownershipPoints,
    detail: ownershipDetail,
  });

  return {
    toolchain,
    score: clampScore(score),
    factors,
  };
}

export function recommendToolchains(intake: TeamIntake): ToolchainRecommendation {
  const ranked = TOOLCHAIN_CATALOG.map((toolchain) => scoreToolchain(intake, toolchain)).sort(
    (a, b) => b.score - a.score || a.toolchain.name.localeCompare(b.toolchain.name)
  );

  return {
    primary: ranked[0],
    runnerUp: ranked[1],
    shouldEscalate: ranked[0].score < RECOMMENDATION_CONFIDENCE_THRESHOLD,
    threshold: RECOMMENDATION_CONFIDENCE_THRESHOLD,
  };
}

function ciFileName(ci: CiSystem): string {
  const option = CI_OPTIONS.find((entry) => entry.value === ci);
  return option?.label ?? "CI";
}

function buildCiSnippet(intake: TeamIntake, toolchain: ToolchainCatalogEntry): string {
  if (intake.ci === "github") {
    return `- name: Run the standard suite\n  run: ${toolchain.testCommand}\n- name: Upload test results\n  if: always()\n  uses: actions/upload-artifact@v4\n  with:\n    name: test-results\n    path: reports/`;
  }
  if (intake.ci === "gitlab") {
    return `standard-tests:\n  script:\n    - ${toolchain.testCommand}\n  artifacts:\n    when: always\n    reports:\n      junit: reports/junit.xml`;
  }
  if (intake.ci === "jenkins") {
    return `stage('Standard tests') {\n  steps { sh '${toolchain.testCommand}' }\n  post { always { junit 'reports/*.xml' } }\n}`;
  }
  if (intake.ci === "circle") {
    return `- run:\n    name: Run the standard suite\n    command: ${toolchain.testCommand}\n- store_test_results:\n    path: reports/`;
  }
  if (intake.ci === "azure") {
    return `- script: ${toolchain.testCommand}\n  displayName: Run the standard suite\n- task: PublishTestResults@2\n  inputs:\n    testResultsFiles: 'reports/*.xml'`;
  }
  return `# ${ciFileName(intake.ci)} needs a reviewed adapter.\n${toolchain.testCommand}`;
}

function greenfieldPlan(
  intake: TeamIntake,
  toolchain: ToolchainCatalogEntry
): OnboardingPlanStep[] {
  const selectedLayers = intake.layers.map((layer) => LABELS.layers[layer]).join(", ");
  return [
    {
      id: "scope",
      order: 1,
      title: "Name the first workflows",
      description:
        "Choose a small set of critical checks and write down what each one proves before installing tools.",
      owner: "Product team",
      effort: "Half day",
      prerequisites: "A list of the workflows that would block a release",
      snippet: `# First coverage boundary\nsurface: ${intake.surface}\nlayers: ${selectedLayers}\ncritical_workflows:\n  - replace-with-first-workflow`,
    },
    {
      id: "install",
      order: 2,
      title: `Create the ${toolchain.name} workspace`,
      description:
        "Install the committed standard and add one shared test directory with naming rules the whole team can read.",
      owner: "Developer",
      effort: "Half day",
      prerequisites: "Step 1 and a clean dependency install",
      snippet: toolchain.installCommand,
    },
    {
      id: "first-test",
      order: 3,
      title: "Prove one critical path",
      description:
        "Automate one representative workflow and keep its fixtures close to the test so the pattern is easy to copy.",
      owner: intake.hasQualityEngineer ? "Quality engineer" : "Developer",
      effort: "1 day",
      prerequisites: "The runner works locally",
      snippet: `${toolchain.testCommand}\n# Keep this command green before adding more coverage.`,
    },
    {
      id: "ci",
      order: 4,
      title: `Run the suite in ${ciFileName(intake.ci)}`,
      description:
        "Use the same command locally and in CI, and publish the result even when the test step fails.",
      owner: "Developer",
      effort: "Half day",
      prerequisites: "The first test passes locally",
      snippet: buildCiSnippet(intake, toolchain),
    },
    {
      id: "ownership",
      order: 5,
      title: "Set the maintenance rule",
      description:
        "Name who reviews failures, how quickly broken tests are fixed, and when the central team should be pulled in.",
      owner: "Engineering lead",
      effort: "1 hour",
      prerequisites: "A visible CI report",
      snippet:
        "owners:\n  suite: product-team\n  ci-integration: platform-enablement\nbroken-test-response: same-business-day",
    },
  ];
}

function migrationPlan(
  intake: TeamIntake,
  toolchain: ToolchainCatalogEntry
): OnboardingPlanStep[] {
  return [
    {
      id: "inventory",
      order: 1,
      title: "Inventory the existing suite",
      description:
        "Count tests by layer, identify the current runner and report formats, and mark the workflows that cannot lose coverage.",
      owner: intake.hasQualityEngineer ? "Quality engineer" : "Senior developer",
      effort: "1 day",
      prerequisites: "Access to the current suite and recent CI history",
      snippet:
        "current_runner: replace-me\nreport_format: replace-me\ncritical_paths:\n  - replace-with-protected-workflow",
    },
    {
      id: "mapping",
      order: 2,
      title: `Map the suite to ${toolchain.name}`,
      description:
        "Decide which tests move directly, which ones should be rewritten at a lower layer, and which ones should be retired.",
      owner: "Product team",
      effort: "1 day",
      prerequisites: "The inventory from step 1",
      snippet: `target_framework: ${toolchain.framework}\ntarget_runner: ${toolchain.runner}\ntarget_reporting: ${toolchain.reporting}`,
    },
    {
      id: "parallel",
      order: 3,
      title: "Run both stacks in parallel",
      description:
        "Install the new runner and move one critical workflow while the existing suite still protects releases.",
      owner: "Developer",
      effort: "2 to 3 days",
      prerequisites: "A reviewed migration map",
      snippet: `${toolchain.installCommand}\n${toolchain.testCommand}`,
    },
    {
      id: "reports",
      order: 4,
      title: "Normalize the CI report",
      description:
        "Publish the standard report beside the legacy result and confirm that both are readable from the same build.",
      owner: "Developer",
      effort: "1 day",
      prerequisites: "One migrated workflow is stable",
      snippet: buildCiSnippet(intake, toolchain),
    },
    {
      id: "cutover",
      order: 5,
      title: "Move critical coverage and retire the old job",
      description:
        "Cut over one layer at a time, preserve recent report history, and remove the legacy CI job only after the new suite has stayed stable.",
      owner: "Engineering lead",
      effort: "1 to 2 weeks",
      prerequisites: "Two stable parallel runs and an agreed rollback point",
      snippet:
        "cutover_rule:\n  stable_parallel_runs: 2\n  preserve_report_history: true\n  rollback_owner: engineering-lead",
    },
  ];
}

export function generateOnboardingPlan(
  intake: TeamIntake,
  recommendation: ToolchainRecommendation = recommendToolchains(intake)
): OnboardingPlanStep[] {
  if (recommendation.shouldEscalate) return [];

  const toolchain = recommendation.primary.toolchain;
  return intake.maturity === "none" || intake.maturity === "manual"
    ? greenfieldPlan(intake, toolchain)
    : migrationPlan(intake, toolchain);
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "do",
  "for",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "our",
  "the",
  "to",
  "we",
  "with",
]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function matchTroubleshootingQuestion(
  question: string,
  toolchainId?: string
): TroubleshootingMatch {
  const queryTokens = new Set(tokenize(question));
  if (queryTokens.size === 0) {
    return { article: null, confidence: 0, shouldEscalate: true, matchedTerms: [] };
  }

  const ranked = TROUBLESHOOTING_ARTICLES.map((article) => {
    const matchedTerms = article.keywords.filter((keyword) => queryTokens.has(keyword));
    const toolchainBoost = toolchainId && article.toolchains.includes(toolchainId) ? 0.08 : 0;
    const titleTokens = new Set(tokenize(article.title));
    const titleOverlap = [...queryTokens].filter((token) => titleTokens.has(token)).length;
    const confidence = Math.min(
      0.98,
      0.12 + matchedTerms.length * 0.12 + Math.min(titleOverlap, 3) * 0.05 + toolchainBoost
    );
    return { article, confidence, matchedTerms };
  }).sort(
    (a, b) =>
      b.confidence - a.confidence ||
      b.matchedTerms.length - a.matchedTerms.length ||
      a.article.title.localeCompare(b.article.title)
  );

  const best = ranked[0];
  const confidence = Number(best.confidence.toFixed(2));
  const shouldEscalate = confidence < TROUBLESHOOTING_CONFIDENCE_THRESHOLD;

  return {
    article: shouldEscalate ? null : best.article,
    confidence,
    shouldEscalate,
    matchedTerms: best.matchedTerms,
  };
}

export function buildEscalationDraft({
  intake,
  recommendation,
  question,
  attempted,
}: {
  intake: TeamIntake;
  recommendation: ToolchainRecommendation;
  question: string;
  attempted: string;
}): string {
  const toolchain = recommendation.shouldEscalate
    ? `No recommendation cleared the ${recommendation.threshold}% confidence threshold`
    : `${recommendation.primary.toolchain.name} at ${recommendation.primary.score}% confidence`;

  return [
    "Automation enablement support request",
    "",
    `Team context: ${LABELS.surfaces[intake.surface]}, ${LABELS.languages[intake.language]}, ${LABELS.ci[intake.ci]}, ${LABELS.maturity[intake.maturity].toLowerCase()}, ${LABELS.teamSize[intake.teamSize].toLowerCase()}, ${intake.hasQualityEngineer ? "with" : "without"} a dedicated quality engineer.`,
    `Needed test layers: ${intake.layers.map((layer) => LABELS.layers[layer]).join(", ") || "None selected"}.`,
    `Assistant recommendation: ${toolchain}.`,
    `Question it could not answer: ${question || "No troubleshooting question was captured."}`,
    `What the team already tried: ${attempted.trim() || "No attempts were captured."}`,
    "",
    "Requested help: Review the unsupported integration or failure, confirm the approved path, and point back to any documentation that should be updated.",
  ].join("\n");
}

export function getProgramMetrics(): ProgramMetrics {
  const totals = ENABLEMENT_TEAM_SNAPSHOTS.reduce(
    (acc, team) => {
      acc.resolved += team.resolvedQuestions;
      acc.escalated += team.escalatedQuestions;
      if (team.standardStatus === "standard") acc.standard += 1;
      if (team.standardStatus === "drift") acc.drift += 1;
      return acc;
    },
    { resolved: 0, escalated: 0, standard: 0, drift: 0 }
  );
  const totalQuestions = totals.resolved + totals.escalated;

  return {
    teamCount: ENABLEMENT_TEAM_SNAPSHOTS.length,
    totalQuestions,
    resolvedQuestions: totals.resolved,
    resolutionRate: Math.round((totals.resolved / totalQuestions) * 100),
    standardTeams: totals.standard,
    adoptionRate: Math.round((totals.standard / ENABLEMENT_TEAM_SNAPSHOTS.length) * 100),
    driftTeams: totals.drift,
    topGapCount: DOCUMENTATION_GAPS[0]?.count ?? 0,
  };
}
