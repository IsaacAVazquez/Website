import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  BLOG_ARCHIVE_BUCKET_ORDER,
  BLOG_CLUSTER_ORDER,
  HOMEPAGE_PROOF_OF_WORK_SLUGS,
  getBlogCoverImageUrl,
  type BlogArchiveBucket,
  type BlogCluster,
  type BlogPostCTA,
} from "./blog-config";

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
  wordCount: number;
  author: string;
  coverImage: string;
  cluster?: BlogCluster;
  archiveBucket?: BlogArchiveBucket;
  cta?: BlogPostCTA;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface BlogPostPreview {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  featured: boolean;
  readingTime: string;
  wordCount: number;
  author: string;
  coverImage: string;
  cluster?: BlogCluster;
  archiveBucket?: BlogArchiveBucket;
  cta?: BlogPostCTA;
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
  coverImage?: string;
  cluster?: BlogCluster;
  archiveBucket?: BlogArchiveBucket;
  cta?: BlogPostCTA;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

const postsDirectory = path.join(process.cwd(), "content/blog");

function ensureBlogDirectory() {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
  }
}

function calculateWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const minutes = Math.ceil(calculateWordCount(content) / wordsPerMinute);
  return `${minutes} min read`;
}

function compareBlogEntriesByPublishedDateDesc<
  T extends { publishedAt: string; slug: string }
>(a: T, b: T): number {
  const dateDifference =
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

  if (dateDifference !== 0) {
    return dateDifference;
  }

  return a.slug.localeCompare(b.slug);
}

function resolveBlogPostPath(slug: string): string | null {
  const fullPath = path.join(postsDirectory, `${slug}.mdx`);
  const fallbackPath = path.join(postsDirectory, `${slug}.md`);

  if (fs.existsSync(fullPath)) {
    return fullPath;
  }

  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  return null;
}

function readBlogPostSource(slug: string): {
  metadata: BlogPostMetadata;
  content: string;
} | null {
  const filePath = resolveBlogPostPath(slug);

  if (!filePath) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    metadata: data as BlogPostMetadata,
    content,
  };
}

async function renderBlogPostHtml(content: string): Promise<string> {
  const [{ remark }, { default: remarkGfm }, { default: remarkHtml }] =
    await Promise.all([
      import("remark"),
      import("remark-gfm"),
      import("remark-html"),
    ]);

  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkHtml)
    .process(content);

  return processedContent.toString();
}

function buildBlogPostPreview(
  slug: string,
  metadata: BlogPostMetadata,
  content: string
): BlogPostPreview {
  return {
    slug,
    title: metadata.title,
    excerpt: metadata.excerpt,
    publishedAt: metadata.publishedAt,
    updatedAt: metadata.updatedAt,
    category: metadata.category,
    tags: metadata.tags || [],
    featured: metadata.featured || false,
    readingTime: calculateReadingTime(content),
    wordCount: calculateWordCount(content),
    author: metadata.author || "Isaac Vazquez",
    coverImage: getBlogCoverImageUrl(slug, metadata.coverImage),
    cluster: metadata.cluster,
    archiveBucket: metadata.archiveBucket,
    cta: metadata.cta,
  };
}

export function getBlogPostSlugs(): string[] {
  ensureBlogDirectory();

  try {
    const files = fs.readdirSync(postsDirectory);
    return files
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
      .map((file) => file.replace(/\.(mdx|md)$/, ""));
  } catch (error) {
    console.warn("Blog directory not found or empty:", error);
    return [];
  }
}

export function getBlogPostPreviewBySlug(slug: string): BlogPostPreview | null {
  try {
    const source = readBlogPostSource(slug);

    if (!source) {
      return null;
    }

    return buildBlogPostPreview(slug, source.metadata, source.content);
  } catch (error) {
    console.error(`Error reading blog post preview ${slug}:`, error);
    return null;
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  ensureBlogDirectory();

  try {
    const source = readBlogPostSource(slug);

    if (!source) {
      return null;
    }

    const { metadata, content } = source;

    return {
      slug,
      title: metadata.title,
      excerpt: metadata.excerpt,
      content: await renderBlogPostHtml(content),
      publishedAt: metadata.publishedAt,
      updatedAt: metadata.updatedAt,
      category: metadata.category,
      tags: metadata.tags || [],
      featured: metadata.featured || false,
      readingTime: calculateReadingTime(content),
      wordCount: calculateWordCount(content),
      author: metadata.author || "Isaac Vazquez",
      coverImage: getBlogCoverImageUrl(slug, metadata.coverImage),
      cluster: metadata.cluster,
      archiveBucket: metadata.archiveBucket,
      cta: metadata.cta,
      seo: metadata.seo,
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

export function getAllBlogPostPreviews(): BlogPostPreview[] {
  const slugs = getBlogPostSlugs();
  const previews: BlogPostPreview[] = [];

  for (const slug of slugs) {
    const preview = getBlogPostPreviewBySlug(slug);
    if (preview) {
      previews.push(preview);
    }
  }

  return previews.sort(compareBlogEntriesByPublishedDateDesc);
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const slugs = getBlogPostSlugs();
  const posts: BlogPost[] = [];

  for (const slug of slugs) {
    const post = await getBlogPostBySlug(slug);
    if (post) {
      posts.push(post);
    }
  }

  return posts.sort(compareBlogEntriesByPublishedDateDesc);
}

export function getLatestBlogPostPreviews(limit = 3): BlogPostPreview[] {
  return getAllBlogPostPreviews().slice(0, limit);
}

export function getHomepageProofOfWorkBlogPostPreviews(): BlogPostPreview[] {
  return HOMEPAGE_PROOF_OF_WORK_SLUGS.flatMap((slug) => {
    const preview = getBlogPostPreviewBySlug(slug);
    return preview ? [preview] : [];
  });
}

export function getCuratedBlogPostPreviewsByCluster(): Record<
  BlogCluster,
  BlogPostPreview[]
> {
  const previews = getAllBlogPostPreviews();

  return BLOG_CLUSTER_ORDER.reduce((acc, cluster) => {
    acc[cluster] = previews.filter((post) => post.cluster === cluster);
    return acc;
  }, {} as Record<BlogCluster, BlogPostPreview[]>);
}

export function getArchiveBlogPostPreviews(): BlogPostPreview[] {
  return getAllBlogPostPreviews().filter((post) => !post.cluster);
}

export function getArchiveBlogPostPreviewsByBucket(): Record<
  BlogArchiveBucket,
  BlogPostPreview[]
> {
  const archivePosts = getArchiveBlogPostPreviews();

  return BLOG_ARCHIVE_BUCKET_ORDER.reduce((acc, bucket) => {
    acc[bucket] = archivePosts
      .filter((post) => post.archiveBucket === bucket)
      .sort(compareBlogEntriesByPublishedDateDesc);
    return acc;
  }, {} as Record<BlogArchiveBucket, BlogPostPreview[]>);
}

export async function getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  );
}

export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter((post) =>
    post.tags.some((postTag) => postTag.toLowerCase() === tag.toLowerCase())
  );
}

export async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter((post) => post.featured);
}

export async function getRelatedBlogPosts(
  slug: string,
  limit = 3
): Promise<BlogPost[]> {
  const currentPost = await getBlogPostBySlug(slug);
  if (!currentPost) return [];

  const allPosts = await getAllBlogPosts();
  const otherPosts = allPosts.filter((post) => post.slug !== slug);

  const scoredPosts = otherPosts.map((post) => {
    let score = 0;

    if (post.category === currentPost.category) {
      score += 10;
    }

    if (post.cluster && currentPost.cluster && post.cluster === currentPost.cluster) {
      score += 12;
    }

    if (
      post.archiveBucket &&
      currentPost.archiveBucket &&
      post.archiveBucket === currentPost.archiveBucket
    ) {
      score += 8;
    }

    const sharedTags = post.tags.filter((tag) => currentPost.tags.includes(tag));
    score += sharedTags.length * 5;

    return { post, score };
  });

  const stronglyRelated = scoredPosts
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return compareBlogEntriesByPublishedDateDesc(a.post, b.post);
    })
    .map((item) => item.post);

  if (stronglyRelated.length >= limit) {
    return stronglyRelated.slice(0, limit);
  }

  const fallbackPosts = otherPosts
    .filter((post) => !stronglyRelated.some((relatedPost) => relatedPost.slug === post.slug))
    .sort(compareBlogEntriesByPublishedDateDesc);

  return [...stronglyRelated, ...fallbackPosts].slice(0, limit);
}

export async function getAllCategories(): Promise<string[]> {
  const allPosts = await getAllBlogPosts();
  const categories = Array.from(new Set(allPosts.map((post) => post.category)));
  return categories.sort();
}

export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllBlogPosts();
  const tags = Array.from(new Set(allPosts.flatMap((post) => post.tags)));
  return tags.sort();
}

export async function searchBlogPosts(query: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  const searchTerm = query.toLowerCase();

  return allPosts.filter((post) => {
    return (
      post.title.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm) ||
      post.content.toLowerCase().includes(searchTerm) ||
      post.category.toLowerCase().includes(searchTerm) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  });
}
