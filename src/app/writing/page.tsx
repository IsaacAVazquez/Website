import { getAllBlogPosts } from '@/lib/blog';
import { FantasyContentGrid } from '@/components/FantasyContentGrid';
import { StructuredData } from "@/components/StructuredData";
import { generateBreadcrumbStructuredData } from "@/lib/seo";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fantasy Football Writing - Isaac Vazquez | Analytics & Strategy Insights',
  description: 'In-depth fantasy football articles covering analytics, draft strategy, data science, and advanced statistical modeling. Expert insights from a QA engineer and fantasy football analyst.',
  keywords: ['fantasy football writing', 'fantasy football analytics', 'draft strategy', 'fantasy football data science', 'NFL analytics', 'fantasy sports insights'],
  openGraph: {
    title: 'Fantasy Football Writing - Isaac Vazquez',
    description: 'Expert fantasy football insights combining data science, analytics, and strategic thinking.',
    type: 'website',
  },
};

export default async function WritingPage() {
  const posts = await getAllBlogPosts();
  
  // Filter for fantasy football content primarily, but show all if no fantasy content
  const fantasyPosts = posts.filter(post => 
    (post.category?.toLowerCase().includes('fantasy')) || 
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes('fantasy')))
  );
  
  // Use fantasy posts if available, otherwise show all posts
  const displayPosts = fantasyPosts.length > 0 ? fantasyPosts : posts;

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Writing", url: "/writing" }
  ];

  // Create structured data for the articles
  const articlesStructuredData = displayPosts.slice(0, 5).map(post => ({
    headline: post.title,
    description: post.excerpt,
    author: {
      name: post.author || 'Isaac Vazquez',
      url: 'https://isaacavazquez.com'
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    keywords: post.tags,
    articleSection: post.category,
    wordCount: Math.ceil(post.content.length / 6), // Rough word count estimate
    url: `https://isaacavazquez.com/writing/${post.slug}`
  }));

  return (
    <>
      {/* Breadcrumb Structured Data */}
      <StructuredData 
        type="BreadcrumbList" 
        data={{ items: (generateBreadcrumbStructuredData(breadcrumbs) as any).itemListElement }}
      />
      
      {/* Articles Structured Data */}
      {articlesStructuredData.map((article, index) => (
        <StructuredData
          key={index}
          type="Article"
          data={article}
        />
      ))}

      <div className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {displayPosts.length > 0 ? (
            <FantasyContentGrid posts={displayPosts} />
          ) : (
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold text-white mb-4">Writing</h1>
              <p className="text-lg text-slate-400">
                Articles coming soon! Check back for fantasy football insights and analytics.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}