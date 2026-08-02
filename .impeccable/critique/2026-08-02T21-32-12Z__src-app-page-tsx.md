---
target: home page (The Atlas)
total_score: 18
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 3
timestamp: 2026-08-02T21-32-12Z
slug: src-app-page-tsx
---
# Critique of Home ("The Atlas")

Method: dual-agent (A: design review, Playwright · B: detector + DOM evidence, chrome-devtools). Both ran isolated and never saw each other's output. One provenance note. B returned first, so detector evidence reached the synthesis context before A's review. A's judgment is still unanchored because A ran in a sealed context, but the parent ordering the playbook prefers did not hold. Not a degraded run, and disclosed rather than hidden.

Every high-stakes finding below was re-verified against the repo by the synthesizing pass, not relayed on an agent's word. Where verification widened a finding, that is called out.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live readouts carry an as-of stamp and their own provenance, but two of the three Survey index cells report the identical 33 |
| 2 | Match System / Real World | 2 | The card verb "Survey" reads as questionnaire first, and "Open the full map" leads to a grid |
| 3 | User Control and Freedom | 3 | No traps, working skip link and theme toggle, but the clock and T-minus tick forever with no pause (WCAG 2.2.2) |
| 4 | Consistency and Standards | 2 | "Plate" names three different objects, two button systems on one page, two serif italic gestures, fake-bold mono, nine font sizes off the documented ramp |
| 5 | Error Prevention | n/a | No user input, no destructive action, readouts fail soft server-side |
| 6 | Recognition Rather Than Recall | 2 | `B·2` is a recall task on a map with no lettered or numbered axes to decode it |
| 7 | Flexibility and Efficiency | 2 | Five section anchors exist in the markup and nothing links to them; no way to jump between plates |
| 8 | Aesthetic and Minimalist Design | 3 | Real restraint everywhere except three thumbnails that outweigh the titles they sit above |
| 9 | Error Recovery | n/a | A failed readout drops its row silently; there is no error surface to evaluate |
| 10 | Help and Documentation | 1 | The legend defines one of five mark types on the chart |
| **Total** | | **18/32** | **Acceptable (56%)** |

Two heuristics scored n/a, so the maximum is 32 rather than 40. Heuristics 7 and 10 were scored rather than waived, which the playbook permits waiving on a Persuade surface, because this surface genuinely has a legend and genuinely has multi-plate navigation. Both apply here.

## Design Specificity Verdict: PARTLY AUTHORED

The chrome is authored and the content system underneath it is not.

What is real is that the live feed could not be lifted onto another site without lying. It reads a USGS magnitude with depth and place, a 12-bar magnitude spark, a SpaceX T-minus that ticks per second and degrades to "NET Aug 4" when the schedule has no exact T-0, and a SPY close delta, then stamps its own provenance next to a Pacific-time clock. The mono readout row, the hairline plate bar, and the single demoted tools strip are Working Instrument evolved with intent.

Where it fails is the brief's own contract, which says every map element carries real information and nothing cartographic is decorative. `TERRITORY` and `PROJECT_PLOTS` in `HomeInstrument.tsx:80-96` are two hardcoded coordinate lists with no relationship to each other or to the project data, and the code comment concedes it ("Positions are a schematic layout, not a geographic claim"). Investment Analytics Platform is categorized Fintech and plotted at B·2 (33, 47) while the Fintech region label sits at (58, 19). Interchange IQ is also Fintech and plotted at E·3 (79, 63), on the far side of the map from the project that shares its domain. News Pulse Dashboard is categorized "News & data," and that region does not exist on the map at all. The regions and the stations are two unrelated decorative systems sharing a canvas.

The compass is worse than decorative. I verified `page.module.css` directly, and `.compass::after` draws its signal-orange tick at `top: 100%`, which puts it below the N. The one north indicator on a survey chart points south.

**Deterministic scan.** `detect.mjs` on `src/app/page.tsx` returns 0 findings, and that zero carries no information. The file is 161 lines of async server data-loading with zero JSX markup and zero `className` attributes, so there is nothing for a regex detector to match. The stylesheet scan is where render truth lives: `src/app/page.module.css` returns 10 findings (exit 2). One is `codex-grid-background` at line 61, verified rendering on three elements, and the Atlas concept justifies a graticule, so it stays a judgment call rather than a defect. The other nine are `design-system-font-size`, and they are not detector noise. Not one of the nine flagged values matches a documented step in DESIGN.md's own ramp.

The scan's more useful result is what it ruled out. `transition-all` is absent, because although 131 elements compute `transition-property: all`, all 131 have `transition-duration: 0s` and every one is an SVG element, so that is the CSS initial value and the absence of any transition. `color-mix(…, white)` exists in six Tailwind-generated rules in `layout.css` and matches zero elements on this page. Of the six rule names that habitually produce false positives on this machine, five were never emitted at all. In the in-page detector, the top-level array held 36 elements carrying 42 findings, so reading `.length` under-reported by six. Thirty of the 31 `undersized-ui-text` hits are the tokenized 10px `text-3xs` step and are project-standard. The 31st is real, and it is the only arbitrary micro-type value on the surface.

**Visual overlays: none available.** Injection from the live server was refused by the site's own enforced CSP (`script-src 'self' …`, and port 8400 is not `'self'`), which is the site behaving correctly. Assessment B reached the detector by staging a same-origin asset in `public/`, running the scan, then deleting it and hard-reloading. That is disclosed rather than presented as a clean injection, and it means there is no overlay sitting in a browser tab for you to look at now. The working tree is clean and the live server was stopped through its own stop path.

## Overall Impression

The instrument is real and the atlas around it is mostly costume. The live feed is the best thing on the page because it demonstrates the H1's claim instead of asserting it, and the restraint in demoting 33 tools to one quiet strip is genuinely hard to do. But a peer with 40 seconds reads the first viewport, gets "Projects 33 / Live tools 33 / Essays 197," which is volume, and PRODUCT.md says explicitly that volume is not the headline proof. Then they scroll to the section that promises "each with what it actually moved" and find three descriptions and three years.

The single biggest opportunity is that the evidence this page needs already exists in the repo, one import away. The career record in `src/constants/personal.ts` carries 99.999% uptime, NPS moved from 23 to 36, a 90% defect cut, and a 90% onboarding-time cut. I grepped the home surface and not one of those strings appears anywhere on it. The page is measuring earthquakes and rockets while the numbers that would actually persuade this audience sit unused.

## What's Working

**The live feed is an argument, not an ornament.** It works because the H1 claims Isaac builds tools that make hard problems easier to act on, and 400px to the right, three of those tools are visibly running. The `sourceNote` line ("Committed snapshots across three production tools") is what makes it credible instead of theatrical, because it volunteers its own limitation rather than overclaiming a live API.

**The demotion of the tool fleet is real restraint.** The entire 33-tool body of work gets one bordered strip, one paragraph, one link. No grid, no logo wall, no counter. Deleting your own volume is the hardest restraint there is, and it preserves the visual budget for the three featured cards, which is exactly what PRODUCT.md asks for.

**The keyboard and landmark layer beats most production marketing sites.** Thirty tab stops with DOM order matching visual order, no positive `tabindex`, no traps, and a 2px signal ring plus a 3px halo on everything including the 427×464 project cards, where a lot of sites lose the ring. All six sections carry an `aria-labelledby` whose target resolves, with exactly one `h1`, one `main`, and no skipped heading levels. Signal orange covers 0.025% of the viewport by filled area and 0.77% by the generous bounding-box measure, so the One Signal Rule is honored by a factor of thirteen.

## Priority Issues

No P0. A visitor can still form a judgment. Everything below damages that judgment rather than blocking it.

### [P1] The survey index does not reconcile, and it is above the fold

**What.** I verified this at source. `page.tsx:141-143` sets `projectCount: allProjects.length` and `liveToolCount: liveTools`, where `liveTools` sums `getLiveToolGroups(allProjects)`. That function counts any project with a `link`, and `caseStudies.ts` has 33 `link:` fields across 33 projects, so both cells report the same 33 records. The function's own doc comment says so out loud ("the same definition the hero uses for its 'live tools' count"). Plate 03 then prints "Past the featured sites, 33 smaller tools run across…" while that 33 includes the three featured sites. The real number past them is 30, and they are not smaller.

**Why it matters.** This is a page whose entire visual conceit is a precision instrument, and whose product's first principle is never to fabricate. The target reader reads decks for a living and checks whether numbers reconcile. An index that does not add up is the fastest available way to lose that reader, and it is visible before any scroll.

**Fix.** Make the three cells measure three different things. Either compute `liveToolCount` as `liveTools - featuredProjects.length`, or drop the Live tools cell for something orthogonal like years shipping or refresh cadence. Rewrite the Plate 03 sentence to `{toolTotal - heroProjects.length}` and drop "smaller."

**Suggested command:** `/impeccable clarify`

### [P1] Plate 01 promises outcomes and delivers descriptions

**What.** The dek reads "The three sites plotted on the map above, each with what it actually moved." Each card then renders a "what it is" sentence plus a year. I checked `caseStudies.ts` and all three featured projects have `result: { outcomes: [] }` and `northStarMetric: ""`. There is no number to render. Meanwhile `getProjectCardOutcome()` already exists in that file and goes unused here, and the real career figures sit in `personal.ts:39,55,63`.

**Why it matters.** For the peer persona this is the section. Promising evidence and delivering a description is worse than not promising, because it draws attention to the absence. PRODUCT.md's positioning leans on the thinking and the track record, and the page currently proves neither, so it proves volume instead.

**Fix.** Either change the dek to match what the cards say, or better, add a fourth mono readout line per card using the existing helper and surface two real career figures in the Plate 02 fact legend, where a legend row is already the established form. Do not invent numbers; use what is in `personal.ts` as written.

**Suggested command:** `/impeccable clarify`

### [P1] Accessibility regressions against the standard the site sets for itself

**What.** Both assessments measured these independently and agreed to within 0.02. The map zone labels (`.zone`, five of them, 10px) compute **2.14:1 in light and 2.80:1 in dark** against 4.5 required. `.panelClockZone` ("PT") renders at **8.4px** from `font-size: 0.84em` on a 10px parent, off the tokenized ramp entirely, at **3.03:1 light**. The market delta `.feedRdMeta` measures **4.46:1**, which misses AA by 0.04. Four footer links (Now, Changelog, Accessibility, isaacvazquez.com) render **25.9px tall**, 18.1px short of 44, and Assessment B ruled out the WCAG 2.5.8 inline exemption because they are `display: block` inside a `<nav>` with no sibling text nodes. Separately, the PT clock and the T-minus update every second indefinitely with no pause, stop, or hide, which the reduced-motion guard does not cover because it only disables a keyframe and three hover transforms.

**Why it matters.** PRODUCT.md states that the site already enforces a 44px minimum touch target and honored reduced-motion as concrete standards to preserve. These are the places the code does not match that claim, and the zone labels are the map's only text, so a low-vision reader sees a grey grid with three orange dots and no way to know what the regions are.

**Fix.** Lift `.zone` off the 34% ink mix to at least a 60% mix. Replace the `0.84em` on `.panelClockZone` with a tokenized step. Nudge the negative status token or the metadata size so the delta clears 4.5. Give the footer links vertical padding to reach 44px. Add a pause control, or stop the ticking after a period of no interaction.

**Suggested command:** `/impeccable audit`, then `/impeccable harden`

### [P2] The Atlas is decoration in the places the brief says it must not be

**What.** Covered in the specificity verdict. The regions and plots are unrelated constant arrays, the grid refs decode against nothing because the map has no lettered or numbered axes, the marker-to-card correspondence is inert with no hover link and 800px of scroll between them, and the compass tick points south. The whole chart is `aria-hidden`, so none of it exists for a screen-reader user.

**Why it matters.** The brief pins the direction as "every map element carries real information; nothing cartographic is decorative." Judged against its own contract, roughly half the cartography fails. On a page built to signal exactness, marks that do not mean anything cost more than they would elsewhere.

**Fix.** Derive positions from real data. If a project's coordinates came from its actual category and ship date, then the grid ref would decode, the two Fintech projects would sit together, "News & data" would exist as a region, and the other 30 tools could sit behind the three bright ones as faint dots. Failing that, cut the marks that carry nothing (compass, corner ticks, grid refs) rather than keeping them as costume. Flip the compass tick to `bottom: 100%` either way.

**Suggested command:** `/impeccable distill`

### [P2] Design-system drift that actually renders

**What.** Six separate violations of DESIGN.md's own named rules, all confirmed in the rendered DOM rather than inferred from source.

Two Instrument Serif italic gestures render where the One Gesture Rule permits one ("easier" in the `h1`, "judgment" in the ContactCta `h2`, both 56px). Two elements request Fragment Mono at weight 600 (`.footer-home-colophon` and `.is-strong`), and `document.fonts` confirms the family ships only weight 400, so Chrome synthesizes fake bold against the Honest Mono Rule. The ContactCta `h2` renders at **56px at weight 640**, identical in size to the `h1` and heavier, so it reads as a peer of the page title while being announced a level below. The H2 scale is non-monotonic across the page (41.6, 33.6, 22.4, 41.6, 56), and "The wider territory" at 22.4px sits 1.6px above the H3s beneath it, so a real level distinction is invisible on the page and still announced. Nine font sizes in `page.module.css` match no documented step in DESIGN.md's ramp. And `.writeRow` declares four grid columns at `page.module.css:1053` while the component renders five children, so the fifth wraps to an implicit second row and every writing row shows an orphan chevron sitting under its index number at any width above 640px.

The card thumbnails are the widest instance. `investment-analytics-platform.svg` is built from four hardcoded hexes including `#C9F23B`, a bright acid yellow-green that appears nowhere in the palette and neighbors the prohibited legacy `--home-acid`, on a fixed `#EBE6D6` ground that does not track the theme, so in dark mode the three become the brightest objects on the page. My own check widened this past what the review found, because that acid green is in **56 project SVGs**, not three, so it is a site-wide asset problem rather than a home-page one.

**Why it matters.** DESIGN.md is the contract, and these are its named rules failing in the rendered output. Three of them (the serif gesture, the fake bold, the H2 sizing) live in shared components, so they are not scoped to this surface and they propagate everywhere the footer and ContactCta appear.

**Fix.** `.writeRow` is a one-word fix, `grid-template-columns: auto auto 1fr auto auto`. Drop the second serif italic. Set the two mono elements back to 400 and use Instrument Sans if they need emphasis. Bring the ContactCta `h2` down off 56px and reconcile the H2 steps to the documented ramp. Regenerate the project SVGs from tokens, in two theme variants or with `currentColor`, and do that as its own pass because it touches 56 files.

**Suggested command:** `/impeccable polish` for the surface, `/impeccable extract` for the shared components and the SVG set

## Persona Red Flags

**Jordan (confused first-timer).** Lands on "PLATE 00 / THE OVERVIEW / 37.8715°N · 122.2730°W" with nothing explaining what a plate is or why coordinates are here. Cannot read the five map region labels at all, because they measure 2.14:1. The one legend entry says "Surveyed site," which explains the dot and none of the other four mark types. The dek says "33 of these tools" before anything has been enumerated, so "these" has no antecedent. Then the index shows Projects 33 and Live tools 33 and Jordan either assumes a bug or stops trusting the numbers. The card action reads "SURVEY →", which Jordan parses as a questionnaire.

**Casey (distracted, one-handed mobile).** At a verified 390px the first thing on the page is the plate bar shattered into three two-line stacks, because `.plateBar` is a flex row with no wrap and its three children each break internally below 500px. Total page height is 5967px, about seven screens. The chart map renders 306×191 with 10px labels and three markers that are indistinguishable at that size, so the memorable moment costs a full screen and delivers nothing. What works is that the "See the work" CTA is a 48px pill at roughly y=565, thumb-reachable in the first viewport, and every interactive target inside `main` measures at least 44px at 390. Reaching "Send email" costs about 5600px of scroll.

**Sam (screen reader and keyboard only).** The mechanics are genuinely good, and this is the strongest measured area on the page. But the entire Atlas is `aria-hidden`, so the map, the zones, the plots, the legend, and every grid ref are stripped. What Sam does get is the Survey index reading "Projects 33, Live tools 33, Essays 197," where the redundancy is more confusing without the visual context, plus bare unexplained "Plate 00 / Plate 01 / Plate 02" strings. The clock and countdown update every second with no control, which is the WCAG 2.2.2 exposure above.

**Riley (Haas classmate, now at a growth-stage fund).** Arrives from a LinkedIn link after a coffee chat with about 40 seconds and one question, which is whether this person actually moved anything or just makes things. Reads the H1 and believes it. Scans for evidence and gets volume. Scrolls to Plate 01, reads "each with what it actually moved," reads three cards that say "I built… / I built… / I created…" with years, and finds no number. Nowhere does Riley encounter Civitech by name, the 99.999% uptime, the NPS move from 23 to 36, the 90% defect cut, or the 90% onboarding-time cut. Riley is also exactly the reader who notices that Projects and Live tools are the same 33. Leaves with "prolific, tidy, builds side projects," which is the wrong conclusion for this audience, and the page had every piece of evidence needed to prevent it sitting one import away.

## Minor Observations

The first viewport does not earn the scroll. At 1440×900 the hero plate runs from 105 to 879 and the fold is at 900, so nothing from Plate 01 is visible and the first `h2` starts 99px below it. The plate is a closed rectangle with registration corner ticks, and that grammar says the sheet is complete. For a Persuade surface where all the proof lives below the fold, that is the largest strategic risk on the page.

Contrast sits on the AA line nearly everywhere else, with `.sectionPlate` and `.folioNo` at 4.57 and a cluster of metadata styles at 4.82 to 4.87. Dark mode is more comfortable at 6.45 to 6.55. Two button systems run on one page (48px pill sans sentence-case in the hero, 46px 2px-radius mono uppercase in the ContactCta), and the second undercuts the documented 48px height. The reduced-motion guard misses `:focus-visible`, so a keyboard user with the preference set still gets the 4px card jump. At 768px the work grid puts three cards in two columns, leaving card 3 alone on row 2 and 24px shorter. Five section anchors exist and nothing links to them. `page.module.css:645-659` keeps a commented-out legacy block, and `NowLine.tsx`, `HomeStatsPanel.tsx`, and `InstrumentCounter.tsx` sit unimported. A stale `btnAcid` class name survives in ContactCta even though it now correctly uses `--home-ink` and `--home-signal`, so it will invite the wrong edit. `investment-analytics-platform.svg` carries `loading="eager"` and `fetchpriority="high"` while sitting below the fold and not being the LCP element.

On performance there is nothing to fix. LCP is 233ms and the LCP element is the `h1` text, CLS is 0.00, all 24 requests return 200 or 304, and there are no JavaScript errors in either theme at any width from 360 to 1440. Because LCP is type, the three lazy images without `fetchpriority` are the correct state and flagging them would have been a false finding.

Copy is clean against the voice spec on every hard rule, with no em dashes, no colons as connectors, no bullet-with-bold-label lists, and none of the AI-tell vocabulary. There are two soft flags. The Plate 04 dek "Field log. What I've been thinking through lately." is two stacked fragments where the spec wants fragments rare and smoothed into flowing sentences, and the Plate 01 dek is a verbless fragment that is also the unsupported claim in the second priority issue.

## Questions to Consider

What if the map plotted itself? If position were derived from a project's real category and ship date rather than from two hand-authored constant arrays, the grid ref would decode, the two Fintech projects would sit together, the missing region would exist, and all 33 tools could be faint dots behind the three bright ones. The map would stop being a picture of an atlas and become one, and the density would do the persuading for free.

Why does the instrument measure the world instead of measuring Isaac? The live feed proves three tools are running, which is real and worth keeping. But the strongest numbers available to this page are career figures sitting unused in the repo. An earthquake magnitude proves he wired a feed, and an NPS move from 23 to 36 proves he moved a product.

Is the closed plate costing the whole page? The hero terminates 21px above the fold with corner ticks that announce completion, and 100% of the proof is below it. What changes if the graticule bleeds past the plate border and continues down the page, so the scroll cue comes free from the cartography instead of from a bouncing arrow?

If a peer only ever saw one screen, is this the screen? The page opens with an index and a world-data feed and holds the human, the career, and the outcomes back until screen three.
