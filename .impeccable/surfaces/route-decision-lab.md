---
version: 1
slug: "route-decision-lab"
primary_target: "route:/decision-lab"
related_targets: ["src/app/decision-lab/decision-lab-client.tsx","src/app/decision-lab/decision-lab.css","src/app/decision-lab/decision-lab-data.ts","src/app/decision-lab/decision-lab-state.ts","src/app/decision-lab/verdictStamp.ts"]
---

# Decision Lab surface brief

Scope. The `/decision-lab` route, rendered by `src/app/decision-lab/decision-lab-client.tsx` over the presets and the scoring in `decision-lab-data.ts`, with its state in the URL through `decision-lab-state.ts`.

Visitor mode. Operate. The visitor picks a preset or moves the four sliders and reads the call, ship, test, or hold, and why.

Audience. A product team member or a reviewer who wants to see the weights and the gates behind a call as well as its score.

Visual world. Since 2026-10-12 the route owns its design inside the site frame (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Calculator), so judge it against the "Project routes" section of `DESIGN_CHECKLIST.md`. The header, the footer, and the build-note strip are the shell's.

## Redesign, 2026-10-12

The route left Catalog 97's print shop layout in stage 2 of the project-sovereign work (branch `design/g4-fintech-calculators`). Its genre is a scoring worksheet, the kind a product team keeps for RICE or ICE triage, with a one-page decision memo and a 2x2 prioritisation matrix as the references.

### Decisions

The page is a title row (the h1 and the one pinned sentence), then the presets, then the worksheet. The presets are a row of six chips with `aria-pressed` (one sideways-scrolling line under 640px, with 5px of padding inside the scroll box and a matching negative margin so the focus ring is never clipped), and under them one line holds the active preset's name with its outcome hint, and Reset to preset and Copy link at its end, with "Link copied" or the failure message beside Copy link and in an sr-only status. Once a slider leaves the preset's numbers that line reads "Custom, from" and the preset's name with no hint, since the hint describes the preset's own numbers. On a phone the pressed chip is scrolled into view when the page opens on a later preset. At 960px and wider the worksheet is two columns, the score caption (`role="status"`, "Score N · WORD") and the four sliders on the left with "Why this verdict" directly under them, and the matrix with the verdict stamp on the right, sticky while the ledger scrolls. Under 960px it is sliders, matrix, ledger, with the matrix held on screen to the 30rem its desktop column gives it. "Why this verdict" is a ruled ledger, one row per axis with its bar and its arithmetic, closing on a weighted-score row with a rule above and a double rule below, then the rationale, then the gates and "Decision Lab keeps those axes separate, then forces a plain call." in small type. The ledger's rows and its weighted-score row print two decimal places, because every contribution is a multiple of 0.05 and the rows have to add up to the line under them, while the score caption and the gates stay at one place. That one-place score is the weighted-score row rounded half up from its exact hundredths, so 53.25 reads "Score 53.3" and a total of 67.95 counts as 68 at the ship gate whichever sliders produced it. The bar takes a row of its own under 480px and from 960px to 1039px, where the left column is as narrow as a phone. The rationale names the strongest axis only when it scores 60 or more and the largest risk only when it scores 50 or more, and says plainly when neither stands out.

Colour is the route's own `--dl-*` properties on `.dl`, a cool worksheet paper, a navy ink, a blue for the slider values, links, and focus, and a red for the stamp, with a dark story under `.dark .dl`. The matrix reads `--c97-*` through inline style, so the root redeclares `--c97-ink`, `--c97-ink-2`, `--c97-surface`, `--c97-rule`, `--c97-field`, `--c97-overprint` (the stamp), and `--c97-accent`. Archivo for text, Fragment Mono for figures, and Anton only for the stamp word, because a rubber stamp is the one place a poster face is the object. The stamp's stamp-down animation runs only without reduced motion, and its 9 degree tilt sits on a group outside the animated one, so the tilt shows in both cases and turns on the quadrant's centre. On paper the pressed chip keeps its fill through `print-color-adjust: exact`.

### Cut, and not to be restored

The poster hero, the plate, the readout trio (score, preset, and the delta all print beside the sliders), the "URL state" block with its explanatory line, the bordered preset panels in the right rail, the "Active: X" meta line, the Target and link kicker icons, and the seams.

### Pinned, and kept

The h1, the standfirst sentence, the four slider labels with their "vs preset" and "Preset" readings, the score caption ahead of the sliders, the h2 "Why this verdict" after them, `data-testid="decision-lab-shell"` (now the route root) holding the contribution arithmetic, "Decision Lab keeps those axes separate, then forces a plain call.", the preset buttons by name, "Reset to preset", "Copy link" and "Link copied", every URL parameter and the debounced history replace, and Impact as the first slider on the page. No route test or e2e assertion changed in the redesign. The review fixes of 2026-10-12 changed one pinned string, the onboarding-refresh rationale in `decision-lab-data.test.ts`, which now ends "No single risk stands out at these levels." because an effort of 38 is not a heavy delivery cost.

### Verified state, 2026-10-12

The route suites (24 tests) pass with the shared suites. `tsc --noEmit` and eslint on the changed files are clean. In Chromium, the decision lab keyboard test in `e2e/all-projects.spec.ts` and the route's `project-routes` tests pass against the dev server and a production build. `contrastSweep.mjs` reports no failures in either theme, and `layoutSweep.mjs` reports 0 fail, with the worksheet grid as its orphan-row review and the sticky matrix as its sticky-offset review. On the production build at 1440x900 the first slider sits at y580 against y611 before, with the matrix and the stamp beside it on the first screen; at 390x844 it is at y635 against y557, a little lower than before because the preset row now comes first, and on a phone that row stays one line that scrolls sideways instead of wrapping five rows deep. A keyboard walk from the top reaches the six chips, Copy link, and the four sliders; Space on a chip applies the preset and writes `preset=` to the URL, and Home on Impact writes `impact=0`. Under reduced motion the stamp has no animation. A Chromium print hides Reset to preset and Copy link.

Not checked: WebKit and Gecko prints, a screen reader, touch devices.

### Review fixes, 2026-10-12

The custom note, the two-place ledger, the rationale floors, the stamp's outer tilt group, the pressed chip on paper, the matrix cap under 960px, the stacked bar from 960px to 1039px, and the pressed chip scrolling into view on a phone all landed after the verified state above. So did the score's rounding. Before it, the one-place score was `toFixed(1)` on the float sum, which sent a total ending in 5 hundredths up or down by how the float happened to fall, so Enterprise permissions read "Score 53.2" over a weighted score of 53.25, and two states totalling 67.95 with the same gates could ship and test. Counted over all 101^4 slider states in Node, the half-up rule moves the caption by 0.1 in 27,554,585 states (26%) and changes the verdict in 45,065, and no printed total is left with two verdicts. The pinned override score in `decision-lab-data.test.ts` moved from 66.9 to 67 with it. The route suites (37 tests) pass. None of it has been seen in a browser yet, so the tilt with motion on, the print, and the three layout changes are still to check. With the tilt showing, the active point overlaps the stamp frame's lower left corner at 33 of the 10,201 confidence and impact pairs, all with a confidence of 52 to 59 and an impact of 60 to 64. The level stamp touched it at 9, and I left the stamp's size and place alone.
