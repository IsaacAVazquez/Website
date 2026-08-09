import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import GlobalRouteError from "@/app/error";
import DashboardsError from "@/app/dashboards/error";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn() },
}));

jest.mock("@/components/ui/DeferredThemeToggle", () => ({
  DeferredThemeToggle: () => (
    <button type="button" aria-label="Theme: light. Switch to dark." />
  ),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("Catalog 97 error shells", () => {
  const error = new Error("render failed");
  const reset = jest.fn();

  beforeEach(() => {
    reset.mockClear();
  });

  it("keeps the Catalog shell when a Catalog route reaches the global boundary", () => {
    mockUsePathname.mockReturnValue("/about");

    const { container } = render(
      <GlobalRouteError error={error} reset={reset} />,
    );

    expect(container.querySelectorAll("header")).toHaveLength(1);
    expect(container.querySelectorAll("main#main-content")).toHaveLength(1);
    expect(container.querySelectorAll("footer")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Couldn't load this page." }),
    ).toBeVisible();
  });

  it("keeps the Catalog shell in the dashboards route boundary", () => {
    mockUsePathname.mockReturnValue("/dashboards");

    const { container } = render(
      <DashboardsError error={error} reset={reset} />,
    );

    expect(container.querySelectorAll("header")).toHaveLength(1);
    expect(container.querySelectorAll("main#main-content")).toHaveLength(1);
    expect(container.querySelectorAll("footer")).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Couldn't load the dashboard index.",
      }),
    ).toBeVisible();
  });

  it("leaves Working Instrument errors for the global layout to wrap", () => {
    mockUsePathname.mockReturnValue("/investments");

    const { container } = render(
      <GlobalRouteError error={error} reset={reset} />,
    );

    expect(container.querySelector(".c97-page")).toBeNull();
    expect(container.querySelector("main")).toBeNull();
    expect(
      screen.getByRole("heading", { level: 1, name: "Couldn't load this page." }),
    ).toBeVisible();
  });
});
