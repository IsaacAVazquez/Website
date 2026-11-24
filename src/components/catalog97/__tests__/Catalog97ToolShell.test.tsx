import { render, screen } from "@testing-library/react";
import { Catalog97ToolShell } from "@/components/catalog97/Catalog97ToolShell";

jest.mock("next/navigation", () => ({
  usePathname: () => "/nba",
}));

jest.mock("@/components/ui/DeferredThemeToggle", () => ({
  DeferredThemeToggle: () => <button type="button" aria-label="Theme" />,
}));

jest.mock("@/components/search/HeaderSearchPanel", () => ({
  HeaderSearchPanel: () => null,
}));

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => jest.requireActual("@/components/ProjectBuildNote").ProjectBuildNote,
}));

describe("Catalog97ToolShell", () => {
  it("owns the Catalog 97 chrome and the main landmark", () => {
    render(
      <Catalog97ToolShell route="/nba">
        <h1>NBA Pulse</h1>
      </Catalog97ToolShell>,
    );

    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("contentinfo", { name: "Site footer" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.querySelector(".c97-page[data-c97]")).not.toBeNull();
    expect(screen.getByRole("main").querySelector('[data-c97-surface="paper"] h1')).not.toBeNull();
    expect(document.querySelector(".c97-page")).not.toHaveAttribute("data-c97-wide");
  });

  it("marks the page root on a wide route, which is what widens every shell", () => {
    render(
      <Catalog97ToolShell route="/investments" wide>
        <h1>Investments</h1>
      </Catalog97ToolShell>,
    );

    expect(document.querySelector(".c97-page")).toHaveAttribute("data-c97-wide");
  });

  // Catalog97EasterEggs finds the wordmark it stamps through these classes, and
  // its own tests build the footer by hand, so a rename here has to fail here.
  it("keeps the footer wordmark where the stamp looks for it", () => {
    render(
      <Catalog97ToolShell route="/nba">
        <h1>NBA Pulse</h1>
      </Catalog97ToolShell>,
    );

    expect(document.querySelector(".c97-footer .c97-footer-colophon .c97-wordmark")).not.toBeNull();
  });

  it("renders no build note by default", () => {
    render(
      <Catalog97ToolShell route="/now">
        <h1>Now</h1>
      </Catalog97ToolShell>,
    );

    expect(screen.queryByText("Build notes")).toBeNull();
    expect(screen.queryByText("Project context")).toBeNull();
  });

  it("appends the build note aside inside main when a link exists", () => {
    render(
      <Catalog97ToolShell route="/nba" buildNoteHref="/writing/building-an-nba-dashboard">
        <h1>NBA Pulse</h1>
      </Catalog97ToolShell>,
    );

    const link = screen.getByRole("link", { name: /read the build notes/i });
    expect(link).toHaveAttribute("href", "/writing/building-an-nba-dashboard");
    expect(screen.getByRole("main")).toContainElement(link);
  });

});
