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
 * regression or a silent bug. Built from parts so this file does not match
 * itself.
 */
const DEAD_TOKEN_READ = new RegExp(
  [
    "var\\(--" + "home-",
    "--" + "font-home-",
    "var\\(--font-(?:body|heading|display|inter|mono|jetbrains-mono)\\)",
    "var\\(--(?:radius|shadow)-",
    "var\\(--color-(?:primary|accent|success|warning|error)\\)",
    "var\\(--surface-",
    "var\\(--text-(?:primary|secondary|tertiary|inverse)\\)",
    "var\\(--border-(?:primary|secondary|accent)\\)",
  ].join("|"),
);

describe("Catalog 97 close-out", () => {
  const files = sourceFiles("src").map((file) => [file, read(file)] as const);

  it("leaves no file under src reading a Working Instrument token", () => {
    const offenders = files
      .filter(([, text]) => DEAD_TOKEN_READ.test(text))
      .map(([file, text]) => `${file}: ${text.match(DEAD_TOKEN_READ)?.[0]}`);
    expect(offenders).toEqual([]);
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
    const helper = /(?:^|[\s,}])\.(?:home|section|tool|wp|resume|header-home|footer-home|portfolio-card|page-shell)-?[a-z-]*[\s,{:.]/m;
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
});
