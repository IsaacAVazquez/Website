import { expect, type Page } from "@playwright/test";

/** A phone, a laptop, and a big monitor, the three places the misalignment showed. */
export const LAYOUT_WIDTHS = [390, 1440, 1920] as const;

/**
 * Walks one loaded page through LAYOUT_WIDTHS and asserts, at each, that the
 * page doesn't scroll sideways, that the h1 and any breadcrumb box start on
 * the header's content edge, and that the footer shares the header's edges.
 * It is the part of scripts/layoutSweep.mjs cheap enough to run in CI.
 */
export async function expectAlignedLayout(page: Page) {
  const height = page.viewportSize()?.height ?? 900;
  for (const width of LAYOUT_WIDTHS) {
    await page.setViewportSize({ width, height });
    const layout = await page.evaluate(() => {
      const edges = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return {
          left: r.left + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft),
          right: r.right - parseFloat(s.borderRightWidth) - parseFloat(s.paddingRight),
        };
      };
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        header: edges(document.querySelector(".c97-header-row")),
        h1: edges(document.querySelector("main h1")),
        breadcrumb: document.querySelector("main nav[aria-label='Breadcrumb'] ol")?.getBoundingClientRect().left ?? null,
        footer: edges(document.querySelector(".c97-footer > .c97-shell")),
      };
    });

    expect(layout.overflow, `sideways scroll at ${width}px`).toBeLessThanOrEqual(1);
    expect(layout.header, "the header row renders").not.toBeNull();
    const { left, right } = layout.header!;
    if (layout.h1) expect(Math.abs(layout.h1.left - left), `h1 edge at ${width}px`).toBeLessThanOrEqual(1);
    if (layout.breadcrumb !== null) {
      expect(Math.abs(layout.breadcrumb - left), `breadcrumb edge at ${width}px`).toBeLessThanOrEqual(1);
    }
    if (layout.footer) {
      expect(Math.abs(layout.footer.left - left), `footer left edge at ${width}px`).toBeLessThanOrEqual(1);
      expect(Math.abs(layout.footer.right - right), `footer right edge at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
}
