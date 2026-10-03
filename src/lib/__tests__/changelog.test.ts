jest.mock("fs");
jest.mock("gray-matter");
jest.mock("remark", () => ({
  remark: jest.fn(() => ({
    use: jest.fn().mockReturnThis(),
    process: jest.fn().mockResolvedValue({ toString: () => "<p>Processed update</p>" }),
  })),
}));
jest.mock("remark-gfm", () => jest.fn());
jest.mock("remark-rehype", () => jest.fn());
jest.mock("rehype-sanitize", () => jest.fn());
jest.mock("rehype-stringify", () => jest.fn());

import fs from "fs";
import matter from "gray-matter";
import { remark } from "remark";
import rehypeSanitize from "rehype-sanitize";
import { getAllChangelogEntries, getLatestChangelogEntryDate } from "../changelog";

const mockFs = fs as jest.Mocked<typeof fs>;
const mockMatter = matter as unknown as jest.Mock;
const mockRemark = remark as unknown as jest.Mock;
const mockRehypeSanitize = rehypeSanitize as unknown as jest.Mock;

describe("getAllChangelogEntries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.mkdirSync = jest.fn();
    mockFs.readdirSync = jest.fn().mockReturnValue(["security-update.md"]);
    mockFs.readFileSync = jest.fn().mockReturnValue("raw changelog");
    mockMatter.mockReturnValue({
      data: {
        title: "Security update",
        publishedAt: "2026-04-29",
        summary: "Hardened public endpoints.",
      },
      content: "Body",
    });
  });

  it("renders markdown with sanitization enabled", async () => {
    await getAllChangelogEntries();
    const processor = mockRemark.mock.results.at(-1)?.value;

    expect(processor.use).toHaveBeenCalledWith(mockRehypeSanitize);
  });
});

describe("changelog directory reads", () => {
  type Frontmatter = Record<string, unknown>;
  let warnSpy: jest.SpyInstance;

  /**
   * Serves a fake content/changelog directory: `files` maps a file name to
   * its frontmatter, and reading a file returns its path so gray-matter can
   * look the frontmatter back up.
   */
  function serveDirectory(files: Record<string, Frontmatter>, { directoryExists = true } = {}) {
    const byPath = new Map(
      Object.entries(files).map(([name, data]) => [`content/changelog/${name}`, data])
    );
    const relative = (fullPath: string) => fullPath.slice(fullPath.indexOf("content/changelog"));
    mockFs.existsSync = jest.fn((target: unknown) => {
      const key = relative(String(target));
      return key === "content/changelog" ? directoryExists : byPath.has(key);
    }) as unknown as typeof mockFs.existsSync;
    mockFs.mkdirSync = jest.fn();
    mockFs.readdirSync = jest.fn().mockReturnValue(Object.keys(files));
    mockFs.readFileSync = jest.fn((target: unknown) => relative(String(target))) as unknown as typeof mockFs.readFileSync;
    mockMatter.mockImplementation((raw: string) => ({ data: byPath.get(raw) ?? {}, content: `Body of ${raw}` }));
  }

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("creates the directory when it is missing and returns nothing", async () => {
    serveDirectory({}, { directoryExists: false });

    await expect(getAllChangelogEntries()).resolves.toEqual([]);
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining("content/changelog"),
      { recursive: true }
    );
    expect(getLatestChangelogEntryDate()).toBeNull();
  });

  it("returns nothing and warns when the directory cannot be read", async () => {
    serveDirectory({});
    mockFs.readdirSync = jest.fn(() => {
      throw new Error("EACCES");
    }) as unknown as typeof mockFs.readdirSync;

    await expect(getAllChangelogEntries()).resolves.toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      "Changelog directory not found or empty:",
      expect.any(Error)
    );
  });

  it("reads md and mdx entries, fills defaults, and sorts newest first with slug tiebreaks", async () => {
    serveDirectory({
      "older.md": { title: "Older", publishedAt: "2026-01-01", summary: "a" },
      "beta.mdx": {
        title: "Beta",
        publishedAt: "2026-03-01",
        summary: "b",
        category: "Feature",
        tags: ["ui"],
      },
      "alpha.md": { title: "Alpha", publishedAt: "2026-03-01", summary: "c" },
      "notes.txt": { title: "Not a changelog", publishedAt: "2026-12-01" },
    });

    const entries = await getAllChangelogEntries();

    expect(entries.map((entry) => entry.slug)).toEqual(["alpha", "beta", "older"]);
    expect(entries[0]).toMatchObject({ category: "Update", tags: [], html: "<p>Processed update</p>" });
    expect(entries[1]).toMatchObject({ category: "Feature", tags: ["ui"] });
  });

  it("prefers the .mdx source when both extensions exist for a slug", async () => {
    serveDirectory({
      "dual.mdx": { title: "From mdx", publishedAt: "2026-02-01", summary: "x" },
      "dual.md": { title: "From md", publishedAt: "2026-02-01", summary: "y" },
    });

    const entries = await getAllChangelogEntries();

    // Only the title is pinned here. Both files currently yield an entry each
    // (the slug list is not deduplicated), which is reported, not locked in.
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.title === "From mdx")).toBe(true);
  });

  it("skips entries whose source vanished or whose title or date is malformed", async () => {
    serveDirectory({
      "good.md": { title: "Good", publishedAt: "2026-05-01", summary: "ok" },
      "untitled.md": { publishedAt: "2026-05-02" },
      "undated.md": { title: "Undated" },
      "bad-date.md": { title: "Bad date", publishedAt: "someday" },
    });
    mockFs.readdirSync = jest
      .fn()
      .mockReturnValue(["good.md", "untitled.md", "undated.md", "bad-date.md", "ghost.md"]);

    const entries = await getAllChangelogEntries();

    expect(entries.map((entry) => entry.slug)).toEqual(["good"]);
    expect(warnSpy).toHaveBeenCalledWith("Skipping malformed changelog entry: untitled");
    expect(warnSpy).toHaveBeenCalledWith("Skipping malformed changelog entry: undated");
    expect(warnSpy).toHaveBeenCalledWith("Skipping malformed changelog entry: bad-date");
  });

  it("reports the latest valid publish date and ignores invalid or missing ones", () => {
    serveDirectory({
      "a.md": { title: "A", publishedAt: "2026-02-01" },
      "b.md": { title: "B", publishedAt: "2026-06-15" },
      "c.md": { title: "C", publishedAt: "2026-04-01" },
      "d.md": { title: "D", publishedAt: "not a date" },
      "e.md": { title: "E" },
    });
    mockFs.readdirSync = jest
      .fn()
      .mockReturnValue(["a.md", "b.md", "c.md", "d.md", "e.md", "ghost.md"]);

    expect(getLatestChangelogEntryDate()).toBe("2026-06-15");
  });
});
