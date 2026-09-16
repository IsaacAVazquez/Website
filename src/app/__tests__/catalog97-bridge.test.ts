import { readFileSync } from "node:fs";
import path from "node:path";

const globals = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
const catalog = readFileSync(path.join(process.cwd(), "src/app/catalog97.css"), "utf8");

/** Every custom property declared inside the first `:root {` block of globals.css. */
function rootTokens(css: string, prefix: string): string[] {
  const start = css.indexOf(":root {");
  const end = css.indexOf("\n}", start);
  const block = css.slice(start, end);
  return Array.from(new Set(block.match(new RegExp(`--${prefix}-[a-z0-9-]+(?=:)`, "g")) ?? []));
}

/** Custom properties declared anywhere between the bridge markers in catalog97.css. */
function bridgeTokens(): Set<string> {
  const start = catalog.indexOf("/* BRIDGE START */");
  const end = catalog.indexOf("/* BRIDGE END */");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const block = catalog.slice(start, end);
  return new Set(block.match(/--(?:home|radius|shadow|font)-[a-z0-9-]+(?=:)/g) ?? []);
}

describe("Catalog 97 bridge", () => {
  const bridged = bridgeTokens();

  it.each(["home", "radius", "shadow"])("aliases every :root --%s-* token", (prefix) => {
    const missing = rootTokens(globals, prefix).filter((token) => !bridged.has(token));
    expect(missing).toEqual([]);
  });

  it("aliases the font tokens components read", () => {
    for (const token of [
      "--font-body",
      "--font-heading",
      "--font-display",
      "--font-mono",
      "--font-inter",
      "--font-jetbrains-mono",
      "--font-home-sans",
      "--font-home-serif",
    ]) {
      expect(bridged.has(token)).toBe(true);
    }
  });

  it("has retired the legacy accents everywhere", () => {
    for (const legacy of ["--home-haze", "--home-acid", "--home-acid-soft", "--home-moss", "--color-secondary"]) {
      expect(globals).not.toContain(legacy);
      expect(catalog).not.toContain(legacy);
    }
  });
});
