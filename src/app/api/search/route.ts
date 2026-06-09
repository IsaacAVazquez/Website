import { NextRequest, NextResponse } from 'next/server';
import { getAllBlogPostPreviews } from '@/lib/blog';
import { caseStudiesData } from '@/constants/caseStudies';
import { logger } from '@/lib/logger';

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

  // ---- Project case studies (one entry per /portfolio/[slug]) ------------
  for (const study of Object.values(caseStudiesData)) {
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
      ]
        .filter(Boolean)
        .join(' '),
      url: `/portfolio/${study.slug}`,
      type: 'project',
      category: 'Portfolio',
      tags: study.tools,
    });
  }

  // ---- Curated static page entries --------------------------------------
  const staticPages: SearchableContent[] = [
    {
      id: 'page-home',
      title: 'Isaac Vazquez',
      excerpt:
        'Portfolio site for Isaac Vazquez — product manager, builder, and analytics-focused operator.',
      content:
        'home portfolio Isaac Vazquez product manager analytics fintech builder Berkeley Bay Area',
      url: '/',
      type: 'page',
      category: 'Site',
    },
    {
      id: 'page-about',
      title: 'About Isaac Vazquez',
      excerpt:
        'Background, work history, and how I think about product management, analytics, and decision-support tooling.',
      content:
        'about Isaac Vazquez background bio product manager analytics civic tech fintech Berkeley',
      url: '/about',
      type: 'page',
      category: 'Site',
    },
    {
      id: 'page-portfolio',
      title: 'Portfolio & Case Studies',
      excerpt:
        'Portfolio of product case studies, fintech tools, analytics products, and decision-support interfaces.',
      content:
        'Portfolio case studies product management fintech product analytics decision support AI workflows product tools projects',
      url: '/portfolio',
      type: 'page',
      category: 'Projects',
    },
    {
      id: 'page-resume',
      title: 'Resume - Isaac Vazquez',
      excerpt:
        'Resume for a product manager with 6+ years across QA, analytics, civic tech, and fintech-style product work.',
      content:
        'Resume product manager QA analytics civic tech fintech product work Berkeley Bay Area',
      url: '/resume',
      type: 'page',
      category: 'Professional',
    },
    {
      id: 'page-contact',
      title: 'Contact Isaac Vazquez',
      excerpt:
        'Get in touch about product roles, analytics work, AI workflows, or fintech-focused projects.',
      content:
        'Contact product manager analytics AI workflows fintech product collaboration Berkeley Bay Area',
      url: '/contact',
      type: 'page',
      category: 'Contact',
    },
    {
      id: 'page-writing',
      title: 'Writing',
      excerpt:
        'Writing on PM workflows, agentic AI, fintech product thinking, reliability, and systems design.',
      content:
        'Writing blog articles product management agentic AI fintech product reliability systems design',
      url: '/writing',
      type: 'page',
      category: 'Writing',
    },
    {
      id: 'page-accessibility',
      title: 'Accessibility',
      excerpt:
        'Accessibility commitments and conformance notes for this site, including WCAG references and how to report issues.',
      content:
        'accessibility WCAG conformance contrast keyboard screen reader inclusive design',
      url: '/accessibility',
      type: 'page',
      category: 'Site',
    },
    {
      id: 'page-investments',
      title: 'Investment Research Platform',
      excerpt:
        'Snapshot-backed investment research workspace for valuation review, financial statements, and portfolio tracking.',
      content:
        'Investment research platform fintech product valuation dashboard portfolio tracking equity analysis stocks',
      url: '/investments',
      type: 'project',
      category: 'Fintech Product',
      tags: ['Investments', 'Fintech Product', 'Portfolio Tracking', 'Equity Analysis'],
    },
    {
      id: 'page-fantasy-football',
      title: 'Fantasy Football Analytics Platform',
      excerpt:
        'Snapshot-backed fantasy football rankings with consensus tiers, scoring toggles, and a manual draft assistant.',
      content:
        'Fantasy football rankings FantasyPros consensus tiers PPR half PPR standard scoring overall position QB RB WR TE draft assistant snake draft waiver',
      url: '/fantasy-football',
      type: 'project',
      category: 'Fantasy Football Analytics',
      tags: ['Fantasy Football', 'Rankings', 'Draft Tools', 'Next.js', 'TypeScript'],
    },
    {
      id: 'page-news-pulse',
      title: 'News Pulse Dashboard',
      excerpt:
        'News media analytics dashboard for comparing cross-outlet framing, topics, and sentiment.',
      content:
        'News Pulse dashboard media analytics RSS aggregation sentiment analysis topic extraction',
      url: '/news-pulse',
      type: 'project',
      category: 'Analytics Tools',
      tags: ['Media Analytics', 'Dashboard', 'News Product', 'Next.js'],
    },
    {
      id: 'page-github-trending',
      title: 'GitHub Trending Pulse',
      excerpt:
        'Snapshot-driven view of trending GitHub repositories segmented by language and topic.',
      content:
        'GitHub trending pulse open source repositories languages topics developer ecosystem snapshot',
      url: '/github-trending-pulse',
      type: 'project',
      category: 'Developer Tools',
      tags: ['GitHub', 'Open Source', 'Developer Tools', 'Dashboard'],
    },
    {
      id: 'page-spacex',
      title: 'SpaceX Mission Control',
      excerpt:
        'Mission control dashboard tracking SpaceX upcoming launches, recent missions, and program metrics.',
      content:
        'SpaceX mission control launches Starship Falcon rockets Dragon space exploration dashboard',
      url: '/spacex-mission-control',
      type: 'project',
      category: 'Space',
      tags: ['SpaceX', 'Space', 'Launches', 'Dashboard'],
    },
    {
      id: 'page-march-madness',
      title: 'March Madness 2026 Bracket Analysis',
      excerpt:
        'Seasonal NCAA tournament workspace for bracket analysis, seed lines, and matchup context.',
      content:
        'March Madness 2026 NCAA tournament bracket basketball college seeds matchups analysis',
      url: '/march-madness-2026',
      type: 'project',
      category: 'Sports Data Tools',
      tags: ['March Madness', 'NCAA', 'Basketball', 'Tournament'],
    },
    {
      id: 'page-polling-aggregator',
      title: 'Polling Aggregator',
      excerpt:
        'Snapshot-driven aggregator for political polling — tracks averages and methodology context.',
      content:
        'Polling aggregator politics elections survey methodology averages political data dashboard',
      url: '/polling-aggregator',
      type: 'project',
      category: 'Civic Tech',
      tags: ['Polling', 'Politics', 'Elections', 'Data'],
    },
    {
      id: 'page-museum-log',
      title: 'Museum Log',
      excerpt:
        'Personal log of museums visited, with notes on exhibitions and lasting impressions.',
      content:
        'museum log art exhibitions visits cultural institutions personal log notes',
      url: '/museum-log',
      type: 'page',
      category: 'Personal',
      tags: ['Museums', 'Art', 'Personal'],
    },
    {
      id: 'page-mba-internship-notifications',
      title: 'MBA Internship Notifications',
      excerpt:
        'Live aggregator of MBA internship and full-time roles across major employers, with email digests.',
      content:
        'MBA internship full-time roles tracker greenhouse lever ashby career digest email recruiting',
      url: '/mba-internship-notifications',
      type: 'project',
      category: 'Career Tools',
      tags: ['MBA', 'Internships', 'Recruiting', 'Career'],
    },
    {
      id: 'page-formula-1',
      title: 'Formula 1 Pulse',
      excerpt:
        'Formula 1 dashboard with race results, championship standings, and constructor visualizations.',
      content:
        'Formula 1 F1 racing constructors drivers championship standings season results dashboard',
      url: '/formula-1',
      type: 'project',
      category: 'Sports Data Tools',
      tags: ['Formula 1', 'F1', 'Racing', 'Sports Data', 'Dashboard'],
    },
    {
      id: 'page-fantasy-formula-1',
      title: 'Fantasy Formula 1 Optimizer',
      excerpt:
        'Fantasy Formula 1 team optimizer with model prices, lineup constraints, locked picks, and local persistence.',
      content:
        'Fantasy Formula 1 F1 optimizer team builder drivers constructors budget model prices projections OpenF1 sports data',
      url: '/fantasy-formula-1',
      type: 'project',
      category: 'Sports Data Tools',
      tags: ['Fantasy Formula 1', 'F1', 'Optimizer', 'Sports Data', 'Dashboard'],
    },
    {
      id: 'page-premier-league',
      title: 'Premier League Pulse',
      excerpt:
        'Premier League dashboard with standings, fixtures, scorer leaderboards, and team form context.',
      content:
        'Premier League soccer football EPL standings fixtures scorers form table England dashboard',
      url: '/premier-league',
      type: 'project',
      category: 'Sports Data Tools',
      tags: ['Premier League', 'Soccer', 'Sports Data', 'Dashboard'],
    },
    {
      id: 'page-la-liga',
      title: 'La Liga Pulse',
      excerpt:
        'La Liga dashboard with standings, title-race context, qualification pressure, and player leaderboards.',
      content:
        'La Liga soccer football Spain standings table top scorers assists Real Madrid Barcelona dashboard',
      url: '/la-liga',
      type: 'project',
      category: 'Sports Data Tools',
      tags: ['La Liga', 'Soccer', 'Sports Data', 'Dashboard'],
    },
    {
      id: 'page-mlb',
      title: 'MLB Pulse',
      excerpt:
        'MLB dashboard with standings, schedule, and player leaderboards across the season.',
      content:
        'MLB baseball standings schedule scores divisions American League National League players dashboard',
      url: '/mlb',
      type: 'project',
      category: 'Sports Data Tools',
      tags: ['MLB', 'Baseball', 'Sports Data', 'Dashboard'],
    },
    {
      id: 'page-nba',
      title: 'NBA Pulse',
      excerpt:
        'NBA dashboard with conference standings, scoreboard, leaders, and per-team schedules.',
      content:
        'NBA basketball standings scoreboard leaders conferences East West playoffs play-in teams dashboard',
      url: '/nba',
      type: 'project',
      category: 'Sports Data Tools',
      tags: ['NBA', 'Basketball', 'Sports Data', 'Dashboard'],
    },
    {
      id: 'page-nfl',
      title: 'NFL Pulse',
      excerpt:
        'NFL dashboard with conference standings, weekly schedule, and stat leaders.',
      content:
        'NFL football standings AFC NFC playoffs schedule stat leaders teams weekly dashboard',
      url: '/nfl',
      type: 'project',
      category: 'Sports Data Tools',
      tags: ['NFL', 'Football', 'Sports Data', 'Dashboard'],
    },
    {
      id: 'page-world-cup-2026',
      title: 'World Cup Pulse',
      excerpt:
        '2026 FIFA World Cup dashboard with group standings, the 32-team knockout bracket, the full match schedule, and host venues across the United States, Canada, and Mexico.',
      content:
        'World Cup 2026 FIFA soccer football groups standings knockout bracket round of 32 schedule fixtures host cities venues United States Canada Mexico dashboard',
      url: '/world-cup-2026',
      type: 'project',
      category: 'Sports Data Tools',
      tags: ['World Cup', 'FIFA', 'Soccer', 'Football', 'Sports Data', 'Dashboard'],
    },
    {
      id: 'page-interchange-iq',
      title: 'Interchange IQ',
      excerpt:
        'Payments fee analyzer for comparing flat-rate and interchange-plus processor economics.',
      content:
        'Interchange IQ payments pricing interchange economics processor comparison fintech tool fees',
      url: '/fintech-tools/interchange-iq',
      type: 'project',
      category: 'Fintech Product',
      tags: ['Payments', 'Interchange', 'Pricing', 'Fintech Product'],
    },
    {
      id: 'page-budget-planner',
      title: 'Budget Planner',
      excerpt:
        'Browser-persisted monthly budget planner for income, savings goals, and expense categories.',
      content:
        'Budget planner monthly personal finance savings expenses categories income browser local storage',
      url: '/fintech-tools/budget-planner',
      type: 'project',
      category: 'Fintech Product',
      tags: ['Budget', 'Personal Finance', 'Fintech Product'],
    },
    {
      id: 'page-pga-tour-pulse',
      title: 'PGA Tour Pulse',
      excerpt:
        'Snapshot-backed golf tournament dashboard for leaderboard scanning and golfer drilldowns.',
      content:
        'PGA Tour golf dashboard leaderboard golfer drilldown cut line round movement sports data Next.js TypeScript',
      url: '/golf',
      type: 'project',
      category: 'Sports Data Tools',
      tags: ['Golf', 'PGA Tour', 'Sports Data', 'Dashboard', 'Next.js'],
    },
    {
      id: 'page-earthquake-pulse',
      title: 'Earthquake Pulse',
      excerpt:
        'Snapshot-backed global earthquake monitor for the past 24 hours of seismic activity, significant worldwide quakes, and regional breakdowns.',
      content:
        'earthquake pulse USGS seismic monitor magnitude depth tsunami significant quakes regions distribution global geojson dashboard Next.js TypeScript',
      url: '/earthquake-pulse',
      type: 'project',
      category: 'Data Tools',
      tags: ['Earthquakes', 'USGS', 'Data Visualization', 'Dashboard', 'Next.js'],
    },
    {
      id: 'page-ai-dev-tools',
      title: 'AI Dev Tool Ecosystem',
      excerpt:
        'Directory of AI coding and agent tools with pricing tiers, model support, GitHub stars, release cadence, and deep-linkable filters.',
      content:
        'AI dev tools coding agents Cursor Claude Code GitHub Copilot Devin Cline OpenCode Kilo Code pricing models GitHub stars release cadence developer tools directory',
      url: '/ai-dev-tools',
      type: 'project',
      category: 'Developer Tools',
      tags: ['AI Dev Tools', 'Coding Agents', 'Developer Tools', 'Dashboard'],
    },
    {
      id: 'page-food-map',
      title: 'Food Map',
      excerpt:
        'A curated, deep-linkable map of the Austin restaurants I send people to first, filterable by neighborhood, cuisine, and meal.',
      content:
        'Food map Austin restaurants curated city guide neighborhood cuisine meal filters deep-linkable',
      url: '/food-map',
      type: 'project',
      category: 'Personal',
      tags: ['Austin', 'Food', 'Restaurants', 'City Guide'],
    },
  ];

  // De-duplicate by URL when a project case study and a static page entry
  // both reference the same route — prefer the case study entry.
  const seenUrls = new Set(content.map((c) => c.url));
  for (const page of staticPages) {
    if (!seenUrls.has(page.url)) {
      content.push(page);
      seenUrls.add(page.url);
    }
  }

  return content;
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

  // Content matches (lowest weight but important for comprehensive search)
  const contentLower = content.content.toLowerCase();
  queryWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = contentLower.match(regex);
    if (matches) {
      score += matches.length * 2; // Multiple occurrences increase score
    }
  });

  // Boost newer content slightly
  if (content.publishedAt) {
    const publishDate = new Date(content.publishedAt);
    const now = new Date();
    const daysSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);

    // Boost content published in the last 30 days
    if (daysSincePublish <= 30) {
      score += 5;
    }
  }

  return score;
}

function searchContent(content: SearchableContent[], query: string, type?: string, category?: string): SearchableContent[] {
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

  // If no query, return filtered content sorted by date
  if (!query.trim()) {
    return filteredContent.sort((a, b) => {
      if (a.publishedAt && b.publishedAt) {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
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
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scoredResults;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all searchable content
    const allContent = await getAllSearchableContent();

    // Perform search
    const results = searchContent(allContent, query, type, category);

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
      relevanceScore: (item as SearchableContent & { relevanceScore?: number }).relevanceScore,
    }));

    return NextResponse.json({
      results: searchResults,
      total: results.length,
      query,
      filters: { type, category }
    }, { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } });

  } catch (error) {
    logger.error('Search API error', error);
    return NextResponse.json(
      { error: 'Search failed', results: [], total: 0 },
      { status: 500 }
    );
  }
}
