---
target: /dashboards
total_score: 22
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 0
target_identity: "file:/Users/isaacvazquez/Website/route:/dashboards"
timestamp: 2026-09-14T18-34-43Z
slug: route-dashboards
closed: true
---
Method: dual-agent (A: design review subagent · B: detector and browser evidence subagent), synthesized in the parent, with one adversarial refuter on every P0 and P1. Run 2026-09-14 against the dev server on branch design/catalog97-loop at 71a015bf, before remediation.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 1 | No tile shows its kind or freshness, and the route copy asserts nightly refresh while opened dashboards print dates from May 2025 to July 2026 or no date at all. |
| 2 | Match system / real world | 3 | Category names are plain. Summaries lean on internal jargon ("deep-linkable product surface", "snapshot-driven surface"). |
| 3 | User control and freedom | 3 | The filter is one tap and "All" restores. State is not in the URL. |
| 4 | Consistency and standards | 3 | It uses the same filter control as /portfolio and /writing. Tile colour carries no meaning, which the brief settled. |
| 5 | Error prevention | 3 | Nothing destructive, and no filter can produce an empty view. |
| 6 | Recognition rather than recall | 3 | Titles and summaries are visible, but a tile has to be opened to learn whether it is live, curated, seasonal or browser-only. |
| 7 | Flexibility and efficiency | 2 | Category filter only, with no find-by-name among 33 and no deep link to a category. |
| 8 | Aesthetic and minimalist design | 2 | The fail-soft idea is stated three times back to back after the mosaic, and the "33" plate repeats the h1's number beside it. |
| 9 | Error recovery | n/a | The route has no input that can fail, and errors belong to each dashboard. |
| 10 | Help and documentation | 2 | "How the data works" explains the architecture but not which tiles it applies to, and one of its implications is false for a large part of the grid. |
| Total | | 22/36 | Acceptable (61%). n/a: 9 |

## Design Specificity Verdict

LLM assessment. The mosaic of inlaid colour fields, the first-person h1 and the "How the data works" band are specific to this site and its snapshot architecture. The tiles are interchangeable, though. Every one is a title plus a build-log sentence ("I built a … dashboard that packages … into one snapshot-driven surface"), with no reading from the instrument, no kind (live feed, curated, browser-only, closed season) and no date. The instrument idea stops at the h1, and nothing on a tile could not appear on any portfolio grid.

Deterministic scan. `impeccable detect` exited 2 with 2 findings, both in `src/app/portfolio/[slug]/page.tsx`, a side-tab accent border warning at line 504 and a design-system-font-size advisory at line 184. Neither renders, because the slug route redirects every record to its link. Run on the Catalog 97 components alone, the detector returned `[]` with exit 0. No DEGRADED banner printed. The detector says nothing about this route.

Visual overlays. No user-visible overlay is available. Injection was blocked by the site's enforcing CSP, which fired a securitypolicyviolation on script-src-elem. The computed-value sweep is the fallback signal. It reached 64 of 64 default states (eight surfaces at 390, 768, 1024 and 1440 in light and dark), reproduced the contrast gate at 13.25:1 light and 15.95:1 dark, and found zero AA text contrast failures, zero horizontal overflow, and one main and one h1 on every Catalog 97 route. The text gate passing does not cover focus indicators, and on this route the focus outline on the pine tiles measured 2.31:1 against its surround in light, which the text sweep could not catch.

## Overall Impression

The arrival is confident and every number on the page reconciles, which is rarer than it should be. The page's weakness is that it asserts more maintenance than the fleet delivers, in metadata that says nightly and a band that says every panel prints a date, and a skeptical peer can disprove both in two clicks. The single biggest opportunity is a static "kind" line on each tile (live snapshot, curated, in your browser, closed season), which makes the claims true without inventing a timestamp and gives the tiles something the tool would actually tell you.

## What's Working

Every number reconciles and every link works. The h1, the plate, "All 33", 33 rendered tiles and the per-tab counts (4+3+3+3+2+11+1+6) agree, and all 33 hrefs exist as `src/app/**/page.tsx` and returned HTTP 200.

Headed runs plus the shared filter make the grid operable. Filtering Sports took the page from 7,237px to 3,503px at 1440, and whole-tile links show a hover shift and a focus ring.

The "How the data works" copy explains the architecture in plain language ("so the page never depends on a third party being awake when you visit it") and refuses to invent timestamps, which is the right instinct for a credibility-first audience.

## Priority Issues

[P2] The freshness and "keep them running" claims overstate what the dashboards deliver.
The route metadata (`src/app/dashboards/page.tsx:13-14`) says "The dashboards read from a committed snapshot that refreshes nightly," and the tobacco band (`Catalog97Dashboards.tsx:311-312`) says "Every panel here would rather show a stale number with a date on it than nothing at all." The refuter checked both and set the finding at P2. No workflow in `.github/workflows/` runs on a nightly schedule, with cadences ranging from every few hours, to weekdays for investments, to weekly Tuesdays in season for NFL, to paused in the off-season for La Liga, Premier League and the World Cup. Opened dashboards print "As of May 2025" (/tech-startup-tracker), Apr 28 (/ai-dev-tools), 2026-07-20 (/frontier-models) and Mar 17 (/march-madness-2026), and /fantasy-formula-1 and /mba-internship-notifications print no date at all. The browser-stored tools in the same grid (Wine Cellar, Food Map, Museum Log, Recipe Finder, Travel Planner, Budget Planner) have no snapshot to date. This route is the site's evidence for "shipped and still maintained," and one overclaim a peer can disprove costs more than a modest true sentence.
Fix: rewrite the metadata to what is true, for example "Most dashboards read a committed snapshot refreshed on a schedule, from every few hours to weekly, and a few curated ones I review by hand." Scope the tobacco line to "Every live-data panel", and add a date to the two dashboards that print none. Add a static `kind` per slug beside the category sets in `src/constants/toolCategories.ts:23-69` and print it as the tile's meta line, moving March Madness 2026 and World Cup Pulse under a closed-season kind.
Suggested command: /impeccable clarify

[P2] Tile copy repeats one build-log template and breaks voice rules.
The summaries come from `caseStudies.ts` `overview.summary`, shared with /portfolio. Of the 33 tiles, 29 open "I built" and the rest "I created" or "I designed", and many end in "into one snapshot-driven surface" or "deep-linkable product surface". Frontier Model Tracker ("the spec details product teams actually argue about: context window, blended price…") and Travel Deal Lab ("turns a trip's shape into concrete decisions: when to book…") use colons as sentence connectors, and Bay Area Transit and Earthquake Pulse use "one calm surface", an editorializing adjective. On an Operate surface the one line under a title should help someone choose, and these describe the implementation.
Fix: add a short dashboard-facing line per tool, either an optional field in `caseStudies.ts` or an entry keyed by slug beside the categories, that says what you can find out ("Next BART train at any station and live service alerts"). Keep `overview.summary` for /portfolio, and fix the two colons and "calm" at source.
Suggested command: /impeccable clarify

[P2] The focus outline on pine tiles measures 2.31:1 in light.
The tile focus ring on the Pine field falls under the 3:1 non-text contrast minimum in light mode, so a keyboard user moving through the grid can lose track of which tile is focused on exactly the colour the mosaic uses most visibly. Dark mode was not flagged.
Fix: give the tile focus ring a colour that clears 3:1 on every mosaic field, or add an inner paper-coloured ring so the outline contrasts with whichever field it sits on.
Suggested command: /impeccable harden

[P2] The closing stack states the fail-soft convention three times.
After the mosaic, the Status band (`Catalog97Dashboards.tsx:287-302`), the tobacco line (`:305-315`) and the pine "Refresh fails soft" note (`:46-49`) each say a failed pull shows as a dated stale number rather than an empty page, across roughly 1,400px at 1440, and the "Status" kicker sits above prose that reports no status. It hammers the one claim that is partly untrue.
Fix: delete the Status band, since "Refresh fails soft" covers it, and use that slot for the `kind` legend if it ships.
Suggested command: /impeccable distill

[P3] Nothing finds a tool by name, and the filter is not linkable.
Among 33 tiles the only reducer is category. The tab order runs 11 header stops, then 9 filter buttons, then the first tile, and the active filter lives only in component state (`:93`), so "Dashboards, Sports" cannot be shared or restored.
Fix: sync `active` to a `?category=` search param, and optionally add the same search input /writing uses, matching title and summary.
Suggested command: /impeccable harden

## Persona Red Flags

A VC or product peer from LinkedIn reads "33 instruments I built, and I keep them running." and metadata promising nightly refresh, then opens Tech Startup Tracker to "As of May 2025" and March Madness to Mar 17. Sports is 11 of the 33 tiles, and "Job Search" under Decision tools reads as personal plumbing next to Investment Analytics.

Sam (screen reader) hears each tile's accessible name as the title and whole summary run together ("Investment Analytics PlatformI built an investment research…"), so a links list is 33 sentence-length names. Filter changes are silent and the selected tab is marked by ink colour alone.

Alex (power user) has no find-by-name among 33 and no deep link to a category, and reaches the first tile after 20 tab stops without the skip link. On a pine tile in light mode the 2.31:1 focus ring is easy to lose.

Casey (390) sees the nine tabs wrap to four rows, the first tile at 675px, and an unfiltered page of 10,532px, about twelve and a half screens. The brief settled that trade.

## Minor Observations

The "33" plate repeats the h1 count directly beside it, though `Catalog97Primitives.tsx:30-32` describes plates as section ordinals rather than data, and `aria-hidden` keeps it from being read twice. In two later captures the plate rendered in the serif fallback rather than Anton, which looks like a late web font and was not measured.

The dashboards brief says the filter is `role="tablist"` with `aria-selected`, but the code on this route and /writing is `role="group"` with `aria-pressed` buttons (`Catalog97Dashboards.tsx:156`, `:196`). The code pattern is fine and the brief is out of date. Route metadata `dateModified` is "2026-08-03". "Lifestyle 6" wraps alone onto a second tab row at 1440, which the brief settled.

Shared Catalog 97 shell findings recorded in full in the / snapshot from this run also apply here, from the Working Instrument focus radius and halo in every focus ring (P2), to the theme toggle shifting the header on mount (P2, CLS 0.016 to 0.065), to search Escape dropping focus, the wordmark hit box overlapping the first nav row at 320 to 768, and smooth scroll under reduced motion (P3 each).

## Questions to Consider

What if each tile said what kind of thing it is (live feed, hand-curated, in your browser, closed season) instead of how it was built?

If the tools are personal work and not the headline proof, does the page need to lead with the count twice, once in the h1 and once as the plate?

Should closed-event dashboards like March Madness 2026 and World Cup 2026 sit in their own archive run, so "I keep them running" stays literally true?
