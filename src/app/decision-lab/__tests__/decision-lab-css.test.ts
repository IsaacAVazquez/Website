import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(__dirname, "..", "decision-lab.css"), "utf8");

describe("decision-lab.css", () => {
  // A browser leaves backgrounds off paper by default, which would print the
  // pressed chip's paper-coloured name on white.
  it("keeps the pressed preset chip's fill on paper", () => {
    const print = css.slice(css.indexOf("@media print"));
    expect(print).toMatch(/\.dl-chip\[aria-pressed="true"\] \{[^}]*[^-]print-color-adjust: exact;/);
  });

  // One column would otherwise give the matrix the page's whole width.
  it("holds the matrix to its desktop width while the worksheet is one column", () => {
    expect(css).toMatch(/@media screen and \(max-width: 959px\) \{\s*\.dl-figure \{\s*max-inline-size: 30rem;/);
  });

  // The left column just past the two-column breakpoint is as narrow as a phone.
  it("stacks the ledger's bar under its row on a phone and in the narrowest two-column layout", () => {
    expect(css).toMatch(
      /@media screen and \(max-width: 479px\), screen and \(min-width: 960px\) and \(max-width: 1039px\) \{\s*\.dl-contribution \{/
    );
  });
});
