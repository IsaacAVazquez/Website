# Getting Started

This project is a Next.js 15 (App Router) application with Tailwind CSS, TypeScript, and a sizeable data layer for fantasy-football tooling. Follow the steps below to run it locally.

## 1. Prerequisites

- **Node.js** v18 or later (the site runs on Node 18+ in production).
- **npm** 10+ (comes with Node). Yarn/PNPM work too, but the repo is committed with `package-lock.json`.
- Optional: **SQLite** if you plan to work with the fantasy data scripts (`fantasy-data.db`).

## 2. Install Dependencies

```bash
npm install
```

This pulls the full Next.js stack, Tailwind, Playwright, Jest, and the data tooling packages listed in `package.json`.

## 3. Environment Variables

Copy `.env.example` (if present) to `.env.local` and fill in any API keys for optional integrations (FantasyPros, Supabase, etc.). The site runs without them, but some dynamic routes and API endpoints will fallback to sample data.

```bash
cp .env.example .env.local
# then edit .env.local
```

## 4. Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the local dev server with webpack HMR. |
| `npm run build` | Creates a production build (runs `next build`). |
| `npm run start` | Serves the production build locally. |
| `npm run lint` | Runs `next lint`. |
| `npm run test` | Executes the Jest unit tests. |
| `npm run test:e2e` | Runs the Playwright smoke tests. |

## 5. Project Structure

```text
src/app/           # App Router pages (Next.js 15)
src/components/    # Reusable UI (Tailwind + Framer Motion)
src/data/          # Fantasy football datasets and transforms
src/lib/           # Utilities (SEO helpers, FAQ data, etc.)
content/           # MD/MDX content for the CMS-style sections
docs/              # Deep-dive documentation (automation, schema, etc.)
public/            # Static assets (icons, resume PDF, sitemap)
```

## 6. Working With Data + Scripts

- Scripts live in `scripts/` and can be run with `tsx`.
- Key automation entry points: `scripts/updateFantasyRBTiers.ts`, `scripts/nfl-roster-scraper.js`, etc.
- The automation docs under `docs/` explain scheduling, cron jobs, and clean up tasks.

## 7. Deployment Notes

- Production builds target **Netlify** (`npm run build` + `next start`).
- `next-sitemap` runs in a post-build step to refresh sitemap/robots metadata.
- Image optimization + ISR is handled automatically by Next.js in production.

Need more depth? Check `DEVELOPMENT.md` for local environment details and `DEPLOYMENT_GUIDE.md` for the production pipeline.
