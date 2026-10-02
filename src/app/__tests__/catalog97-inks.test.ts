import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(process.cwd(), "src/app/catalog97.css"), "utf8");
const INKS = ["ink-blue", "ink-saffron", "ink-vermilion", "ink-peach", "ink-green", "ink-teal", "ink-pink"];

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`missing block ${selector}`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/(--c97-[a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe.each(INKS)("%s", (ink) => {
  for (const theme of ["light", "dark"] as const) {
    const selector = `${theme === "dark" ? ".dark " : ""}.c97-page [data-c97-surface="${ink}"]`;
    it(`${theme}: ink, ink-2, label, and action clear 4.5:1 on the surface`, () => {
      const t = block(selector);
      for (const token of ["--c97-ink", "--c97-ink-2", "--c97-label", "--c97-action"]) {
        expect({ token, clears: contrast(t[token], t["--c97-surface"]) >= 4.5 }).toEqual({ token, clears: true });
      }
    });
  }
});

/*
 * A panel is a box printed on a sheet, so its text keeps the sheet's inks.
 * The field tint is pale on the light-ink sheets (blue, teal, espresso,
 * chocolate), which is why panels get their own token.
 */
const SURFACES = [
  "paper",
  "bone",
  "stone",
  "chocolate",
  "espresso",
  "ink-blue",
  "ink-saffron",
  "ink-vermilion",
  "ink-peach",
  "ink-green",
  "ink-teal",
  "ink-pink",
];

describe.each(SURFACES)("%s panel", (surface) => {
  for (const theme of ["light", "dark"] as const) {
    it(`${theme}: ink, ink-2, and label clear 4.5:1 on --c97-panel`, () => {
      const t = block(`${theme === "dark" ? ".dark " : ""}.c97-page [data-c97-surface="${surface}"]`);
      expect(t["--c97-panel"]).toMatch(/^#[0-9a-f]{6}$/);
      for (const token of ["--c97-ink", "--c97-ink-2", "--c97-label"]) {
        const ratio = contrast(t[token], t["--c97-panel"]);
        expect({ token, ratio: Number(ratio.toFixed(2)), clears: ratio >= 4.5 }).toMatchObject({ token, clears: true });
      }
    });
  }
});

it("paints panels with the panel token", () => {
  const start = css.indexOf(".c97-panel {");
  expect(css.slice(start, css.indexOf("}", start))).toMatch(/background:\s*var\(--c97-panel\)/);
});

it("declares a riso constant for every ink", () => {
  for (const name of ["blue", "saffron", "vermilion", "peach", "green", "teal", "pink"]) {
    expect(css).toMatch(new RegExp(`--c97-riso-${name}:\\s*#[0-9a-f]{6}`, "i"));
  }
});

/*
 * On paper and bone the panel and the field share a tint, so a field needs a
 * printed edge of its own. It uses ink-2, which the panel test above already
 * holds at 4.5:1 on every panel, so the edge clears the 3:1 bar for controls.
 */
it("gives fields a printed edge in ink-2", () => {
  const start = css.indexOf(".c97-field {");
  expect(css.slice(start, css.indexOf("}", start))).toMatch(/border-bottom:\s*\d+px solid var\(--c97-ink-2\)/);
});

it("marks disabled buttons and fields without dimming their text", () => {
  const rule = css.match(/([^{}]*\.c97-field:disabled[^{}]*)\{([^}]*)\}/);
  expect(rule).not.toBeNull();
  const [, selector, body] = rule!;
  expect(selector).toMatch(/\.c97-btn/);
  expect(selector).toMatch(/\.c97-field/);
  expect(body).not.toMatch(/opacity/);
});

/*
 * The light chart ramp's darkest steps are espresso and chocolate themselves,
 * so a chart printed on those sheets vanished in light mode. They print the
 * dark ramp in both themes, and the four steps that read apart hold the 3:1
 * bar for marks on espresso. Chocolate is a lighter sheet, so charts belong on
 * espresso and chocolate is held only for the first three steps.
 */
describe("the dark sheets print the dark chart ramp", () => {
  const start = css.indexOf('.c97-page :is([data-c97-surface="espresso"], [data-c97-surface="chocolate"]) {');
  const ramp =
    start === -1
      ? {}
      : Object.fromEntries(
          [...css.slice(start, css.indexOf("}", start)).matchAll(/(--c97-chart-\d):\s*(#[0-9a-f]{6})/gi)].map((m) => [
            m[1],
            m[2].toLowerCase(),
          ]),
        );
  const cases: [string, string[]][] = [
    ["espresso", ["--c97-chart-1", "--c97-chart-2", "--c97-chart-3", "--c97-chart-6"]],
    ["chocolate", ["--c97-chart-1", "--c97-chart-2", "--c97-chart-3"]],
  ];
  for (const [surface, steps] of cases) {
    for (const theme of ["light", "dark"] as const) {
      it(`${surface} ${theme}: ${steps.length} steps clear 3:1`, () => {
        const t = block(`${theme === "dark" ? ".dark " : ""}.c97-page [data-c97-surface="${surface}"]`);
        for (const step of steps) {
          const value = (ramp as Record<string, string>)[step];
          expect(value).toMatch(/^#[0-9a-f]{6}$/);
          const ratio = contrast(value, t["--c97-surface"]);
          expect({ step, ratio: Number(ratio.toFixed(2)), clears: ratio >= 3 }).toMatchObject({ step, clears: true });
        }
      });
    }
  }
});
