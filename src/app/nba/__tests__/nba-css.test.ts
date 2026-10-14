import fs from "node:fs";
import path from "node:path";

// Jest cannot lay a page out, so the rules that only matter on a narrow phone are pinned as text.
const css = fs.readFileSync(path.join(__dirname, "..", "nba.css"), "utf8");

describe("nba.css on a narrow phone", () => {
  it("drops the crests from a drawer game row under 390px, so the longest names print whole", () => {
    expect(css).toMatch(
      /@media screen and \(max-width: 389px\) \{\s*\.nba-root \.sb-games img \{\s*display: none;/
    );
  });

  it("gives the drawer's rows more width under 340px", () => {
    expect(css).toMatch(
      /@media screen and \(max-width: 339px\) \{\s*\.nba-root \.dd-panel \{\s*padding-inline: var\(--c97-sp-2\);/
    );
  });
});
