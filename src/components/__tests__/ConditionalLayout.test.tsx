import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { usePathname } from "next/navigation";
import { ConditionalLayout } from "@/components/ConditionalLayout";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("@/components/Footer", () => ({
  Footer: ({ variant, surface }: { variant: string; surface: string }) => (
    <div data-testid="footer" data-variant={variant} data-surface={surface}>
      footer
    </div>
  ),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
    { pathname: "/", expectedVariant: "compact", expectedSurface: "home" },
    { pathname: "/contact", expectedVariant: "compact", expectedSurface: "default" },
    { pathname: "/portfolio", expectedVariant: "full", expectedSurface: "default" },
    { pathname: "/fintech-tools/budget-planner", expectedVariant: "full", expectedSurface: "default" },
    { pathname: "/writing/2026-march-madness-bracket-analysis", expectedVariant: "full", expectedSurface: "default" },
  ])("uses the correct footer variant for $pathname", ({ pathname, expectedVariant, expectedSurface }) => {
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
    expect(container.querySelector('[data-testid="footer"]')?.getAttribute("data-surface")).toBe(
      expectedSurface
    );
  });
});
