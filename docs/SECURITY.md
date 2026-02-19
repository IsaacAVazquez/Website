# Security Guide

Key practices that keep the fantasy data platform, automation scripts, and portfolio safe in development and production.

## Environment Variables

- Store local secrets in `.env.local` (never commit). See `docs/ENVIRONMENT_CONFIGURATION.md` for variable names.
- Netlify: configure identical variables in the site dashboard. Regenerate any tokens if the logs show exposure.
- Rotate FantasyPros / third-party API keys every season (scripts alert when the key is older than 180 days).

## API Protection

- Sensitive API routes (`/api/data-manager`, `/api/scheduled-update`, `/api/fantasy-pros*`) validate `X-API-KEY` headers. Keep those secrets outside public code.
- The automation hooks run with Netlify background functions; ensure each request includes an HMAC or signed token when scheduling external triggers.
- Rate limiting is handled by Next.js middleware for `/api/search` and `/api/newsletter` to mitigate spam.

## Data Handling

- SQLite database files (`fantasy-data.db`) stay outside of `public/` and are ignored by git.
- Player images are fetched through signed URLs with fallbacks to local placeholders.
- Scripts under `scripts/` log to stdout only; remove verbose logs containing raw responses before committing.

## Dependency & Build Hygiene

- Run `npm audit` alongside `npm run lint` during CI. Patch high severity issues before deployment.
- Keep Playwright/Jest tests (`npm run test:all`) green to catch API contract changes early.
- Use `npm run build` locally before pushing to ensure TypeScript + ESLint gate the deployment.

For escalation procedures or infrastructure changes, pair this doc with:
- `docs/ENVIRONMENT_CONFIGURATION.md` – secrets + environment handling.
- `DEPLOYMENT_GUIDE.md` – Netlify build/rollback process.
- `TROUBLESHOOTING.md` – quick fixes for the most common misconfigurations.
