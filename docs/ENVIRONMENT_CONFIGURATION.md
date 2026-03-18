# Environment Configuration Guide

Current environment variable reference for local development and Netlify deployment.

**Last updated:** 2026-03-17

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

| Variable | Required | Purpose |
| --- | --- | --- |
| `CRON_SECRET` | yes for scheduled updates | Bearer token for `/api/scheduled-update` |
| `FANTASYPROS_USERNAME` | optional for public pages, required for session refresh flows | FantasyPros login |
| `FANTASYPROS_PASSWORD` | optional for public pages, required for session refresh flows | FantasyPros login |
| `FANTASY_API_KEY` | optional | Legacy or experimental fantasy integrations |

Public fantasy pages can still function without every FantasyPros credential because not every fantasy path depends on that provider.

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

Recommended minimum local set:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-me
ADMIN_USERNAME=replace-me
ADMIN_PASSWORD=replace-me
CRON_SECRET=replace-me
```

Add FantasyPros credentials only if you are testing session-backed fantasy refreshes.

---

## Netlify

Set production values in the Netlify dashboard. Keep them aligned with:

- `netlify.toml`
- the active custom domain
- the build and cron workflows

If auth or scheduled updates break only in production, verify the deployed env vars before debugging the application code.

---

## Related References

- `DEPLOYMENT.md`
- `docs/SECURITY.md`
- `docs/CRON_SETUP.md`
- `TROUBLESHOOTING.md`
