---
target: fantasy football
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-12T14-59-45Z
slug: route-fantasy-football
---
Method: dual-agent (A: design-review agent · B: detector-evidence agent, isolated until synthesis)

# Design Health Score

Reviewed live on main at 1440px and 390px, light and dark, all four routes, with a redraft draft running (3 picks) and a best ball room advanced to slot 2. All ten heuristics apply (Operate surface).

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Sticky round/pick/clock bar, aging chips, "Early read" labels; best ball tracker is the outlier with no sticky live-state line |
| 2 | Match System / Real World | 3 | Draft vocabulary native; best ball recommendation chips ("Tier cliff +0.6") assume model fluency at the moment of least patience |
| 3 | User Control and Freedom | 3 | Multi-step undo/redo, Escape closes with focus return, router.replace keeps Back; no Cmd+Z, best ball Undo far from the board |
| 4 | Consistency and Standards | 3 | The two trackers disagree about what a running draft deserves — redraft collapses its header, best ball keeps the full pitch mid-room |
| 5 | Error Prevention | 3 | One-tap logging guarded by prominent undo; disabled buttons explain themselves |
| 6 | Recognition Rather Than Recall | 3 | NEED chips and roster pressure externalize state; drawer has no next/previous; best ball pick context scrolls away |
| 7 | Flexibility and Efficiency | 2 | Zero keyboard shortcuts on a clock-driven surface (only keydown handlers in the group are Escape closers) |
| 8 | Aesthetic and Minimalist Design | 3 | Dense but disciplined, except best ball room board's repeated signal-orange sentences and a duplicated model explainer |
| 9 | Error Recovery | 3 | Fail-soft data states in the row grammar; per-route error boundaries; no live error reachable to judge fallback |
| 10 | Help and Documentation | 4 | "How to read the board", per-metric tooltips, threshold footnotes — contextual, honest, in place |
| **Total** | | **31/40** | **Good** |

Prior snapshot (2026-08-07) scored 25/40; the six remediation passes landed on main under rebased SHAs and the climb is visible in the product.

# Design Specificity Verdict

**LLM assessment:** Authored, unambiguously. Fragment Mono numerals in the pick clock and rank columns, tier rails, freshness chips carrying real timestamps with an honest AGING badge, and copy only this product could ship ("Held until you have 4 picks, because a smaller sample..."). The honesty framing is a visual layer — model-limit disclosures and as-of stamps are composed into the hierarchy. A generic fantasy tool sells certainty; this one sells calibrated doubt, and the design carries that position.

**Deterministic scan:** `detect.mjs --json src/app/fantasy-football src/components/fantasy` exited 0 with `[]` — per the surface brief's planted-canary proof this means "nothing matchable" (regexes cannot read Tailwind utilities or JSX style objects), not "clean". The mechanical browser evidence is the honest instrument here, and it came back strong: zero WCAG AA contrast failures across all four routes in both themes (parser sanity-gated at 16.29:1 ink-on-paper light, 15.28:1 dark), zero horizontal overflow at 390px (innerWidth read back at exactly 390), 15/15 visible focus indicators via real Tab keystrokes including a painting skip link, exactly one main and one h1 per route with every section named, and one touch-target failure — the shared site footer's "Now" link at 34.8px wide, which is site-shell code, not fantasy-surface code. Idle-state scope caveat: running-draft and modal states were not swept mechanically.

**Visual overlays:** none available. In-page detector injection was blocked by the app's enforced CSP (`script-src`/`connect-src` exclude the live server's origin); the live server was started, preflighted, and cleanly stopped. Fallback signal is the computed-value evidence above.

# Overall Impression

This surface group has real craft and a differentiated point of view, and the mechanical floor is now effectively clean. What is left is unevenness: the redraft tracker learned how to behave during a live draft, and the best ball tracker has not caught up. The single biggest opportunity is porting the running-state contract (collapsed header, sticky live line, thumb-reach undo) to the best ball room, and reclaiming signal orange from repeated provenance prose so the one accent means something again.

# What's Working

The honesty framing is the design: "Your rank in this room, modeled", AGING badges, ADP sample size under the number, threshold footnotes in compare. Hierarchy is spent on calibrating confidence, consistently.

The redraft tracker's running-state transformation: setup and mid-draft treated as different jobs, header collapsing to a sticky clock line, undo/redo becoming a fixed thumb bar at 390. The surface reorganizes itself around the clock.

Semantics built in, not painted on: labeled radiogroups, per-row action labels, a real compare table, native details disclosures, focus return on Escape — verified live, and the zero-failure contrast/focus/landmark sweeps corroborate.

# Priority Issues

**[P1] Signal orange spent on repeated prose on the best ball room board** — `best-ball-draft-board.tsx:160` renders full rank-provenance sentences in `var(--home-signal)` at 11px; with roughly a third of the snapshot at the undrafted floor this fires down the whole list and reads as a page of errors mid-scan, and it dilutes the palette's one accent. Fix: drop the span to `--home-ink-muted`, mark adjusted rows with a single signal glyph/chip carrying the sentence on demand. Suggested command: /impeccable quieter (scoped to the room board).

**[P1] Best ball tracker ignores the running-header contract** — `best-ball/draft-tracker/draft-tracker-client.tsx:141-166` renders the h1 plus three paragraphs unconditionally and has no sticky live-state element; mid-room on a phone, "who is on the clock" is off-screen the moment you scroll, and Undo sits a full-page scroll from the board. The 2026-08-07 decision (setup keeps the pitch, a running draft gets one compact line) is decided but unapplied here. Fix: collapse the header when picks exist; make the room-pick strip sticky; move Undo into thumb reach. Suggested command: /impeccable layout.

**[P2] "Why this player" gives no sign it opens** — the recommendation card's native details/summary loses its disclosure marker to `display:flex`, so the one progressive-disclosure home for seven model chips renders as a static label. Fix: explicit chevron in the summary, rotating on `[open]` (`best-ball-recommendations.tsx`). Suggested command: /impeccable polish.

**[P2] Rankings board at 390 orders how-to-look before what-to-look-at** — two set-once control rows (density, view) sit between the heading and the position/scoring/search controls, and "60 of 237 shown" renders ~400px from the rows it counts (`fantasy-football-client.tsx:755-794`). Previously surfaced and deliberately deferred; the file is free now. Suggested command: /impeccable adapt.

**[P3] Zero keyboard support on a clock-driven surface** — no Cmd+Z over a full undo stack, no search focus key, no drawer next/previous. Product work, named twice now; holds Flexibility at 2. Suggested command: /impeccable shape (plan the keyboard layer first).

**[P3] Footer "Now" link is 34.8px wide** — shared site shell, all routes, both widths; not fantasy code but the only sub-44px target the sweep found.

# Persona Red Flags

**Alex (power user mid-draft):** every pick is a mouse trip (search, row, Log pick), a mislog means finding the undo button, the drawer forces close-reopen per player, and the best ball room's orange row-notes must be visually filtered on every scan. "Log the room's next selection" is exactly what Alex wants — there is just no key bound to it.

**Sam (screen reader / keyboard):** genuinely strong overall — labeled radiogroups, per-row action names, real table semantics, role="status" live regions, 15/15 focus indicators. Two flags: truncated rankReason spans carry no title so clipped text cannot be expanded, and nothing anywhere states what happens when the pick countdown reaches zero, which leaves a keyboard user under time pressure guessing.

**Casey (one-handed phone, live draft):** the redraft tracker serves Casey well (fixed Undo/Redo at thumb height, sticky clock). The best ball tracker fails twice: Undo at the top of the live-room card a full scroll from the board, and no sticky pick context, so "is it my turn" costs a scroll round-trip every time. The compare tray correctly stays suppressed on tracker phones.

# Minor Observations

The compare modal's expert-range bars fill in positive-green where wider means more disagreement, so the reassuring color encodes the worrying condition. NEED chips use a positive tint for a deficit (same tension as the known getPositionTone item). "PRIORITY" chips are never defined near the rows that carry them. The running-header h1/h2 inversion persists only below sm (20.5px vs 24.9px) — documented deliberate call, still awaiting a decision. The board sometimes mounts mid-scroll (y=713) — possibly automation-induced, worth a manual check around the mount-time router.replace. The same model-explainer paragraph renders twice on the 1440 best ball room screen. The countdown runs for every team's pick with no stated consequence at zero. Dark mode held everywhere measured.

# Questions to Consider

What is the countdown actually for? An advisory clock that pressures every pick, including other teams', with no stated consequence at zero, may be worth inverting — quiet by default, loud only in your final 15 seconds, which the accent change already half-implements.

Should the two trackers share one running-state contract, or is best ball's divergence a claim its pace is different? Right now it reads as unfinished rather than intended; whichever is true deserves writing down the way the header decision was.

If a third of the board needs a per-row explanation of its rank, is the explanation still an exception — or should the board explain the model once, well, and let rows carry only a mark?
