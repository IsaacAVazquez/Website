# Environment Configuration Guide

Current environment variable reference for local development and Netlify deployment.

**Last updated:** 2026-08-11

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

The fantasy surface reads checked-in snapshots at runtime. `npm run update:fantasy` regenerates those artifacts. `FANTASYPROS_SOURCE=public-html` selects the published-page parser even when an API key exists, while `FANTASYPROS_SOURCE=official-api` requires the key and selects the JSON API. If the source variable is absent or set to `auto`, the builder keeps the older local behavior, which selects the API when a key exists and otherwise uses public HTML. A selected source that fails its response or board checks stops the refresh without changing sources.

| Variable | Required | Purpose |
| --- | --- | --- |
| `FANTASYPROS_SOURCE` | optional for local refreshes, pinned to `public-html` in the scheduled workflow | Build-only choice among `public-html`, `official-api`, and `auto` |
| `FANTASYPROS_API_KEY` | required only for `FANTASYPROS_SOURCE=official-api` | Build-only key sent in the `x-api-key` header for an authenticated refresh |

The scheduled refresh pins `FANTASYPROS_SOURCE=public-html`, does not receive `FANTASYPROS_API_KEY`, and reads the public FantasyPros rankings pages. A copy of the key stored in GitHub or Netlify is not used by that job. The deployed application does not need either variable because it serves the generated JSON files.

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
| `RESEND_API_KEY` | yes for both email endpoints | Resend API key used to deliver the MBA jobs digest and create newsletter contacts |
| `RESEND_NEWSLETTER_SEGMENT_ID` | recommended for `/api/newsletter/subscribe` | Resend segment that receives public newsletter signups; when omitted, signups are created as unsegmented contacts |
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

Add `RESEND_API_KEY` only if you are testing email delivery. Set `FANTASYPROS_SOURCE=official-api` and add `FANTASYPROS_API_KEY` for an authenticated `npm run update:fantasy` refresh. Add `FOOTBALL_DATA_API_TOKEN` only if you are testing `npm run update:football`, `npm run update:premier-league`, or `npm run update:la-liga`.

---

## Netlify

Set runtime production values in the Netlify dashboard. Keep them aligned with:

- `netlify.toml`
- the active custom domain
- the build and cron workflows

GitHub Actions has a separate secret store for snapshot refresh jobs. If a data refresh fails, check the repository's Actions secrets and workflow logs. If auth, email delivery, or cache purge breaks only in production, check the deployed Netlify variables.

---

## Related References

- `DEPLOYMENT.md`
- `docs/SECURITY.md`
- `docs/CRON_SETUP.md`
- `TROUBLESHOOTING.md`
