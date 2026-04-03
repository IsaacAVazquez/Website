# Redirects & Navigation — AI Context

Current nav model, redirect table, and shell notes.

**Last updated:** 2026-04-03

---

## Global Navigation

Defined in `src/constants/navlinks.tsx`.

Current header items:

| Label | href |
|------|------|
| Home | `/` |
| About | `/about` |
| Projects | `/portfolio` |
| Writing | `/writing` |
| Investments | `/investments` |
| Resume | `/resume` |
| Contact | `/contact` |

---

## Header Behavior

`src/components/StaticHeader.tsx` provides:

- sticky header
- desktop nav
- mobile menu
- active-link detection
- theme toggle in desktop and mobile views

Active route logic is straightforward:

- `/` matches exactly
- other items match exact route or nested path prefix

---

## Footer Behavior

`src/components/Footer.tsx` supports:

- `full`
- `compact`

Current route logic in `ConditionalLayout`:

- compact footer on `/` and `/contact`
- full footer on most other routes

This is part of the one-primary-CTA-per-page cleanup.

---

## Redirects

Defined in `next.config.mjs`.

### Portfolio and writing

- `/projects` -> `/portfolio`
- `/work` -> `/portfolio`
- `/projects/:path*` -> `/portfolio/:path*`
- `/blog` -> `/writing`
- `/blog/:slug` -> `/writing/:slug`
- `/blog/posts/:slug` -> `/writing/:slug`
- `/articles/:slug` -> `/writing/:slug`

### Investments

- `/portfolio/investment-analytics-platform` -> `/investments`

### Contact and resume aliases

- `/get-in-touch` -> `/contact`
- `/hire-me` -> `/contact`
- `/cv` -> `/resume`
- `/resume.pdf` -> `/Isaac_Vazquez_Resume.pdf`

### Fantasy shortcuts

- `/ff`
- `/rankings`
- `/qb`
- `/rb`
- `/wr`
- `/te`
- typo-correction routes for fantasy-football

---

## Important Accuracy Notes

- `/portfolio` is the canonical projects route
- `/writing` is the canonical writing route
- `Projects` is the public-facing nav label even though the route stays `/portfolio`
- `Writing` is again a promoted global-nav item
