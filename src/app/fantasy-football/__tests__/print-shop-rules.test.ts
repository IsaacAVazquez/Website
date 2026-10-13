import fs from "node:fs";
import path from "node:path";

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

it("keeps the kit's one radius as a token on the root", () => {
  const kit = fs.readFileSync("src/components/fantasy/fantasy.css", "utf8");
  expect(kit).toMatch(/--ffb-radius:\s*3px;/);
});
