import fs from "node:fs";
import path from "node:path";

// Jest cannot print a page, so the rule that only matters on paper is pinned as text.
const css = fs.readFileSync(path.join(__dirname, "..", "mlb.css"), "utf8");
const printBlock = /@media print \{[\s\S]*?\n\}/.exec(css)?.[0] ?? "";

describe("mlb.css on paper", () => {
  it("keeps the fill of a last-ten win, which browsers drop with the other backgrounds", () => {
    expect(printBlock).toMatch(/\.mlb-square\[data-square="W"\] \{[^}]*\bprint-color-adjust: exact;/);
  });
});
