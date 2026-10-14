import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

// Rules that no unit render can see, read from the sheet as text.
const sheet = postcss.parse(fs.readFileSync(path.join(__dirname, "..", "news-pulse.css"), "utf8"));

/** Every value one property takes under one exact selector, with the query it sits in. */
function declared(selector: string, property: string): { value: string; media: string | null }[] {
  const found: { value: string; media: string | null }[] = [];
  sheet.walkRules(selector, (rule) => {
    const parent = rule.parent;
    rule.walkDecls(property, (decl) => {
      found.push({ value: decl.value, media: parent?.type === "atrule" ? parent.params : null });
    });
  });
  return found;
}

describe("news-pulse.css", () => {
  it("names screen or print on every width query, so paper never takes the desktop layout", () => {
    const widthQueries: string[] = [];
    sheet.walkAtRules("media", (rule) => {
      if (rule.params.includes("width")) widthQueries.push(rule.params);
    });
    expect(widthQueries.length).toBeGreaterThan(0);
    for (const query of widthQueries) {
      expect(query).toMatch(/\b(screen|print)\b/);
    }
  });

  it("keeps the wide-only blocks off until the one query that swaps them in, so no width shows both", () => {
    expect(declared(".np-lg-only", "display")).toEqual([
      { value: "none", media: null },
      { value: "block", media: "screen and (min-width: 1024px)" },
    ]);
    expect(declared(".np-sm-only", "display")).toEqual([
      { value: "none", media: "screen and (min-width: 1024px)" },
    ]);
  });

  it("rings an outlet swatch on the dark paper, where the NYT and Guardian fills match it", () => {
    expect(declared(".dark .np-root .np-swatch", "outline")).toEqual([
      { value: "1px solid var(--np-rule-strong)", media: null },
    ]);
  });
});
