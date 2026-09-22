---
version: 1
slug: "route-fintech-tools-budget-planner"
primary_target: "route:/fintech-tools/budget-planner"
related_targets: ["src/app/fintech-tools/budget-planner/budget-planner-client.tsx","src/lib/budgetPlanner.ts"]
---

# Budget planner surface brief

Scope. The `/fintech-tools/budget-planner` route, rendered by `src/app/fintech-tools/budget-planner/budget-planner-client.tsx` over the arithmetic in `src/lib/budgetPlanner.ts`. State lives in the browser.

Visitor mode. Operate. The visitor is entering a month of income, categories and expenses and needs the totals to mean what they say.

Audience. Someone setting up a personal monthly budget who reads the chip and stats panel as the answer, so every label has to describe the number beside it.

Visual world. Catalog 97 through the bridge, as of 2026-09-16. The route renders inside `Catalog97ToolShell`. Its components still read `--home-*` names, and the bridge block in `src/app/catalog97.css` aliases each one onto the Catalog 97 value for the enclosing surface, sets every `--radius-*` token to 0, and sets every `--shadow-*` token to `none`. `DESIGN.md` still describes the Working Instrument, so judging this route against it manufactures false findings. The tool shell brief, `src-components-catalog97-catalog97toolshell-tsx.md`, has the detail. Hex values and contrast figures further down this brief were measured before the bridge, so they are Working Instrument values and need re-measuring before anyone acts on them.

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
