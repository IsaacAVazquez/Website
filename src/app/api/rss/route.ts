import { NextResponse } from 'next/server';

// Temporary posts data until we build the markdown system
const posts = [
  {
    slug: 'qa-engineering-silicon-valley-uc-berkeley-mba-perspective',
    title: 'QA Engineering in Silicon Valley: Insights from a UC Berkeley MBA Perspective',
    description: 'Explore how Silicon Valley\'s innovation culture shapes quality assurance practices, combining technical QA expertise with strategic business thinking from UC Berkeley Haas School of Business.',
    date: '2025-01-24',
    url: 'https://isaacavazquez.com/writing/qa-engineering-silicon-valley-uc-berkeley-mba-perspective'
  },
  {
    slug: 'building-ai-powered-analytics-fantasy-football-to-enterprise',
    title: 'Building AI-Powered Analytics: From Fantasy Football to Enterprise',
    description: 'Learn how to build scalable analytics systems, from fantasy sports applications to enterprise-grade solutions.',
    date: '2025-01-20',
    url: 'https://isaacavazquez.com/writing/building-ai-powered-analytics-fantasy-football-to-enterprise'
  },
  {
    slug: 'complete-guide-qa-engineering',
    title: 'The Complete Guide to QA Engineering',
    description: 'A comprehensive guide to quality assurance engineering, covering testing strategies, automation frameworks, and career development.',
    date: '2025-01-15',
    url: 'https://isaacavazquez.com/writing/complete-guide-qa-engineering'
  }
];

export async function GET() {
  const baseUrl = 'https://isaacavazquez.com';
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Isaac Vazquez</title>
    <link>${baseUrl}</link>
    <description>Product Manager at UC Berkeley Haas. Writing about product strategy, technical leadership, and MBA insights.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml"/>
    
    ${posts.map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${post.url}</link>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid isPermaLink="true">${post.url}</guid>
    </item>
    `).join('')}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=86400, stale-while-revalidate'
    }
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}