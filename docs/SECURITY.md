# Security Operations Guide

Day-to-day operational and hygiene notes for the live site. For the public vulnerability-disclosure policy, see the root [`SECURITY.md`](../SECURITY.md).

**Last updated:** 2026-10-07

---

## Threat Model At A Glance

This is a personal portfolio site, not a multi-tenant product:

- there is no user registration, no PII storage, no payments, and no per-user data
- there is no authenticated surface; the `/admin` page and NextAuth were removed on 2026-10-02
- most data is static and uses committed JSON or TypeScript snapshots, so the runtime attack surface is small
- public API routes are read-only proxies over those snapshots and a handful of third-party services (Finnhub, football-data.org, Resend)

That said, the site is publicly indexed and Isaac is professionally identifiable. Treat anything that could enable phishing, impersonation, or content tampering as in-scope.

---

## Secrets And Environment Variables

Keep secrets in `.env.local` for local development, in the Netlify dashboard for deployed runtime functions, and in GitHub Actions for scheduled snapshot jobs. Never commit them, paste them into markdown examples, or fixture them into tests.

Active secrets used by the running app and update scripts:

| Variable | Purpose |
|---|---|
| `FOOTBALL_DATA_API_TOKEN` | football-data.org token used by football snapshot scripts. |
| `FINNHUB_API_KEY` | Quote endpoint behind `/api/investments/quotes`. |
| `RESEND_API_KEY` | Transactional email for the MBA internship digest and contact creation for the public newsletter signup. |
| `RESEND_NEWSLETTER_SEGMENT_ID` | Optional Resend segment used to keep public newsletter signups grouped separately. |
| `MBA_DIGEST_ALLOWED_RECIPIENTS` | Comma-separated email/domain allowlist for `/api/mba-jobs/email`, for example `name@example.com,@example.edu`; use `*` only if the public relay risk is intentional. |
| `MBA_DIGEST_SECRET` | Shared secret required by `/api/mba-jobs/email` in the `x-mba-digest-secret` header. A browser cannot hold it, so the caller has to be a server or a scheduled job. |
| `GOOGLE_SITE_VERIFICATION` | Optional; surfaced in metadata for Search Console verification. |
| `SITE_URL` / `NEXT_PUBLIC_SITE_URL` | Canonical site URL for SEO and absolute links. |

Rotation guidance:

- rotate `MBA_DIGEST_SECRET` after any suspected exposure or hand-off
- rotate third-party API keys (`FOOTBALL_DATA_API_TOKEN`, `FINNHUB_API_KEY`, `RESEND_API_KEY`) immediately if a key appears in logs, screenshots, or a public commit
- after rotation, verify the relevant secret store. Redeploy for runtime keys and rerun the affected GitHub Actions job for snapshot credentials

---

## API Surface

### Operationally protected

- `/api/mba-jobs/email` requires the `x-mba-digest-secret` header to match `MBA_DIGEST_SECRET`, compared in constant time, and answers `503` while that variable is unset. The recipient allowlist still applies after the secret passes

### Public, read-only endpoints

These power the live UI. They are cached, rate-limited where appropriate, and must not echo secrets in error responses:

- `/api/search`
- `/api/rss`
- `/api/fantasy-data`
- `/api/data-revisions`
- `/api/investments/quotes`
- `/api/premier-league/teams/[teamId]`
- `/api/la-liga/teams/[teamId]`
- `/api/mlb/teams/[teamId]`
- `/api/nba/teams/[teamId]`
- `/api/nfl/teams/[teamId]`
- `/api/world-cup/teams/[teamId]`
- `/api/golf/players/[playerId]`
- `/api/formula-1/meetings/[meetingId]`
- `/api/bay-area-transit/summary`
- `/api/bay-area-transit/stations/[stationId]`
- `/api/earthquake-pulse/summary`
- `/api/news-pulse`
- `/api/spacex/launches`
- `/api/spacex/launches/[id]`
- `/api/spacex/summary`
- `/api/mba-jobs`

### Public, side-effect endpoints

- `/api/mba-jobs/email` sends a Resend-backed digest. It validates and escapes request content, caps digest size, rate-limits by client, and only sends to `MBA_DIGEST_ALLOWED_RECIPIENTS`.
- `/api/newsletter/subscribe` creates a Resend contact from the public newsletter form. It validates that the parsed JSON payload is a non-null object before inspecting fields, returning HTTP 400 for malformed input.
- `/api/job-search` is strictly development-only (`process.env.NODE_ENV === "development"`). It returns 404 in production and any non-development environment. It accesses only the gitignored `private/job-search/` directory to sync personal application and candidate state with local files, ensuring private job search data is never exposed in deployed builds.

`/api/search` is still a limited, mostly hardcoded index. It uses `Object.hasOwn` on dictionary lookups to prevent prototype pollution from inherited properties like `constructor`. Do not treat it as complete site search.

There is no `/api/scheduled-update`, `/api/data-manager`, `/api/fantasy-pros-session`, `/api/fantasy-pros-free`, or `/api/scrape` route in the live app. Older docs that reference these are historical.

---

## Client-Side Input Validation And DOM Safety

- validate user-controlled or restored storage data against strict patterns (for example, investment symbols via `isValidInvestmentSymbol` matching `^[A-Z0-9.\-]{1,10}$`) before persistence, quote requests, or rendering
- build tooltips, dynamic labels, and chart annotations using safe DOM primitives (`document.createTextNode` or `element.textContent`), never direct `innerHTML` string interpolation with user data

---

## Logging And Error Handling

- never log raw credentials, bearer tokens, or full provider response payloads at INFO/WARN levels
- redact `Authorization`, `Cookie`, and any `*_KEY`/`*_SECRET` headers before logging request metadata
- scrapers and update scripts should log failures (status code + URL path) without dumping sensitive request headers or full HTML bodies
- in production, `compiler.removeConsole` strips `console.log`, `console.info`, and `console.debug` and keeps `console.error` and `console.warn` (see `next.config.mjs`), so anything passed to those two reaches the Netlify logs and the visitor's browser console, and the rules above apply to every call to them

---

## Dependencies And Supply Chain

- run `npm audit` and review GitHub Dependabot alerts before each release window
- prefer minor/patch upgrades over majors unless a CVE forces it
- pin `next` and `react` explicitly in `package.json`
- when adding a new dependency, prefer well-maintained packages with TypeScript types and recent releases

---

## Deployment Hygiene

- run `npm run lint`, `npm test`, and `npm run build` before merging anything that touches auth, API routes, or `netlify.toml`
- review `netlify.toml` whenever changing headers, caching, redirects, or build behavior because a misconfigured cache header is the most likely way to leak stale or sensitive data
- verify the correct secret store when auth, cron, or third-party keys change. Runtime keys belong in Netlify, while scheduled snapshot credentials belong in GitHub Actions
- never add a secret to `netlify.toml` directly; use the Netlify env-var dashboard so values are masked in build logs

---

## Incident Response

If you suspect a leaked secret or defacement:

1. rotate all related secrets in Netlify and trigger a fresh deploy
2. review recent commits and Netlify deploy logs for unexpected changes
3. if the issue was reported externally, follow the disclosure flow in the root [`SECURITY.md`](../SECURITY.md)

---

## Related References

- `SECURITY.md` in the repo root contains the public vulnerability disclosure policy
- `docs/ENVIRONMENT_CONFIGURATION.md`
- `docs/CRON_SETUP.md`
- `DEPLOYMENT.md`
- `TROUBLESHOOTING.md`
