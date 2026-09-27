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

it("declares a riso constant for every ink", () => {
  for (const name of ["blue", "saffron", "vermilion", "peach", "green", "teal", "pink"]) {
    expect(css).toMatch(new RegExp(`--c97-riso-${name}:\\s*#[0-9a-f]{6}`, "i"));
  }
});
