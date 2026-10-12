---
version: 1
slug: "route-score-pools"
primary_target: "route:/score-pools"
related_targets: ["src/app/score-pools/score-pools-client.tsx","src/app/score-pools/fixture-detail-drawer.tsx","src/app/score-pools/tracker/tracker-client.tsx","src/app/score-pools/settings/settings-client.tsx","src/lib/scorePoolsData.ts","src/data/scorePoolsSnapshot.ts"]
---

Updated on 2026-09-28 by the responsive pass. /score-pools is a wide tool route, so its header and footer widen with its 1376px shell, and its h1 no longer starts 23px left of the wordmark at 1280. The tracker and settings pages stay on the standard column.

# Score pools surface brief

## Frame removal, 2026-10-12

Written by the stage 2 G2 pass of the project sovereign design (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Console, frame removal only). Everything under "Loop, 2026-09-14" below still holds, and its "Decisions not to re-litigate" stayed closed.

Genre. A working console for running a pool, closer to a bet slip and a pick'em sheet than a product page, with a plain admin page for the settings.

Decisions. The three pages share one title bar, `ScorePoolsTitleBar` in `score-pools-ui.tsx`, holding the page's h1 ("Score Pools", "Score Pools Tracker", "Score Pools Settings", matching the metadata titles), one orienting sentence, and the product's own tabs (Pick sheet, Tracker, Settings, `aria-current="page"`, nav named "Score Pools pages" so it never collides with the tracker's "Pools" nav). Under it a status block prints the as-of line and the sample or hand-entered notice, which now is a ruled note with a warning-colour rule instead of a bordered box, with the same words. On the pick sheet with no pool, the create form is the first thing under that block.

The route paints its own page from `score-pools.css`: `.sp-root` declares `--sp-*` properties with a light story (`#f6f7f6`, ink `#151a1d`, pitch green accent `#0b6b4c`) and a dark one under `.dark .sp-root`, and points every `--c97-*` token the borrowed controls read (surface, field, panel, overlay, ink, ink-2, label, action, rule, accent, positive, negative, warning, chip-ink) at them, so the tables, fields, buttons, chips, meters, and the match drawer follow. Headings are the body face. Sections are ruled (`.sp-section`), list rows are ruled (`.sp-row`), and the tracker's three totals are one ruled row. The match drawer prints on the console's paper (`.sp-drawer`) rather than Catalog 97 paper; its three pick cards and the flag toggles keep their borders, since each is a control.

Cut, and not to be restored. The "Prediction tools" kicker, the display-size h1 with its italic second word, the long first-person standfirst (its substance is now the build-note purpose), the bordered sample notice box, the panel behind the create form, the bordered panel rows in Waiting on odds, Played, Missing results, rivals, and the rival pick list, the `c97-panel` plates around every settings section and every drawer section, and the filled stat panels on the tracker.

Kept word for word. The decision-aid disclaimer at the foot of the pick sheet, `SAMPLE_NOTICE`'s two sentences, the as-of stamp, the sample and manual labels, the drawer's residual disclosure, and the settings copy on the six-hour refresh and the field model. `fixture-detail-drawer.tsx` is still a static import, which `bundle-guards.test.ts` pins. No test changed. `/score-pools/settings` has no easter egg (`docs/EASTER_EGGS.md` lists it only to say it has nothing playful in it).

Verified state, 2026-10-12. Against a production build served on 3760 in Chromium, `scripts/contrastSweep.mjs` found no failures on the three pages in either theme, and `scripts/layoutSweep.mjs` found 0 fails. The first input (Pool name) and Create pool sit at y473 at 1440x900 and y749 and y805 at 390x844, down from y792 and y911 and y967. On settings the first input moved from y653 to y458 at 1440 and y666 to y590 at 390. The keyboard order runs header, the three tabs, League, Pool name, and Create pool; Enter created the pool, Enter on Detail opened the drawer with focus on Close, and Escape closed it with focus back on Detail. `e2e/all-projects.spec.ts`'s three-route settings flow passed against dev and production. I did not check Safari's and Firefox's engines, touch devices, or a screen reader. The open items under "Still open" below are unchanged by this pass.

Scope. The score pools product across three pages, `/score-pools` (`src/app/score-pools/score-pools-client.tsx` with `fixture-detail-drawer.tsx`), `/score-pools/tracker` (`tracker/tracker-client.tsx`) and `/score-pools/settings` (`settings/settings-client.tsx`). Data comes from the committed snapshot in `src/data/scorePoolsSnapshot.ts`, built by `src/lib/scorePoolsData.ts`, and the engine spec is `SCORE_POOLS_ENGINE.md`. Pool config and picks live in localStorage.

Visitor mode. Operate. The visitor is making and tracking picks against a pool's scoring rules.

Audience. A friend setting up or joining an exact-score pool, who will not know terms like de-vig or modal pick, plus keyboard and screen reader users working through the drawer and tracker. The honesty framing, meaning as-of stamps, sample and manual labels and residual disclosure, is a constraint.

Visual world. Catalog 97, as shipped. The route renders inside `Catalog97ToolShell` and its components read `--c97-*` tokens directly under `data-c97-surface`. `DESIGN.md` now describes Catalog 97, so judging this route against it is correct. The tool shell brief, `src-components-catalog97-catalog97toolshell-tsx.md`, has the detail. Hex values and contrast figures further down this brief were measured before the 2026-09-27 close-out and may need re-measuring against the shipped `--c97-*` colors.

## Loop, 2026-09-14

The pre-fix snapshot is `2026-09-14T21-37-04Z__route-score-pools.md` at 24/40 (60%, Acceptable) with 0 P0 and 6 P1, all ten heuristics scored for the three pages as one product. It is closed now. The fixes landed in `b1dc0d31`, and the committed snapshot notes followed in `972f3ac2`. No post-fix critique snapshot was taken, so the evidence below is the post-fix computed-value sweep, where 22 of 24 checks across the four group 3 surfaces passed on the first run. On this product 7 of 8 passed, and the one failure was fixed afterward.

### What was fixed, with measured evidence

New pools defaulted to "Premier League · 0 fixtures." On a fresh store the create form now selects "Sample Cup (sample data) · 4 fixtures," and the new pool shows two Detail buttons instead of "Nothing left to pick." Settings used to promise a six-hour refresh beside 57-day-old data. It now says a scheduled job is set to refresh every six hours but only runs when the data API keys are configured, and to check the as-of dates. The field model copy says rival picks score the rival table only and do not change the model. The rival gap ignored my banked points, and with my points at 7 and a rival adjustment of 7 the row now reads "level," while an adjustment of 10 reads "+3 on me."

The drawer printed snapshot odds above probabilities computed from hand-entered odds. After saving 1.80, 3.60 and 4.75 on `sc-qf-1`, the drawer shows those odds, "Hand-entered · just now · margin 4.4%," and home 53.2%, draw 26.6% and away 20.2%, which match the expected de-vig. The aria-modal drawer did not trap Tab. Focus now lands on Close, 60 Tabs and 30 Shift+Tabs stay inside across 8 stops, and Escape returns focus to the Detail button. The strongest heatmap label measured 3.71:1 in dark mode, and with the cap at 55% it measures 5.03:1 dark and 6.52:1 light, with no cell under 4.5:1 in either theme. Locked games accepted picks, and on the past-lock `sc-qf-1` the Set button is disabled and fill, Enter and forced clicks leave submissions empty.

The one failed check was raw key names. The builder strings in `scorePoolsData.ts` had changed, but the committed snapshot still rendered "API_FOOTBALL_KEY is not set..." and "THE_ODDS_API_KEY is not set..." on a pool using Premier League. `972f3ac2` replaced both notes in `scorePoolsSnapshot.ts` with "Live fixtures are not connected, so this league only shows games entered by hand." and "Live odds are not connected, so odds come from hand entries only." A live check on 2026-09-14 found no key names on the page and the new notes rendering.

### Decisions not to re-litigate

Rival picks do not feed the field model, the engine stays unwired to them, and the settings copy says so. The heatmap strength cap is 55% so the strongest cell keeps 4.5:1 label contrast in dark mode, where 72% gave 3.71:1. The global green valid-input border was removed site-wide, which also reaches the settings and tracker inputs. `--home-signal-ink` (#BF3B16 light, #FF6B3B dark) carries signal-coloured text on tool rails so the brand accent `--home-signal` stays #C93F19. (Stale as of 2026-10-12: both tokens were deleted in the Catalog 97 close-out, and the route's accent is now `--sp-accent`.)

### False positives worth not re-deriving

The sweep logged two aborted `/score-pools?_rsc=` requests at 390 light, which are dev server prefetch cancellations during in-page navigation. Premier League with 0 fixtures remains the first option in the league select, and that is fine now that Sample Cup is the default. `critique-storage latest` on a `route:` target closes the snapshot it reads, so read snapshots by filename or with `trend`.

### Still open

The scheduled refresh fails until the `THE_ODDS_API_KEY` and `API_FOOTBALL_KEY` repository secrets are set, so the snapshot data stays stale until then, and that staleness is an operations task and not a design defect. The pick sheet's "Save these as my picks" does not skip locked games, since `savePicks` in `score-pools-client.tsx` saves every submission row with no lock check, even though the drawer's Set is now disabled. Errors in hand-entered odds and tracker scores are not announced, and the sweep found no live region on any of the three pages. Below `sm` the pick sheet hides the Confidence, Higher floor, Differentiator and Why columns and the EP meter, so a phone user sees a bare score and number. Terms such as "low-score correction," "floor" and "Field on it" are still undefined in the drawer, and Remove rival has no confirm. Touch devices, a production build and a real screen reader were not checked this loop.
