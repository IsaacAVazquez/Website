---
target: home page (The Atlas)
total_score: 19
max_score: 24
na_heuristics: 5,7,9,10
p0_count: 0
p1_count: 2
timestamp: 2026-07-25T21-04-28Z
slug: src-app-page-module-css
---
# Critique — Home ("The Atlas")

Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Strong live feed/clock/badges, but "Next launch T-00:00:00" reads as a stopped timer |
| 2 | Match System / Real World | 3 | Map metaphor self-explains; Plate/Survey/folio jargon puzzles briefly, scale-bar metaphor forced |
| 3 | User Control and Freedom | 4 | Clear nav, theme toggle, no traps |
| 4 | Consistency and Standards | 3 | Great token discipline, but Instrument Serif italic used 3x (One-Gesture rule is once) |
| 5 | Error Prevention | n/a | No user input on this surface |
| 6 | Recognition Rather Than Recall | 3 | Grid refs A·1/B·2 ask recall of a map convention anchored to nothing |
| 7 | Flexibility and Efficiency | n/a | Persuade/landing surface |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained palette, but cartographic chrome is additive ornament |
| 9 | Error Recovery | n/a | No error states |
| 10 | Help and Documentation | n/a | Self-evident persuade surface |
| **Total** | | **19/24** | **Good (79%)** |

## Design Specificity Verdict: AUTHORED (strongly)

Stations are Isaac's real domains, coordinates are real Berkeley, the "field readings" are the genuine production feed that proves the maintained-system claim, index counts are real. Not reskinnable. Caveat: a subset of marks carry no data (scale bar labeled "Field of work" with no scale, card grid refs referencing no map, corner ticks) and tip toward costume, undercutting the contract's "every mark carries real information."

Deterministic scan (detector): TSX clean (0). CSS module: 1 warning (layout-transition: animating `padding-left` on `.writeRow` hover, page.module.css:1028 — genuinely actionable, use transform), 11 advisory (10 off-ramp `clamp()`/font-size on display type — intentional, low signal; 1 codex-grid-background line 58 — judgment call the Atlas concept justifies). Browser overlay could not inject: the site's own restrictive CSP correctly refuses the external overlay origin (a strength, not a defect); no visible overlay available.

## What's Working
1. The world is wired to real content, not reskinnable — the single biggest win; directly answers the credibility job.
2. Building-first hierarchy honored structurally: primary CTA is "See the work", work plate (01) precedes writing (04), tools demoted to one strip (03).
3. The live-feed panel is an honest proof engine: dated, moving evidence in the site's own idiom.

## Priority Issues
- [P1] Two focal centers in the first viewport. The right chart-field (5 orange dots + pinging live dot) out-magnetizes "See the work", so the eye lands on the instrument, not the action. Fix: quiet the chart field so the cartouche/CTA wins. → /layout (or /quieter)
- [P1] Survey-index hierarchy contradicts building-first. "Essays 196" is the loudest figure and dwarfs "Projects 32"; 32/32 (projects == live tools) reads as placeholder. Fix: lead with Projects/Live tools, cap or drop the essay count, break the 32/32 coincidence. → /clarify (or /distill)
- [P2] Non-informational cartographic marks risk "costume, not substance" for a skeptical VC. Scale bar (no scale), grid refs (no map), corner ticks. Fix: make each mark load-bearing or cut the weakest. → /distill
- [P2] Zeroed countdown reads broken. "Next launch T-00:00:00" shows all zeros in the panel meant to prove liveness. Fix: handle the post-window/loading state. → /harden
- [P3] Serif italic gesture overused (easier / follow-through / judgment = 3x). Keep the hero one, drop one. → /typeset
- [P3] Perf/quality: `.writeRow` animates `padding-left` (layout thrash). Use transform. → /polish

## Persona Red Flags
- Jordan (first-timer): card action labeled "Survey" (not "Open/View"); Plate/coordinate jargon unexplained on first contact.
- Casey (mobile): clean stacking, no overflow, but the whole second screen is chart+feed chrome before the first project card; pinging dot competes with CTA.
- Sam (a11y): good aria-hidden on decorative marks, real focusable links, focus-visible present. Risk: 10px muted-mono labels (--atlas-muted on raised paper) borderline for WCAG AA — verify contrast.
- Riya (VC peer, 5s scan): gets proof fast via live feed, but "196 essays" (writing-first), the zeroed countdown (broken), and lime-green covers out-shouting the accent in dark mode could each cause a skeptical pause.

## Minor Observations
- Projects 32 / Live tools 32 identical reads placeholder. Plate coordinate repeats the kicker's Berkeley coordinate. Compass "N" ~11px from map edge (tight, not clipped). Dead CSS: unused .nowLine/.nowLead/.nowText. In dark mode the lime covers beat the signal accent on the work plate.

## Questions to Consider
1. If you deleted the three data-less marks (scale bar, grid refs, corner ticks), would the world read as less serious or more?
2. The loudest number is "196 essays" and the loudest dark-mode color is lime cover art, not your accent — both pull against "building-first, quietly precise." Is the design saying what you want?
3. In a 5-second scan, does the eye go to "See the work" or the pinging live dot?
