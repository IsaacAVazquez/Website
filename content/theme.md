# Website Theme & Design System

## Overview

Modern, clean portfolio aesthetic for Isaac Vazquez — MBA Candidate, Product & Tech Builder with political tech background. This theme emphasizes clarity, professionalism, and a founder-leaning product focus.

---

## Design Principles

1. **Clean & Minimal** — Open space, breathing room, clear hierarchy
2. **Modern & Sharp** — Contemporary aesthetic with strong typography
3. **Personal & Authentic** — Reflects Isaac's journey and personality
4. **Product-Focused** — Emphasizes problem-solving and outcomes
5. **Accessible** — WCAG AA+ compliance, inclusive design

---

## Color Palette

### Primary Colors

```
Sunset Orange:   #FF6B35  (Primary actions, headings, CTAs)
Golden Yellow:   #F7B32B  (Secondary actions, accents, highlights)
Coral:           #FF8E53  (Hover states, interactive elements)
Fresh Green:     #6BCF7F  (Success states, tertiary actions)
```

### Neutral Scale

```
Warm Cream:      #FFFCF7  (Backgrounds, light surfaces)
Warm White:      #FFFFFF  (Cards, elevated surfaces)
Warm Gray 100:   #F8F4F0  (Subtle backgrounds)
Warm Gray 200:   #E8DED4  (Borders, dividers)
Warm Gray 300:   #D1C4B8  (Disabled states)
Warm Gray 600:   #6B5E52  (Secondary text)
Warm Gray 700:   #4A3426  (Primary text, headings)
Warm Gray 800:   #2D1B12  (Dark backgrounds, footer)
Warm Gray 900:   #1C1410  (Deep dark elements)
```

### Semantic Colors

```
Success:         #6BCF7F  (Success messages, confirmations)
Warning:         #FFB020  (Warnings, attention items)
Error:           #FF5757  (Errors, destructive actions)
Info:            #00D9FF  (Information, neutral alerts)
```

---

## Typography

### Font Families

**Primary Sans-Serif:** Inter (headings, body text, UI)
**Display Font:** Inter (oversized display text)
**Monospace:** JetBrains Mono (code, technical content)

### Font Scale

```
Display XXL:     72px / 4.5rem    (Hero headlines)
Display XL:      60px / 3.75rem   (Large headlines)
Display L:       48px / 3rem      (Section titles)
Heading 1:       40px / 2.5rem    (Page titles)
Heading 2:       32px / 2rem      (Major sections)
Heading 3:       24px / 1.5rem    (Subsections)
Heading 4:       20px / 1.25rem   (Minor headings)
Body Large:      18px / 1.125rem  (Lead paragraphs)
Body:            16px / 1rem      (Body text)
Body Small:      14px / 0.875rem  (Captions, labels)
Body XS:         12px / 0.75rem   (Fine print)
```

### Line Heights

```
Tight:      1.2   (Headings, display text)
Normal:     1.5   (Body text)
Relaxed:    1.75  (Long-form content)
Loose:      2.0   (Spacious layouts)
```

### Font Weights

```
Light:      300   (Subtle text)
Regular:    400   (Body text)
Medium:     500   (Emphasis)
Semibold:   600   (Subheadings)
Bold:       700   (Headings, CTAs)
Extrabold:  800   (Display text)
```

---

## Spacing System

```
Space XS:    4px / 0.25rem
Space S:     8px / 0.5rem
Space M:     16px / 1rem
Space L:     24px / 1.5rem
Space XL:    32px / 2rem
Space 2XL:   48px / 3rem
Space 3XL:   64px / 4rem
Space 4XL:   96px / 6rem
```

### Layout Spacing

```
Section Padding:        Space 4XL (96px)
Card Padding:           Space L - XL (24-32px)
Component Spacing:      Space L (24px)
Element Spacing:        Space M (16px)
Inline Spacing:         Space S (8px)
```

---

## Component Guidelines

### Cards

**Structure:**
- Border: 1px solid Warm Gray 200
- Border Radius: 12px
- Background: Warm White with warm shadow
- Padding: Space L (24px) to Space XL (32px)
- Hover: Slight lift (-2px translate) with enhanced shadow

**Variants:**
- Default: White background, subtle border
- Elevated: Stronger shadow, no border
- Outlined: Thicker border, no shadow

### Buttons

**Primary:**
- Background: Sunset Orange (#FF6B35)
- Text: White
- Padding: 12px 24px
- Border Radius: 8px
- Hover: Darken 10%, lift 1px

**Secondary:**
- Background: Golden Yellow (#F7B32B)
- Text: Warm Gray 800
- Same sizing as primary
- Hover: Darken 10%, lift 1px

**Outline:**
- Border: 2px solid Sunset Orange
- Text: Sunset Orange
- Background: Transparent
- Hover: Fill with Sunset Orange, text to white

**Ghost:**
- Background: Transparent
- Text: Warm Gray 700
- Hover: Background Warm Gray 100

### Badges/Tags

- Background: Warm Gray 100
- Border: 1px solid Warm Gray 200
- Text: Warm Gray 700
- Padding: 4px 12px
- Border Radius: 16px (pill shape)
- Font Size: Body Small

---

## Layout System

### Grid

- **Desktop:** 12-column grid, 24px gutters
- **Tablet:** 8-column grid, 20px gutters
- **Mobile:** 4-column grid, 16px gutters

### Breakpoints

```
Mobile:       320px - 767px
Tablet:       768px - 1023px
Desktop:      1024px - 1439px
Wide:         1440px+
```

### Max Widths

```
Content:      720px   (Blog posts, articles)
Container:    1200px  (Main layout)
Wide:         1440px  (Full-width sections)
```

---

## Shadows

```
Subtle:       0 1px 3px rgba(74, 52, 38, 0.08)
Warm SM:      0 2px 8px rgba(255, 107, 53, 0.12)
Warm MD:      0 4px 16px rgba(255, 107, 53, 0.15)
Warm LG:      0 8px 24px rgba(255, 107, 53, 0.18)
Warm XL:      0 16px 48px rgba(255, 107, 53, 0.20)
```

---

## Animation

### Timing Functions

```
Ease Out:        cubic-bezier(0.33, 1, 0.68, 1)
Ease In Out:     cubic-bezier(0.65, 0, 0.35, 1)
Spring:          cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Duration

```
Fast:       150ms   (Hover states, small transitions)
Normal:     250ms   (UI interactions)
Slow:       400ms   (Page transitions)
```

### Common Animations

- **Fade In:** Opacity 0 → 1, Duration 250ms
- **Slide Up:** Transform Y(20px) → Y(0), Duration 400ms
- **Hover Lift:** Transform Y(0) → Y(-2px), Duration 150ms
- **Scale:** Transform scale(1) → scale(1.02), Duration 200ms

---

## Markdown Styling Rules

### Headings

```markdown
# H1 — Page Title (Display L, 48px, Bold, Warm Gray 800)
## H2 — Section Heading (Heading 2, 32px, Bold, Warm Gray 700)
### H3 — Subsection (Heading 3, 24px, Semibold, Warm Gray 700)
#### H4 — Minor Heading (Heading 4, 20px, Semibold, Warm Gray 700)
```

### Paragraphs

- Font: Inter Regular, 16px (1rem)
- Color: Warm Gray 700
- Line Height: 1.75 (relaxed)
- Margin Bottom: Space L (24px)

### Links

- Color: Sunset Orange (#FF6B35)
- Hover: Underline, darken 10%
- Visited: Same color (no purple)

### Lists

- Margin Left: Space L (24px)
- Item Spacing: Space S (8px)
- Bullet Color: Sunset Orange

### Code Blocks

- Background: Warm Gray 100
- Border: 1px solid Warm Gray 200
- Padding: Space M (16px)
- Border Radius: 8px
- Font: JetBrains Mono, 14px

### Inline Code

- Background: Warm Gray 100
- Padding: 2px 6px
- Border Radius: 4px
- Font: JetBrains Mono, 14px

### Blockquotes

- Border Left: 4px solid Sunset Orange
- Padding Left: Space L (24px)
- Background: Warm Gray 100
- Font Style: Italic
- Margin: Space L (24px) 0

### Images

- Border Radius: 12px
- Max Width: 100%
- Shadow: Warm SM
- Lazy Loading: Enabled

---

## YAML Front Matter Structure

### Required Fields

```yaml
---
title: "Page or Post Title"
description: "Brief description (150-160 characters)"
publishedAt: "YYYY-MM-DD"
updatedAt: "YYYY-MM-DD"  # Optional
---
```

### Optional Fields

```yaml
category: "Category Name"
tags: ["tag1", "tag2", "tag3"]
featured: true
author: "Isaac Vazquez"
image: "/path/to/image.jpg"
imageAlt: "Image description"
draft: false
```

### SEO Fields

```yaml
seo:
  title: "SEO Optimized Title (60 chars max)"
  description: "SEO description (150-160 chars)"
  keywords: ["keyword1", "keyword2"]
  ogImage: "/path/to/og-image.jpg"
```

---

## File Naming Conventions

- **Pages:** lowercase-with-hyphens.md
- **Blog Posts:** YYYY-MM-DD-post-title.md or post-slug.md
- **Components:** component-name.md
- **Assets:** descriptive-name.jpg (lowercase, hyphens)

---

## Best Practices

1. **Hierarchy:** Always use proper heading order (H1 → H2 → H3)
2. **Spacing:** Generous whitespace between sections
3. **Focus:** One primary CTA per page
4. **Accessibility:** Alt text for all images, semantic HTML
5. **Performance:** Optimize images, lazy load when possible
6. **Consistency:** Use design tokens consistently
7. **Mobile First:** Design for mobile, enhance for desktop

---

## Notes for AI Assistants

When creating or updating Markdown files:

✅ **DO:**
- Use YAML front matter for all content files
- Follow spacing system consistently
- Write in active voice, clear and concise
- Include semantic headings in logical order
- Add alt text to images
- Use proper Markdown syntax

❌ **DON'T:**
- Mix heading levels (e.g., H1 → H3)
- Use inline styles or HTML unnecessarily
- Forget YAML front matter
- Create overly long paragraphs (>4-5 lines)
- Use generic alt text like "image" or "photo"
- Mix different naming conventions

---

**Version:** 1.0.0
**Last Updated:** November 2025
**Maintained By:** Isaac Vazquez
