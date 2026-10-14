import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

// Rules that no unit render can see: what the sheet does at phone width and
// on paper, and which attribute the selected row's bar keys on.
const css = fs.readFileSync(path.join(__dirname, "..", "earthquake-pulse.css"), "utf8");
const sheet = postcss.parse(css);

/** Every declaration of one property under a selector, with the media query it sits in. */
function declared(selector: string, property: string): Array<{ media: string | null; value: string }> {
  const found: Array<{ media: string | null; value: string }> = [];
  sheet.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    const media = rule.parent?.type === "atrule" ? rule.parent.params : null;
    rule.walkDecls(property, (decl) => {
      found.push({ media, value: decl.value });
    });
  });
  return found;
}

const PHONE_AND_PRINT = "print, screen and (max-width: 639px)";

describe("earthquake-pulse.css", () => {
  it("names screen or print on every width query, since Safari answers a bare one with the window's width on paper", () => {
    const bare: string[] = [];
    sheet.walkAtRules("media", (rule) => {
      if (/width/.test(rule.params) && !/screen|print/.test(rule.params)) bare.push(rule.params);
    });
    expect(bare).toEqual([]);
  });

  it("nests no media query inside another", () => {
    sheet.walkAtRules("media", (rule) => {
      expect(rule.parent?.type).toBe("root");
    });
  });

  it("keeps the plot's latitude labels at phone width and on paper, at a size that reads there", () => {
    expect(declared(".eq-plot-svg .eq-axis", "display")).toEqual([]);
    expect(declared(".eq-plot-svg .eq-axis", "font-size")).toEqual([
      { media: null, value: "18px" },
      { media: "screen and (min-width: 1024px)", value: "30px" },
      { media: PHONE_AND_PRINT, value: "40px" },
    ]);
  });

  it("stacks the sticky toolbar on the frame's token, under the header's open search", () => {
    expect(declared(".eq-toolbar", "z-index")).toEqual([
      { media: "screen and (min-width: 640px)", value: "var(--c97-z-sticky)" },
    ]);
  });

  it("keys the selected row's bar on the selection and not on a current-page state", () => {
    expect(css).not.toMatch(/aria-current/);
    expect(declared(".eq-quake-log-row[data-selected]", "box-shadow")).toHaveLength(1);
    expect(declared('.eq-region[aria-expanded="true"]', "box-shadow")).toHaveLength(1);
  });
});
