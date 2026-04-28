# Security Operations Guide

Day-to-day operational and hygiene notes for the live site. For the public vulnerability-disclosure policy, see the root [`SECURITY.md`](../SECURITY.md).

**Last updated:** 2026-04-27

---

## Threat Model At A Glance

This is a personal portfolio site, not a multi-tenant product:

- there is no user registration, no PII storage, no payments, and no per-user data
- the only authenticated surface is `/admin`, gated by a single shared credential pair through NextAuth
- most data is static — committed JSON or TypeScript snapshots — so the runtime attack surface is small
- public API routes are read-only proxies over those snapshots and a handful of third-party services (Finnhub, football-data.org, Resend)

That said, the site is publicly indexed and Isaac is professionally identifiable. Treat anything that could enable phishing, impersonation, or content tampering as in-scope.

---

## Secrets And Environment Variables

Keep secrets in `.env.local` for local development and in the Netlify dashboard for production. Never commit them, paste them into markdown examples, or fixture them into tests.

Active secrets used by the running app and update scripts:

| Variable | Purpose |
|---|---|
| `NEXTAUTH_SECRET` | NextAuth JWT signing key. Generate fresh per environment with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Must match the live deployment hostname (or `http://localhost:3000` in dev). |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Single credential pair for `/admin`. |
| `FOOTBALL_DATA_API_TOKEN` | football-data.org token used by football snapshot scripts. |
| `FINNHUB_API_KEY` | Quote endpoint behind `/api/investments/quotes`. |
| `RESEND_API_KEY` | Transactional email for the MBA internship digest (`/api/mba-jobs/email`). |
| `CRON_SECRET` | Bearer token required by the Netlify `purge-cache` function. |
| `GOOGLE_SITE_VERIFICATION` | Optional; surfaced in metadata for Search Console verification. |
| `SITE_URL` / `NEXT_PUBLIC_SITE_URL` | Canonical site URL for SEO and absolute links. |

Rotation guidance:

- rotate `NEXTAUTH_SECRET`, `ADMIN_PASSWORD`, and `CRON_SECRET` after any suspected exposure or hand-off
- rotate third-party API keys (`FOOTBALL_DATA_API_TOKEN`, `FINNHUB_API_KEY`, `RESEND_API_KEY`) immediately if a key appears in logs, screenshots, or a public commit
- after rotation, verify Netlify env vars and trigger a fresh deploy so the new value is in effect

---

## Admin Access (`/admin`)

- implemented in `src/lib/auth.ts` using NextAuth's credentials provider
- a single `(ADMIN_USERNAME, ADMIN_PASSWORD)` pair is checked against env vars; there is no user store, no password hashing, and no MFA
- session strategy is JWT, 30-day max age
- this is intentionally a lightweight gate, not a full RBAC system

Hardening expectations:

- use a long, random password (24+ chars, password manager generated)
- never reuse this password elsewhere
- if the admin surface ever stores sensitive operations, upgrade to hashed credentials or an OIDC provider before doing so

---

## API Surface

### Operationally protected

- `/api/auth/[...nextauth]` — NextAuth handler for `/admin` sign-in
- `netlify/functions/purge-cache` — requires `Authorization: Bearer <CRON_SECRET>`

### Public, read-only endpoints

These power the live UI. They are cached, rate-limited where appropriate, and must not echo secrets in error responses:

- `/api/search`
- `/api/rss`
- `/api/fantasy-data`
- `/api/stocks`
- `/api/investments/index`
- `/api/investments/data/[symbol]`
- `/api/investments/quotes`
- `/api/premier-league/summary`
- `/api/premier-league/teams/[teamId]`
- `/api/la-liga/summary`
- `/api/la-liga/teams/[teamId]`
- `/api/golf/summary`
- `/api/golf/players/[playerId]`
- `/api/news-pulse`
- `/api/spacex/launches`
- `/api/spacex/launches/[id]`
- `/api/spacex/summary`
- `/api/mba-jobs`

### Public, side-effect endpoints

- `/api/mba-jobs/email` — sends a Resend-backed digest. Validate request shape, never log full email payloads, and rely on Resend's deliverability controls instead of building a bespoke send pipeline.

`/api/search` is still a limited, mostly hardcoded index — do not treat it as comprehensive site search.

There is no `/api/scheduled-update`, `/api/data-manager`, `/api/fantasy-pros-session`, `/api/fantasy-pros-free`, or `/api/scrape` route in the live app. Older docs that reference these are historical.

---

## Logging And Error Handling

- never log raw credentials, bearer tokens, or full provider response payloads at INFO/WARN levels
- redact `Authorization`, `Cookie`, and any `*_KEY`/`*_SECRET` headers before logging request metadata
- scrapers and update scripts should log failures (status code + URL path) without dumping sensitive request headers or full HTML bodies
- in production, `compiler.removeConsole` is on (see `next.config.mjs`); rely on structured Netlify logs rather than ad-hoc `console.*` calls

---

## Dependencies And Supply Chain

- run `npm audit` and review GitHub Dependabot alerts before each release window
- prefer minor/patch upgrades over majors unless a CVE forces it
- pin `next`, `react`, `next-auth`, and any auth-adjacent packages explicitly in `package.json`
- when adding a new dependency, prefer well-maintained packages with TypeScript types and recent releases

---

## Deployment Hygiene

- run `npm run lint`, `npm test`, and `npm run build` before merging anything that touches auth, API routes, or `netlify.toml`
- review `netlify.toml` whenever changing headers, caching, redirects, or build behavior — a misconfigured cache header is the most likely way to leak stale or sensitive data
- verify environment parity between local and Netlify when auth, cron, or third-party keys change
- never add a secret to `netlify.toml` directly; use the Netlify env-var dashboard so values are masked in build logs

---

## Incident Response

If you suspect a leaked secret, defacement, or unauthorized admin access:

1. rotate all related secrets in Netlify and trigger a fresh deploy
2. invalidate active NextAuth sessions by rotating `NEXTAUTH_SECRET`
3. review recent commits and Netlify deploy logs for unexpected changes
4. if the issue was reported externally, follow the disclosure flow in the root [`SECURITY.md`](../SECURITY.md)

---

## Related References

- `SECURITY.md` (repo root) — public vulnerability disclosure policy
- `docs/ENVIRONMENT_CONFIGURATION.md`
- `docs/CRON_SETUP.md`
- `DEPLOYMENT.md`
- `TROUBLESHOOTING.md`
