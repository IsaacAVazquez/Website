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
  });

  it("renders no band and no build note by default", () => {
    render(
      <Catalog97ToolShell route="/now">
        <h1>Now</h1>
      </Catalog97ToolShell>,
    );

    expect(screen.queryByText("Build notes")).toBeNull();
    expect(screen.queryByText("Project context")).toBeNull();
    expect(document.querySelector("[data-c97-band='title']")).toBeNull();
  });

  it("renders the title band as the only h1 when asked", () => {
    render(
      <Catalog97ToolShell
        route="/golf"
        band={{ kicker: "Sports", title: "PGA Tour", standfirst: "Leaderboards from a committed snapshot." }}
      >
        <p>Body</p>
      </Catalog97ToolShell>,
    );

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("PGA Tour");
    expect(screen.getByText("Sports")).toHaveClass("c97-kicker");
    expect(screen.getByText("Leaderboards from a committed snapshot.")).toHaveClass("c97-lead");
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
