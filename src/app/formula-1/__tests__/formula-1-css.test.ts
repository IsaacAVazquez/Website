import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

// Rules a unit render cannot see. Each keeps something on a phone or
// under the keyboard that the layout would otherwise hide.
const root = postcss.parse(fs.readFileSync(path.join(__dirname, "..", "formula-1.module.css"), "utf8"));

/** Each value of one property under one selector, as [media query or "", value]. */
function declared(selector: string, property: string): Array<[string, string]> {
  const found: Array<[string, string]> = [];
  root.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    const media = rule.parent?.type === "atrule" ? (rule.parent as postcss.AtRule).params : "";
    rule.walkDecls(property, (decl) => {
      found.push([media, decl.value]);
    });
  });
  return found;
}

describe("formula-1.module.css", () => {
  it("draws the focus ring inside the buttons of the two rows that scroll sideways", () => {
    // Both rows clip what is drawn outside them, and the root keeps the rule above the shell's ring.
    expect(declared(".root .switch button:focus-visible", "outline-offset")).toEqual([["", "-3px"]]);
    expect(declared(".root .raceStripItem:focus-visible", "outline-offset")).toEqual([["", "-3px"]]);
  });

  it("prints the four view tabs two by two where one row does not fit", () => {
    expect(declared(".switch", "display")).toEqual([
      ["", "flex"],
      ["screen and (max-width: 399px)", "grid"],
    ]);
    expect(declared(".switch", "overflow-x")).toEqual([
      ["", "auto"],
      ["screen and (max-width: 399px)", "visible"],
    ]);
    // The two rows are about 90px of sticky switch, so an anchor jump clears more there.
    const cleared: Array<[string, string]> = [
      ["", "56px"],
      ["screen and (max-width: 399px)", "100px"],
    ];
    expect(declared(".board", "scroll-margin-top")).toEqual(cleared);
    expect(declared(".anchor", "scroll-margin-top")).toEqual(cleared);
  });

  it("keeps a focused row or link on the board clear of the sticky switch", () => {
    expect(declared(".toolbar", "position")).toContainEqual(["", "sticky"]);
    expect(declared(".board :where(button, a)", "scroll-margin-top")).toEqual([
      ["", "56px"],
      ["screen and (max-width: 399px)", "100px"],
    ]);
  });

  it("shows the second line under the name and the points exactly where the columns are hidden", () => {
    const narrow = "screen and (max-width: 559px)";
    expect(declared(".wideOnly", "display")).toEqual([[narrow, "none"]]);
    expect(declared(".narrowOnly", "display")).toEqual([
      ["", "none"],
      [narrow, "block"],
    ]);
  });

  it("hangs a wrapped name under its first line, and the team line with it", () => {
    const nameCell = ".table td:has(> .livery)";
    const tight = "screen and (max-width: 359px)";
    // The first line is pulled back by the swatch and its margin, which is what the cell's extra padding makes room for.
    expect(declared(nameCell, "text-indent")).toEqual([["", "calc(-4px - var(--c97-sp-1))"]]);
    expect(declared(nameCell, "padding-left")).toEqual([
      ["", "calc(var(--c97-sp-1) + 4px + var(--c97-sp-1))"],
      [tight, "calc(var(--c97-sp-0) + 4px + var(--c97-sp-1))"],
    ]);
    // The team is a block of its own, so it would take the pull back as well.
    expect(declared(".livery ~ .narrowOnly", "text-indent")).toEqual([["screen and (max-width: 559px)", "0"]]);
    expect(declared(".livery ~ .narrowOnly", "padding-left")).toEqual([]);
    // The narrowest phones fit the five columns only with half the cell padding.
    expect(declared(".table td", "padding-inline")).toEqual([[tight, "var(--c97-sp-0)"]]);
    expect(declared(".table th", "padding-inline")).toEqual([[tight, "var(--c97-sp-0)"]]);
  });
});
