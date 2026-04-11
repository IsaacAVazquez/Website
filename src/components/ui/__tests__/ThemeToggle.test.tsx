import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "../ThemeToggle";

jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe("ThemeToggle", () => {
  it("renders with the default touch target classes", () => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      resolvedTheme: "light",
      setTheme: jest.fn(),
      themes: ["light", "dark"],
      systemTheme: "light",
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);

    const button = screen.getByRole("button", {
      name: "Theme: light. Switch to dark.",
    });

    expect(button).toHaveClass("min-h-[44px]");
    expect(button).toHaveClass("min-w-[44px]");
    expect(button).toHaveClass("justify-center");
  });

  it("cycles to the next theme and merges custom classes", () => {
    const setTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      theme: "dark",
      resolvedTheme: "dark",
      setTheme,
      themes: ["light", "dark"],
      systemTheme: "dark",
      forcedTheme: undefined,
    });

    render(<ThemeToggle className="px-3 custom-theme-class" />);

    const button = screen.getByRole("button", {
      name: "Theme: dark. Switch to light.",
    });

    expect(button).toHaveClass("custom-theme-class");
    expect(button).toHaveClass("px-3");

    fireEvent.click(button);

    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
