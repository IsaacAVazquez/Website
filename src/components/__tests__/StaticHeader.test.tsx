import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { usePathname } from "next/navigation";
import { StaticHeader } from "@/components/StaticHeader";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/components/ui/DeferredThemeToggle", () => ({
  DeferredThemeToggle: ({ className }: { className?: string }) => (
    <button type="button" className={className}>
      Theme
    </button>
  ),
}));

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("StaticHeader", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockUsePathname.mockReturnValue("/portfolio");
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders the promoted desktop navigation", async () => {
    await act(async () => {
      root.render(<StaticHeader />);
    });

    const primaryNav = container.querySelector('[aria-label="Primary navigation"]');
    const brandLink = container.querySelector('nav[aria-label="Main navigation"] a[href="/"]');

    expect(primaryNav?.textContent).toContain("Home");
    expect(primaryNav?.textContent).toContain("About");
    expect(primaryNav?.textContent).toContain("Projects");
    expect(primaryNav?.textContent).toContain("Writing");
    expect(primaryNav?.textContent).toContain("Investments");
    expect(primaryNav?.textContent).toContain("Resume");
    expect(primaryNav?.textContent).toContain("Contact");
    expect(primaryNav?.querySelector('a[aria-current="page"]')?.textContent).toBe("Projects");

    expect(brandLink?.textContent).toContain("Isaac Vazquez");
    expect(brandLink?.getAttribute("href")).toBe("/");
  });

  it("shows an explicit Home link in the mobile menu", async () => {
    mockUsePathname.mockReturnValue("/contact");

    await act(async () => {
      root.render(<StaticHeader />);
    });

    const toggleButton = container.querySelector(
      'button[aria-controls="mobile-menu"]'
    ) as HTMLButtonElement | null;

    expect(toggleButton).not.toBeNull();

    await act(async () => {
      toggleButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const mobileNav = container.querySelector('[aria-label="Mobile navigation"]');

    expect(mobileNav?.textContent).toContain("Home");
    expect(mobileNav?.textContent).toContain("Projects");
    expect(mobileNav?.textContent).toContain("Writing");
    expect(mobileNav?.querySelector('a[aria-current="page"]')?.textContent).toBe("Contact");
  });

  it("keeps navigation and theme controls available on the homepage variant", async () => {
    mockUsePathname.mockReturnValue("/");

    await act(async () => {
      root.render(<StaticHeader />);
    });

    const primaryNav = container.querySelector('[aria-label="Primary navigation"]');
    const themeButtons = Array.from(container.querySelectorAll("button")).filter(
      (button) => button.textContent === "Theme"
    );

    expect(primaryNav?.textContent).toContain("Home");
    expect(primaryNav?.textContent).toContain("Writing");
    expect(themeButtons.length).toBeGreaterThan(0);
    expect(container.querySelector("header")?.className).toContain("header-home");
  });

  it("exposes a search affordance outside the navigation link lists", async () => {
    await act(async () => {
      root.render(<StaticHeader />);
    });

    // A visible search trigger must exist (desktop + mobile both link to /search).
    const searchLinks = container.querySelectorAll('a[href="/search"]');
    expect(searchLinks.length).toBeGreaterThan(0);

    // It must NOT live inside the labelled nav lists — those stay limited to the
    // canonical nav entries (asserted by the homepage e2e link-count checks).
    const primaryNav = container.querySelector('[aria-label="Primary navigation"]');
    expect(primaryNav?.querySelector('a[href="/search"]')).toBeNull();
  });

  it("groups the desktop search and theme controls together outside the nav", async () => {
    await act(async () => {
      root.render(<StaticHeader />);
    });

    // Search and the theme toggle share one utility cluster to the right of the
    // segmented nav (the desktop-only `.header-home-controls` group).
    const controls = container.querySelector(".header-home-controls");
    expect(controls).not.toBeNull();
    expect(controls?.querySelector('a[href="/search"]')).not.toBeNull();
    expect(controls?.querySelector("button")?.textContent).toBe("Theme");

    // The theme toggle no longer lives inside the primary nav link list.
    const primaryNav = container.querySelector('[aria-label="Primary navigation"]');
    expect(primaryNav?.querySelector("button")).toBeNull();
  });
});
