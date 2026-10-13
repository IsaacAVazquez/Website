import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(__dirname, "..", "score-pools.css"), "utf8");

describe("score-pools.css", () => {
  // Only the pick sheet prints on the wide column. Tabs that end at each
  // page's own right edge move sideways between pages, so the pointer that
  // clicked Tracker comes to rest on Settings.
  it("ends the tabs at the standard column's edge on every page", () => {
    const tabs = css.match(/\.sp-tabs\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(tabs.replace(/\s+/g, " ")).toContain(
      "margin-inline-end: calc((100% - min(100%, var(--c97-container))) / 2);",
    );
  });

  // The settings page prints its rivals list before a new pool has any.
  it("prints nothing for a list with no rows", () => {
    expect(css).toMatch(/\.sp-rows:empty\s*\{\s*display:\s*none;\s*\}/);
  });
});
