import fs from "node:fs";
import path from "node:path";

// Layout rules a unit render cannot see. Each one holds a long value or a
// wide row inside the page, or keeps a rule from losing to `.bp-register td`.
const css = fs.readFileSync(path.join(__dirname, "..", "budget-planner.css"), "utf8");
const print = css.slice(css.lastIndexOf("@media print {"));

describe("budget-planner.css: ledger and month bar", () => {
  it("scrolls a wide ledger inside its own region", () => {
    expect(css).toMatch(/\.bp-register-scroll\s*\{[^}]*overflow-x:\s*auto;/);
  });

  // The header's sr-only label is absolute, and escapes a static scroller.
  it("contains the hidden header label in the scroll region", () => {
    expect(css).toMatch(/\.bp-register-scroll\s*\{[^}]*position:\s*relative;/);
  });

  it("wraps a long unbroken note", () => {
    expect(css).toMatch(/\.bp-register td\[data-label="Note"\]\s*\{[^}]*overflow-wrap:\s*anywhere;/);
  });

  it("puts the month bar on one row only from 1280px, where the summary has its full width", () => {
    expect(css).toMatch(/@media screen and \(min-width: 1280px\)\s*\{\s*\.bp-month\s*\{/);
    expect(css).not.toMatch(/@media screen and \(min-width: 1024px\)/);
  });

  it("keeps a summary figure on one line, minus sign included", () => {
    expect(css).toMatch(/\.bp-sum-value\s*\{[^}]*white-space:\s*nowrap;/);
  });

  // A bare .bp-register-actions is one class and loses to `.bp-register td`.
  it("names the actions cell under the table, so it outranks the cell rules", () => {
    expect(css).toMatch(/^\.bp-register \.bp-register-actions\s*\{[^}]*text-align:\s*right;/m);
    expect(css).not.toMatch(/^\s*\.bp-register-actions\s*[,{]/m);
  });

  it("takes the row actions off paper", () => {
    expect(print).toMatch(/\.bp-register \.bp-register-actions,[^{]*\{\s*display:\s*none;/);
  });
});
