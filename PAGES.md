# Page Architecture Documentation

Complete page structure and routing guide for Isaac Vazquez's portfolio website.

**Framework:** Next.js 15 App Router
**Total Pages:** 15+ routes
**Last Updated:** January 2025

---

## 📋 Table of Contents

- [Page Overview](#page-overview)
- [Portfolio Pages](#portfolio-pages)
- [Content Pages](#content-pages)
- [Page Structure Patterns](#page-structure-patterns)
- [SEO & Metadata](#seo--metadata)
- [Layout Guidelines](#layout-guidelines)

---

## 🗺️ Page Overview

### Routing Structure

```
Portfolio Section (/)
├── Home (/)
├── About (/about)
├── Projects (/projects)
├── Resume (/resume)
└── Contact (/contact)

Content Section (/blog, /writing)
├── Blog listing (/blog) [disabled]
├── Blog posts (/blog/[slug])
├── Writing portfolio (/writing)
└── Newsletter (/newsletter)

Utility Pages
├── Search (/search)
├── Testimonials (/testimonials)
└── FAQ (/faq)
```

---

## 🏠 Portfolio Pages

### Home Page (/)

**File:** `src/app/page.tsx`
**Layout:** Full-width with ModernHero

#### Structure

```tsx
<div className="bg-[#FFFCF7] dark:bg-gradient-to-br dark:from-[#1C1410]">
  <ModernHero />

  <section className="py-16 sm:py-20 lg:py-24">
    {/* Tab Navigation (Overview / Journey) */}
    <TabNavigation />

    {/* Tab Content */}
    <AnimatePresence mode="wait">
      {activeTab === "overview" && <OverviewContent />}
      {activeTab === "journey" && <JourneyTimeline />}
    </AnimatePresence>
  </section>
</div>
```

#### Features
- **ModernHero**: Professional headshot + intro text
- **Tabbed Content**: Overview and Career Journey
- **TimelineItem**: Career history with logos and tech stacks
- **Responsive**: Mobile-first with proper breakpoints

#### Key Components
- `ModernHero` - Hero section
- `WarmCard` - Content containers
- `TimelineItem` - Career timeline items

#### Metadata
```typescript
title: "Isaac Vazquez - Technical Product Manager & UC Berkeley MBA"
description: "Bay Area-based product manager pursuing MBA at UC Berkeley Haas..."
```

---

### About Page (/about)

**File:** `src/app/about/page.tsx` → `src/components/About.tsx`
**Layout:** Standard with header

#### Structure

```tsx
<div className="min-h-screen py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
  {/* Page Header */}
  <motion.div className="text-center mb-12 max-w-4xl mx-auto">
    <h1>About Isaac Vazquez</h1>
    <p>Berkeley Haas MBA Candidate '27 | Consortium Fellow</p>
  </motion.div>

  {/* Tab Navigation */}
  <TabButtons />

  {/* Tab Content */}
  <AnimatePresence mode="wait">
    {activeTab === "overview" && <OverviewContent />}
    {activeTab === "journey" && <JourneyTimeline />}
  </AnimatePresence>
</div>
```

#### Features
- **Tabbed Interface**: Overview and Journey tabs
- **Overview Content**: Skills, experience, background
- **Journey Timeline**: Career progression with company logos

#### Max Width
- `max-w-5xl` for outer container
- `max-w-4xl` for header section

---

### Projects Page (/projects)

**File:** `src/app/projects/page.tsx` → `src/components/ProjectsContent.tsx`
**Layout:** Standard with project grid

#### Structure

```tsx
<div className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
  <div className="max-w-5xl mx-auto">
    <h1>Projects</h1>

    {/* Project Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {projects.map((project) => (
        <WarmCard key={project.id} hover={true}>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <div>{project.techStack.map(Badge)}</div>
          <ModernButton>View Project</ModernButton>
        </WarmCard>
      ))}
    </div>
  </div>
</div>
```

#### Features
- **Project Cards**: WarmCard with hover effects
- **Tech Stack Badges**: Technology tags
- **Links**: Live demos and repositories
- **Responsive Grid**: 1 column mobile, 2 columns desktop

---

### Resume Page (/resume)

**File:** `src/app/resume/page.tsx` → `src/app/resume/resume-client.tsx`
**Layout:** Standard (wider max-width)

#### Structure

```tsx
<div className="min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
  <div className="max-w-6xl mx-auto">
    {/* Header with Download Button */}
    <WarmCard>
      <h1 className="gradient-text-warm">ISAAC VAZQUEZ</h1>
      <ModernButton onClick={handleDownloadPDF}>
        <IconDownload /> DOWNLOAD PDF
      </ModernButton>
    </WarmCard>

    {/* Summary */}
    <WarmCard><Summary /></WarmCard>

    {/* Experience */}
    <WarmCard><Experience /></WarmCard>

    {/* Education */}
    <WarmCard><Education /></WarmCard>

    {/* Skills */}
    <WarmCard><Skills /></WarmCard>
  </div>
</div>
```

#### Features
- **PDF Download**: Generate resume PDF
- **Warm Card Sections**: Each resume section in WarmCard
- **Interactive Elements**: Expandable sections, tooltips
- **Wider Layout**: `max-w-6xl` for more horizontal space

#### Max Width
- `max-w-6xl` (wider than other pages for resume content)

---

### Contact Page (/contact)

**File:** `src/app/contact/page.tsx` → `src/components/ContactContent.tsx`
**Layout:** Standard with content cards

#### Structure

```tsx
<div className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
  <div className="max-w-5xl mx-auto">
    {/* Header */}
    <div className="text-center mb-16">
      <h1 className="gradient-text-warm">Let's Work Together</h1>
      <p>Open to product roles, advisory projects...</p>
    </div>

    {/* CTA Card */}
    <WarmCard>
      <h2>Ready to Connect?</h2>
      <ModernButton variant="primary">Email me</ModernButton>
    </WarmCard>

    {/* Info Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <WarmCard hover>{/* Experience */}</WarmCard>
      <WarmCard hover>{/* Results */}</WarmCard>
      <WarmCard hover>{/* Response */}</WarmCard>
    </div>

    {/* Location */}
    <WarmCard>📍 Berkeley, CA</WarmCard>
  </div>
</div>
```

#### Features
- **Primary CTA**: Email button
- **Info Cards**: 3-column grid with key information
- **Social Links**: LinkedIn, Email
- **Location Info**: Current location

---

## 📝 Content Pages

### Blog Page (/blog)

**File:** `src/app/blog/page.tsx`
**Status:** Currently returns 404 (disabled)

```tsx
import { notFound } from "next/navigation";

export default function BlogPage() {
  notFound();
}
```

### Blog Post (/blog/[slug])

**File:** `src/app/blog/[slug]/page.tsx`
**Content Source:** `/content/blog/*.mdx`

#### Structure
- MDX processing with gray-matter
- Dynamic routes for each blog post
- Syntax highlighting for code blocks
- Table of contents generation

### Newsletter Page (/newsletter)

**File:** `src/app/newsletter/page.tsx`
**Purpose:** Newsletter subscription

---

## 🏗️ Page Structure Patterns

### Standard Page Pattern

```tsx
export default function PageName() {
  return (
    <div className="min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#FFFCF7] dark:bg-gradient-to-br dark:from-[#1C1410] dark:via-[#2D1B12] dark:to-[#1C1410]">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text-warm mb-4">
            Page Title
          </h1>
          <p className="text-lg md:text-xl text-[#4A3426] dark:text-[#D4A88E]">
            Page description
          </p>
        </motion.div>

        {/* Page Content */}
        <WarmCard hover={false} padding="xl">
          <ContentComponent />
        </WarmCard>
      </div>
    </div>
  );
}
```

### Key Pattern Elements

**Spacing:**
```tsx
className="py-16 sm:py-20 lg:py-24"  // Section spacing
className="px-4 sm:px-6 lg:px-8"     // Horizontal padding
className="mb-12"                     // Header margin bottom
className="space-y-8"                 // Content spacing
```

**Max Widths:**
```tsx
className="max-w-5xl mx-auto"   // Standard pages
className="max-w-6xl mx-auto"   // Resume (wider)
className="max-w-4xl mx-auto"   // Headers/centered content
```

**Background:**
```tsx
// Light mode
className="bg-[#FFFCF7]"

// Dark mode
className="dark:bg-gradient-to-br dark:from-[#1C1410] dark:via-[#2D1B12] dark:to-[#1C1410]"
```

---

## 🔍 SEO & Metadata

### Metadata Pattern

```typescript
// src/app/page-name/page.tsx
export const metadata: Metadata = {
  title: "Page Title - Isaac Vazquez",
  description: "Page description optimized for search engines",
  openGraph: {
    title: "Page Title",
    description: "Page description",
    url: "https://isaacavazquez.com/page-name",
    siteName: "Isaac Vazquez Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Page Title",
    description: "Page description",
  },
};
```

### Common Metadata

**Home Page:**
- Title: "Isaac Vazquez - Technical Product Manager & UC Berkeley MBA"
- Description: Product manager, MBA candidate, 6+ years experience

**About Page:**
- Title: "About - Isaac Vazquez"
- Description: Background, skills, career journey

**Resume Page:**
- Title: "Resume - Isaac Vazquez"
- Description: Professional experience, education, skills

**Contact Page:**
- Title: "Contact - Isaac Vazquez"
- Description: Get in touch, collaboration opportunities

---

## 📐 Layout Guidelines

### Container Guidelines

**Page Wrapper:**
```tsx
<div className="min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
```

**Content Container:**
```tsx
<div className="max-w-5xl mx-auto">
```

**Header Section:**
```tsx
<div className="text-center mb-12 max-w-4xl mx-auto">
```

### Spacing Guidelines

**Between Sections:**
```tsx
className="space-y-8"      // Standard
className="space-y-12"     // Larger separation
```

**Grid Gaps:**
```tsx
className="gap-6"          // Tight
className="gap-8"          // Standard
className="gap-12"         // Loose
```

### Responsive Breakpoints

```tsx
// Mobile → Tablet → Desktop
className="text-4xl md:text-5xl lg:text-6xl"    // Headings
className="text-base md:text-lg"                // Body
className="grid-cols-1 md:grid-cols-2"          // Grids
className="flex-col md:flex-row"                // Flex direction
```

---

## 🔗 Related Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete routing structure
- **[COMPONENTS.md](./COMPONENTS.md)** - Component usage
- **[STYLING.md](./STYLING.md)** - Design system and styling

---

*Last Updated: January 2025 - Warm Modern Portfolio*
