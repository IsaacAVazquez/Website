import fs from "node:fs";
import path from "node:path";

// Layout rules no rendered unit test can see, pinned at the source so the
// shelf keeps its bounds.
const css = fs.readFileSync(path.join(__dirname, "..", "recipe-finder.css"), "utf8");

describe("recipe-finder.css: the pantry shelf keeps its bounds", () => {
  it("caps the sticky shelf at the window's height and scrolls it inside", () => {
    const sticky =
      css.match(
        /@media screen and \(min-width: 1024px\) and \(min-height: 820px\)\s*\{\s*\.rf-shelf\s*\{([^}]*)\}/
      )?.[1] ?? "";

    expect(sticky).toMatch(/position:\s*sticky/);
    expect(sticky).toMatch(/max-height:\s*calc\(100dvh - 2 \* var\(--c97-sp-3\)\)/);
    expect(sticky).toMatch(/overflow-y:\s*auto/);
  });

  it("lets an unbroken pantry label wrap inside the shelf", () => {
    const tag = css.match(/\.rf-tag\s*\{([^}]*)\}/)?.[1] ?? "";

    // `anywhere`, not `break-word`: only it lowers the label's minimum width.
    expect(tag).toMatch(/overflow-wrap:\s*anywhere/);
  });
});
