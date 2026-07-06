/**
 * @jest-environment node
 */
import { cleanTitle, buildUpdatedChangelog } from "../append-changelog-entry.mjs";

const HEADER = "# Changelog\n\nAll notable changes to this repository are documented here.\n\n---\n";

describe("cleanTitle", () => {
  it("strips a conventional-commit prefix and capitalizes", () => {
    expect(cleanTitle("feat: add earthquake dashboard")).toBe(
      "Add earthquake dashboard"
    );
  });

  it("strips a scoped, breaking prefix", () => {
    expect(cleanTitle("fix(api)!: guard the allowlist origin")).toBe(
      "Guard the allowlist origin"
    );
  });

  it("leaves a title with no prefix intact (but capitalizes)", () => {
    expect(cleanTitle("update the resume")).toBe("Update the resume");
  });

  it("drops trailing punctuation and whitespace", () => {
    expect(cleanTitle("docs: tidy the readme.  ")).toBe("Tidy the readme");
  });

  it("falls back for empty or nullish input", () => {
    expect(cleanTitle("")).toBe("Merged a pull request");
    expect(cleanTitle(undefined)).toBe("Merged a pull request");
    expect(cleanTitle("chore:")).toBe("Merged a pull request");
  });
});

describe("buildUpdatedChangelog", () => {
  const pr = {
    prNumber: "275",
    title: "chore: align site prose with writing voice",
    url: "https://github.com/IsaacAVazquez/Website/pull/275",
    date: "2026-07-05",
  };

  it("is idempotent when the PR link is already present", () => {
    const existing = `${HEADER}\n## 2026-07-05\n\n- Earlier work ([#275](${pr.url})).\n\n---\n`;
    const { content, changed } = buildUpdatedChangelog(existing, pr);
    expect(changed).toBe(false);
    expect(content).toBe(existing);
  });

  it("starts a new dated section when today's is not the lead", () => {
    const existing = `${HEADER}\n## 2026-07-02\n\n- Older entry.\n\n---\n`;
    const { content, changed } = buildUpdatedChangelog(existing, pr);
    expect(changed).toBe(true);
    // new section for today is inserted ahead of the 2026-07-02 section
    expect(content.indexOf("## 2026-07-05")).toBeLessThan(
      content.indexOf("## 2026-07-02")
    );
    expect(content).toContain(
      `- Align site prose with writing voice ([#275](${pr.url})).`
    );
  });

  it("appends to today's section when it already leads the log", () => {
    const existing = `${HEADER}\n## 2026-07-05\n\n- First merge of the day ([#274](https://example.com/274)).\n\n---\n`;
    const { content, changed } = buildUpdatedChangelog(existing, pr);
    expect(changed).toBe(true);
    // only one 2026-07-05 header (appended, not duplicated)
    expect(content.match(/## 2026-07-05/g)).toHaveLength(1);
    // the new bullet lands inside that section, before its closing separator
    const section = content.slice(content.indexOf("## 2026-07-05"));
    const newBullet = `- Align site prose with writing voice ([#275](${pr.url})).`;
    expect(section).toContain(newBullet);
    expect(section.indexOf(newBullet)).toBeLessThan(section.indexOf("---"));
    expect(section.indexOf("#274")).toBeLessThan(section.indexOf("#275"));
  });
});
