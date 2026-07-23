import { NextResponse } from "next/server";
import { getAllBlogPosts } from "@/lib/blog";

export async function GET() {
  const baseUrl = (process.env.SITE_URL || "https://isaacavazquez.com").replace(/\/$/, "");
  const posts = (await getAllBlogPosts()).filter((post) => {
    if (!post.title?.trim()) {
      return false;
    }

    if (!post.publishedAt || Number.isNaN(new Date(post.publishedAt).getTime())) {
      return false;
    }

    return true;
  });
  const lastBuildTimestamp = posts.reduce((latest, post) => {
    const candidate = new Date(post.updatedAt || post.publishedAt).getTime();
    return Number.isNaN(candidate) ? latest : Math.max(latest, candidate);
  }, 0);
  const lastBuildDate = lastBuildTimestamp > 0
    ? new Date(lastBuildTimestamp).toUTCString()
    : new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Isaac Vazquez</title>
    <link>${baseUrl}</link>
    <description>Writing about product strategy, analytics-heavy tools, technical systems, and the decisions behind the products I build.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml"/>
    
    ${posts.map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/writing/${escapeXml(post.slug)}</link>
      <description>${escapeXml(post.seo?.description || post.excerpt || post.title)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <atom:updated>${new Date(post.updatedAt || post.publishedAt).toISOString()}</atom:updated>
      <guid isPermaLink="true">${baseUrl}/writing/${escapeXml(post.slug)}</guid>
    </item>
    `).join('')}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=86400, stale-while-revalidate"
    }
  });
}

function escapeXml(unsafe?: string): string {
  return (unsafe ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
