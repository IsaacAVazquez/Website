import fs from "node:fs";
import path from "node:path";

// Food Map used to ship its own "--fm-*" hex palette (see the old header
// comment in food-map.css). The Catalog 97 migration (family 8) moves every
// colour decision onto the shared --c97-* tokens instead, so this file is a
// regression guard: it fails the moment a hex/rgb/hsl literal, a colour-valued
// --fm-* custom property, a non-flat border-radius, or a blurred box-shadow
// creeps back in.
const cssPath = path.join(__dirname, "..", "food-map.css");
const css = fs.readFileSync(cssPath, "utf8");

describe("food-map.css: Catalog 97 token migration", () => {
  it("declares no hex colour literals", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("declares no rgb()/rgba()/hsl()/hsla() colour literals", () => {
    expect(css).not.toMatch(/\b(rgb|rgba|hsl|hsla)\(/);
  });

  it("declares no --fm-* custom property (data colours flow in via inline style + var() usage only)", () => {
    // Strip var(...) usages first so a *usage* like `var(--fm-accent)` inside
    // some other property's value doesn't get mistaken for a declaration.
    const withoutVarUsages = css.replace(/var\([^)]*\)/g, "");
    expect(withoutVarUsages).not.toMatch(/--fm-[\w-]*\s*:/);
  });

  it("uses only 0 or 50% for border-radius (true circles only, e.g. the stamp)", () => {
    // A reset of Leaflet's own sheet needs !important, which is not part of the value.
    const radii = [...css.matchAll(/border-radius\s*:\s*([^;]+);/g)].map((m) => m[1].replace(/!important/, "").trim());
    for (const value of radii) {
      // A shorthand like "50% 50% 50% 0" (a teardrop) is banned too. Every
      // corner must independently be 0 or 50%.
      const corners = value.split(/\s+/);
      for (const corner of corners) {
        expect(["0", "0px", "50%"]).toContain(corner);
      }
    }
  });

  it("declares no blurred box-shadow (hard offsets, via .c97-offset, only)", () => {
    const shadows = [...css.matchAll(/box-shadow\s*:\s*([^;]+);/g)].map((m) => m[1].replace(/!important/, "").trim());
    for (const value of shadows) {
      if (value === "none") continue;
      // offsetX offsetY blur[ spread] color, and the blur term must be zero.
      const lengths = value.match(/-?\d+(?:\.\d+)?px/g) ?? [];
      expect(lengths[2]).toBeDefined();
      expect(["0px"]).toContain(lengths[2]);
    }
  });
});

// The city bar is sticky over the whole page and scrolls sideways under
// 1200px. These pin the rules that keep it from clipping or covering things,
// which no rendered unit test can see.
describe("food-map.css: the sticky city bar", () => {
  /** The declarations of the first rule that opens with `selector`. */
  const rule = (selector: string) => css.split(`\n${selector} {`)[1]?.split("}")[0] ?? "";
  /** Everything inside the `@media` block that opens with `query`. */
  const media = (query: string) => css.split(`@media ${query} {`)[1]?.split("\n}")[0] ?? "";

  it("pads the scroller itself, so a tab's focus ring is not clipped", () => {
    expect(rule(".fm-tabs")).toMatch(/overflow-x:\s*auto/);
    expect(rule(".fm-tabs")).toMatch(/padding:\s*var\(--c97-sp-1\)/);
    expect(rule(".fm-tabs")).toMatch(/scroll-padding-inline:\s*var\(--c97-sp-1\)/);
  });

  it("wraps the tabs on paper as it does from 1200px, so every city prints", () => {
    expect(media("print, screen and (min-width: 1200px)")).toMatch(/\.fm-tabs\s*\{[^}]*flex-wrap:\s*wrap/);
  });

  it("stops the two scroll targets short of the bar, at one row and at two", () => {
    expect(css).toMatch(/\.fm-index-head h2,\s*\.fm-dossier-name\s*\{\s*scroll-margin-top:\s*5rem/);
    expect(media("screen and (min-width: 1200px)")).toMatch(
      /\.fm-index-head h2,\s*\.fm-dossier-name\s*\{\s*scroll-margin-top:\s*8\.5rem/
    );
  });

  it("holds the sticky rail under the bar, at one row and at two", () => {
    expect(rule(".fm-rail")).toMatch(/top:\s*5rem/);
    expect(media("screen and (min-width: 1200px)")).toMatch(/\.fm-rail\s*\{\s*top:\s*8\.5rem/);
  });

  // A browser leaves backgrounds off paper by default, and the chosen city's
  // name is paper-coloured type on an ink fill.
  it("keeps the chosen city's and a pressed cuisine's fill on paper", () => {
    expect(media("print")).toMatch(
      /\.fm-tab\[aria-checked="true"\],\s*\.fm-pill\[aria-pressed="true"\] \{[^}]*[^-]print-color-adjust: exact;/
    );
  });
});

describe("food-map.css: the title row's stamp", () => {
  // "NO RESERVATIONS" is 105px wide at the label size, so a smaller ring cuts through it.
  it("draws the ring wide enough to hold its second line", () => {
    expect(css).toMatch(/\.fm-stamp-badge \{[^}]*width:\s*132px;\s*height:\s*132px;/);
  });
});
