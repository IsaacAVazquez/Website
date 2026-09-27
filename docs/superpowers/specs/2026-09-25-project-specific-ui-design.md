# Project-specific UI design

**Date:** 2026-09-25
**Status:** Direction, scope, ink set, and the shared rules approved in conversation on 2026-09-25. The per-project designs below await review.

## What this is

On 2026-09-24 Isaac said that some of the project designs don't make much sense for the thing each one is, and that they feel generic. I screenshotted all 33 routes that `src/constants/caseStudies.ts` links to as a live project, at 1440px in light mode, and I think he is right about most of them. They were built from one template, and the Catalog 97 repaint made the sameness easier to see, because every route now sits on the same paper in the same inks.

The template has four parts. A hero card carries the title and standfirst beside a small snapshot card. Under it, `HomeStatsPanel` renders an "X at a glance" box of eight small stats in a four by two grid with a row of jump-link chips, and 25 routes render it. Five of them, MLB, NBA, NFL, GitHub Trending, and Tech Startup Tracker, then repeat the same numbers in a row of four or five stat cards, and Premier League and La Liga restate them in `StatFascia`. Below that comes a tab row, a list, and a detail rail on the right.

What makes it read as generic is that the template replaced the thing each subject is known for. Earthquake Pulse has the coordinates of every quake and no map or seismogram. Wine Cellar is a form beside a stats grid. Museum Log draws a pink gradient tile with the museum's initials where a picture would go. Recipe Finder is a list of rows. The five league dashboards are one page with a different crest. A few routes had already escaped the template and are the model for the rest, from Food Map's field guide masthead and stamp, to the fantasy football tier board, to F1's start lights and team liveries, to SpaceX's launch tape and countdown.

Isaac made three decisions on 2026-09-25. The site keeps one shared print shop system, and each project gets its own layout, one signature visual, and its own ink pair inside it, rather than becoming a separate microsite or getting only a content pass. All 33 projects are in scope, done family by family with one branch and PR each, merged before the next starts. The riso set grows from three inks to six.

## How this relates to the Catalog 97 unification

The unification spec (`docs/superpowers/specs/2026-09-16-catalog97-unification-design.md`) planned eight route families after the bridge. Families 1 and 2 shipped on 2026-09-22, and families 3 through 8 have not started. Those six families cover the same routes as this work, so each PR here does both jobs at once. It moves its routes off the Working Instrument vocabulary onto the `--c97-*` tokens and classes, and it redesigns them around their signature in the same pass. Doing the migration and the redesign as two passes would touch every route twice and throw half the work away.

| This spec | Unification family | Routes |
| --- | --- | --- |
| PR 0, foundation | part of family 0 | none |
| PR 1, data dashboards | 4 | 9 |
| PR 2, personal tools | 5 (part) and 8 (Food Map) | 6 |
| PR 3, sports | 3 | 10 |
| PR 4, fintech and work tools | 5 (part), 6 (Investments), and 2 (Enablement Assistant, already migrated) | 7 |
| PR 5, fantasy | 7 | 1 project, 10 routes |

Three routes the unification covers are not portfolio projects, meaning `/score-pools` and its two children in family 6 and `/arcade` in family 8. This spec does not redesign them. The unification close-out cannot delete the bridge until they migrate, so they stay on the unification's own list, and I will raise them when PR 4 lands.

## Rules every project follows

The generic structure comes out. `HomeStatsPanel` is removed from every route that renders it, along with the duplicated stat-card rows, `StatFascia` where it restates the same facts, and the chip rows of jump links that only navigated the panel. The component and its `.home-stats-*` styles are deleted in the PR that removes its last consumer.

A hero carries at most three numbers, and they are the ones that matter for that subject. They sit inside or beside the signature visual as `.c97-stat` readouts. Earthquake Pulse's hero, for example, leads with the strongest quake of the day written on the seismogram trace, where today "Past 24h: 242" is one cell of eight.

Each project gets one signature visual, drawn in SVG or with D3 from data the route already has. The repo holds no world or land geometry, so the geographic visuals plot points on a bare latitude and longitude graticule without coastlines. No new runtime dependency is added. If a signature turns out to need data the route does not have, the signature changes to fit the data that exists, and the PR says so.

The print shop grammar from Home applies (`STYLING.md`, "Print shop layout"). The h1 is poster type, `.c97-poster`, Anton caps with the second ink off register. Section headings take `.c97-poster-sm`. The names of things inside a page, a wine, a club, a museum, a repository, stay in Newsreader, since they name a specific thing. Sheets change surface with torn or deckle seams, tone is a halftone screen in the sheet's own ink, and printed things (plates, stubs, cards, primary buttons) sit on the hard `.c97-offset` shadow. Radius and blurred shadows stay banned.

Each page prints in two unlabelled inks. The lead ink is the hero sheet's surface, and the second ink is the overprint on every paper and bone sheet on the page. Data colours are a separate thing and stay data, from team liveries and BART's line colours to party blue and red. A page whose data already means something in blue or red gets inks that are neither, so an ink never reads as a party or a status.

Category colours that are not already in the data come from the `--c97-chart-*` ramp. No component declares a hex literal, which is the existing rule in `CLAUDE.md`, and team or line colours that arrive as hex in a snapshot are applied through inline style from the data the way Formula 1 already does it.

Nothing that has been protected gets weakened. That covers the educational disclaimers and assumption disclosures on the fintech tools and Investments, every "curated, unverified" and as-of disclosure, the fantasy decisions listed under PR 5, and the test ids, roles, and exact text that the e2e specs pin. Where a redesign has to change a pinned string or role, the PR changes the test in the same commit and says why.

Every signature works at 390px without horizontal page scroll, keeps 44px touch targets, honours `prefers-reduced-motion` (including Framer Motion through `useReducedMotion()`), and reads in both themes.

## PR 0, the foundation

Three inks join the set, all real Riso drum colours so the print shop logic holds. The existing inks are toned versions of Riso's published swatches (saffron is `#edb722` and vermilion is `#df4c1e`), and the new ones get toned the same way. The starting values below are Riso's published colours, and the final hex is chosen by measurement.

| Ink | Riso reference | Surface ink | Measured against |
| --- | --- | --- | --- |
| Green | Green, `#00a95c` | the darkest print ink, `#17110d`, unless a lighter paper ink clears | 4.5:1 for body text, both themes |
| Teal | Teal, `#00838a` | paper ink `#f1ebdf` | 4.5:1 for body text, both themes |
| Fluorescent pink | Fluorescent Pink, `#ff48b0` | `#17110d` | 4.5:1 for body text, both themes |

Each new ink gets a `--c97-riso-*` constant, an `ink-*` surface in light and dark with the full token set that `ink-vermilion` and `ink-blue` declare, including status tokens that fall back to the ink where status colour cannot clear 4.5:1, and its measured ratios written in a comment the way `ink-vermilion`'s is.

A page chooses its pair through a `press` prop on `Catalog97ToolShell`, `press={{ lead: "teal", second: "vermilion" }}`. The shell writes `data-c97-press-second` on its root, and a rule of the form `.c97-page [data-c97-press-second="vermilion"] [data-c97-surface="paper"]` sets `--c97-overprint` for the page's paper and bone sheets, which outranks the per-surface default. The lead ink is the surface the route's hero sheet uses.

A `Catalog97ProjectHero` component in `src/components/catalog97/` renders the hero sheet in the lead ink with a torn seam, the poster h1, an optional standfirst, the as-of or disclosure line the route already shows, up to three readouts, and a slot for the signature. It is only the headline sheet, since the signature is the child each route passes in, so it does not become the next template.

The PR also commits the Playwright contrast sweep that the unification work wrote but never committed. It has to parse `color(srgb …)` and `oklab(…)` serialisations, because without that it reports hundreds of false failures.

## PR 1, data dashboards

| Project | Inks | Signature, and the data it draws from | What the page becomes |
| --- | --- | --- | --- |
| Earthquake Pulse | teal, vermilion | A 24-hour seismogram, one trace across the day with each quake a spike at its `time` whose height is its `magnitude`, and the strongest labelled on the trace. Beside it, an epicentre plot with every quake at its `latitude` and `longitude` on a bare graticule, sized by magnitude and shaded by `depthKm`, which draws the Pacific ring without any coastline. | The Recent and Significant lists read as a seismograph log (time, magnitude, place, depth). `DistributionBars`, `MagnitudeBadge`, and the quake detail panel stay. Readouts are the strongest quake, the 24-hour count, and felt reports. |
| News Pulse | blue, saffron | A front page. The masthead carries the pull time as its dateline, and the lead story is the largest `StoryCluster`, set across columns with each outlet's headline for it stacked underneath. Below it, a coverage matrix with outlets down the side and topics across, each cell the count from `TopicCluster.sources`. | Headlines become broadsheet columns grouped by outlet instead of a grid of equal cards. Sentiment and readability chips, the source filter, the feed-error banner, and `data-testid="news-pulse-shell"` stay. |
| GitHub Trending Pulse | green, blue | A `git log --stat` board, where each repository row carries a plus bar proportional to `weeklyStars`, drawn solid when the delta is measured, hatched when partial, and outlined when it is only a baseline. A stacked strip at the top shows each language's share of the week's stars. | The four `MetricCard`s and the panel go. The degraded-source banner and the confidence badges stay. `starHistory` stays off the client, since the snapshot strips it on purpose to keep the payload small. |
| Frontier Model Tracker | fluorescent pink, blue | The existing `FrontierCostContextChart` (price per million tokens against context window, log scale, coloured by provider) moves up to become the hero. | The table below reads as a spec sheet with mono numerals. The stale-review warning and the verification line stay. Readouts are models tracked, the cheapest input price, and the largest context window. |
| AI Dev Tool Ecosystem | teal, saffron | A surface map, a grid with `category` down the side and `pricingModel` across, each tool a small printed plate in its cell that opens the detail when selected. | The filterable directory stays under the map, and the detail rail stays. |
| Tech Startup Tracker | green, saffron | A valuation treemap, each startup a rectangle sized by `valuation` and grouped by `sector` through `d3.treemap`, so a $300B company beside a $6B one shows the concentration the table cannot. | The duplicated `MetricCard` row goes. The unverified disclosure and the momentum score stay. |
| Polling Aggregator | saffron, teal | The approval trend chart becomes the hero at full width with the generic ballot bar under it. Senate and governor races get a tile grid of states by rating, from `stateAbbr` and `rating`, with fixed tile positions held in a small constant, and the grid renders only the races the snapshot has. | Party blue and red stay the data colours, which is why the inks are saffron and teal. The VoteHub attribution, the note that statewide averages stay empty until candidate metadata exists, and the Senate view's e2e heading and table name stay. |
| Bay Area Transit Pulse | teal, saffron | A platform departure board for the selected station, set large like the display on the platform, with the next trains in their line colours and minutes. Beside it, a station map with each station at its `latitude` and `longitude`, ringed in the colours of the lines that serve it. The snapshot has no ordered station sequence per line, so the map draws stations and no line paths. | The Lines, Departures, and Alerts views stay, and so do the fresh, stale-fallback, and unavailable status badges. |
| SpaceX Mission Control | blue, vermilion | Already has one in the launch tape, the countdown hero, and `MissionCadenceStrip`. | A migration and print shop pass. `MissionStatFascia` stays, since it is the route's own row and repeats nothing above it. Every e2e test id stays (`mission-hero`, `mission-board`, `mission-card-*`, `mission-detail-panel`) along with the `status=past` tab state. |

## PR 2, personal tools

| Project | Inks | Signature, and the data it draws from | What the page becomes |
| --- | --- | --- | --- |
| Wine Cellar | vermilion, blue | A rack, a lattice of bottle ends with one per logged bottle, coloured by `type` from the chart ramp and arranged by region. Each tasting in the log is set as a bottle label, with producer, name, and vintage in the label's type and then region, varietal, and rating. | On first visit the rack is empty with its first slot marked to log a bottle. The form rail becomes "Log a bottle". The recent five-stars list, the type breakdown bars, and the half-star stepper stay. |
| Museum Log | fluorescent pink, blue | An admission ticket stub for each museum, perforated, with the name in Newsreader, then city, `founded`, `admissionUSD`, the curator rating, and whether an exhibit is on now. It replaces `MuseumCoverArt`'s gradient and initials. | The Journal becomes a stamped visit record, a date stamp with the rating and note, and Lists read as exhibition catalogues. The exhibit status badge, the logging behaviour, the unverified disclosure, and the `e2e/persisted-tools.spec.ts` flow stay. |
| Recipe Finder | saffron, vermilion | A ruled index card for each recipe, with cuisine and meal in the header, prep plus cook time and servings in the corner, and the ingredient list ticked wherever the pantry has it, so the match reads as ticks instead of a score. | The pantry rail becomes a shelf of labelled tags. The matcher, the staples exemption, and the quick adds stay. |
| Travel Planner | teal, saffron | An itinerary timeline with one column per day from `dayBuckets`, stops placed by `time` and marked by `category`, and overlapping stops flagged from `conflictIds`. The trip header is a boarding pass carrying destination, dates, days until or elapsed, and stops done. | The admin-style left sidebar goes, and trip switching moves into the header. Journal entries become postcards carrying their mood. The empty state is a blank boarding pass with "Start a trip". |
| Travel Deal Lab | blue, saffron | A fare gauge, the region's typical band (`typicalFareLow`, `typicalFare`, `typicalFareHigh`) as a scale with a needle at the quoted fare, and a booking calendar strip that marks the sweet-spot window from `sweetSpotMinDays` and `sweetSpotMaxDays` relative to the departure date. | The points calculator reads as cents per point against the 1.4 cent baseline. The unverified disclosure and the dated estimate note stay. |
| Food Map | vermilion, saffron | Already has one in the field guide masthead, the stamp, and the map. | It moves off the `--fm-*` palette onto Catalog 97 surfaces, which is unification family 8, and keeps the masthead, stamp, ribbon, curator legend, and map in the new vocabulary. The map tiles moved onto OpenStreetMap in PR #467. |

## PR 3, sports

| Project | Inks | Signature, and the data it draws from | What the page becomes |
| --- | --- | --- | --- |
| Premier League Pulse | green, blue | A points ladder, clubs placed on a vertical points axis so the gaps between the title race, the European places, and the relegation line read as distances. The table itself is set like a matchday programme, with the zones printed as bands behind the rows. | The panel and `StatFascia` go. `GoalsPulseStrip`, `ResultsTape`, and `ClubDrawer` stay, as do the e2e h1, table name, and `pl-selected-club`. |
| La Liga Pulse | green, vermilion | The same ladder and programme table as the Premier League, since the two routes share one component tree. | The same removals. The e2e h1, table name, and `la-liga-selected-club` stay. |
| MLB Pulse | green, vermilion | An out-of-town scoreboard, the six divisions set as a manual scoreboard (team, W-L, games back) with each team's last ten from `MlbFormSummary.sequence` as lit squares in the team's `primaryColor`, which the snapshot carries and the page never used. | The panel and the four `StatCard`s go. Standings, team detail, and the leaders stay. |
| NBA Pulse | saffron, blue | The playoff picture, each conference as a seed ladder with seeds 1 to 6 in, 7 to 10 in the play-in band, and the rest out, the games-clear gap drawn at each line, and team chips in `primaryColor`. | The panel and the five `StatCard`s go. |
| NFL Pulse | vermilion, blue | A seed ladder of 1 to 7 per conference with the playoff line, plus the eight divisions as a grid striped in each team's `primaryColor` and `secondaryColor`. | The panel and the four `StatCard`s go. The "through week" stamp stays, since early-season standings rest on only a few games. The NBA and NFL ladders share one component. |
| World Cup Pulse | teal, vermilion | The knockout bracket drawn as a tree from the round of 32 to the final, from `WorldCupKnockoutRound[]`, ending at the champion. The tournament finished on 2026-07-19, so the page reads as a final record. | Group tables sit below the bracket. The countdown only shows while a kickoff is still ahead. |
| PGA Tour Pulse | green, saffron | A manual leaderboard with names on slats, `roundScores` in the round columns, the cut line drawn across, and under-par numbers in red, which is golf's convention. The player detail is a round-by-round scorecard with the birdie, bogey, par, and eagle counts. The snapshot has no hole-by-hole scores, so the scorecard shows rounds and counts and no holes. | The panel goes. The table, mobile cards, and player rail stay. |
| Formula 1 Pulse | vermilion, blue | A timing tower, the broadcast-style position list with the gap to the leader and the round's movement from `previousPosition` and `pointsDelta`, in team livery. | The panel goes. The start lights, the countdown, the livery bars, and the podium stay, and so does the Drivers view button's `aria-pressed` that the e2e spec checks. |
| Fantasy Formula 1 | saffron, vermilion | The garage, the five driver slots and two constructor slots drawn as pit boxes, with the budget meter as the cost bar across them. | The panel at the bottom of the page goes. The optimizer, the lock toggles, and `data-testid="fantasy-formula-1-lineup"` stay. |
| March Madness Bracket Analysis | blue, vermilion | A bracket diagram per region from the region data (first round to the Elite Eight), with the upset picks marked on it. | The editorial stays. Everything `e2e/march-madness.spec.ts` pins stays, from the headings, deep links, and JSON-LD blocks to the exact strings like "San Jose, CA (PT)" and "Vanderbilt +5". |

## PR 4, fintech and work tools

| Project | Inks | Signature, and the data it draws from | What the page becomes |
| --- | --- | --- | --- |
| Budget Planner | green, saffron | Envelopes, each category an envelope whose fill shows `spent` against `budgetedAmount`, drawn torn open once it goes over budget. | The expenses ledger reads as a check register. The panel and the meta chip that duplicates it go. The month stepper, CSV export, and `data-testid="budget-planner-shell"` stay. |
| Interchange IQ | blue, saffron | The statement, each processor's monthly fee for the current inputs as a bar on one shared scale with the cheapest marked, and the breakeven bar promoted out of the body text. `calcProcessorResults` does not split fees into parts, so the bars are totals and nothing is stacked. | The panel goes. The disclosure that interchange-plus totals leave out network and assessment fees stays, along with the educational note and `data-testid="interchange-iq-shell"`. |
| Rent vs. Buy Calculator | teal, vermilion | The existing `NetWorthChart` (buyer and renter net worth by year, with the break-even marker) moves out of the narrow rail and becomes the hero. | The three input cards sit under it. "Educational only, not financial or tax advice", the assumptions and limits disclosure, and the tax note stay word for word. |
| Investments | blue, saffron | Already has one in the instrument tape, the allocation chart, and the retirement fan chart. | It moves off its own dark terminal palette onto Catalog 97, which is unification family 6. The terminal reading stays, printed on espresso and chocolate sheets with mono numerals. Both disclaimers stay word for word, and so do `data-testid="investments-shell"`, the "Investments" h1, `#research-section`, and the `symbol=` and `section=` parameters. |
| Decision Lab | fluorescent pink, blue | The existing `DecisionMatrix` quadrant becomes the hero, with the verdict (ship, test, or hold) printed across it like a rubber stamp, and the "Why this verdict" contribution list beside it. | The panel and the duplicate meta chip go. The PR also fixes the blank body my 2026-09-24 screenshot showed, after confirming its cause, which looks like a page-wide Framer Motion fade that starts at opacity 0. |
| Automation Enablement Assistant | blue, saffron | Already has one in the team adoption table and the drift cards, and it was built natively in Catalog 97 in family 2. | A light print shop pass on headings and seams. The model boundary note and the seed-data note stay. |
| Job Search | teal, vermilion | The application pipeline as stage columns (applied, responded, interview, offer) with the count in each and the conversion rate between them, from `MBAApplicationInsights`, and the needs-attention list pinned beside it. | The panel goes. `live-jobs-grid`, `manual-checks-grid`, and the funnel and attention text the 15 client tests pin stay. |

## PR 5, fantasy

The fantasy suite never used the generic panel. Its tier plates and cliff lines, the range bars, and the draft rooms are already its signature, so this PR is the unification's family 7 plus the print shop grammar and a green and saffron press. It does not reopen what the surface briefs and the 2026-09-14 audit decided. The position tints stay, the controls keep their heavier border, the board heroes stay on the two boards and stay cut on the trackers, board order is never re-ranked locally, flex and quarterback ranks never merge, the waiver reading stays rank percentile minus rostered percentage, simulated rooms stay labelled simulated, the trade package table describes only the offered assets, and the best ball scoring mismatch stays a documented trade-off. `e2e/fantasy-football.spec.ts` and `e2e/fantasy-trade-calculator.spec.ts` are the regression net and have to stay green.

## Verification for each PR

Each PR runs the lighter loop Isaac set on 2026-09-14, meaning one combined sweep and one review agent, refuters on P1 findings only, batched fixes, and one post-fix sweep. It does not step back up to the full loop.

Before a PR opens, the route's Jest suites and every e2e spec that touches its routes pass, and so does `tsc --noEmit`. The committed contrast sweep reports no failures on the changed routes. I screenshot each changed route at 1440px and 390px in both themes and look at every one. The `DESIGN_CHECKLIST.md` pass runs, including its print shop section. New or changed copy gets checked against `WRITING_VOICE.md`. Main is merged in and the sitemap is regenerated before the push, since snapshot refreshes land on main with `[skip ci]`.

## Open items

`/score-pools` and `/arcade` still need their unification migration before the close-out can delete the bridge, `HomeStatsPanel`, and `.tool-*`. The `/design/catalog-pages` canvas still describes the old Pine and Tobacco rules and is not changed here.
