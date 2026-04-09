import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Footer } from "@/components/Footer";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("Footer", () => {
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

  it("renders the default sign-off variant", () => {
    act(() => {
      root.render(<Footer />);
    });

    const footer = container.querySelector('footer[aria-label="Site footer"]');
    const heading = footer?.querySelector("h2");
    const links = footer?.querySelectorAll("a");

    expect(footer?.getAttribute("data-footer-variant")).toBe("full");
    expect(heading?.textContent).toBe("Thanks for taking a look.");
    expect(Array.from(links ?? []).some((link) => link.getAttribute("href") === "/portfolio")).toBe(true);
    expect(Array.from(links ?? []).some((link) => link.getAttribute("href") === "/contact")).toBe(true);
  });

  it("renders the compact variant without the large CTA block", () => {
    act(() => {
      root.render(<Footer variant="compact" />);
    });

    const footer = container.querySelector('footer[aria-label="Site footer"]');
    const heading = footer?.querySelector("h2");
    const links = footer?.querySelectorAll("a");

    expect(footer?.getAttribute("data-footer-variant")).toBe("compact");
    expect(heading).toBeNull();
    expect(Array.from(links ?? []).some((link) => link.getAttribute("href") === "/portfolio")).toBe(false);
    expect(Array.from(links ?? []).some((link) => link.getAttribute("href") === "/contact")).toBe(false);
    expect(footer?.textContent).toContain("Building products where clear thinking and reliable execution actually move the needle.");
  });

  it("supports the homepage editorial surface without restoring the large CTA block", () => {
    act(() => {
      root.render(<Footer variant="compact" />);
    });

    const footer = container.querySelector('footer[aria-label="Site footer"]');
    const heading = footer?.querySelector("h2");

    expect(footer?.getAttribute("data-footer-variant")).toBe("compact");
    expect(heading).toBeNull();
    expect(footer?.className).toContain("footer-home");
  });
});
