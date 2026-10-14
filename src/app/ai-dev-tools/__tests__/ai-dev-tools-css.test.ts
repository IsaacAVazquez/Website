import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(__dirname, "..", "ai-dev-tools.css"), "utf8");

describe("ai-dev-tools.css: field focus", () => {
  // The search label and each select's label paint the ring through
  // :focus-within. The frame rings a focused input or select from
  // `.c97-page input:focus-visible`, two classes and an element, so the field's
  // own reset has to name the root as well or both rings paint.
  it("clears the frame's ring on the search input and the selects under the route root", () => {
    expect(css).toMatch(
      /\.adt-root \.adt-search input:focus-visible,\s*\.adt-root \.adt-select select:focus-visible\s*\{\s*outline:\s*none;\s*\}/
    );
  });

  it("keeps the ring on the labels", () => {
    expect(css).toMatch(/\.adt-search:focus-within\s*\{\s*outline:\s*2px solid var\(--adt-accent\);/);
    expect(css).toMatch(/\.adt-select:focus-within\s*\{\s*outline:\s*2px solid var\(--adt-accent\);/);
  });
});
