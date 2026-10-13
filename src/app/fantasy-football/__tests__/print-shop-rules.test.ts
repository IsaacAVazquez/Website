import fs from "node:fs";
import path from "node:path";

import postcss, { type AtRule } from "postcss";

// The fantasy product's drawing rules, held in source. The pages draw with the kit
// (src/components/fantasy/fantasy.css): ruled rows with no boxes, one 3px radius kept for
// sticker-shaped objects and read through the kit's token, hard edges with no blur, and
// every colour from a token. This file used to hold the Catalog 97 press rules (no radius
// at all), which the redesign on 2026-10-13 replaced with these. Retired site-wide tokens
// are banned by src/app/__tests__/catalog97-closeout.test.ts.
const ROOTS = ["src/app/fantasy-football", "src/components/fantasy"];
const EXTRA = ["src/lib/fantasyUtils.ts"];

function sources(extensions: RegExp): string[] {
  const files = ROOTS.flatMap((root) =>
    (fs.readdirSync(root, { recursive: true }) as string[]).map((file) => path.join(root, file)),
  );
  return [...files, ...EXTRA].filter(
    (file) => extensions.test(file) && !file.includes("__tests__") && !/\.test\.tsx?$/.test(file),
  );
}

const ANY = /\.(tsx?|css)$/;
const STYLESHEET = /\.css$/;
const MARKUP = /\.tsx$/;

it.each<[string, RegExp, RegExp]>([
  // Tailwind's radius scale compiles to 0 on this site, so the utility would paint nothing.
  ["a radius utility", ANY, /(?<=[\s"'`])(?:[a-z0-9-]+:)*rounded(?:-[^\s"'`]+|(?= (?:border|px-)))(?=[\s"'`])/],
  // A corner is square, or it is the sticker radius.
  // The lookahead refuses whitespace too, or the match would back up one space and pass anything.
  ["a radius that is not the kit's sticker radius", STYLESHEET, /border-radius:\s*(?!\s|0\b|var\(--ffb-radius\))/],
  ["a shadow token", ANY, /var\(--shadow-/],
  // A shadow may be a hard offset or an inset line. The third length is the blur.
  ["a blurred box shadow in markup", ANY, /boxShadow:\s*"(?!inset)-?\d+(?:px)?\s+-?\d+(?:px)?\s+[1-9]\d*px/],
  ["a blurred box shadow in a stylesheet", STYLESHEET, /box-shadow:\s*(?:inset\s+)?-?[\d.]+(?:px)?\s+-?[\d.]+(?:px)?\s+[1-9][\d.]*px/],
  // Colour comes from an --ffb-* token, so both themes and the print palette hold.
  ["a hex colour in markup", MARKUP, /["'`:(\s]#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?=["'`;,)\s])/],
])("no fantasy source uses %s", (_label, extensions, pattern) => {
  const hits = sources(extensions).filter((file) => pattern.test(fs.readFileSync(file, "utf8")));
  expect(hits).toEqual([]);
});

// An area sheet stays loaded after an in-app move to another fantasy page, so every rule in it
// starts on a class with the sheet's own prefix or on the kit's root. The route stylesheet test
// treats everything under src/components as shared and never compares these with each other.
const AREA_SHEETS = "src/components/fantasy";
const AREA_PREFIXES: Record<string, string> = {
  "fantasy-rankings.css": "ffb-rk-",
  "fantasy-trade.css": "ffb-tr-",
  "fantasy-overlays.css": "ffb-ov-",
  "fantasy-weekly.css": "ffb-wk-",
  "fantasy-draft.css": "ffb-dt-",
  "fantasy-room.css": "ffb-rm-",
  "fantasy-mock.css": "ffb-mk-",
  "fantasy-bestball.css": "ffb-bb-",
  "fantasy-bbroom.css": "ffb-br-",
};

/** Splits on a separator that sits outside every bracket. */
function splitOutside(text: string, separator: RegExp): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "(" || char === "[") depth += 1;
    else if (char === ")" || char === "]") depth -= 1;
    else if (depth === 0 && separator.test(char)) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

/** Whether a selector's first compound carries a class with the prefix, or the kit's root class. */
function startsOnOwnClass(selector: string, prefix: string): boolean {
  const first = splitOutside(selector.trim(), /[\s>+~]/)[0];
  // A list as the first compound is owned only when every branch of it is.
  const list = /^:(?:is|where)\(([\s\S]*)\)$/.exec(first);
  if (list) return splitOutside(list[1], /,/).every((branch) => startsOnOwnClass(branch, prefix));
  // A class inside :not() or :has() does not count, so what sits in brackets is dropped first.
  let bare = "";
  let depth = 0;
  for (const char of first) {
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (depth === 0) bare += char;
  }
  return new RegExp(`\\.(?:${prefix}[\\w-]+|ffb-root)(?![\\w-])`).test(bare);
}

/** Every selector of every rule in a sheet, leaving out keyframe steps. */
function selectorsOf(css: string): string[] {
  const selectors: string[] = [];
  postcss.parse(css).walkRules((rule) => {
    const parent = rule.parent;
    if (parent?.type === "atrule" && /keyframes$/.test((parent as AtRule).name)) return;
    selectors.push(...rule.selectors);
  });
  return selectors;
}

it("reads a selector's first compound the way the area sheet rule needs", () => {
  expect(startsOnOwnClass(".ffb-rk-bar > .ffb-seg", "ffb-rk-")).toBe(true);
  expect(startsOnOwnClass(".ffb-root .ffb-seg", "ffb-rk-")).toBe(true);
  expect(startsOnOwnClass(".ffb-row.ffb-rk-row:hover", "ffb-rk-")).toBe(true);
  expect(startsOnOwnClass(":is(.ffb-rk-a, .ffb-rk-b) .ffb-row", "ffb-rk-")).toBe(true);
  expect(startsOnOwnClass(".ffb-seg .ffb-rk-bar", "ffb-rk-")).toBe(false);
  expect(startsOnOwnClass(".ffb-row:not(.ffb-rk-row)", "ffb-rk-")).toBe(false);
  expect(startsOnOwnClass(":is(.ffb-rk-a, .ffb-row) span", "ffb-rk-")).toBe(false);
  expect(startsOnOwnClass(".ffb-dt-bar", "ffb-rk-")).toBe(false);
  expect(startsOnOwnClass(".ffb-rootless", "ffb-rk-")).toBe(false);
  expect(
    selectorsOf("/* .x {} */ @media (min-width: 1px) { .a, .b > .c { top: 0; } } @keyframes k { from { top: 0; } }"),
  ).toEqual([".a", ".b > .c"]);
});

it("gives every area sheet in the folder a prefix of its own", () => {
  const sheets = fs.readdirSync(AREA_SHEETS).filter((file) => /^fantasy-.+\.css$/.test(file));
  expect(sheets.filter((file) => !(file in AREA_PREFIXES))).toEqual([]);
  expect(new Set(Object.values(AREA_PREFIXES)).size).toBe(Object.keys(AREA_PREFIXES).length);
});

// A sheet that is listed and not written yet has nothing to check, so its case passes.
it.each(Object.entries(AREA_PREFIXES))("%s starts every selector on %s or on .ffb-root", (file, prefix) => {
  const sheet = path.join(AREA_SHEETS, file);
  const selectors = fs.existsSync(sheet) ? selectorsOf(fs.readFileSync(sheet, "utf8")) : [];
  expect(selectors.filter((selector) => !startsOnOwnClass(selector, prefix))).toEqual([]);
});

it("keeps the kit's one radius as a token on the root", () => {
  const kit = fs.readFileSync("src/components/fantasy/fantasy.css", "utf8");
  expect(kit).toMatch(/--ffb-radius:\s*3px;/);
});
