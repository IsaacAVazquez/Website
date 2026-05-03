import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { usePathname } from "next/navigation";
import { ConditionalLayout } from "@/components/ConditionalLayout";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("@/components/Footer", () => ({
  Footer: ({ variant }: { variant: string }) => (
    <div data-testid="footer" data-variant={variant}>
      footer
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

  it.each([
    { pathname: "/", expectedVariant: "compact" },
    { pathname: "/contact", expectedVariant: "compact" },
    { pathname: "/portfolio", expectedVariant: "full" },
    { pathname: "/fintech-tools/budget-planner", expectedVariant: "full" },
    { pathname: "/writing/2026-march-madness-bracket-analysis", expectedVariant: "full" },
  ])("uses the correct footer variant for $pathname", ({ pathname, expectedVariant }) => {
    mockUsePathname.mockReturnValue(pathname);

    act(() => {
      root.render(
        <ConditionalLayout>
          <div>Page content</div>
        </ConditionalLayout>
      );
    });

    expect(container.querySelector('[data-testid="footer"]')?.getAttribute("data-variant")).toBe(
      expectedVariant
    );
  });

  it("treats /mba-internship-notifications as a self-shell route", () => {
    mockUsePathname.mockReturnValue("/mba-internship-notifications");

    act(() => {
      root.render(
        <ConditionalLayout>
          <div data-testid="route-content">Page content</div>
        </ConditionalLayout>
      );
    });

    expect(container.querySelector("main > .max-w-4xl")).toBeNull();
    expect(container.querySelector('[data-testid="route-content"]')).toBeTruthy();
  });

  it("treats /formula-1 as a self-shell route", () => {
    mockUsePathname.mockReturnValue("/formula-1");

    act(() => {
      root.render(
        <ConditionalLayout>
          <div data-testid="route-content">Page content</div>
        </ConditionalLayout>
      );
    });

    expect(container.querySelector("main > .max-w-4xl")).toBeNull();
    expect(container.querySelector('[data-testid="route-content"]')).toBeTruthy();
  });

  it("treats /golf as a self-shell route", () => {
    mockUsePathname.mockReturnValue("/golf");

    act(() => {
      root.render(
        <ConditionalLayout>
          <div data-testid="route-content">Page content</div>
        </ConditionalLayout>
      );
    });

    expect(container.querySelector("main > .max-w-4xl")).toBeNull();
    expect(container.querySelector('[data-testid="route-content"]')).toBeTruthy();
  });

  it("treats /decision-lab as a self-shell route", () => {
    mockUsePathname.mockReturnValue("/decision-lab");

    act(() => {
      root.render(
        <ConditionalLayout>
          <div data-testid="route-content">Page content</div>
        </ConditionalLayout>
      );
    });

    expect(container.querySelector("main > .max-w-4xl")).toBeNull();
    expect(container.querySelector('[data-testid="route-content"]')).toBeTruthy();
  });
});
