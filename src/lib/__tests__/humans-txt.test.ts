import fs from "fs";

/*
 * humans.txt states facts about the build, so each one is held to the file it
 * came from. A major version bump, a dropped typeface, or a new ink fails
 * here until the colophon is brought back in line.
 */
const read = (file: string) => (fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "");
const humans = read("public/humans.txt");
const field = (label: string) => humans.match(new RegExp(`^ *${label}: (.+)$`, "m"))?.[1] ?? "";

describe("humans.txt", () => {
  it("names the major versions in package.json", () => {
    const { dependencies, devDependencies } = JSON.parse(read("package.json"));
    const major = (name: string) =>
      String(dependencies[name] ?? devDependencies[name]).match(/\d+/)?.[0];

    expect(field("Built with")).toBe(
      `Next.js ${major("next")}, React ${major("react")}, TypeScript, Tailwind CSS ${major("tailwindcss")}`,
    );
  });

  it("names only typefaces the layout loads", () => {
    const loaded = (read("src/app/layout.tsx").match(/import \{([^}]+)\} from "next\/font\/google"/)?.[1] ?? "")
      .split(",")
      .map((name) => name.trim().replace(/_/g, " "))
      .filter(Boolean);
    const named = field("Typefaces").split(", ").filter(Boolean);

    expect(named.length).toBeGreaterThan(0);
    expect(loaded).toEqual(expect.arrayContaining(named));
  });

  it("lists every riso ink in the stylesheet, in the stylesheet's order", () => {
    const inks = Array.from(
      new Set(Array.from(read("src/app/catalog97.css").matchAll(/^\s*--c97-riso-([a-z]+):/gm), (match) => match[1])),
    );

    expect(inks.length).toBeGreaterThan(0);
    expect(field("Inks").split(", ")).toEqual(inks);
  });

  it("points to the public repository", () => {
    expect(field("Source")).toBe("https://github.com/IsaacAVazquez/Website");
  });
});
