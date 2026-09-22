import { render } from "@testing-library/react";
import { Catalog97LayoutsCanvas } from "@/components/catalog97/Catalog97LayoutsCanvas";

describe("Catalog97LayoutsCanvas", () => {
  it("leaves the token scope to the tool shell and opens on a paper band", () => {
    const { container } = render(<Catalog97LayoutsCanvas />);
    const root = container.firstElementChild;
    const openingBand = root?.querySelector("section");

    // Catalog97ToolShell wraps this route, so a second .c97-page scope here
    // would nest one token scope inside another.
    expect(root).not.toHaveClass("c97-page");
    expect(root).not.toHaveAttribute("data-c97");
    expect(root).toHaveAttribute("data-c97-surface", "paper");
    expect(openingBand).toHaveAttribute("data-c97-surface", "paper");
  });

  it("renders every designed route in a named lazy frame", () => {
    const { container } = render(<Catalog97LayoutsCanvas />);
    const frames = Array.from(container.querySelectorAll("iframe"));

    expect(frames.map((frame) => frame.getAttribute("src"))).toEqual([
      "/",
      "/portfolio",
      "/writing",
      "/dashboards",
      "/about",
      "/resume",
      "/contact",
    ]);
    expect(frames.every((frame) => frame.getAttribute("loading") === "lazy")).toBe(
      true,
    );
    expect(frames.every((frame) => Boolean(frame.getAttribute("title")))).toBe(true);
  });
});
