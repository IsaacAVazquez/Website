---
version: 1
slug: "route-score-pools"
primary_target: "route:/score-pools"
related_targets: ["src/app/score-pools/score-pools-client.tsx","src/app/score-pools/fixture-detail-drawer.tsx","src/app/score-pools/tracker/tracker-client.tsx","src/app/score-pools/settings/settings-client.tsx","src/lib/scorePoolsData.ts","src/data/scorePoolsSnapshot.ts"]
---

# Score pools surface brief

Scope. The score pools product across three pages, `/score-pools` (`src/app/score-pools/score-pools-client.tsx` with `fixture-detail-drawer.tsx`), `/score-pools/tracker` (`tracker/tracker-client.tsx`) and `/score-pools/settings` (`settings/settings-client.tsx`). Data comes from the committed snapshot in `src/data/scorePoolsSnapshot.ts`, built by `src/lib/scorePoolsData.ts`, and the engine spec is `SCORE_POOLS_ENGINE.md`. Pool config and picks live in localStorage.

Visitor mode. Operate. The visitor is making and tracking picks against a pool's scoring rules.

Audience. A friend setting up or joining an exact-score pool, who will not know terms like de-vig or modal pick, plus keyboard and screen reader users working through the drawer and tracker. The honesty framing, meaning as-of stamps, sample and manual labels and residual disclosure, is a constraint.

Visual world. Catalog 97 through the bridge, as of 2026-09-16. The route renders inside `Catalog97ToolShell`. Its components still read `--home-*` names, and the bridge block in `src/app/catalog97.css` aliases each one onto the Catalog 97 value for the enclosing surface, sets every `--radius-*` token to 0, and sets every `--shadow-*` token to `none`. `DESIGN.md` still describes the Working Instrument, so judging this route against it manufactures false findings. The tool shell brief, `src-components-catalog97-catalog97toolshell-tsx.md`, has the detail. Hex values and contrast figures further down this brief were measured before the bridge, so they are Working Instrument values and need re-measuring before anyone acts on them.

## Loop, 2026-09-14

The pre-fix snapshot is `2026-09-14T21-37-04Z__route-score-pools.md` at 24/40 (60%, Acceptable) with 0 P0 and 6 P1, all ten heuristics scored for the three pages as one product. It is closed now. The fixes landed in `b1dc0d31`, and the committed snapshot notes followed in `972f3ac2`. No post-fix critique snapshot was taken, so the evidence below is the post-fix computed-value sweep, where 22 of 24 checks across the four group 3 surfaces passed on the first run. On this product 7 of 8 passed, and the one failure was fixed afterward.

### What was fixed, with measured evidence

New pools defaulted to "Premier League · 0 fixtures." On a fresh store the create form now selects "Sample Cup (sample data) · 4 fixtures," and the new pool shows two Detail buttons instead of "Nothing left to pick." Settings used to promise a six-hour refresh beside 57-day-old data. It now says a scheduled job is set to refresh every six hours but only runs when the data API keys are configured, and to check the as-of dates. The field model copy says rival picks score the rival table only and do not change the model. The rival gap ignored my banked points, and with my points at 7 and a rival adjustment of 7 the row now reads "level," while an adjustment of 10 reads "+3 on me."

The drawer printed snapshot odds above probabilities computed from hand-entered odds. After saving 1.80, 3.60 and 4.75 on `sc-qf-1`, the drawer shows those odds, "Hand-entered · just now · margin 4.4%," and home 53.2%, draw 26.6% and away 20.2%, which match the expected de-vig. The aria-modal drawer did not trap Tab. Focus now lands on Close, 60 Tabs and 30 Shift+Tabs stay inside across 8 stops, and Escape returns focus to the Detail button. The strongest heatmap label measured 3.71:1 in dark mode, and with the cap at 55% it measures 5.03:1 dark and 6.52:1 light, with no cell under 4.5:1 in either theme. Locked games accepted picks, and on the past-lock `sc-qf-1` the Set button is disabled and fill, Enter and forced clicks leave submissions empty.

The one failed check was raw key names. The builder strings in `scorePoolsData.ts` had changed, but the committed snapshot still rendered "API_FOOTBALL_KEY is not set..." and "THE_ODDS_API_KEY is not set..." on a pool using Premier League. `972f3ac2` replaced both notes in `scorePoolsSnapshot.ts` with "Live fixtures are not connected, so this league only shows games entered by hand." and "Live odds are not connected, so odds come from hand entries only." A live check on 2026-09-14 found no key names on the page and the new notes rendering.

### Decisions not to re-litigate

Rival picks do not feed the field model, the engine stays unwired to them, and the settings copy says so. The heatmap strength cap is 55% so the strongest cell keeps 4.5:1 label contrast in dark mode, where 72% gave 3.71:1. The global green valid-input border was removed site-wide, which also reaches the settings and tracker inputs. `--home-signal-ink` (#BF3B16 light, #FF6B3B dark) carries signal-coloured text on tool rails so the brand accent `--home-signal` stays #C93F19.

### False positives worth not re-deriving

The sweep logged two aborted `/score-pools?_rsc=` requests at 390 light, which are dev server prefetch cancellations during in-page navigation. Premier League with 0 fixtures remains the first option in the league select, and that is fine now that Sample Cup is the default. `critique-storage latest` on a `route:` target closes the snapshot it reads, so read snapshots by filename or with `trend`.

### Still open

The scheduled refresh fails until the `THE_ODDS_API_KEY` and `API_FOOTBALL_KEY` repository secrets are set, so the snapshot data stays stale until then, and that staleness is an operations task and not a design defect. The pick sheet's "Save these as my picks" does not skip locked games, since `savePicks` in `score-pools-client.tsx` saves every submission row with no lock check, even though the drawer's Set is now disabled. Errors in hand-entered odds and tracker scores are not announced, and the sweep found no live region on any of the three pages. Below `sm` the pick sheet hides the Confidence, Higher floor, Differentiator and Why columns and the EP meter, so a phone user sees a bare score and number. Terms such as "low-score correction," "floor" and "Field on it" are still undefined in the drawer, and Remove rival has no confirm. Touch devices, a production build and a real screen reader were not checked this loop.
