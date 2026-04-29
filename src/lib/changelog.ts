import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface ChangelogEntryMetadata {
  title: string;
  publishedAt: string;
  summary: string;
  category?: string;
  tags?: string[];
}

export interface ChangelogEntry {
  slug: string;
  title: string;
  publishedAt: string;
  summary: string;
  category: string;
  tags: string[];
  html: string;
}

const changelogDirectory = path.join(process.cwd(), "content/changelog");

function ensureChangelogDirectory() {
  if (!fs.existsSync(changelogDirectory)) {
    fs.mkdirSync(changelogDirectory, { recursive: true });
  }
}

function compareByPublishedDateDesc(
  a: { publishedAt: string; slug: string },
  b: { publishedAt: string; slug: string }
) {
  const diff =
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  if (diff !== 0) return diff;
  return a.slug.localeCompare(b.slug);
}

async function renderMarkdown(content: string): Promise<string> {
  const [{ remark }, { default: remarkGfm }, { default: remarkHtml }] =
    await Promise.all([
      import("remark"),
      import("remark-gfm"),
      import("remark-html"),
    ]);

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: true })
    .process(content);

  return processed.toString();
}

export function getChangelogSlugs(): string[] {
  ensureChangelogDirectory();
  try {
    return fs
      .readdirSync(changelogDirectory)
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
      .map((file) => file.replace(/\.(mdx|md)$/, ""));
  } catch (error) {
    console.warn("Changelog directory not found or empty:", error);
    return [];
  }
}

function readChangelogSource(slug: string) {
  const mdxPath = path.join(changelogDirectory, `${slug}.mdx`);
  const mdPath = path.join(changelogDirectory, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath)
    ? mdxPath
    : fs.existsSync(mdPath)
      ? mdPath
      : null;

  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return {
    metadata: data as ChangelogEntryMetadata,
    content,
  };
}

export async function getAllChangelogEntries(): Promise<ChangelogEntry[]> {
  const slugs = getChangelogSlugs();
  const entries: ChangelogEntry[] = [];

  for (const slug of slugs) {
    const source = readChangelogSource(slug);
    if (!source) continue;

    const { metadata, content } = source;
    entries.push({
      slug,
      title: metadata.title,
      publishedAt: metadata.publishedAt,
      summary: metadata.summary,
      category: metadata.category || "Update",
      tags: metadata.tags || [],
      html: await renderMarkdown(content),
    });
  }

  return entries.sort(compareByPublishedDateDesc);
}

export function getLatestChangelogEntryDate(): string | null {
  const slugs = getChangelogSlugs();
  let latest: string | null = null;

  for (const slug of slugs) {
    const source = readChangelogSource(slug);
    if (!source) continue;
    const date = source.metadata.publishedAt;
    if (!latest || new Date(date).getTime() > new Date(latest).getTime()) {
      latest = date;
    }
  }

  return latest;
}
