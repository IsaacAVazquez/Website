# Styling System Documentation

## Overview

The Isaac Vazquez Digital Platform uses a **Cyberpunk Professional** design system that combines futuristic aesthetics with accessibility and professional polish. The styling is built on Tailwind CSS v4 with extensive custom configurations, CSS custom properties, and Framer Motion animations.

---

## Color Palette

### Primary Cyberpunk Colors

```css
--electric-blue: #00F5FF      /* Primary accent, headings, links */
--matrix-green: #39FF14       /* Secondary accent, highlights, success states */
--warning-amber: #FFB800      /* Warnings, attention items */
--error-red: #FF073A          /* Errors, critical states */
--neon-purple: #BF00FF        /* Tertiary accent, special effects */
--cyber-teal: #00FFBF         /* Additional accent color */
```

### Terminal Interface Colors

```css
--terminal-bg: #0A0A0B        /* Dark backgrounds, cards */
--terminal-border: #1A1A1B    /* Subtle borders */
--terminal-text: #00FF00      /* Terminal-style text */
--terminal-cursor: #00F5FF    /* Cursor and active states */
```

### Professional Neutrals

```css
--slate-900: #0F172A          /* Darkest backgrounds */
--slate-800: #1E293B
--slate-700: #334155
--slate-600: #475569
--slate-400: #94A3B8          /* Mid-tone text */
--slate-200: #E2E8F0
--slate-50: #F8FAFC           /* Lightest backgrounds */
```

### Light Mode Accessible Colors

For WCAG AA compliance on light backgrounds:

```css
--electric-blue-light: #0066CC
--matrix-green-light: #228B22
--cyber-teal-light: #20B2AA
--neon-purple-light: #8B008B
--error-red-light: #D62D20
```

### Usage in Tailwind

```tsx
<div className="bg-terminal-bg border-electric-blue text-matrix-green">
  <h1 className="text-cyber-teal">Cyberpunk Heading</h1>
</div>
```

---

## Typography System

### Font Families

The platform uses three primary typefaces:

#### **Orbitron** - Headings & Display Text
- Weights: 600, 700, 800
- Usage: All headings (h1-h6), cyberpunk text
- Variable: `--font-orbitron`
- CSS class: `font-heading`

```tsx
<h1 className="font-heading text-4xl">ISAAC VAZQUEZ</h1>
```

#### **Inter** - Body Text
- Weights: 400, 500, 600
- Usage: Paragraphs, UI text, general content
- Variable: `--font-inter`
- Default font for body

```tsx
<p className="font-sans text-base">Regular paragraph text</p>
```

#### **JetBrains Mono** - Code & Terminal
- Weights: 400, 500
- Usage: Terminal interfaces, code blocks, monospace text
- Variable: `--font-jetbrains-mono`
- CSS class: `font-mono`, `font-terminal`

```tsx
<code className="font-mono">const code = true;</code>
<div className="font-terminal">$ whoami</div>
```

### Fluid Typography Scale

Uses `clamp()` for responsive sizing:

```css
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)
--text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem)
--text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem)
--text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem)
--text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)
--text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem)
--text-3xl: clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)
--text-4xl: clamp(2.25rem, 1.75rem + 2.5vw, 3rem)
--text-5xl: clamp(3rem, 2rem + 5vw, 4rem)
```

### Typography Utility Classes

```css
.heading-hero      /* Giant hero headings with gradient */
.heading-display   /* Large display headings */
.text-cyber        /* Uppercase cyberpunk style */
.gradient-text     /* Electric blue → matrix green → purple gradient */
.terminal-text     /* Matrix green terminal style with glow */
.glitch-text       /* Animated glitch effect */
```

### Typography Best Practices

- **Line height**: 1.7 for body text (improved readability)
- **Letter spacing**: 0.05em-0.1em for headings (cyberpunk aesthetic)
- **Max width**: 75ch for long-form content (optimal reading)
- **Paragraph spacing**: 1em bottom margin

---

## Glassmorphism System

### 5-Tier Elevation System

```css
.elevation-1  /* Subtle depth - subtle shadows */
.elevation-2  /* Default cards - moderate depth */
.elevation-3  /* Featured cards - noticeable elevation */
.elevation-4  /* Modal/overlay - significant depth */
.elevation-5  /* Maximum elevation - dominant elements */
```

### Base Glass Card Styling

```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
```

### Dark Mode Adjustments

```css
.dark .glass-card {
  background: rgba(17, 17, 17, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

### Interactive Glass Effects

```css
.glass-interactive:hover {
  transform: translateY(-4px) scale(1.02);
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### Component Usage

```tsx
import { GlassCard } from "@/components/ui/GlassCard";

<GlassCard
  elevation={3}           // 1-5 depth
  interactive={true}       // Hover/click effects
  cursorGlow={true}        // Cursor-following glow
  noiseTexture={true}      // Subtle noise overlay
  floating={true}          // Floating animation
  className="p-6"
>
  Card content
</GlassCard>
```

---

## Animation System

### Framer Motion Integration

All animations use Framer Motion for physics-based, accessible animations.

### Standard Transitions

```css
--transition-fast: 150ms ease
--transition-standard: 300ms ease
--transition-slow: 600ms ease
--easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
--easing-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

### Built-in Animations

#### Float Animation
```css
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-6px) rotate(1deg); }
  66% { transform: translateY(2px) rotate(-1deg); }
}
.floating { animation: float 6s ease-in-out infinite; }
```

#### Gradient Shift
```css
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.gradient-mesh { animation: gradient-shift 8s ease infinite; }
```

#### Breathing Gradient
```css
@keyframes breathe {
  0%, 100% { background-size: 100% 100%; opacity: 0.8; }
  50% { background-size: 120% 120%; opacity: 1; }
}
.breathing-gradient { animation: breathe 4s ease-in-out infinite; }
```

#### Spring Entrance
```css
@keyframes spring-in {
  0% { opacity: 0; transform: scale(0.8) translateY(20px); }
  50% { opacity: 1; transform: scale(1.05) translateY(-5px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.spring-enter { animation: spring-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
```

### Framer Motion Patterns

#### Staggered Children
```tsx
<motion.div
  initial="hidden"
  whileInView="visible"
  variants={{
    visible: {
      transition: { staggerChildren: 0.1 }
    }
  }}
>
  {items.map((item) => (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
```

#### Hover Effects
```tsx
<motion.div
  whileHover={{ scale: 1.05, y: -4 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  Interactive element
</motion.div>
```

---

## Button System

### Morph Button (Primary Style)

Gradient button with 3D perspective transform:

```css
.morph-button {
  background: linear-gradient(135deg, var(--electric-blue), var(--matrix-green));
  border: 1px solid var(--electric-blue);
  border-radius: 12px;
  padding: 12px 24px;
  color: var(--terminal-bg);
  font-weight: 600;
  transform: perspective(1000px) rotateX(0deg);
  box-shadow: 0 0 20px rgba(0, 245, 255, 0.2);
}

.morph-button:hover {
  transform: perspective(1000px) rotateX(-5deg) translateY(-2px);
  box-shadow:
    0 12px 24px rgba(0, 245, 255, 0.4),
    0 0 30px rgba(57, 255, 20, 0.3);
}
```

Usage:
```tsx
<Link href="/resume" className="morph-button">
  VIEW RESUME
</Link>
```

### Dark Morph Button Variant

For use on bright backgrounds:

```css
.morph-button-dark {
  background: linear-gradient(135deg, var(--terminal-bg), var(--slate-800));
  border: 1px solid var(--electric-blue);
  color: var(--electric-blue);
}

.morph-button-dark:hover {
  background: linear-gradient(135deg, var(--electric-blue), var(--matrix-green));
  color: var(--terminal-bg);
}
```

---

## Glow Effects

### Predefined Glows

```css
--glow-electric: 0 0 20px rgba(0, 245, 255, 0.3)
--glow-matrix: 0 0 20px rgba(57, 255, 20, 0.3)
--glow-purple: 0 0 20px rgba(191, 0, 255, 0.3)
--glow-amber: 0 0 20px rgba(255, 184, 0, 0.3)
--glow-subtle: 0 0 15px rgba(0, 245, 255, 0.2)
```

### Glow Utility Classes

```css
.cyber-glow { box-shadow: var(--glow-electric); }
.glow-effect:hover { box-shadow: var(--glow-subtle); }
.glow-matrix:hover { box-shadow: var(--glow-matrix); }
.glow-purple:hover { box-shadow: var(--glow-purple); }
```

### Cursor-Following Glow

```css
.cursor-glow::before {
  background: radial-gradient(
    600px circle at var(--cursor-x, 50%) var(--cursor-y, 50%),
    rgba(0, 245, 255, 0.1) 0%,
    transparent 70%
  );
}
```

Implemented in GlassCard component with cursor tracking.

---

## Accessibility Features

### Focus Indicators

All interactive elements have visible focus states:

```css
*:focus-visible {
  outline: 2px solid var(--electric-blue);
  outline-offset: 2px;
  border-radius: 4px;
}

button:focus-visible,
a:focus-visible {
  outline: 3px solid var(--electric-blue);
  outline-offset: 3px;
  box-shadow: 0 0 20px rgba(0, 245, 255, 0.4);
}
```

### Reduced Motion Support

Respects user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .floating,
  .breathing-gradient,
  .morph-button,
  .glass-interactive {
    animation: none !important;
    transform: none !important;
  }
}
```

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  :root {
    --electric-blue: #0052A3;
    --matrix-green: #1A5D1A;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid currentColor;
  }
}
```

### Skip Links

```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### Screen Reader Only Text

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## Responsive Design

### Breakpoints

```typescript
// Tailwind breakpoints
sm: 640px   // Small devices (landscape phones)
md: 768px   // Medium devices (tablets)
lg: 1024px  // Large devices (laptops)
xl: 1280px  // Extra large devices (desktops)
```

### Mobile-First Approach

All styling uses mobile-first responsive design:

```tsx
<div className="p-4 sm:p-6 md:p-8 lg:p-10">
  {/* Padding scales: 16px → 24px → 32px → 40px */}
</div>

<h1 className="text-3xl sm:text-4xl md:text-5xl">
  {/* Font size scales: 48px → 56px → 64px */}
</h1>
```

### Responsive Utilities

```tsx
// Container width
<div className="max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl">

// Spacing
<div className="space-y-6 sm:space-y-8 md:space-y-10">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Typography
<p className="text-sm sm:text-base md:text-lg">
```

---

## Special Effects

### Noise Texture Overlay

Adds subtle grain to glass cards:

```css
.noise-texture::after {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,...");
  mix-blend-mode: overlay;
  pointer-events: none;
  opacity: 0.03;
}
```

### Gradient Mesh Backgrounds

```css
.gradient-mesh {
  background:
    radial-gradient(circle at 20% 80%, var(--electric-blue) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, var(--matrix-green) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, var(--neon-purple) 0%, transparent 50%);
  background-size: 400% 400%;
  animation: gradient-shift 8s ease infinite;
}
```

### Glitch Text Effect

```tsx
<span className="glitch-text" data-text="GLITCH">
  GLITCH
</span>
```

Creates RGB offset glitch animation using ::before and ::after pseudo-elements.

---

## Terminal Styling

### Terminal Scrollbar

Custom scrollbar for terminal interfaces:

```css
.terminal-scroll::-webkit-scrollbar {
  width: 6px;
}

.terminal-scroll::-webkit-scrollbar-thumb {
  background: var(--electric-blue);
  border-radius: 3px;
  border: 1px solid var(--terminal-border);
}

.terminal-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--matrix-green);
  box-shadow: 0 0 8px rgba(0, 245, 255, 0.3);
}
```

### Terminal Fade Effects

```css
.terminal-content::before {
  background: linear-gradient(to bottom, var(--terminal-bg), transparent);
}

.terminal-content::after {
  background: linear-gradient(to top, var(--terminal-bg), transparent);
}
```

---

## Text Selection

Custom text selection styling:

```css
::selection {
  background: rgba(0, 245, 255, 0.3);
  color: var(--slate-900);
}
```

---

## Dark Mode

### Implementation

Dark mode is class-based and respects system preferences:

```tsx
// In layout.tsx
<script>
  const theme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (theme === 'dark' || (!theme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
</script>
```

### Dark Mode Overrides

```css
.dark {
  --bg-primary: rgba(10, 10, 11, 0.95);
  --bg-secondary: rgba(15, 23, 42, 0.9);
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --electric-blue: #00D4FF;
  --matrix-green: #00FF41;
}
```

---

## Usage Examples

### Complete Card Example

```tsx
<GlassCard
  elevation={3}
  interactive={true}
  cursorGlow={true}
  noiseTexture={true}
  className="p-6 bg-terminal-bg/50 border-electric-blue/30"
>
  <Heading level={2} className="text-cyber text-electric-blue mb-4">
    CYBERPUNK HEADING
  </Heading>
  <Paragraph className="text-slate-300">
    Body text with proper contrast and readability.
  </Paragraph>
  <Link href="/action" className="morph-button mt-4">
    TAKE ACTION
  </Link>
</GlassCard>
```

### Animated Section

```tsx
<motion.section
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
  className="max-w-4xl mx-auto"
>
  <GlassCard elevation={2} className="p-8">
    <h2 className="gradient-text text-4xl mb-6">
      FEATURED CONTENT
    </h2>
    {/* Content */}
  </GlassCard>
</motion.section>
```

---

## Performance Considerations

### Font Loading Strategy

```typescript
// In layout.tsx
const inter = Inter({
  display: "swap",      // Show fallback font immediately
  preload: true,        // Preload critical font
});

const orbitron = Orbitron({
  display: "swap",
  preload: false,       // Load on-demand for headings
});
```

### Animation Performance

- Use `will-change` sparingly
- Prefer `transform` and `opacity` for animations
- Use `requestAnimationFrame` for scroll effects
- Throttle/debounce scroll handlers to ~60fps

### Reduced Motion

All animations automatically disabled when user prefers reduced motion.

---

## Tailwind Configuration

Custom Tailwind config extends the color system:

```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      "electric-blue": "var(--electric-blue)",
      "matrix-green": "var(--matrix-green)",
      "neon-purple": "var(--neon-purple)",
      // ... etc
    },
    animation: {
      'float': 'float 6s ease-in-out infinite',
      'gradient-shift': 'gradient-shift 8s ease infinite',
    }
  }
}
```

---

## Related Documentation

- [Component Library](./COMPONENT_LIBRARY.md) - UI component usage
- [Layout System](./LAYOUT_SYSTEM.md) - Layout patterns
- [Page Architecture](./PAGE_ARCHITECTURE.md) - Page structure
- [Contemporary UI Design Systems](./CONTEMPORARY_UI_DESIGN_SYSTEMS.md) - Design trends

---

**Last Updated:** October 2025
**Maintained By:** Isaac Vazquez
