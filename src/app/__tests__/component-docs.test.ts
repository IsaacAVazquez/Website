import fs from "node:fs";
import path from "node:path";

// COMPONENTS.md is where a maintainer looks for a shared component before
// writing one, so a table row that names a deleted file sends them after
// something that is gone. A path with a glob names a folder's contents and is
// left out.
const root = process.cwd();
const doc = fs.readFileSync(path.join(root, "COMPONENTS.md"), "utf8");

describe("COMPONENTS.md", () => {
  it("names only files that exist in its tables", () => {
    const files = doc
      .split("\n")
      .filter((line) => line.startsWith("|"))
      .flatMap((line) => [...line.matchAll(/`(src\/[^`*]+\.[a-z]+)`/g)].map(([, file]) => file));

    expect(files.length).toBeGreaterThan(20);
    expect([...new Set(files)].filter((file) => !fs.existsSync(path.join(root, file)))).toEqual([]);
  });
});
