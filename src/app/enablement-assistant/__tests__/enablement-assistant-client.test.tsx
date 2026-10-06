import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { EnablementAssistantClient } from "../enablement-assistant-client";
import {
  DEFAULT_TEAM_INTAKE,
  DOCUMENTATION_GAPS,
  ENABLEMENT_TEAM_SNAPSHOTS,
  TROUBLESHOOTING_PROMPTS,
  type TeamIntake,
} from "../enablement-data";
import {
  generateOnboardingPlan,
  getProgramMetrics,
  matchTroubleshootingQuestion,
  recommendToolchains,
} from "../enablement-engine";

const scrollIntoView = jest.fn();
const writeText = jest.fn<Promise<void>, [string]>();

beforeAll(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

beforeEach(() => {
  scrollIntoView.mockClear();
  writeText.mockReset().mockResolvedValue(undefined);
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 0;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const intake = (overrides: Partial<TeamIntake> = {}): TeamIntake => ({
  ...DEFAULT_TEAM_INTAKE,
  layers: [...DEFAULT_TEAM_INTAKE.layers],
  ...overrides,
});

function openTeamView() {
  render(<EnablementAssistantClient />);
  const tabs = screen.getByRole("group", { name: "Enablement workspace views" });
  fireEvent.click(within(tabs).getByRole("button", { name: "Onboard a team" }));
}

const next = () => screen.getByRole("button", { name: /^(Continue|Build recommendation)$/ });
const back = () => screen.getByRole("button", { name: "Back" });

function buildRecommendation() {
  fireEvent.click(next());
  fireEvent.click(next());
  fireEvent.click(next());
}

describe("EnablementAssistantClient", () => {
  it("opens on the program dashboard with metrics drawn from the seed data", () => {
    render(<EnablementAssistantClient />);
    const metrics = getProgramMetrics();

    const tabs = screen.getByRole("group", { name: "Enablement workspace views" });
    expect(within(tabs).getByRole("button", { name: "Program dashboard" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Portfolio view · 12 seeded teams")).toBeInTheDocument();

    expect(screen.getByText("Resolved without a human").nextElementSibling).toHaveTextContent(`${metrics.resolutionRate}%`);
    expect(screen.getByText(`${metrics.resolvedQuestions} of ${metrics.totalQuestions} seeded questions`)).toBeInTheDocument();
    expect(screen.getByText("Standard adoption").nextElementSibling).toHaveTextContent(`${metrics.adoptionRate}%`);
    expect(screen.getByText("Teams in material drift").nextElementSibling).toHaveTextContent(String(metrics.driftTeams));

    const gaps = screen.getAllByRole("progressbar");
    expect(gaps).toHaveLength(DOCUMENTATION_GAPS.length);
    expect(gaps[0]).toHaveAttribute("aria-valuemax", String(DOCUMENTATION_GAPS[0].count));
    expect(gaps[0]).toHaveAccessibleName(`${DOCUMENTATION_GAPS[0].question}: ${DOCUMENTATION_GAPS[0].count} unanswered questions`);

    const table = within(screen.getByRole("region", { name: "Standard adoption by team" })).getByRole("table");
    expect(within(table).getAllByRole("rowheader")).toHaveLength(ENABLEMENT_TEAM_SNAPSHOTS.length);
    const first = ENABLEMENT_TEAM_SNAPSHOTS[0];
    const firstRate = Math.round((first.resolvedQuestions / (first.resolvedQuestions + first.escalatedQuestions)) * 100);
    const firstRow = within(table).getByRole("rowheader", { name: first.name }).closest("tr") as HTMLElement;
    expect(firstRow).toHaveTextContent(`${firstRate}%`);
    expect(within(firstRow).getByText(first.standardStatus)).toHaveClass(
      first.standardStatus === "standard" ? "c97-chip-positive" : first.standardStatus === "partial" ? "c97-chip-warning" : "c97-chip-negative"
    );

    const driftCount = ENABLEMENT_TEAM_SNAPSHOTS.filter((team) => team.standardStatus !== "standard").length;
    expect(screen.getAllByText(/^Current stack · /)).toHaveLength(driftCount);
  });

  it("switches to the team view from either control and scrolls to the workspace", () => {
    render(<EnablementAssistantClient />);
    const header = screen.getByRole("heading", { name: "See where the standard is holding" }).parentElement?.parentElement as HTMLElement;

    fireEvent.click(within(header).getByRole("button", { name: "Onboard a team" }));
    expect(screen.getByText("Team view · 3 intake steps")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Start with the team that needs help" })).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: "smooth" });

    const tabs = screen.getByRole("group", { name: "Enablement workspace views" });
    fireEvent.click(within(tabs).getByRole("button", { name: "Program dashboard" }));
    expect(screen.getByText("Portfolio view · 12 seeded teams")).toBeInTheDocument();
  });

  it("walks the intake forward and back, keeping every answer", () => {
    openTeamView();
    const progress = screen.getByRole("navigation", { name: "Intake progress" });

    expect(back()).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Web application" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "TypeScript or JavaScript" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "GitHub Actions" })).toBeChecked();
    expect(within(progress).getByRole("button", { name: "1 Team context" })).toHaveAttribute("aria-current", "step");

    fireEvent.click(screen.getByRole("radio", { name: "Python" }));
    fireEvent.click(next());
    expect(within(progress).getByRole("button", { name: "✓ Team context" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Unit/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Performance/ })).not.toBeChecked();

    for (const layer of ["Unit", "Integration", "End to end", "Accessibility"]) {
      fireEvent.click(screen.getByRole("checkbox", { name: new RegExp(`^${layer}`) }));
    }
    expect(screen.getByRole("alert")).toHaveTextContent("Select at least one layer");
    expect(next()).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: /Performance/ }));
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(next());
    expect(next()).toHaveTextContent("Build recommendation");
    fireEvent.click(screen.getByRole("radio", { name: /Mature suite/ }));
    fireEvent.click(screen.getByRole("radio", { name: "13 or more people" }));
    fireEvent.click(screen.getByRole("radio", { name: /Dedicated quality engineer/ }));
    expect(screen.getByRole("radio", { name: /Shared team ownership/ })).not.toBeChecked();

    fireEvent.click(back());
    expect(screen.getByRole("checkbox", { name: /Performance/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Unit/ })).not.toBeChecked();

    fireEvent.click(within(progress).getByRole("button", { name: /Team context/ }));
    expect(screen.getByRole("radio", { name: "Python" })).toBeChecked();
    fireEvent.click(within(progress).getByRole("button", { name: /Delivery reality/ }));
    expect(screen.getByRole("radio", { name: /Mature suite/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: "13 or more people" })).toBeChecked();
  });

  it("builds an inspectable recommendation and a first-setup plan for the default team", () => {
    openTeamView();
    buildRecommendation();

    const recommendation = recommendToolchains(intake());
    const plan = generateOnboardingPlan(intake(), recommendation);
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: "smooth" });

    const section = screen.getByRole("region", { name: "A recommendation you can inspect" });
    expect(within(section).queryByText("Human review needed")).toBeNull();
    const top = within(section).getByText("Top recommendation").closest("article") as HTMLElement;
    expect(within(top).getByRole("heading", { name: recommendation.primary.toolchain.name })).toBeInTheDocument();
    expect(within(top).getByRole("img", { name: `${recommendation.primary.score} percent confidence` })).toBeInTheDocument();
    expect(top.querySelector("details")).toHaveAttribute("open");
    expect(within(top).getByText("Product surface")).toBeInTheDocument();
    const runnerUp = within(section).getByText("Runner-up").closest("article") as HTMLElement;
    expect(within(runnerUp).getByRole("heading", { name: recommendation.runnerUp.toolchain.name })).toBeInTheDocument();
    expect(runnerUp.querySelector("details")).not.toHaveAttribute("open");

    const planSection = screen.getByRole("region", { name: "Start with one workflow and build the habit" });
    expect(within(planSection).getByText(/first setup/)).toBeInTheDocument();
    expect(within(planSection).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(
      plan.map((step) => step.title)
    );
    expect(screen.queryByRole("region", { name: "Give the central team the context up front." })).toBeNull();

    const progress = screen.getByRole("navigation", { name: "Intake progress" });
    expect(within(progress).getAllByText("✓")).toHaveLength(2);
  });

  it("plans a parallel migration for a mature suite", () => {
    openTeamView();
    fireEvent.click(next());
    fireEvent.click(next());
    fireEvent.click(screen.getByRole("radio", { name: /Mature suite/ }));
    fireEvent.click(next());

    const planSection = screen.getByRole("region", { name: "Migrate the suite without dropping coverage" });
    expect(within(planSection).getByText(/parallel migration/)).toBeInTheDocument();
    expect(within(planSection).getByRole("heading", { name: "Run both stacks in parallel" })).toBeInTheDocument();
  });

  it("copies the plan and reports a failed copy", async () => {
    openTeamView();
    buildRecommendation();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy full plan" }));
    });
    const plan = generateOnboardingPlan(intake(), recommendToolchains(intake()));
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^1\\. ${plan[0].title}\\nOwner: `)));
    expect(screen.getByRole("button", { name: "Plan copied" })).toBeInTheDocument();

    writeText.mockRejectedValueOnce(new Error("denied"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Plan copied" }));
    });
    expect(screen.getByRole("button", { name: "Copy failed, select the text below" })).toBeInTheDocument();
    expect(screen.getAllByRole("status").some((node) => node.textContent === "Copy failed, select the text below")).toBe(true);
  });

  it("routes an unsupported stack to a human with a copyable handoff", async () => {
    openTeamView();
    fireEvent.click(screen.getByRole("radio", { name: "Other or mixed" }));
    fireEvent.click(screen.getByRole("radio", { name: "Other or custom" }));
    buildRecommendation();

    const recommendation = recommendToolchains(intake({ language: "other", ci: "other" }));
    const section = screen.getByRole("region", { name: "A recommendation you can inspect" });
    const review = within(section).getByRole("status");
    expect(review).toHaveTextContent("Human review needed");
    expect(review).toHaveTextContent(`scored ${recommendation.primary.score}%, below the ${recommendation.threshold}% threshold`);
    expect(within(section).getByText("Closest catalog match")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy full plan" })).toBeNull();

    const handoff = screen.getByRole("region", { name: "Give the central team the context up front." });
    fireEvent.change(within(handoff).getByLabelText("What has the team already tried?"), {
      target: { value: "Pinned the runner image" },
    });
    expect(handoff.querySelector("pre")).toHaveTextContent("Pinned the runner image");

    await act(async () => {
      fireEvent.click(within(handoff).getByRole("button", { name: "Copy support request" }));
    });
    expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining("Pinned the runner image"));
    expect(within(handoff).getByRole("button", { name: "Support request copied" })).toBeInTheDocument();

    writeText.mockRejectedValueOnce(new Error("denied"));
    await act(async () => {
      fireEvent.click(within(handoff).getByRole("button", { name: "Support request copied" }));
    });
    expect(within(handoff).getByRole("button", { name: "Copy failed, select the text below" })).toBeInTheDocument();
  });

  it("answers a seeded troubleshooting question with its confidence", () => {
    openTeamView();
    buildRecommendation();

    const desk = screen.getByRole("region", { name: "Ask a setup or integration question" });
    expect(within(desk).getByText("No question searched yet")).toBeInTheDocument();
    expect(within(desk).getAllByText("Outside scope")).toHaveLength(
      TROUBLESHOOTING_PROMPTS.filter((prompt) => !prompt.answerable).length
    );

    const prompt = TROUBLESHOOTING_PROMPTS.find((entry) => entry.answerable)!;
    fireEvent.click(within(desk).getByRole("button", { name: prompt.question }));
    expect(within(desk).getByLabelText("What is going wrong?")).toHaveValue(prompt.question);
    fireEvent.click(within(desk).getByRole("button", { name: "Find an answer" }));

    const match = matchTroubleshootingQuestion(prompt.question, recommendToolchains(intake()).primary.toolchain.id);
    expect(match.article).not.toBeNull();
    expect(within(desk).getByText(`${Math.round(match.confidence * 100)}%`)).toBeInTheDocument();
    expect(within(desk).getByRole("heading", { name: match.article!.title })).toBeInTheDocument();
    expect(within(desk).getByText(`Matched terms · ${match.matchedTerms.join(", ")}`)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Give the central team the context up front." })).toBeNull();
  });

  it("declines an out-of-scope question and opens the handoff", () => {
    openTeamView();
    buildRecommendation();

    const desk = screen.getByRole("region", { name: "Ask a setup or integration question" });
    const prompt = TROUBLESHOOTING_PROMPTS.find((entry) => !entry.answerable)!;
    fireEvent.change(within(desk).getByLabelText("What is going wrong?"), { target: { value: prompt.question } });
    fireEvent.submit(within(desk).getByLabelText("What is going wrong?").closest("form") as HTMLFormElement);

    expect(within(desk).getByRole("heading", { name: "I do not have a reliable answer for this." })).toBeInTheDocument();
    const handoff = screen.getByRole("region", { name: "Give the central team the context up front." });
    expect(handoff.querySelector("pre")).toHaveTextContent(prompt.question);
  });

  it("resets the intake and hides the results", () => {
    openTeamView();
    fireEvent.click(screen.getByRole("radio", { name: "Go" }));
    buildRecommendation();
    expect(screen.getByRole("region", { name: "A recommendation you can inspect" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset intake" }));
    expect(screen.queryByRole("region", { name: "A recommendation you can inspect" })).toBeNull();
    expect(screen.getByRole("radio", { name: "TypeScript or JavaScript" })).toBeChecked();
    expect(back()).toBeDisabled();
  });

  it("puts the two workspace views under the opening explanation, ahead of the model boundary note", () => {
    render(<EnablementAssistantClient />);
    const tabs = screen.getByRole("group", { name: "Enablement workspace views" });
    const opening = screen.getByRole("heading", { level: 1 });

    expect(opening.closest("section")).toContainElement(tabs);
    expect(tabs.compareDocumentPosition(screen.getByText("Model boundary")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
