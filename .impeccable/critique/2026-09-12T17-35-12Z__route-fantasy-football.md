---
target: fantasy football rankings
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/Users/isaacvazquez/Website/route:/fantasy-football"
timestamp: 2026-09-12T17-35-12Z
slug: route-fantasy-football
closed: true
---
Method: dual-agent (A: design review subagent · B: detector and browser evidence subagent), synthesized in the parent. Run 2026-09-12 against the dev server on main at `6d12f70f`, the day after the in-season loop landed. Measured at 390, 768, 1024 and 1440 in light and dark, nine driven states each, 72 of 72 reached, parser gate reproduced at 16.29:1 light and 15.28:1 dark.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The amber "Aging · source Sep 10" chip sits over a note saying the board is frozen from Week 1 by design, and the grade turns red "Stale" on Sep 14 for the rest of the season. |
| 2 | Match system / real world | 3 | Drawer verdicts still speak to a draft that ended ("Value if he lasts to your pick", "Take him on schedule") while the page says the season has started. |
| 3 | User control and freedom | 2 | "Clear search" and the phone X both resurrect the cleared query within 150ms. Typing the query away works. |
| 4 | Consistency and standards | 2 | Position tints borrow the status hues, the board drawer is a right slide-over on phones where the sibling surfaces use a bottom sheet, and at 768 the column labels sit 59px left of their columns. |
| 5 | Error prevention | 3 | Unavailable slices disable with a reason, VORP disables when unpublished, position boards drop the meaningless vs-ADP column. The clear-search race is the exception. |
| 6 | Recognition rather than recall | 3 | Column names pin on desktop and phones get per-value micro labels, but those labels are 10px mono abbreviations and the header chips are 10px too. |
| 7 | Flexibility and efficiency | 2 | Seven tooltip tab stops precede the first action in the drawer, VORP mode discards the tier and cliff structure, and a quarter of the 1440 viewport is pinned chrome. No shortcut layer (known). |
| 8 | Aesthetic and minimalist design | 3 | Accent discipline is excellent (0.19% of the viewport on the consensus board), but the control row wraps at 1440 and the phone row spends a 44px line on the star. |
| 9 | Error recovery | 2 | Error and empty states are well built, but the primary recovery action in the empty state fails silently after a 50ms flash of success. |
| 10 | Help and documentation | 3 | Tooltips and FAQ are thorough, but the footer line says "weekly after" draft season while the cron runs daily through December. |
| **Total** | | **26/40** | **Acceptable** |

Down from 30 on 2026-09-11. The drop is one functional defect that three earlier critiques did not enter the state to see, not a regression from yesterday's remediation: the debounce that causes it landed 2026-08-22 in #398.

## Design Specificity Verdict

**LLM assessment.** This is an authored instrument, and it is authored for this product. The parts that carry the page are not skinnable defaults: the tier plates with a two-digit numeral and a signal-intensity left rail that fades by tier (100 down to a floor of 12), the dashed cliff rules whose gap scales with the measured average-rank drop (plate margins of 34, 14, 20 and 29px against cliffs of 3.8, 1.3, 2.2 and 3.2), the per-row expert-spread bar on a board-wide scale, the mono readout row with the queued rank digit turning signal, and the drawer's verdict sentence with a coloured left rule. Signal Orange is 0.19% of the 1440 viewport on the consensus board and 0.47% in VORP mode, and the one Instrument Serif gesture is the italic "Rankings" in the h1. Nobody who has used FantasyPros or ESPN would mistake this for either.

Where it slips toward generic web is at the edges and on the phone. The FAQ is three cards in a grid, the empty state is a dashed box with a pill, and the phone collapses the pill row into a native select that reads like any settings form. The position pills tint QB with the signal, RB with positive green and TE with warning amber (`src/lib/fantasyUtils.ts:702-735`), which is the one place the palette stops being the instrument's own vocabulary and becomes a sports-site convention that collides with the page's status colours. The phone row at 112px in four stacked lines no longer reads as a ledger row at all. On desktop the board earns its specificity in Operate mode; the phone is where the authored language has not been translated.

**Deterministic scan.** `impeccable detect` exited 2 with 71 findings, every one in `src/app/globals.css` and zero in `page.tsx`, the board client, or `src/components/fantasy/`. 68 sit on selectors that count zero elements on this route (`.prose-writing`, `.wp-*`, `.resume-*`, `.progress-bar`, an unused `--easing-spring` token, range-input thumbs). The three that render are `design-system-font-size` advisories on `.home-inline-link` and the two header link classes, which are shared shell. The detector did not match the tier plates' own 3px signal left border at `fantasy-football-client.tsx:1480-1485`, which is the recorded Tailwind blind spot, so the count says nothing about this surface's code. No `DEGRADED` banner printed; the launcher reports engine 0.1.5.

**Visual overlays.** No user-visible overlay is available. Script mutation works on the page, the live server started on port 8400 and served `detect.js`, but the injected script was blocked. The blocker is not the report-only header at `next.config.mjs:262`, which only logs. The response also carries an enforcing `content-security-policy` built in `src/proxy.ts:34-41`, and that one blocked the load: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://unpkg.com … The action has been blocked." The live server was stopped and confirmed gone. The computed-value sweep is the fallback signal, and it came back clean on every threshold: zero AA contrast failures in 72 states (floor 4.57:1 on the 10px cliff label), zero horizontal overflow, one main and one h1 everywhere, zero unnamed sections, 25 of 25 focus rings in every context with a painting skip link, zero `transition: all`, zero plate radii over 10px, only the three system fonts, zero console errors and zero failed requests across every interaction, drawer trap and Esc and focus restore and body scroll lock all verified, and the URL contract holding (replaceState on filters, one Back leaves the page).

## Overall Impression

The desktop board is the best-executed Operate surface in the fantasy group. It turns a 559-row list into a shape a drafter can read without reading a number, and the accessibility craft under it is real rather than decorative. What is wrong today is one functional defect on the recovery path, one honest signal contradicting another in the header, and a phone translation that has not happened. The single biggest opportunity is the phone row, because the phone is the mid-draft device and it currently shows one row on arrival and four per screen after.

## What's Working

The tier and cliff instrument works because it turns rank into shape. The rail intensity, the plate header ("01 · Tier · 6 players · R1 to R6"), and the cliff gap that grows with the drop let a drafter see where the board falls off, and the whole thing costs under half a percent of the screen in accent.

The accessibility craft holds under measurement. The overlay-button row pattern keeps every cell in the row's accessible name while giving keyboard users one target; focus lands on the dialog on open, Escape closes it, focus returns to "Open Puka Nacua detail", the radiogroup moves on arrow keys, tier sections are named with counts and the cliff above them, and the count line is a live region on both breakpoints.

The state honesty is unusually complete. Unavailable slices disable with the reason, VORP mode says "394 without a published VORP", position boards relabel ADP as "ADP (overall)" and hide the value and reach machinery, thin ADP samples get "no market read" instead of a false "agreement", and a slice-scoped miss offers "Found on the overall board".

## Priority Issues

[P0] Clearing the search resurrects the query. On desktop the empty state's "Clear search" and on the phone the X in the search bar both empty the input and show the full board for about 50ms, then the query returns, the empty state returns, and the URL never drops `q`. Reproduced twice on desktop and once on the phone with no Fast Refresh in the console. Deleting the text by typing works. The mechanism, verified at source: both handlers call `setSearchQuery("")` and `updateRouteState({ query: "" })` in the same tick (`fantasy-football-client.tsx:1898-1901`, `2169-2172`). The URL replace lands before the 200ms debounce fires, so the sync effect at `1115-1120` re-runs with `routeState.query` empty and `debouncedQuery` still holding the old text, and it writes the old query back into the URL, after which the effect at `1101-1109` writes it back into the input. This matters because it is the primary recovery action in the empty state, it fails silently while the live region keeps saying "0 of 187 shown", and the visit can end on the site appearing broken. Fix: guard the sync effect so it only writes when the debounced value has caught up with the typed value (`if (debouncedQuery !== searchQuery) return;`), or drop the direct `updateRouteState` call from the two clear handlers and let the debounce write the URL the way typing already does. Add a test that advances fake timers past the debounce after the clear, since the existing "clears only the query" test passes synchronously. Suggested command: /impeccable harden.

[P1] The freshness grade contradicts the in-season note. Today the header shows "Aging · source Sep 10" in warning tone and the footer says "Aging board · source updated Sep 10", one line under a note saying every board is deliberately frozen from Week 1. `sourceStaleness` at `:1170` never consults `seasonalWeek` at `:1158`, and `getSnapshotStaleness` bands at two and four days from July through December (`fantasyUtils.ts:94-143`), so from Sep 14 the chip reads red "Stale" for four months. Two truthful signals with no shared model, and the red one wins the eye, on the credibility feature the brief says never to drop. Fix: when `seasonalWeek >= 1`, replace the staleness chip and the footer line with a neutral "Frozen since Sep 10" stamp and skip grading. Also correct the fresh-state footer sentence at `:2224`, which says "weekly after" draft season while the cron in `update-fantasy.yml` runs daily July through December. Suggested command: /impeccable clarify.

[P1] The phone row is four lines tall. At 390 every row is 112px: rank, name, position and team on line one; VORP, Rng, Avg and ADP on line two; "±ADP" wrapped alone onto line three; and the 44px star wrapped onto its own fourth line because it is `ml-auto` inside the same wrapping flex container (`:1583-1695`). Four rows fit per screen under 188px of pinned chrome, and the first row lands at y=708 on arrival because the five header chips wrap to four lines (`:1337-1367`). Operate mode lives on scan density and the phone is the mid-draft device. Fix: absolutely position the star at the row's top right so it never takes a line, give the phone metrics a two-column grid so ±ADP sits beside ADP, and shorten the ADP chip on phones so the strip holds two lines. Suggested command: /impeccable adapt.

[P1] The desktop control bar wraps at 1440 and pins a quarter of the viewport. The pills, scoring and ranking boxes end at x=1103 of a 1213 edge, so the 200px search and the Queued button wrap to a second line, and with the column-label row the sticky bar is 151px (178.6px at 768). Scrolled, header plus bar pin 223px, which is 24.8% of 900, leaving twelve rows. In VORP mode the league-size select adds 92px and it still wraps. At 768 the same bar is worse in a different way: every column label sits 59px left of its column (VORP label at 295 against a cell at 354) and rows wrap to two lines, so the md-only band has labels over the wrong numbers. Fix: move Queued and the count line onto the column-label row, drop the search to about 160px, and match the label offsets to the row's md geometry (the 08-23 pass matched the ADP header to its cell at lg; the md band was not measured). Target under 110px pinned. Suggested command: /impeccable layout.

[P2] The critical-path preload is discarded. `page.tsx:35-37` calls `ReactDOM.preload(url, { as: "fetch" })` with no `crossOrigin`, and `useFantasySnapshot.ts:83` fetches with default credentials, so every context logged "A preload for '/data/fantasy/ppr.json' is found, but is not used because the request credentials mode does not match" seven times and the JSON is fetched twice. The comment in the file describes this as the fix for the serial HTML, JS, JSON path, so the fix is not in effect. Fix: pass matching `crossOrigin` on the preload, or fetch with `credentials: "same-origin"` on both sides, and confirm the warning is gone. Suggested command: /impeccable optimize.

## Persona Red Flags

Alex (impatient power user): the "Clear search" button failing after a 50ms flash; the search field wrapping to a second line of the control bar and 223px of pinned chrome once scrolled; seven tooltip tab stops before the neighborhood list in the drawer; VORP mode collapsing 40 rows into one plate with no tiers or cliffs, so the shape reading he came for disappears when he switches ranking; no jump-to-tier and no shortcut layer (known).

Sam (screen reader, keyboard): the empty-state "Clear search" fails with no announcement, so the live region keeps saying "0 of 187 shown" after a successful-sounding click; five "What is Consensus avg?" style buttons announce before any data in the drawer; the staleness chip is a plain span with no role or live behaviour, so its contradiction with the `role="note"` is never surfaced. Everything else on the keyboard path held under measurement.

Casey (one-handed phone, mid-draft): first row at y=708 on landing; 112px rows with the star on its own bottom line; the X in the search bar resurrecting the query; drawer Close at the top-right corner (311, 20) with a 23px backdrop strip as the only other dismiss; "Add to queue" at y=862, below the 844 fold; the underlined-label tooltips in the drawer open on hover or focus only (`MetricTooltip.tsx:200-235`), which likely makes them unreachable on iOS Safari (not verified on a device).

## Minor Observations

[P2] Position tints borrow the status vocabulary. QB pills are a signal mix, RB a positive-green mix, TE a warning-amber mix (`fantasyUtils.ts:702-735`, `PositionFilterBar.tsx:99-108`), so a green "RB1" sits beside a green "Value +6.7" and an amber "TE" chip echoes the amber "Aging" chip. DESIGN.md resolves categorical needs to ink and stone mixes. The brief records this as a system-wide decision rather than a cleanup, and it is now the same finding on a second run.

[P2] Drawer tab order and phone reach. After Close, Tab visits five tooltip triggers and two "?" chips before the neighborhood and "Add to queue" (`:689-742`, `:989-1006`). On the phone the drawer is a 367px right slide-over where the shared drawer used by the sibling surfaces is a bottom sheet.

The drawer's stat grid has five cells, so VORP sits alone in the last row. The board's own drawer never renders movement even though 524 of the 559 overall rows carry `rankMove7d` or `adpMove7d` in `public/data/fantasy/ppr.json`; the known-open "Movement" item lives in the shared drawer this route does not use, so here the data is absent from the UI. The Half PPR count reads "of 985" against PPR's "of 559", which is data but reads like an error on a scoring switch. The 10px cliff label in light measures 4.57:1, past AA by 0.07. Tier 1 expert-spread bars render as slivers because the scale is the window's max rank. An instant jump to the page bottom did not auto-extend the list within 1.5s at any width; the incremental scroll did, at 1024 and 1440 only. Heading inversions are all shared shell: the build note h2 at 34px and the Contact CTA h2 at 44px over the 33.6px h1 at 1440, and the CTA h2 at 30.4px over the 25.7px h1 at 390. Copy is clean: zero em dashes in user-facing strings (the ten "—" matches are the empty-value glyph), en dashes only in numeric ranges, first person only where the FAQ speaks.

## Questions to Consider

If the board is frozen from Week 1 by design, why is it still grading its own freshness, and should the in-season page be a different, quieter artifact (a dated reference card) rather than the draft instrument with a warning taped to it?

The phone is the mid-draft device and the row there is a stack of four lines. Would a two-line ledger row showing only rank, name, tier and one chosen metric, with the rest in the drawer, serve the pick better than a faithful shrink of the desktop columns?

VORP mode throws away the tiers and cliffs, which are the page's signature. Is there a VORP-native equivalent, gaps in value between adjacent players, that keeps the instrument's shape when the sort changes, or should the mode admit it is a different tool?
