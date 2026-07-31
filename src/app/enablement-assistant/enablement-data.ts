export type ProductSurface = "web" | "mobile" | "backend" | "data";
export type PrimaryLanguage =
  | "typescript"
  | "python"
  | "java"
  | "swift"
  | "go"
  | "other";
export type CiSystem =
  | "github"
  | "gitlab"
  | "circle"
  | "jenkins"
  | "azure"
  | "other";
export type TestLayer =
  | "unit"
  | "integration"
  | "e2e"
  | "performance"
  | "accessibility";
export type AutomationMaturity = "none" | "manual" | "scripts" | "mature";
export type TeamSize = "small" | "medium" | "large";

export interface TeamIntake {
  surface: ProductSurface;
  language: PrimaryLanguage;
  ci: CiSystem;
  layers: TestLayer[];
  maturity: AutomationMaturity;
  teamSize: TeamSize;
  hasQualityEngineer: boolean;
}

export interface ToolchainCatalogEntry {
  id: string;
  name: string;
  summary: string;
  surfaces: ProductSurface[];
  languages: PrimaryLanguage[];
  layers: TestLayer[];
  ciSystems: Exclude<CiSystem, "other">[];
  complexity: 1 | 2 | 3;
  needsQualityEngineer: boolean;
  framework: string;
  runner: string;
  reporting: string;
  installCommand: string;
  testCommand: string;
  tradeoff: string;
}

export interface TroubleshootingArticle {
  id: string;
  title: string;
  keywords: string[];
  toolchains: string[];
  answer: string;
  snippet: string;
}

export interface TroubleshootingPrompt {
  question: string;
  answerable: boolean;
}

export interface EnablementTeamSnapshot {
  name: string;
  surface: ProductSurface;
  standardStatus: "standard" | "partial" | "drift";
  toolchain: string;
  resolvedQuestions: number;
  escalatedQuestions: number;
  driftReason?: string;
}

export interface DocumentationGap {
  question: string;
  count: number;
  teams: number;
  owner: string;
}

export const DEFAULT_TEAM_INTAKE: TeamIntake = {
  surface: "web",
  language: "typescript",
  ci: "github",
  layers: ["unit", "integration", "e2e", "accessibility"],
  maturity: "manual",
  teamSize: "medium",
  hasQualityEngineer: false,
};

export const SURFACE_OPTIONS: ReadonlyArray<{ value: ProductSurface; label: string }> = [
  { value: "web", label: "Web application" },
  { value: "mobile", label: "Mobile application" },
  { value: "backend", label: "Backend service" },
  { value: "data", label: "Data pipeline" },
];

export const LANGUAGE_OPTIONS: ReadonlyArray<{ value: PrimaryLanguage; label: string }> = [
  { value: "typescript", label: "TypeScript or JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java or Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "go", label: "Go" },
  { value: "other", label: "Other or mixed" },
];

export const CI_OPTIONS: ReadonlyArray<{ value: CiSystem; label: string }> = [
  { value: "github", label: "GitHub Actions" },
  { value: "gitlab", label: "GitLab CI" },
  { value: "circle", label: "CircleCI" },
  { value: "jenkins", label: "Jenkins" },
  { value: "azure", label: "Azure Pipelines" },
  { value: "other", label: "Other or custom" },
];

export const TEST_LAYER_OPTIONS: ReadonlyArray<{
  value: TestLayer;
  label: string;
  helper: string;
}> = [
  { value: "unit", label: "Unit", helper: "Fast checks for isolated logic" },
  { value: "integration", label: "Integration", helper: "Checks across service boundaries" },
  { value: "e2e", label: "End to end", helper: "Critical user workflows" },
  { value: "performance", label: "Performance", helper: "Load and response-time checks" },
  { value: "accessibility", label: "Accessibility", helper: "Automated accessibility checks" },
];

export const MATURITY_OPTIONS: ReadonlyArray<{
  value: AutomationMaturity;
  label: string;
  helper: string;
}> = [
  { value: "none", label: "Nothing yet", helper: "No repeatable test automation" },
  { value: "manual", label: "Manual only", helper: "Documented checks run by people" },
  { value: "scripts", label: "Some scripts", helper: "Useful automation without one standard" },
  { value: "mature", label: "Mature suite", helper: "A maintained suite that needs migration" },
];

export const TEAM_SIZE_OPTIONS: ReadonlyArray<{ value: TeamSize; label: string }> = [
  { value: "small", label: "2 to 5 people" },
  { value: "medium", label: "6 to 12 people" },
  { value: "large", label: "13 or more people" },
];

export const TOOLCHAIN_CATALOG: readonly ToolchainCatalogEntry[] = [
  {
    id: "web-typescript",
    name: "Playwright web standard",
    summary:
      "A TypeScript stack that keeps browser, component, accessibility, and report output in one readable workflow.",
    surfaces: ["web"],
    languages: ["typescript"],
    layers: ["unit", "integration", "e2e", "performance", "accessibility"],
    ciSystems: ["github", "gitlab", "circle", "jenkins", "azure"],
    complexity: 2,
    needsQualityEngineer: false,
    framework: "Playwright + Testing Library",
    runner: "Vitest and Playwright Test",
    reporting: "Playwright HTML + JUnit XML",
    installCommand: "npm install -D @playwright/test vitest @testing-library/react",
    testCommand: "npm run test && npx playwright test",
    tradeoff:
      "This keeps the stack consistent, but a team has to be disciplined about reserving browser tests for critical workflows so the suite stays fast.",
  },
  {
    id: "python-service",
    name: "Python service standard",
    summary:
      "A pytest-based service stack with contract, integration, and report output that works across API and worker code.",
    surfaces: ["backend", "data"],
    languages: ["python"],
    layers: ["unit", "integration", "e2e", "performance"],
    ciSystems: ["github", "gitlab", "circle", "jenkins", "azure"],
    complexity: 2,
    needsQualityEngineer: false,
    framework: "pytest + Testcontainers",
    runner: "pytest",
    reporting: "JUnit XML + coverage.py",
    installCommand: "python -m pip install pytest pytest-cov testcontainers",
    testCommand: "pytest --junitxml=reports/junit.xml --cov=src",
    tradeoff:
      "The stack is easy to extend, but service fixtures can become slow and hard to understand if every test creates its own environment.",
  },
  {
    id: "jvm-service",
    name: "JVM service standard",
    summary:
      "A JUnit stack for Java and Kotlin services with container-backed integration tests and portable report output.",
    surfaces: ["backend", "data"],
    languages: ["java"],
    layers: ["unit", "integration", "e2e", "performance"],
    ciSystems: ["github", "gitlab", "circle", "jenkins", "azure"],
    complexity: 3,
    needsQualityEngineer: false,
    framework: "JUnit 5 + REST Assured",
    runner: "Gradle Test",
    reporting: "JUnit XML + JaCoCo",
    installCommand: "./gradlew dependencies",
    testCommand: "./gradlew test integrationTest",
    tradeoff:
      "The tooling is mature and portable, but the first setup takes more build configuration than the lighter stacks in this catalog.",
  },
  {
    id: "go-service",
    name: "Go service standard",
    summary:
      "A small Go stack that uses the native runner, container-backed dependencies, and standard report conversion.",
    surfaces: ["backend"],
    languages: ["go"],
    layers: ["unit", "integration", "e2e", "performance"],
    ciSystems: ["github", "gitlab", "circle", "jenkins", "azure"],
    complexity: 1,
    needsQualityEngineer: false,
    framework: "Go test + Testcontainers",
    runner: "go test",
    reporting: "go-junit-report + coverage profile",
    installCommand: "go get github.com/testcontainers/testcontainers-go",
    testCommand: "go test -race -coverprofile=coverage.out ./...",
    tradeoff:
      "The native runner keeps the stack small, but richer reporting and test organization need a few conventions that the toolchain does not impose for you.",
  },
  {
    id: "ios-native",
    name: "Native iOS standard",
    summary:
      "An Apple-native stack that keeps unit and device checks inside the same Xcode project and CI result bundle.",
    surfaces: ["mobile"],
    languages: ["swift"],
    layers: ["unit", "integration", "e2e", "performance", "accessibility"],
    ciSystems: ["github", "circle", "jenkins", "azure"],
    complexity: 3,
    needsQualityEngineer: true,
    framework: "XCTest + XCUITest",
    runner: "xcodebuild test",
    reporting: "XCResult + JUnit conversion",
    installCommand: "xcodebuild -resolvePackageDependencies",
    testCommand: "xcodebuild test -scheme App -resultBundlePath TestResults.xcresult",
    tradeoff:
      "The native stack has the best access to iOS behavior, but device management and signing create more operational work than browser or service testing.",
  },
  {
    id: "mobile-cross-platform",
    name: "Cross-platform mobile standard",
    summary:
      "A workflow-level mobile stack for teams that need readable Android and iOS checks without maintaining two UI suites.",
    surfaces: ["mobile"],
    languages: ["typescript", "java", "swift"],
    layers: ["e2e", "performance", "accessibility"],
    ciSystems: ["github", "gitlab", "circle", "jenkins", "azure"],
    complexity: 2,
    needsQualityEngineer: false,
    framework: "Maestro + platform unit runner",
    runner: "Maestro CLI",
    reporting: "JUnit XML",
    installCommand: "curl -Ls https://get.maestro.mobile.dev | bash",
    testCommand: "maestro test --format junit flows/",
    tradeoff:
      "One workflow language is easier to share across mobile teams, but the stack does not replace native unit and integration coverage.",
  },
  {
    id: "data-quality",
    name: "Python data quality standard",
    summary:
      "A data pipeline stack that treats schema, transformation, and expectation checks as committed code with scheduled reports.",
    surfaces: ["data"],
    languages: ["python"],
    layers: ["unit", "integration", "performance"],
    ciSystems: ["github", "gitlab", "circle", "jenkins", "azure"],
    complexity: 3,
    needsQualityEngineer: true,
    framework: "pytest + Great Expectations",
    runner: "pytest and gx checkpoint",
    reporting: "Data Docs + JUnit XML",
    installCommand: "python -m pip install pytest great-expectations",
    testCommand: "pytest && gx checkpoint run pipeline",
    tradeoff:
      "Expectation suites make data failures much easier to read, but someone has to own thresholds and update them as the data changes.",
  },
] as const;

export const TROUBLESHOOTING_ARTICLES: readonly TroubleshootingArticle[] = [
  {
    id: "playwright-browsers",
    title: "Playwright cannot find a browser in CI",
    keywords: ["playwright", "browser", "chromium", "install", "executable", "ci"],
    toolchains: ["web-typescript"],
    answer:
      "The CI image is missing Playwright's browser binary or its operating-system packages. Install the browser after dependencies and before the test command, and keep the Playwright package and browser versions in the same lockfile.",
    snippet: "npx playwright install --with-deps chromium\nnpx playwright test",
  },
  {
    id: "local-pass-ci-fail",
    title: "Tests pass locally and fail in CI",
    keywords: ["local", "pass", "ci", "fail", "environment", "timezone", "secret"],
    toolchains: ["web-typescript", "python-service", "jvm-service", "go-service"],
    answer:
      "Start by comparing runtime versions, environment variables, time zone, and service startup order. Then run the same command locally inside the CI container. Most cases in this catalog come from version drift or a dependency that is ready locally but still starting in CI.",
    snippet: "node --version\nprintenv | sort\nnpm test -- --runInBand",
  },
  {
    id: "app-readiness",
    title: "The test runner starts before the application is ready",
    keywords: ["server", "ready", "timeout", "connection", "refused", "startup", "health"],
    toolchains: ["web-typescript", "python-service", "jvm-service", "go-service"],
    answer:
      "Use a health endpoint as the readiness check and start tests only after it returns success. A fixed sleep hides slow starts and still fails when the environment gets slower.",
    snippet: "npx wait-on http://127.0.0.1:3000/health\nnpm run test:e2e",
  },
  {
    id: "flaky-selectors",
    title: "Browser tests fail on unstable selectors",
    keywords: ["flaky", "selector", "locator", "element", "testid", "browser"],
    toolchains: ["web-typescript"],
    answer:
      "Prefer accessible roles, labels, and visible names, and use a test id only when the interface has no stable user-facing handle. Avoid CSS chains tied to layout because small visual changes will break them.",
    snippet: "await page.getByRole('button', { name: 'Save changes' }).click();",
  },
  {
    id: "missing-report",
    title: "CI finishes without publishing a readable report",
    keywords: ["report", "junit", "artifact", "publish", "results", "ci"],
    toolchains: [
      "web-typescript",
      "python-service",
      "jvm-service",
      "go-service",
      "ios-native",
      "mobile-cross-platform",
      "data-quality",
    ],
    answer:
      "Write the report to a stable path even when tests fail, then upload that path in a step configured to run regardless of the test result. The exact upload command depends on the CI system.",
    snippet: "if: always()\nwith:\n  name: test-report\n  path: reports/",
  },
  {
    id: "pytest-discovery",
    title: "pytest does not discover tests",
    keywords: ["pytest", "discover", "collection", "tests", "python", "import"],
    toolchains: ["python-service", "data-quality"],
    answer:
      "Check that files and functions follow the configured naming pattern, and run collection by itself before changing imports. If the project uses a src layout, install the package in editable mode so imports match production.",
    snippet: "python -m pip install -e .\npytest --collect-only -q",
  },
  {
    id: "jvm-memory",
    title: "JVM integration tests exhaust CI memory",
    keywords: ["jvm", "java", "gradle", "memory", "heap", "container", "oom"],
    toolchains: ["jvm-service"],
    answer:
      "Limit Gradle test workers and reuse container fixtures at the suite level. Raising the heap can help, but it should follow a check for parallel workers and duplicate service containers.",
    snippet: "./gradlew integrationTest --max-workers=2 -Dorg.gradle.jvmargs=-Xmx2g",
  },
  {
    id: "maestro-device",
    title: "Maestro cannot connect to a simulator",
    keywords: ["maestro", "simulator", "emulator", "device", "connect", "mobile"],
    toolchains: ["mobile-cross-platform"],
    answer:
      "Boot one supported simulator before Maestro starts, confirm that the device appears in the platform tool, and avoid leaving more than one eligible device active unless the job selects one explicitly.",
    snippet: "xcrun simctl boot 'iPhone 16'\nxcrun simctl list devices booted\nmaestro test flows/",
  },
  {
    id: "data-credentials",
    title: "Data checks cannot read the CI warehouse",
    keywords: ["data", "warehouse", "credential", "secret", "connection", "great", "expectations"],
    toolchains: ["data-quality"],
    answer:
      "Keep the connection string in the CI secret store and inject it at runtime. The committed expectation suite should reference the environment variable name, never the credential itself.",
    snippet: "export GX_WAREHOUSE_URL=\"$WAREHOUSE_TEST_URL\"\ngx checkpoint run pipeline",
  },
] as const;

export const TROUBLESHOOTING_PROMPTS: readonly TroubleshootingPrompt[] = [
  { question: "Playwright cannot find Chromium in CI", answerable: true },
  { question: "Our tests pass locally and fail in CI", answerable: true },
  { question: "How do I publish the JUnit report after a failed run?", answerable: true },
  { question: "pytest is not discovering our test files", answerable: true },
  { question: "Can you debug our private device farm VPN handshake?", answerable: false },
  { question: "Why did an internal proxy rewrite our signed artifact?", answerable: false },
  { question: "Which exception should our legal team approve?", answerable: false },
] as const;

export const ENABLEMENT_TEAM_SNAPSHOTS: readonly EnablementTeamSnapshot[] = [
  {
    name: "Customer Portal",
    surface: "web",
    standardStatus: "standard",
    toolchain: "Playwright web standard",
    resolvedQuestions: 31,
    escalatedQuestions: 4,
  },
  {
    name: "Partner Console",
    surface: "web",
    standardStatus: "partial",
    toolchain: "Playwright + legacy Jest",
    resolvedQuestions: 24,
    escalatedQuestions: 6,
    driftReason: "Reports still use a team-specific format",
  },
  {
    name: "Field Mobile",
    surface: "mobile",
    standardStatus: "drift",
    toolchain: "Appium",
    resolvedQuestions: 12,
    escalatedQuestions: 8,
    driftReason: "Maintains a separate runner and result format",
  },
  {
    name: "Account Services",
    surface: "backend",
    standardStatus: "standard",
    toolchain: "JVM service standard",
    resolvedQuestions: 29,
    escalatedQuestions: 3,
  },
  {
    name: "Identity API",
    surface: "backend",
    standardStatus: "standard",
    toolchain: "Go service standard",
    resolvedQuestions: 21,
    escalatedQuestions: 2,
  },
  {
    name: "Billing Events",
    surface: "data",
    standardStatus: "partial",
    toolchain: "pytest without Data Docs",
    resolvedQuestions: 17,
    escalatedQuestions: 5,
    driftReason: "Data checks do not publish a shared report",
  },
  {
    name: "Analytics Pipeline",
    surface: "data",
    standardStatus: "standard",
    toolchain: "Python data quality standard",
    resolvedQuestions: 26,
    escalatedQuestions: 4,
  },
  {
    name: "Notifications",
    surface: "backend",
    standardStatus: "drift",
    toolchain: "Custom shell runner",
    resolvedQuestions: 9,
    escalatedQuestions: 7,
    driftReason: "Custom runner has no maintained integration",
  },
  {
    name: "Checkout",
    surface: "web",
    standardStatus: "standard",
    toolchain: "Playwright web standard",
    resolvedQuestions: 34,
    escalatedQuestions: 3,
  },
  {
    name: "Advisor Mobile",
    surface: "mobile",
    standardStatus: "standard",
    toolchain: "Native iOS standard",
    resolvedQuestions: 20,
    escalatedQuestions: 4,
  },
  {
    name: "Document Service",
    surface: "backend",
    standardStatus: "partial",
    toolchain: "JUnit without shared fixtures",
    resolvedQuestions: 16,
    escalatedQuestions: 6,
    driftReason: "Service fixtures are copied across repositories",
  },
  {
    name: "Operations Hub",
    surface: "web",
    standardStatus: "standard",
    toolchain: "Playwright web standard",
    resolvedQuestions: 28,
    escalatedQuestions: 3,
  },
] as const;

export const DOCUMENTATION_GAPS: readonly DocumentationGap[] = [
  {
    question: "How should a team authenticate against a shared test environment?",
    count: 11,
    teams: 5,
    owner: "Environment setup",
  },
  {
    question: "Which device farm configuration is supported for mobile CI?",
    count: 8,
    teams: 3,
    owner: "Mobile standard",
  },
  {
    question: "How do we migrate historical reports without losing trend data?",
    count: 7,
    teams: 4,
    owner: "Reporting",
  },
  {
    question: "What is the approved path for testing vendor callbacks?",
    count: 5,
    teams: 3,
    owner: "Service testing",
  },
  {
    question: "Who approves an exception for a custom runner?",
    count: 4,
    teams: 2,
    owner: "Governance",
  },
] as const;

export const LABELS = {
  surfaces: Object.fromEntries(SURFACE_OPTIONS.map((option) => [option.value, option.label])) as Record<
    ProductSurface,
    string
  >,
  languages: Object.fromEntries(
    LANGUAGE_OPTIONS.map((option) => [option.value, option.label])
  ) as Record<PrimaryLanguage, string>,
  ci: Object.fromEntries(CI_OPTIONS.map((option) => [option.value, option.label])) as Record<
    CiSystem,
    string
  >,
  maturity: Object.fromEntries(
    MATURITY_OPTIONS.map((option) => [option.value, option.label])
  ) as Record<AutomationMaturity, string>,
  teamSize: Object.fromEntries(
    TEAM_SIZE_OPTIONS.map((option) => [option.value, option.label])
  ) as Record<TeamSize, string>,
  layers: Object.fromEntries(
    TEST_LAYER_OPTIONS.map((option) => [option.value, option.label])
  ) as Record<TestLayer, string>,
} as const;
