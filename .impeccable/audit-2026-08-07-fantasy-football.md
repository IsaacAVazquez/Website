---
target: route:/fantasy-football
command: audit
total_score: 17
max_score: 20
p0_count: 0
p1_count: 2
p2_count: 4
p3_count: 4
timestamp: 2026-08-07T22:12:38Z
branch: audit/fantasy-combined
slug: route-fantasy-football
---

# Audit, fantasy football surface

Run on branch `audit/fantasy-combined` at commit `ed346677`, which merges `fix/skip-link-and-status-contrast` into `refine/fantasy-draft-tracker-hierarchy`, so both remediation branches are present together for the first time. Four routes measured at 1440x900 and 390x844, in light and dark, against a dev server that was already running. Every number below came out of a Playwright assertion on computed values, and the contrast parser was sanity-checked at 16.29:1 for ink on paper before I believed a single finding.

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3 | 13 light-mode contrast failures, all from ink-muted and signal sitting on tinted plates. Dark mode is clean. |
| 2 | Performance | 4 | LCP 288ms, zero console errors, zero failed requests, zero images to mis-prioritise. |
| 3 | Responsive Design | 4 | Zero horizontal overflow on all four routes in both themes. One undersized target, and it is site-wide furniture. |
| 4 | Theming | 3 | Token discipline is perfect across 56 files, but light-mode signal and ink-muted have so little headroom that any tint breaks them. |
| 5 | Implementation Integrity | 3 | Coherent and product-specific in the atoms. The boards still open with a display headline and a pitch ahead of every control. |
| **Total** | | **17/20** | **Good (address weak dimensions)** |

## Implementation Integrity Verdict

**Pass.** The implementation expresses a coherent, product-specific system, and I can back that with numbers rather than impressions.

The deterministic detector still cannot see this surface, and I did not re-run it. The surface brief already proved that with a positive control, where a planted `.tsx` carrying a `#667eea` gradient and a `transition: all` returned zero findings while the identical declarations in a `.css` file fired. So a zero from `detect.mjs` here means nothing matchable, not clean, and spending run time on it would only produce a number that looks like a pass. URL mode is unavailable because puppeteer is not installed, and I did not install it.

The real mechanical check for this codebase is the computed-value assertion, and it comes back clean. Across 56 non-test TypeScript and TSX files under the fantasy routes, the shared fantasy components, the best ball library, and the breadcrumb component, I found zero hardcoded hex values, zero legacy `--surface-*`, `--text-*`, `--border-*` or `--color-*` tokens, zero `transition-all`, zero `color-mix` toward literal white or black, and zero arbitrary `text-[Npx]`. The only surviving mention of `--home-moss` is a code comment recording that it was retired. Every plate radius resolves to 8px or below, because `--radius-3xl` is defined as 8px in `globals.css:225`, so the 99 `radius-xl`-family class names in the tree are all under the 10px ceiling rather than over it. All four non-test Framer Motion consumers call `useReducedMotion`.

Where the surface still reads as interchangeable is composition, and it is the same half-answered finding the critique raised. On the rankings board at 390px the `h1` sits at y=121 and the first control, the position filter, does not appear until y=815, with the first player row at y=1094, which is 1.3 screens. The brief is explicit that the Operate mode applies to the board too, and the board is still shaped like a landing page. `layout` fixed this on the tracker and nobody has taken it to the boards.

## Executive Summary

Audit Health Score **17/20**, rating band Good.

Ten issues, none blocking. Two P1, four P2, four P3.

The five that matter most, in order:

1. Light-mode `--home-ink-muted` and `--home-signal` fall under 4.5:1 whenever they sit on a tinted plate, which produces 12 failing nodes on the redraft tracker and one on every route that renders a breadcrumb.
2. "Your pick is live" measures 3.87:1, and the layout remediation pass is what introduced that colour pairing while it was correctly fixing the announcement.
3. The heading level collapses on the redraft tracker, where at 1440 the `h1` and the following `h2` both render at 34px, so the level change is spoken and invisible.
4. The pick clock goes quiet at exactly the moment it should be loudest, reverting from signal to ink the instant it expires.
5. Both boards still open with a display headline and a pitch paragraph ahead of every control, on a surface whose mode is Operate.

Everything structural is right. One `<main>` and one `<h1>` on all four routes, no unnamed sections or navs, focus indicators on all 30 focusable elements I walked, dialogs with correct labels, focus containment and focus restore, and zero horizontal overflow anywhere.

## Did the six passes hold?

I checked all eleven claims in the brief rather than trusting them. Nine hold outright, one holds with a caveat, and one is wrong.

| Claim | Verdict | Measured |
|---|---|---|
| Skip link visible and hit-testable on focus | Holds | 197.9x44.8 at (16,16) after one Tab from a fresh load, `clip: auto`, `clip-path: none`, hit test returns itself |
| Status tokens clear 4.5:1 as text | Holds | positive 5.31/4.95/5.36, warning 5.28/4.92/5.33, negative 5.35/4.98/5.40 on paper, paper-alt, paper-raised |
| First "Log pick" near y=1022 at 390px with a draft running | Holds | y=1021 |
| Undo in a fixed bottom bar | Holds | `div.fixed.inset-x-0.bottom-0.z-40.sm:hidden` at y=775, height 69, Undo and Redo both 175x48 |
| Clock takes `--home-signal` at 15s or less | Holds | signal `rgb(201,63,25)` sampled at 13s, 10s, 8s, 5s and 3s, at 31.31px Fragment Mono |
| "Your pick is live" with `aria-live="polite"` | Holds, but see P1-2 | `role="status"`, `aria-live="polite"`, border-radius 3px so not pill-shaped, and 3.87:1 |
| Position filter shows all 8 options at 390px | Holds | 8 options, all 44px tall, wrapping to two rows, zero hidden-scroll containers on the page |
| Compare reachable on mobile | Holds | 63 toggles in the DOM and 63 visible at 390px, each 44x44 |
| Compare modal is a real table with a non-colour winner cue | Holds | real `<table>` with a caption, `th scope="col"` on players and `scope="row"` on metrics, winner marked with a "Best" text token plus an icon at 12.59:1 |
| Zero `--home-moss` | Holds | zero usages in 56 files, one comment recording the retirement |
| Filter changes use `replace` so Back leaves the page | Holds | four position taps left `history.length` unchanged at 49 |

Two further brief claims I could check came out mixed. The compare tray does collapse from 136px to 56px, and the chip max-width is now 192px so "Washington Commanders" renders in full at 148px with the full name on `title`. That all holds.

The claim that does not hold is the sentence "Every named finding in it is now closed." The critique's P1 named `--home-ink-muted` at 4.25:1 on the signal-tinted tile in `DraftAnalyticsPanel.tsx`. That node still measures exactly 4.25:1. The remediation darkened the three status tokens, which was the larger half of that finding, but it never touched `--home-ink-muted`, so the specific instance the critique called out survives.

## Detailed Findings by Severity

### [P1] Light-mode ink-muted and signal fail on tinted plates, 13 nodes

**Location:** `src/app/fantasy-football/draft-tracker/components/DraftBoard.tsx:426` and `:479`; `src/app/fantasy-football/draft-tracker/components/DraftAnalyticsPanel.tsx:137` and `:141`; `src/components/navigation/Breadcrumbs.tsx:141`
**Category:** Accessibility
**Attribution:** [pre-existing]. Blame puts all three plates on `b5e7d7ec1` (2026-07-02) and `88b97327f` (2026-08-05), all before the 2026-08-07 remediation, and the uncommitted lineup diff does not touch any of those line ranges.

Three patterns produce every failure, and they share one cause. `--home-ink-muted` measures 4.88:1 on plain paper and `--home-signal` measures 4.57:1, so both clear the 4.5:1 floor by almost nothing. The moment either sits on a tinted plate, the tint lifts the background luminance and the ratio drops under.

The starting-priority row on the draft board tints its plate with `color-mix(in srgb, var(--home-positive) 7%, var(--home-paper))`, which resolves to `rgb(229,236,230)`, and the row's meta line at `:479` renders `--home-ink-muted` on it at **4.43:1**. That is 10 of the 13 nodes, at 14.26px on mobile and 16px on desktop, both needing 4.5.

The emerging-run card tints with `var(--home-signal) 10%`, resolving to `rgb(242,227,219)`, and its body copy at `:141` renders **4.25:1**. This is the exact node the critique named and the brief records as closed.

The breadcrumb current-page chip puts `--home-signal` text on a 10% signal wash and measures **3.96:1** at 14.26px/600. That one is site-wide furniture rather than a fantasy defect, and it appears on every route in this group.

*Why it matters:* these are the values people squint at mid-draft, and the failures are all on the route with the clock. Because the cause is token headroom rather than a local mistake, it will keep recurring anywhere the design puts muted text on a tinted plate.

*Recommendation:* do not patch this in the fantasy components. Darken light-mode `--home-ink-muted` and `--home-signal` until each clears 4.5:1 with roughly 0.4 of headroom on the tinted surfaces the system actually uses, then re-sweep. Alternatively, define a paired `--home-ink-muted-on-tint` and require tinted plates to use it. Dark mode needs no change, since the same four pairings measure 5.43 to 5.73 there.

*Suggested command:* `/impeccable harden`

### [P1] "Your pick is live" measures 3.87:1, and remediation introduced it

**Location:** `src/app/fantasy-football/draft-tracker/components/DraftBoard.tsx:276-282`
**Category:** Accessibility
**Attribution:** [remediated surface]. `git blame` puts lines 276 through 282 on `7f061b8d`, the layout pass.

I verified this on the live page rather than by calculation, by pointing the user team at the team on the clock, which made the header read "Pick #6 on the clock: Your Turn". The status region then renders "Your pick is live" as `--home-signal` on `color-mix(in srgb, var(--home-signal) 12%, var(--home-paper))`, which is `rgb(241,223,215)`, at 14.26px weight 500. That measures **3.87:1** against a 4.5:1 requirement.

What makes this worth calling out separately is that the layout pass did the hard part correctly. It gave the message `role="status"` and `aria-live="polite"`, and it stripped the pill shape that made it impersonate a button. Then it coloured the fixed version with signal-on-signal, which is the one pairing this palette cannot afford. The identical pairing on the clock is fine, because the clock number is 31.31px and large text only needs 3:1, so the same 3.87:1 passes there. The status line is small text and does not.

*Why it matters:* this is the single message on the surface that a user has to catch, and it is now the lowest-contrast text on the page in the state where it matters.

*Recommendation:* keep the signal border and the tinted background as the emphasis, and set the text itself to `--home-ink`, which measures 16.44:1 on that plate. The signal border already carries the urgency.

*Suggested command:* `/impeccable harden`

### [P2] The heading level collapses on the redraft tracker

**Location:** `src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx` (the running-state `h1`) against `DraftBoard.tsx:210` (the `h2`)
**Category:** Accessibility
**Attribution:** [remediated surface]. The collapsed `h1` is the compact running header the layout pass introduced.

At 1440 the `h1` "My Fantasy League" renders at **34px** and the following `h2` "Pick #6 on the clock: Team 6" also renders at **34px**, so the two are indistinguishable on screen while a screen reader announces a level change. At 390 it inverts outright, with the `h1` at **20.53px** under the `h2` at **24.88px**.

The brief records this as a deliberate inversion at 20.5px against a board `h2` at 30.4px and asks someone to decide about it. The measurements say it is a different and slightly worse shape than recorded. It is an exact size collapse at desktop, not just a quiet page title, and the `h2` it collides with is the pick header rather than the board heading.

It is also inconsistent across the group. The best ball tracker keeps a 36.33px `h1` with a draft running and shows no collapse at all, so the two trackers disagree about whether a running draft should quieten the page title.

*Recommendation:* pick one behaviour for both trackers. If a quiet title mid-draft is right, keep it and drop the pick header to `h3`, or restyle so the rendered sizes match the outline.

*Suggested command:* `/impeccable typeset`

### [P2] The pick clock goes quiet exactly when it expires

**Location:** `src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx:174`, `:405`, `:413`
**Category:** Accessibility
**Attribution:** [remediated surface].

`clockUrgent` is defined as `timerEnabled && !timer.isExpired && timer.secondsLeft <= 15`. I sampled the live clock every 2.6 seconds and watched it hold signal at 13s, 10s, 8s, 5s and 3s, then drop back to `--home-ink` on the plain paper chip the moment it read 0s.

So the clock escalates for fifteen seconds and then de-escalates at expiry, which is the one moment the pick is actually late. The `aria-label` does switch to "Pick clock expired", so the information is there for a screen reader, and only the visual state regresses.

*Recommendation:* drop the `!timer.isExpired` guard, or give expiry its own stronger state rather than returning it to the resting one.

*Suggested command:* `/impeccable polish`

### [P2] Both boards still open with a display headline ahead of every control

**Location:** `src/app/fantasy-football/fantasy-football-client.tsx`, `src/app/fantasy-football/best-ball/best-ball-client.tsx`
**Category:** Implementation Integrity
**Attribution:** [pre-existing]. This is the half of the critique's composition finding that `layout` did not reach.

On the rankings board at 390px the `h1` renders at 36.33px at y=121, and the first control does not appear until y=815, with the first player row at y=1094. At 1440 the `h1` is 65.2px. The best ball board is the same shape, with a 65.2px `h1` at y=129 at 1440.

The brief states plainly that Operate mode holds for the boards and that the board's job is filtering and comparing rather than persuading. `layout` acted on that for the tracker and left the boards alone.

*Recommendation:* apply the tracker's treatment, which is to keep the headline and the pitch for a first-time visitor and collapse them once the visitor has engaged a control or arrived with filter state in the URL.

*Suggested command:* `/impeccable layout`

### [P2] Logging a pick is not announced

**Location:** `src/app/fantasy-football/draft-tracker/components/DraftBoard.tsx:272-286`
**Category:** Accessibility
**Attribution:** [pre-existing].

I logged real picks and watched the live regions. The `role="status"` region text stays at "Log the room's next selection" through a successful pick, changing only when the turn changes. The board count region does update, going from "520 available · showing 25" to "519 available · showing 25", so a screen reader hears the inventory shrink but never hears which player went or to whom.

The critique raised this and no pass picked it up, so it is correctly still open rather than a regression.

*Recommendation:* announce the completed pick in the existing status region, along the lines of "Pick 4, Bijan Robinson to Team 4."

*Suggested command:* `/impeccable harden`

### [P3] The footer "Now" link is 34.8x44

**Location:** site-wide footer, outside these routes
**Category:** Responsive
**Attribution:** [pre-existing].

It was the only undersized target on all four routes at both widths, in both themes, across every state I exercised including the open compare modal and the open player drawer. The critique already noted it as site-wide furniture. I am recording it once so the count of one is not mistaken for a fantasy defect.

*Suggested command:* `/impeccable adapt`

### [P3] A stylesheet is preloaded and never used

**Location:** build output, `_next/static/css/app/not-found.css`
**Category:** Performance
**Attribution:** [pre-existing].

Two of the three console warnings across the whole run were unused-preload warnings, one for `not-found.css` and one for a woff2 font. There were zero console errors and zero failed network requests on any route. The third warning was produced by my own measurement code, not the page.

*Suggested command:* `/impeccable optimize`

### [P3] No keyboard shortcuts on a clock-driven surface

**Location:** the tracker routes
**Category:** Accessibility
**Attribution:** [pre-existing]. Product work, and the brief already records it as open.

There is a full undo stack in `useDraftState` and no `Cmd+Z`, no `/` to focus board search, and no next or previous in the player drawer, which I confirmed by opening one and enumerating its three buttons.

*Suggested command:* `/impeccable clarify`

### [P3] `--home-signal` is under 4.5:1 on `--home-paper-alt` as a latent risk

**Location:** `src/app/globals.css` token definitions
**Category:** Theming
**Attribution:** [pre-existing].

`--home-signal` measures 4.57:1 on `--home-paper` and **4.26:1** on `--home-paper-alt`. My element sweep found no live instance of signal body text on paper-alt in this group, so this is not currently failing on these routes. It is one component away from being a real finding, and it is the same headroom problem as P1-1.

*Suggested command:* `/impeccable harden`

## Patterns and Systemic Issues

There is really one systemic issue, and it explains eleven of the thirteen contrast failures. The light-mode palette gives `--home-ink-muted` and `--home-signal` almost no headroom over the 4.5:1 floor, at 4.88:1 and 4.57:1, while the visual system leans hard on tinted plates built with `color-mix` against `--home-paper`. Those two facts are individually reasonable and jointly guarantee failures. The August remediation fixed the status tokens by darkening them and it worked, since positive, warning and negative now sit between 4.92 and 5.40 everywhere I measured. The same treatment was never applied to the two tokens that carry most of the text.

The second pattern is narrower and worth watching. Two of the four issues I would actually fix now were introduced by the remediation passes themselves, which is the "Your pick is live" contrast and the heading collapse. Both came from commits that were otherwise correct, and both are the kind of thing a computed-value sweep catches and a code review does not. The brief already records one regression caught this way during `polish`, when collapsing the header dropped the freshness chips. That is three regressions from six passes, which suggests the sweep should run as part of each pass rather than only at audit time.

Attribution is clean on everything else. Nothing I found lands in the in-flight lineup work. The uncommitted session touches `src/lib/redraftLineup.ts`, `RedraftLineupSettings` in `src/types/index.ts` and the surrounding tests, and its only visible footprint on the routes I measured is the `lineup` object now present in the persisted draft settings and one edited sentence inside the emerging-run card. The defect in that card is the plate colour, which is pre-existing, not the sentence.

## Positive Findings

Token discipline is genuinely excellent and I want to be specific, because "clean" is easy to say. Across 56 non-test files, every one of the seven mechanical checks came back at zero, and the four Framer Motion consumers all call `useReducedMotion`. That is the kind of result that only happens when someone has been enforcing it.

Dark mode is in better shape than light. Every pairing that fails in light passes comfortably in dark, with the four tinted plates measuring between 5.43:1 and 5.73:1 and the six tokens between 5.77:1 and 15.28:1. The dark palette has the headroom the light one is missing.

The remediation work is real and it measures. Nine of the eleven claims in the brief hold exactly, several to the pixel, and the two that do not are honest misses rather than overstatements. The compare modal in particular is now a properly built table with a caption, correct scopes on both axes, and a winner cue that survives with colour switched off.

Structure holds everywhere. Four routes, four single `<main>` elements, four single `<h1>` elements, no unnamed sections, no unnamed navs, zero horizontal overflow at 390px in either theme, focus indicators on all 30 focusable elements I walked, and both the compare modal and the player drawer containing focus on open and restoring it to the trigger on Escape.

Performance is not a concern. LCP 288ms, first contentful paint 288ms, DOM content loaded 259ms, 22 resources, zero failures. There are zero images on these routes, so the question of lazy loading and `fetchpriority` does not arise, and flagging their absence would have been wrong.

## What I skipped or could not run

I want to be explicit about the gaps rather than let the clean numbers imply total coverage.

I did not run `detect.mjs`, deliberately. The brief proved with a positive control that it cannot read JSX inline style objects or Tailwind utilities, which is how this surface is styled end to end, so a zero from it carries no information. I did not run its URL mode either, because puppeteer is not installed and URL mode then exits 0 with an empty array, which is indistinguishable from a clean scan. I did not install puppeteer.

My first contrast parser was wrong and I caught it, which is worth recording. It handled `color(srgb …)`, `rgb()`, `rgba()` and hex but not `oklab()`, and Chrome returns `oklab()` for `--home-paper-raised`. That would have silently mis-resolved backgrounds on raised surfaces. I rebuilt it to resolve colours by painting a pixel to a canvas with `globalCompositeOperation = 'copy'` and reading the image data back, which handles every syntax the browser accepts, and re-ran everything. The rebuilt parser reports zero unparsed colours and zero unhandled oklab text nodes on every route.

I verified the clock's 15-second threshold by shortening `timerSeconds` to 25 in localStorage so the urgent window was reachable, then restored it to 90. I verified "Your pick is live" by setting `settings.userTeam` to the team on the clock, then restored it to 1. Both were browser state in the automation profile, not files. I also logged three real picks into the persisted test draft while exercising the flow and did not undo them, so that draft now sits at pick 6 rather than pick 4.

I measured only the four real routes. I did not touch the two redirect stubs.

I did not run the Jest suite or the typechecker, since this was an evaluate pass and the brief already records both as clean at the time of the remediation commits.

## The working tree moved under me

I need to flag this rather than present the run as stable. At run start the tree carried 47 uncommitted entries. By the end it carried 62, and the `git status` hash changed from `971fe0fe4d4e526ab7bf1d441a0409e3` to `1c154ae1b4ce9ff0433cfdb1e57d5d0a`.

The new entries are `AGENTS.md`, `CLAUDE.md`, `docs/README.md`, three files under `docs/ai-context/`, `public/sitemap.xml`, and a new `docs/FANTASY_DRAFT_MODEL.md`. So the other session was writing documentation while I measured.

What matters is that none of it is component source. A `find -newermt '-40 minutes'` across `src/app/fantasy-football`, `src/components/fantasy` and `src/lib` returned zero files, so nothing I measured changed during the run. I am treating the browser measurements as stable and the file counts in this report as a run-start snapshot. I did not commit, stage, stash, revert or edit anything, and this report is the only file I wrote.

## Recommended Actions

1. **[P1] `/impeccable harden`**, which raises light-mode `--home-ink-muted` and `--home-signal` until each clears 4.5:1 on the tinted plates the system actually builds, closing 12 of 13 failures at the token level, and recolours "Your pick is live" to ink on its signal-bordered plate.
2. **[P2] `/impeccable typeset`**, which resolves the `h1` and `h2` collapse on the redraft tracker and makes the two trackers agree on whether a running draft quietens the page title.
3. **[P2] `/impeccable layout`**, which takes the tracker's Operate treatment to the rankings board and the best ball board, where the first control is still 815px down at 390px.
4. **[P3] `/impeccable optimize`**, which drops the unused `not-found.css` and font preloads.
5. **[P3] `/impeccable polish`**, which gives clock expiry its own state instead of returning it to resting, and announces completed picks in the existing status region.

Re-run `/impeccable audit` after fixes to see the score move. The two dimensions holding it at 17 are Accessibility and Theming, and both are the same token-headroom fix.
