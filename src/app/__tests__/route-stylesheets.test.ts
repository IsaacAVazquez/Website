import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

// A plain stylesheet a route imports is global. Once a visitor has opened the
// route its rules stay on the page through every later client-side
// navigation, so two routes that give a class the same name restyle each
// other in whichever order they were opened. Each route sheet keeps its
// classes under a prefix of its own, and this fails when a class no shared
// sheet defines turns up in the sheets of two route folders. CSS Modules are
// left out because the build renames their classes per file.
const root = process.cwd();

function plainSheets(dir: string): string[] {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return plainSheets(rel);
    return entry.name.endsWith(".css") && !entry.name.endsWith(".module.css") ? [rel] : [];
  });
}

/** Every class a sheet's selectors name, with attribute values left out. */
function classNames(file: string): Set<string> {
  const names = new Set<string>();
  postcss.parse(fs.readFileSync(path.join(root, file), "utf8")).walkRules((rule) => {
    for (const [, name] of rule.selector.replace(/\[[^\]]*\]/g, "").matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
      names.add(name);
    }
  });
  return names;
}

// globals.css and catalog97.css sit at the top of src/app, and the shared
// component sheets under src/components. A route may restyle their classes
// under its own root, so those names (and `dark`, which catalog97.css names)
// belong to no route.
const appSheets = plainSheets("src/app");
const sharedSheets = [...appSheets.filter((file) => path.dirname(file) === "src/app"), ...plainSheets("src/components")];
const routeSheets = appSheets.filter((file) => path.dirname(file) !== "src/app");

describe("route stylesheets", () => {
  it("finds the route sheets and the shared sheets it compares them against", () => {
    expect(routeSheets.length).toBeGreaterThan(20);
    expect(sharedSheets).toEqual(expect.arrayContaining(["src/app/catalog97.css", "src/app/globals.css"]));
  });

  it("gives no two route folders a class of the same name", () => {
    const shared = new Set(sharedSheets.flatMap((file) => [...classNames(file)]));
    const owners = new Map<string, Set<string>>();
    for (const file of routeSheets) {
      for (const name of classNames(file)) {
        if (shared.has(name)) continue;
        owners.set(name, (owners.get(name) ?? new Set()).add(path.dirname(file)));
      }
    }
    const collisions = [...owners]
      .filter(([, folders]) => folders.size > 1)
      .map(([name, folders]) => `.${name}: ${[...folders].sort().join(", ")}`)
      .sort();
    expect(collisions).toEqual([]);
  });
});
