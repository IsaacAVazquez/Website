---
target: /portfolio
total_score: 21
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 0
target_identity: "file:/Users/isaacvazquez/Website/route:/portfolio"
timestamp: 2026-09-14T18-48-54Z
slug: route-portfolio
---
Method: re-score after remediation. A: design review subagent (post-fix) · B: computed-value sweep subagent (post-fix), synthesized in the parent. Run 2026-09-14 on branch design/catalog97-loop.

Mode: Experience (unchanged). Baseline for this run is `2026-09-14T18-34-43Z__route-portfolio.md`, scored 20/36 before remediation.

## Design health score

| # | Heuristic | Score | Key issue now |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Scored while the ledger header still read "33 projects" above 29 rows. That header now prints the ledger count (see Applied after measurement). The plate stays the unfiltered total and no result count sits in a live region. |
| 2 | Match system / real world | 3 | The CTA reads "Most of these have a build note in the writing archive, and I am happy to walk through any of them.", and the four lead cards carry "How I built it". Titles still open tools under an h1 that promises "the decisions behind it". |
| 3 | User control and freedom | 2 | No way back from the tool landing, and "All" still does not clear search. |
| 4 | Consistency and standards | 2 | "Work" in the nav, "Projects" on the landing header. |
| 5 | Error prevention | 3 | Unchanged. |
| 6 | Recognition rather than recall | 2 | The 29 ledger rows are still title and year only, with no build-note link. |
| 7 | Flexibility and efficiency | 2 | Sort options still "Featured first / Newest first / Alphabetical / Live first" (kept). |
| 8 | Aesthetic and minimalist design | 3 | At 390 the first screen still shows controls and no project (first lead h2 at 884px against 844). |
| 9 | Error recovery | 2 | A no-match search still leaves the empty camel stripe above "No projects match that search." with no clear control. |
| 10 | Help and documentation | n/a | Experience-mode index. |
| Total | | 21/36 | Acceptable (58%). n/a: 10 |

## Resolved since the pre-fix snapshot

[P1] Every entry opened a live tool while the CTA promised write-ups. Partly resolved, and the remainder is P2 by decision. The CTA no longer promises a write-up the click never reaches, and the four lead cards link "How I built it" to `/writing/building-an-investment-research-platform`, `/writing/interchange-iq-payment-fee-analyzer`, `/writing/building-news-pulse-dashboard` and `/writing/mapping-the-ai-dev-tool-ecosystem`, all four returning 200. `PROJECT_BUILD_NOTES` in `src/constants/caseStudies.ts` holds the map. The title link still redirects to the tool, which is kept.

[P2] Counts on the page contradicted what is on screen. The ledger header part is fixed in source after measurement. `Catalog97Portfolio.tsx` now prints `ledger.length`, so the header counts the rows under it. The re-score ranked this as the route's one open P1 before that cleanup, which is why p1 is 0 here. The live region part is still open, below.

[P2] The Investment Analytics Platform record overstated its data source. Resolved. `caseStudies.ts` now says "reading committed snapshots of a Yahoo Finance dataset, with Finnhub quotes", lists "Finnhub API" in tools and "Committed snapshots" in metrics, which agrees with the landing's "Curated snapshot · Aug 18, 2026" and "Market quotes via Finnhub". The design review did not confirm on disk that the defeatbeta dataset is Yahoo Finance data, and "30+ metrics per stock" is unverified.

[P3] The search placeholder measured 3.02:1 in light. Resolved. It measures 5.4:1 in light and 7.26:1 in dark.

Shared shell items resolved on this route. Focus rings measured radius 0 and no shadow on all 67 focusables in both themes. The header held 188.4px at 390, 122.8px at 768 and 114px at 1440, with CLS 0 at every measured width.

## Priority issues

[P2] Titles open the tool, and the ledger rows have no path to their reasoning.
27 of the 29 ledger projects have an entry in `PROJECT_BUILD_NOTES`, and none of those rows links to it. The title redirect itself is kept by decision.
Fix: add the "How I built it" microlink to ledger rows where a build note exists, or point the CTA's second clause at /writing.
Suggested command: /impeccable clarify

[P2] Result count changes are silent.
No element carries `aria-live` or `role="status"`, so a filter or search that changes the count is never announced.
Fix: make the ledger count a polite live region.
Suggested command: /impeccable harden

[P2] The no-match state keeps the empty camel stripe and offers no reset, and "All" does not clear search.
Fix: skip the lead band when `lead.length === 0` and add a "Clear search" button to the empty message.
Suggested command: /impeccable harden

[P2] The phone's first screen is controls only.
First lead h2 at 884px against an 844px viewport at 390. The two sort options that do nothing are kept by decision, so the lever here is search placement.
Suggested command: /impeccable layout

[P2] The index leads with tool volume and personal utilities.
Content choice, still open. Plate "33", Sports 11, Lifestyle 6.
Suggested command: /impeccable distill

[P3] Ledger title links are about 20px tall.
The sweep measured 29 ledger title links at 20px tall (hit areas 21px) at 1024 and 1440 in both themes, and the four camel titles at 27px. Pre-existing, WCAG 2.5.8 relevant, spacing exception not evaluated.
Suggested command: /impeccable harden

[P3] "Work" versus "Projects" naming across the seam, and the search and sort field borders at 1.42:1 light and 1.51:1 dark (not changed in the diff and not re-measured).

## New issues

[P3] "How I built it" exists only on the four lead cards (folded into the first P2 above). [P3] The build note lands in the Working Instrument article shell, which is the same site-level seam as the tool landing and not a new defect.

## Applied after measurement

The ledger header now counts ledger rows. `.c97-kicker` sets `font-weight: 400`. Neither was re-measured in a browser beyond a targeted text and style check.

## Click-through to /portfolio/[slug]

Scored separately at 19/40, unchanged, with its two P1s (redirect in place of a case study, no bridge across the world change) kept by decision. See the route-portfolio-slug snapshot from this run.

## Deliberate decisions (do not re-litigate)

Work cards keep opening the live tool, and only the four lead cards carry build-note links. /portfolio/[slug] still redirects into the Working Instrument world. "Featured first" and "Live first" stay in the sort select.

## Regression sweep

Across 58 states on the seven Catalog 97 routes (2 at 320 and 14 at each of 390, 768, 1024 and 1440), 0 AA text contrast failures, 0 horizontal overflow, 1 main and 1 h1 everywhere, 0 heading skips, 0 failed requests and 0 console errors. Page height is 3,539px at 1440 and 4,487px at 390.

## Not checked

The defeatbeta dataset's provenance, screen reader output, and the ledger count in a browser after the cleanup.
