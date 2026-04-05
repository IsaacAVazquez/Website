# Dark Mode - Quick Reference Card

> [!IMPORTANT]
> Historical reference only. This file documents an older theme implementation. For the current styling system, start with `STYLING.md` and `src/app/globals.css`.

## 🎨 Color Variables Reference

### Most Common Variables

```css
/* Text */
var(--text-primary)      /* Main text - auto-adapts */
var(--text-secondary)    /* Secondary text */
var(--text-tertiary)     /* Tertiary text */

/* Backgrounds */
var(--surface-primary)   /* Main background */
var(--surface-secondary) /* Elevated surface */

/* Brand Colors */
var(--color-primary)     /* Claude orange */
var(--color-secondary)   /* Darker orange-brown */
var(--color-accent)      /* Deep brown */

/* Borders */
var(--border-primary)    /* Main borders */
var(--border-accent)     /* Accent borders */

/* Shadows */
var(--shadow-primary)    /* Default shadow */
var(--shadow-elevated)   /* Elevated shadow */
```

## 🚀 Quick Usage Examples

### Basic Components

```tsx
// Button
<button className="bg-primary text-white hover:bg-secondary">
  Click me
</button>

// Card
<div className="bg-surface-primary border border-[var(--border-primary)] shadow-primary">
  Content
</div>

// Text
<p className="text-[var(--text-primary)]">
  Text that adapts to theme
</p>
```

### Tailwind Classes

```tsx
// Using Tailwind's theme colors
<div className="bg-primary text-neutral-800 dark:text-neutral-100">

// Using neutral scale
<div className="bg-neutral-50 dark:bg-neutral-900">

// Hover states
<button className="hover:bg-primary hover:text-white">
```

## 🎯 Color Palette

### Light Mode
- **Primary**: `#D97756` (Claude orange)
- **Secondary**: `#AD6047` (Dark orange-brown)
- **Accent**: `#764534` (Deep brown)
- **Text**: `#3D2821` (Dark warm brown)
- **Background**: `#FFFFFF` (White)

### Dark Mode
- **Primary**: `#F5A582` (Light Claude orange)
- **Secondary**: `#C97D60` (Light orange-brown)
- **Text**: `#F5EDE8` (Light warm cream)
- **Background**: `#2B1A14` (Warm dark brown)

## 🔧 Common Patterns

### Full-Width Section
```tsx
<section className="bg-surface-secondary py-16">
  <div className="container mx-auto">
    <h2 className="text-4xl font-bold text-[var(--text-primary)]">
      Heading
    </h2>
  </div>
</section>
```

### Card with Hover
```tsx
<div className="
  p-6 rounded-lg
  bg-surface-primary
  border border-[var(--border-primary)]
  hover:shadow-elevated
  transition-all duration-300
">
  Content
</div>
```

### Link with Theme
```tsx
<a className="
  text-primary
  hover:text-secondary
  underline
  transition-colors
">
  Link
</a>
```

## 📱 Theme Toggle Location

Already integrated in header:
```
Header → ThemeToggle component → Top right corner
```

## 🧪 Testing Theme

1. Open dev tools console
2. Test theme switching:
```js
// Switch to dark
document.documentElement.classList.add('dark');

// Switch to light
document.documentElement.classList.remove('dark');

// Check current theme
localStorage.getItem('theme'); // 'light' | 'dark' | 'system'
```

## ✅ Accessibility Checklist

- [x] WCAG AA contrast ratios
- [x] 44px minimum tap targets
- [x] Keyboard navigation
- [x] ARIA labels
- [x] Screen reader support
- [x] Reduced motion support
- [x] No theme flash

## 🎨 Neutral Scale (Auto-adapting)

```
neutral-50  → Lightest (cream in light, darkest in dark)
neutral-100 → Very light
neutral-200 → Light
neutral-300 → Medium-light
neutral-400 → Medium
neutral-500 → Medium-dark
neutral-600 → Dark
neutral-700 → Very dark
neutral-800 → Darkest text (Claude brown)
neutral-900 → Darkest background
neutral-950 → Absolute darkest
```

## 🚨 Remember

- Always test in **both light and dark modes**
- Use CSS variables for colors that should adapt
- Check contrast with browser dev tools
- Test with keyboard navigation
- Verify smooth transitions

## 📝 Need More Help?

See full documentation:
- `DARK_MODE_USAGE_GUIDE.md` - Complete guide
- `CLAUDE_THEME_UPDATE.md` - Implementation details
- `src/components/ui/ThemeToggle.tsx` - Component code
- `src/app/globals.css` - All color variables
