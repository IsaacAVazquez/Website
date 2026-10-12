---
version: 1
slug: "route-fintech-tools-budget-planner"
primary_target: "route:/fintech-tools/budget-planner"
related_targets: ["src/app/fintech-tools/budget-planner/budget-planner-client.tsx","src/lib/budgetPlanner.ts"]
---

Updated on 2026-09-28 by the responsive pass. Envelope names hyphenate, so "Entertainment" and "Transportation" no longer clip at 320.

# Budget planner surface brief

Scope. The `/fintech-tools/budget-planner` route, rendered by `src/app/fintech-tools/budget-planner/budget-planner-client.tsx` over the arithmetic in `src/lib/budgetPlanner.ts`. State lives in the browser.

Visitor mode. Operate. The visitor is entering a month of income, categories and expenses and needs the totals to mean what they say.

Audience. Someone setting up a personal monthly budget who reads the chip and stats panel as the answer, so every label has to describe the number beside it.

Visual world. Since 2026-10-12 the route owns its design inside the site frame (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Log and Calculator), so judge it against the "Project routes" section of `DESIGN_CHECKLIST.md` and the redesign section at the end of this brief, not against Catalog 97. The header, the footer, and the build-note strip are still the shell's. The 2026-09-14 loop below predates the redesign, so its colours, token names, and contrast figures are history.

## Loop, 2026-09-14

The pre-fix snapshot is `2026-09-14T21-35-57Z__route-fintech-tools-budget-planner.md` at 21/40 (52.5%, Acceptable) with 0 P0 and 2 P1, all ten heuristics scored. It is closed now. The fixes landed in `83807a4f`. No post-fix critique snapshot was taken, so the evidence below is the post-fix computed-value sweep, where 22 of 24 checks across the four group 3 surfaces passed on the first run and all four checks on this route passed.

### What was fixed, with measured evidence

The chip's Remaining silently subtracted the savings target, and "% of budget" was a percent of income. With income $5,000, savings $500 and a $120 expense, the chip reads "Left after savings $4,380" and "2% of income" now, and no "% of budget" text remains. With no income and money spent, the planner used to report 0% spent. With income emptied and a $120 expense, the chip reads "Left after savings -$120" and "No income set," the Percent spent cell and the spend readout say the same, and the progress bar fills to 100% in `--home-negative`. With a $9,000 Housing budget against $5,000 income and $500 savings, the stats meta reads "Over budget by $4,500."

The global rule that painted every valid input with the success green border is gone from `globals.css`. None of the 21 visible inputs carry that colour at load or after edits, and empty inputs show the `rgba(25,24,19,0.14)` rule border.

### Decisions not to re-litigate

The global green valid-input border was removed on purpose, because it made the one status colour on the page mean nothing and used a legacy alias. It also reached the score pools settings and tracker inputs, so do not restore it for this route. `--home-signal-ink` (#BF3B16 light, #FF6B3B dark) carries signal-coloured text on tool rails so the brand accent `--home-signal` stays #C93F19.

### False positives worth not re-deriving

The disabled "Add expense" button measures 3.33:1 in dark mode, and disabled controls are exempt from the contrast requirement. The tool meta chip "·" dividers are `aria-hidden` decoration. The sweep logged an aborted `_rsc` request on this route at 1440 dark, which is a dev server prefetch cancellation during in-page navigation. `critique-storage latest` on a `route:` target closes the snapshot it reads, so read snapshots by filename or with `trend`.

### Still open

With the green rule gone, input borders measure 1.33:1 in light and 1.52:1 in dark against the surround, and the category name fields measure 1.00:1. Every field has a visible label, which is why this was left for now, but it sits under the 3:1 non-text contrast bar. The planner has no educational disclaimer anywhere in its code. The Budget month control is 19.2px tall. Off-month expense dates, a negative expense and the disabled Add expense button still fail without a message, deleting an expense has no undo, and every new month starts from seven $0 categories. Touch devices, a production build and a screen reader were not checked this loop.

## Redesign, 2026-10-12

The route left Catalog 97's print shop layout in stage 2 of the project-sovereign work (branch `design/g4-fintech-calculators`). Its genre is envelope budgeting, with YNAB's budget screen and a paper cash-envelope system as the references and a check register for the ledger.

### Decisions

The page is a title row (the h1, one sentence, and the storage note, printed once), then one month bar, then the envelopes, then the ledger. The month bar holds the month stepper, Monthly income, Savings target, the month's summary (Spent with its share of income, and Left to spend after the savings target), and Export CSV and Reset month. At 1024px and wider it is one row; under that it wraps into a two-column grid with the stepper, the summary, and the actions on their own lines. The sr-only h2 "Month and income" stays.

The envelopes are the main grid directly under the month bar. Each envelope is a kraft-paper card with a folded flap, because the envelope is the object and carries its own data, meaning its name field, its budget field, what was spent and what is left (or what it is over by), the entry count, and delete. The fill is a 6px strip along the envelope's bottom edge, green while under budget, and an over-budget envelope gets a torn red flap and a red strip, with the reading printed as text so the colour is never the only signal. The budget is set inline on each envelope, so "Set a budget below" and the separate category rows are gone. An envelope with nothing budgeted or spent reads "Nothing budgeted yet". The last tile is a dashed "New envelope" form holding the add-category field. The Categories head prints the budgeted total, the month name, and what is left to assign (income less savings less budgeted), which is the YNAB "ready to assign" reading.

The ledger keeps its add-expense form at the top and the check register under it, with the running balance starting from income less the savings target. Under 640px and on paper each register row stacks into a labelled block. An expense with no note reads "No note" in the second ink rather than a dash.

Colour is the route's own `--bp-*` properties on `.bp`, a warm white page, near-black ink, kraft envelopes (#ece0c8 with a #dccbaa flap), a green for funded, a red for overspent, and a blue for actions and the focus ring, with a dark story under `.dark .bp`. The root redeclares `--c97-ink`, `--c97-ink-2`, `--c97-surface`, `--c97-rule`, `--c97-field`, and `--c97-accent`. No added typeface, Archivo with tabular numerals, the h1 at weight 800. Newsreader, Anton, and Fragment Mono left the page.

### Cut, and not to be restored

The poster hero sheet and its standfirst, the plate around the month controls, the readout trio (Income repeated the field above it, and Spent and Left to spend now sit in the month bar), the second plate around the envelopes, the separate "Categories" band of rows with its own budget fields, the torn and deckle seams, and `EnvelopesSignature.tsx`, whose envelopes now live in the client. `envelope()` in `envelopes.ts` no longer returns the `spentLabel` and `budgetLabel` strings only that component read.

### Pinned, and kept

`data-testid="budget-planner-shell"` (now on the route root), the h1 "Budget Planner", the h2s "Month and income", "Categories", and "Expenses ledger", every aria-label the route test and `e2e/product-surfaces.spec.ts` use, the register's `data-label` cells, the month stepper, CSV export, the reset confirm, the storage note and its memory-only status, and the rule that the month, income, and savings target come before the figures and the envelopes in the DOM. The route test changed in two places, both class names, since the readouts and the old envelope grid are gone: the "left to spend" check reads `.bp-sum-value` instead of `.c97-stat-value`, and the order check reads `.bp-envelope-grid` instead of `.c97-envelope-grid`.

A category's meta paragraph carries its id only once the category has linked expenses, because the seeded category ids are random until the saved month loads and an unconditional id broke hydration.

### Verified state, 2026-10-12

The route's three suites pass with the shared suites (21 suites, 166 tests together across the group). `tsc --noEmit` and eslint on the changed files are clean. In Chromium, the fintech test in `e2e/product-surfaces.spec.ts` and the route's `all-projects` and `project-routes` tests pass against the dev server and against a production build. `contrastSweep.mjs` reports no failures in either theme, and over-budget red on kraft measures 5.0:1 light and 6.65:1 dark by hand, since the sweep loads the empty month. `layoutSweep.mjs` reports 0 fail; its orphan-row reviews are the three-cell stepper, the expense form, and the month bar wrapping on purpose under 1024px. On the production build at 1440x900 the first input (Budget month) sits at y381 against y631 before, and the envelopes start at about y530 on the first screen; at 390x844 the first input is at y427 against y639. A keyboard walk from the top reaches Previous month, the month field, Next month, income, savings, Export CSV, Reset month, and the first envelope's name, budget, and delete; Enter and Space on the stepper move the month. A Chromium print hides the actions and forms and keeps the envelopes and the register.

Not checked: WebKit and Gecko prints, a screen reader, touch devices.
