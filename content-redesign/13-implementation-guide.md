# Implementation Guide

---

## Overview

This guide provides step-by-step instructions for implementing the redesigned PM portfolio website using the content and design system provided.

---

## File Structure

```
content-redesign/
├── 00-DESIGN-SYSTEM.md              # Complete design system and tokens
├── 01-home.md                       # Homepage content and structure
├── 02-about.md                      # About page content
├── 03-projects-overview.md          # Projects listing page
├── 04-case-study-template.md        # Reusable case study template
├── 05-case-study-ai-qa.md           # AI QA Automation case study
├── 06-case-study-voter-targeting.md # Voter Targeting case study
├── 07-case-study-textout.md         # TextOut SMS Platform case study
├── 08-experience.md                 # Resume/Experience page
├── 09-blog-overview.md              # Blog listing page
├── 10-blog-post-pm-skills.md        # First blog post (fully written)
├── 11-contact.md                    # Contact page
├── 12-component-specifications.md   # Component specs and code
└── 13-implementation-guide.md       # This file
```

---

## Implementation Steps

### Phase 1: Setup & Foundation (Week 1)

#### Step 1.1: Set Up Design Tokens

1. Open `00-DESIGN-SYSTEM.md`
2. Copy the CSS custom properties into your global stylesheet:

```css
/* In your globals.css or equivalent */
:root {
  /* Colors */
  --berkeley-blue: #003262;
  --berkeley-gold: #FDB515;
  --deep-navy: #0A1929;
  --warm-gold: #C4820E;

  /* Neutral scale */
  --neutral-50: #FAFAF9;
  --neutral-100: #F5F5F4;
  --neutral-200: #E7E5E4;
  --neutral-300: #D6D3D1;
  --neutral-400: #A8A29E;
  --neutral-500: #78716C;
  --neutral-600: #57534E;
  --neutral-700: #44403C;
  --neutral-800: #292524;
  --neutral-900: #1C1917;

  /* Semantic colors */
  --text-primary: var(--neutral-800);
  --text-secondary: var(--neutral-600);
  --text-tertiary: var(--neutral-500);

  --surface-primary: #FFFFFF;
  --surface-secondary: var(--neutral-50);

  --border-subtle: var(--neutral-200);
  --border-default: var(--neutral-300);

  --accent-primary: var(--berkeley-blue);
  --accent-secondary: var(--berkeley-gold);
  --accent-hover: #004080;

  /* Typography */
  --font-primary: 'Söhne', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;

  /* Type scale */
  --text-display-2xl: 72px;
  --text-display-xl: 60px;
  --text-display-lg: 48px;
  --text-h1: 40px;
  --text-h2: 32px;
  --text-h3: 24px;
  --text-h4: 20px;
  --text-h5: 18px;
  --text-xl: 20px;
  --text-lg: 18px;
  --text-base: 16px;
  --text-sm: 14px;
  --text-xs: 12px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;

  --section-spacing-sm: 64px;
  --section-spacing-md: 96px;
  --section-spacing-lg: 128px;

  --content-gap-sm: 24px;
  --content-gap-md: 40px;
  --content-gap-lg: 64px;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Transitions */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 350ms;
}

/* Base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--text-primary);
  background: white;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Step 1.2: Install Fonts

**Option A: Google Fonts**
```html
<!-- In your <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Option B: Local Fonts (Söhne)**
- Download Söhne from a font provider
- Add to your project's font folder
- Update CSS with @font-face declarations

#### Step 1.3: Create Core Components

Open `12-component-specifications.md` and implement these components first:
1. **Container** - Layout wrapper
2. **Section** - Full-width section
3. **ModernButton** - All button variants
4. **WarmCard** - Card container
5. **Heading** - Semantic headings
6. **Grid** - Responsive grid

These are the building blocks for all pages.

---

### Phase 2: Build Pages (Weeks 2-3)

#### Step 2.1: Homepage

1. Open `01-home.md`
2. Implement sections in order:
   - **HeroSection**: Gradient background, title, subtitle, CTAs
   - **CompanyLogos**: Companies/experience section
   - **FocusCards**: "What I'm focused on now" (3 cards in grid)
   - **ProjectCards**: Featured projects (3 cards in grid)
   - **NowSection**: Current status prose
   - **CTASection**: Final call to action

**Key Components**:
- HeroSection
- Grid (3 columns for projects, 2 columns for focus)
- ProjectCard
- FocusCard (simple card with icon + title + description)

**Assets Needed**:
- Professional headshot (for hero)
- 3 project screenshots (16:9 ratio)
- Company logos (optional)

---

#### Step 2.2: About Page

1. Open `02-about.md`
2. Implement sections:
   - **AboutHero**: Headline + subheadline
   - **StorySection**: Personal story prose (max-width 700px)
   - **ValueCards**: "What drives me" (4 cards in 2×2 grid)
   - **SkillsGrid**: Skills by category (3 columns)
   - **GoalsSection**: Short-term + long-term goals (2 large cards)
   - **PersonalNote**: Beyond work prose
   - **CTA**: Get in touch

**Key Components**:
- Prose container (max-width 700px for readability)
- ValueCard (icon + title + description)
- SkillsGrid (category + bulleted list)
- GoalCard (icon + title + description + success criteria)

**Assets Needed**:
- Icons for value cards (Users, Tools, Lightning, Heart)
- Icons for goals (Target, Rocket)

---

#### Step 2.3: Projects Page

1. Open `03-projects-overview.md`
2. Implement:
   - **ProjectsHero**: Headline + subheadline
   - **ProjectGrid**: 2-column grid of project cards
   - **CTASection**: Final CTA

3. For each project, use `ProjectCard` component with:
   - Image (16:9)
   - Category label
   - Title
   - Excerpt
   - Metrics (bulleted list)
   - Tags (badges)
   - CTA link

**Assets Needed**:
- 5 project screenshots/images
- Project data (can be hardcoded or from CMS)

---

#### Step 2.4: Case Studies

1. Open `04-case-study-template.md` to understand structure
2. Implement 3 case studies:
   - `05-case-study-ai-qa.md`
   - `06-case-study-voter-targeting.md`
   - `07-case-study-textout.md`

**Case Study Structure**:
- Header (title, metadata, tags)
- Overview (2-column: context + key results)
- Problem (prose with subheadings)
- Discovery (prose + insights list + optional quote)
- Solution (prose + feature cards + decisions)
- Execution (timeline/phases)
- Results (metric cards + qualitative impact + quotes)
- Learnings (numbered list + reflection)
- Related projects CTA

**Key Components**:
- CaseStudyHeader
- OverviewCard (2-column)
- ProblemStatement (callout box)
- InsightsList (numbered)
- UserQuote (large quote block)
- FeatureCard
- MetricCard (large number + label)
- TimelinePhases
- LearningsList

**Assets Needed**:
- Project screenshots/diagrams
- Metric graphics (optional)

---

#### Step 2.5: Experience/Resume Page

1. Open `08-experience.md`
2. Implement:
   - **ExperienceHero**: Headline + subtitle + download resume button
   - **Timeline**: Vertical timeline of experiences
   - **EducationSection**: Education cards
   - **SkillsGrid**: 3-column skills
   - **Certifications**: List of certifications
   - **CTA**: Get in touch + download resume

**Key Components**:
- TimelineItem (with left border accent)
- SkillsGrid
- EducationCard
- DownloadButton (links to PDF resume)

**Assets Needed**:
- Company logos (optional)
- Resume PDF file

---

#### Step 2.6: Blog/Writing

1. Open `09-blog-overview.md`
2. Implement:
   - **BlogHero**: Headline + subheadline
   - **BlogPostList**: Vertical list of blog post cards
   - **SubscribeCard** (optional)

3. Open `10-blog-post-pm-skills.md` for first blog post
4. Create blog post template with:
   - Title + metadata (date, category, read time)
   - Long-form prose (max-width 700px)
   - Headings, lists, bold text
   - Blockquotes (for emphasis)
   - Related posts CTA

**Key Components**:
- BlogPostCard (date + category + title + excerpt + read time + CTA)
- BlogPost (prose container with rich typography)
- SubscribeCard (email input + button)

**Content**:
- 1 fully written blog post provided
- 4 outlines for future posts

---

#### Step 2.7: Contact Page

1. Open `11-contact.md`
2. Implement:
   - **ContactHero**: Headline + subheadline
   - **ContactCards**: Email + LinkedIn + GitHub
   - **LookingForSection**: What you're looking for (prose)
   - **TopicsGrid**: Topics you're happy to discuss (4 cards)

**Key Components**:
- ContactCard (icon + label + value + description + CTA button)
- TopicsGrid (2×2 grid of cards)

**Simple Implementation**:
- Email: mailto: link
- LinkedIn: External link
- No contact form needed (email is simpler)

---

### Phase 3: Polish & Optimization (Week 4)

#### Step 3.1: Add Animations

Implement scroll-based animations using Intersection Observer:

```javascript
// Simple fade-in on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-fade-in');
    }
  });
}, {
  threshold: 0.2
});

// Observe all sections
document.querySelectorAll('section').forEach(section => {
  observer.observe(section);
});
```

**Animations to add**:
- Page load: Hero fades in
- Scroll: Sections slide up when visible
- Hover: Cards lift, buttons darken
- Stagger: Grid items animate with delay

#### Step 3.2: Responsive Testing

Test on these breakpoints:
- **Mobile**: 375px, 414px
- **Tablet**: 768px, 834px
- **Desktop**: 1024px, 1280px, 1440px

**Checklist**:
- ✓ Navigation collapses on mobile
- ✓ Grids stack on mobile (3 cols → 2 cols → 1 col)
- ✓ Typography scales down on mobile
- ✓ Touch targets are minimum 44×44px
- ✓ Images maintain aspect ratio
- ✓ No horizontal scroll on any breakpoint

#### Step 3.3: Accessibility Audit

**Checklist**:
- ✓ All images have alt text
- ✓ Headings are in logical order (h1 → h2 → h3)
- ✓ Focus states visible on all interactive elements
- ✓ Color contrast meets WCAG AA (4.5:1 for text)
- ✓ Keyboard navigation works (Tab, Enter, Space)
- ✓ ARIA labels on icon-only buttons
- ✓ Skip links for main content
- ✓ Reduced motion support

#### Step 3.4: SEO Implementation

For each page, add:

```html
<!-- Page title -->
<title>[Page Title] | Isaac Vazquez | Product Manager</title>

<!-- Meta description -->
<meta name="description" content="[Page description from content files]" />

<!-- Open Graph -->
<meta property="og:title" content="[Page Title]" />
<meta property="og:description" content="[Description]" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://isaacavazquez.com/[page-path]" />
<meta property="og:image" content="https://isaacavazquez.com/og-image.jpg" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Page Title]" />
<meta name="twitter:description" content="[Description]" />
<meta name="twitter:image" content="https://isaacavazquez.com/og-image.jpg" />
```

**Create OG Image**:
- Size: 1200×630px
- Include: Name, tagline, professional photo
- Style: Berkeley blue gradient background

#### Step 3.5: Performance Optimization

**Image Optimization**:
- Convert to WebP/AVIF
- Lazy load images below fold
- Use responsive image sizes
- Add blur placeholders

**Code Optimization**:
- Minify CSS and JavaScript
- Remove unused CSS
- Code split by route
- Preload critical fonts

**Lighthouse Goals**:
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

---

### Phase 4: Launch Preparation (Week 5)

#### Step 4.1: Content Review

**Checklist**:
- ✓ All copy proofread (no typos, grammar errors)
- ✓ All links work (internal and external)
- ✓ All images load and display correctly
- ✓ All metrics and dates are accurate
- ✓ Contact information is correct
- ✓ Resume PDF is up to date

#### Step 4.2: Cross-Browser Testing

Test on:
- **Chrome** (latest)
- **Safari** (latest)
- **Firefox** (latest)
- **Edge** (latest)
- **Mobile Safari** (iOS)
- **Chrome Mobile** (Android)

#### Step 4.3: Analytics Setup

**Option 1: Google Analytics**
```html
<!-- In <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

**Option 2: Plausible/Fathom** (privacy-friendly alternatives)

**Track These Events**:
- Page views
- Project card clicks
- Resume downloads
- Contact button clicks
- External link clicks (LinkedIn, GitHub)

#### Step 4.4: Deploy

**Deployment Checklist**:
- ✓ Domain configured (isaacavazquez.com)
- ✓ SSL certificate installed (HTTPS)
- ✓ Redirects set up (if migrating from old site)
- ✓ Sitemap.xml generated
- ✓ Robots.txt configured
- ✓ 404 page created
- ✓ Favicon added
- ✓ Environment variables set (if any)

**Recommended Platforms**:
- **Vercel**: Best for Next.js, automatic deployments
- **Netlify**: Great for static sites, easy setup
- **Cloudflare Pages**: Fast, free tier
- **GitHub Pages**: Free, good for simple sites

---

## Quick Start for Lovable

If you're using Lovable or a similar AI site builder:

### 1. Paste Design System

Copy the entire `00-DESIGN-SYSTEM.md` file and say:
> "Implement this design system as CSS custom properties and base styles."

### 2. Build Homepage

Copy `01-home.md` and say:
> "Build this homepage using the design system. Create these components: HeroSection, FocusCard, ProjectCard."

### 3. Iterate Through Pages

For each page:
1. Copy the relevant .md file
2. Say: "Build this [PAGE NAME] using the design system and components we've created."
3. Review and refine

### 4. Add Components

Copy `12-component-specifications.md` and say:
> "Implement these components with the exact styling and props specified."

### 5. Add Content

Paste content from case studies and blog posts directly.

---

## Assets Needed

### Images
- **Professional headshot** (hero section) - 800×800px minimum
- **Project screenshots** (5 images) - 1600×900px (16:9 ratio)
- **Company logos** (optional) - SVG preferred
- **OG image** (social sharing) - 1200×630px

### Files
- **Resume PDF** - Updated, professional formatting
- **Favicon** - 32×32px, 180×180px (Apple touch icon)

### Content
- **Email address** - Confirmed working
- **LinkedIn URL** - Updated profile
- **GitHub URL** - If applicable

---

## Maintenance & Updates

### Regular Updates
- **Monthly**: Update "Now" section on homepage
- **Quarterly**: Add new blog posts
- **As needed**: Add new projects/case studies

### Content Ideas
- Blog posts from outlines in `09-blog-overview.md`
- New case studies using `04-case-study-template.md`
- Project updates with new metrics

---

## Support & Resources

### Design System Reference
- All design tokens: `00-DESIGN-SYSTEM.md`
- Component specs: `12-component-specifications.md`

### Content Reference
- Homepage: `01-home.md`
- About: `02-about.md`
- Projects: `03-projects-overview.md`
- Case studies: `05-07-case-study-*.md`
- Resume: `08-experience.md`
- Blog: `09-blog-overview.md`
- Contact: `11-contact.md`

### Tools & Libraries
- **Icons**: Heroicons, Lucide, or Tabler Icons
- **Fonts**: Inter (Google Fonts) or Söhne
- **Animations**: Framer Motion or CSS animations
- **Forms**: (Not needed - use email links)

---

## Success Metrics

**Website Goals**:
- ✓ Clearly positions you as MBA → PM candidate
- ✓ Showcases product work with detailed case studies
- ✓ Drives recruiters to contact you
- ✓ Looks modern, polished, premium

**Track These KPIs**:
- Page views (especially /projects and /resume)
- Resume downloads
- Contact button clicks
- Average time on site
- Mobile vs. desktop traffic

---

## Timeline Summary

- **Week 1**: Setup design system, create core components
- **Week 2**: Build homepage, about, contact
- **Week 3**: Build projects, case studies, blog
- **Week 4**: Polish, optimize, test
- **Week 5**: Final review and launch

**Total Estimated Time**: 4-5 weeks for full implementation

**Minimum Viable Launch** (2 weeks):
- Homepage
- Projects page (with 2 case studies)
- Resume/Experience page
- Contact page
- Skip blog initially, add later

---

## Next Steps

1. **Review all content files** in this directory
2. **Set up your development environment** (Lovable, Next.js, etc.)
3. **Implement design system** from `00-DESIGN-SYSTEM.md`
4. **Build components** from `12-component-specifications.md`
5. **Build pages** in order (home → about → projects → etc.)
6. **Test, polish, launch**

---

**Questions or issues?** Refer back to the specific .md files for detailed content and structure.

**Good luck with your launch!** 🚀

---

**File**: `implementation-guide.md`
**Last updated**: November 2025
