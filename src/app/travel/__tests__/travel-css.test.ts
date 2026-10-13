import fs from "node:fs";
import path from "node:path";

// Layout rules a unit render cannot see, since jsdom loads no stylesheet.
const css = fs.readFileSync(path.join(__dirname, "..", "travel.css"), "utf8");

describe("travel.css", () => {
  it("lays the stop form four across only while the days have the full width", () => {
    // From 1024px the time grid takes a column, and a quarter of the rest clips a date or a time.
    const fourAcross = css.match(/@media ([^{]+)\{\s*\.tp-form-stop\s*\{\s*grid-template-columns:\s*repeat\(4,/);
    expect(fourAcross?.[1].trim()).toBe("screen and (min-width: 720px) and (max-width: 1023px)");
  });

  it("prints the budget and notes from their own block while the disclosure stays hidden on paper", () => {
    expect(css).toMatch(/\n\.tp-print-details\s*\{\s*display:\s*none;\s*\}/);
    const print = css.slice(css.lastIndexOf("@media print {"));
    expect(print).toMatch(/\.tp-print-details\s*\{\s*display:\s*block;/);
    expect(print).toMatch(/\.tp-manage,/);
  });
});
