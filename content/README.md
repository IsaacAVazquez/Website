# Isaac Vazquez Website — Markdown Content System

## Overview

This directory contains a complete, modern Markdown file system for Isaac Vazquez's personal website. The content follows a clean, minimal aesthetic with a warm modern design palette and product-focused narrative.

**Design Philosophy:** Modern • Sharp • Polished • Personal • Product-Focused • Founder-Leaning

---

## Directory Structure

```
content/
├── README.md                           # This file
├── theme.md                            # Complete design system documentation
├── index.md                            # Homepage content
├── about.md                            # About page with personal narrative
├── projects.md                         # Projects hub/listing page
├── contact.md                          # Contact page
│
├── projects/
│   ├── project-template.md             # Template for individual projects
│   └── textout-platform.md             # Example project case study
│
├── blog-new/
│   ├── index.md                        # Blog landing page
│   └── post-template.md                # Template for blog posts
│
└── components/
    ├── hero.md                         # Hero section component guide
    ├── project-card.md                 # Project card component guide
    ├── footer.md                       # Footer component guide
    ├── navbar.md                       # Navigation bar component guide
    └── section-header.md               # Section header component guide
```

---

## File Descriptions

### Core Pages

#### `theme.md`
Complete design system documentation including:
- Color palette (sunset orange, golden yellow, warm neutrals)
- Typography scale (Inter font family, display to body sizes)
- Spacing system (XS to 4XL scale)
- Component guidelines (cards, buttons, badges)
- Layout system (grid, breakpoints, max widths)
- Shadows and animations
- YAML front matter structure
- Best practices and conventions

**Purpose:** Single source of truth for all design decisions and styling

---

#### `index.md`
Homepage content featuring:
- Hero section with name, tagline, and value proposition
- "What I Do" summary
- Featured projects (TextOut, RunningMate, Fantasy Football Analytics)
- Recent writing highlights
- Current status and activities
- Call-to-action links

**Design:** Oversized typography, clean sections, strategic CTAs

---

#### `about.md`
Personal narrative and career story including:
- Professional journey (politics → tech → QA → product management)
- Career transformation sections:
  - The Beginning: Politics to Tech
  - The Transformation: Finding Product Through Quality
  - The Evolution: QA to Product Leadership
  - The Vision: UC Berkeley Haas & Beyond
- Short-term and long-term goals
- What drives me (values and motivations)
- Beyond work (hobbies and interests)
- Personal philosophy
- Current status

**Tone:** Personal, authentic, reflective, inspiring

---

#### `projects.md`
Project portfolio hub featuring:
- Featured projects with cards (TextOut, RunningMate, Fantasy Football, etc.)
- Project categories (Civic Tech, Analytics, AI/ML, Product Strategy)
- Technical capabilities showcase
- Side projects and experiments
- Call-to-action for collaboration

**Layout:** Grid of project cards with images, descriptions, outcomes, and links

---

#### `contact.md`
Contact page with:
- What I'm open to (PM opportunities, civic tech, speaking, mentorship)
- How to reach me (email, LinkedIn, GitHub, Twitter)
- Current location (Berkeley, CA)
- Response time expectations
- Tips for great messages
- Additional resources (resume, writing, projects)
- FAQs about availability and consulting

**Design:** Approachable, clear, actionable

---

### Project Pages

#### `projects/project-template.md`
Comprehensive template for individual project case studies including:
- YAML front matter with all metadata
- Overview section (challenge, role, timeline, technologies)
- Problem statement (context, user pain points)
- Solution approach (strategy, key features)
- Technical architecture
- Outcomes (quantitative impact, qualitative feedback)
- Challenges and learnings
- Project gallery
- Technologies used
- Future roadmap
- Reflections

**Use:** Copy this template for each new project case study

---

#### `projects/textout-platform.md`
Complete example case study demonstrating:
- Product management work (user research, feature prioritization)
- Quantifiable outcomes (35% engagement, 90% faster onboarding)
- Technical implementation (GCP automation)
- Challenges faced and how they were solved
- Real-world impact and feedback

**Use:** Reference for structure, tone, and level of detail

---

### Blog Structure

#### `blog-new/index.md`
Blog landing page featuring:
- Introduction to writing topics
- Category organization (Product Management, QA, Civic Tech, AI, MBA Journey)
- Featured posts with descriptions
- Recent posts list
- Posts organized by category
- Popular tags
- Newsletter subscription CTA

**Design:** Scannable, well-organized, encourages exploration

---

#### `blog-new/post-template.md`
Comprehensive blog post template including:
- YAML front matter (title, excerpt, category, tags, SEO)
- Article structure (hook, table of contents, main sections)
- Content patterns (code examples, visual elements, data tables)
- Real-world examples and case studies
- Practical application sections
- Key takeaways and recommendations
- Discussion prompts and author bio

**Use:** Copy for each new blog post to ensure consistency

---

### Component Partials

#### `components/hero.md`
Hero section component documentation:
- Basic hero template
- Examples (homepage, project, blog post)
- Styling guidelines
- Best practices

**Use:** Reference when creating hero sections for new pages

---

#### `components/project-card.md`
Project card component guide:
- Standard template
- Card variations (grid, featured, list)
- Content guidelines
- Styling specifications
- Examples for different contexts

**Use:** Create consistent project presentations

---

#### `components/footer.md`
Footer component templates:
- Standard footer with navigation and social links
- Minimal footer option
- Footer with newsletter signup
- Styling guidelines
- Accessibility notes

**Use:** Implement consistent site footer

---

#### `components/navbar.md`
Navigation component guide:
- Desktop and mobile navigation layouts
- Floating navigation template
- Active state indication
- Styling guidelines
- Keyboard navigation support
- Best practices

**Use:** Create accessible, consistent navigation

---

#### `components/section-header.md`
Section header component:
- Standard templates
- Examples with different features
- Hierarchy levels (H2, H3, H4)
- Spacing guidelines
- Variations (with background, borders, metadata)
- Accessibility and SEO considerations

**Use:** Structure page content with clear sections

---

## Design System Quick Reference

### Color Palette
- **Primary:** Sunset Orange (#FF6B35)
- **Secondary:** Golden Yellow (#F7B32B)
- **Accent:** Coral (#FF8E53)
- **Text:** Warm Gray 700 (#4A3426)
- **Background:** Warm Cream (#FFFCF7)

### Typography
- **Font:** Inter (primary), JetBrains Mono (code)
- **Display XXL:** 72px (hero headlines)
- **Heading 1:** 40px (page titles)
- **Body:** 16px (standard text)

### Spacing
- **XS:** 4px
- **S:** 8px
- **M:** 16px
- **L:** 24px
- **XL:** 32px
- **2XL:** 48px
- **3XL:** 64px
- **4XL:** 96px

---

## YAML Front Matter Standards

### Required Fields
```yaml
title: "Page or Post Title"
description: "Brief description (150-160 characters)"
publishedAt: "YYYY-MM-DD"
```

### Optional Fields
```yaml
updatedAt: "YYYY-MM-DD"
category: "Category Name"
tags: ["tag1", "tag2"]
featured: true
author: "Isaac Vazquez"
```

### SEO Fields
```yaml
seo:
  title: "SEO Title (60 chars max)"
  description: "SEO description (150-160 chars)"
  keywords: ["keyword1", "keyword2"]
```

---

## File Naming Conventions

- **Pages:** `lowercase-with-hyphens.md`
- **Blog Posts:** `post-slug.md` or `YYYY-MM-DD-post-title.md`
- **Components:** `component-name.md`
- **Images:** `descriptive-name.jpg` (lowercase, hyphens)

---

## Writing Style Guide

### Tone & Voice
- **Professional but Personal:** Approachable expert, not corporate robot
- **Clear and Concise:** Respect reader's time
- **Action-Oriented:** Focus on outcomes and impact
- **Authentic:** Real stories, honest reflections
- **Product-Focused:** Emphasize problem-solving and value

### Writing Best Practices

✅ **DO:**
- Use active voice
- Write in first person when appropriate
- Include specific metrics and outcomes
- Break up long paragraphs (3-5 lines max)
- Use subheadings for scannability
- Add examples and case studies
- Include calls-to-action
- Proofread before publishing

❌ **DON'T:**
- Use jargon without explanation
- Write overly long sentences
- Skip the value proposition
- Forget about mobile readers
- Use generic stock language
- Bury the lede

---

## Content Categories

### Portfolio Content
- **About:** Personal narrative, career journey, values
- **Projects:** Case studies with outcomes and learnings
- **Resume:** Professional experience and achievements

### Writing Content
- **Blog Posts:** Long-form articles (1000-3000 words)
- **Notes:** Short thoughts and quick takes
- **Writing:** Essays and deep dives

### Community Content
- **Newsletter:** Subscriber updates and exclusive content
- **Testimonials:** Client and colleague feedback
- **FAQ:** Common questions answered

---

## Usage Guidelines

### Creating a New Page
1. Copy appropriate template (index.md, about.md, etc.)
2. Update YAML front matter
3. Replace placeholder content
4. Add images to `/public/images/`
5. Follow design system guidelines in `theme.md`
6. Proofread and test
7. Commit and deploy

### Creating a New Project
1. Copy `projects/project-template.md`
2. Rename to `projects/[project-slug].md`
3. Fill in all sections with real content
4. Add project screenshots to `/public/project-screenshots/`
5. Update `projects.md` to include new project card
6. Test all links and images
7. Commit and deploy

### Creating a New Blog Post
1. Copy `blog-new/post-template.md`
2. Rename to `blog-new/[post-slug].md`
3. Write content following template structure
4. Add images to `/public/blog-images/`
5. Update `blog-new/index.md` to feature post
6. Test formatting and links
7. Commit and deploy

---

## Compatibility

This Markdown content system is designed to work with:

✅ **Static Site Generators:**
- Next.js with MDX
- Astro
- Hugo
- Jekyll
- Gatsby

✅ **Component Frameworks:**
- React (with react-markdown or MDX)
- Vue (with vue-markdown)
- Svelte (with mdsvex)

✅ **Content Management:**
- Git-based CMS (Netlify CMS, Forestry)
- Headless CMS (Contentful, Sanity)
- Markdown editors (Obsidian, Typora, VS Code)

---

## Maintenance

### Regular Updates
- [ ] Update `publishedAt` dates for new content
- [ ] Refresh project outcomes with latest metrics
- [ ] Add new blog posts to featured/recent lists
- [ ] Update "Current Status" sections quarterly
- [ ] Review and update SEO metadata
- [ ] Optimize images for web performance

### Content Audits
- Quarterly review of all pages for accuracy
- Update outdated information
- Fix broken links
- Refresh screenshots and images
- Review and improve SEO performance

---

## Migration Notes

### From Existing Site
If migrating from the current Next.js/TypeScript site:

1. **Content Extraction:**
   - Extract content from React components
   - Convert to Markdown format
   - Add YAML front matter
   - Migrate images to `/public/`

2. **Data Migration:**
   - Convert `src/constants/personal.ts` to Markdown
   - Extract project data into individual files
   - Transform blog MDX to match new template

3. **Component Mapping:**
   - Map React components to Markdown patterns
   - Use component partials as reference
   - Maintain consistent styling

4. **Testing:**
   - Verify all links work
   - Check image paths
   - Test responsive layouts
   - Validate YAML front matter
   - Review SEO metadata

---

## Support & Questions

### Resources
- **Design System:** See `theme.md` for complete guidelines
- **Templates:** Use template files as starting points
- **Examples:** Reference existing content files
- **Components:** Check component partials for patterns

### Getting Help
- Review template files for structure
- Check `theme.md` for styling questions
- Reference example files for content patterns
- Consult component guides for layout options

---

## Version History

**v1.0.0** — January 2025
- Initial Markdown content system
- Complete design system documentation
- Core page templates (index, about, projects, contact)
- Blog structure and templates
- Component partial guides
- Comprehensive documentation

---

## Author

**Isaac Vazquez**
MBA Candidate at UC Berkeley Haas
Product & Tech Builder • Civic Tech Background

**Contact:**
- Email: isaacavazquez95@gmail.com
- LinkedIn: linkedin.com/in/isaac-vazquez
- Website: isaacavazquez.com

---

_Built with care, designed for clarity, written with purpose._
