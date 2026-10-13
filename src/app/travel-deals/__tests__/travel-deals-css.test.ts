import fs from "node:fs";
import path from "node:path";

// Cascade rules a unit render cannot see, since jsdom loads no stylesheet.
const css = fs.readFileSync(path.join(__dirname, "..", "travel-deals.css"), "utf8");

/** The declarations of the first rule whose selector list is exactly `selector`. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

describe("travel-deals.css", () => {
  it("leaves the disclosure summaries as list items, so each keeps its marker", () => {
    // The triangle only draws on a list-item box, and the sheet draws no chevron in its place.
    const summary = rule(".td-disclose summary");
    expect(summary).not.toBe("");
    expect(summary).not.toMatch(/display\s*:/);
  });

  it("gives the search links' title a selector that outranks the heading reset", () => {
    // `.td-root h3` zeroes margins at a class plus an element, so one class alone loses to it.
    expect(rule(".td-playbook .td-tools-title")).toMatch(/margin-top:\s*var\(--c97-sp-3\)/);
    expect(rule(".td-tools-title")).toBe("");
  });

  it("keeps a number field's rule its own colour when only the arrow step is off", () => {
    // The site's invalid style weighs three pseudo-classes and an element, and this has to outrank it.
    expect(rule('.td-root .c97-field[type="number"]:invalid:not(:focus)')).toMatch(
      /border-bottom-color:\s*var\(--c97-ink-2\)/
    );
  });

  it("lets the budget table's notes give way, so the table stays inside its column on a phone", () => {
    expect(rule(".td-table td:last-child")).toMatch(/overflow-wrap:\s*anywhere/);
    const narrow = css.slice(css.indexOf("@media screen and (max-width: 359px)"));
    expect(narrow).toMatch(/\.td-root \.td-table td\s*\{\s*padding-inline:\s*var\(--c97-sp-1\)/);
  });
});
