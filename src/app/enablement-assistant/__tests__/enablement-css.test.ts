import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

// Rules that no unit render can see, read from the sheet as text.
const css = fs.readFileSync(path.join(__dirname, "..", "enablement.css"), "utf8");
const sheet = postcss.parse(css);

describe("enablement.css", () => {
  it("draws the view switch's focus ring inside the button, since the switch clips at its border", () => {
    let ring = "";
    sheet.walkRules(".ea-root .ea-switch > button:focus-visible", (rule) => {
      ring = rule.toString();
    });
    expect(ring).toMatch(/outline-offset:\s*-\d/);
    expect(ring).toMatch(/outline-color:\s*currentColor/);
  });

  it("leaves a disabled button alone on hover, since these hovers outrank the frame's disabled rule", () => {
    const hovers: string[] = [];
    sheet.walkRules((rule) => {
      // ".c97-btn" also matches ".c97-btn-ghost".
      hovers.push(...rule.selectors.filter((selector) => selector.includes(".c97-btn") && selector.includes(":hover")));
    });
    expect(hovers.length).toBeGreaterThan(0);
    for (const selector of hovers) expect(selector).toContain(":not(:disabled)");
  });
});
