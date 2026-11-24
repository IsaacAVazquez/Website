// Mock filesystem and markdown processing before any imports
jest.mock('fs');
jest.mock('gray-matter');
jest.mock('remark', () => ({
  remark: jest.fn(() => ({
    use: jest.fn().mockReturnThis(),
    process: jest.fn().mockResolvedValue({ toString: () => '<p>Processed content</p>' }),
  })),
}));
jest.mock('remark-gfm', () => jest.fn());
jest.mock('remark-rehype', () => jest.fn());
jest.mock('rehype-sanitize', () => jest.fn());
jest.mock('rehype-stringify', () => jest.fn());

import fs from 'fs';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import {
  getBlogPostSlugs,
  getBlogPostBySlug,
  getBlogFeedEntries,
  getAllBlogPostPreviews,
  getBlogPostSearchEntries,
  getRelatedBlogPosts,
  getArchiveBlogPostPreviews,
  getCuratedBlogPostPreviewsByCluster,
  getHomepageProofOfWorkBlogPostPreviews,
  isBlogPostPublished,
  newestBlogPostDate,
  BlogPost,
} from '../blog';
import { HOMEPAGE_PROOF_OF_WORK_SLUGS } from '../blog-config';

const mockFs = fs as jest.Mocked<typeof fs>;
const mockMatter = matter as unknown as jest.Mock;
const mockRemark = remark as unknown as jest.Mock;
const mockRemarkGfm = remarkGfm as unknown as jest.Mock;
const mockRemarkRehype = remarkRehype as unknown as jest.Mock;
const mockRehypeSanitize = rehypeSanitize as unknown as jest.Mock;
const mockRehypeStringify = rehypeStringify as unknown as jest.Mock;

function makeFrontmatter(overrides: Partial<BlogPost> = {}) {
  return {
    title: 'Test Post',
    excerpt: 'A test excerpt',
    publishedAt: '2024-01-15',
    category: 'Technology',
    tags: ['javascript', 'testing'],
    ...overrides,
  };
}

function setupMockFile(
  slug: string,
  frontmatter: Partial<ReturnType<typeof makeFrontmatter>>,
  content = 'Hello world content',
) {
  mockMatter.mockReturnValue({ data: frontmatter, content });
}

describe('getBlogPostSearchEntries', () => {
  it('indexes readable body text and omits scheduled articles', () => {
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readdirSync = jest.fn().mockReturnValue(['published.mdx', 'scheduled.mdx']);
    mockFs.readFileSync = jest.fn().mockReturnValue('source');
    mockMatter
      .mockReturnValueOnce({ data: makeFrontmatter(), content: '# Heading\nBody-only photosynthesis and [plant growth](https://example.com/hidden-url).' })
      .mockReturnValueOnce({ data: makeFrontmatter({ publishedAt: '2999-01-01' }), content: 'Unpublished' });
    const entries = getBlogPostSearchEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].searchText).toContain('Body-only photosynthesis and plant growth');
    expect(entries[0].searchText).not.toContain('hidden-url');
  });

  it('skips a post that fails to read and keeps the rest', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readdirSync = jest.fn().mockReturnValue(['broken.mdx', 'published.mdx']);
    mockFs.readFileSync = jest.fn().mockReturnValue('source');
    mockMatter
      .mockImplementationOnce(() => { throw new Error('bad frontmatter'); })
      .mockReturnValueOnce({ data: makeFrontmatter(), content: 'Body' });
    expect(getBlogPostSearchEntries().map((entry) => entry.slug)).toEqual(['published']);
    consoleSpy.mockRestore();
  });
});

describe('getBlogPostSlugs', () => {
  beforeEach(() => {
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readdirSync = jest.fn().mockReturnValue([]);
  });

  it('returns empty array when directory is empty', () => {
    (mockFs.readdirSync as jest.Mock).mockReturnValue([]);
    expect(getBlogPostSlugs()).toEqual([]);
  });

  it('filters to .mdx files only', () => {
    (mockFs.readdirSync as jest.Mock).mockReturnValue([
      'post-one.mdx',
      'post-two.md',
      'image.png',
      'README.txt',
    ]);
    expect(getBlogPostSlugs()).toEqual(['post-one']);
  });

  it('strips the extension from filenames', () => {
    (mockFs.readdirSync as jest.Mock).mockReturnValue(['my-great-post.mdx']);
    expect(getBlogPostSlugs()).toEqual(['my-great-post']);
  });

  it('returns empty array when readdirSync throws', () => {
    (mockFs.readdirSync as jest.Mock).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    expect(getBlogPostSlugs()).toEqual([]);
  });
});

describe('getBlogPostBySlug', () => {
  beforeEach(() => {
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue('raw file content');
    setupMockFile('test-post', makeFrontmatter());
  });

  it('returns null when the .mdx file does not exist', async () => {
    (mockFs.existsSync as jest.Mock).mockReturnValue(false);
    const result = await getBlogPostBySlug('nonexistent');
    expect(result).toBeNull();
  });

  it('returns a BlogPost when the .mdx file exists', async () => {
    const result = await getBlogPostBySlug('test-post');
    expect(result).not.toBeNull();
    expect(result!.slug).toBe('test-post');
  });

  it('populates all required BlogPost fields', async () => {
    const fm = makeFrontmatter({
      title: 'My Article',
      excerpt: 'Summary here',
      publishedAt: '2024-06-01',
      category: 'Product',
      tags: ['pm', 'strategy'],
    });
    setupMockFile('my-article', fm, 'Some body text with more than 200 words' + ' word'.repeat(200));
    const result = await getBlogPostBySlug('my-article');

    expect(result!.title).toBe('My Article');
    expect(result!.excerpt).toBe('Summary here');
    expect(result!.publishedAt).toBe('2024-06-01');
    expect(result!.category).toBe('Product');
    expect(result!.tags).toEqual(['pm', 'strategy']);
    expect(result!.readingTime).toMatch(/\d+ min read/);
    expect(result!.wordCount).toBeGreaterThan(200);
    expect(result!.coverImage).toBe('/writing/my-article/opengraph-image');
    expect(result!.content).toBeTruthy();
  });

  it('returns null when readFileSync throws', async () => {
    (mockFs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('permission denied');
    });
    const result = await getBlogPostBySlug('broken');
    expect(result).toBeNull();
  });

  it('renders markdown through the configured remark plugins', async () => {
    mockRemark.mockClear();

    await getBlogPostBySlug('test-post');
    const processor = mockRemark.mock.results.at(-1)?.value;

    expect(processor.use).toHaveBeenNthCalledWith(1, mockRemarkGfm);
    expect(processor.use).toHaveBeenNthCalledWith(2, mockRemarkRehype);
    expect(processor.use).toHaveBeenNthCalledWith(3, mockRehypeSanitize);
    expect(processor.use).toHaveBeenNthCalledWith(4, mockRehypeStringify);
  });
});

// ─── Reading time calculation (tested indirectly) ──────────────────────────

describe('reading time calculation (via getBlogPostBySlug)', () => {
  beforeEach(() => {
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    mockFs.readFileSync = jest.fn().mockReturnValue('raw content');
  });

  it('returns "1 min read" for short content', async () => {
    setupMockFile('short', makeFrontmatter(), 'Short content');
    const result = await getBlogPostBySlug('short');
    expect(result!.readingTime).toBe('1 min read');
  });

  it('returns higher minutes for longer content', async () => {
    const longContent = 'word '.repeat(500); // 500 words ÷ 200 wpm = 3 min
    setupMockFile('long', makeFrontmatter(), longContent);
    const result = await getBlogPostBySlug('long');
    expect(result!.readingTime).toBe('3 min read');
  });
});

// ─── Aggregation helpers exercised through the real exported functions ─────
// The fs/matter mocks stand in for the content directory, so the listing
// readers and their consumers run for real.

describe('aggregation helpers (real functions)', () => {
  type FixturePost = {
    frontmatter: ReturnType<typeof makeFrontmatter>;
    content?: string;
  };

  function setupPosts(postsBySlug: Record<string, FixturePost>): void {
    const slugs = Object.keys(postsBySlug);
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    (mockFs.readdirSync as jest.Mock).mockReturnValue(
      slugs.map((slug) => `${slug}.mdx`)
    );
    // Return the resolved path so the matter mock can recover the slug from it.
    (mockFs.readFileSync as jest.Mock).mockImplementation((filePath: string) =>
      String(filePath)
    );
    mockMatter.mockImplementation((raw: string) => {
      const slug = slugs.find((candidate) =>
        String(raw).includes(`${candidate}.mdx`)
      );
      const post = slug ? postsBySlug[slug] : undefined;
      return {
        data: post?.frontmatter ?? {},
        content: post?.content ?? 'body content',
      };
    });
  }

  const FIXTURE: Record<string, FixturePost> = {
    'tech-a': {
      frontmatter: makeFrontmatter({
        title: 'Testing at Scale',
        category: 'Tech',
        tags: ['js', 'node'],
        publishedAt: '2024-03-01',
      }),
      content: 'alpha content',
    },
    'tech-b': {
      frontmatter: makeFrontmatter({
        title: 'React Patterns',
        category: 'Tech',
        tags: ['js', 'react'],
        publishedAt: '2024-02-01',
      }),
      content: 'beta content',
    },
    'product-c': {
      frontmatter: makeFrontmatter({
        title: 'Roadmapping',
        category: 'Product',
        tags: ['pm', 'strategy'],
        publishedAt: '2024-01-01',
      }),
      content: 'gamma content',
    },
  };

  beforeEach(() => {
    setupPosts(FIXTURE);
  });

  it('getAllBlogPostPreviews returns published previews sorted newest first', () => {
    const previews = getAllBlogPostPreviews();
    expect(previews.map((p) => p.slug)).toEqual(['tech-a', 'tech-b', 'product-c']);
  });

  it('excludes future-dated posts from listings', () => {
    setupPosts({
      published: {
        frontmatter: makeFrontmatter({ title: 'Now', publishedAt: '2024-01-01' }),
      },
      future: {
        frontmatter: makeFrontmatter({ title: 'Later', publishedAt: '2999-01-01' }),
      },
    });
    const previews = getAllBlogPostPreviews();
    expect(previews.map((p) => p.slug)).toEqual(['published']);
  });

  it('getBlogFeedEntries sorts every published post and carries its seo block', () => {
    setupPosts({
      ...FIXTURE,
      'tech-a': {
        frontmatter: { ...FIXTURE['tech-a'].frontmatter, seo: { description: 'Feed line' } },
      },
    });
    const all = getBlogFeedEntries();
    expect(all.map((p) => p.slug)).toEqual(['tech-a', 'tech-b', 'product-c']);
    expect(all[0].seo).toEqual({ description: 'Feed line' });
    expect(all[0]).not.toHaveProperty('content');
  });

  // Next decodes %2F in the [slug] param, so a traversal slug arrives as a path.
  it.each(['../../AGENTS', 'a/b', '..', 'Post', 'post.mdx', ''])(
    'rejects the slug %p without touching the filesystem',
    async (slug) => {
      (mockFs.readFileSync as jest.Mock).mockClear();
      expect(await getBlogPostBySlug(slug)).toBeNull();
      expect(await getRelatedBlogPosts(slug)).toEqual([]);
      // Only the content directory itself may be probed, never a post path.
      expect(
        (mockFs.existsSync as jest.Mock).mock.calls.filter(([file]) => /\.mdx?$/.test(String(file)))
      ).toEqual([]);
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    }
  );

  it('getRelatedBlogPosts ranks same-category, shared-tag posts first', async () => {
    const related = await getRelatedBlogPosts('tech-a', 2);
    expect(related[0].slug).toBe('tech-b'); // Tech + shared 'js'
    expect(related).toHaveLength(2);
    expect(related.some((p) => p.slug === 'tech-a')).toBe(false);
  });

  // Scoring reads category, cluster, bucket, tags, and date, all of which are
  // frontmatter. Rendering every post to HTML for it ran the markdown
  // pipeline over the whole archive once per article page.
  it('getRelatedBlogPosts renders no markdown', async () => {
    mockRemark.mockClear();
    const related = await getRelatedBlogPosts('tech-a', 2);
    expect(related).toHaveLength(2);
    expect(mockRemark).not.toHaveBeenCalled();
  });

  it('getRelatedBlogPosts returns [] for an unknown slug', async () => {
    setupPosts({});
    expect(await getRelatedBlogPosts('missing')).toEqual([]);
  });

  it('getArchiveBlogPostPreviews returns posts without a cluster', () => {
    const archive = getArchiveBlogPostPreviews();
    expect(archive).toHaveLength(3);
  });

  it('getCuratedBlogPostPreviewsByCluster returns a keyed record', () => {
    const byCluster = getCuratedBlogPostPreviewsByCluster();
    // No fixture post declares a cluster, so every bucket is empty but present.
    for (const value of Object.values(byCluster)) {
      expect(Array.isArray(value)).toBe(true);
    }
  });

  it('drops posts with invalid frontmatter instead of throwing', () => {
    setupPosts({
      valid: {
        frontmatter: makeFrontmatter({ title: 'Valid', publishedAt: '2024-01-01' }),
      },
      broken: {
        // Missing required title -> assertValidFrontmatter throws -> preview null.
        frontmatter: makeFrontmatter({ title: '', publishedAt: '2024-01-01' }),
      },
    });
    const previews = getAllBlogPostPreviews();
    expect(previews.map((p) => p.slug)).toEqual(['valid']);
  });
});

describe('getHomepageProofOfWorkBlogPostPreviews', () => {
  it('holds a pinned post back until its publish date', () => {
    const [published, scheduled] = HOMEPAGE_PROOF_OF_WORK_SLUGS;
    mockFs.existsSync = jest.fn().mockReturnValue(true);
    (mockFs.readFileSync as jest.Mock).mockImplementation((filePath: string) =>
      String(filePath)
    );
    mockMatter.mockImplementation((raw: string) => ({
      data: makeFrontmatter({
        publishedAt: String(raw).includes(scheduled) ? '2999-01-01' : '2024-01-01',
      }),
      content: 'body',
    }));

    expect(getHomepageProofOfWorkBlogPostPreviews().map((post) => post.slug)).toEqual([
      published,
    ]);
  });
});

describe('newestBlogPostDate', () => {
  it('takes the latest update or publish date, and nothing from an empty list', () => {
    expect(
      newestBlogPostDate([
        { publishedAt: '2026-06-13' },
        { publishedAt: '2026-01-02', updatedAt: '2026-10-23' },
        { publishedAt: '2026-09-25' },
      ])
    ).toBe('2026-10-23');
    expect(newestBlogPostDate([])).toBeUndefined();
  });
});

describe('isBlogPostPublished', () => {
  it('is true when the publish date has arrived and false when it is future', () => {
    expect(isBlogPostPublished({ publishedAt: '2024-01-01' }, '2024-06-01')).toBe(
      true
    );
    expect(isBlogPostPublished({ publishedAt: '2999-01-01' }, '2024-06-01')).toBe(
      false
    );
    // Same-day counts as published.
    expect(isBlogPostPublished({ publishedAt: '2024-06-01' }, '2024-06-01')).toBe(
      true
    );
  });
});
