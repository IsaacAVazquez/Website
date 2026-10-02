import { NextRequest, NextResponse } from 'next/server';
import { getAllBlogPostPreviews } from '@/lib/blog';
import { caseStudiesData } from '@/constants/caseStudies';
import { logger } from '@/lib/logger';
import { classifyToolSlug, getToolCategoryLabel } from '@/constants/toolCategories';

interface SearchableContent {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  url: string;
  type: 'project' | 'page' | 'post';
  category?: string;
  tags?: string[];
  publishedAt?: string;
}

// url, title, excerpt, category, type (defaults to 'page'). One line per route;
// tools that have a case study come from caseStudiesData instead.
const STATIC_PAGES: [string, string, string, string, 'project'?][] = [
  ['/', 'Isaac Vazquez', 'My background, selected work, newest writing, and the dashboards I built.', 'Site'],
  ['/about', 'About Isaac Vazquez', 'How I got from campaign data and QA to Berkeley Haas, and the habits I work by.', 'Site'],
  ['/portfolio', 'Portfolio & Case Studies', 'Portfolio of product case studies, fintech tools, analytics products, and decision-support interfaces.', 'Projects'],
  ['/dashboards', 'Dashboards', 'The instruments I built and keep running, from football ledgers to markets and spaceflight.', 'Projects'],
  ['/resume', 'Resume - Isaac Vazquez', 'My résumé, covering Open Progress, Civitech, my 2026 growth internship at Juno, and my Berkeley Haas MBA.', 'Professional'],
  ['/contact', 'Contact Isaac Vazquez', 'How to reach me about full-time product roles, Haas, or anything on this site.', 'Contact'],
  ['/writing', 'Writing', 'Writing on PM workflows, agentic AI, fintech product thinking, reliability, and systems design.', 'Writing'],
  ['/accessibility', 'Accessibility', 'Accessibility commitments and conformance notes for this site, including WCAG references and how to report issues.', 'Site'],
  ['/now', 'Now', 'What I am focused on right now, from my second year at Haas to what I am building.', 'Site'],
  ['/changelog', 'Changelog', 'A running log of notable changes, new tools, and updates shipped across the site.', 'Site'],
  ['/arcade', 'Reactor Arcade', 'Reactor is a neon synthwave reflex game built into the site, a deliberate style experiment where you light the live cell, dodge the decoys, and keep the combo alive.', 'Site'],
  ['/agent-build-index', 'Agent Build Index', 'Weekly ranking of active public AI agent repositories by measured GitHub star movement.', 'AI & dev tools', 'project'],
  ['/score-pools', 'Score Pools', 'Exact-score prediction engine for pool play, with market-calibrated scoreline distributions, expected-points pick rankings, and leaderboard-aware recommendations from a checked-in odds snapshot.', 'Sports', 'project'],
  ['/score-pools/tracker', 'Score Pools Tracker', 'Running score tracker for exact-score prediction pools, with submitted picks scored against results, cumulative totals, and rival comparisons.', 'Sports', 'project'],
  ['/fantasy-football/trade-calculator', 'Fantasy Football Trade Calculator', 'A preseason one-QB redraft estimate using expert consensus, mock-draft ADP, and league settings.', 'Sports', 'project'],
  ['/fantasy-football/mock-draft', 'Fantasy Football Mock Draft Simulator', 'A practice draft room against simulated opponents built on the published consensus board and mock-draft ADP.', 'Sports', 'project'],
  ['/fantasy-football/draft-tracker', 'Fantasy Football Draft Assistant', 'Manual fantasy football draft assistant with snake-order tracking, roster pressure, a room-relative Draft Outlook, and an expected return calculator.', 'Sports', 'project'],
  ['/fantasy-football/best-ball', 'Best Ball Rankings and Draft Assistant', 'Best ball rankings, room-relative draft value, contest economics, and draft help for Best Ball Mania and other Underdog-style formats.', 'Sports', 'project'],
  ['/fantasy-football/best-ball/draft-tracker', 'Best Ball Draft Assistant', 'A manual best ball draft tracker with contest specific roster targets, a room-relative Draft Outlook, Best Ball Mania field economics, and expected return math.', 'Sports', 'project'],
  ['/fantasy-football/weekly', 'Fantasy Football Weekly Rankings', "In-season weekly consensus rankings for flex and quarterback, with each player's opponent, expert range, and how widely he is rostered.", 'Sports', 'project'],
  ['/fantasy-football/waivers', 'Fantasy Football Waiver Targets', 'In-season waiver adds where the weekly expert consensus rank runs ahead of how widely a player is rostered.', 'Sports', 'project'],
];


// Build the searchable corpus: blog posts + project case studies + the
// remaining curated static page entries. The matcher below stays
// substring + tag based — only the corpus expands.
async function getAllSearchableContent(): Promise<SearchableContent[]> {
  const content: SearchableContent[] = [];

  // ---- Blog posts (every published article under content/blog) -----------
  try {
    const posts = getAllBlogPostPreviews();
    for (const post of posts) {
      content.push({
        id: `post-${post.slug}`,
        title: post.title,
        excerpt: post.excerpt,
        content: [post.title, post.excerpt, post.category, post.tags.join(' ')]
          .filter(Boolean)
          .join(' '),
        url: `/writing/${post.slug}`,
        type: 'post',
        category: post.category,
        tags: post.tags,
        publishedAt: post.publishedAt,
      });
    }
  } catch (err) {
    logger.error('Search corpus: failed to load blog posts', err);
  }

  // ---- Project case studies ---------------------------------------------
  // A case study that names a live tool redirects there from
  // /portfolio/<slug>, so its entry points at the tool itself.
  for (const study of Object.values(caseStudiesData)) {
    const category = getToolCategoryLabel(classifyToolSlug(study.slug));
    content.push({
      id: `project-case-${study.slug}`,
      title: study.title,
      excerpt: study.description,
      content: [
        study.title,
        study.description,
        study.role,
        study.tools.join(' '),
        study.metrics,
        study.overview?.summary ?? '',
        category,
      ]
        .filter(Boolean)
        .join(' '),
      url: study.link?.startsWith('/') ? study.link : `/portfolio/${study.slug}`,
      type: 'project',
      category,
      tags: study.tools,
    });
  }

  // ---- Pages with no case study -----------------------------------------
  // Tools with a case study are indexed above, so a URL already in the corpus
  // is skipped here rather than listed twice.
  for (const [url, title, excerpt, category, type = 'page'] of STATIC_PAGES) {
    if (content.some((item) => item.url === url)) continue;
    content.push({
      id: `page-${url.slice(1).replace(/\//g, '-') || 'home'}`,
      title,
      excerpt,
      content: `${title} ${excerpt} ${category}`,
      url,
      type,
      category,
    });
  }

  return content;
}

// Hand-written answers for a few hidden queries. They only show when the whole
// query matches a key after normalizing case, punctuation, and spacing, so they
// never leak into unrelated searches. "resume" is left out on purpose because
// it already returns the /resume page as the top result.
const MONET_ANSWER: SearchableContent = {
  id: 'answer-monet',
  title: 'Monet on the home page',
  excerpt:
    'If you hover over my name in the header, or over my portrait on the home page or the about page, they turn into paintings.',
  content: '',
  url: '/',
  type: 'page',
  category: 'Site',
};
const KONAMI_ANSWER: SearchableContent = {
  id: 'answer-konami',
  title: 'Konami code',
  excerpt:
    'Press up up down down left right left right B A on any page and something happens. Outside the arcade it ends with a link to the arcade, and inside the arcade it is worth trying too.',
  content: '',
  url: '/arcade',
  type: 'page',
  category: 'Site',
};
const HIRE_ANSWER: SearchableContent = {
  id: 'answer-hire',
  title: 'Get in touch',
  excerpt:
    'If you want to talk about a product role or a project, the contact page is the quickest way to reach me.',
  content: '',
  url: '/contact',
  type: 'page',
  category: 'Contact',
};
const EASTER_EGG_ANSWER: SearchableContent = {
  id: 'answer-easter-eggs',
  title: 'Easter eggs',
  excerpt:
    "There are a few hidden around the site, from something on the home page, to a note in the browser console, to a couple I'll leave for you to find.",
  content: '',
  url: '/',
  type: 'page',
  category: 'Site',
};

// The hints below each point at one easter egg without giving the trigger
// away in full. docs/EASTER_EGGS.md has the whole list.
const DARKROOM_ANSWER: SearchableContent = {
  id: 'answer-darkroom',
  title: 'Darkroom',
  excerpt:
    'The light switch in the header does more than change the theme if you flip it enough times in a row.',
  content: '',
  url: '/',
  type: 'page',
  category: 'Site',
};
const STAMP_ANSWER: SearchableContent = {
  id: 'answer-stamp',
  title: 'Rubber stamp',
  excerpt:
    'The wordmark in the footer works like a rubber stamp, and the press notices if you stamp it enough times in a row.',
  content: '',
  url: '/',
  type: 'page',
  category: 'Site',
};
const NIGHT_SHIFT_ANSWER: SearchableContent = {
  id: 'answer-night-shift',
  title: 'Night shift',
  excerpt:
    'The tab title changes when you switch away from the site, and it reads differently after midnight.',
  content: '',
  url: '/',
  type: 'page',
  category: 'Site',
};
const THIRTY_LIVES_ANSWER: SearchableContent = {
  id: 'answer-thirty-lives',
  title: '30 lives',
  excerpt:
    'The Konami code works in the arcade too, and it does there what it did in Contra.',
  content: '',
  url: '/arcade',
  type: 'page',
  category: 'Site',
};
const TEAPOT_ANSWER: SearchableContent = {
  id: 'answer-teapot',
  title: 'Teapot',
  excerpt:
    "There's a teapot at /teapot. It can't brew coffee, and it answers with the status code that says so.",
  content: '',
  url: '/teapot',
  type: 'page',
  category: 'Site',
};
const COLOPHON_ANSWER: SearchableContent = {
  id: 'answer-colophon',
  title: 'Colophon',
  excerpt:
    'The stack, the typefaces, and the inks behind the site are listed in a plain text file at /humans.txt.',
  content: '',
  url: '/humans.txt',
  type: 'page',
  category: 'Site',
};

const HIDDEN_ANSWERS: Record<string, SearchableContent> = {
  monet: MONET_ANSWER,
  konami: KONAMI_ANSWER,
  'konami code': KONAMI_ANSWER,
  'cheat code': KONAMI_ANSWER,
  'cheat codes': KONAMI_ANSWER,
  'hire me': HIRE_ANSWER,
  'hire isaac': HIRE_ANSWER,
  'easter egg': EASTER_EGG_ANSWER,
  'easter eggs': EASTER_EGG_ANSWER,
  darkroom: DARKROOM_ANSWER,
  safelight: DARKROOM_ANSWER,
  stamp: STAMP_ANSWER,
  'rubber stamp': STAMP_ANSWER,
  'night shift': NIGHT_SHIFT_ANSWER,
  contra: THIRTY_LIVES_ANSWER,
  '30 lives': THIRTY_LIVES_ANSWER,
  'thirty lives': THIRTY_LIVES_ANSWER,
  teapot: TEAPOT_ANSWER,
  '418': TEAPOT_ANSWER,
  'i m a teapot': TEAPOT_ANSWER,
  humans: COLOPHON_ANSWER,
  'humans txt': COLOPHON_ANSWER,
  colophon: COLOPHON_ANSWER,
};

function findHiddenAnswer(query: string): SearchableContent | undefined {
  const key = query.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return HIDDEN_ANSWERS[key];
}

function calculateRelevanceScore(content: SearchableContent, query: string): number {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);

  let score = 0;

  // Title matches (highest weight)
  const titleLower = content.title.toLowerCase();
  queryWords.forEach(word => {
    if (titleLower.includes(word)) {
      score += titleLower === queryLower ? 100 : 50; // Exact match bonus
    }
  });

  // Excerpt matches
  const excerptLower = content.excerpt.toLowerCase();
  queryWords.forEach(word => {
    if (excerptLower.includes(word)) {
      score += 20;
    }
  });

  // Category matches
  if (content.category) {
    const categoryLower = content.category.toLowerCase();
    queryWords.forEach(word => {
      if (categoryLower.includes(word)) {
        score += 15;
      }
    });
  }

  // Tag matches
  if (content.tags) {
    content.tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      queryWords.forEach(word => {
        if (tagLower.includes(word)) {
          score += 10;
        }
      });
    });
  }

  // Content matches (lowest weight but important for comprehensive search).
  // Count substring occurrences, mirroring the .includes() matching used by
  // the fields above. This avoids the ASCII-only `\b` word-boundary regex,
  // which silently dropped tokens with punctuation or accents (e.g. "c++",
  // ".net", "café") from the content-field score.
  const contentLower = content.content.toLowerCase();
  queryWords.forEach(word => {
    const occurrences = contentLower.split(word).length - 1;
    if (occurrences > 0) {
      score += occurrences * 2; // Multiple occurrences increase score
    }
  });

  // Boost newer content slightly. Gated on score > 0, like the project boost
  // below, so a recent post that matches nothing never enters the results.
  if (score > 0 && content.publishedAt) {
    const publishDate = new Date(content.publishedAt);
    const now = new Date();
    const daysSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);

    // Boost content published in the last 30 days
    if (daysSincePublish <= 30) {
      score += 5;
    }
  }

  // Prioritize project case studies over writing: when an item already matches
  // the query, give projects a modest edge so they surface above comparable
  // posts. The bump (12) is smaller than a single title/excerpt hit, so strong
  // writing matches still win — only near-ties tilt toward projects. Gated on
  // score > 0 so a non-matching project never enters the results.
  if (score > 0 && content.type === 'project') {
    score += 12;
  }

  return score;
}

// Lower rank sorts first. Projects ahead of writing ahead of utility pages —
// the stable tiebreak behind the relevance score (see PROJECT boost above).
const TYPE_RANK: Record<string, number> = { project: 0, post: 1, page: 2 };
function typeRank(type: string): number {
  return TYPE_RANK[type] ?? 3;
}

type ScoredContent = SearchableContent & { relevanceScore?: number };

function searchContent(content: SearchableContent[], query: string, type?: string, category?: string): ScoredContent[] {
  let filteredContent = content;

  // Apply type filter
  if (type && type !== 'all') {
    filteredContent = filteredContent.filter(item => item.type === type);
  }

  // Apply category filter
  if (category && category !== 'all') {
    filteredContent = filteredContent.filter(item =>
      item.category?.toLowerCase() === category.toLowerCase()
    );
  }

  // If no query, return the filtered corpus in a stable total order: dated
  // entries (blog posts) first by recency, then everything else by title.
  // (Pages and case studies carry no publishedAt, so a "both have dates"
  // check alone yielded a non-total, input-order-dependent ordering.)
  if (!query.trim()) {
    return filteredContent.slice().sort((a, b) => {
      if (a.publishedAt && b.publishedAt) {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
      if (a.publishedAt) return -1;
      if (b.publishedAt) return 1;
      return a.title.localeCompare(b.title);
    });
  }

  // Calculate relevance scores and filter
  const scoredResults = filteredContent
    .map(item => ({
      ...item,
      relevanceScore: calculateRelevanceScore(item, query)
    }))
    .filter(item => item.relevanceScore > 0)
    .sort((a, b) =>
      b.relevanceScore - a.relevanceScore ||
      typeRank(a.type) - typeRank(b.type) ||
      a.title.localeCompare(b.title)
    );

  return scoredResults;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const category = searchParams.get('category') || 'all';
    const parsedLimit = Number.parseInt(searchParams.get('limit') ?? '', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;

    // Get all searchable content
    const allContent = await getAllSearchableContent();

    // Perform search
    const matched = searchContent(allContent, query, type, category);

    // A hidden answer goes on top of an unfiltered search, replacing any normal
    // result for the same URL so the list never shows that page twice.
    const hiddenAnswer = type === 'all' && category === 'all' ? findHiddenAnswer(query) : undefined;
    const results: ScoredContent[] = hiddenAnswer
      ? [hiddenAnswer, ...matched.filter((item) => item.url !== hiddenAnswer.url)]
      : matched;

    // Limit results
    const limitedResults = results.slice(0, limit);

    // Format results for response
    const searchResults = limitedResults.map(item => ({
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      url: item.url,
      type: item.type,
      category: item.category,
      tags: item.tags,
      publishedAt: item.publishedAt,
      relevanceScore: item.relevanceScore,
    }));

    return NextResponse.json({
      results: searchResults,
      total: results.length,
      query,
      filters: { type, category }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        // Without this, Netlify's edge cache keys /api/search only on Next's
        // internal params (its default Netlify-Vary), so a single cached
        // response was served for every q/type/category — search filtering
        // silently no-op'd in production while working in `next dev`. Vary the
        // edge cache on the full query string so each search is cached per-query.
        'Netlify-Vary': 'query',
      },
    });

  } catch (error) {
    logger.error('Search API error', error);
    return NextResponse.json(
      { error: 'Search failed', results: [], total: 0 },
      { status: 500 }
    );
  }
}
