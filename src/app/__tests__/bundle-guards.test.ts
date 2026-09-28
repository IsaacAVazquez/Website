import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

/*
 * Value imports and re-exports only. `import type` and `export type` are
 * erased at build, and a dynamic `import()` is a separate chunk, so neither
 * puts a package in the importing route's first-load JavaScript.
 */
const VALUE_IMPORT = /^(?:import|export)\s+(?!type\b)[^;]*?from\s+"([^"]+)"/gm;

/** A repo-relative source file for a project specifier, or null for a package. */
function resolveSource(from: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? path.join("src", specifier.slice(2))
    : specifier.startsWith(".")
      ? path.join(path.dirname(from), specifier)
      : null;
  if (!base) return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  return candidates.find((file) => /\.tsx?$/.test(file) && existsSync(path.join(root, file))) ?? null;
}

/** Every package a file pulls in statically, mapped to the file that imports it. */
function packagesReachableFrom(entry: string): Map<string, string> {
  const packages = new Map<string, string>();
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const [, specifier] of read(file).matchAll(VALUE_IMPORT)) {
      const source = resolveSource(file, specifier);
      if (source) queue.push(source);
      else if (!specifier.startsWith(".") && !specifier.startsWith("@/") && !packages.has(specifier)) {
        packages.set(specifier, file);
      }
    }
  }
  return packages;
}

describe("bundle guards", () => {
  it("follows imports the way the guards below rely on", () => {
    const reached = packagesReachableFrom("src/components/football/ClubDrawer.tsx");
    expect(reached.get("framer-motion")).toBe("src/components/football/ClubDrawer.tsx");
  });

  // Six route clients import this barrel and two of them render the drawer.
  // The repo declares no `sideEffects`, so webpack keeps every re-exported
  // module, and a drawer in the barrel ships framer-motion to all six.
  it("keeps framer-motion out of everything the football barrel re-exports", () => {
    expect(packagesReachableFrom("src/components/football/index.ts").get("framer-motion")).toBeUndefined();
  });
});
