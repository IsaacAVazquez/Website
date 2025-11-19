# Navigation Bar Component

## Purpose
Primary site navigation providing access to main sections and actions.

---

## Standard Navigation Template

```markdown
**[Isaac Vazquez Logo/Name](/)**

[Home](/) • [About](/about) • [Projects](/projects) • [Blog](/blog) • [Contact](/contact)

[Resume](/Isaac_Vazquez_Resume.pdf) →
```

---

## Desktop Navigation Layout

```
┌────────────────────────────────────────────────────────────┐
│ Isaac Vazquez    Home  About  Projects  Blog  Contact  Resume│
└────────────────────────────────────────────────────────────┘
```

---

## Mobile Navigation Layout

```
┌─────────────────────┐
│ ≡  Isaac Vazquez    │
└─────────────────────┘

[When menu opened]
┌─────────────────────┐
│ ✕  Isaac Vazquez    │
├─────────────────────┤
│ Home                │
│ About               │
│ Projects            │
│ Blog                │
│ Contact             │
│ Resume              │
└─────────────────────┘
```

---

## Floating Navigation Template

```markdown
**Navigation**

🏠 [Home](/)
👤 [About](/about)
💼 [Projects](/projects)
✍️ [Blog](/blog)
📧 [Contact](/contact)
```

---

## Navigation with Sections

```markdown
**Isaac Vazquez**

**Portfolio**
[Projects](/projects) • [Resume](/resume) • [About](/about)

**Content**
[Blog](/blog) • [Writing](/writing) • [Notes](/notes)

**Connect**
[Contact](/contact) • [LinkedIn](https://linkedin.com/in/isaac-vazquez)
```

---

## Active State Indication

```markdown
<!-- Example with visual indicator for current page -->

[Home](/)  <!-- Normal state -->
**[About](/about)**  <!-- Active/current page -->
[Projects](/projects)  <!-- Normal state -->
```

---

## Styling Guidelines

### Desktop Navigation
- **Position:** Fixed top or sticky
- **Background:** Warm Cream (#FFFCF7) with slight transparency
- **Height:** 64-80px
- **Text:** Warm Gray 700, 16px
- **Active Link:** Sunset Orange (#FF6B35), bold
- **Hover:** Sunset Orange with underline

### Mobile Navigation
- **Hamburger Icon:** 44x44px minimum (touch target)
- **Menu Background:** Warm White with shadow
- **Link Spacing:** Space L (24px) between items
- **Animation:** Slide-in from right (250ms)

### Accessibility
- **Focus States:** Visible keyboard focus (2px outline)
- **Skip Navigation:** Hidden skip link for screen readers
- **ARIA Labels:** Proper labeling for menu states
- **Contrast:** WCAG AA minimum (7:1 for small text)

---

## Content Guidelines

### Primary Navigation (5-7 items max)
- Home
- About
- Projects
- Blog/Writing
- Contact

### Secondary Actions
- Resume download
- Newsletter signup
- Search (if applicable)

### Mobile Priority
Order items by importance:
1. Home
2. Projects/Work
3. About
4. Blog
5. Contact
6. Resume

---

## Component Variations

### Minimal Navigation
```markdown
[Isaac Vazquez](/)  •  [Work](/projects)  •  [Writing](/blog)  •  [Contact](/contact)
```

### Navigation with CTA
```markdown
[Isaac Vazquez](/)

[About](/about) • [Projects](/projects) • [Blog](/blog)

**[Get in Touch →](/contact)**
```

### Navigation with Search
```markdown
[Isaac Vazquez](/)

[About](/about) • [Projects](/projects) • [Blog](/blog) • [Contact](/contact)

🔍 [Search](/search)
```

---

## Best Practices

✅ **DO:**
- Keep navigation items to 5-7 max
- Use clear, descriptive labels
- Indicate current page clearly
- Ensure mobile-friendly touch targets (44px min)
- Test keyboard navigation
- Provide visual feedback on hover/focus

❌ **DON'T:**
- Use vague labels like "Services" or "Info"
- Overcrowd with too many items
- Hide important actions in submenus
- Forget sticky/fixed positioning
- Skip mobile testing
- Use only icons without labels

---

## Keyboard Navigation

Essential keyboard shortcuts:
- **Tab:** Navigate through links
- **Shift+Tab:** Navigate backwards
- **Enter:** Activate link
- **Escape:** Close mobile menu
- **Space:** Activate buttons

---

## Implementation Notes

For static site generators:
- Use active class for current page
- Implement smooth scroll for anchor links
- Lazy load navigation JavaScript
- Optimize for Core Web Vitals (CLS, FID)

For component-based frameworks:
- Use routing library for active states
- Implement proper focus management
- Handle scroll position on route change
- Consider using a navigation component library
