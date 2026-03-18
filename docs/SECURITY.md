# Security Guide

Current security and operational-safety notes for the live site.

**Last updated:** 2026-03-17

---

## Secrets And Environment Variables

Keep secrets in `.env.local` for development and in the Netlify dashboard for production.

Primary secrets:

- `NEXTAUTH_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `CRON_SECRET`
- `FANTASYPROS_USERNAME`
- `FANTASYPROS_PASSWORD`

Do not commit these values into markdown examples, scripts, or test fixtures.

---

## Admin Access

- `/admin` uses NextAuth credentials configured in `src/lib/auth.ts`
- access depends on `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `NEXTAUTH_SECRET`
- keep `NEXTAUTH_URL` aligned with the active deployment hostname

This is a lightweight admin gate, not a full RBAC system.

---

## API Surface Notes

### Protected or operational endpoints

- `/api/auth/[...nextauth]`
- `/api/scheduled-update`

`/api/scheduled-update` requires:

- `Authorization: Bearer <CRON_SECRET>`
- server-side environment configuration

### Public endpoints with caution

- `/api/search`
- `/api/fantasy-data`
- `/api/investments/index`
- `/api/investments/data/[symbol]`
- `/api/investments/quotes`
- `/api/stocks`

These are part of the public app surface. Keep them rate-limited, cached where appropriate, and free of secret leakage.

### Internal-operational routes

- `/api/data-manager`
- `/api/fantasy-pros-session`
- `/api/fantasy-pros-free`
- `/api/scrape`

These routes support operational or seasonal workflows. Document them honestly and avoid treating them like polished public product APIs.

---

## Logging And Error Handling

- Do not log raw credentials or bearer tokens
- Be careful with provider response payloads during debug work
- Scrapers and scheduled update flows should log failures without dumping sensitive request headers

---

## Deployment Hygiene

- run `npm run lint`, `npm test`, and `npm run build` before release
- review `netlify.toml` when changing headers, caching, or build behavior
- verify environment parity between local and Netlify when auth or cron behavior changes

---

## Related References

- `docs/ENVIRONMENT_CONFIGURATION.md`
- `docs/CRON_SETUP.md`
- `DEPLOYMENT.md`
- `TROUBLESHOOTING.md`
