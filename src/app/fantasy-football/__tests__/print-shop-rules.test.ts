import fs from "node:fs";
import path from "node:path";

// The fantasy suite prints in the Catalog 97 press: no Working Instrument
// tokens, no radius, and no blurred shadow. The bridge zeroes --shadow-* and
// --radius-* today, so a reference to either would repaint at the close-out.
const ROOTS = ["src/app/fantasy-football", "src/components/fantasy"];
const EXTRA = ["src/lib/fantasyUtils.ts"];

function sources(): string[] {
  const files = ROOTS.flatMap((root) =>
    (fs.readdirSync(root, { recursive: true }) as string[]).map((file) => path.join(root, file)),
  );
  return [...files, ...EXTRA].filter(
    (file) => /\.(tsx?|css)$/.test(file) && !file.includes("__tests__") && !/\.test\.tsx?$/.test(file),
  );
}

it.each([
  ["a Working Instrument token", /var\(--home-|--font-home-/],
  ["a radius utility", /(?<=[\s"'`])(?:[a-z0-9-]+:)*rounded(?:-[^\s"'`]+|(?= (?:border|px-)))(?=[\s"'`])/],
  ["a border radius", /border-radius:\s*(?!0\b)/],
  ["a shadow token", /var\(--shadow-/],
  ["a blurred box shadow", /boxShadow:\s*"(?!inset)-?\d+(?:px)?\s+-?\d+(?:px)?\s+[1-9]\d*px/],
])("no fantasy source uses %s", (_label, pattern) => {
  const hits = sources().filter((file) => pattern.test(fs.readFileSync(file, "utf8")));
  expect(hits).toEqual([]);
});
