# Project Card Component

## Purpose
Compact, visual representation of a project for use in project listings, portfolio grids, and featured work sections.

---

## Standard Project Card Template

```markdown
### [Project Title]
**[Role or Category]**

![Project Screenshot](/project-screenshots/project-name.png)

[Brief description of the project (1-2 sentences highlighting the problem and solution)]

**Key Outcomes:**
- [Primary metric or achievement]
- [Secondary metric or achievement]
- [Tertiary achievement or impact]

**Technologies:** [Tech1, Tech2, Tech3]

[View Details →](/projects/project-slug)
```

---

## Example: Featured Project Card

```markdown
### TextOut Platform
**Product Vision & User Research**

![TextOut Platform Screenshot](/project-screenshots/textout-platform.png)

Owned end-to-end product vision for peer-to-peer texting platform used by political campaigns. Drove product strategy through user research and data-driven feature prioritization.

**Key Outcomes:**
- 35% engagement increase through UX improvements
- 90% reduction in client onboarding time via GCP automation
- Transformed data accessibility for campaign teams

**Technologies:** GCP, Data Analytics, User Research Tools

[View Full Case Study →](/projects/textout-platform)
```

---

## Example: Compact Project Card

```markdown
### Fantasy Football Analytics
**AI-Powered Analytics Platform**

Built production-ready analytics platform processing millions of data points for real-time player insights.

**Stack:** Next.js, D3.js, SQLite, TypeScript
**Impact:** Demonstrates AI/ML implementation patterns

[Explore Platform →](/fantasy-football)
```

---

## Example: List-Style Project Card

```markdown
**RunningMate Platform Launch** — Led successful platform launch by translating stakeholder feedback into user stories. Reduced critical defects by 90%, increased NPS from 23 to 36. [View Details →](/projects/runningmate-platform)
```

---

## Card Variations

### Grid Layout (3 columns)
Best for project portfolio pages with many projects

```
+-------------------+  +-------------------+  +-------------------+
| Project Image     |  | Project Image     |  | Project Image     |
|                   |  |                   |  |                   |
| Title             |  | Title             |  | Title             |
| Description       |  | Description       |  | Description       |
| [CTA]             |  | [CTA]             |  | [CTA]             |
+-------------------+  +-------------------+  +-------------------+
```

### Featured Layout (Full Width)
Best for highlighting 1-2 most important projects

```
+----------------------------------------------------------+
| Image (Left 50%)      | Content (Right 50%)              |
|                       | Title                            |
|                       | Description                      |
|                       | Outcomes                         |
|                       | [CTA]                            |
+----------------------------------------------------------+
```

### List Layout (Stacked)
Best for chronological or category-organized lists

```
Project 1 ────────────────────────────────────────────────
Project 2 ────────────────────────────────────────────────
Project 3 ────────────────────────────────────────────────
```

---

## Content Guidelines

**Title:**
- Clear and specific (not generic)
- 3-6 words ideal
- Use proper case

**Description:**
- 1-2 sentences max
- Focus on problem → solution
- Emphasize impact

**Outcomes:**
- 2-4 bullet points
- Use specific metrics when possible
- Lead with numbers

**Technologies:**
- List 3-5 key technologies
- Most important first
- Use official names (React, not react)

---

## Styling Guidelines

- **Card Background:** Warm White (#FFFFFF)
- **Border:** 1px solid Warm Gray 200
- **Border Radius:** 12px
- **Padding:** Space L (24px)
- **Image Border Radius:** 8px
- **Hover Effect:** Lift (-2px) with enhanced shadow
- **CTA Link:** Sunset Orange with arrow →

---

## Best Practices

✅ **DO:**
- Use high-quality project screenshots
- Include specific metrics and outcomes
- Keep descriptions concise
- Use consistent card sizing
- Optimize images for web

❌ **DON'T:**
- Use generic stock photos
- Write lengthy descriptions
- Skip the call-to-action
- Mix different image aspect ratios
- Forget alt text
