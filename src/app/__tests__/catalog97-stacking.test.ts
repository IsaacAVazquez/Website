import fs from "node:fs";
import path from "node:path";
import postcss, { type AtRule } from "postcss";

// The header's search panel hangs over the page below it, so two rules in
// catalog97.css decide what a route can paint on top of it. Neither shows in
// a unit render, and losing either one puts a toolbar or a map control back
// over the search results.
const css = fs.readFileSync(path.join(__dirname, "..", "catalog97.css"), "utf8");

/** Every declaration of one property under one exact selector. */
function declared(selector: string, property: string): string[] {
  const values: string[] = [];
  postcss.parse(css).walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    rule.walkDecls(property, (decl) => {
      values.push(decl.value);
    });
  });
  return values;
}

describe("catalog97.css: what stacks under the open site search", () => {
  it("lifts the header one step above the tray level while its search is open", () => {
    expect(declared(".c97-header[data-search-open]", "z-index")).toEqual(["calc(var(--c97-z-tray) + 1)"]);
  });

  it("keeps Leaflet's pane and control z-indexes inside the map", () => {
    expect(declared(".c97-basemap", "isolation")).toEqual(["isolate"]);
  });
});

/** The same, for rules that apply on paper in Firefox's engine alone. */
function declaredOnFirefoxPaper(selector: string, property: string): string[] {
  const values: string[] = [];
  postcss.parse(css).walkAtRules("supports", (supports) => {
    const media = supports.parent as AtRule | undefined;
    if (supports.params !== "(-moz-appearance: none)" || media?.name !== "media" || media.params !== "print") return;
    supports.walkRules((rule) => {
      if (!rule.selectors.includes(selector)) return;
      rule.walkDecls(property, (decl) => {
        values.push(decl.value);
      });
    });
  });
  return values;
}

// That engine prints nothing for an element under a filter or a blend mode,
// so a map's tiles reach the page only with both off, and other engines keep
// the wash. A unit render shows neither.
describe("catalog97.css: what a street map prints in Firefox's engine", () => {
  it("takes the wash off the tile pane in both themes", () => {
    expect(declaredOnFirefoxPaper(".c97-basemap .leaflet-tile-pane", "filter")).toEqual(["none"]);
    expect(declaredOnFirefoxPaper(".dark .c97-basemap .leaflet-tile-pane", "filter")).toEqual(["none"]);
  });

  it("takes Leaflet's blend off each tile with a selector that outranks Leaflet's", () => {
    expect(declaredOnFirefoxPaper(".c97-basemap .leaflet-tile-pane img.leaflet-tile", "mix-blend-mode")).toEqual([
      "normal",
    ]);
  });
});
