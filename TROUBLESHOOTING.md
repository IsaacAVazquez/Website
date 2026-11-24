# Troubleshooting Guide

Fast diagnostics for the current site, data workflows, and deployment path.

**Last updated:** 2026-11-24

---

## Install And Build Problems

### `npm install` fails

- Confirm Node 22.12 or newer, which the `engines` field in `package.json` requires (`.nvmrc` pins major version 22), and npm 10+
- Remove `node_modules` and retry

### `npm run build` fails

- Run `npm run lint` and `npm run typecheck` first, the two checks the Tests workflow runs beside the build
- Check for App Router metadata or async `params` mistakes in page files
- Confirm route-local imports are not pulling server-only code into client components
- A build downloads the site's fonts through `next/font/google` (`src/app/layout.tsx`, `src/app/fantasy-football/layout.tsx`, and `src/app/arcade/page.tsx`), so it fails with no network and can fail when that download times out
- On repeated builds, if webpack fails inside cached symlink context hashing (`_resolveContextTsh` / `WasmHash`), ensure content hash checks are configured for production snapshots (`next.config.mjs`)

### `npm run dev` boots but pages crash

- A missing environment variable turns off the feature that reads it at request time. Without its key, `/api/investments/quotes` answers with an error quote (`FINNHUB_API_KEY`), the transit routes use BART's demo key (`BART_API_KEY`), newsletter signup answers that it is unavailable (`RESEND_CONTACTS_API_KEY` or `RESEND_API_KEY`), and the job search tracker marks Adzuna leads as off (`ADZUNA_APP_ID` and `ADZUNA_APP_KEY`). `docs/ENVIRONMENT_CONFIGURATION.md` lists the rest. A placeholder left in `.env.local` from `.env.example` counts as set, so the code uses it as a real value. The MBA email route was deleted on 2026-10-20, so nothing reads `RESEND_FROM_EMAIL`, and `.env.example` no longer lists it
- Confirm recent docs or content edits did not introduce malformed frontmatter or markdown

---

## Environment And Auth

### `/api/job-search` returns `404` or `409`

- `404` is expected in production. In development the route answers only a server started with plain `npm run dev`, whose launcher binds to `localhost` and turns private sync on, so a server started with `next dev` directly, with a hostname flag, or with `JOB_SEARCH_PRIVATE_SYNC=0` also answers `404`, and so does a request whose Host header is not `localhost`, `127.0.0.1`, or `[::1]`, or whose Origin is another site. In those servers the tracker page doesn't call the route at all, so a 404 there comes from a request made some other way.
- `409 Conflict` occurs when the file on disk has changed since the client's last read. The 409 body carries the file's current contents, so the client hook retries the save once without another read. For the pipeline it first merges that copy into `localStorage` (newer `updatedAt` wins), and for candidates it replays the edit on that copy.
- `400` means a save was malformed or would have lost records to the parser, and nothing was written.
- A `500` whose server log says a file "is not valid JSON" means a hand edit broke `pipeline.json` or `candidates.json`. Nothing reads it as empty or replaces it until it is fixed by hand.
- `503` means another writer held `private/job-search/.write.lock` for the whole wait. A lock left by a process that was killed clears itself on the next save once it is two seconds old.

The cache purge function and its `CRON_SECRET` were removed on 2026-09-28, since the function had no caller. The `/api/scheduled-update` route was deleted on 2026-04-22, so older references to that endpoint are historical. There is no authenticated surface to troubleshoot, since the `/admin` page and NextAuth were removed on 2026-10-02.

---

## Data Issues

### Investments data looks stale or missing

- The curated UI reads from `public/data/investments`
- Rebuild snapshots with `npm run update:investments`, which needs the Python 3.12 `.venv` described in `DEVELOPMENT.md`
- Curated snapshot data is served directly from static files under `public/data/investments/{SYMBOL}/snapshot.json`, and the index is the static file `public/data/investments/index.json`. The `/api/investments/index` route was deleted on 2026-08-11 and `/api/investments/data/[symbol]` on 2026-10-02, so mentions of either are historical
- Each scheduled run of `update-investments.yml` (Tuesday through Saturday at 08:30 UTC) fully fetches only the symbols its time budget reaches, so some symbols carry older sections beside a current price. The run still commits, but it fails and opens an issue labeled `investments-refresh-failure` once any symbol is more than 21 days past its last full fetch

### Search results look incomplete

`/api/search` scores each query word as a substring of the title, excerpt, category, tags, and indexed text of three sources in `src/app/api/search/route.ts`. Those are the full text of every published article (since 2026-10-09), the case studies in `src/constants/caseStudies.ts`, and a hand-written `STATIC_PAGES` list with extra terms in `SEARCH_KEYWORDS`. It does not crawl the site, so a page that is not an article and has neither a case study nor a `STATIC_PAGES` row never appears in results.

### Fantasy football data looks inconsistent

The public fantasy surface is snapshot-backed:

- `public/data/fantasy/{ppr,half_ppr,standard}.json` contains the published scoring-format snapshots, and `best-ball.json` and `weekly.json` beside them hold the best ball board and the in-season weekly board
- `src/data/fantasyPositionData.generated.json` contains the generated position data, typed by `fantasyPositionData.generated.ts` beside it
- `src/data/fantasySnapshotRevision.generated.ts` controls client cache busting, since the redraft boards are fetched with `?v=<revision>`
- `/api/fantasy-data` reads the same public snapshot files through `src/lib/fantasySnapshotServer.ts`

Rebuild the generated artifacts with `npm run update:fantasy`, which runs `update:fantasy:redraft`, `update:fantasy:best-ball`, and `update:fantasy:weekly` in turn. The scheduled `update-fantasy.yml` run commits the weekly board, the redraft boards, and the best ball board separately, each once its own build and checks pass, so one board can be newer than another. Any lane that fails turns the run red and opens or updates a GitHub issue labeled `fantasy-refresh-failure`. The `/api/fantasy-pros-*`, `/api/data-manager`, `/api/data-metadata`, `/api/sample-data`, and `/api/scheduled-update` routes were deleted on 2026-04-22.

### Premier League or La Liga data looks stale

- The public dashboards read from `src/data/premierLeagueSnapshot.json` and `src/data/laLigaSnapshot.json`
- Rebuild both with `npm run update:football`
- Rebuild one league with `npm run update:premier-league` or `npm run update:la-liga`
- These rebuild commands need `FOOTBALL_DATA_API_TOKEN`; runtime page loads do not
- `update-premier-league.yml` and `update-la-liga.yml` refresh each league every four hours from August through May and have no schedule in June or July. A failed run leaves the committed snapshot in place and opens or updates a GitHub issue labeled `premier-league-refresh-failure` or `la-liga-refresh-failure`, which the next passing run closes

---

## UI And Layout Problems

### A page is too narrow or spacing looks wrong

`src/components/ConditionalLayout.tsx` passes the seven designed Catalog 97 routes through and wraps every other route in `Catalog97ToolShell`. The only width it decides is the shell's. A route in `WIDE_TOOL_ROUTES` (`src/constants/catalog97Nav.ts`) is marked `data-c97-wide`, and every `.c97-shell` on it, header and footer included, widens from `--c97-container` (1080px) to `--c97-container-wide` (1376px). Everything else comes from the route's own markup or from the `.c97-*` classes in `src/app/catalog97.css`, so a dense tool that prints too narrow may be missing from `WIDE_TOOL_ROUTES`.

### Footer CTA feels duplicated

There is one footer on this site, the espresso footer inside `Catalog97Shell`, and every route gets it either directly or through `Catalog97ToolShell`. The old `Footer.tsx` and its contact CTA were deleted on 2026-09-16.

If a page ends with its own strong CTA, verify it is not stacking against the footer. `e2e/footer-cta.spec.ts` checks for exactly one site footer on Home, Contact, Portfolio, and a writing detail page.

### March Madness, football dashboards, or investments has horizontal scrolling

Recheck:

- tab button widths
- chart container overflow
- bracket region grids
- fixture/table containers
- mobile viewport behavior in Playwright

`node scripts/layoutSweep.mjs <baseUrl> <route>` against a running server flags page and element overflow at phone, tablet, laptop, and big-monitor sizes, and `e2e/layoutChecks.ts` runs the cheaper part of that check in CI.

---

## Deployment Problems

### Netlify build behaves differently from local

- Compare local `npm run build` output with `netlify.toml`
- The build command in `netlify.toml` runs `npm run build` and then deletes `.next/standalone/*/public/data`, `node_modules/@img`, and `node_modules/sharp`
- Production is not built by Netlify's git integration. `.github/workflows/publish-data.yml` builds and uploads it from GitHub Actions with `netlify deploy --prod`, which runs that build command with the site's Netlify environment variables, so a production build failure shows in that workflow's log and in a GitHub issue labeled `data-publication-failure`. `scripts/ci/netlify-ignore.sh` cancels Netlify's own builds for `main` and `dependabot/*` branches, and human pull requests still get a Netlify deploy preview
- Make sure required env vars are present in the Netlify dashboard

### A refreshed snapshot is committed but not live

Refresh commits carry `[skip ci]`, so they do not start `publish-data.yml`. Committed data reaches production at the next scheduled run (01:15, 07:15, 13:15, and 19:15 UTC), on the next push to `main` without `[skip ci]`, or from a manual `workflow_dispatch` run. `/api/data-revisions` on the live site reports `deploymentCommit`, the commit the deploy was built from, and for each surface its `sourceAsOf` time and a `status` of `fresh`, `degraded`, `stale-fallback`, or `unavailable`.

Polling Aggregator and Frontier Models take fresh data without a commit, through the Netlify scheduled functions in `netlify/functions/`, which write their snapshots to the `dashboard-snapshots` Netlify Blobs store. The two pages serve that blob while it is newer than the committed seed and inside its age limit, so production can run ahead of the repo, and off Netlify they serve the seed. `/api/data-revisions` reports the committed seed for both. A failed function run shows in Netlify's function logs and opens no GitHub issue, while `update-polling.yml`, which keeps the committed polling seed current, opens one labeled `polling-refresh-failure` when it fails.

### Sitemap or metadata output looks wrong

- `npm run build` runs `postbuild`, which runs `npm run generate:sitemap`, then `npm run build:llms`, then `scripts/patch-nft-sharp.mjs`
- check `scripts/generatePublicSitemap.mjs` and `src/lib/sitemap.js`, which lists every `page.tsx` under `src/app` except dynamic, `noindex`, and redirect-only pages, adds the published posts and the writing topic pages, lists no case study that has a `link` (every case study in `src/constants/caseStudies.ts` on 2026-11-02, since `/portfolio/<slug>` only redirects to the tool), and dates each static route from `STATIC_ROUTE_LASTMOD` (a route missing there gets the build date and a build warning)
- if `src/lib/__tests__/sitemap-consistency.test.ts` fails, the committed `public/sitemap.xml` no longer matches `src/lib/sitemap.js`. Give any route the build warned about a `STATIC_ROUTE_LASTMOD` row, since a build-time timestamp never matches the test's own run, then run `npm run generate:sitemap` and commit the result
- check `constructMetadata` in `src/lib/seo.ts`, which the root layout and nearly every route build their metadata with, and the route's own `metadata` or `generateMetadata` export. `src/app/metadata.ts` holds only the homepage's metadata

---

## References

- `DEVELOPMENT.md`
- `API.md`
- `docs/ENVIRONMENT_CONFIGURATION.md`
- `docs/FANTASY_PLATFORM_SETUP.md`
- `docs/CRON_SETUP.md`
