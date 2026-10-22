import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(__dirname, "..", "before-you-buy.css"), "utf8");

describe("before-you-buy.css", () => {
  // Under 960px the result sits below the portfolio, so a long list of saved
  // holdings scrolls inside its own region instead of pushing the result away.
  it("caps the expanded holdings editor", () => {
    expect(css).toMatch(/\.byb-portfolio \.byb-scroll \{ max-block-size: 22rem;/);
  });

  // StockSearch wraps its list in a paper surface, which would otherwise put
  // Catalog 97's paper colours inside this route.
  it("hands the portalled suggestion list the route palette in both themes", () => {
    expect(css).toMatch(
      /\.c97-page \.byb \[data-c97-surface\],\s*\.dark \.c97-page \.byb \[data-c97-surface\] \{[^}]*--c97-panel: var\(--byb-field\);/
    );
  });
});
