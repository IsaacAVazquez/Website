# Performance & Accessibility

**Last updated:** 2026-06-25
**Companion to:** `PERFORMANCE.md`, `ACCESSIBILITY_AUDIT.md`, `SEO.md`, `DESIGN_CHECKLIST.md`

Speed and accessibility are 2026 baseline expectations, not polish. They also compound:
faster, more stable pages rank better and convert better (sites passing all three Core Web
Vitals see meaningfully lower bounce). This page sets the targets and the highest-leverage
fixes; the existing `PERFORMANCE.md` and `ACCESSIBILITY_AUDIT.md` hold implementation status.

---

## Targets at a glance

| Metric | Good | What it measures | Notes |
| --- | --- | --- | --- |
| **LCP** (Largest Contentful Paint) | < 2.5s | Loading — when the main content appears | Hardest CWV to pass; only ~62% of mobile pages hit it |
| **INP** (Interaction to Next Paint) | < 200ms | Responsiveness across *all* interactions | Most-failed CWV in 2026 (~43% of sites miss it); replaced FID |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Visual stability — unexpected layout jumps | Fixable with explicit dimensions |
| **Lighthouse** (all categories) | 90+ | Lab proxy across perf/a11y/best-practices/SEO | 90+ is Google's "good" bar |
| **WCAG** | 2.2 AA | Accessibility conformance | The 2026 baseline expectation |

---

## LCP — the four highest-impact fixes

LCP is usually the hero image or the largest hero text block. In priority order:

1. **Preload the LCP image** and serve it in a modern format (AVIF/WebP) at the right size.
   Use `next/image` with `priority` on the hero; don't lazy-load the LCP element.
2. **Inline critical CSS** and keep render-blocking resources off the head.
3. **Preload fonts with `font-display: swap`.** Prevents invisible text delaying paint.
4. **Server-render the above-the-fold content** (App Router default — keep hero content in a
   server component; don't hydrate the hero behind a client boundary that delays it).

**This site:** Next.js 16 App Router gives SSR by default. The risk is regressions — a hero
that becomes a client component, an un-prioritized hero image, or a heavy animation library
in the critical path. Guard the hero specifically.

---

## INP — responsiveness (the 2026 problem child)

INP measures *every* interaction, so it punishes main-thread blocking anywhere.

- **Don't ship `transition-all`** on shared primitives (also a `STYLING.md` rule) — transition
  specific properties so the compositor, not layout, does the work.
- **Keep handlers light;** defer non-urgent work, break up long tasks, avoid synchronous
  layout thrash in scroll/hover handlers.
- **Respect `useReducedMotion()`** in Framer Motion — JS/rAF animation runs on the main
  thread and can hurt INP even when CSS motion is reduced.
- **Be wary of heavy client islands** (large D3 renders, big tables) on interaction-heavy
  pages — virtualize or chunk where needed. The dashboards are the place to watch.

---

## CLS — visual stability

CLS is the most mechanically fixable CWV: **reserve space for everything that loads late.**

- Every `img`, `video`, `iframe`, chart container, and ad/embed slot needs **explicit
  width/height** (or aspect-ratio). `next/image` enforces this — use it.
- **`font-display: swap`** + matched fallback metrics to avoid reflow on web-font swap.
- **Reserve space for async/dynamic content** (snapshot-driven dashboards, late data) so a
  late fetch doesn't shove the layout. Render skeletons at final dimensions.
- Never inject content above existing content after paint.

---

## Accessibility — WCAG 2.2 AA baseline

2026 treats accessibility as reach, not compliance overhead. The essentials:

- **Semantic HTML first.** One page-level `main` landmark per self-shell route (owned by
  `ConditionalLayout` here); leaf sections use `section`/`div`, never a nested `main`. Exactly
  one page-level `h1`. Headings nest in order.
- **Keyboard operability.** Every interactive element reachable and operable by keyboard, in a
  logical order. Test a full keyboard-only pass.
- **Visible focus states.** Don't remove focus outlines — style them to match the editorial
  system. (WCAG 2.2 adds focus-appearance and target-size criteria.)
- **Contrast.** Meet AA contrast in *both* themes — use the editorial tokens and the semantic
  status tokens (`--home-positive/-negative/-warning`); verify dark mode separately.
- **Touch targets ≥ 44px** (WCAG 2.2 target-size; already a `STYLING.md` rule).
- **`prefers-reduced-motion`** honored for every animated component — and remember the CSS
  guard does **not** stop JS/Framer motion, so gate those in code with `useReducedMotion()`.
- **Alt text** that conveys meaning; empty `alt=""` for purely decorative images.
- **Forms** (contact, tools): real `<label>`s, programmatic error association, focus moved to
  errors.
- **Test with a screen reader and with keyboard only** — automated tools catch perhaps half.

---

## Where this intersects the snapshot-driven dashboards

The dominant pattern here (15+ dashboards: snapshot → builder → action → API) is performance-
and stability-friendly *if you keep the discipline*:

- **No external calls at request time** — routes read committed snapshots. Preserve this; a
  runtime fetch would wreck LCP and reliability.
- **Render skeletons at final dimensions** so fail-soft/late data doesn't cause CLS.
- **When adding a new data dashboard,** drop in its `error.tsx` (per `CLAUDE.md`) and confirm
  the chart resolves token colors at render time (theme correctness) and reserves layout space
  (CLS).

---

## Pre-ship perf/a11y checklist

Run alongside `DESIGN_CHECKLIST.md`:

- [ ] Hero is server-rendered; LCP image uses `next/image` + `priority`, modern format.
- [ ] Fonts preloaded with `font-display: swap`.
- [ ] All media and chart/embed containers have explicit dimensions (CLS).
- [ ] No `transition-all` on shared primitives; handlers don't block the main thread (INP).
- [ ] Every animation honors `useReducedMotion()` / `prefers-reduced-motion`.
- [ ] One `main`, one `h1`, ordered headings; full keyboard pass works; focus visible.
- [ ] AA contrast verified in **both** light and dark.
- [ ] Touch targets ≥ 44px.
- [ ] New dashboards: `error.tsx` present, skeleton at final dimensions, tokens resolved at
      render time, no request-time external calls.
- [ ] Lighthouse 90+ across categories on the changed route.

---

## Sources

- [Core Web Vitals 2026: INP, LCP, CLS Optimization Guide — Senorit](https://senorit.de/en/blog/core-web-vitals-2026)
- [Core Web Vitals Guide 2026 — W3era](https://www.w3era.com/blog/seo/core-web-vitals-guide/)
- [The Most Important Core Web Vitals Metrics in 2026 — NitroPack](https://nitropack.io/blog/most-important-core-web-vitals-metrics/)
- [Core Web Vitals 2026: INP, LCP & CLS — Digital Applied](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide)
- [Top Web Design Trends for 2026 (accessibility) — Figma](https://www.figma.com/resource-library/web-design-trends/)
