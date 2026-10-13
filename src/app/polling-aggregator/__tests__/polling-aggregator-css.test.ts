import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

// Rules that no unit render can see, read from the sheet as text.
const sheet = postcss.parse(
  fs.readFileSync(path.join(__dirname, "..", "polling-aggregator.css"), "utf8")
);

describe("polling-aggregator.css", () => {
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

  // The 678-unit chart sits in a 562px column at 1024, so anything under 14
  // units renders below 11px there.
  it("sets the trend chart's type at 14 units or more at every width", () => {
    const sizes: number[] = [];
    sheet.walkRules(".pa-chart-text", (rule) => {
      rule.walkDecls("font-size", (decl) => {
        sizes.push(Number.parseFloat(decl.value));
      });
    });
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14);
    // The base rule sits outside any query, so no width falls between two of them.
    expect(sheet.nodes.some((node) => node.type === "rule" && node.selector === ".pa-chart-text")).toBe(true);
  });

  // A print with backgrounds off drops every fill that does not ask to be kept.
  it("keeps the chart's colour keys and the ballot bar on paper", () => {
    let kept = "";
    sheet.walkAtRules("media", (media) => {
      if (media.params !== "print") return;
      media.walkRules((rule) => {
        rule.walkDecls("print-color-adjust", (decl) => {
          if (decl.value === "exact") kept = rule.selector;
        });
      });
    });
    for (const selector of [".pa-legend-line", ".pa-ballot-bar > span", ".pa-swatch"]) {
      expect(kept).toContain(selector);
    }
  });

  it("gives a race button room above itself in the query that makes the view switch sticky", () => {
    let sticky = "";
    let room = "";
    sheet.walkAtRules("media", (media) => {
      media.walkRules(".pa-toolbar", (rule) => {
        rule.walkDecls("position", (decl) => {
          if (decl.value === "sticky") sticky = media.params;
        });
      });
      media.walkRules(".pa-race-button", (rule) => {
        rule.walkDecls("scroll-margin-top", () => {
          room = media.params;
        });
      });
    });
    expect(sticky).not.toBe("");
    expect(room).toBe(sticky);
  });
});
