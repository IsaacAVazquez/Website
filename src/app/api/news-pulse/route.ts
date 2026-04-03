import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// /api/news-pulse – Fetch and parse RSS feeds from major news outlets
// ---------------------------------------------------------------------------

interface NewsFeed {
  id: string;
  name: string;
  url: string;
  color: string;
}

const NEWS_FEEDS: NewsFeed[] = [
  { id: "atlantic", name: "The Atlantic", url: "https://www.theatlantic.com/feed/all/", color: "#B22234" },
  { id: "nyt", name: "NYT", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", color: "#1A1A1A" },
  { id: "guardian", name: "The Guardian", url: "https://www.theguardian.com/world/rss", color: "#052962" },
  { id: "bbc", name: "BBC", url: "https://feeds.bbci.co.uk/news/rss.xml", color: "#BB1919" },
  { id: "npr", name: "NPR", url: "https://feeds.npr.org/1001/rss.xml", color: "#4A90D9" },
  { id: "wapo", name: "Washington Post", url: "https://feeds.washingtonpost.com/rss/world", color: "#2E2E2E" },
];

// ── XML helpers ─────────────────────────────────────────────────────────────

function extractTag(xml: string, tag: string): string {
  // Handles <tag>text</tag> and <tag><![CDATA[text]]></tag>
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`,
    "i",
  );
  const m = re.exec(xml);
  return m ? m[1].trim() : "";
}

function extractBlocks(xml: string, tag: string): string[] {
  const matches: string[] = [];
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  let match;
  while ((match = re.exec(xml)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function extractAttribute(tagXml: string, attr: string): string {
  const re = new RegExp(`${attr}=(["'])(.*?)\\1`, "i");
  const match = re.exec(tagXml);
  return match ? match[2].trim() : "";
}

function stripHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

interface ParsedArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category: string;
  source: string;
  sourceName: string;
  sourceColor: string;
}

function buildArticle(
  feed: NewsFeed,
  article: Omit<ParsedArticle, "source" | "sourceName" | "sourceColor">,
): ParsedArticle {
  return {
    ...article,
    source: feed.id,
    sourceName: feed.name,
    sourceColor: feed.color,
  };
}

function parseRSS(xml: string, feed: NewsFeed): ParsedArticle[] {
  const articles: ParsedArticle[] = [];
  for (const block of extractBlocks(xml, "item")) {
    const title = stripHtml(extractTag(block, "title"));
    if (!title) continue;

    // <link> in RSS can appear as plain text or as self-closing; grab first URL
    let link = extractTag(block, "link");
    if (!link) {
      const linkMatch = block.match(/<link[^>]*href=(["'])(.*?)\1/i);
      if (linkMatch) link = linkMatch[2];
    }

    articles.push(buildArticle(feed, {
      title,
      link,
      description: stripHtml(extractTag(block, "description")).slice(0, 300),
      pubDate: extractTag(block, "pubDate"),
      category: stripHtml(extractTag(block, "category")) || "General",
    }));
  }
  return articles;
}

function extractAtomLink(block: string): string {
  const alternateFirst = block.match(
    /<link\b[^>]*rel=(["'])alternate\1[^>]*href=(["'])(.*?)\2[^>]*>/i,
  );
  if (alternateFirst) return alternateFirst[3];

  const hrefFirst = block.match(
    /<link\b[^>]*href=(["'])(.*?)\1[^>]*rel=(["'])alternate\3[^>]*>/i,
  );
  if (hrefFirst) return hrefFirst[2];

  const firstLink = block.match(/<link\b[^>]*href=(["'])(.*?)\1[^>]*>/i);
  return firstLink ? firstLink[2] : "";
}

function extractAtomCategory(block: string): string {
  const categoryTag = block.match(/<category\b[^>]*\/?>/i)?.[0] ?? "";
  return (
    extractAttribute(categoryTag, "term") ||
    extractAttribute(categoryTag, "label") ||
    stripHtml(extractTag(block, "category")) ||
    "General"
  );
}

function parseAtom(xml: string, feed: NewsFeed): ParsedArticle[] {
  const articles: ParsedArticle[] = [];
  for (const block of extractBlocks(xml, "entry")) {
    const title = stripHtml(extractTag(block, "title"));
    if (!title) continue;

    articles.push(buildArticle(feed, {
      title,
      link: extractAtomLink(block),
      description: stripHtml(
        extractTag(block, "summary") || extractTag(block, "content"),
      ).slice(0, 300),
      pubDate: extractTag(block, "published") || extractTag(block, "updated"),
      category: extractAtomCategory(block),
    }));
  }
  return articles;
}

function parseFeed(xml: string, feed: NewsFeed): ParsedArticle[] {
  if (/<feed\b/i.test(xml) && /<entry\b/i.test(xml)) {
    return parseAtom(xml, feed);
  }
  return parseRSS(xml, feed);
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function GET() {
  const errors: string[] = [];

  const results = await Promise.allSettled(
    NEWS_FEEDS.map(async (feed) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(feed.url, {
          signal: controller.signal,
          headers: { "User-Agent": "NewsPulseDashboard/1.0" },
          next: { revalidate: 300 },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        const articles = parseFeed(xml, feed);
        if (articles.length === 0) {
          throw new Error("returned no usable entries");
        }
        return articles;
      } finally {
        clearTimeout(timeout);
      }
    }),
  );

  const articles: ParsedArticle[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      articles.push(...r.value);
    } else {
      errors.push(`${NEWS_FEEDS[i].name}: ${r.reason?.message ?? "unknown error"}`);
    }
  });

  // Sort newest first
  articles.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
  );

  return NextResponse.json(
    { articles, fetchedAt: new Date().toISOString(), errors },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
