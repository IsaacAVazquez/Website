# Environment Configuration Guide

Current environment variable reference for local development and Netlify deployment.

**Last updated:** 2026-06-08

---

## Core Site Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SITE_URL` | recommended | Canonical site URL used in metadata helpers |
| `NEXT_PUBLIC_SITE_URL` | recommended | Public site URL exposed to the client when needed |
| `NODE_ENV` | platform-managed | Runtime environment |

Use the production hostname for both site URL variables.

---

## Admin And Auth

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXTAUTH_URL` | yes for deployed auth flows | Base URL for NextAuth callbacks |
| `NEXTAUTH_SECRET` | yes for auth | Session signing secret |
| `ADMIN_USERNAME` | yes for `/admin` | Credential login username |
| `ADMIN_PASSWORD` | yes for `/admin` | Credential login password |

The admin surface uses credential auth, not a multi-user identity provider.

---

## Fantasy Operations

The current public fantasy workflow is snapshot-backed and does not require local secrets. `npm run update:fantasy` reads public sources and regenerates checked-in artifacts.

There are no live `/api/fantasy-pros-*`, `/api/data-manager`, or `/api/scheduled-update` routes in the current app tree.

---

## Operations

| Variable | Required | Purpose |
| --- | --- | --- |
| `CRON_SECRET` | yes for Netlify cache purge | Bearer token for `netlify/functions/purge-cache.ts` |

---

## Email Digest

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | yes for `/api/mba-jobs/email` | Resend API key used to deliver the MBA jobs digest |
| `MBA_DIGEST_ALLOWED_RECIPIENTS` | yes for `/api/mba-jobs/email` | Comma-separated recipient allowlist; entries can be exact emails or domains such as `@example.edu` |

---

## Sports Data

| Variable | Required | Purpose |
| --- | --- | --- |
| `FOOTBALL_DATA_API_TOKEN` | optional for local dev, optional for runtime, required for `npm run update:football`, `npm run update:premier-league`, and `npm run update:la-liga` | Token used only when rebuilding the checked-in Premier League and La Liga snapshots — not needed at runtime since both dashboards serve from committed snapshot files |

Without this token, the Premier League and La Liga routes still work from the checked-in snapshots. You only need it when you want to refresh those snapshots locally or in GitHub Actions.

---

## Platform-Provided Variables

The code also reads these when available:

- `URL`
- `DEPLOY_URL`
- `DEPLOY_PRIME_URL`
- `VERCEL_URL`

These usually come from the hosting platform and do not need to be set manually for normal local development.

---

## Local Development

Useful local template for broader coverage:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-me
ADMIN_USERNAME=replace-me
ADMIN_PASSWORD=replace-me
CRON_SECRET=replace-me
MBA_DIGEST_ALLOWED_RECIPIENTS=you@example.com,@example.edu
```

Add `RESEND_API_KEY` only if you are testing email delivery. Add `FOOTBALL_DATA_API_TOKEN` only if you are testing `npm run update:football`, `npm run update:premier-league`, or `npm run update:la-liga`.

---

## Netlify

Set production values in the Netlify dashboard. Keep them aligned with:

- `netlify.toml`
- the active custom domain
- the build and cron workflows

If auth, email delivery, cache purge, or data refresh workflows break only in production, verify the deployed env vars before debugging the application code.

---

## Related References

- `DEPLOYMENT.md`
- `docs/SECURITY.md`
- `docs/CRON_SETUP.md`
- `TROUBLESHOOTING.md`
