# Isaac Vazquez — Portfolio & Fantasy Football Analytics

Personal website and fantasy football analytics platform for Isaac Vazquez,
Technical Product Manager & UC Berkeley Haas MBA Candidate.

**Live:** https://isaacavazquez.com

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Animation | Framer Motion |
| Charts | D3.js |
| Database | SQLite (better-sqlite3, server-only) |
| Auth | NextAuth.js |
| Deployment | Netlify + @netlify/plugin-nextjs |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file at the project root (see [Environment Variables](#environment-variables) below).

### 3. Start the dev server

```bash
npm run dev
# → http://localhost:3000
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (webpack mode) |
| `npm run build` | Production build + sitemap |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run analyze` | Bundle size analysis |
| `npm test` | Unit tests (Jest) |
| `npm run test:watch` | Jest watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run test:ci` | CI mode (parallel, with coverage) |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:e2e:debug` | Playwright debug mode |
| `npm run test:all` | Coverage + E2E |
| `npm run update:fantasy-rb` | Refresh fantasy football RB tier data |
| `npm run update:investments` | Refresh investment data (Python) |

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages & API routes
│   ├── page.tsx      # Home
│   ├── portfolio/    # Project showcase
│   ├── fantasy-football/  # FF landing + tier pages + draft tracker
│   ├── investments/  # Stock research & portfolio tracker
│   ├── writing/      # Blog / writing
│   ├── resume/
│   ├── about/
│   └── api/          # API routes
├── components/       # React components
│   ├── ui/           # Design system primitives
│   └── investments/  # Investment page components
├── constants/        # Static data (nav, projects, career timeline)
├── hooks/            # Custom React hooks
├── lib/              # Utilities, data layer, fantasy football logic
└── types/            # TypeScript type definitions

public/               # Static assets (images, resume PDF)
scripts/              # Data update scripts
netlify/functions/    # Netlify serverless functions
e2e/                  # Playwright E2E tests
docs/                 # Extended technical documentation
```

---

## Environment Variables

Create a `.env.local` file with the following:

```env
# Required for /admin dashboard
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random secret>
ADMIN_USERNAME=<username>
ADMIN_PASSWORD=<password>

# Required for live fantasy football data
FANTASYPROS_USERNAME=<email>
FANTASYPROS_PASSWORD=<password>
CRON_SECRET=<random secret>

# Optional
NEXT_PUBLIC_GA_ID=<google analytics id>
SITE_URL=https://isaacavazquez.com
```

Production secrets are configured in the Netlify dashboard, not committed to the repo.

---

## Deployment

Deployed to **Netlify** via the `@netlify/plugin-nextjs` plugin.

- Build command: `npm run build`
- Publish directory: `.next`
- The `postbuild` script auto-generates the sitemap after each build

---

## Features

### Portfolio
- Home, About, Resume, and Contact pages
- Project showcase at `/portfolio`
- Writing / blog at `/writing`

### Fantasy Football Analytics
- Live tier rankings for QB, RB, WR, TE, K, DST, and Flex at `/fantasy-football`
- D3-powered tier charts with clustering (Gaussian mixture models)
- Draft tracker at `/fantasy-football/draft-tracker`
- Automated FantasyPros data pipeline with SQLite persistence

### Investments
- Stock research interface at `/investments`
- Fundamentals, growth, valuation, DCF, news, and transcripts panels
