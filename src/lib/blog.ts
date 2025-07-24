import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import { remark as remarkInstance } from 'remark';
import remarkHtml from 'remark-html';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  featured: boolean;
  readingTime: string;
  author: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface BlogPostMetadata {
  title: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  featured?: boolean;
  author?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

const postsDirectory = path.join(process.cwd(), 'content/blog');

// Ensure the blog directory exists
function ensureBlogDirectory() {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
  }
}

// Calculate reading time based on word count
function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

// Get all blog post slugs
export function getBlogPostSlugs(): string[] {
  ensureBlogDirectory();
  try {
    const files = fs.readdirSync(postsDirectory);
    return files
      .filter(file => file.endsWith('.mdx') || file.endsWith('.md'))
      .map(file => file.replace(/\.(mdx|md)$/, ''));
  } catch (error) {
    console.warn('Blog directory not found or empty:', error);
    return [];
  }
}

// Get blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  ensureBlogDirectory();
  
  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    const fallbackPath = path.join(postsDirectory, `${slug}.md`);
    
    let filePath = fullPath;
    if (!fs.existsSync(fullPath) && fs.existsSync(fallbackPath)) {
      filePath = fallbackPath;
    }
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    
    const metadata = data as BlogPostMetadata;
    
    // Process markdown content
    const processedContent = await remark()
      .use(remarkGfm)
      .process(content);
    
    const readingTime = calculateReadingTime(content);
    
    return {
      slug,
      title: metadata.title,
      excerpt: metadata.excerpt,
      content: processedContent.toString(),
      publishedAt: metadata.publishedAt,
      updatedAt: metadata.updatedAt,
      category: metadata.category,
      tags: metadata.tags || [],
      featured: metadata.featured || false,
      readingTime,
      author: metadata.author || 'Isaac Vazquez',
      seo: metadata.seo,
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

// Get all blog posts
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const slugs = getBlogPostSlugs();
  const posts: BlogPost[] = [];
  
  for (const slug of slugs) {
    const post = await getBlogPostBySlug(slug);
    if (post) {
      posts.push(post);
    }
  }
  
  // Sort posts by published date (newest first)
  return posts.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

// Get blog posts by category
export async function getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => 
    post.category.toLowerCase() === category.toLowerCase()
  );
}

// Get blog posts by tag
export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => 
    post.tags.some(postTag => postTag.toLowerCase() === tag.toLowerCase())
  );
}

// Get featured blog posts
export async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => post.featured);
}

// Get related blog posts based on category and tags
export async function getRelatedBlogPosts(slug: string, limit: number = 3): Promise<BlogPost[]> {
  const currentPost = await getBlogPostBySlug(slug);
  if (!currentPost) return [];
  
  const allPosts = await getAllBlogPosts();
  const otherPosts = allPosts.filter(post => post.slug !== slug);
  
  // Score posts based on category and tag matches
  const scoredPosts = otherPosts.map(post => {
    let score = 0;
    
    // Same category gets high score
    if (post.category === currentPost.category) {
      score += 10;
    }
    
    // Shared tags get points
    const sharedTags = post.tags.filter(tag => 
      currentPost.tags.includes(tag)
    );
    score += sharedTags.length * 5;
    
    return { post, score };
  });
  
  // Sort by score and return top results
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);
}

// Get all categories
export async function getAllCategories(): Promise<string[]> {
  const allPosts = await getAllBlogPosts();
  const categories = Array.from(new Set(allPosts.map(post => post.category)));
  return categories.sort();
}

// Get all tags
export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllBlogPosts();
  const tags = Array.from(new Set(allPosts.flatMap(post => post.tags)));
  return tags.sort();
}

// Search blog posts
export async function searchBlogPosts(query: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  const searchTerm = query.toLowerCase();
  
  return allPosts.filter(post => {
    return (
      post.title.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm) ||
      post.content.toLowerCase().includes(searchTerm) ||
      post.category.toLowerCase().includes(searchTerm) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  });
}