import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

// None of these rules shows in a unit render, and each one decides whether
// something on the board can be seen: a focus ring, a name on a phone, the
// board on paper.
const css = fs.readFileSync(path.join(__dirname, "..", "golf.css"), "utf8");

/**
 * Every declaration of one property under one exact selector, inside the
 * at-rule whose params are given, or outside any at-rule when none is.
 */
function declared(selector: string, property: string, media?: string): string[] {
  const values: string[] = [];
  postcss.parse(css).walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    const parent = rule.parent as { type: string; params?: string } | undefined;
    if ((parent?.type === "atrule" ? parent.params : undefined) !== media) return;
    rule.walkDecls(property, (decl) => {
      values.push(decl.value);
    });
  });
  return values;
}

describe("golf.css: focus rings land on the surface they are drawn for", () => {
  it("rings a slat's name in the slat's focus colour, inside the slat", () => {
    expect(declared(".golf-slats", "--c97-accent")).toEqual(["var(--golf-focus-slat)"]);
    expect(declared(".golf-slats .golf-name:focus-visible", "outline-offset")).toEqual(["-2px"]);
  });

  it("leaves a card's ring, which falls on the green ground, in the ground's gold", () => {
    expect(declared(".c97-golf-card", "--c97-accent")).toEqual([]);
    expect(declared(".golf-root", "--c97-accent")).toEqual(["var(--golf-gold)"]);
  });
});

describe("golf.css: the board on a phone and under the site search", () => {
  it("wraps a long name under 480px, where one line holds about nine letters", () => {
    const phone = "screen and (max-width: 479px)";
    expect(declared(".golf-name-text", "white-space", phone)).toEqual(["normal"]);
    expect(declared(".golf-name-text", "overflow-wrap", phone)).toEqual(["anywhere"]);
  });

  it("stacks the sticky toolbar on the shared token", () => {
    expect(declared(".golf-toolbar", "z-index", "screen and (min-width: 640px)")).toEqual([
      "var(--c97-z-sticky)",
    ]);
  });

  it("lands every stop on the board clear of the stuck toolbar, the scroll region included", () => {
    const stuck = "screen and (min-width: 640px)";
    for (const stop of [".golf-scroll", ".golf-name", ".c97-golf-card", ".golf-more"]) {
      expect(declared(stop, "scroll-margin-top", stuck)).toEqual(["5rem"]);
    }
  });
});

describe("golf.css: the board on paper", () => {
  it("prints the light inks on white in the dark theme too", () => {
    // `.dark .golf-root` outranks a bare `.golf-root`, so the print block has to name it.
    expect(declared(".dark .golf-root", "--golf-ground", "print")).toEqual(["#ffffff"]);
    expect(declared(".dark .golf-root", "--golf-ink", "print")).toEqual(
      declared(".golf-root", "--golf-ink")
    );
  });

  it("prints the selected tab as ink text, since paper drops its fill", () => {
    expect(declared('.golf-switch > button[aria-selected="true"]', "background", "print")).toEqual(["none"]);
    expect(declared('.golf-switch > button[aria-selected="true"]', "color", "print")).toEqual([
      "var(--golf-on-ground)",
    ]);
  });
});
