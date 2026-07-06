#!/usr/bin/env node
/**
 * Append a merged pull request to CHANGELOG.md, grouped under a UTC date header.
 *
 * Usage:
 *   node scripts/append-changelog-entry.mjs <pr-number> <pr-title> <pr-url> <yyyy-mm-dd>
 *
 * Called by the "Update Changelog on Merge" workflow. Kept pure and dependency
 * free so it can run in a bare Node step. The insertion is idempotent: if the
 * PR is already referenced in the changelog, nothing changes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const CHANGELOG_PATH = path.join(process.cwd(), "CHANGELOG.md");

/**
 * Turn a PR title into a changelog sentence. Strips a leading
 * conventional-commit prefix (`fix:`, `feat(scope):`, `docs!:`), capitalizes,
 * and drops trailing punctuation so we can append the link and a period.
 */
export function cleanTitle(rawTitle) {
  let title = String(rawTitle ?? "").trim();
  title = title.replace(/^[a-z]+(\([^)]*\))?!?:\s*/i, "");
  title = title.replace(/[.\s]+$/, "").trim();
  if (!title) return "Merged a pull request";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Return the changelog text with a new bullet inserted for the given PR.
 * If a section for `date` already leads the log, the bullet is appended to it;
 * otherwise a fresh dated section is inserted at the top.
 */
export function buildUpdatedChangelog(content, { prNumber, title, url, date }) {
  const linkRef = `[#${prNumber}](${url})`;
  if (content.includes(linkRef)) {
    return { content, changed: false };
  }

  const bullet = `- ${cleanTitle(title)} (${linkRef}).`;
  const lines = content.split("\n");
  const todayHeader = `## ${date}`;

  const firstHeaderIdx = lines.findIndex((line) => /^## /.test(line));

  if (firstHeaderIdx !== -1 && lines[firstHeaderIdx].trim() === todayHeader) {
    // Append to today's existing section, before its closing `---` separator.
    let sepIdx = lines.findIndex(
      (line, i) => i > firstHeaderIdx && line.trim() === "---"
    );
    if (sepIdx === -1) sepIdx = lines.length;

    let insertAt = sepIdx - 1;
    while (insertAt > firstHeaderIdx && lines[insertAt].trim() === "") {
      insertAt--;
    }
    lines.splice(insertAt + 1, 0, bullet);
  } else {
    // Start a new dated section ahead of the most recent one.
    const anchor = firstHeaderIdx !== -1 ? firstHeaderIdx : lines.length;
    lines.splice(anchor, 0, todayHeader, "", bullet, "", "---", "");
  }

  return { content: lines.join("\n"), changed: true };
}

function main() {
  const [prNumber, title, url, date] = process.argv.slice(2);

  if (!prNumber || !title || !url || !date) {
    console.error(
      "Usage: node scripts/append-changelog-entry.mjs <pr-number> <pr-title> <pr-url> <yyyy-mm-dd>"
    );
    process.exit(2);
  }

  const original = readFileSync(CHANGELOG_PATH, "utf8");
  const { content, changed } = buildUpdatedChangelog(original, {
    prNumber,
    title,
    url,
    date,
  });

  if (!changed) {
    console.log(`CHANGELOG.md already references PR #${prNumber}; nothing to do.`);
    return;
  }

  writeFileSync(CHANGELOG_PATH, content);
  console.log(`Added CHANGELOG.md entry for PR #${prNumber}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
