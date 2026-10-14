import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

// Rules that no unit render can see, read from the sheet as text.
const css = fs.readFileSync(path.join(__dirname, "..", "spacex-mission-control.css"), "utf8");
const sheet = postcss.parse(css);

describe("spacex-mission-control.css", () => {
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

  // Unlayered CSS outranks Tailwind's utilities layer whatever the
  // specificity, so outside a layer these resets beat font-mono, a text
  // colour, or a margin utility on any heading or paragraph under the root.
  it("keeps the element resets in the base layer, under every utility", () => {
    const resets: string[] = [];
    sheet.walkRules(/^\.sx-root :where\(/, (rule) => {
      const parent = rule.parent;
      resets.push(parent?.type === "atrule" ? `@${parent.name} ${parent.params}` : "unlayered");
    });
    expect(resets).toEqual(["@layer base", "@layer base"]);
  });

  it("draws the status switch's focus ring inside the button, since the switch clips at its border", () => {
    let ring = "";
    sheet.walkRules(".sx-root .sx-switch button:focus-visible", (rule) => {
      ring = rule.toString();
    });
    expect(ring).toMatch(/outline-offset:\s*-\d/);
    expect(ring).toMatch(/outline-color:\s*currentColor/);
  });

  // A print with backgrounds off drops the band's dark fill, so every token
  // the band sets for a dark ground needs a value that reads on white.
  it("remaps every display band token for paper", () => {
    const tokens: Record<"screen" | "print", string[]> = { screen: [], print: [] };
    sheet.walkRules(".sx-console", (rule) => {
      const parent = rule.parent;
      const medium = parent?.type === "atrule" && parent.params === "print" ? "print" : "screen";
      rule.walkDecls(/^--c97-/, (decl) => {
        tokens[medium].push(decl.prop);
      });
    });
    expect(tokens.screen.length).toBeGreaterThan(0);
    expect(tokens.print.sort()).toEqual(tokens.screen.sort());
  });

  it("draws the filled button and the pressed switch without a fill on paper", () => {
    const unfilled: string[] = [];
    sheet.walkAtRules("media", (media) => {
      if (media.params !== "print") return;
      media.walkRules((rule) => {
        rule.walkDecls("background", (decl) => {
          if (decl.value === "none") unfilled.push(rule.selector);
        });
      });
    });
    expect(unfilled).toEqual([".sx-button", '.sx-switch button[aria-pressed="true"]']);
  });

  it("gives a card room above itself in the query that makes the board tools sticky", () => {
    let sticky = "";
    let room = "";
    sheet.walkAtRules("media", (media) => {
      media.walkRules(".sx-board-tools", (rule) => {
        rule.walkDecls("position", (decl) => {
          if (decl.value === "sticky") sticky = media.params;
        });
      });
      media.walkRules(".sx-cards > *", (rule) => {
        rule.walkDecls("scroll-margin-top", () => {
          room = media.params;
        });
      });
    });
    expect(sticky).not.toBe("");
    expect(room).toBe(sticky);
  });
});
