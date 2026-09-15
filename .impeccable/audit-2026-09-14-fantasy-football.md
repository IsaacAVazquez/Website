# Audit of the fantasy football rankings board, 2026-09-14

This covers `/fantasy-football` on main at `16a11659`, which carries Next 16.3.5 and framer-motion 13.3.0 from PR #439. It followed the Impeccable `audit` playbook. The evidence comes from a computed-value sweep against the dev server and load measurements against a production build served with `next start`, since dev-server timings say nothing about what visitors get. Nothing was fixed in this pass.

## Audit health score

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 3 | The drawer note placeholder measures 3.34:1 in light, and every bordered control's hairline sits under 3:1 |
| 2 | Performance | 3 | A first-visit layout shift of 0.16 on a throttled phone, caused by the mono font swapping in |
| 3 | Responsive design | 3 | The compact controls bar clips the queued filter at 320 and two buttons at 200% text |
| 4 | Theming | 4 | -- |
| 5 | Implementation integrity | 4 | -- |
| Total | | 17/20 | Good |

## Implementation integrity verdict

Pass. The board expresses a coherent, product-specific system, and the implementation keeps that system in tokens and shared patterns.

The detector run (`impeccable detect --json` over the board client, `page.tsx`, `PositionFilterBar`, `SeasonalScopeNote` and `MetricTooltip`) exited 0 with zero findings and no degraded banner. That zero carries no weight on its own, because this surface styles through Tailwind utilities and inline style objects, which the brief proved in 2026-08 the detector cannot read. The source scan is the real evidence. Across the board's files it found zero hex colours, zero `transition-all`, zero `color-mix` toward white or black, zero arbitrary pixel text sizes, zero legacy `--surface-*` or `--color-*` tokens, and zero `will-change`. The only animation is the loading skeleton's pulse, and it sits behind `motion-safe`.

What reads as intentional in the implementation is the row identity cell switching layout through a container query on its own width, the windowed 40-row list with an explicit Load more, the snapshot hook's per-scoring cache with in-flight dedupe and an abort timeout, the server-rendered first page of rows, and the state honesty (disabled slices with reasons, VORP counts, the frozen-since stamp). Nothing on the page is interchangeable with an unrelated product.

## Executive summary

The board scores 17 of 20, which is Good. The audit found zero P0, one P1, four P2 and two P3.

The P1 is that the compact controls bar cannot reflow. At 320 CSS pixels, which is what a 1280 window reaches at 400% zoom, the queued filter button is clipped to 1px, and at 200% text on a phone the search and queued buttons leave the screen. The most useful P2 is a first-visit layout shift on phones that fails the 0.1 Core Web Vitals line, traced to the mono font arriving late and swapping in narrower than its fallback. The other P2s are a light-theme placeholder at 3.34:1, control boundaries under 3:1 across the design system, and the shared site header running past the screen edge at enlarged text sizes.

The next steps are an `adapt` pass on the compact bar, an `optimize` pass on the mono font loading, a one-line `polish` fix on the placeholder, and a decision from Isaac about whether controls get a stronger boundary token site-wide.

## Findings by severity

### [P1] The compact controls bar cannot reflow

Location: the compact controls bar the board renders below `md` in `src/app/fantasy-football/fantasy-football-client.tsx`, inside the board section whose `overflow-x: clip` hides anything that does not fit.

Category: Responsive, Accessibility.

At 320 wide the queued filter button sits at x=319 to 363, so 1px of it is on screen, and the only way to reach the queued view on a narrow screen is that button. The position select, scoring toggle and search button still fit. At a 32px root font size on a 390 phone, the search button's icon lands at about x=540 and the queued button at about x=604, both past the right edge and clipped, and the source chips ("PPR · FANTASYPROS CONSENS…", "ADP STALE · SIGNALS HIDD…") are cut mid-word. The page itself never scrolls sideways, because the clip hides the overflow, which is also why no overflow check at the four standard widths caught it. The 320 reading was confirmed on the production build as well as the dev server.

Standard: WCAG 2.2 SC 1.4.10 Reflow (AA) and SC 1.4.4 Resize Text (AA).

Recommendation: let the compact bar wrap to a second line when its controls do not fit, or move the queued filter onto the count line below it, keeping every target at 44px. Let the header chip text wrap inside each chip so none of it runs off the edge. Re-measure at 320 and at a 32px root font size on a 390 phone.

Suggested command: `/impeccable adapt`.

### [P2] Phones see a first-visit layout shift when the mono font loads

Location: `fragmentMono` at `src/app/layout.tsx:40` (`display: "swap"`, `preload: false`), showing up in the board's header chip strip.

Category: Performance.

With 4x CPU throttling, Fast 4G and the cache disabled, CLS measured 0.1595 in three of three runs, all from a single shift at about 1.7 to 1.9 seconds. Unthrottled at 390 it measured 0, and at 1440 it measured 0. Sampling the header every 25ms shows the mechanism. The four chips first paint in next/font's generated "Fragment Mono Fallback" while Fragment Mono is still loading, at widths of 273, 157, 243 and 187px, which wraps the strip to four lines at 122px. When Fragment Mono finishes, the same chips measure 206, 123, 199 and 151px, the strip drops to two lines at 58px, and the season note and the whole board move up 64px. With `preload: false` the font file is only requested once text that uses it renders, and the generated fallback runs about a third wider than the real face for this uppercase, letter-spaced text. A visitor who taps the scoring toggle or a row at that moment lands 64px away from where they aimed. It only happens when the font is not already cached.

Standard: Core Web Vitals, where good CLS is 0.1 or less.

Recommendation: either preload the mono face so it is present before the chips paint, which spends preload budget the layout's comment deliberately keeps for the other faces, or give it a fallback whose glyph widths match a monospace face closely enough that the swap does not change the line count. Re-measure with the same throttled profile, since unthrottled runs hide the shift entirely. Any Working Instrument route that sets mono labels above its content likely shares this, but only this route was measured.

Suggested command: `/impeccable optimize`.

### [P2] The drawer note placeholder fails contrast in light

Location: the note textarea at `src/app/fantasy-football/fantasy-football-client.tsx:1107`.

Category: Accessibility.

The placeholder ("Handcuff for Hall… target round 6… avoid.") renders #888683 on #f7f6f2 at 3.34:1 at every width in light, and passes in dark. The textarea sets no placeholder colour, so it takes Tailwind's default of half-opacity ink. Both board search inputs set `placeholder:text-[var(--home-ink-muted)]` and passed in the same sweep. This is hint text, so it does not block the note, but it is the only text on the board under the AA threshold.

Standard: WCAG 2.2 SC 1.4.3 Contrast (Minimum) (AA).

Recommendation: add the same `placeholder:text-[var(--home-ink-muted)]` class the search inputs use, then re-measure in light.

Suggested command: `/impeccable polish`.

### [P2] Control boundaries sit under 3:1

Location: every bordered control in the controls bar, meaning the search input, the position and ranking selects, the VORP league-size select, the scoring and ranking segment boxes, the inactive position pills and the queued filter button, all bordered with `--home-rule`.

Category: Accessibility, Theming.

The 1px hairline measures 1.33:1 in light (#d7d6d2 on #f6f5f1) and 1.53:1 in dark (#373633 on #151412), and the control fills sit within 1.05:1 of the paper, so neither the border nor the fill reaches 3:1. Across the sweep, 55 readings came in under 3:1, and in 49 of them the fill did not reach it either. Each control carries text or an icon well above 3:1, and active states render ink fills at 15 to 16:1, which is the argument that the controls are identifiable without their borders. The sweep measured the ratios and did not judge identifiability. The same hairline measured 1.33:1 and 1.52:1 on the budget planner's inputs earlier the same day, so this is the design system's own rule showing up on the board.

Standard: WCAG 2.2 SC 1.4.11 Non-text Contrast (AA), which applies to visual information required to identify a component.

Recommendation: decide once, site-wide, whether interactive controls get a stronger boundary token than the hairline used for dividers. Patching it route by route would split the system.

Suggested command: none until that decision is made, then `/impeccable polish`.

### [P2] The site header runs past the screen edge at enlarged text sizes

Location: the site header's main navigation, which is shared shell and outside this surface.

Category: Responsive, Accessibility.

At a 32px root font size at 1440, the main navigation grew to 1722px and gave the whole page a horizontal scroll. That reading turned out to be an artifact of the method, because scaling the root font size with CSS leaves the site's rem breakpoints where they are. With Chrome's own default font size set to 32px, the header switches to its menu button at 1440 and nothing overflows, while at 390 the same setting pushes the menu button to x=400, past the screen edge, which is the real defect.

Standard: WCAG 2.2 SC 1.4.4 Resize Text (AA).

Recommendation: handle it in a pass on the shared header, where it affects every route that uses it.

Suggested command: `/impeccable adapt`, run against the header.

### [P3] Team and bye text truncates under enlarged text

At a 32px root font size on a 390 phone, the rows' team and bye line truncates to an ellipsis ("CIN · Bye 6" needs 149px in a 91px box), which hides the bye week. The truncation is intentional at normal size and nothing is lost there. Suggested command: `/impeccable adapt`, alongside the P1.

### [P3] A CSS chunk is preloaded and never applied

The production console shows one warning on load, at both 320 and 1440, that a CSS chunk is preloaded and not used within a few seconds of the load event. It was not traced to the route or component that owns the chunk. Suggested command: `/impeccable optimize`, once the owner is known.

## Patterns and systemic issues

Two of the findings are design-system behaviour that happened to surface here. The hairline boundary is the same token on every bordered control on the site, and it measured the same on the budget planner. The mono font's late load and wider fallback would reach any Working Instrument route that sets mono labels above its content. Both are better fixed once at the system level than route by route, and only this route was measured for the font shift.

The reflow gap has a single cause, which is a compact bar that assumes its controls always fit on one line inside a section that clips horizontal overflow. That combination turns a layout that would otherwise scroll into one that silently hides controls.

## Positive findings

The sweep reached 73 of 73 driven states across 390, 768, 1024 and 1440 in both themes plus 320 in light, with the parser gate at 16.29:1 in light and 15.28:1 in dark. Outside the drawer placeholder there were zero AA text failures. There was zero horizontal overflow at the four standard widths, exactly one `main` and one `h1` in every state, zero unnamed sections or regions, and zero heading skips.

Keyboard and focus work is strong. 180 of 180 focus stops painted a visible indicator, and all 20 focus screenshots of the fused scoring and ranking boxes, the league-size select and the position pills show whole rings, so the clipped-ring defect fixed on 2026-09-12 has stayed fixed. The player drawer passed at all eight width and theme combinations, where focus lands inside on open, Tab and Shift+Tab stay inside, body scroll locks, the backdrop does not scroll the page, Close is in view on open, Escape closes, and focus returns to the opener.

Motion and spacing hold. Nothing kept animating under reduced motion, and a control run confirmed the sampler does see the 150ms row hover transition when motion is allowed. The WCAG 1.4.12 text spacing override produced no clipping or overlap.

Load is fast. On a production build at 1440, LCP was 60ms with zero blocking time and zero layout shift. On a phone profile with 4x CPU and Fast 4G, LCP was 1.24 seconds (the season note paragraph) with 58ms of blocking time. The 771 KB PPR snapshot transfers as 119 KB and was requested once per load, which confirms the 2026-09-13 preload fix. The console showed zero errors and there were zero failed requests.

The clear-search race fixed on 2026-09-12 holds. Clearing through the empty-state button and through the compact bar's X passed 60 of 60 trials on the production build.

## Measurements

Production build, three runs per profile, medians.

| Profile | FCP | LCP | TBT | CLS | JS transferred | JSON | CSS | HTML | ppr.json requests |
|---|---|---|---|---|---|---|---|---|---|
| 390, 4x CPU, Fast 4G, cache off | 1,240ms | 1,240ms | 58ms | 0.1595 | 231 KB | 119 KB | 40 KB | 29 KB | 1 |
| 1440, unthrottled, cache off | 60ms | 60ms | 0ms | 0 | 388 KB | 119 KB | 40 KB | 29 KB | 1 |

The JavaScript figures include chunks loaded by the scripted interactions after load, so they are not a first-load bundle size. Interaction latency on the desktop profile peaked at 24ms on keydown. The phone profile's interaction numbers are left out, because the script's search-button match most likely opened the site search, so those numbers describe a different control.

Pinned chrome after a 2,500px scroll measured 188px at 320 and 390, 235px at 768, and 181px at 1024 and 1440.

## False positives already investigated

The dev-server sweep saw "Clear search" leave `q=` in the URL past 1000ms in 4 of 72 trials, cleared by 2500ms, with the input and rows already reset. The URL write is `router.replace` on a dynamically rendered page, which makes a server round trip on the dev server, and the same trials against the production build passed 60 of 60.

The dev server logged 70 "preloaded but not used" warnings, and all of them were a font file and `not-found.css`. Neither appears in production.

The round "N" badge overlapping the position select in the 320 screenshot is the Next.js dev-tools indicator, which does not exist in a production build.

## Not checked

This audit did not check screen reader output or the quality of accessible names beyond their presence, forced colours, real browser zoom (the root font size was scaled instead), real touch devices, Firefox or WebKit, keyboard reach at 320, the text inside the "What is…?" tooltips, reduced motion and text spacing at 768 and 1024, or the scoring box border at 390 and 320.

## Recommended actions

1. [P1] `/impeccable adapt` on the compact controls bar, so it wraps or moves the queued filter when the controls do not fit at 320 or at 200% text, and so the header chips wrap within the chip.
2. [P2] `/impeccable optimize` on the mono font loading, either preloading Fragment Mono or giving it a closer fallback, verified with the throttled phone profile.
3. [P2] `/impeccable polish` on the drawer note placeholder, adding the ink-muted placeholder class.
4. [P2] A decision on a control boundary token, then `/impeccable polish` to apply it site-wide.
5. [P2] `/impeccable adapt` on the shared site header at enlarged text sizes.
6. `/impeccable polish` as the final pass.

## Fixes, 2026-09-14

Isaac asked for every recommended action the same day, and chose to put the stronger control border on the fantasy controls first, with other routes keeping the hairline for now. The fixes are on `fix/fantasy-board-audit-2026-09-14`. Enlarged text was re-measured through Chrome's default font size setting (`Page.setFontSizes`), since the CSS root scaling used above leaves rem breakpoints unchanged.

The compact controls bar wraps, the header chip class no longer forbids wrapping, so chip text wraps inside the chip, and the row's team and bye line no longer truncates. At 320 wide nothing runs past the screen edge and the queued filter is fully reachable. The pinned chrome is 240px at 320, because the bar takes a second line there, and it stays 188px at 390, 235px at 768 and 181px at 1024 and 1440. With the default font at 32px on a 390 phone, no control, chip or header button runs past the edge and the page does not scroll sideways. The site header's top row wraps and moves its phone controls under the name when enlarged text leaves no room. Restoring the truncation in the page left the first 40 row heights unchanged at 320 and 390.

Fragment Mono now preloads and falls back to Menlo, Courier New and monospace. Measured on detached copies of the four header chips, next/font's generated fallback was 273, 157, 243 and 187px wide against 206, 123, 199 and 151px for the real face, while Menlo and Courier New came in at 202, 120, 195 and 147 or 148px. On a rebuilt production bundle with 4x CPU, Fast 4G and the cache disabled, CLS measured 0 in three of three runs, down from 0.1595, the chip strip held at 58px from first paint, and first contentful paint stayed near 1.22 seconds.

A global `::placeholder` rule now uses each input's own text colour at 64% where Tailwind's default was 50%, which took the drawer note placeholder from 3.34:1 to 5.16:1 in light and 6.82:1 in dark. The new `--home-control-rule` token borders the board's search inputs, selects, scoring and ranking boxes, queued filter, compact search button with its clear and Done buttons, and the shared position filter's inactive pills, at 3.52:1 in light and 4.87:1 in dark, with the contrast gate at 16.29 and 15.28.

Typecheck and lint are clean, and the Jest suites for the board, the fantasy components, the site header, the root layout and the fantasy utilities pass at 327 tests.

Three things stay open. The CSS chunk preload warning is still in the production console and still untraced. With the default font at 32px on a 320 screen, the tier plates' cliff labels and the shared footer's contact links run past the edge, which WCAG does not require at that width but is worth a pass. And every route outside the fantasy controls still borders its controls with the hairline.
