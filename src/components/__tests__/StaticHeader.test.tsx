import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { usePathname } from "next/navigation";
import { StaticHeader } from "@/components/StaticHeader";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("@/components/ui/DeferredThemeToggle", () => ({
  DeferredThemeToggle: ({ className }: { className?: string }) => (
    <button type="button" className={className}>
      Theme
    </button>
  ),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

  it("passes desktop sizing classes to the deferred theme toggle", async () => {
    await act(async () => {
      root.render(<StaticHeader />);
    });

    const desktopThemeButton = container.querySelector(
      '[aria-label="Primary navigation"] button'
    );

    expect(desktopThemeButton).toHaveClass("min-h-[44px]");
    expect(desktopThemeButton).toHaveClass("px-3");
  });
});
