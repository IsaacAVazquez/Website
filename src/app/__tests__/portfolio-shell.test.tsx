import { render, screen } from "@testing-library/react";
import Home from "../page";
import PortfolioPage from "../portfolio/page";

jest.mock("@/components/StructuredData", () => ({
  StructuredData: () => null,
}));

jest.mock("@/components/AIStructuredData", () => ({
  AIStructuredData: () => null,
}));

jest.mock("@/constants/caseStudies", () => {
  const actual = jest.requireActual("@/constants/caseStudies");

  return {
    ...actual,
    getHomepageFeaturedCaseStudies: () => [{ slug: "project-a" }],
  };
});

jest.mock("@/lib/blog", () => ({
  getLatestBlogPostPreviews: () => [{ slug: "post-a" }],
}));

jest.mock("@/components/home/HomePageContent", () => ({
  HomePageContent: () => (
    <div data-testid="home-page-content">
      <section data-testid="hero">
        <h1>Editorial Home</h1>
      </section>
      <section>
        <h2>Selected work</h2>
      </section>
      <section>
        <h2>Where I do my best work</h2>
      </section>
      <section>
        <h2>Latest writing</h2>
      </section>
      <section>
        <h2>Contact</h2>
      </section>
    </div>
  ),
}));

describe("Portfolio shell page semantics", () => {
  it("keeps the homepage page component free of nested main landmarks", () => {
    const { container } = render(<Home />);

    expect(container.querySelectorAll("main")).toHaveLength(0);
    expect(screen.getByTestId("hero")).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(4);
  });

  it("keeps the portfolio index page free of nested main landmarks", () => {
    const { container } = render(<PortfolioPage />);

    expect(container.querySelectorAll("main")).toHaveLength(0);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /product work across fintech, analytics, and civic technology/i,
      })
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
