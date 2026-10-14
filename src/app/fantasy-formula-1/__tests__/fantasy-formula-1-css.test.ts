import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

// Rules a unit render cannot see. Each keeps a label or a focused control
// readable where the layout would otherwise cut or cover it.
const root = postcss.parse(fs.readFileSync(path.join(__dirname, "..", "fantasy-formula-1.css"), "utf8"));

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

describe("fantasy-formula-1.css", () => {
  it("wraps a slot's label line, which carries the Locked word and a phone's price", () => {
    expect(declared(".ff1-slot-kind", "white-space")).toEqual([]);
    expect(declared(".ff1-slot-kind", "text-overflow")).toEqual([]);
    expect(declared(".ff1-slot-kind", "overflow")).toEqual([]);
  });

  it("keeps a focused slate row clear of the sticky toolbar", () => {
    expect(declared(".ff1-slate-toolbar", "position")).toContainEqual(["", "sticky"]);
    expect(declared(".ff1-slate-toolbar", "z-index")).toEqual([["", "var(--c97-z-sticky)"]]);
    expect(declared(".ff1-table :where(button, summary)", "scroll-margin-top")).toEqual([["", "5rem"]]);
  });

  it("draws the focus ring inside the slate controls where a phone scrolls them in one row", () => {
    const phone = "screen and (max-width: 639px)";
    expect(declared(".ff1-controls", "overflow-x")).toEqual([[phone, "auto"]]);
    expect(declared(".ff1-root .ff1-switch button:focus-visible", "outline-offset")).toEqual([[phone, "-3px"]]);
  });
});
