import { readFileSync } from "node:fs";
import path from "node:path";

const globals = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8")
  // Comments can hold braces, and they are not part of the cascade.
  .replace(/\/\*[\s\S]*?\*\//g, "");

/** The preludes of the blocks that enclose the text at `index`, outermost first. */
function enclosingBlocks(css: string, index: number): string[] {
  const stack: string[] = [];
  let preludeStart = 0;
  for (let position = 0; position < index; position++) {
    const character = css[position];
    if (character === "{") {
      stack.push(css.slice(preludeStart, position).trim());
      preludeStart = position + 1;
    } else if (character === "}") {
      stack.pop();
      preludeStart = position + 1;
    } else if (character === ";") {
      preludeStart = position + 1;
    }
  }
  return stack;
}

describe("theme transition", () => {
  const declaration = "transition-property: color, background-color, border-color";

  // Outside a layer and at specificity (0,1,2), this rule beat every Tailwind
  // transition utility and every single-class transition in catalog97.css, so
  // a transition a component asked for never ran.
  it("is a base-layer default that any component transition overrides", () => {
    const index = globals.indexOf(declaration);
    expect(index).toBeGreaterThan(-1);
    expect(globals.indexOf(declaration, index + 1)).toBe(-1);

    expect(enclosingBlocks(globals, index)).toEqual([
      "@layer base",
      ":where(*:not(svg):not(path))",
    ]);
  });
});
