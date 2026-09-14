---
target: "route:/fintech-tools/budget-planner"
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/isaacvazquez/Website/route:/fintech-tools/budget-planner"
timestamp: 2026-09-14T21-35-57Z
slug: route-fintech-tools-budget-planner
closed: true
---
Method: lighter loop (one design review subagent and one computed-value sweep subagent, synthesized in the parent), with an adversarial refuter on every P0 and P1. Run 2026-09-14 against the dev server before remediation.

This is the first snapshot under the slug `route-fintech-tools-budget-planner`. All ten heuristics were scored.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Live totals update, but the planner never says whether the categories fit inside income minus savings, and with no income it reads 0% spent. |
| 2 | Match system / real world | 2 | "Remaining" silently subtracts savings, and "% of budget" is a percent of income. |
| 3 | User control and freedom | 3 | Reset month confirms, and edits can be cancelled. Deleting an expense has no undo. |
| 4 | Consistency and standards | 2 | Remaining turns red in the chip but never in the stats panel, and the same four section links render twice. |
| 5 | Error prevention | 2 | Deleting a category with linked expenses is blocked, but off-month dates are accepted and over-allocation passes without a warning. |
| 6 | Recognition rather than recall | 3 | Categories, the ledger and the form are all visible. |
| 7 | Flexibility and efficiency | 2 | CSV export works, but every new month starts from seven $0 categories. |
| 8 | Aesthetic and minimalist design | 2 | Eight stat cells repeat the chip, and every valid input wears success green. |
| 9 | Error recovery | 2 | The empty category name gets a clear message, but a disabled Add expense button and a negative expense fail silently. |
| 10 | Help and documentation | 1 | Nothing explains how Remaining or left to budget are computed, and no educational disclaimer exists in the code. |
| Total | | 21/40 | Acceptable (52.5%) |

## Design Specificity Verdict

LLM assessment. Mostly a template. The page is built from the homepage's `HomeStatsPanel`, the shared tool topbar, the meta chip and the rail, and the only budgeting-specific composition is the category rows with their progress bars. An unrelated dashboard could reuse this layout as it stands. The case study's "editorial ledger-style workspace" does show up in the ledger list, but the planning question it names, whether the savings target fits, never gets its own element.

Deterministic scan. `impeccable detect` exited 0 with 15 advisory font-size findings, all in `interchange-iq-client.tsx`, and zero on this route, because the budget planner styles through utility classes. No DEGRADED banner printed. The detector missed both P1 findings below, since they are arithmetic and labeling problems that only show in driven states.

Visual overlays. No user-visible overlay is available, because injection was blocked by the site's CSP. The computed-value sweep is the fallback signal. Its contrast gate read 16.29:1 in light and 15.28:1 in dark at every width. On this route it found the disabled Add expense label at 3.33:1 in dark mode, the New category, Expense category and Expense note controls with borders at 1.33:1 light and 1.52:1 dark against their own background, the four section pills 38px tall, the Budget month input with a 20px tall hit area, and the Income, Categories and Expenses ledger h2s rendering at the same size as the h1 at 390 and 1440.

## Overall Impression

Adding an expense feels good, because the bars and the ledger respond at once, and the destructive actions are handled with care. The planner then tells people the wrong thing at the two moments that matter. A chip that reads Remaining next to income and spent does arithmetic nobody sees, a percent labeled "of budget" is a percent of income, and a month with money spent and no income set reports 0% spent. When the plan stops fitting, the only warning is grey meta text while Remaining stays green. The single biggest opportunity is to make the top of the page answer the planning question in words, what is left after saving and whether the categories fit.

## What's Working

Reset month becomes a two-button confirm (client:353-384), and a category with linked expenses has its Delete disabled with an explanation below the row (client:546, 593-600).

The CSV export is RFC 4180 with a BOM, so Excel opens it cleanly (budgetPlanner.ts:296-326).

The month switcher pairs a native month input with 44px arrow buttons, and switching months clears any edit in progress (client:188-196).

## Priority Issues

[P1] The chip's Remaining silently subtracts the savings target, and "% of budget" is a percent of income.
With income $5,000, a $1,000 savings target and $150 spent, the chip read "Income $5,000 · Spent $150 · Remaining $3,850 · 3% of budget". A reader subtracting gets $4,850, because `remainingToSpend` nets out the savings target (budgetPlanner.ts:282, 289). The 3% is spent divided by income (client:134-137, 402), not by any budget figure.
Fix: label the cell "Left after savings" and show the arithmetic, "$5,000 income, $1,000 saved, $150 spent", and relabel the percent "of income" or compute it against the budgeted total (client:151-186, 388-403).
Suggested command: /impeccable clarify

[P1] With no income and money spent, the planner reports 0% spent.
The refuter stored a September 2026 month with income 0 and one expense of $1,245.50 and reloaded. The page read "Percent spent 0%" and "0% of budget" beside "Remaining -$1,245.5". `if (totalIncome <= 0) return 0;` at client:134-137 feeds the stats cell (:170-171), the chip (:402) and the Spend progress readout (:424), and the progress bar tone (:428-433) then picks the calm signal color instead of negative. It states the opposite of the truth.
Fix: return null from that one useMemo when income is zero, say "No income set" in the chip and stats cell, and draw the bar in `--home-negative` or hide it whenever spent is above zero.
Suggested command: /impeccable harden

[P2] Over-budget plans only show as grey meta text while Remaining stays green.
After $5,100 of categories against $5,000 income and a $1,000 savings target, the panel still showed Remaining $3,850 in green, and the only warning was an 11px muted "-$1,100 left to budget" (client:411). `remainingToBudget` is the answer to the tool's stated job and gets no negative tone.
Fix: promote it to the first stat cell with negative tone below zero, plus one sentence, "Your categories are $1,100 over what's left after saving $1,000."
Suggested command: /impeccable clarify

[P2] A global rule paints every valid input green, including empty ones.
`input:valid:not(:placeholder-shown)` sets `--color-success` (globals.css:2850-2853), so $0 income, category names and the date field all carry a green border at rest in both themes. The one status color on the page ends up meaning nothing, the rule uses a legacy alias CLAUDE.md says not to spread, and the same rule reaches the score pools settings and tracker inputs.
Fix: drop the global valid rule, or scope it to fields with real constraints.
Suggested command: /impeccable quieter

[P2] Category names cannot be cleared, and a negative expense fails silently.
Clearing a category name to retype it does not stick, and entering a negative expense amount does nothing and says nothing, so the user cannot tell whether the entry was rejected or lost.
Fix: keep a draft string while editing, validate on blur with an inline message, and give the amount field a min of 0 with a visible "Enter an amount above $0" message.
Suggested command: /impeccable harden

## Persona Red Flags

Jordan (first-timer) opens to a page of $0 with no "start with your income" cue, meets three near-synonyms in "Remaining", "left to budget" and "Budgeted", and finds the Add expense button disabled until amount and date are both filled with no hint about why.

Casey (mobile) scrolls past seven categories of stacked controls on a 5,035px page to reach Add expense, and the empty ledger says "Add the first expense using the form on the right" (client:650) about a form that sits below it.

Sam (screen reader) gets stat labels with dotted underlines and a `title` that only repeats the label (HomeStatsPanel.tsx:76). Over-budget status on the bars is color only, the progress bars have no role or text alternative (client:426-437, 580-591), and the Trash2 icon in Delete is missing aria-hidden (client:550).

An MBA classmate would spot the silent netting of savings inside Remaining first. The tool models no returns or projections, and no educational disclaimer exists in the code, which the review judged acceptable for a tool that makes no forecast, though a single line would cost little.

## Minor Observations

Each new month starts from seven $0 categories (budgetPlanner.ts:109-117), so planning October means re-entering every budget, and the expense date input has no min or max (client:755-766), so the walk saved 2025-01-15 into September 2026. The section nav chips render above the h1 (client:289-304) and duplicate the pill row inside the stats panel (client:414-419), in the order Income, Categories, Expenses, Summary against a page order of Summary, Income, Categories, Expenses. "Top categories" uses a Sparkles icon, and "the categories with the most movement will surface here" (client:818-819) describes spend as movement. The rail, the expense form and the month control carry resting shadows (client:314, 703, 712). "Saved in your browser. No account, no server." repeats the rent vs buy fragment pair. The Remaining readout printed "-$1,245.5" with one decimal in the refuter's run, and nobody opened `formatCurrency` to see why. Dark mode renders correctly with no horizontal overflow, and no case study claim conflicts with the page.

## Questions to Consider

What if the top of the page were one sentence, "You have $4,000 to assign after saving $1,000, and $1,100 more is assigned than that," instead of eight cells?

Should a new month inherit last month's plan by default, since a monthly budget is mostly the same plan repeated?
