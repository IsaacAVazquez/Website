import fs from "fs";
import path from "path";
import matter from "gray-matter";

describe("March Madness companion article file", () => {
  test("uses the expected frontmatter and includes interactive bracket deep links", () => {
    const articlePath = path.join(
      process.cwd(),
      "content/blog/2026-march-madness-bracket-analysis.mdx"
    );
    const source = fs.readFileSync(articlePath, "utf8");
    const { data, content } = matter(source);

    expect(data.title).toBe(
      "2026 March Madness Bracket Analysis: Best Upset Picks, Final Four, and Time Zone Traps"
    );
    expect(data.category).toBe("Sports Analytics");
    expect(data.tags).toEqual(
      expect.arrayContaining(["March Madness", "Sports Analytics", "Bracket Analysis"])
    );
    expect(data.seo.title).toMatch(/best upset picks and final four predictions/i);
    expect(content).toContain("[March Madness 2026 Bracket Analysis](/march-madness-2026)");
    expect(content).toContain("[best upset picks view](/march-madness-2026?view=picks)");
    expect(content).toContain("[time-zone model](/march-madness-2026?view=time-zones)");
  });
});
