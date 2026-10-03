#!/usr/bin/env node

/**
 * buildLlmsFull.mjs
 *
 * Compiles public/llms-full.txt per the llmstxt.org specification.
 * Combines profile context, working principles, product summaries,
 * and the complete markdown text of representative articles into
 * a single document optimized for large-context LLM ingestion.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const projectRoot = process.cwd();
const outputPath = path.join(projectRoot, "public", "llms-full.txt");
const blogDirectory = path.join(projectRoot, "content", "blog");

const REPRESENTATIVE_SLUGS = [
  "agentic-ai-explained-for-product-managers",
  "evaluate-agentic-ai-product-pm-framework",
  "what-an-ai-agent-actually-costs-in-production",
  "context-engineering-replacing-prompt-engineering",
  "qa-automation-daily-deploys",
  "proactive-performance-intelligence",
  "scaling-civic-engagement-platform",
  "textout-platform",
  "interchange-iq-payment-fee-analyzer",
  "building-an-investment-research-platform",
  "pricing-strategy-initiative",
  "building-the-pulse-dashboard-family",
  "building-news-pulse-dashboard",
  "building-a-github-trending-dashboard",
  "building-a-bart-transit-dashboard",
  "building-spacex-mission-control",
];

async function readPost(slug) {
  for (const ext of ["mdx", "md"]) {
    const filePath = path.join(blogDirectory, `${slug}.${ext}`);
    try {
      const source = await fs.readFile(filePath, "utf8");
      const { data, content } = matter(source);
      return {
        slug,
        title: data.title,
        publishedAt: data.publishedAt,
        category: data.category,
        excerpt: data.excerpt,
        content: content.replace(/^\s*#\s+.+(?:\r?\n)+/, "").trim(),
      };
    } catch {
      // Try next extension
    }
  }
  return null;
}

async function generate() {
  const sections = [];

  // Header & Identity
  sections.push(`# Isaac Vazquez — Complete Corpus (llms-full.txt)

> Second-year MBA candidate at UC Berkeley Haas, Class of 2027, moving into product. Six years across campaign data at Open Progress and QA at Civitech, where the QA role grew into product work, then a summer 2026 growth internship at Juno.

- Canonical website: https://isaacvazquez.com
- Index summary: https://isaacvazquez.com/llms.txt
- Full sitemap: https://isaacvazquez.com/sitemap.xml
- RSS feed: https://isaacvazquez.com/api/rss
- Contact email: IsaacVazquez@berkeley.edu
- LinkedIn: https://www.linkedin.com/in/isaac-vazquez/
- GitHub: https://github.com/IsaacAVazquez

---

## Biography & Recruiting Context

Isaac Vazquez is a second-year MBA candidate at UC Berkeley Haas, Class of 2027, looking for a full-time role in product management, product marketing, or program management that starts after he graduates in May 2027, and he is interested in consumer tech broadly.

At Civitech, a campaign software company, his QA role grew into product work. He owned the product vision for the TextOut texting platform, led a pricing initiative that generated $4M in additional revenue in 2024, and helped launch RunningMate. In summer 2026 he was the MBA growth intern at Juno, a fintech company that negotiates group rates on student loans, focusing on funnel conversion analysis and member activation. He is a Consortium Fellow and MLT Professional Development Fellow, and he builds and maintains the tools on this site.

---

## Working Principles & Philosophy

### 1. Check what produces the number
Before acting on a metric, understand the query or event instrumentation behind it. At Juno, correcting one click event moved the funnel's biggest drop off a step earlier, to members who had an approved rate and never clicked through to a lender.

### 2. Watch customers use the real thing
Alpha demos work best when customers work through their actual workflows in new builds. At Civitech, alpha demo observation revealed the messaging window was cutting off message content, leading directly to a user story, business case, and a production fix within one week.

### 3. Put the limits next to the number
A simple comparison can easily mislead. At Juno, advising meetings superficially appeared to multiply conversion, but most occurred after the conversion they were credited with. Building a matched estimate showed the true causal lift was a fraction of the headline number.

---

## Live Product Tools & Dashboards

- [Investment Research Platform](https://isaacvazquez.com/investments): Public investment research platform with portfolio tracking, quote snapshots, stock comparisons, and retirement-planning experiments.
- [Before You Buy](https://isaacvazquez.com/investments/before-you-buy): Concept for Google Finance showing portfolio impact (sector shift, beta, historical worst-day stress tests) before buying a stock.
- [Interchange IQ](https://isaacvazquez.com/fintech-tools/interchange-iq): Payment fee analyzer comparing flat-rate and interchange-plus processor economics with adjustable volume, ticket size, and card mix.
- [Budget Planner](https://isaacvazquez.com/fintech-tools/budget-planner): Browser-persisted budgeting workspace for income, category planning, savings targets, and manual expense tracking.
- [Rent vs. Buy Calculator](https://isaacvazquez.com/fintech-tools/rent-vs-buy): Net-worth model that credits the renter the opportunity cost of the down payment and determines crossover timing.
- [Fantasy Football Suite](https://isaacvazquez.com/fantasy-football): Snapshot-backed rankings, weekly board, waiver target analyzer, trade calculator, and best ball draft assistants with Underdog ADP.
- [Frontier Model Tracker](https://isaacvazquez.com/frontier-models): Comparison of leading foundation models across pricing, context windows, modalities, and reasoning capabilities.
- [AI Dev Tools Directory](https://isaacvazquez.com/ai-dev-tools): Curated catalog of developer AI tooling, pricing, and agent integrations.
- [Agent Build Index](https://isaacvazquez.com/agent-build-index): Weekly tracking of public GitHub agent repositories and star momentum.
- [Decision Lab](https://isaacvazquez.com/decision-lab): Product-bet triage framework scoring impact, confidence, effort, and reversibility.
- [Automation Enablement Assistant](https://isaacvazquez.com/enablement-assistant): Recommends standard test stacks, builds onboarding plans, and diagnoses automation gaps.
- [News Pulse](https://isaacvazquez.com/news-pulse): RSS-backed media analytics comparing story frequency, topic coverage, and editorial tone.
- [SpaceX Mission Control](https://isaacvazquez.com/spacex-mission-control): Real-time launch schedules, booster tracking, and launch economics from public space APIs.
- [Bay Area Transit Pulse](https://isaacvazquez.com/bay-area-transit): Live BART departures, elevator alerts, and line status for the San Francisco Bay Area.
- [Sports Pulse Family](https://isaacvazquez.com/dashboards): Dedicated daily-updated data dashboards for Premier League, La Liga, MLB, NBA, NFL, Formula 1, Golf, and World Cup 2026.

---

## Representative Articles & In-Depth Writing (Full Text)
`);

  let loadedCount = 0;
  for (const slug of REPRESENTATIVE_SLUGS) {
    const post = await readPost(slug);
    if (!post) continue;
    loadedCount++;

    sections.push(`### ${post.title}

- URL: https://isaacvazquez.com/writing/${post.slug}
- Published: ${post.publishedAt}
- Topic: ${post.category}
- Excerpt: ${post.excerpt}

${post.content}

---
`);
  }

  await fs.writeFile(outputPath, sections.join("\n\n"), "utf8");
  console.log(`Generated public/llms-full.txt (${loadedCount} essays included).`);
}

await generate();
