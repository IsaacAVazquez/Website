# Repo project audit, September 30, 2026

I found 11 issues across the project surfaces, with two that I would fix first. Fourteen routes produce React hydration errors in WebKit because the server and browser format the same timestamp differently, and Interchange IQ uses five times the regulated debit percentage it describes. The production build, lint, TypeScript, and all 3,273 unit tests pass, but the full browser matrix fails. I would resolve those browser failures and the payment assumptions before adding more projects.

I audited the working tree, including the edits already present when I started, and left application code unchanged. The starting commit was `560742096e6ffa2244f9ae800c5a894c796898ee`. I also copied that working tree into an isolated directory, installed the locked dependencies, and repeated the main checks under Node 22.23.3. This matters because 18 directly installed packages in the original checkout differ from the lockfile, including Next.js, React, and Playwright. The clean installation confirms that the findings are reproducible with the intended dependency versions.

## Scope and verification

The inventory contains 33 portfolio projects, 62 page definitions, 26 API route definitions, and 244 article source files. I reviewed shared architecture, project engines and data access, browser storage, refresh and publication workflows, authentication and public API controls, metadata and content rendering, dependencies, responsive layout, and browser behavior. The project catalog below records the result for every portfolio project. Score Pools and the additional fantasy routes were also included.

| Check | Result | Interpretation |
| --- | --- | --- |
| Clean Node 22 production build | Passed | Includes sitemap generation and the deployment asset patch |
| Clean Node 22 TypeScript and lint | Passed | No reported type or lint errors |
| Clean Node 22 unit tests | 398 suites and 3,273 tests passed | Statement coverage 76.98%, branch coverage 66.13%, function coverage 74.62%, line coverage 78.97%; above the configured CI floors |
| Original checkout Chromium suite | 277 passed, 3 skipped | Passed with the existing installed dependencies |
| Clean full browser matrix | 1,173 passed, 59 failed, 168 skipped | Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari; 56 failures are timestamp hydration errors, two are Safari control sizing, and one is a navigation timeout |
| Focused Chromium navigation rerun | 4 passed | The matrix timeout did not reproduce with one worker |
| Responsive layout sweep | 62 routes at seven sizes, 434 page checks | No page overflow failures; two component layout issues confirmed |
| Contrast sweep | 61 routes in both themes, 122 checks | No failures in the script's supported text and background checks |
| Curated data audit | Nine datasets checked, zero requiring review | The audit distinguishes review age from the unverified label |
| Automation inventory | Passed | Generated workflow inventory matches the repo |
| Locked dependency audit | One affected transitive package, high severity | Development tooling exposure in `brace-expansion` |

The full matrix used three workers, while the repository's CI configuration defaults to one worker for that matrix. I isolated the navigation failure with a one-worker rerun and a direct browser probe, both of which passed. The hydration and control sizing failures reproduce in separate WebKit probes without competing test workers.

The layout sweep produced 14 automated edge flags, all on the deliberately centered Arcade heading or the rotated 404 treatment. I excluded those intentional designs from the findings. The remaining review flags include orphaned text and generic anchor spacing checks; the header is in normal document flow, so the script's sticky-header assumptions do not establish a defect. I also did not turn small inline prose links into blanket accessibility findings. The Safari selects below are task controls with an explicit 44px project requirement.

## Findings

P1 means I would fix it before shipping further changes to the affected surface. P2 means a concrete correctness, reliability, or operational issue to address in the next maintenance pass. P3 means a smaller presentation defect.

### F01, P1, timestamp formatting breaks hydration in WebKit

The clean build produced 56 hydration failures across 14 routes, two visitor timezones, and both desktop WebKit and Mobile Safari. The affected routes are `/news-pulse`, `/la-liga`, `/mba-internship-notifications`, `/spacex-mission-control`, `/premier-league`, `/github-trending-pulse`, `/formula-1`, `/fantasy-formula-1`, `/golf`, `/earthquake-pulse`, `/bay-area-transit`, `/mlb`, `/nfl`, and `/museum-log`.

A standalone probe with the same `en-US` date options and `2026-09-30T17:15:00Z` gives `Sep 30, 10:15 AM PDT` in Node and `Sep 30 at 10:15 AM PDT` in WebKit. A separate visit to Premier League produces React error 418. Pinning the timezone prevents timezone drift, but it does not make punctuation identical across Intl implementations. The existing September normalization addresses a different `en-GB` month abbreviation mismatch.

I would assemble displayed timestamps from normalized date parts with fixed separators, cover route-local formatters as well as shared helpers, and rerun the full matrix. Suppressing the warning would leave the initial markup mismatch in place. Start with [date-formatters.ts](../src/lib/date-formatters.ts#L43) and the local formatter in [premier-league-client.tsx](../src/app/premier-league/premier-league-client.tsx#L77).

### F02, P1, Interchange IQ overstates regulated debit interchange

The engine uses `0.0025`, or 0.25%, plus $0.22, and the interface labels that assumption as Regulation II debit. The rule is $0.21 plus five basis points, or 0.05%, with an additional $0.01 for an eligible fraud prevention adjustment. At the default $50,000 monthly volume and 35% debit share, the percentage error adds $35 to modeled monthly interchange. At 100% debit, it adds $100. These are calculated differences in this model, not observed merchant savings. [Federal Reserve rule](https://www.federalreserve.gov/newsevents/pressreleases/bcreg20110629a.htm).

I would correct the percentage, state whether the fraud adjustment is included, and distinguish covered issuer debit from exempt debit before treating the assumption as a general debit rate. Add an independently sourced example to the engine tests. The constant is in [interchangeIq.ts](../src/lib/interchangeIq.ts#L3), and the label is in [interchange-iq-client.tsx](../src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx#L185).

### F03, P2, processor comparisons mix payment channels and an old Square fee

Square is modeled at 2.6% plus $0.10 for card present payments, alongside Stripe's standard online rate. Square's published card present schedule now starts at 2.6% plus $0.15, with plan differences, and its online and Online API schedules are separate. The five cent fixed fee difference alone understates the Square estimate by $29.41 at the default volume and ticket size. The shared ranking also compares transactions with different payment channels. [Square fees](https://squareup.com/us/en/payments/our-fees).

I would make channel and plan part of the comparison, date each public price, and identify custom interchange plus markups as assumptions that require a quote. The current notes help explain limitations but do not make the ranked totals comparable. The processor table is in [interchangeIq.ts](../src/lib/interchangeIq.ts#L27).

### F04, P2, Best Ball never expires a successful in-memory snapshot

After the first successful fetch, the module returns `cachedSnapshot` indefinitely. There is no expiry or focus refresh, so HTTP cache headers cannot refresh data because the hook stops issuing requests. I reproduced this in an isolated test by advancing the clock one day, providing a newer network snapshot, and remounting the hook; it still returned the old snapshot without fetching. This affects periods when the draft data is being updated. The dated in-season freeze itself is intentional.

I would give the memory cache an expiry, refresh on focus when expired, and keep the previous usable board visible during a refresh. Both Best Ball surfaces share [useBestBallSnapshot.ts](../src/hooks/useBestBallSnapshot.ts#L9).

### F05, P2, Recipe Finder and Score Pools conceal failed storage writes

With browser writes forced to throw `QuotaExceededError`, Recipe Finder lets me add an ingredient and says it is saved in the browser, but the ingredient disappears on reload. Score Pools lets me add a pool, gives no persistence warning, and loses it on reload. Recipe Finder catches the write failure without reporting it. Score Pools discards the status returned by the shared storage helper.

I would expose the persistence status in both interfaces and say when changes exist only for the current session. The shared storage helper already supports this distinction. The affected code is [recipe-finder-client.tsx](../src/app/recipe-finder/recipe-finder-client.tsx#L96), its saved claim at [line 228](../src/app/recipe-finder/recipe-finder-client.tsx#L228), and [useScorePools.ts](../src/hooks/useScorePools.ts#L58).

### F06, P2, production publication does not wait for the test result

The publication workflow checks out current `main`, computes its data revision, then builds and deploys. The separate Tests workflow can still be running or failing for that code. A successful build does not establish passing unit, lint, or browser checks, as this audit demonstrates. Scheduled publication also selects current `main` independently of the event that triggered a previous test run.

I would require a successful test result for the application code being deployed and preserve the intended fast path for data-only refresh commits. That requires distinguishing a snapshot-only commit from a code change and checking the relevant tested revision. I did not inspect repository branch protection, so this finding concerns the workflow's missing check, not an assertion that merge rules are absent. See [publish-data.yml](../.github/workflows/publish-data.yml#L48) and [test.yml](../.github/workflows/test.yml#L1).

### F07, P2, the publication ledger omits independent fantasy outputs

The fantasy entry hashes `ppr.json`, but the ledger does not independently include Half PPR, Standard, Best Ball, or the weekly board. Weekly and Best Ball artifacts can change independently, so those changes can leave `publicationRevision` unchanged and their freshness absent from the diagnostic endpoint. Best Ball and weekly page metadata also use the redraft revision's date.

The deployment commit check still verifies build provenance, so this is a gap in artifact and freshness verification. I would include each independent fantasy artifact, represent an unpublished weekly board explicitly, and use each board's own date in metadata. The PPR import is in [data-revisions/route.ts](../src/app/api/data-revisions/route.ts#L49), with the fantasy entry at [line 154](../src/app/api/data-revisions/route.ts#L154).

### F08, P2, the lockfile contains vulnerable development tooling

`npm audit` reports high severity denial of service advisories for the transitive `brace-expansion` copies at 5.0.9 and 1.1.18. Both lockfile entries are development dependencies, reached through tooling such as ESLint and Jest. I did not establish a production request path to these packages. The relevant advisories cover [nested brace recursion](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [comma parsing recursion](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p), and [quadratic expansion](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr).

I would refresh the transitive dependency resolutions to patched versions, then repeat a clean install, audit, lint, unit tests, and build. Review [package-lock.json](../package-lock.json#L6131) and the nested copy at [line 7883](../package-lock.json#L7883).

### F09, P2, Safari renders three trade calculator selects at 22px

At a 390px viewport in WebKit, the Teams, Roster size, and Starting lineup selects are 22px tall despite `min-h-touch`. The computed minimum is 18px under native select appearance. Both desktop WebKit and Mobile Safari fail the existing 44px control test, and a separate browser probe confirms the sizes.

I would give these controls a browser-compatible explicit height or use a styled select with the native appearance removed and a visible indicator. Keep keyboard behavior and the labels. The shared numeric select starts in [trade-calculator-client.tsx](../src/app/fantasy-football/trade-calculator/trade-calculator-client.tsx#L92); the lineup select uses the same sizing approach at [line 190](../src/app/fantasy-football/trade-calculator/trade-calculator-client.tsx#L190).

### F10, P3, Mock Draft clips the final room temper button

The Chaotic button extends 6.31px beyond its parent at a 1280px viewport, where the parent hides overflow. The layout sweep also flags it at 1440px and 1512px. The intrinsic widths and padding of the three options exceed the available column width.

I would allow the buttons to shrink with a zero minimum width and equal basis, or reflow that control at the affected width while keeping the 44px touch height. The segmented control is in [mock-draft-client.tsx](../src/app/fantasy-football/mock-draft/mock-draft-client.tsx#L230).

### F11, P3, March Madness loses paragraph spacing in the championship section

The championship section uses `space-y-4`, but the unlayered Catalog 97 prose margin rule overrides the spacing on its paragraphs. The two affected paragraph margins are flagged at all seven layout widths, leaving the result note and analysis without the intended separation.

I would use a container gap with Catalog 97 spacing tokens or explicit token margins in this section. The wrapper is in [march-madness-client.tsx](../src/app/march-madness-2026/march-madness-client.tsx#L872).

## Project coverage

Every project below was included in the source review and route checks. A row with no additional finding means I found no further reproducible issue within this audit; it does not certify every calculation or every external record. F06 and F08 apply across the repository and are omitted from individual rows.

| Portfolio project | Main route | Result or dependency |
| --- | --- | --- |
| Investment Analytics Platform | `/investments` | All 151 price histories recent; degraded section metadata discussed below |
| Fantasy Football Analytics Platform | `/fantasy-football` | Additional draft, trade, Best Ball, weekly, and waiver routes checked; F04, F07, F09, F10 |
| Interchange IQ | `/fintech-tools/interchange-iq` | F02 and F03 |
| Budget Planner | `/fintech-tools/budget-planner` | No additional finding |
| Rent vs. Buy Calculator | `/fintech-tools/rent-vs-buy` | No additional finding; tax constant review passed |
| News Pulse Dashboard | `/news-pulse` | F01; production runtime heartbeat fresh |
| Decision Lab | `/decision-lab` | No additional finding |
| Automation Enablement Assistant | `/enablement-assistant` | No additional finding |
| Food Map | `/food-map` | Review window passed; unverified curated data |
| March Madness 2026 Bracket Analysis | `/march-madness-2026` | F11; intentional archived tournament |
| La Liga Pulse | `/la-liga` | F01; production snapshot fresh |
| Job Search | `/mba-internship-notifications` | F01; production runtime heartbeat fresh |
| SpaceX Mission Control | `/spacex-mission-control` | F01; production snapshot fresh; provider token remains an existing task |
| Premier League Pulse | `/premier-league` | F01; production snapshot fresh |
| Frontier Model Tracker | `/frontier-models` | Curated review passed; actual blob refresh not verified |
| AI Dev Tool Ecosystem | `/ai-dev-tools` | Curated review passed; unverified label retained |
| GitHub Trending Pulse | `/github-trending-pulse` | F01; production snapshot fresh |
| Tech Startup Tracker | `/tech-startup-tracker` | Curated review passed; editorial refresh is intentional |
| Formula 1 Pulse | `/formula-1` | F01; production snapshot fresh |
| Fantasy Formula 1 Optimizer | `/fantasy-formula-1` | F01; shares Formula 1 source data |
| PGA Tour Pulse | `/golf` | F01; off-week freshness handling reviewed |
| Earthquake Pulse | `/earthquake-pulse` | F01; runtime fetch with committed fallback |
| World Cup Pulse | `/world-cup-2026` | Intentional archived tournament; no additional finding |
| Bay Area Transit Pulse | `/bay-area-transit` | F01; optional dedicated BART key remains an existing task |
| MLB Pulse | `/mlb` | F01; production snapshot fresh |
| NBA Pulse | `/nba` | Intentional offseason snapshot; no additional finding |
| NFL Pulse | `/nfl` | F01; production snapshot fresh |
| Polling Aggregator | `/polling-aggregator` | Committed fallback fresh; actual blob refresh not verified |
| Museum Log | `/museum-log` | F01; curated review passed |
| Wine Cellar | `/wine-cellar` | No additional finding |
| Recipe Finder | `/recipe-finder` | F05 |
| Travel Planner | `/travel` | No additional finding |
| Travel Deal Lab | `/travel-deals` | Review window passed; unverified editorial material |

Score Pools is outside the 33-project portfolio inventory but was audited through its main, tracker, and settings routes. F05 affects its local data. Its production sample-only state is already explained by missing provider keys in the existing task list.

The additional route coverage includes the seven main site pages, portfolio detail pages, writing and topic pages, search, résumé download, contact, accessibility, Arcade, Now, Changelog, the design catalog, the internal analytics reference, admin, and legacy redirects. Article rendering and metadata received source and test coverage; I did not editorially fact-check all 244 articles.

## Data and operational state

I read the public production ledger at September 30, 2026, 11:26:54 PM Pacific. It reported 24 entries, with 16 fresh, seven degraded, and one unavailable. The deployed commit was `4af366797eabda7ff48739e4534e3d75c78a4423`, which differs from the local audit base. Local browser findings therefore describe the audited working tree, and the production ledger describes that deployed build.

Six degraded entries are curated datasets labeled unverified. Their review dates pass the configured age checks. The seventh is investments. All 151 local index entries have September 29 price histories, with zero delayed or missing prices, but 85 entries have the broader `stale` section flag. Price freshness and section freshness need to stay distinct when reading that status.

Food Map was 156 days into its 180-day review window, and the retirement capital market assumptions were 346 days into a 400-day window at the UTC audit date. Neither failed, but their review dates are closer than the other curated datasets. Archived World Cup and the offseason NBA snapshot pass deliberately longer windows. The frozen redraft board also has an intentional in-season policy; the separately updated weekly board is the part the ledger should add.

The existing [TODO.md](../docs/TODO.md#L1) already records Score Pools provider keys, the SpaceDevs and BART keys, confirmation that the `dashboard-snapshots` blob store fills, the replacement résumé PDF, and fragment preservation on dashboard URL rewrites. I did not duplicate these as newly discovered defects. The public ledger records committed fallback data for polling and Frontier Models, so it does not establish that their scheduled blob writes are healthy.

## Security, metadata, and limits

The reviewed paths have fail-closed admin configuration, timing-safe password comparison, constrained digest recipients and authorization, newsletter validation, symbol validation, sanitized article HTML, and escaped structured data. The proxy sends an enforcing Content Security Policy; the report-only policy in `next.config.mjs` is not the sole policy. I found no additional confirmed production security defect in this review.

The rate limiters keep counters in process memory, so each serverless instance has a separate allowance and restarts reset it. That is a known architectural limit worth retaining in operational expectations, especially for authentication and paid provider requests. I did not run an active security test against production, inspect secret values, send email, dispatch refresh workflows, or change provider configuration.

Canonical routes, redirects, page metadata, sitemap generation, and sanitized article rendering are covered by the existing tests and build. The search endpoint remains limited, as the repo documentation says. I did not audit live search rankings, crawler behavior, third-party licensing contracts, every vendor's current pricing, or private Netlify and GitHub settings. The contrast script excludes image backgrounds, and browser geometry checks are not a formal accessibility certification. I also did not capture a Lighthouse or real-user performance baseline, so this report makes no performance score claim.

## Repair order and evidence

I would first normalize timestamps and correct the regulated debit assumption, then make the processor comparison use one payment channel. After that I would fix Safari select height and persistence warnings, add an expiry to Best Ball, and make publication wait for the relevant tested code revision while adding the missing fantasy artifacts to its ledger. The dependency refresh and the two layout fixes can follow in the same maintenance pass.

I saved the check results, project inventory, reproduction measurements, production ledger, dependency audit, raw layout findings, and browser matrix log under [the audit evidence directory](../docs/audits/2026-09-30/summary.json). The reproduction tests lived only in the isolated copy. The audit added this report and its evidence files; it did not apply the proposed fixes or alter the edits already in the checkout.
