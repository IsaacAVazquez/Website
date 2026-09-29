import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const globals = read("src/app/globals.css");
const catalog = read("src/app/catalog97.css");
const tailwind = read("tailwind.config.ts");

function sourceFiles(dir: string): string[] {
  return readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(rel);
    return /\.(tsx?|css|mdx?)$/.test(entry.name) ? [rel] : [];
  });
}

/*
 * Tokens that stopped existing when the Working Instrument was deleted on
 * 2026-09-27. A read of any of them resolves to nothing, so it is either a
 * regression or a silent bug.
 */
// `\(--` matches both `var(--x)` and Tailwind v4's `bg-(--x)` shorthand.
const DEAD_TOKEN_READ = new RegExp(
  [
    "\\(--" + "home-",
    "--" + "font-home-",
    "\\(--font-(?:body|heading|display|inter|mono|jetbrains-mono)[,)]",
    "\\(--(?:radius|shadow)-",
    "\\(--color-(?:primary|secondary|accent|success|warning|error)[,)]",
    "\\(--" + "surface-",
    "\\(--text-(?:primary|secondary|tertiary|inverse)[,)]",
    "\\(--border-(?:primary|secondary|accent)[,)]",
  ].join("|"),
);

/*
 * Catalog 97's classes are unlayered and Tailwind's utilities sit in
 * @layer utilities, so a margin, padding, gap, or max-width utility on an
 * element whose Catalog 97 class sets the same property never renders. On
 * 2026-09-28 there were 240. Where the missing space showed (kickers touching
 * headings, filters flush against tables) it moved to an inline --c97-sp step,
 * and the rest were deleted. Spacing on a Catalog 97 element goes inline.
 */
const SPACING_UTILITY: Record<string, RegExp> = {
  margin: /^-?m[trblxyse]?-/,
  "margin-inline": /^-?m[xlrse]-/,
  "margin-block": /^-?m[ytb]-/,
  "margin-top": /^-?mt-/,
  "margin-bottom": /^-?mb-/,
  "margin-left": /^-?m[ls]-/,
  "margin-right": /^-?m[re]-/,
  "margin-block-start": /^-?mt-/,
  "margin-block-end": /^-?mb-/,
  "margin-inline-start": /^-?m[ls]-/,
  "margin-inline-end": /^-?m[re]-/,
  padding: /^p[trblxyse]?-/,
  "padding-inline": /^p[xlrse]-/,
  "padding-block": /^p[ytb]-/,
  "padding-top": /^pt-/,
  "padding-bottom": /^pb-/,
  "padding-left": /^p[ls]-/,
  "padding-right": /^p[re]-/,
  gap: /^gap-/,
  "row-gap": /^gap-y-/,
  "column-gap": /^gap-x-/,
  "max-width": /^max-w-/,
  "max-inline-size": /^max-w-/,
};

/** The spacing utilities each unlayered, unconditional, single-class c97 rule overrides. */
function overriddenUtilities(css: string): Map<string, RegExp[]> {
  const flat = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@[a-z-]+[^{;]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");
  const owns = new Map<string, RegExp[]>();
  for (const [, selectors, body] of flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const kills = Object.entries(SPACING_UTILITY)
      .filter(([property]) => new RegExp(`(?:^|;)\\s*${property}\\s*:`).test(body))
      .map(([, utility]) => utility);
    if (kills.length === 0) continue;
    for (const selector of selectors.split(",")) {
      const cls = selector.trim().match(/^\.(c97-[a-z0-9-]+)$/)?.[1];
      if (cls) owns.set(cls, [...(owns.get(cls) ?? []), ...kills]);
    }
  }
  return owns;
}

/** The utilities in one className that a Catalog 97 class beside them overrides. */
function deadSpacing(className: string, owns: Map<string, RegExp[]>): string[] {
  const tokens = className.split(/\s+/).filter(Boolean);
  const kills = tokens.flatMap((token) => owns.get(token) ?? []);
  return tokens.filter((token) => {
    if (owns.has(token) || token.startsWith("!") || token.endsWith("!")) return false;
    const utility = token.split(":").pop() ?? "";
    return !utility.startsWith("space-") && kills.some((kill) => kill.test(utility));
  });
}

describe("Catalog 97 close-out", () => {
  // These two spell the banned patterns out in order to ban them.
  const banLists = new Set([
    "src/app/__tests__/catalog97-closeout.test.ts",
    "src/app/fantasy-football/__tests__/print-shop-rules.test.ts",
  ]);
  const files = [...sourceFiles("src"), ...sourceFiles("e2e")]
    .filter((file) => !banLists.has(file))
    .map((file) => [file, read(file)] as const);

  it("leaves no file under src or e2e reading a Working Instrument token", () => {
    const offenders = files
      .filter(([, text]) => DEAD_TOKEN_READ.test(text))
      .map(([file, text]) => `${file}: ${text.match(DEAD_TOKEN_READ)?.[0]}`);
    expect(offenders).toEqual([]);
  });

  it("catches the token reads it claims to", () => {
    for (const read of [
      "var(--" + "home-ink)",
      "bg-(--" + "home-paper)",
      "var(--font-mono, monospace)",
      "rounded-[var(--radius-lg)]",
      "var(--color-primary)",
    ]) {
      expect(DEAD_TOKEN_READ.test(read)).toBe(true);
    }
    for (const fine of ["var(--c97-ink)", "var(--text-xs)", "var(--font-fragment-mono)", "var(--color-red-500)"]) {
      expect(DEAD_TOKEN_READ.test(fine)).toBe(false);
    }
  });

  it("leaves nothing importing the deleted stats panel", () => {
    const offenders = files
      .filter(([, text]) => text.includes("Home" + "StatsPanel"))
      .map(([file]) => file);
    expect(offenders).toEqual([]);
  });

  it("declares no Working Instrument tokens, bridge, or legacy aliases", () => {
    for (const css of [globals, catalog]) {
      expect(css).not.toMatch(/--home-[a-z-]+\s*:/);
      expect(css).not.toContain("BRIDGE START");
      expect(css).not.toMatch(
        /--(?:color-(?:primary|accent|success|warning|error)|surface-[a-z]+|text-(?:primary|secondary|tertiary|inverse)|border-(?:primary|secondary|accent)|radius-[a-z0-9]+|shadow-[a-z0-9]+)\s*:/,
      );
    }
  });

  it("defines none of the Working Instrument helper classes", () => {
    const helper = /(?:^|[\s,}])\.(?:home|section|tool|wp|resume|header-home|footer-home|portfolio-card|page-shell)-[a-z-]*[\s,{:.]/m;
    expect(globals).not.toMatch(helper);
    expect(catalog).not.toMatch(helper);
  });

  it("keeps the two surface tokens the bridge used to declare", () => {
    expect(catalog).toMatch(/--c97-accent-soft\s*:/);
    expect(catalog).toMatch(/--c97-overlay\s*:/);
  });

  it("compiles Tailwind's radius and shadow scales to nothing", () => {
    const block = (name: string) => {
      const start = tailwind.indexOf(`${name}: {`);
      expect(start).toBeGreaterThan(-1);
      return tailwind.slice(start, tailwind.indexOf("}", start));
    };
    const radii = block("borderRadius").match(/:\s*'([^']*)'/g) ?? [];
    const shadows = block("boxShadow").match(/:\s*'([^']*)'/g) ?? [];
    expect(radii.length).toBeGreaterThanOrEqual(8);
    expect(radii.every((value) => value.includes("'0'"))).toBe(true);
    expect(shadows.length).toBeGreaterThanOrEqual(5);
    expect(shadows.every((value) => value.includes("'none'"))).toBe(true);
  });

  it("has retired the legacy accents everywhere", () => {
    for (const legacy of ["--home-haze", "--home-acid", "--home-moss", "--color-secondary"]) {
      expect(globals).not.toContain(legacy);
      expect(catalog).not.toContain(legacy);
    }
  });

  it("ships the tool vocabulary", () => {
    for (const cls of [
      ".c97-table",
      ".c97-stat",
      ".c97-stat-label",
      ".c97-stat-value",
      ".c97-stat-delta",
      ".c97-chip",
      ".c97-chip-positive",
      ".c97-chip-negative",
      ".c97-chip-warning",
      ".c97-segmented",
      ".c97-panel",
      ".c97-mono",
      ".c97-check",
      ".c97-range",
    ]) {
      expect(catalog).toMatch(new RegExp(`${cls.replace(".", "\\.")}[\\s,{]`));
    }
  });

  it("puts no Tailwind spacing on an element whose Catalog 97 class overrides it", () => {
    const owns = overriddenUtilities(catalog);
    const offenders = files
      .filter(([file]) => file.endsWith(".tsx"))
      .flatMap(([file, text]) =>
        [...text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)].flatMap((match) => {
          const className = (match[1] ?? match[2] ?? "").replace(/\$\{[^}]*\}/g, " ");
          return deadSpacing(className, owns).map((utility) => `${file}: ${utility} in "${className.trim()}"`);
        }),
      );
    expect(offenders).toEqual([]);
  });

  it("catches the dead spacing it claims to", () => {
    const owns = overriddenUtilities(catalog);
    expect(deadSpacing("c97-kicker mb-2", owns)).toEqual(["mb-2"]);
    expect(deadSpacing("c97-prose md:mt-4", owns)).toEqual(["md:mt-4"]);
    expect(deadSpacing("c97-segmented mt-4", owns)).toEqual(["mt-4"]);
    expect(deadSpacing("c97-shell mt-4", owns)).toEqual([]);
    expect(deadSpacing("c97-kicker space-y-2 !mb-2", owns)).toEqual([]);
  });
});
