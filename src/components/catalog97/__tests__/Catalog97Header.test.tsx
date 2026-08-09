import { fireEvent, render, screen } from "@testing-library/react";
import { Catalog97Header } from "@/components/catalog97/Catalog97Header";

const mockUsePathname = jest.fn(() => "/");

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock("@/components/ui/DeferredThemeToggle", () => ({
  DeferredThemeToggle: () => (
    <button type="button" aria-label="Theme: light. Switch to dark." />
  ),
}));

jest.mock("@/components/search/HeaderSearchPanel", () => ({
  HeaderSearchPanel: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Site search">
      <button type="button" onClick={onClose}>
        Close search
      </button>
    </div>
  ),
}));

describe("Catalog97Header utilities", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("keeps site search and theme controls available on Catalog routes", () => {
    render(<Catalog97Header />);

    fireEvent.click(
      screen.getByRole("button", { name: /search the site/i }),
    );

    expect(
      screen.getByRole("button", { name: /theme: light/i }),
    ).toBeVisible();
    expect(
      screen.getByRole("dialog", { name: "Site search" }),
    ).toBeVisible();
  });

  it("opens search from slash without swallowing slash inside an input", () => {
    render(<Catalog97Header />);

    const slash = new KeyboardEvent("keydown", {
      key: "/",
      bubbles: true,
      cancelable: true,
    });
    fireEvent(window, slash);

    expect(slash.defaultPrevented).toBe(true);
    expect(
      screen.getByRole("dialog", { name: "Site search" }),
    ).toBeVisible();

    const input = document.createElement("input");
    document.body.appendChild(input);
    const typingSlash = new KeyboardEvent("keydown", {
      key: "/",
      bubbles: true,
      cancelable: true,
    });
    fireEvent(input, typingSlash);

    expect(typingSlash.defaultPrevented).toBe(false);
    input.remove();
  });
});
