import { render, screen } from "@testing-library/react";
import { getPortfolioProjects } from "@/constants/caseStudies";
import { WORK_LEAD_COUNT } from "@/components/catalog97/Catalog97Portfolio";
import Home from "../page";
import PortfolioPage from "../portfolio/page";

jest.mock("@/components/StructuredData", () => ({
  StructuredData: () => null,
}));

jest.mock("@/components/AIStructuredData", () => ({
  AIStructuredData: () => null,
}));

// Catalog97Header defers its theme toggle through next/dynamic. This test only
// counts landmarks, so stub the toggle rather than let the chunk resolve after
// the assertions and warn about an update outside act().
jest.mock("@/components/ui/DeferredThemeToggle", () => ({
  DeferredThemeToggle: () => null,
}));

jest.mock("@/constants/caseStudies", () => {
  const actual = jest.requireActual("@/constants/caseStudies");

  return {
    ...actual,
    // Catalog97Home reads title/timeline/overview.summary off each featured
    // project, so the stub has to carry those fields.
    getHomepageFeaturedCaseStudies: () => [
      {
        slug: "project-a",
        title: "Project A",
        description: "Project A description",
        timeline: "2026",
        link: "/fintech-tools/interchange-iq",
        overview: { summary: "What project A does.", impact: "" },
      },
    ],
  };
});

const stubPost = {
  slug: "post-a",
  title: "Post A",
  excerpt: "What post A is about.",
  readingTime: "5 min read",
  category: "Product",
  // The homepage pins its write-ups, and September is the month engines
  // abbreviate differently.
  cluster: "PM Workflows",
  publishedAt: "2026-09-25",
};

jest.mock("@/lib/blog", () => ({
  getAllBlogPostPreviews: () => [stubPost],
  getHomepageProofOfWorkBlogPostPreviews: () => [stubPost],
}));

describe("Portfolio shell page semantics", () => {
  /*
   * These two routes moved to Catalog 97, where Catalog97Shell owns the page's
   * single <main> and ConditionalLayout stands down. The invariant being
   * guarded is unchanged — exactly one main landmark and exactly one h1 — but
   * the main now lives inside the page component rather than around it.
   */
  it("gives the homepage exactly one main landmark and one h1", async () => {
    const { container } = render(await Home());

    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /second-year MBA at Berkeley Haas, moving into product/i,
      })
    ).toBeVisible();
  });

  // /portfolio/<slug> redirects to project.link for every case study that
  // became a live tool, so a card pointing at the slug costs a redirect hop.
  it("links homepage work cards straight to the live tool", async () => {
    const { container } = render(await Home());
    const hrefs = Array.from(container.querySelectorAll("a"), (a) => a.getAttribute("href"));

    expect(hrefs).toContain("/fintech-tools/interchange-iq");
    expect(hrefs).not.toContain("/portfolio/project-a");
  });

  // Project titles are headings so a screen reader can move between projects.
  // 96a16afb turned them into spans when each card became a single link.
  it("keeps homepage work card titles reachable by heading navigation", async () => {
    render(await Home());

    expect(screen.getByRole("heading", { level: 3, name: "Project A" })).toBeInTheDocument();
  });

  // Node spells an en-GB September "Sept", and the design uses "Sep".
  it("dates homepage posts with Sep, whichever way the engine spelled it", async () => {
    render(await Home());

    expect(screen.getByText("25 Sep 2026 · Product")).toBeInTheDocument();
  });

  it("links portfolio entries straight to the live tool", () => {
    const { container } = render(<PortfolioPage />);
    const hrefs = Array.from(container.querySelectorAll("a"), (a) => a.getAttribute("href"));
    const liveProjects = getPortfolioProjects()
      .slice(0, WORK_LEAD_COUNT)
      .filter((project) => project.link);

    expect(liveProjects.length).toBeGreaterThan(0);
    for (const project of liveProjects) {
      expect(hrefs).toContain(project.link);
      expect(hrefs).not.toContain(`/portfolio/${project.slug}`);
    }
  });

  // Since 2026-10-19 the page is the curated story, not the inventory: four
  // lead projects, the two career write-ups, and one link to the full index.
  it("shows the lead projects, both career write-ups, and the way to the full inventory", () => {
    const { container } = render(<PortfolioPage />);
    const projects = getPortfolioProjects();
    const hrefs = Array.from(container.querySelectorAll("main a"), (a) => a.getAttribute("href"));

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(WORK_LEAD_COUNT + 1);
    expect(hrefs).toContain("/writing/juno-mba-growth-internship");
    expect(hrefs).toContain("/writing/civitech-quality-and-product-work");
    expect(container.querySelector('main a[href="/dashboards"]')?.closest("p")).toHaveTextContent(
      `all ${projects.length} tools`
    );
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("gives the portfolio index exactly one main landmark and one h1", () => {
    const { container } = render(<PortfolioPage />);

    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /the work i.{0,3}d show first, and the decisions behind it/i,
      })
    ).toBeVisible();
  });
});
