# Content Structure Map - Isaac Vazquez Digital Platform

**Last Updated:** October 29, 2025
**Content System:** MDX with Gray Matter
**Blog Posts:** 16 published articles

---

## Table of Contents

- [Content Architecture](#content-architecture)
- [Blog System](#blog-system)
- [Writing Portfolio](#writing-portfolio)
- [Content Processing Pipeline](#content-processing-pipeline)
- [SEO & Metadata](#seo--metadata)
- [Content Categories](#content-categories)
- [Quick Reference](#quick-reference)

---

## Content Architecture

### Content Organization

```
content/
├── blog/                          # Main blog (16 posts)
│   ├── fantasy-football/          # Fantasy sports content
│   ├── qa-engineering/            # QA and testing articles
│   ├── software-development/      # Development topics
│   └── ai-technology/             # AI and emerging tech
│
├── writing/                       # Writing portfolio (16 pieces)
│   └── [Same structure as blog]
│
└── [Future sections]
    ├── case-studies/              # Planned
    ├── tutorials/                 # Planned
    └── documentation/             # Planned
```

### Content Types

| Type | Location | Format | Purpose |
|------|----------|--------|---------|
| Blog Posts | `content/blog/*.mdx` | MDX | Technical articles and insights |
| Writing Portfolio | `content/writing/*.mdx` | MDX | Professional writing samples |
| Page Content | `src/app/*/page.tsx` | TSX | Static page content |
| Documentation | `docs/*.md` | Markdown | Technical documentation |

---

## Blog System

### Blog Post Inventory

**Location:** `content/blog/`

#### Fantasy Football Content (6 posts)

| File | Title | Focus |
|------|-------|-------|
| `2025-fantasy-football-draft-strategy.mdx` | 2025 Fantasy Football Draft Strategy | Current season draft guide |
| `fantasy-football-beginners-complete-guide.mdx` | Fantasy Football: Complete Beginner's Guide | Introduction to fantasy football |
| `mastering-fantasy-football-analytics.mdx` | Mastering Fantasy Football Analytics | Advanced analytics techniques |
| `understanding-fantasy-football-analytics.mdx` | Understanding Fantasy Football Analytics | Analytics fundamentals |
| `rb-vs-wr-draft-strategy-modeling-positional-value.mdx` | RB vs WR Draft Strategy | Positional value analysis |
| `waiver-wire-mastery-hidden-gems.mdx` | Waiver Wire Mastery | Finding hidden gem players |

#### QA Engineering & Software Testing (5 posts)

| File | Title | Focus |
|------|-------|-------|
| `complete-guide-qa-engineering.mdx` | Complete Guide to QA Engineering | Comprehensive QA overview |
| `building-reliable-software-systems.mdx` | Building Reliable Software Systems | System reliability |
| `getting-started-with-automated-testing.mdx` | Getting Started with Automated Testing | Test automation basics |
| `qa-engineering-silicon-valley-uc-berkeley-mba-perspective.mdx` | QA Engineering: Silicon Valley & UC Berkeley MBA | Career perspective |
| `qa-engineer-guide-testing-ai-systems.mdx` | QA Engineer's Guide to Testing AI Systems | AI testing strategies |

#### AI & Emerging Technology (3 posts)

| File | Title | Focus |
|------|-------|-------|
| `ai-in-software-testing-future-of-qa.mdx` | AI in Software Testing: Future of QA | AI-powered testing |
| `cybersecurity-in-age-of-ai-software-engineer-perspective.mdx` | Cybersecurity in the Age of AI | AI security considerations |
| `evolution-software-architecture-monoliths-ai-native-systems.mdx` | Evolution of Software Architecture | Modern architecture patterns |

#### Software Development & Product Management (2 posts)

| File | Title | Focus |
|------|-------|-------|
| `building-ai-powered-analytics-fantasy-football-to-enterprise.mdx` | Building AI-Powered Analytics | Analytics platform development |
| `low-code-no-code-vs-traditional-development-when-to-choose.mdx` | Low-Code/No-Code vs Traditional Development | Development approach comparison |

### Blog Post Structure

**MDX Format with Frontmatter:**

```mdx
---
title: "Article Title"
description: "Brief description for SEO and previews"
date: "2025-10-15"
category: "qa-engineering" | "fantasy-football" | "ai-technology" | "software-development"
tags: ["tag1", "tag2", "tag3"]
author: "Isaac Vazquez"
featured: true | false
image: "/images/blog/article-slug.jpg"
readingTime: "8 min read"
seo:
  metaTitle: "SEO optimized title"
  metaDescription: "SEO description"
  keywords: ["keyword1", "keyword2"]
  canonicalUrl: "/blog/article-slug"
---

# Article Title

Introduction paragraph...

## Section Heading

Content with **bold**, *italic*, `code`, and [links](url).

### Subsection

- Bullet points
- More points

```typescript
// Code blocks with syntax highlighting
const example = "code";
```

> Blockquotes for important notes

## Conclusion

Wrap-up content...
```

### Blog Frontmatter Schema

```typescript
interface BlogFrontmatter {
  // Required fields
  title: string;
  description: string;
  date: string;              // YYYY-MM-DD format
  category: BlogCategory;

  // Optional fields
  tags?: string[];
  author?: string;           // Default: "Isaac Vazquez"
  featured?: boolean;
  image?: string;
  readingTime?: string;

  // SEO fields
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
    ogImage?: string;
    twitterCard?: 'summary' | 'summary_large_image';
  };

  // Advanced fields
  relatedPosts?: string[];   // Slugs of related posts
  updatedDate?: string;      // Last update date
  draft?: boolean;           // Don't publish if true
  series?: {                 // Part of a series
    name: string;
    part: number;
  };
}

type BlogCategory =
  | 'qa-engineering'
  | 'fantasy-football'
  | 'ai-technology'
  | 'software-development'
  | 'product-management'
  | 'career-advice';
```

---

## Writing Portfolio

### Writing Section

**Location:** `content/writing/`

The writing portfolio mirrors the blog structure but serves as a curated collection of best work:

```
content/writing/
├── [Same 16 posts as blog]
└── Purpose: Professional writing showcase
```

**Differences from Blog:**
- More polished, production-ready content
- Featured in resume/portfolio presentations
- Curated selection of best articles
- Same technical content, different presentation context

### Writing Display

**Pages:**
- `/writing` - Writing portfolio grid
- `/writing/[slug]` - Individual writing pieces

**Components:**
- Similar to blog system
- Enhanced presentation styling
- Portfolio-focused metadata

---

## Content Processing Pipeline

### MDX Processing Stack

```
MDX File (content/blog/*.mdx)
        ↓
Gray Matter (frontmatter extraction)
        ↓
Remark (Markdown processing)
├── remark-gfm (GitHub Flavored Markdown)
├── Syntax highlighting
├── Table of contents generation
└── Link processing
        ↓
React Components (MDX compilation)
├── Custom components (Heading, Code, etc.)
├── Interactive elements
└── Image optimization
        ↓
HTML Output (rendered page)
```

### Content Processing Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| `gray-matter` | 4.0.3 | Frontmatter extraction |
| `remark` | 15.0.1 | Markdown AST processing |
| `remark-gfm` | 4.0.1 | GitHub Flavored Markdown (tables, task lists) |
| `remark-html` | 16.0.1 | HTML rendering |

### Blog Utility Functions

**File:** `src/lib/blog.ts`

```typescript
Blog Utilities:
├── getAllBlogPosts()              // Get all blog posts with frontmatter
├── getBlogPostBySlug(slug)        // Get single post
├── getBlogPostsByCategory(cat)    // Filter by category
├── getFeaturedBlogPosts()         // Get featured posts
├── getRelatedPosts(slug)          // Get related content
├── generateTableOfContents(content) // TOC from headings
├── calculateReadingTime(content)  // Estimate reading time
└── parseMDX(content)              // Parse MDX to React components
```

### Custom MDX Components

**Components available in MDX:**

```typescript
Custom MDX Components:
├── Heading ({ level, children })         // Styled headings with anchor links
├── Paragraph ({ children })              // Styled paragraphs
├── Code ({ language, children })         // Syntax-highlighted code blocks
├── InlineCode ({ children })             // Inline code styling
├── Link ({ href, children })             // Styled links with external icons
├── Blockquote ({ children })             // Styled quotes
├── List ({ ordered, children })          // Styled lists
├── Table ({ children })                  // Responsive tables
├── Image ({ src, alt, caption })         // Optimized images with captions
├── GlassCard ({ children })              // Glassmorphism containers
├── Badge ({ variant, children })         // Category/tag badges
└── Highlight ({ children })              // Text highlighting
```

---

## SEO & Metadata

### SEO Implementation

**File:** `src/lib/seo.ts`

```typescript
SEO Functions:
├── constructMetadata(options)      // Generate Next.js metadata
├── generateBlogPostMetadata(post)  // Blog-specific metadata
├── generateStructuredData(post)    // JSON-LD structured data
├── generateBreadcrumbs(path)       // Breadcrumb navigation
└── generateSitemap()               // XML sitemap generation
```

### Blog Post SEO

Each blog post includes:

```typescript
SEO Elements:
├── Meta Tags
│   ├── <title> - Optimized title
│   ├── <meta name="description"> - Description
│   ├── <meta name="keywords"> - Keywords
│   └── <link rel="canonical"> - Canonical URL
│
├── OpenGraph Tags
│   ├── og:title
│   ├── og:description
│   ├── og:image
│   ├── og:type (article)
│   ├── og:url
│   └── article:published_time
│
├── Twitter Cards
│   ├── twitter:card
│   ├── twitter:title
│   ├── twitter:description
│   └── twitter:image
│
└── Structured Data (JSON-LD)
    ├── @type: BlogPosting
    ├── headline
    ├── description
    ├── author
    ├── datePublished
    ├── dateModified
    ├── image
    └── publisher
```

### Sitemap Generation

**Configuration:** `next-sitemap.config.js`

```javascript
Sitemap Settings:
├── generateRobotsTxt: true
├── sitemapSize: 5000
├── changefreq: 'daily' (blog), 'weekly' (static)
├── priority: 0.9 (blog), 0.7 (pages)
├── exclude: ['/admin/*', '/api/*']
└── output: public/sitemap.xml
```

**Blog URLs in Sitemap:**
```xml
/blog                    (priority: 0.9, changefreq: daily)
/blog/[slug]             (priority: 0.8, changefreq: weekly)
/writing                 (priority: 0.9, changefreq: daily)
/writing/[slug]          (priority: 0.8, changefreq: weekly)
```

---

## Content Categories

### Category Breakdown

| Category | Posts | Focus Area |
|----------|-------|------------|
| Fantasy Football | 6 | Sports analytics, draft strategy, player analysis |
| QA Engineering | 5 | Software testing, quality assurance, automation |
| AI Technology | 3 | Artificial intelligence, machine learning, emerging tech |
| Software Development | 2 | Development practices, architecture, tools |
| Product Management | 0* | *Planned category |
| Career Advice | 0* | *Planned category |

### Tag System

**Common Tags:**
```
Technical:
├── qa-engineering
├── automated-testing
├── software-quality
├── ai-testing
├── machine-learning
├── data-analytics
└── software-architecture

Fantasy Football:
├── draft-strategy
├── player-rankings
├── waiver-wire
├── analytics
├── tiers
└── projections

Career:
├── mba
├── silicon-valley
├── career-development
└── product-management
```

### Content Filtering

**Blog Page Features:**
- Filter by category
- Filter by tags
- Search by title/content
- Sort by date (newest/oldest)
- Sort by reading time
- Featured posts section

---

## Content Display Components

### Blog Components

| Component | File | Purpose |
|-----------|------|---------|
| `BlogFilter` | `src/components/blog/BlogFilter.tsx` | Category/tag filtering UI |
| `Prose` | `src/components/Prose.tsx` | Styled prose container for MDX |
| `Highlight` | `src/components/Highlight.tsx` | Text highlighting |
| `RelatedContent` | `src/components/ui/RelatedContent.tsx` | Related posts suggestions |

### Blog Page Layouts

**Pages:**
- `/blog` - Blog listing with filtering
- `/blog/[slug]` - Individual blog post
- `/writing` - Writing portfolio listing
- `/writing/[slug]` - Individual writing piece

**Layout Features:**
```typescript
Blog Listing Page:
├── Hero section with search
├── Featured posts grid
├── Category filter tabs
├── Tag cloud
├── Post cards with:
│   ├── Featured image
│   ├── Title & description
│   ├── Category badge
│   ├── Reading time
│   ├── Publication date
│   └── Tags
└── Pagination (load more)

Blog Post Page:
├── Hero with featured image
├── Breadcrumbs navigation
├── Title & metadata
├── Table of contents (sticky sidebar)
├── MDX content (custom components)
├── Author bio
├── Related posts
├── Social sharing buttons
└── Comments section (planned)
```

---

## Quick Reference

### Content File Locations

```
Blog Content:
  content/blog/*.mdx           - 16 blog posts

Writing Portfolio:
  content/writing/*.mdx        - 16 writing samples

Documentation:
  docs/*.md                    - Technical docs
  WEBSITE_MAP.md              - This site map
  COMPONENT_MAP.md            - Component inventory
  DATA_ARCHITECTURE_MAP.md    - Data architecture
  TECHNOLOGY_STACK_MAP.md     - Tech stack

Static Pages:
  src/app/*/page.tsx          - Page components
```

### Content Creation Workflow

1. **Create MDX file** in `content/blog/[slug].mdx`
2. **Add frontmatter** with all required fields
3. **Write content** using MDX syntax
4. **Add images** to `/public/images/blog/`
5. **Test locally** at `/blog/[slug]`
6. **Validate SEO** (metadata, structured data)
7. **Commit & deploy** (auto-sitemap generation)

### Common Content Operations

```bash
# Add new blog post
touch content/blog/my-new-post.mdx

# Test blog post rendering
npm run dev
# Visit: http://localhost:3000/blog/my-new-post

# Validate frontmatter
# Use TypeScript type checking in IDE

# Generate sitemap (automatic on build)
npm run build
```

### Blog Post Template

```mdx
---
title: "Your Blog Post Title"
description: "A compelling description that summarizes your post"
date: "2025-10-29"
category: "qa-engineering"
tags: ["testing", "automation", "quality"]
featured: false
image: "/images/blog/post-slug.jpg"
readingTime: "8 min read"
---

# Your Blog Post Title

An engaging introduction that hooks the reader...

## Main Section

Your content here with **formatting**, *emphasis*, and `code`.

### Subsection

More detailed content...

```typescript
// Code examples with syntax highlighting
const example = "Hello World";
```

## Conclusion

Wrap up your key points and call to action...
```

### Content Statistics

| Metric | Value |
|--------|-------|
| Total Blog Posts | 16 |
| Total Writing Samples | 16 |
| Categories | 4 active, 2 planned |
| Average Reading Time | 7-10 minutes |
| Total Words | ~25,000+ |
| Featured Posts | 4-6 |
| Images | 10-15 |

### SEO Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Meta descriptions | 100% | ✓ Complete |
| Structured data | 100% | ✓ Complete |
| Image alt text | 100% | ✓ Complete |
| Canonical URLs | 100% | ✓ Complete |
| Internal linking | 80%+ | In progress |
| External backlinks | Growing | Ongoing |

---

## Future Content Plans

### Planned Categories

1. **Product Management**
   - MBA insights and frameworks
   - Product strategy case studies
   - Building products from idea to launch

2. **Career Advice**
   - Transitioning from QA to product
   - MBA application process
   - Tech career growth strategies

3. **Case Studies**
   - Fantasy Football Platform build
   - Real-world QA implementations
   - Analytics project deep dives

4. **Tutorials**
   - Step-by-step technical guides
   - Tool walkthroughs
   - Framework tutorials

### Content Enhancement Ideas

- **Video Content:** Embed video explanations
- **Interactive Demos:** Live code examples
- **Podcasts:** Audio versions of articles
- **Guest Posts:** Industry expert contributions
- **Series:** Multi-part deep dives
- **Comments:** Community discussion

---

**For routing information, see:** `WEBSITE_MAP.md`
**For component details, see:** `COMPONENT_MAP.md`
**For SEO implementation, see:** `src/lib/seo.ts`
**For blog utilities, see:** `src/lib/blog.ts`
