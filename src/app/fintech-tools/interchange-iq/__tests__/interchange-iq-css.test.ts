import fs from "node:fs";
import path from "node:path";

// The statement's phone layout, which a unit render cannot see. The Cheapest
// mark only has width on the cheapest rows, so on the fee's line it would set
// those fees left of the rest and leave the name less room than it needs.
const css = fs.readFileSync(path.join(__dirname, "..", "interchange-iq.css"), "utf8");
const start = css.indexOf("@media screen and (max-width: 639px)");
const phone = css.slice(start, css.indexOf("Breakeven", start));

describe("interchange-iq.css: statement rows under 640px", () => {
  it("gives the first line to the name, the fee, and the chevron", () => {
    expect(phone).toMatch(/\.iq-statement summary\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto 16px;/);
  });

  it("moves the Cheapest mark to a line of its own under the bar", () => {
    expect(phone).toMatch(/\.iq-row-mark\s*\{[^}]*grid-row:\s*3;[^}]*grid-column:\s*1 \/ -1;/);
  });

  it("drops the empty mark, so the other rows get no third line", () => {
    expect(phone).toMatch(/\.iq-row-mark:empty\s*\{[^}]*display:\s*none;/);
  });
});
