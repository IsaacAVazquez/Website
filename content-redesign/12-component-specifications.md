# Component Specifications

---

## Overview

This document provides detailed specifications for all UI components used across the portfolio website. Each component includes structure, styling, behavior, and code examples.

---

## Core Components

### 1. ModernButton

**Usage**: Primary, secondary, outline, and ghost button styles

**Variants**:
- `primary` - Berkeley blue background, white text
- `secondary` - Berkeley gold background, dark text
- `outline` - Transparent background, blue border
- `ghost` - Transparent background, no border

**Props**:
- `variant`: "primary" | "secondary" | "outline" | "ghost"
- `size`: "sm" | "md" | "lg"
- `children`: ReactNode
- `onClick`: () => void
- `href`: string (optional, renders as link)
- `icon`: ReactNode (optional)

**Styling**:
```css
/* Primary Button */
.button-primary {
  background: var(--berkeley-blue);
  color: white;
  padding: 12px 24px;  /* md size */
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 250ms ease-out;
  box-shadow: var(--shadow-sm);
}

.button-primary:hover {
  background: var(--accent-hover);  /* Darker blue */
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.button-primary:active {
  transform: scale(0.98);
}

/* Secondary Button */
.button-secondary {
  background: var(--berkeley-gold);
  color: var(--neutral-900);
  /* Rest same as primary */
}

/* Outline Button */
.button-outline {
  background: transparent;
  color: var(--berkeley-blue);
  border: 2px solid var(--berkeley-blue);
  padding: 10px 22px;  /* Account for border */
}

.button-outline:hover {
  background: var(--berkeley-blue);
  color: white;
}

/* Ghost Button */
.button-ghost {
  background: transparent;
  color: var(--neutral-700);
  border: none;
}

.button-ghost:hover {
  background: var(--neutral-100);
}

/* Sizes */
.button-sm {
  padding: 8px 16px;
  font-size: 14px;
}

.button-lg {
  padding: 14px 32px;
  font-size: 18px;
}
```

**Accessibility**:
- Minimum 44×44px touch target
- Focus visible with outline
- Keyboard accessible (Enter/Space)
- Disabled state with reduced opacity

**Example**:
```jsx
<ModernButton variant="primary" size="md" onClick={handleClick}>
  View Projects
</ModernButton>

<ModernButton variant="outline" href="/contact">
  Get in touch
</ModernButton>
```

---

### 2. WarmCard

**Usage**: Container for content with warm styling, hover effects

**Props**:
- `padding`: "none" | "sm" | "md" | "lg" | "xl"
- `hover`: boolean (enable hover lift effect)
- `children`: ReactNode
- `className`: string (optional)

**Styling**:
```css
.warm-card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  transition: all 250ms ease-out;
}

.warm-card.hover:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}

/* Padding variants */
.warm-card.padding-none {
  padding: 0;
}

.warm-card.padding-sm {
  padding: 16px;
}

.warm-card.padding-md {
  padding: 24px;
}

.warm-card.padding-lg {
  padding: 32px;
}

.warm-card.padding-xl {
  padding: 48px;
}
```

**Accessibility**:
- Semantic HTML (article, section, div)
- ARIA labels when needed
- Focus styles for interactive cards

**Example**:
```jsx
<WarmCard padding="lg" hover>
  <h3>Project Title</h3>
  <p>Project description...</p>
</WarmCard>
```

---

### 3. ProjectCard

**Usage**: Displays project information in grid layouts

**Props**:
- `image`: string (image URL)
- `category`: string
- `title`: string
- `excerpt`: string
- `metrics`: string[] (array of impact metrics)
- `tags`: string[] (skill tags)
- `href`: string (link to case study)

**Structure**:
```jsx
<WarmCard padding="none" hover>
  <Image src={image} alt={title} aspectRatio="16:9" />
  <div className="card-content" padding="lg">
    <p className="category">{category}</p>
    <h3>{title}</h3>
    <p className="excerpt">{excerpt}</p>
    <ul className="metrics">
      {metrics.map(metric => <li key={metric}>{metric}</li>)}
    </ul>
    <div className="tags">
      {tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
    </div>
    <a href={href}>View case study →</a>
  </div>
</WarmCard>
```

**Styling**:
```css
.project-card {
  display: flex;
  flex-direction: column;
}

.project-card img {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 12px 12px 0 0;
}

.project-card .category {
  font-size: 12px;
  font-weight: 500;
  color: var(--berkeley-blue);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.project-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: 12px;
}

.project-card .excerpt {
  font-size: 16px;
  color: var(--neutral-600);
  line-height: 1.6;
  margin-bottom: 16px;
}

.project-card .metrics {
  list-style: disc;
  padding-left: 20px;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--neutral-700);
}

.project-card .metrics li {
  margin-bottom: 4px;
}

.project-card .tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.project-card a {
  color: var(--berkeley-blue);
  text-decoration: none;
  font-weight: 500;
  transition: all 150ms;
}

.project-card a:hover {
  text-decoration: underline;
}
```

---

### 4. Badge

**Usage**: Small labels for tags, categories, status

**Props**:
- `children`: ReactNode
- `variant`: "default" | "primary" | "gold" | "neutral"

**Styling**:
```css
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;  /* Full rounded */
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.badge-default {
  background: var(--neutral-100);
  color: var(--neutral-700);
}

.badge-primary {
  background: rgba(0, 50, 98, 0.1);  /* Light blue */
  color: var(--berkeley-blue);
}

.badge-gold {
  background: rgba(253, 181, 21, 0.1);  /* Light gold */
  color: var(--warm-gold);
}
```

---

### 5. Heading

**Usage**: Semantic headings with consistent styling

**Props**:
- `level`: 1 | 2 | 3 | 4 | 5 | 6
- `children`: ReactNode
- `className`: string

**Styling**:
```css
h1, .heading-1 {
  font-size: var(--text-h1);  /* 40px */
  line-height: 1.2;
  font-weight: 600;
  color: var(--neutral-900);
}

h2, .heading-2 {
  font-size: var(--text-h2);  /* 32px */
  line-height: 1.25;
  font-weight: 600;
  color: var(--neutral-900);
}

h3, .heading-3 {
  font-size: var(--text-h3);  /* 24px */
  line-height: 1.3;
  font-weight: 600;
  color: var(--neutral-900);
}

h4, .heading-4 {
  font-size: var(--text-h4);  /* 20px */
  line-height: 1.4;
  font-weight: 600;
  color: var(--neutral-800);
}

h5, .heading-5 {
  font-size: var(--text-h5);  /* 18px */
  line-height: 1.4;
  font-weight: 600;
  color: var(--neutral-800);
}

h6, .heading-6 {
  font-size: 16px;
  line-height: 1.5;
  font-weight: 600;
  color: var(--neutral-700);
}
```

---

### 6. Container

**Usage**: Constrains content width and centers

**Props**:
- `size`: "sm" | "md" | "lg" | "xl"
- `children`: ReactNode
- `className`: string

**Styling**:
```css
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--container-padding-sm);  /* 20px mobile */
  padding-right: var(--container-padding-sm);
}

@media (min-width: 768px) {
  .container {
    padding-left: var(--container-padding-md);  /* 40px tablet */
    padding-right: var(--container-padding-md);
  }
}

@media (min-width: 1024px) {
  .container {
    padding-left: var(--container-padding-lg);  /* 80px desktop */
    padding-right: var(--container-padding-lg);
  }
}

.container-sm {
  max-width: 640px;
}

.container-md {
  max-width: 768px;
}

.container-lg {
  max-width: 1024px;
}

.container-xl {
  max-width: 1280px;
}
```

---

### 7. Section

**Usage**: Full-width section with background and spacing

**Props**:
- `background`: "white" | "neutral" | "gradient"
- `spacing`: "sm" | "md" | "lg"
- `children`: ReactNode

**Styling**:
```css
.section {
  width: 100%;
  padding-top: var(--section-spacing-sm);  /* 64px mobile */
  padding-bottom: var(--section-spacing-sm);
}

@media (min-width: 768px) {
  .section {
    padding-top: var(--section-spacing-md);  /* 96px tablet */
    padding-bottom: var(--section-spacing-md);
  }
}

@media (min-width: 1024px) {
  .section {
    padding-top: var(--section-spacing-lg);  /* 128px desktop */
    padding-bottom: var(--section-spacing-lg);
  }
}

.section-white {
  background: white;
}

.section-neutral {
  background: var(--neutral-50);
}

.section-gradient {
  background: var(--gradient-hero);
  color: white;
}
```

---

### 8. HeroSection

**Usage**: Large hero sections with centered content

**Props**:
- `title`: string
- `subtitle`: string
- `cta`: { text: string, href: string }[] (optional)
- `background`: "gradient" | "white" | "neutral"

**Structure**:
```jsx
<Section background="gradient" spacing="lg">
  <Container size="lg">
    <div className="hero-content">
      <h1>{title}</h1>
      <p className="subtitle">{subtitle}</p>
      {cta && (
        <div className="cta-group">
          {cta.map((button) => (
            <ModernButton key={button.text} href={button.href}>
              {button.text}
            </ModernButton>
          ))}
        </div>
      )}
    </div>
  </Container>
</Section>
```

**Styling**:
```css
.hero-content {
  text-align: center;
  max-width: 1024px;
  margin: 0 auto;
}

.hero-content h1 {
  font-size: var(--text-display-xl);  /* 60px */
  line-height: 1.1;
  font-weight: 500;
  margin-bottom: 24px;
}

.hero-content .subtitle {
  font-size: var(--text-xl);  /* 20px */
  line-height: 1.6;
  margin-bottom: 32px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.hero-content .cta-group {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .hero-content h1 {
    font-size: var(--text-display-lg);  /* 48px */
  }

  .hero-content .subtitle {
    font-size: var(--text-lg);  /* 18px */
  }
}
```

---

### 9. Grid

**Usage**: Responsive grid layouts

**Props**:
- `columns`: { mobile: 1, tablet: 2, desktop: 3 }
- `gap`: "sm" | "md" | "lg"
- `children`: ReactNode

**Styling**:
```css
.grid {
  display: grid;
  gap: var(--content-gap-md);  /* 40px default */
}

.grid-cols-1 {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid-cols-2-tablet {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-cols-3-desktop {
    grid-template-columns: repeat(3, 1fr);
  }
}

.grid-gap-sm {
  gap: var(--content-gap-sm);  /* 24px */
}

.grid-gap-lg {
  gap: var(--content-gap-lg);  /* 64px */
}
```

---

### 10. BlogPostCard

**Usage**: Blog post preview cards

**Props**:
- `title`: string
- `excerpt`: string
- `date`: string
- `category`: string
- `readTime`: string
- `href`: string

**Structure**:
```jsx
<WarmCard padding="lg" hover>
  <div className="blog-post-meta">
    <span className="date">{date}</span>
    <Badge variant="primary">{category}</Badge>
  </div>
  <h3>{title}</h3>
  <p className="excerpt">{excerpt}</p>
  <div className="blog-post-footer">
    <span className="read-time">{readTime} read</span>
    <a href={href}>Read more →</a>
  </div>
</WarmCard>
```

**Styling**:
```css
.blog-post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.blog-post-meta .date {
  font-size: 14px;
  color: var(--neutral-500);
}

.blog-post-card h3 {
  font-size: 24px;
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: 12px;
  transition: color 150ms;
}

.blog-post-card:hover h3 {
  color: var(--berkeley-blue);
}

.blog-post-card .excerpt {
  font-size: 16px;
  color: var(--neutral-600);
  line-height: 1.6;
  margin-bottom: 16px;
}

.blog-post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.read-time {
  font-size: 14px;
  color: var(--neutral-500);
}
```

---

### 11. TimelineItem

**Usage**: Experience timeline on resume/experience page

**Props**:
- `company`: string
- `role`: string
- `timeline`: string
- `location`: string
- `description`: string
- `achievements`: string[]
- `skills`: string[]

**Styling**:
```css
.timeline {
  position: relative;
  padding-left: 40px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--berkeley-blue);
  opacity: 0.3;
}

.timeline-item {
  position: relative;
  margin-bottom: 64px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -45px;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--berkeley-blue);
}

.timeline-item h3 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.timeline-item .role {
  font-size: 18px;
  font-weight: 500;
  color: var(--neutral-700);
  margin-bottom: 4px;
}

.timeline-item .meta {
  font-size: 14px;
  color: var(--neutral-500);
  margin-bottom: 16px;
}

.timeline-item .achievements {
  list-style: disc;
  padding-left: 20px;
  margin-bottom: 16px;
}

.timeline-item .achievements li {
  margin-bottom: 12px;
  color: var(--neutral-700);
}

.timeline-item .skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
```

---

## Layout Components

### Page Layout

**Structure**:
```jsx
<div className="page">
  <Header />
  <main>
    {children}
  </main>
  <Footer />
</div>
```

**Styling**:
```css
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
```

---

### Navigation

**Structure**:
```jsx
<nav className="nav">
  <Container size="xl">
    <div className="nav-content">
      <a href="/" className="logo">Isaac Vazquez</a>
      <ul className="nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/projects">Projects</a></li>
        <li><a href="/resume">Resume</a></li>
        <li><a href="/blog">Writing</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </div>
  </Container>
</nav>
```

**Styling**:
```css
.nav {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--neutral-200);
  z-index: 100;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

.logo {
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 32px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  font-size: 16px;
  font-weight: 500;
  color: var(--neutral-600);
  text-decoration: none;
  transition: color 150ms;
}

.nav-links a:hover,
.nav-links a.active {
  color: var(--neutral-900);
}

.nav-links a.active {
  border-bottom: 2px solid var(--berkeley-gold);
}

/* Mobile navigation */
@media (max-width: 768px) {
  .nav-links {
    display: none;  /* Implement mobile menu */
  }
}
```

---

## Animation Utilities

### Fade In
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 500ms ease-out;
}
```

### Slide Up
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 350ms ease-out;
}
```

### Stagger Animation
```css
.stagger-children > * {
  animation: slideUp 350ms ease-out;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 100ms; }
.stagger-children > *:nth-child(3) { animation-delay: 200ms; }
.stagger-children > *:nth-child(4) { animation-delay: 300ms; }
```

---

## Usage Examples

### Homepage Hero
```jsx
<HeroSection
  background="gradient"
  title="Isaac Vazquez"
  subtitle="MBA → Product Manager"
  cta={[
    { text: "View my work", href: "/projects" },
    { text: "Get in touch", href: "/contact" }
  ]}
/>
```

### Project Grid
```jsx
<Section background="white">
  <Container size="xl">
    <Heading level={2}>Featured Projects</Heading>
    <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
      {projects.map(project => (
        <ProjectCard key={project.id} {...project} />
      ))}
    </Grid>
  </Container>
</Section>
```

---

**File**: `component-specifications.md`
**Last updated**: November 2025
