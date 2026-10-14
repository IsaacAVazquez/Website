import fs from "node:fs";
import path from "node:path";

// Layout rules a unit render cannot see, since jsdom loads no stylesheet.
const css = fs.readFileSync(path.join(__dirname, "..", "museum-log.css"), "utf8");

/** The flex-basis, in rem, of the first rule for `selector`. */
function basisRem(selector: string): number {
  const escaped = selector.replace(/\./g, "\\.");
  const basis = css.match(new RegExp(`\\n${escaped}\\s*\\{[^}]*flex:\\s*\\d+\\s+\\d+\\s+([\\d.]+)rem`))?.[1];
  return Number(basis);
}

describe("museum-log.css", () => {
  it("fits the strip of last visits beside the title in the 1080px shell", () => {
    // The strip arrives once the saved log is read. Beside the title it costs the
    // catalog a line or two of the lede, where a row of its own would cost a row of tickets.
    const shell = 1080;
    const widestColumnGap = 44; // --c97-sp-4 at its upper clamp
    const needed = (basisRem(".mlog-title") + basisRem(".mlog-head .mlog-strip-wrap")) * 16 + widestColumnGap;
    expect(needed).toBeLessThanOrEqual(shell);
  });

  it("keeps the strip wide enough for three tickets across", () => {
    const ticket = 11 * 16; // the strip's minmax floor
    const widestGap = 17; // --c97-sp-2 at its upper clamp
    expect(basisRem(".mlog-head .mlog-strip-wrap") * 16).toBeGreaterThanOrEqual(3 * ticket + 2 * widestGap);
  });

  it("keeps that basis off the strip after the catalog, where a column would read it as a height", () => {
    expect(basisRem(".mlog-strip-wrap")).toBeNaN();
  });

  it("sizes the visited sentence to its widest reading, so the count cannot rewrap the summary", () => {
    expect(css).toMatch(/\n\.mlog-visited\s*\{\s*display:\s*inline-grid;/);
    expect(css).toMatch(/\n\.mlog-visited::after\s*\{[^}]*content:\s*attr\(data-widest\);[^}]*height:\s*0;/);
  });

  it("prints a museum without its buttons, its rating form, or the lines that say how to use them", () => {
    const print = css.slice(css.lastIndexOf("@media print {"));
    for (const selector of [".mlog-action", ".mlog-detail form", ".mlog-activity-help"]) {
      expect(print).toContain(`  ${selector},\n`);
    }
    expect(print).toMatch(/\{\s*display:\s*none;\s*\}/);
  });
});
