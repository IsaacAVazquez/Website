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
    const radii = [...css.matchAll(/border-radius\s*:\s*([^;]+);/g)].map((m) => m[1].trim());
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
    const shadows = [...css.matchAll(/box-shadow\s*:\s*([^;]+);/g)].map((m) => m[1].trim());
    for (const value of shadows) {
      if (value === "none") continue;
      // offsetX offsetY blur[ spread] color, and the blur term must be zero.
      const lengths = value.match(/-?\d+(?:\.\d+)?px/g) ?? [];
      expect(lengths[2]).toBeDefined();
      expect(["0px"]).toContain(lengths[2]);
    }
  });
});
