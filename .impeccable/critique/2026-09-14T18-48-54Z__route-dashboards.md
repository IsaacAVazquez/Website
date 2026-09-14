---
target: /dashboards
total_score: 24
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 0
target_identity: "file:/Users/isaacvazquez/Website/route:/dashboards"
timestamp: 2026-09-14T18-48-54Z
slug: route-dashboards
---
Method: re-score after remediation. A: design review subagent (post-fix) · B: computed-value sweep subagent (post-fix), synthesized in the parent. Run 2026-09-14 on branch design/catalog97-loop.

Mode: Operate (unchanged). Baseline for this run is `2026-09-14T18-34-43Z__route-dashboards.md`, scored 22/36 before remediation.

## Design health score

| # | Heuristic | Score | Key issue now |
|---|---|---|---|
| 1 | Visibility of system status | 2 | The route no longer claims nightly refresh or that every dashboard prints a timestamp. Tiles still show no kind or freshness (kept), so "I keep them running" cannot be checked from the grid. |
| 2 | Match system / real world | 3 | Tile summaries still use builder jargon ("snapshot-driven surface"). |
| 3 | User control and freedom | 3 | Unchanged. |
| 4 | Consistency and standards | 3 | Unchanged. |
| 5 | Error prevention | 3 | Unchanged. |
| 6 | Recognition rather than recall | 3 | Unchanged. |
| 7 | Flexibility and efficiency | 2 | No find by name, no category deep link. |
| 8 | Aesthetic and minimalist design | 2 | Status, the tobacco line and "Refresh fails soft" still state the fail-soft idea three times in a row. |
| 9 | Error recovery | n/a | No input that can fail. |
| 10 | Help and documentation | 3 | "How the data works" sits under copy scoped to "Most of the snapshot dashboards" and "The data panels here". One card overstated at scoring time and has since been rescoped. |
| Total | | 24/36 | Acceptable (67%). n/a: 9 |

## Resolved since the pre-fix snapshot

[P2] Freshness and "keep them running" claims overstated what the dashboards deliver. Mostly resolved in copy. The metadata in `src/app/dashboards/page.tsx` now says most dashboards read a committed snapshot refreshed on a schedule, a few trackers are curated by hand, and the lifestyle tools and calculators keep their state in the browser. The sweep read the Status band as "Most of the snapshot dashboards print the date of the data they are reading, so a failed pull shows up as an old date rather than as an empty page." and the tobacco line as "The data panels here would rather show a stale number with a date on it than nothing at all." Per-tile kind and freshness stay out by decision, so the remainder is P2.

[P2] The focus outline on pine tiles measured 2.31:1 in light. Resolved. `.c97-page .c97-tile:focus-visible` insets the ring by 6px, so it paints on the tile itself. On pine it measures 4.87:1 in light and 6.63:1 in dark at 390 and 1440. The general sweep still flags 8 pine tiles at 2.31:1 in light, and that flag is a false positive, because it compares the ring against the paper gap the ring no longer sits over.

The closing CTA now reads "The build notes behind most of these are in the writing archive." with "Read the writing" linking to /writing, which is true for 31 of 33 projects.

Shared shell items resolved on this route. Focus rings measured radius 0 and no shadow on all 62 focusables in both themes. The header held 188.4px at 390, 122.8px at 768 and 114px at 1440 with CLS 0.

## Priority issues

[P2] Tiles carry no kind or freshness under an h1 that says "I keep them running".
Kept by decision (no per-tile freshness labels), so this stays a known P2. The h1 still covers March Madness 2026 and World Cup 2026.
Suggested command: /impeccable clarify

[P2] The fail-soft convention is stated three times, and the "Status" kicker sits over prose that reports no status.
Suggested command: /impeccable distill

[P3] Tile summaries repeat one build-log template.
Down from P2. "One calm surface" is gone (applied after measurement), and the colons before a list in the Frontier Model Tracker and Travel Deal Lab summaries are allowed lead-ins by decision. What remains is 29 of 33 summaries opening "I built" with implementation jargon where a choosing line would help.
Suggested command: /impeccable clarify

[P3] Nothing finds a tool by name, and the filter is not linkable.
Suggested command: /impeccable harden

## New issues

[P3] The "One committed snapshot" data note was untrue for News Pulse, which fetches at request time with a 300 second revalidate (`src/lib/newsPulseServer.ts`). Pre-existing, found during the re-score, and rescoped after measurement.

## Applied after measurement

The data note now reads "Most of the data is checked into the repo, so those pages never depend on a third party being awake when you visit them." The Bay Area Transit summary's "one calm surface" became "one page". `.c97-kicker` sets `font-weight: 400`. None of these was re-measured beyond a targeted text and style check.

## Deliberate decisions (do not re-litigate)

No per-tile freshness labels. Tile copy colons before a list are allowed lead-ins. The filter is `role="group"` with `aria-pressed` buttons, which is correct, and the older brief text calling it a tablist was stale.

## Regression sweep

Across 58 states on the seven Catalog 97 routes (2 at 320 and 14 at each of 390, 768, 1024 and 1440), 0 AA text contrast failures, 0 horizontal overflow, 1 main and 1 h1 everywhere, 0 heading skips, 0 failed requests and 0 console errors. Page height is 7,275px at 1440 and 10,561px at 390.

## Not checked

The theme toggle's absence in one 1440 dark fold capture, treated as capture timing and not reproduced, and whether News Pulse falls back to a committed file when its fetch fails.
