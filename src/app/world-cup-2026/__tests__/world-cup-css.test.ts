import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(__dirname, "..", "world-cup.css"), "utf8");

/** The body of the first rule for `selector` inside `block`. */
function rule(block: string, selector: string): string {
  const start = block.indexOf(`${selector} {`);
  return start === -1 ? "" : block.slice(start, block.indexOf("}", start));
}

describe("world-cup.css", () => {
  // The team card runs taller than a 768px window, and a stuck column that
  // cannot scroll keeps its last results below the fold.
  it("lets the pinned team column scroll inside a short window", () => {
    const wide = css.slice(css.indexOf("@media screen and (min-width: 1280px)"));
    const aside = rule(wide, ".wcup-aside");

    expect(aside).toMatch(/position:\s*sticky/);
    expect(aside).toMatch(/max-height:\s*calc\(100dvh - 2 \* var\(--c97-sp-4\)\)/);
    expect(aside).toMatch(/overflow-y:\s*auto/);
  });

  it("tints the pinned team's ledger rows without touching the table rows", () => {
    expect(rule(css, ".wcup-panel div[data-selected]")).toMatch(/background:/);
  });

  // A 22px flag and its gap take 30px from each name, which is the room
  // "Bosnia-Herz" and "Switzerland" need at 320 and 360px.
  it("drops the ledger's flags on the narrowest phones and keeps the tables' crests", () => {
    const narrow = css.slice(css.indexOf("@media screen and (max-width: 374px)"));

    expect(rule(narrow, ".wcup-panel div.grid img")).toMatch(/display:\s*none/);
    expect(css).not.toMatch(/\.wcup-crest\s*\{[^}]*display:\s*none/);
  });
});
