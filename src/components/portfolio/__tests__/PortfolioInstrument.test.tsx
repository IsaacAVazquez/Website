import { fireEvent, render, screen, within } from "@testing-library/react";
import { PortfolioV3 } from "../PortfolioV3";
import type { CaseStudyData } from "@/constants/caseStudies";

// Minimal CaseStudyData factory — only the fields the portfolio card and the
// search haystack actually read need realistic values; the rest are stubbed so
// the type is satisfied.
function makeProject(overrides: Partial<CaseStudyData>): CaseStudyData {
  return {
    slug: "slug",
    title: "Title",
    description: "Description",
    role: "Builder",
    timeline: "2026",
    tools: [],
    metrics: "",
    overview: { summary: "", impact: "" },
    problem: { context: "", painPoints: [], stakes: "" },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
    ...overrides,
  };
}

const projects: CaseStudyData[] = [
  makeProject({
    slug: "alpha-tool",
    title: "Alpha Tool",
    description: "A platform built on Kubernetes orchestration.",
    tools: ["Kubernetes"],
  }),
  makeProject({
    slug: "beta-tool",
    title: "Beta Tool",
    description: "A workspace backed by a Postgres database.",
    tools: ["Postgres"],
  }),
  makeProject({
    slug: "gamma-tool",
    title: "Gamma Tool",
    description: "An API explorer for GraphQL queries.",
    tools: ["GraphQL"],
  }),
];

function searchBox() {
  return within(screen.getByLabelText("Search projects")).getByRole("searchbox");
}

describe("PortfolioV3 search", () => {
  it("renders a search input alongside every project", () => {
    render(<PortfolioV3 projects={projects} />);

    expect(searchBox()).toBeVisible();
    expect(screen.getByText("Alpha Tool")).toBeInTheDocument();
    expect(screen.getByText("Beta Tool")).toBeInTheDocument();
    expect(screen.getByText("Gamma Tool")).toBeInTheDocument();
  });

  it("filters projects by title, description, and tools (case-insensitive)", () => {
    render(<PortfolioV3 projects={projects} />);

    // Matches Beta on a tool token only present in its tools list.
    fireEvent.change(searchBox(), { target: { value: "POSTGRES" } });

    expect(screen.getByText("Beta Tool")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Tool")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma Tool")).not.toBeInTheDocument();
  });

  it("shows an empty state with a clear control when nothing matches", () => {
    render(<PortfolioV3 projects={projects} />);

    fireEvent.change(searchBox(), { target: { value: "no-such-project" } });

    expect(screen.getByText(/no projects match/i)).toBeInTheDocument();
    expect(screen.queryByText("Alpha Tool")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));

    expect(screen.getByText("Alpha Tool")).toBeInTheDocument();
    expect(searchBox()).toHaveValue("");
  });
});
