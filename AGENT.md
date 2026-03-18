# AGENT.md

Short operational context for agents working in this repo. Use this first, then read `CLAUDE.md` for fuller context.

**Last updated:** 2026-03-17

---

## Project Snapshot

This repo is a Next.js 16 personal site that combines:

- a portfolio and resume site
- a fantasy football analytics product
- a public investment research workspace
- a seasonal March Madness analysis experience

Primary live routes:

- `/`
- `/about`
- `/portfolio` and `/portfolio/[slug]`
- `/investments`
- `/writing` and `/writing/[slug]`
- `/resume`
- `/contact`
- `/fantasy-football/*`
- `/march-madness-2026`
- `/search`
- `/admin`

`/projects` redirects to `/portfolio`.
`/blog` redirects to `/writing`.

---

## Current Navigation

The promoted site nav is:

1. `Home`
2. `About`
3. `Projects`
4. `Investments`
5. `Resume`
6. `Contact`

`Writing` is a live route but is not in the global header.

---

## Shell Behavior

- `src/app/layout.tsx` is the root server layout.
- `src/components/StaticHeader.tsx` is always rendered above page content.
- `src/components/ConditionalLayout.tsx` controls route-level shell behavior and footer variant selection.
- `src/components/Footer.tsx` supports:
  - `full` footer for most pages
  - `compact` footer on `/` and `/contact`

Self-shell routes currently include:

- `/about`
- `/contact`
- `/investments`
- `/march-madness-2026`
- `/portfolio`
- `/writing`

Those routes manage more of their own spacing instead of using the default constrained wrapper.

---

## Critical Rules

- Never hardcode hex colors in components. Use CSS variables from `src/app/globals.css`.
- Never import `@tabler/icons-react` in server components. Use `@/components/ui/ServerIcons`.
- Never import `better-sqlite3` into client code.
- Never create real pages at `/projects` or `/blog`.
- Keep 44px minimum touch targets for interactive elements.
- Respect `prefers-reduced-motion` for Framer Motion usage.
- Use `apply_patch` for manual file edits.

---

## Live Source Of Truth Files

- `README.md` — project overview and setup
- `CLAUDE.md` — deeper repo context
- `PAGES.md` — route inventory
- `COMPONENTS.md` — component ownership and live usage
- `ARCHITECTURE.md` — system overview
- `API.md` — API routes
- `DEVELOPMENT.md` — day-to-day setup and workflow
- `TESTING.md` — Jest and Playwright expectations
- `STYLING.md` — tokens, layout helpers, and styling rules
- `docs/README.md` — documentation index and archive guidance

---

## Key Commands

```bash
npm run dev
npm run build
npm test
npm run test:e2e
npm run update:fantasy-rb
npm run update:investments
```

---

## Current Caveats

- `/api/search` is still limited and mostly hardcoded; do not describe it as full-site search.
- Some older docs, plans, and content templates are preserved for history only. Check `docs/README.md` before treating a markdown file as current.
- `ProjectsContent.tsx` and `WritingPreview.tsx` still exist in the repo but are not the primary live path for the current homepage or `/portfolio`.
