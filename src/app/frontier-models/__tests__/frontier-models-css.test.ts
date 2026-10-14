import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const css = fs.readFileSync(path.join(__dirname, "..", "frontier-models.css"), "utf8");

describe("frontier-models.css", () => {
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
