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

/**
 * Every project file a file pulls in statically, and every package, mapped to
 * the file that imports it.
 */
function reachableFrom(entry: string): { files: Set<string>; packages: Map<string, string> } {
  const packages = new Map<string, string>();
  const files = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (files.has(file)) continue;
    files.add(file);
    for (const [, specifier] of read(file).matchAll(VALUE_IMPORT)) {
      const source = resolveSource(file, specifier);
      if (source) queue.push(source);
      else if (!specifier.startsWith(".") && !specifier.startsWith("@/") && !packages.has(specifier)) {
        packages.set(specifier, file);
      }
    }
  }
  return { files, packages };
}

const packagesReachableFrom = (entry: string) => reachableFrom(entry).packages;

describe("bundle guards", () => {
  it("follows imports the way the guards below rely on", () => {
    const reached = reachableFrom("src/components/football/ClubDrawer.tsx");
    expect(reached.packages.get("framer-motion")).toBe("src/components/football/ClubDrawer.tsx");
    expect(reached.files.has("src/components/football/CrestAvatar.tsx")).toBe(true);
  });

  // Six route clients import this barrel and two of them render the drawer.
  // The repo declares no `sideEffects`, so webpack keeps every re-exported
  // module, and a drawer in the barrel ships framer-motion to all six.
  it("keeps framer-motion out of everything the football barrel re-exports", () => {
    expect(packagesReachableFrom("src/components/football/index.ts").get("framer-motion")).toBeUndefined();
  });

  // `cn` has its own module. While it sat in utils.ts, every route that
  // reached utils for `clamp`, `slugify`, or `relativeAge` loaded
  // tailwind-merge with it, and the theme toggle put it in the shell.
  it("keeps tailwind-merge out of utils", () => {
    expect(read("src/lib/utils.ts").includes("tailwind-merge")).toBe(false);
  });

  it("keeps tailwind-merge out of the shell", () => {
    const reached = [
      "src/components/Providers.tsx",
      "src/components/ConditionalLayout.tsx",
      // A dynamic import, so the walk above stops short of it, and it loads
      // on every route as soon as the header hydrates.
      "src/components/ui/ThemeToggle.tsx",
    ].map((entry) => [entry, packagesReachableFrom(entry).get("tailwind-merge")]);
    expect(reached.filter(([, importer]) => importer !== undefined)).toEqual([]);
  });

  // The fantasy components are imported from their own files. A barrel here
  // gave each draft room the drawers, trays, and panels of the other rooms.
  it("has no fantasy barrel", () => {
    expect(existsSync(path.join(root, "src/components/fantasy/index.ts"))).toBe(false);
  });

  // Two pure helpers lived in the draft state hook's module, so reading the
  // season or the storage key bundled the whole hook and its analytics.
  it("keeps the draft state hook out of files that only need its helpers", () => {
    const hook = "src/app/fantasy-football/draft-tracker/hooks/useDraftState.ts";
    const reached = [
      "src/app/fantasy-football/trade-calculator/trade-calculator-client.tsx",
      "src/components/fantasy/MyTeamPanel.tsx",
    ].filter((entry) => reachableFrom(entry).files.has(hook));
    expect(reached).toEqual([]);
  });
});
