import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const css = fs.readFileSync(path.join(__dirname, "..", "tech-startup-tracker.css"), "utf8");

/** The selectors of every rule inside a plain `@media print` block. */
function printSelectors(): string[] {
  const selectors: string[] = [];
  postcss.parse(css).walkAtRules("media", (media) => {
    if (media.params !== "print") return;
    media.walkRules((rule) => {
      if (rule.some((node) => node.type === "decl" && node.prop === "display" && node.value === "none")) {
        selectors.push(...rule.selectors);
      }
    });
  });
  return selectors;
}

describe("tech-startup-tracker.css", () => {
  // A one-row strip that scrolls sideways can open a deep link with the pressed
  // segment off screen, and its scroll box clips the focus ring.
  it("lets the switches wrap at every width, with nothing scrolling sideways", () => {
    expect(css).not.toMatch(/flex-wrap:\s*nowrap/);
    expect(css).not.toMatch(/overflow-x/);
  });

  it("hides the unpressed options on paper and keeps the Sort group", () => {
    expect(printSelectors()).toContain('.ts-switch > button:not([aria-pressed="true"])');
    expect(printSelectors()).not.toContain(".ts-sort");
  });

  // Light ink on white is lost when backgrounds are off, so paper takes the
  // light palette in both themes.
  it("keeps the dark palette off paper", () => {
    const dark: string[] = [];
    postcss.parse(css).walkRules(/\.dark\b/, (rule) => {
      const parent = rule.parent;
      dark.push(parent?.type === "atrule" ? (parent as postcss.AtRule).params : "none");
    });
    expect(dark).toEqual(["screen"]);
  });
});
