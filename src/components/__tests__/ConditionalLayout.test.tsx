import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { usePathname } from "next/navigation";
import { ConditionalLayout } from "@/components/ConditionalLayout";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("@/components/catalog97/Catalog97ToolShell", () => ({
  Catalog97ToolShell: ({
    children,
    route,
    buildNoteHref,
    press,
  }: {
    children: React.ReactNode;
    route: string;
    buildNoteHref?: string;
    press?: { lead: string; second: string };
  }) => (
    <div
      data-testid="tool-shell"
      data-route={route}
      data-build-note={buildNoteHref ?? ""}
      data-press={press ? `${press.lead}/${press.second}` : ""}
    >
      {children}
    </div>
  ),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe("ConditionalLayout", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderAt(pathname: string) {
    mockUsePathname.mockReturnValue(pathname);
    act(() => {
      root.render(
        <ConditionalLayout>
          <p>Page content</p>
        </ConditionalLayout>,
      );
    });
  }

  it.each(["/", "/portfolio", "/writing", "/dashboards", "/about", "/resume", "/contact"])(
    "passes the designed route %s through untouched",
    (pathname) => {
      renderAt(pathname);
      expect(container.querySelector('[data-testid="tool-shell"]')).toBeNull();
      expect(container.textContent).toContain("Page content");
    },
  );

  it.each(["/nba", "/fantasy-football/waivers", "/writing/some-post", "/portfolio/some-project", "/admin", "/now"])(
    "wraps %s in the Catalog 97 tool shell",
    (pathname) => {
      renderAt(pathname);
      const shell = container.querySelector('[data-testid="tool-shell"]');
      expect(shell).not.toBeNull();
      expect(shell?.getAttribute("data-route")).toBe(pathname);
      expect(shell?.textContent).toContain("Page content");
    },
  );

  it("links canonical project routes to their build notes", () => {
    renderAt("/nba");
    expect(container.querySelector('[data-testid="tool-shell"]')?.getAttribute("data-build-note")).toBe(
      "/writing/building-an-nba-dashboard",
    );
  });

  it("passes no build note where none is registered", () => {
    renderAt("/now");
    expect(container.querySelector('[data-testid="tool-shell"]')?.getAttribute("data-build-note")).toBe("");
  });

  it("hands a project route its ink pair and leaves other routes on the default", () => {
    renderAt("/earthquake-pulse");
    expect(container.querySelector('[data-testid="tool-shell"]')?.getAttribute("data-press")).toBe("teal/vermilion");
    renderAt("/now");
    expect(container.querySelector('[data-testid="tool-shell"]')?.getAttribute("data-press")).toBe("");
  });
});
