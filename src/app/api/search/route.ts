import { NextRequest, NextResponse } from 'next/server';
import { getAllBlogPosts } from '@/lib/blog';

interface SearchableContent {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  url: string;
  type: 'blog' | 'project' | 'page';
  category?: string;
  tags?: string[];
  publishedAt?: string;
}

// This would be expanded to include more content types
async function getAllSearchableContent(): Promise<SearchableContent[]> {
  const content: SearchableContent[] = [];

  // Get blog posts
  try {
    const blogPosts = await getAllBlogPosts();
    const blogContent = blogPosts.map(post => ({
      id: `blog-${post.slug}`,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      url: `/blog/${post.slug}`,
      type: 'blog' as const,
      category: post.category,
      tags: post.tags,
      publishedAt: post.publishedAt
    }));
    content.push(...blogContent);
  } catch (error) {
    console.error('Error fetching blog posts for search:', error);
  }

  // Add static pages
  const staticPages = [
    {
      id: 'page-about',
      title: 'About Isaac Vazquez',
      excerpt: 'QA Engineer and Fantasy Football Analytics Developer based in Austin, TX. Learn about my experience in software testing, automation, and data visualization.',
      content: 'About page content including QA engineering experience, fantasy football analytics, software development, Austin Texas, quality assurance, test automation',
      url: '/about',
      type: 'page' as const,
      category: 'About'
    },
    {
      id: 'page-projects',
      title: 'Projects & Portfolio',
      excerpt: 'Explore my portfolio of QA engineering projects, fantasy football analytics tools, and software development work.',
      content: 'Projects portfolio QA engineering fantasy football analytics software development testing automation data visualization',
      url: '/projects',
      type: 'page' as const,
      category: 'Projects'
    },
    {
      id: 'page-resume',
      title: 'Resume - Isaac Vazquez',
      excerpt: 'Professional resume showcasing QA engineering experience, software testing expertise, and technical skills.',
      content: 'Resume QA engineer software testing automation quality assurance technical skills experience Austin Texas',
      url: '/resume',
      type: 'page' as const,
      category: 'Professional'
    },
    {
      id: 'page-contact',
      title: 'Contact Isaac Vazquez',
      excerpt: 'Get in touch for QA engineering consulting, software testing projects, or fantasy football analytics discussions.',
      content: 'Contact QA engineer software testing consulting fantasy football analytics Austin Texas collaboration',
      url: '/contact',
      type: 'page' as const,
      category: 'Contact'
    },
    {
      id: 'page-faq',
      title: 'Frequently Asked Questions',
      excerpt: 'Common questions about QA engineering services, software testing, fantasy football analytics, and working together.',
      content: 'FAQ questions QA engineering software testing fantasy football analytics services consulting',
      url: '/faq',
      type: 'page' as const,
      category: 'FAQ'
    },
    {
      id: 'project-fantasy-football',
      title: 'Fantasy Football Analytics Platform',
      excerpt: 'Advanced fantasy football analytics and visualization tools with interactive tier charts, clustering algorithms, and real-time data processing.',
      content: 'Fantasy football analytics data visualization D3.js React TypeScript clustering algorithms tier charts draft tools waiver wire optimization',
      url: '/fantasy-football',
      type: 'project' as const,
      category: 'Fantasy Football Analytics',
      tags: ['Fantasy Football', 'Analytics', 'Data Visualization', 'React', 'TypeScript']
    }
  ];

  content.push(...staticPages);
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
      relevanceScore: item.relevanceScore
    }));
    
    return NextResponse.json({
      results: searchResults,
      total: results.length,
      query,
      filters: { type, category }
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', results: [], total: 0 },
      { status: 500 }
    );
  }
}