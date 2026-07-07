#!/usr/bin/env tsx
/**
 * Gives each blog post a real, license-safe cover photo in place of the
 * auto-generated `/writing/<slug>/opengraph-image` editorial card.
 *
 *   npm run update:article-images                 # every wikimedia entry missing a photo
 *   npm run update:article-images -- --only=slug  # a single post (used by the writing workflow)
 *   npm run update:article-images -- --force      # re-fetch even posts that already have a photo
 *   npm run update:article-images -- --dry-run    # report the plan; no network, no writes
 *
 * The plan lives in `scripts/data/articleCoverImages.ts`. For each `wikimedia`
 * entry this searches Wikimedia Commons, picks the top freely licensed
 * landscape photo, saves a scaled copy under `public/images/writing/covers/`,
 * and writes the four cover-image frontmatter fields. Credit and license are
 * read from the Commons API at fetch time, so attribution always matches the
 * file that actually lands. `editorial-card` and `manual` entries are left
 * alone.
 *
 * Fail-soft: a failed search or download for one post is logged and skipped;
 * the post keeps whatever cover it already had. No source is hammered — a
 * malformed 4xx fails that post immediately rather than retrying.
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  ARTICLE_COVER_IMAGES,
  type ArticleCoverImageSpec,
} from "./data/articleCoverImages";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const COVERS_DIR_SEGMENTS = ["public", "images", "writing", "covers"] as const;
const PUBLIC_COVERS_PREFIX = "/images/writing/covers";
const BLOG_DIR_SEGMENTS = ["content", "blog"] as const;
const REQUEST_TIMEOUT_MS = 15_000;
const SEARCH_RESULT_LIMIT = 20;
const THUMB_WIDTH = 1600;
const MIN_IMAGE_WIDTH = 800;
// A polite, identifying UA is required by the Wikimedia API etiquette policy.
const USER_AGENT =
  "isaacavazquez.com article-cover-image builder (https://isaacavazquez.com)";

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

type Logger = Pick<Console, "log" | "warn" | "error">;

export interface BuildArticleCoverImagesOptions {
  projectRoot?: string;
  fetchImpl?: typeof fetch;
  logger?: Logger;
  /** Restrict to these slugs (the `--only` flag). */
  only?: string[];
  /** Re-fetch even posts that already have a saved cover. */
  force?: boolean;
  /** Report the plan without any network calls or file writes. */
  dryRun?: boolean;
}

export interface BuildArticleCoverImagesResult {
  updated: string[];
  skipped: string[];
  keptCard: string[];
  manual: string[];
  failed: Array<{ slug: string; error: string }>;
}

interface CommonsImageInfo {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  mime?: string;
  width?: number;
  height?: number;
  extmetadata?: Record<string, { value?: string } | undefined>;
}

interface CommonsPage {
  index?: number;
  title?: string;
  imageinfo?: CommonsImageInfo[];
}

interface SelectedImage {
  downloadUrl: string;
  extension: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

class CoverImageFetchError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "CoverImageFetchError";
    this.status = status;
  }
}

function projectPath(projectRoot: string, segments: readonly string[]): string {
  return path.join(projectRoot, ...segments);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Any of covers/<slug>.{jpg,png,webp} already on disk. */
async function existingCoverPath(
  projectRoot: string,
  slug: string
): Promise<string | null> {
  for (const extension of Object.values(ALLOWED_MIME)) {
    const candidate = projectPath(projectRoot, [
      ...COVERS_DIR_SEGMENTS,
      `${slug}${extension}`,
    ]);
    if (await fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extMetaValue(
  info: CommonsImageInfo,
  key: string
): string | undefined {
  const raw = info.extmetadata?.[key]?.value;
  return typeof raw === "string" ? raw : undefined;
}

/**
 * Only accept licenses that clearly permit reuse with attribution: Creative
 * Commons (CC0/BY/BY-SA), public domain, or an explicit PD mark. Anything we
 * cannot positively identify as free is rejected rather than guessed at.
 */
function isFreeLicense(info: CommonsImageInfo): boolean {
  const license = (extMetaValue(info, "License") ?? "").toLowerCase();
  const shortName = (extMetaValue(info, "LicenseShortName") ?? "").toLowerCase();
  const haystack = `${license} ${shortName}`;
  if (/non-?free|fair use|copyright|all rights reserved/.test(haystack)) {
    return false;
  }
  return (
    license.startsWith("cc0") ||
    license.startsWith("cc-") ||
    license.startsWith("pd") ||
    /public domain/.test(haystack) ||
    /\bcc0\b/.test(haystack) ||
    /\bcc by\b/.test(shortName)
  );
}

function buildCredit(info: CommonsImageInfo): string {
  const artist = extMetaValue(info, "Artist");
  const licenseShort = extMetaValue(info, "LicenseShortName");
  const artistPlain = artist ? stripHtml(artist).slice(0, 120) : "";
  const licensePlain = licenseShort ? stripHtml(licenseShort) : "Public domain";
  const parts = [artistPlain, licensePlain].filter(Boolean);
  return `${parts.join(", ")} via Wikimedia Commons`;
}

async function fetchJson(
  fetchImpl: typeof fetch,
  url: string
): Promise<unknown> {
  const response = await fetchImpl(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new CoverImageFetchError(
      `Commons API responded ${response.status}`,
      response.status
    );
  }
  return response.json();
}

/** Search Commons and return the best free landscape photo for `query`. */
async function selectCommonsImage(
  fetchImpl: typeof fetch,
  query: string,
  fallbackAlt: string
): Promise<SelectedImage | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: String(SEARCH_RESULT_LIMIT),
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    iiurlwidth: String(THUMB_WIDTH),
  });
  const payload = (await fetchJson(
    fetchImpl,
    `${COMMONS_API}?${params.toString()}`
  )) as { query?: { pages?: Record<string, CommonsPage> } };

  const pages = Object.values(payload.query?.pages ?? {}).sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0)
  );

  const eligible = pages
    .map((page) => page.imageinfo?.[0])
    .filter((info): info is CommonsImageInfo => Boolean(info?.thumburl))
    .filter((info) => Boolean(ALLOWED_MIME[info.mime ?? ""]))
    .filter((info) => (info.width ?? 0) >= MIN_IMAGE_WIDTH)
    .filter(isFreeLicense);

  // Prefer landscape (works in the 1200x630 hero); fall back to any free hit.
  const chosen =
    eligible.find((info) => (info.width ?? 0) >= (info.height ?? 0)) ??
    eligible[0];
  if (!chosen) {
    return null;
  }

  const description = extMetaValue(chosen, "ImageDescription");
  const descriptionPlain = description ? stripHtml(description) : "";
  return {
    downloadUrl: chosen.thumburl!,
    extension: ALLOWED_MIME[chosen.mime ?? ""] ?? ".jpg",
    // Prefer a short real description; otherwise the manifest's generic alt.
    alt:
      descriptionPlain && descriptionPlain.length <= 140
        ? descriptionPlain
        : fallbackAlt,
    credit: buildCredit(chosen),
    creditUrl: chosen.descriptionurl ?? "",
  };
}

async function downloadImage(
  fetchImpl: typeof fetch,
  url: string
): Promise<Buffer> {
  const response = await fetchImpl(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "image/*" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new CoverImageFetchError(
      `Image download responded ${response.status}`,
      response.status
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Insert or replace the four cover-image frontmatter fields, preserving the
 * rest of the block and its formatting. Idempotent: running twice is a no-op.
 * New fields are placed just after `author:` (mirroring the curated World Cup
 * posts), otherwise before `seo:`, otherwise at the end of the block.
 */
export function applyCoverFrontmatter(
  source: string,
  fields: {
    coverImage: string;
    coverImageAlt: string;
    coverImageCredit: string;
    coverImageCreditUrl: string;
  }
): string {
  const match = source.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)/);
  if (!match) {
    throw new Error("Article is missing a frontmatter block");
  }
  const [, open, block, close] = match;
  const body = source.slice(match[0].length);
  const lines = block.split(/\r?\n/);

  const topLevelKey = (line: string): string | null => {
    const keyMatch = line.match(/^([A-Za-z0-9_]+):/);
    return keyMatch ? keyMatch[1] : null;
  };

  const pending: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    const yamlLine = `${key}: ${JSON.stringify(value)}`;
    const existing = lines.findIndex((line) => topLevelKey(line) === key);
    if (existing >= 0) {
      lines[existing] = yamlLine;
    } else {
      pending.push(yamlLine);
    }
  }

  if (pending.length > 0) {
    const authorAt = lines.findIndex((line) => topLevelKey(line) === "author");
    let insertAt: number;
    if (authorAt >= 0) {
      insertAt = authorAt + 1;
    } else {
      const seoAt = lines.findIndex((line) => topLevelKey(line) === "seo");
      insertAt = seoAt >= 0 ? seoAt : lines.length;
    }
    lines.splice(insertAt, 0, ...pending);
  }

  return `${open}${lines.join("\n")}${close}${body}`;
}

async function resolveArticlePath(
  projectRoot: string,
  slug: string
): Promise<string | null> {
  for (const extension of [".mdx", ".md"]) {
    const candidate = projectPath(projectRoot, [
      ...BLOG_DIR_SEGMENTS,
      `${slug}${extension}`,
    ]);
    if (await fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function processWikimediaEntry(
  entry: Extract<ArticleCoverImageSpec, { strategy: "wikimedia" }>,
  options: Required<Pick<BuildArticleCoverImagesOptions, "force" | "dryRun">> & {
    projectRoot: string;
    fetchImpl: typeof fetch;
    logger: Logger;
  }
): Promise<"updated" | "skipped"> {
  const { projectRoot, fetchImpl, logger, force, dryRun } = options;

  const articlePath = await resolveArticlePath(projectRoot, entry.slug);
  if (!articlePath) {
    throw new CoverImageFetchError(`No article file for slug "${entry.slug}"`);
  }

  const alreadyDownloaded = await existingCoverPath(projectRoot, entry.slug);
  if (alreadyDownloaded && !force) {
    logger.log(`• ${entry.slug}: cover already present, skipping (use --force)`);
    return "skipped";
  }

  if (dryRun) {
    logger.log(`• ${entry.slug}: would search Commons for "${entry.query}"`);
    return "skipped";
  }

  const selection = await selectCommonsImage(fetchImpl, entry.query, entry.alt);
  if (!selection) {
    throw new CoverImageFetchError(
      `No freely licensed image found for "${entry.query}"`
    );
  }

  const buffer = await downloadImage(fetchImpl, selection.downloadUrl);
  const coversDir = projectPath(projectRoot, [...COVERS_DIR_SEGMENTS]);
  await fs.mkdir(coversDir, { recursive: true });

  // Store under a single canonical extension per slug; clear stale variants so
  // a jpg->png change never leaves two covers for one post.
  for (const extension of Object.values(ALLOWED_MIME)) {
    if (extension !== selection.extension) {
      await fs
        .rm(path.join(coversDir, `${entry.slug}${extension}`), { force: true })
        .catch(() => undefined);
    }
  }

  const fileName = `${entry.slug}${selection.extension}`;
  await fs.writeFile(path.join(coversDir, fileName), buffer);

  const source = await fs.readFile(articlePath, "utf8");
  const updated = applyCoverFrontmatter(source, {
    coverImage: `${PUBLIC_COVERS_PREFIX}/${fileName}`,
    coverImageAlt: selection.alt,
    coverImageCredit: selection.credit,
    coverImageCreditUrl: selection.creditUrl,
  });
  if (updated !== source) {
    await fs.writeFile(articlePath, updated, "utf8");
  }

  logger.log(`✓ ${entry.slug}: ${selection.credit}`);
  return "updated";
}

/** Warn if the manifest and the blog directory have drifted out of sync. */
async function reportCoverage(
  projectRoot: string,
  logger: Logger
): Promise<void> {
  const blogDir = projectPath(projectRoot, [...BLOG_DIR_SEGMENTS]);
  let files: string[];
  try {
    files = await fs.readdir(blogDir);
  } catch {
    return;
  }
  const slugs = new Set(
    files
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
      .map((file) => file.replace(/\.(mdx|md)$/, ""))
  );
  const planned = new Set(ARTICLE_COVER_IMAGES.map((entry) => entry.slug));

  const missing = [...slugs].filter((slug) => !planned.has(slug)).sort();
  const stale = [...planned].filter((slug) => !slugs.has(slug)).sort();
  if (missing.length > 0) {
    logger.warn(
      `⚠ ${missing.length} article(s) have no cover plan (add to articleCoverImages.ts): ${missing.join(", ")}`
    );
  }
  if (stale.length > 0) {
    logger.warn(
      `⚠ ${stale.length} cover plan entr(ies) reference missing articles: ${stale.join(", ")}`
    );
  }
}

export async function buildArticleCoverImages(
  options: BuildArticleCoverImagesOptions = {}
): Promise<BuildArticleCoverImagesResult> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const fetchImpl = options.fetchImpl ?? fetch;
  const logger = options.logger ?? console;
  const force = options.force ?? false;
  const dryRun = options.dryRun ?? false;
  const only = options.only && options.only.length > 0 ? new Set(options.only) : null;

  const result: BuildArticleCoverImagesResult = {
    updated: [],
    skipped: [],
    keptCard: [],
    manual: [],
    failed: [],
  };

  await reportCoverage(projectRoot, logger);

  const entries = only
    ? ARTICLE_COVER_IMAGES.filter((entry) => only.has(entry.slug))
    : ARTICLE_COVER_IMAGES;

  if (only) {
    const unknown = [...only].filter(
      (slug) => !ARTICLE_COVER_IMAGES.some((entry) => entry.slug === slug)
    );
    for (const slug of unknown) {
      logger.warn(`⚠ ${slug}: not in the cover plan, ignoring`);
    }
  }

  for (const entry of entries) {
    if (entry.strategy === "manual") {
      result.manual.push(entry.slug);
      continue;
    }
    if (entry.strategy === "editorial-card") {
      result.keptCard.push(entry.slug);
      continue;
    }
    try {
      const outcome = await processWikimediaEntry(entry, {
        projectRoot,
        fetchImpl,
        logger,
        force,
        dryRun,
      });
      result[outcome].push(entry.slug);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`✗ ${entry.slug}: ${message}`);
      result.failed.push({ slug: entry.slug, error: message });
    }
  }

  logger.log(
    `Article covers: ${result.updated.length} updated, ${result.skipped.length} skipped, ` +
      `${result.keptCard.length} editorial cards, ${result.manual.length} manual, ${result.failed.length} failed.`
  );

  return result;
}

function parseCliOptions(argv: string[]): BuildArticleCoverImagesOptions {
  const options: BuildArticleCoverImagesOptions = {};
  for (const arg of argv) {
    if (arg === "--force") {
      options.force = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg.startsWith("--only=")) {
      options.only = arg
        .slice("--only=".length)
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean);
    }
  }
  return options;
}

async function main(): Promise<void> {
  const result = await buildArticleCoverImages(parseCliOptions(process.argv.slice(2)));
  if (result.failed.length > 0) {
    // Fail-soft overall, but signal partial failure for CI visibility.
    process.exitCode = 1;
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error("Failed to build article cover images:", error);
    process.exitCode = 1;
  });
}
