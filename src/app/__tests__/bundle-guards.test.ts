import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

function filesMatching(dir: string, matches: (name: string) => boolean): string[] {
  return readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesMatching(rel, matches);
    return matches(entry.name) ? [rel] : [];
  });
}

const filesNamed = (dir: string, name: string) => filesMatching(dir, (file) => file === name);

/*
 * Value imports and re-exports only. `import type` and `export type` are
 * erased at build, and a dynamic `import()` is a separate chunk, so neither
 * puts a package in the importing route's first-load JavaScript.
 */
const VALUE_IMPORT = /^(?:import|export)\s+(?!type\b)[^;]*?from\s+["']([^"']+)["']/gm;

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
    expect(reached.packages.get("lucide-react")).toBe("src/components/football/ClubDrawer.tsx");
    expect(reached.files.has("src/components/football/CrestAvatar.tsx")).toBe(true);
    // Five source files quote their imports with single quotes, and this hook
    // is the one a guarded route reaches.
    const hook = reachableFrom("src/app/fantasy-football/draft-tracker/hooks/useDraftState.ts");
    expect(hook.files.has("src/lib/draftAnalytics.ts")).toBe(true);
  });

  // Six route clients import this barrel and two of them render the drawer.
  // The repo declares no `sideEffects`, so webpack keeps every re-exported
  // module, and a drawer in the barrel ships to all six.
  it("keeps the club drawer out of everything the football barrel re-exports", () => {
    expect(reachableFrom("src/components/football/index.ts").files.has("src/components/football/ClubDrawer.tsx")).toBe(false);
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

  // The overlays load the first time they open. A static import of one puts
  // its code back in the route's first load.
  it.each([
    [
      "src/app/fantasy-football/best-ball/best-ball-client.tsx",
      ["src/components/fantasy/PlayerDetailDrawer.tsx", "src/components/fantasy/CompareTray.tsx"],
    ],
    [
      "src/app/fantasy-football/best-ball/draft-tracker/draft-tracker-client.tsx",
      ["src/components/fantasy/PlayerDetailDrawer.tsx"],
    ],
    [
      "src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx",
      ["src/components/fantasy/PlayerDetailDrawer.tsx"],
    ],
    ["src/app/premier-league/premier-league-client.tsx", ["src/components/football/ClubDrawer.tsx"]],
    ["src/app/la-liga/la-liga-client.tsx", ["src/components/football/ClubDrawer.tsx"]],
    [
      "src/app/spacex-mission-control/spacex-mission-control-client.tsx",
      ["src/components/spacex/MissionDrawer.tsx"],
    ],
    // The research workspace shows nothing until a symbol is picked, and the
    // default is no symbol, so the section loads it on demand.
    [
      "src/components/investments/ResearchSection.tsx",
      [
        "src/components/investments/ResearchWorkspace.tsx",
        "src/components/investments/ResearchOverview.tsx",
        "src/components/investments/PriceChartPanel.tsx",
      ],
    ],
  ])("keeps the overlays out of the static imports of %s", (client, overlays) => {
    const reached = reachableFrom(client).files;
    expect(overlays.filter((overlay) => reached.has(overlay))).toEqual([]);
  });

  // This drawer is keyed by fixture and has no closed state, so it cannot mount
  // ahead of the click the way the other overlays do. Loading it on demand
  // saved 3 KB and made its first open take 308 to 310 ms where the static
  // import takes 19 to 21, measured in Chromium on local production builds.
  it("loads the score pools fixture drawer with the page", () => {
    const reached = reachableFrom("src/app/score-pools/score-pools-client.tsx").files;
    expect(reached.has("src/app/score-pools/fixture-detail-drawer.tsx")).toBe(true);
  });

  // next/dynamic gives a lazy component its own Suspense boundary only when
  // `loading` is set or `ssr` is false. Without one, mounting it after a click
  // suspends up to the route's loading.tsx, and the whole page is swapped for
  // the loading band until the chunk arrives.
  it("gives every lazy component in a client file its own Suspense boundary", () => {
    const LAZY = /const\s+(\w+)\s*=\s*dynamic(?:<[^>]*>)?\(([\s\S]*?)\);/g;
    const unguarded = filesMatching("src", (file) => file.endsWith(".tsx")).flatMap((file) => {
      const source = read(file);
      if (!/^["']use client["']/.test(source) || source.includes("<Suspense")) return [];
      return [...source.matchAll(LAZY)]
        .filter(([, , call]) => !/\bloading\s*:/.test(call) && !/\bssr\s*:\s*false/.test(call))
        .map(([, name]) => `${file}: ${name}`);
    });
    expect(unguarded).toEqual([]);
  });

  // Next does not prerender a route on the edge runtime, so an Open Graph
  // image that sets it is drawn again for every crawler that asks.
  it("leaves every Open Graph image free to prerender", () => {
    const images = filesNamed("src/app", "opengraph-image.tsx");
    expect(images.length).toBeGreaterThan(20);
    expect(images.filter((file) => /runtime\s*=\s*["']edge["']/.test(read(file)))).toEqual([]);
  });
});
