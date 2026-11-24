# Security Operations Guide

Day-to-day operational and hygiene notes for the live site. For the public vulnerability-disclosure policy, see the root [`SECURITY.md`](../SECURITY.md).

**Last updated:** 2026-11-24

---

## Threat Model At A Glance

This is a personal portfolio site, not a multi-tenant product:

- there is no user registration, no PII storage, no payments, and no per-user data
- there is no authenticated surface; the `/admin` page and NextAuth were removed on 2026-10-02
- most data is static and uses committed JSON or TypeScript snapshots, so the runtime attack surface is small
- most public API routes and pages read those snapshots, and a few call a third-party service at request time, namely Finnhub for quotes, BART for the transit summary and station boards, USGS for the earthquake summary, the news feeds behind `/news-pulse` and `/api/news-pulse`, the job boards behind `/mba-internship-notifications` and `/api/mba-jobs`, and Resend for newsletter signups
- two Netlify scheduled functions fetch VoteHub polls and the models.dev and OpenRouter model catalogs into Netlify Blobs, which `/polling-aggregator` and `/frontier-models` render

That said, the site is publicly indexed and Isaac is professionally identifiable. Treat anything that could enable phishing, impersonation, or content tampering as in-scope.

---

## Secrets And Environment Variables

Keep secrets in `.env.local` for local development, in the Netlify dashboard for deployed runtime functions, and in GitHub Actions for scheduled snapshot jobs. Never commit them, paste them into markdown examples, or fixture them into tests.

Active secrets used by the running app and update scripts:

| Variable | Purpose |
|---|---|
| `FOOTBALL_DATA_API_TOKEN` | football-data.org token used by football snapshot scripts. |
| `FINNHUB_API_KEY` | Quote endpoint behind `/api/investments/quotes`. |
| `RESEND_CONTACTS_API_KEY` | Contact-management key that `/api/newsletter/subscribe` reads first when it creates a newsletter contact. |
| `RESEND_API_KEY` | Fallback key for contact creation on the public newsletter signup when `RESEND_CONTACTS_API_KEY` is unset. |
| `NETLIFY_AUTH_TOKEN` | GitHub Actions secret that `publish-data.yml` uses to build and deploy production and to check the published deploy. |
| `NETLIFY_BUILD_HOOK` | Optional GitHub Actions secret that `update-article-images.yml` posts to after it commits new covers. |
| `PRODUCTION_DATA_REVISION_URL` | Optional GitHub Actions secret that replaces the default ledger URL `publish-data.yml` polls after a deploy. Its value is a URL. |
| `BART_API_KEY` | Optional BART key read by `src/lib/bayAreaTransitData.ts` and the transit refresh. Without it the code uses BART's published demo key. |
| `SPACEDEVS_API_TOKEN` | Optional Launch Library 2 token for `src/lib/spacexData.ts` and the SpaceX snapshot builders. |
| `THE_ODDS_API_KEY` / `API_FOOTBALL_KEY` | Score pools provider keys read by `scripts/buildScorePoolsSnapshot.ts`. |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | Optional Adzuna credentials for external job leads in `src/lib/mbaJobsServer.ts`. |
| `RESEND_NEWSLETTER_SEGMENT_ID` | Optional Resend segment used to keep public newsletter signups grouped separately. |
| `GOOGLE_SITE_VERIFICATION` | Optional; surfaced in metadata for Search Console verification. |
| `SITE_URL` / `NEXT_PUBLIC_SITE_URL` | Canonical site URL for SEO and absolute links. |

Rotation guidance:

- rotate any key in the table above immediately if it appears in logs, screenshots, or a public commit
- after rotation, verify the relevant secret store. For a runtime key, redeploy by running `publish-data.yml` from the Actions tab, since Netlify does not build `main` itself, and for a snapshot credential, rerun the affected GitHub Actions job

---

## API Surface

### Public, read-only endpoints

These power the live UI. Most send cache headers on success, while `/api/data-revisions` answers `no-store` because the publish check reads it. Three are rate-limited per client, namely `/api/fantasy-data`, `/api/investments/quotes`, and `/api/mba-jobs`. None of the routes below may echo a secret in an error response:

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

- `/api/newsletter/subscribe` creates a Resend contact from the public newsletter form. It allows five attempts per client IP an hour, answers a filled `company` honeypot field with a silent success, and validates that the parsed JSON payload is a non-null, non-array object before inspecting fields, returning HTTP 400 for malformed input.
- `/api/job-search` is strictly development-only. It answers only when `NODE_ENV` is `development` and the server came from plain `npm run dev`, whose launcher binds to `localhost` and sets `JOB_SEARCH_PRIVATE_SYNC=1`, and it also requires a loopback Host header and, when one is sent, a matching Origin. It returns 404 in production and in every other case. It accesses only the gitignored `private/job-search/` directory to sync personal application and candidate state with local files, ensuring private job search data is never exposed in deployed builds.

Every per-client rate limit comes from `src/lib/rateLimit.ts`, which keeps its counts in memory inside each function instance, so a limit starts over when Netlify starts a new instance and is not shared between instances.

`/api/search` is a limited index. It covers the published posts, the case studies, and a short hand-written table of pages, and none of the dashboards' data. It uses `Object.hasOwn` on dictionary lookups to prevent prototype pollution from inherited properties like `constructor`. Do not treat it as complete site search.

There is no `/api/scheduled-update`, `/api/data-manager`, `/api/fantasy-pros-session`, `/api/fantasy-pros-free`, or `/api/scrape` route in the live app. Older docs that reference these are historical.

---

## Client-Side Input Validation And DOM Safety

- validate user-controlled or restored storage data against strict patterns (for example, investment symbols via `isValidSymbol` in `src/lib/investmentSymbol.ts`, which accepts one to ten characters matching `^[A-Z][A-Z0-9]*([.-][A-Z0-9]+)*$`) before persistence, quote requests, or rendering
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
- `.github/dependabot.yml` opens version-update pull requests every Monday for npm, GitHub Actions, and the Python packages under `scripts/`
- prefer minor/patch upgrades over majors unless a CVE forces it
- `react` and `react-dom` are pinned to exact versions in `package.json`, while `next` carries a caret range, so `package-lock.json` and `npm ci` are what hold `next` to one version
- when adding a new dependency, prefer well-maintained packages with TypeScript types and recent releases

---

## Deployment Hygiene

- run `npm run lint`, `npm test`, and `npm run build` before merging anything that touches API routes, `src/proxy.ts`, `next.config.mjs`, or `netlify.toml`
- review `netlify.toml`, `next.config.mjs` (its `headers()`, `redirects()`, and `cdnCachedPages`), and `src/proxy.ts` whenever changing headers, caching, redirects, or build behavior, because a misconfigured cache header is the most likely way to leak stale or sensitive data
- verify the correct secret store when a deploy or third-party key changes. Runtime keys belong in Netlify, while scheduled snapshot credentials and `NETLIFY_AUTH_TOKEN` belong in GitHub Actions, and a key both use, such as `BART_API_KEY`, goes in both
- the enforcing `Content-Security-Policy` is built in `src/proxy.ts` for every path except `_next/static`, `_next/image`, `favicon.ico`, and `api/`, and it adds the Google Analytics hosts only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is a valid `G-` ID. `next.config.mjs` sends a `Content-Security-Policy-Report-Only` policy and the other security headers on every path, API routes included, and `src/__tests__/proxy.test.ts` holds the framing and geolocation policies in the two files together
- never add a secret to `netlify.toml` directly; use the Netlify env-var dashboard so values are masked in build logs

---

## Incident Response

If you suspect a leaked secret or defacement:

1. rotate all related secrets in Netlify or GitHub Actions, then publish a fresh deploy by running `publish-data.yml` from the Actions tab
2. review recent commits, the `publish-data.yml` run logs, and the Netlify deploy logs for unexpected changes
3. if the issue was reported externally, follow the disclosure flow in the root [`SECURITY.md`](../SECURITY.md)

---

## Related References

- `SECURITY.md` in the repo root contains the public vulnerability disclosure policy
- `docs/ENVIRONMENT_CONFIGURATION.md`
- `docs/CRON_SETUP.md`
- `DEPLOYMENT.md`
- `TROUBLESHOOTING.md`
