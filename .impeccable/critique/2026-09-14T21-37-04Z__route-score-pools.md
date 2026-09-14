---
target: "route:/score-pools"
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 6
target_identity: "file:/Users/isaacvazquez/Website/route:/score-pools"
timestamp: 2026-09-14T21-37-04Z
slug: route-score-pools
closed: true
---
Method: lighter loop (one design review subagent and one computed-value sweep subagent, synthesized in the parent), with an adversarial refuter on every P0 and P1. Run 2026-09-14 against the dev server before remediation.

Score pools was reviewed as one product across its three pages, /score-pools, /score-pools/tracker and /score-pools/settings, so this single snapshot under the slug `route-score-pools` covers all three and the heuristic scores are for the product as a whole. All ten heuristics were scored.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | The as-of stamp, LOCKED badges and save status exist, but settings promises a six-hour refresh beside 57-day-old data. |
| 2 | Match system / real world | 2 | "de-vigs", "modal chalk pick", "low-score correction", "Higher floor" and "Exp pts" land on a friend without definitions, and raw env-var notes reach visitors. |
| 3 | User control and freedom | 3 | Picks can be cleared, pool delete asks for confirmation, and Escape closes the drawer. Remove rival has no confirm. |
| 4 | Consistency and standards | 2 | Pool chips and round chips share one style, the tracker shows two different "my points" numbers, and the drawer prints snapshot odds above probabilities from hand-entered odds. |
| 5 | Error prevention | 1 | New pools default to an empty league, locked games still accept picks, and the rival gap ignores my banked points. |
| 6 | Recognition rather than recall | 3 | Rules and standing are restated on the tracker, and the reason sits beside each pick. |
| 7 | Flexibility and efficiency | 3 | Copy submission, save all, one-click "Use", and a deep-linkable drawer (`?fixture=`). |
| 8 | Aesthetic and minimalist design | 3 | Dense but ordered. Mobile hides confidence and the reason. |
| 9 | Error recovery | 2 | Manual-odds errors are specific but not announced, and an invalid pick in the drawer or a rival Save is silently ignored (drawer:200, tracker:491). |
| 10 | Help and documentation | 3 | Per-pick reasons, the recheck list and the settings hints are strong. |
| Total | | 24/40 | Acceptable (60%) |

## Design Specificity Verdict

LLM assessment. Authored, and the most product-specific of the group 3 surfaces. The pick sheet with its recommended score, higher-floor and differentiator alternatives and a plain-sentence reason per match, the drawer with its scoreline heatmap and expected-points table, and the "Recheck before it locks" list all come out of SCORE_POOLS_ENGINE.md and could not belong to another product. The intro is in Isaac's first-person voice. The weakness is the data and the claims around it, not the composition. On 2026-09-14 the only league with fixtures is sample data, and both of its open games locked in August.

Deterministic scan. `impeccable detect` exited 0 with 15 advisory font-size findings, all in `interchange-iq-client.tsx`, and zero across the three score pools pages, because they style through utility classes. No DEGRADED banner printed. The detector missed every P1 below, since they live in data freshness, defaults, engine wiring, focus handling and composited contrast.

Visual overlays. No user-visible overlay is available, because injection was blocked by the site's CSP. The computed-value sweep is the fallback signal. Its contrast gate read 16.29:1 in light and 15.28:1 in dark at every width. At rest it found no text contrast failures on any of the three pages, and it found the League select and Pool name input borders at 1.33:1 light and 1.52:1 dark against their own background, the League select defaulting to "Premier League · 0 fixtures", and no live region on any of the three pages. The drawer heatmap and focus findings came from the refuter's driven states.

## Overall Impression

The intro is the strongest moment, a practitioner explaining the process he used to run by hand, and on Sample Cup the drawer's reason sentence reads like advice from someone who has done this. The product then contradicts itself on nearly every claim a careful friend would check. Settings promises a six-hour refresh beside 57-day-old data while every scheduled run fails on missing API secrets, a new pool opens on a league with no fixtures, the drawer prints odds that are not the ones its probabilities use, the rival gap leaves out my own banked points, and settings says rival picks feed a model that nothing feeds. The single biggest opportunity is to make every stamp, default and claim read from what the engine actually uses, so the honesty framing the engine doc works for survives on screen.

## What's Working

The reasons are real explanations tied to the pool's rules. "Under 90-minute scoring a knockout that stays level through 90 pays the draw pick even when it's settled on penalties, so 1-1 collects on every level scoreline" makes the engine's central idea legible in one sentence.

The honesty framing from SCORE_POOLS_ENGINE.md holds up in the parts that are wired, with the sample-data banner, a "Hand-entered" source label with its margin, calibration notes, a "not betting advice" footer, and "treat the expected points as a ranking, not a promise".

The drawer moves focus to Close on open, closes on Escape and syncs the fixture to the URL (score-pools-client.tsx:110-128, fixture-detail-drawer.tsx:136-143).

## Priority Issues

[P1] Settings promises a six-hour refresh beside 57-day-old data, and visitors see raw provider notes.
The settings page says "The snapshot refreshes on a schedule (every six hours)" (settings-client.tsx:586) directly under a table showing both leagues refreshed "57d ago" from manual entry. The snapshot's `generatedAt` is 2026-07-20T06:27Z (src/data/scorePoolsSnapshot.ts:5), and every scheduled run failed on missing API secrets. The pick sheet shows visitors "API_FOOTBALL_KEY is not set, so fixtures come from manual/CSV entries only." (score-pools-client.tsx:305-311), and the drawer's recheck item reads "The odds are about 1380 hours old" (engine.ts:257).
Fix: drive the copy from `generatedAt`, so past a threshold it reads "Last refreshed Jul 20, 2026" instead of the six-hour promise, translate provider notes into visitor language, format ages over 48 hours in days, and restore the API secrets or stop the schedule.
Suggested command: /impeccable harden

[P1] New pools default to "Premier League · 0 fixtures".
Both create forms preselect `snapshot.leagues[0]` (score-pools-client.tsx:81, settings-client.tsx:129), which is Premier League with 0 fixtures. Creating it produces "Nothing left to pick in this round. The played games are below, and the tracker has the running score." (client:413-417) with nothing below. For a friend setting up a pool, that is the first screen after the only action.
Fix: default to the first league with scheduled fixtures, mark empty leagues unavailable in the select, and give the no-fixtures state its own copy that points to Sample Cup.
Suggested command: /impeccable onboard

[P1] The rival gap ignores my banked points, and settings claims rival picks feed the field model when nothing does.
With My points 20 in settings and Dana's adjustment at 20, the tracker showed "Dana 0 · 20 · 20 · +20 on me", because the gap compares the rival's tracked points plus adjustment against my tracked points alone (tracker-client.tsx:404-406). The Field model copy says rival picks "replace it wholesale for the gap math" (settings-client.tsx:447-449), but nothing in `src/lib/scorePools`, `useScorePools.ts` or `src/app/score-pools` sets `field.overrides` from `pool.rivals`. `toPoolAnalysisConfig` only spreads `pool.field` (persistence.ts:360-371), and the engine only reads `field.overrides` (engine.ts:117-119).
Fix: add my own baseline to the gap, then either build per-fixture `field.overrides` from rival picks in `analyzePoolFixtures` or change the settings sentence to say rival picks feed only the tracker.
Suggested command: /impeccable harden

[P1] The drawer prints snapshot odds above probabilities computed from hand-entered odds.
The refuter opened a Sample Cup fixture with snapshot odds of 2.55 / 3.05 / 3.00, entered 1.80 / 3.60 / 4.75 and saved. The price line still read "2.55 / 3.05 / 3.00" and "Hand-entered · 58d ago", and the footer still read "Analysis as of just now from odds 58d ago", while the margin moved to 4.4% and the probabilities to home 53.2%, draw 26.6%, away 20.2%, which are the new odds. `latestOdds` at fixture-detail-drawer.tsx:152 reads the snapshot only and drives the price line, the age line and the footer, while margin and probabilities come from `analysis.market`, which poolAnalysis.ts:52-72 builds from `pool.manualOdds`. The "Hand-entered" label is the snapshot seed's own manual flag, so it only happens to read right here.
Fix: derive the displayed odds, age and footer from `pool.manualOdds[fixture.id]` first, already read at :123, and fall back to `latestOdds`.
Suggested command: /impeccable harden

[P1] The aria-modal drawer does not trap Tab, and Escape sends focus to the page body.
The drawer is a plain `div role="dialog" aria-modal="true"` (drawer.tsx:212). The refuter found focus lands on Close on open, 25 Tabs stay inside, and Tab 26 reaches the site footer's "Send email" link, with no inert or aria-hidden on anything outside. After Escape the dialog unmounts and `document.activeElement` is the body, because `closeDrawer` (score-pools-client.tsx:125-128) never returns focus to the Detail button. That is a WCAG 2.4.3 focus order failure.
Fix: switch the wrapper to a native `<dialog>` opened with `showModal()`, which makes the page inert and returns focus on close, or set `inert` on the page while open and refocus the trigger in `closeDrawer`.
Suggested command: /impeccable harden

[P1, arguably P2] The strongest heatmap cell label measures 3.71:1 in dark mode.
The heatmap background is `color-mix` of `--home-signal` at up to 72% strength (fixture-detail-drawer.tsx:84, 91) under `--home-ink` labels at 10px weight 400. In dark mode the refuter measured the single strongest cell in each Sample Cup grid, the modal scoreline, at 3.71:1, one of 14 or 15 labeled cells. Light mode passes at a minimum of 5.10:1. It is one cell per grid, which argues for P2, but it is the most important cell.
Fix: lower the strength cap at drawer.tsx:84 from 72 to 55, which gives 4.97:1 in dark mode and only lightens the light mode cells.
Suggested command: /impeccable harden

[P2] Locked games still accept picks.
Both sample fixtures render LOCKED, yet "Use as my pick", "Set" and "Save these as my picks" stayed active and wrote picks in the walk, and the save status said "Saved. The tracker scores these as results come in." `useScorePools.ts` has no lock check.
Fix: disable pick controls when `now >= locksAt`, keep locked rows out of save all, and say "Locked Aug 4, 11:00 AM" on the controls.
Suggested command: /impeccable harden

[P2] Mobile hides confidence and the reason, and form errors are not announced.
Below `sm` the Confidence, Higher floor, Differentiator and Why columns are hidden (score-pools-client.tsx:337-340), as is the EP meter bar (score-pools-ui.tsx:107), so a phone user sees a bare "1-1" and "1.23". Errors in hand-entered odds and tracker scores are not announced, and the sweep found no live region on any of the three pages.
Fix: render the confidence chip and a one-line reason under the pick cell on small screens, and put form errors in a `role="alert"` or tie them to the field with `aria-describedby`.
Suggested command: /impeccable adapt

## Persona Red Flags

Jordan (a friend setting up a pool) meets "de-vigs the market" in the first paragraph, an empty default league, and a settings page of seven sections including "De-vig method", "Posture" and a field model in decimals. In the drawer, "low-score correction -0.17", "floor 31%" and "Field on it" go undefined, and the context-flag hints are sr-only (drawer:502), so sighted users never see them.

Casey (mobile) gets a sheet with no horizontal overflow and a full-width drawer with Close at the top, but confidence and the reason are hidden, and entering a rival's picks means a long list of paired number inputs.

Sam (screen reader) tabs out of an aria-modal drawer into the site footer, lands on the body after Escape, and hears nothing when a hand-entered odds value, a tracker score or a drawer pick is rejected. The confidence glyph is aria-hidden with a text word beside it, which is correct.

An MBA classmate checking honesty would find the SCORE_POOLS_ENGINE.md framing mostly intact, then catch "every six hours" next to "57d ago", developer env-var names on screen, odds on the drawer that are not the ones in use, and a settings claim about rival picks that the code does not implement.

## Minor Observations

On /score-pools the pool chip and the active round chip share the same Signal Soft active style, and the divider between them is hidden below `sm` (client:280), so on mobile a pool reads like a round. On /score-pools/tracker, "Tracked points 0" and "Standing (settings) 20" sit side by side with no explanation of which is real. On /score-pools/settings, the hint "0.30 means about a third of the pool" overstates 30%, and Remove rival deletes that rival's picks with no confirm (settings-client.tsx:515-520).

The intro's "so it carries the market's uncertainty rather than beating it" (client:200-201) uses the reversal shape WRITING_VOICE.md lists as an AI tell, and the engine reason text "The math lands where the room will land." is the aphoristic compression the Sentence Texture rules replace with a plain statement. The heatmap renders eight rows even when rows 4 to 7 are blank. Headings use `font-bold` (700) where DESIGN.md specifies 600, and sections carry resting shadows. The global `input:valid` green border (globals.css:2850-2853) shows on the settings and tracker inputs, the same rule flagged on the budget planner. The "not betting advice" footer is `text-3xs` on the pick sheet only, which the review judged acceptable because the tracker and settings make no recommendation. No case study entry exists for score pools, so there were no portfolio claims to cross-check. Dark mode renders correctly.

Not checked in this run were a real VoiceOver or NVDA pass, line-movement rendering (the sample fixtures have single odds entries), and a league with live provider data.

## Questions to Consider

Should the pick sheet stop recommending once the snapshot is older than the lock window, and say so plainly, since two locked August games presented as a live pick sheet undercut the honesty the engine works hard for?

Should the nearest rival you enter automatically become the reference opponent, since that is what the settings page already tells people happens?
