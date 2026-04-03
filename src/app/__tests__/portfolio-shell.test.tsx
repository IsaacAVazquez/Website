import { render, screen } from "@testing-library/react";
import Home from "../page";
import PortfolioPage from "../portfolio/page";

jest.mock("@/components/StructuredData", () => ({
  StructuredData: () => null,
}));

jest.mock("@/components/AIStructuredData", () => ({
  AIStructuredData: () => null,
}));

jest.mock("@/components/ModernHero", () => ({
  ModernHero: () => (
    <section data-testid="hero">
      <h1>Hero</h1>
    </section>
  ),
}));

jest.mock("@/components/FeaturedWorkSection", () => ({
  FeaturedWorkSection: () => (
    <section>
      <h2>Featured Work</h2>
    </section>
  ),
}));

jest.mock("@/components/ThinkingPreview", () => ({
  ThinkingPreview: () => (
    <section>
      <h2>Thinking</h2>
    </section>
  ),
}));

jest.mock("@/components/ContactSection", () => ({
  ContactSection: () => (
    <section>
      <h2>Contact</h2>
    </section>
  ),
}));

describe("Portfolio shell page semantics", () => {
  it("keeps the homepage page component free of nested main landmarks", () => {
    const { container } = render(<Home />);

    expect(container.querySelectorAll("main")).toHaveLength(0);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(3);
  });

  it("keeps the portfolio index page free of nested main landmarks", () => {
    const { container } = render(<PortfolioPage />);

    expect(container.querySelectorAll("main")).toHaveLength(0);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /all projects across product, analytics, and tooling/i,
      })
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
