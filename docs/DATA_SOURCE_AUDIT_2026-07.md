# Data Source Audit — July 2026 (fix backlog)

Point-in-time audit of every data pipeline on the site, run 2026-07-05 by a
93-agent sweep (one code auditor, one source-research pass, and adversarial
verification per surface). This is the running backlog. Check items off as they
land. Findings were verified against code and, for the source recommendations,
against the live APIs on 2026-07-05.

The plumbing is genuinely good (atomic writes, fail-soft fallbacks, quality
gates, the shared commit helper). What the audit found sitting on top of it was
a lot of silent breakage, one systemic delivery flaw, and a handful of verified
source upgrades worth taking.

Status legend: `[ ]` open · `[x]` done · `[~]` in progress · `[U]` needs a human
(secret/approval I can't do from code).

## 2026-07-20 live-data migration wave

A follow-up architecture pass concluded the snapshot philosophy is right for
rate-limited upstreams but the git-commit-plus-rebuild transport is the weak
part, and shipped eight PRs against it. Statuses below are updated where these
land on audit items; the wave also introduced two things the audit did not
anticipate:

- **The blob-backed refresh lane** (Netlify scheduled function → the
  `dashboard-snapshots` Blobs store → cache-tag purge, committed seed as
  fallback). Piloted on frontier-models (PR #329) and polling (PR #331, stacked
  on #329). Pattern doc: `../SNAPSHOT_DRIVEN_DASHBOARDS.md`.
- **A deliberate decision against Next ISR** on this runtime (documented bug
  history in `opennextjs-netlify`): the API tier instead opts into Netlify's
  durable CDN cache via shared header helpers (PR #327).

The wave: #325 earthquake live-first (merged 2026-07-20); #326 BART_API_KEY
env support; #327 durable CDN caching; #328 MLB request-time live scoreboard;
#329 frontier-models daily fact check; #330 PL/La Liga token-gated live
refresh (inert until `FOOTBALL_DATA_API_TOKEN` is set in the Netlify runtime
env); #331 polling on the blob lane; #332 F1 slim summary + per-meeting route.
Separately verified the same day: Netlify deploy previews fail repo-wide on a
pre-existing issue (also on merged PRs #309-#311), unrelated to these changes.

## Landed 2026-07-05/06 (merged to main 2026-07-06 via PR #277)

Fixed with tests, and where a live dashboard was affected the committed snapshot
was regenerated so the fix is visible immediately:

- **PL / La Liga rollover** — off-season re-pin to the completed season in both
  data libs, plus played-games guards in all three builder paths (dedicated +
  prebuild). Snapshots regenerated: PL now shows Arsenal 85pts/38GP "2025/26",
  La Liga Barça 94pts matchday 38. Tests added to both lib suites.
- **Fantasy ADP** — per-format minimum-entries floor with keep-previous
  fallback; regenerated. Published boards went from 4/1 to 156/138 matched
  entries for half-PPR/standard (PPR 193). New resolver unit tests.
- **NFL kickoff timezone** — ET→UTC converter (handles EST/EDT), and the served
  snapshot regenerated 2026-07-06 so live kickoffs are correct now (were 4-5h
  early). Unit tests pin known UTC instants.
- **MLB Nov rollover**, **NBA off-season gate + season pin (#232 closed)**,
  **golf cut line**, **World Cup pens** (data + FixtureCard render + regenerated),
  **news-pulse WaPo→Al Jazeera**, **MBA digest** — all fixed with tests.
- **NBA finished 2026-07-06** — committed snapshot season corrected 2026-27→2025-26,
  and the commit-gate trap fixed at root: the builder now carries prior fixtures
  forward on an empty scoreboard window (`preservePriorFixtures`), so an off-season
  standings/season correction commits instead of being skipped. New tests.
- **Golf finished 2026-07-06** — real three-state cut UI (`GolfCutState`,
  `deriveCutState`: made / pending / none / unknown, never a false "No cut"), wired
  through builder + client + regenerated snapshot. New tests.
- **MBA ATS** — Coinbase→Greenhouse, Plaid→Ashby, and DoorDash→Greenhouse (finished
  2026-07-06 on the verified `doordashusa` board; the audit's `doordash` slug 404s).
- **tech-startups asOf** rolled back to an honest 2025-06-01.
- **Investments partial 2026-07-06** — stalest-first symbol sort keyed on the
  persisted `freshness.sections.price` so each budget run rotates the whole universe
  (verified on real data). Re-stamp fix + CI stale-ratio gate still open below.
- **Polling** — "illustrative sample data" disclosure on-page, and 2026-07-06 the
  SEO description, AI-metadata, and JSON-LD reworded to drop the false "aggregates
  public polls" provenance; a client test guards the disclosure. Real VoteHub
  pipeline still open below.

Deferred with reason: **World Cup scorers** — ESPN's `fifa.world` byathlete/statistics
endpoint returns zero athletes (verified live 2026-07-06), so the only path is
aggregating scorers from ~100 match summaries, disproportionate for a tournament
ending July 19; the honest empty-with-note stays.

Full suite green (207 suites / 1101 tests, 2026-07-06). Typecheck is clean for all
touched source; the only tsc errors are 12 pre-existing `golfData.test.ts`
null-assertions and one in `search/route.test.ts`, neither gated (there is no
tsc/typecheck script in the repo or CI).

---

## The one systemic thing: refreshed data never reaches production

Every snapshot commit carries `[skip ci]`, which Netlify honors, and the
workflow step that would trigger a deploy checks a `NETLIFY_BUILD_HOOK` secret
that was never configured. I verified in today's World Cup run log that it
printed "secret not configured; skipping deploy trigger" mid-tournament. Since
snapshots are compiled into the server bundle, committed data doesn't exist in
production until something deploys, so the hourly earthquake refresh, the 6h
World Cup refresh, and everything else are gated by the daily cron-job.org build
ping at best and multi-day human deploy gaps at worst. This is the highest-leverage
fix in the whole audit and it's a zero-code change.

- [x] **Set the `NETLIFY_BUILD_HOOK` GitHub Actions secret.** Isaac set the
  secret 2026-07-06 (verified in the repo's Actions secrets). The delivery
  design has since been centralized: individual workflows no longer POST the
  hook; `publish-data.yml` coalesces successful refreshes, fires the hook only
  when production is behind, hard-fails if the secret is missing, and verifies
  the `/api/data-revisions` ledger before closing a publication incident.

---

## Wave 1 — live-visible bugs, do first

- [x] **Premier League / La Liga season-rollover wipe.** football-data.org rolled
  to 2026/27; the committed snapshot has all 20 PL clubs at position 1 with 0
  played, empty scorers, empty fixtures, and La Liga shows last season's final
  table mislabeled "2026/27, matchday 1". Guards only check `standings.length > 0`.
  Fix: add a rollover guard (keep prior table when the new one has
  `sum(playedGames) === 0`), and during the off-season pin standings/scorers to
  the completed season (`?season=2025`, verified to return the real final table).
  Regenerate. Files: `scripts/buildPremierLeagueSnapshot.ts`,
  `scripts/updateLaLigaSnapshot.ts`, `src/lib/premierLeagueData.ts:409`,
  `src/lib/laLigaData.ts:491`, `scripts/updateFootballSnapshots.ts:58`.

- [x] **Fantasy ADP collapsed for half-PPR (4 players) and standard (1 player).**
  FFC's annual late-June mock-pool rollover briefly served near-empty boards; the
  parser only rejects fully empty ones so it overwrote the good board. FFC is
  healthy again (156/138/193 players as of today). Fix: add a per-format
  minimum-entries floor (~50) that routes thin boards through the keep-previous
  fallback, fall back per-format instead of all-or-nothing, then re-run.
  Files: `scripts/buildFantasyAdpData.ts:71`, `src/lib/fantasyAdpSource.ts:146`.

- [x] **Polling aggregator is serving fabricated data.** Interim disclosure +
  the page metadata reword landed 2026-07-06 (see "Landed" above), and the real
  VoteHub pipeline shipped afterward (`scripts/buildPollingSnapshot.ts` +
  `update-polling.yml`, every 6h). The blob-lane move (workflow reduced to a
  daily seed refresh) is PR #334 — a re-land of #331, which GitHub marked
  merged but which only ever merged into the #329 stack branch, not main.
  Original finding, for the record: the hand-edited snapshot
  lists 2026 Senate races in NV/WI/PA/AZ that aren't on the 2026 ballot, recycles
  2024 matchups, has Ruben Gallego running in two states at once, and attributes
  invented numbers to real pollsters, during an election year with a live countdown
  on the page. Fix: stop serving it. Build a real pipeline on the VoteHub Polling
  API (keyless, CC-BY, verified live), with the repo's curated-data disclosure.
  Files: `src/data/pollingSnapshot.ts` (fabricated), new
  `scripts/buildPollingSnapshot.ts` + `update-polling.yml`, VoteHub base
  `https://api.votehub.com/polls`.

---

## Wave 2 — correctness bugs, small diffs

- [x] **NFL kickoff times are Eastern stamped as UTC** (4-5h early on every
  fixture). `src/lib/nflData.ts:440` builds `${gameday}T${gametime}:00Z` but
  NFLverse `gametime` is US/Eastern. Convert ET→UTC (handle EST/EDT). Add a unit
  test asserting a known SNF game.

- [x] **MLB season rollover flips to next year on Nov 1**, breaking the World
  Series coverage the workflow advertises. `getCurrentSeason()` in
  `src/lib/mlbData.ts:135` returns `year+1` when `month >= 11`. Flip in December
  instead (`month >= 12`); the cron never runs in December so it's safe.

- [x] **NBA quality gate has no off-season mode.** It hard-fails when
  `recent + upcoming < 1`, so it failed 10 straight runs after the finals and left
  issue #232 open. Also the page labels 2025-26 final records as "Season 2026-27".
  Fix: off-season-aware gate (warn+exit 0 when only fixtures are empty), pin the
  season on the standings/byathlete URLs. Close #232.
  Files: `.github/workflows/update-nba.yml:118`, `src/lib/nbaData.ts:505`.

- [x] **Golf cut line read from a field ESPN never populates** → tournaments with
  cuts display "No cut". Real data is at `event.tournament.cutScore/cutRound/cutCount`.
  Distinguish "cut not yet made" from "no-cut event" in the UI.
  Files: `src/lib/golfData.ts:353`, golf client.

- [x] **MBA jobs email digest 400s** whenever the feed exceeds 25 jobs or contains
  any direct-HTML job (unparsable `postedAt` nulls the whole batch). Client-side
  slice to 25 and drop unparsable dates before posting; server-side skip invalid
  entries instead of rejecting the array.
  Files: `mba-jobs-client.tsx:2004`, `useMBAJobs.ts:374`, `email/route.ts:178`.

- [x] **MBA Coinbase source permanently 403s** (Cloudflare) while a public
  Greenhouse board with 129 jobs exists. Switch registry entry to
  `atsType: "greenhouse", sourceKey: "coinbase"`, delete the direct-HTML branch.
  Same for Plaid (Ashby) and DoorDash (Greenhouse). Config-only.
  Files: `src/constants/mba-companies.ts:66`, `route.ts:584`.
  Done 2026-07-06: Coinbase/Plaid landed earlier; DoorDash uses the verified
  `doordashusa` Greenhouse board (the audit's `doordash` slug 404s).

- [~] **World Cup penalty shootouts render as bare draws.** `buildFixture` drops
  `shootoutScore`. Also the scorers array is permanently empty mid-tournament; the
  ESPN `fifa.world/statistics` endpoint fills it. Files: `src/lib/worldCupData.ts:247`.
  Pens done (rendered + regenerated). Scorers deferred 2026-07-06: that endpoint
  returns zero athletes live, so it needs match-summary aggregation, not worth it
  for a tournament ending July 19.

- [x] **News-pulse Washington Post feed is dead** (responds slower than the 8s
  timeout, ~1 item when it does). Swap for a healthy top-stories feed (Al Jazeera
  English verified ~0.1s / 25 items; LA Times runner-up). Also map abort errors to
  a human message. Files: `src/lib/news-pulse-sources.ts:41`.

- [x] **Tech-startups `asOf` overstates currency by ~1 year.** Page says "as of
  May 2026" over data ending ~mid-2025. Roll `AS_OF` back to an honest date now;
  refresh the seed against 2025-H2/2026 reporting separately.
  Files: `scripts/buildTechStartupSnapshot.ts:20`.

- [~] **Investments: 84% of symbols permanently stale.** The 22-min budget covers
  only ~24 of 151 symbols in fixed file order. Quick win now: sort symbols
  stalest-first before the loop so the cursor rotates the whole universe. Also
  stop re-stamping skipped symbols as fresh (`src/lib/investmentSnapshot.ts:236`)
  and make the CI gate fail on a high stale ratio.
  Files: `scripts/fetch_investments_data.py:506`. NOTE: sort by a *persisted*
  freshness signal (the prior public snapshot's `freshness.sections.price`), not
  filesystem mtime — CI checkout resets mtimes so an mtime sort is a no-op there.
  Done 2026-07-06: `sort_symbols_stalest_first` on the persisted price freshness
  (verified on real data). Still open: the re-stamp fix and the CI stale-ratio gate.

---

## Wave 3 — bigger, branch-worthy, some need approval

- [U] **Rewrite git history to reclaim ~2.4GB.** The pack is 2.73GiB, ~90% dead:
  1.6GB deleted `public/player-images`, 808MB committed `.next/cache` webpack
  blobs, 307MB tracked `data/investments-raw` rewritten twice weekly. `git
  filter-repo` to drop the dead paths, then move `investments-raw` out of git
  (actions/cache), add shallow/sparse checkout to workflows. Destructive history
  rewrite — needs Isaac's go-ahead and a force-push window.

- [ ] **Investments throughput rework.** defeatbeta's upstream is parquet tables
  on Hugging Face updated daily; bulk-download them and build all 151 symbols
  locally instead of 55s/ticker. SEC EDGAR companyfacts as a free official
  fundamentals hedge. `https://huggingface.co/datasets/defeatbeta/yahoo-finance-data`.

- [x] **Earthquake → request-time USGS + ISR.** Done, with two deliberate
  deviations. Request-time USGS serving landed first
  (`getEarthquakeSummary({ preferLive: true })`); PR #325 (merged 2026-07-20)
  added a 60s single-flight cache and cut the hourly cron to a daily
  fallback-seed refresh. `update-earthquake.yml` was kept as that daily seed
  refresher rather than deleted, and ISR was skipped in favor of CDN
  `s-maxage`/SWR plus the durable directive (PR #327) after the follow-up
  research found a bug history in the runtime's ISR support.

- [~] **Frontier-models is 67 days stale** (still lists Opus 4.7 as flagship, two
  Anthropic generations behind). The seed was hand-refreshed (asOf 2026-07-20,
  with the `verified:false` + review-window disclosure now on-page), and PR
  #329 (open) adds the automated layer: a daily Netlify scheduled function
  fact-checks the curated seed against `models.dev` `api.json` and OpenRouter
  `/api/v1/models`, stamps each model `confirmed`/`updated`/`curated-only`, and
  serves via the blob lane. A live dry run on 2026-07-20 found 6 of 9 entries
  had drifted facts, confirming the check's value.

- [~] **Formula 1 serializes its full 145KB snapshot into every response** on two
  per-request-dynamic routes. PR #332 (open) adds the summary accessor,
  `/api/formula-1/summary`, and `/api/formula-1/meetings/[meetingId]`, with the
  client lazy-fetching meeting detail: 156KB serialized per request drops to
  57KB plus 1.4-12.7KB per opened meeting.

- [ ] **Adopt Jolpica-F1** (Ergast successor) for F1 standings/schedule/results
  (fresher than OpenF1's daily, had Saturday's sprint points same day); keep OpenF1
  only for headshots/colors. Add Sunday race-day crons. `https://github.com/jolpica/jolpica-f1`.

- [ ] **All ~15 dashboards render dynamically per request** despite fully static
  committed data (each awaits `searchParams`). Set `export const revalidate`/static
  where possible. *Decision note 2026-07-20:* page-level ISR was deliberately
  rejected (runtime ISR bug history); the API tier is now durable-CDN-cached
  instead (PR #327). Page-level static rendering remains open as written.

- [x] **`/api/fantasy-data` re-reads and re-parses ~700KB JSON per request** with
  no module cache (unlike investments' 5-min TTL). Done via PR #280: a 5-minute
  TTL cache in `src/lib/fantasySnapshotServer.ts`, resettable for tests.

- [ ] **SpaceX: hotlink launch images via Netlify Image CDN**, drop the 7.4MB of
  committed originals from git; render through `next/image`.
  Files: `scripts/buildSpaceXImageSnapshots.ts`, `MissionImageFrame.tsx:98`.

- [x] **Retire `/api/stocks`** (orphaned near-duplicate of
  `/api/investments/quotes`, still spends Finnhub quota). Done via PR #280: the
  route is a 410 Gone stub with Deprecation/Sunset headers and spends no quota.

---

## Wave 4 — source upgrades and polish (verified, lower urgency)

- [ ] **Fantasy: replace the FantasyPros HTML scrape with their free public API
  key** (`api.fantasypros.com/public/v2`, `x-api-key`). Removes the single most
  fragile dependency. Add a daily July-September cron for draft-prep peak.
  *Research note 2026-07-20:* the $0 tier is build/test only with sample data;
  a production personal key comes bundled with the ~$9/mo membership, and
  publicly republishing rankings may brush the redistribution line. Read the
  terms before switching.
- [ ] **MLB: enrich existing calls** — probable pitchers via `hydrate`, wildCard
  standings, 4 verified new leaders categories. Use `/api/v1/seasons?sportId=1` as
  the season-of-record to fix the November stall robustly. *Adjacent but
  separate:* PR #328 (open, 2026-07-20) added a request-time live scoreboard to
  `/api/mlb/summary`; this enrich item remains untouched.
- [~] **GitHub trending: compact the JSON** (43% is indentation), refresh topic
  qualifiers (`topic:ai` matches 6x more than `topic:artificial-intelligence`),
  consider OSS Insight trends API for a real velocity signal. Compact
  stringify + `topic:ai` landed via PR #282; the OSS Insight velocity signal is
  the remaining open piece.
- [~] **Bay Area transit: register a personal BART key** (free, removes demo-key
  risk); consider the 511.org token to cover Muni/Caltrain/AC Transit and make the
  page genuinely Bay Area (requires on-page attribution). Code side is PR #326
  (open): `BART_API_KEY` read at call time with the demo key as fallback, wired
  through the workflow and `.env.example`. Registering the key and setting it in
  the Netlify env plus the Actions secret is Isaac's step; 511.org remains open.
- [x] **World Cup: post-tournament cleanup plan** — the cron re-arms every
  June/July; park or delete the workflow after the July 19 final. Resolved by
  the workflow's self-disarming window gate: it reads `startDate`/`endDate`
  out of the committed snapshot and skips outside a 2-day pre-roll / 3-day
  post-roll window. Verified 2026-07-20 (endDate 2026-07-19), so it goes
  dormant from July 23 until a future tournament's dates are seeded.
- [ ] **Shared: route more builders through `scripts/fetchRetry.ts`** (only 3 of
  ~15 use it; F1 has no retries at all), extract a shared `atomicWrite.ts`, and
  fix the golf workflow's expression-injection surface (ESPN tournament name
  interpolated into a `run:` script under `contents: write`).
- [x] **Stagger the shared `:20` cron minute** — earthquake, transit, and world-cup
  all fire at :20 and race over pushes to main. Resolved in stages: transit
  moved to :35 and world-cup to :50 (PR #280), and the last collision source
  went away when earthquake dropped to a daily 06:20 run (PR #325, merged
  2026-07-20).
- [~] **News-pulse: add a last-good fallback** (currently discards the cache entry
  on TTL expiry, so refresh failures 503 for 5 minutes). The fallback landed via
  PR #281 and was later hardened with per-feed last-good state persisted in
  Netlify Blobs, so cold starts keep it. The feed-mix normalization to
  homepage-level feeds is the remaining open piece.
- [~] **MBA jobs: map Greenhouse `first_published`** instead of `updated_at` for
  posted dates; add Workday CXS + Amazon endpoints (research-verified, verifier
  timed out — re-confirm before shipping). `first_published` landed via PR #283
  (verified locally 20/20); the Workday CXS + Amazon endpoints remain open.

---

Full per-finding detail with `file:line` refs and the adversarial verdicts lives
in the 2026-07-05 audit workflow run (`wf_419e30d9-09e`) and the
`data-source-audit-2026-07` project memory.
