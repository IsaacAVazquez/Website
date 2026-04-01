import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// /api/news-pulse – Fetch and parse RSS feeds from major news outlets
// ---------------------------------------------------------------------------

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  color: string;
}

const RSS_FEEDS: RSSFeed[] = [
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

function parseRSS(xml: string, feed: RSSFeed): ParsedArticle[] {
  const articles: ParsedArticle[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1];
    const title = stripHtml(extractTag(block, "title"));
    if (!title) continue;

    // <link> in RSS can appear as plain text or as self-closing; grab first URL
    let link = extractTag(block, "link");
    if (!link) {
      const linkMatch = block.match(/<link[^>]*href="([^"]+)"/i);
      if (linkMatch) link = linkMatch[1];
    }

    articles.push({
      title,
      link,
      description: stripHtml(extractTag(block, "description")).slice(0, 300),
      pubDate: extractTag(block, "pubDate"),
      category: stripHtml(extractTag(block, "category")) || "General",
      source: feed.id,
      sourceName: feed.name,
      sourceColor: feed.color,
    });
  }
  return articles;
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function GET() {
  const errors: string[] = [];

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
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
        return parseRSS(xml, feed);
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
      errors.push(`${RSS_FEEDS[i].name}: ${r.reason?.message ?? "unknown error"}`);
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
