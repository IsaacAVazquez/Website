---
target: fantasy football rankings
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
timestamp: 2026-08-22T00-36-03Z
slug: route-fantasy-football
---
Method: dual-agent (A: design-review agent · B: detector-evidence agent, isolated until synthesis; A completed before detector evidence entered synthesis)

# Critique: Fantasy Football Rankings board (/fantasy-football)

Scope note: this run critiques the rankings board alone, as rebuilt 2026-08-18 into the tier-first design (board-owned drawer added the prior-season PPG panel 08-18 and metric tooltips 08-20). The 2026-08-07 and 2026-08-12 runs under this slug scored the whole four-route fantasy group, so the totals are comparable in standard but not in scope.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Skeletons, aria-live "40 of 520 shown", freshness/staleness chips, URL mirrors every filter |
| 2 | Match System / Real World | 3 | Position boards put position-scale Avg beside overall-scale ADP with the explaining title dead |
| 3 | User Control and Freedom | 3 | Esc closes with focus restore, Back leaves the page; but "Clear search" also silently resets position to Overall |
| 4 | Consistency and Standards | 3 | Metadata chips and tool-link chips share one visual language; expert spread is geometry on the board but a color fill in the drawer |
| 5 | Error Prevention | 4 | Verdict gates everywhere: rank-150 null, 20-selection ADP floor, stale-ADP hides signals, slices labeled with reasons |
| 6 | Recognition Rather Than Recall | 2 | Column labels exist only in one non-sticky `hidden md:flex` header row; mid-scroll and on phones the numbers are recall-only |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts, no sort, queueing takes one drawer round-trip per player |
| 8 | Aesthetic and Minimalist Design | 3 | Value/Reach fact printed twice per row, spread column ~80% empty track in tiers 1 and 2, tool links duplicated |
| 9 | Error Recovery | 4 | Plain-words error card with Retry, slice-unavailable card explains what was not substituted, fail-soft snapshots |
| 10 | Help and Documentation | 3 | Header tooltips, drawer "What is…?" buttons, FAQ; but the row-level help layer is unreachable and phones get none |
| **Total** | | **31/40** | **Good band (28 to 35): solid foundation, address the weak areas** |

All ten heuristics applied (Operate surface). The weak pair, Recognition (2) and Flexibility (2), is exactly where an Operate surface hurts most.

## Design Specificity Verdict

**LLM assessment.** The rebuilt board is authored, not templated. Tier plates carry oversized two-digit numerals with an orange rail that fades with depth, the dashed avg-rank cliff separators scale their own vertical spacing with the size of the consensus drop (the whitespace itself encodes data), expert-spread bars sit on a shared board scale rather than per-row sparklines, verdicts are plain first-person sentences ("Rooms take him about 11 picks before the consensus rank. Plan the reach or let him go."), and the provenance chips wear data honesty as identity. No photos, no logos, no betting-site density. FantasyPros or ESPN could not ship this unchanged. Where it goes generic: the drawer's 2x2 stat-card grid plus full-width meter is stock dashboard grammar, the pill-row filter band is interchangeable, and the FAQ grid is SEO furniture. Missed character: the cliff is the board's thesis yet gets 10px mono and at most 48px of spacing while the tier ordinal gets the display type; the rail's tier-to-tier fade is imperceptible in the pixels; the queue, the only user-authored object here, has no first-class presence. One execution note: the deliberate 2026-08-07 decision kept a headline plus a pitch paragraph for search arrivals, and the rebuild kept only the headline, so orientation now rests entirely on chip vocabulary and an FAQ 4,000px down.

**Deterministic scan.** `detect.mjs` over the board scope exited 2 with exactly one finding: `design-system-font-size` at `src/app/fantasy-football/fantasy-football-client.tsx:1206`, the board h1's `clamp(1.5rem, 3vw, 2.125rem)` has endpoints off the DESIGN.md type ramp. Calibration: this detector reads literal CSS values and is blind to Tailwind utilities and token-referencing style objects (proven 2026-08-07 with a planted positive control), so its near-empty result means "nothing matchable", not "clean". The honest mechanical instruments are the source sweeps and computed-value browser evidence, and those came back strong: zero hardcoded hex, zero `transition-all`, zero arbitrary `text-[Npx]`, zero color-mix toward white/black, zero live legacy tokens (one comment-only `--home-moss` mention), zero radii above 10px on plates, zero WCAG AA contrast failures across 430 measured text elements per theme (parser sanity-gated at 16.29:1 light / 15.28:1 dark for ink on paper; the floor is the cliff label at 4.57:1), zero horizontal overflow at 390/768/1024/1440, zero board-owned touch targets under 44px (drawer controls all 44px or larger), 22 of 22 tab stops with visible focus indicators, a painting skip link, verified drawer dialog semantics with focus trap and Esc restore, no entrance motion to violate reduced-motion (the board client does not import framer-motion), zero console errors or failed requests across every interaction, queue and note persistence verified through a reload, and a clean URL contract (replaceState filters, one Back leaves the page, shared URLs restore state, legacy `?view=` still lands).

**Where the mechanical evidence caught what the design review missed:** the measured identity collapse at 768px (18 of the first 60 rows render the player-name span at 0px width; the review had seen truncation but not collapse), the h1 clamp off the type ramp, and the fact that all 249 `title` attributes on the board sit on non-focusable spans with no `aria-describedby`, 40 of them inside `aria-hidden` subtrees. **False positives set aside:** the 1x1 skip link (paints 198x45 on focus), the Next dev-tools badge (dev-only), a first-pass flag on the drawer tooltip buttons' focus indicator (an outline-only predicate; the real keyboard measurement shows a 2px ring), and the comment-only legacy-token grep hit.

**Visual overlays.** None exist for this run. The app's CSP blocks the live server's script-src and connect-src (verified 2026-08-12), so no in-page overlay was produced or claimed. The fallback signal is the computed-value evidence above plus the screenshot sets in the session scratchpad (`assessA/`, `assessB/`).

## Overall Impression

The rebuild is a real step up. The board now has an authored point of view (tiers, cliffs, honest verdicts) and its mechanical hygiene is close to spotless, which is rare. What holds it at 31 is that the assistance layer fails exactly where Operate mode needs it: the labels, tooltips, and even player names stop working once you scroll, shrink to tablet width, or arrive on a phone. The single biggest opportunity is making the row self-explanatory at every width, because every other strength already assumes it is.

## What's Working

1. **The honesty machinery is load-bearing UI, not fine print.** Freshness chips tone by state, ADP signals hide wholesale when the source goes stale, thin samples produce "no market read" sentences instead of silence, and the drawer footnote separates published data from device-local state. This is the credibility feature executed properly, verified in `fantasyUtils.ts` gates and the rendered chips.
2. **Tier-first structure with data-scaled cliffs.** Grouping rows into plates with rank ranges and player counts, then letting separator spacing grow with the actual avg-rank drop, turns the board's one big question, "where does it fall off", into pre-attentive layout. No competitor board does this.
3. **Accessibility plumbing above genre, mechanically confirmed.** One tab stop per row with a full-row focus ring, radiogroup arrow keys, a real dialog with verified trap, Esc, and focus restore, per-cell sr-only labels, aria-live counts, zero contrast failures in both themes, and genuine dark-mode parity.

## Priority Issues

1. **[P1] The row's entire help layer is dead, for everyone.** The row's open control is an `absolute inset-0` overlay button (`fantasy-football-client.tsx:1104`); hit-testing confirms it swallows hover over every cell, so none of the row's `title` explanations (rank/queue state, spread bar, range, avg, ADP, vs ADP, the Value/Reach chips) can ever fire, and player names cannot be selected or copied. The mechanical sweep adds that all 249 titles sit on non-focusable spans with no `aria-describedby`, and the six column-header hover triggers are non-focusable and inside an `aria-hidden` row, so keyboard and touch users never had a path either. The carefully written tooltip copy in `fantasyUtils.ts` is unreachable at its point of use. **Why it matters:** Value and Reach are the board's most novel labels, and the moment a first-timer hovers one is the moment of a pick. **Fix:** reuse the drawer's "What is…?" pattern, which already does this right (focusable button, `aria-describedby`, `role="tooltip"`): make the header triggers real buttons, and either compose the row's key explanations into the overlay button's own accessible description or lift the metric cells above the overlay with the portal `MetricTooltip`. **Suggested command:** /impeccable harden.

2. **[P1] At 768px, rows lose the player's name.** Measured on the first 60 rows: 58 truncate the name and 18 render the name span at 0px width, all rows whose meta cluster includes a Value/Reach chip (A.J. Brown, Nico Collins, Brock Bowers, Trey McBride, De'Von Achane, Lamar Jackson, and twelve more), corroborated in screenshots. The row keeps rank, position chip, team, bye, and the chip, and drops the one field that identifies the player. **Why it matters:** an iPad-width visitor cannot tell which row is which without opening drawers one by one; identity is the row's primary content. **Fix:** give the name a real minimum width and make the chip or the spread bar yield at that band (the chip's fact is duplicated in the vs-ADP cell anyway; the spread bar is mostly empty track in early tiers). **Suggested command:** /impeccable adapt.

3. **[P1] Metric numbers are unlabeled once you scroll, and always on phones.** The only column-label row is `hidden md:flex` and non-sticky (`:1405`), so mid-board on desktop the labels are gone, and below 768px they never exist; a phone row reads "21.8 10.2 −10.8" with no touch path to any definition (see issue 1). **Why it matters:** recall-only numbers on an Operate surface, held in working memory under draft time pressure; this is the Recognition score of 2. **Fix:** make the label row sticky beneath the controls at md and up (it is one line tall), and below md prefix values with two-character mono micro-labels ("AVG 3.4 · ADP 3.1 · Δ +0.1") or repeat a compact label strip in each tier-plate header. **Suggested command:** /impeccable layout.

4. **[P1] Phones lose every control mid-scroll.** The filter bar is `md:sticky` only; at 390 after any scroll the site header is still pinned while position pills, scoring, and search are gone, and the way back is a long thumb-scroll past up to 40 tall rows. Measured: at 768 and up the stuck band works (bar holds at top 72 after a 2500px scroll), at 390 only the 73px site header remains. **Why it matters:** "jump to RB" and "search Nacua" are the two things a mid-draft phone user does. **Fix:** a collapsed one-line sticky variant below md, active position plus scoring as a compact control and a search icon expanding in place. **Suggested command:** /impeccable adapt.

5. **[P2] The queue is write-only and color-only on the board it lives on.** Queueing requires opening the drawer one player at a time; membership renders solely as an orange rank digit whose explaining title is dead (issue 1), orange is simultaneously the accent for tier rails, cliffs, and focus, and the row's sr-only text does not say "in your queue". There is no count, no queued-only view, and no way to review the queue on this surface. **Why it matters:** "act" is the third step of the board's core loop, and it currently costs a detour per player and reads back through color alone. **Fix:** a row-edge queue control (hover/focus on pointer, always visible on touch), a "Queued (n)" chip in the sticky bar that toggles a queued-only view, and a non-color marker on queued rows, with the state named in the row's sr text. **Suggested command:** /impeccable shape (it changes the interaction model, so shape it before building).

## Persona Red Flags

**Alex (impatient power user, desktop mid-draft):** completes find-judge-act in about 15 seconds via search plus row click, then hits walls: no shortcut to focus search, queueing N players means N drawer round-trips, no sort by vs ADP to harvest Values in one pass, and he cannot copy a player name into his league tab because the overlay button eats text selection (hit-test verified). He keeps the tab open but does his queueing elsewhere.

**Sam (screen reader / keyboard-only):** the flow is genuinely completable end to end, with a verified trap, Esc restore, per-cell sr-only labels, and 22 of 22 visible focus indicators. What breaks: queue membership is conveyed by color alone and the sr text never says "queued", and the six column-definition tooltips are hover-only spans inside an `aria-hidden` row, so a keyboard user can never open the definitions a mouse user gets. Contrast itself passes everywhere, both themes.

**Casey (distracted phone search-arrival, one thumb, on the clock):** arrives mid-draft to roughly 650px of header and controls before the first row; filters live in the URL and queue/notes survive reload, so interruption is safe. Then it breaks: switching to RBs means scrolling all the way back up (issue 4), every metric is an unlabeled number with no touch path to a definition (issues 1 and 3), and on chip-bearing rows the name truncates while fixed-width metrics keep their space. The explicit Load more and the drawer's bottom-anchored actions are real thumb-friendly bright spots.

## Minor Observations

- Position boards (QB/RB/WR/TE/K/DST) render a full "vs ADP" column of dashes because `metricColumns` gates on `adpAvailable` rather than `vsAdpMeaningful` (`:1014`), while position-scale Avg sits beside overall-scale ADP; dropping the dead column and retitling "ADP (overall)" would close both. This borders P2 and is the first thing after the five above.
- The 2026-08-07 hero decision kept a pitch paragraph; the rebuild dropped it. Restore one orienting sentence or bless the leaner chip-only header, but decide rather than inherit.
- Body scroll is not locked behind the open drawer (measured: page scrolls with the dialog open), so closing can land the user somewhere unexpected.
- The drawer's stat grid drops to three cards with a visible hole when vs ADP is gated.
- "Clear search" in the empty state also resets position to Overall, an unrequested second change (`:1352`).
- Expert spread reads as positioned geometry on the board and as a full-width color fill in the drawer; the drawer meter visually reads as a 100% progress bar.
- Spread bars in tiers 1 and 2 are near-invisible slivers on the shared board scale, so the column is ~80% empty track exactly where attention starts.
- The Value/Reach fact renders twice per row (chip beside the name, colored vs-ADP cell); deliberate per the code comment, but tier-3 density shows five chips in eleven rows.
- Tool links appear twice (header chips, footer links) in two treatments; header metadata chips and interactive tool chips share a visual language with only the arrow glyph separating them.
- The board h1's `clamp(1.5rem, 3vw, 2.125rem)` endpoints sit just off the DESIGN.md type ramp (detector's one finding).
- The sticky bar's 90%-opacity blur ghosts chip text through it at 1024; cosmetic.
- The FAQ answers cover none of the board's new vocabulary (tiers, cliffs, Value/Reach, queue).
- The footer's "Now" link measures 34.8px wide; shared shell code, known, not board-owned.
- Dark mode is at parity everywhere measured, and dark contrast floors are higher than light.

## Questions to Consider

1. The cliff is the board's thesis, spacing that is data, yet the display type goes to the tier ordinal. What would it look like if cliff magnitude got the expressive budget instead?
2. Mid-draft, "act" means queue-or-skip, but acting requires a detour through the judgment surface. If the row owned the act and the drawer owned only judgment, does the one-at-a-time bottleneck disappear without a single new screen?
3. The spread column spends 120px saying "experts agree" as emptiness at the top of the board. Is a neighborhood-relative scale more legible, or is the empty track itself the message worth keeping?
4. The drawer already contains a better board (neighborhood walking, verdicts, honest gates). Is the destination a list you open panels from, or a panel you never need to leave?
