---
target: "route:/fintech-tools/rent-vs-buy"
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 5
target_identity: "file:/Users/isaacvazquez/Website/route:/fintech-tools/rent-vs-buy"
timestamp: 2026-09-14T21-35-55Z
slug: route-fintech-tools-rent-vs-buy
closed: true
---
Method: lighter loop (one design review subagent and one computed-value sweep subagent, synthesized in the parent), with an adversarial refuter on every P0 and P1. Run 2026-09-14 against the dev server before remediation.

This is the first snapshot under the slug `route-fintech-tools-rent-vs-buy`. All ten heuristics were scored.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The verdict chip and rail recompute live with role=status, but nothing shows which inputs move the answer. |
| 2 | Match system / real world | 3 | Plain labels overall, but break-even can sit beside a renting verdict, the year wording reads a year early, and "Monthly P&I" and "SALT cap" go unexplained. |
| 3 | User control and freedom | 2 | Reset wipes the saved scenario in one click with no confirm or undo. |
| 4 | Consistency and standards | 3 | Matches the other fintech tools. Units sit in aria-hidden suffixes. |
| 5 | Error prevention | 1 | Clearing a field snaps it to the decoder minimum mid-typing, values get clamped silently, and filing status changes no number. |
| 6 | Recognition rather than recall | 3 | Everything is visible, but nothing says what maintenance or appreciation are a percent of. |
| 7 | Flexibility and efficiency | 2 | One saved scenario, with no side-by-side comparison or sensitivity view. |
| 8 | Aesthetic and minimalist design | 3 | Clean plates. The chart has no axes, the icons are decorative orange, and the rail has a resting shadow. |
| 9 | Error recovery | 1 | No validation message anywhere, only silent clamps. |
| 10 | Help and documentation | 2 | The assumptions and the educational disclaimer sit in a collapsed details panel, and no field has inline help. |
| Total | | 23/40 | Acceptable (57.5%) |

## Design Specificity Verdict

LLM assessment. Partly authored. The verdict chip, the net worth chart and the opportunity-cost framing are specific to this question and match the case study's pitch. The surrounding shell of crumbs, topbar, meta chip and sticky rail is the shared fintech tool shell, and the 20-field input wall reads like any mortgage calculator. On mobile the verdict rail lands after every input on a 3,988px page, so the one piece that makes this tool different is the last thing a phone visitor reaches.

Deterministic scan. `impeccable detect` exited 0 with 15 advisory font-size findings, all in `interchange-iq-client.tsx`, and zero on this route, because rent vs buy styles through utility classes the detector does not read as literal sizes. No DEGRADED banner printed. The detector missed every P1 below, since they live in engine semantics, input handling, disclosure placement and computed contrast.

Visual overlays. No user-visible overlay is available, because injection was blocked by the site's CSP. The computed-value sweep is the fallback signal. Its contrast gate read 16.29:1 in light and 15.28:1 in dark at every width, and on this route it found the renting verdict and the renter net worth figure at 4.44:1 in light mode, the Filing status select border at 1.33:1 light and 1.52:1 dark against its own background, and the "Assumptions & limits" summary with a 20px tall hit area.

## Overall Impression

The intro makes a sharp promise, that the honest question is what you are worth years from now, and the default verdict lands immediately. The tool then loses a careful reader in three places. Typing your own home price fights back, because clearing the field snaps it to $10,000 on every keystroke. The verdict block can say renting wins and buying pulls ahead in the same breath. And the tax controls an MBA reader would test first change nothing, while the disclaimer that should frame all of it sits inside a closed panel. The single biggest opportunity is to make the headline block internally consistent, one verdict, one break-even that respects the whole horizon, and a visible disclaimer under it.

## What's Working

The model framing is honest and matches the case study, crediting the renter the down payment plus closing costs and investing the monthly difference on whichever side spends less (engine.ts:61-125).

The assumptions block is generated from the engine's own metadata (`result.assumptions`), so the disclosure cannot drift from the numbers.

The chart carries a role=img label that states the break-even sentence, and the verdict chip is a polite live region.

## Priority Issues

[P1] Break-even stays set after the buyer falls behind again, so the verdict block contradicts itself.
`breakEvenMonths` is set the first time the buyer's net worth reaches the renter's portfolio and never cleared (engine.ts:130), while the verdict is classified from the final-year gap (engine.ts:165). The refuter ran the default input with 6% appreciation, $2,400 rent, 20 years and a 10% return. Buying led from year 5 to year 19, peaking at +$44,908 in year 14, then fell to -$14,240 in year 20. The rail rendered "Renting comes out ahead" directly above "Buying pulls ahead around year 5" (client:358-360), and the chart's break-even rule marked year 5 too. The engine tests (engine.test.ts:44-56) only check null against the horizon, so nothing covers a re-crossing.
Fix: reset `breakEvenMonths` to null whenever the buyer drops behind, and when the buyer led mid-horizon but ends behind, say so, for example "Buying leads from year 5 to 19, then falls behind." Add one engine test for the re-crossing case.
Suggested command: /impeccable harden

[P1] The tax controls do not do what they appear to, and the disclosure leaves out an assumption.
Filing status changed no number even with Itemize deductions on, because the standard deduction and exclusion are context only (types.ts:89-92). The marginal tax rate only matters when itemizing, since the engine sets `marginalRate` to 0 otherwise (engine.ts:58), and itemizing is off by default (defaults.ts:59). The tax note claimed itemizing while it was off. The renter's portfolio also grows untaxed (engine.ts:118-125), and the tax note (defaults.ts:26-27) does not say so. An MBA reader who changes filing status and sees nothing move will stop trusting the rest.
Fix: show Marginal tax rate only when Itemize is on, label filing status as context for the disclosure only, drive the tax note from the itemize state, and add a sentence saying the renter's investment gains are not taxed.
Suggested command: /impeccable harden

[P1] The educational disclaimer only exists inside a closed details panel.
"Educational only, not financial or tax advice" lives inside a collapsed `<details>` at the bottom of the rail (client:423-437), and git history shows it has been collapsed since the tool shipped in d9c2f1f6. PRODUCT.md and CLAUDE.md treat this disclaimer as a compliance constraint for this engine, and a visitor has to open a panel to see it.
Fix: move that sentence out of the details element to an always-visible line under the verdict, and keep the full assumptions collapsible.
Suggested command: /impeccable harden

[P1] Clearing Home price snaps it to $10,000 on each keystroke, so a new price cannot be typed.
Each keystroke runs `Number(event.target.value)` (client:188), and the hook decodes and clamps the value immediately (useRentVsBuy.ts:60, persistence.ts:36). Clearing Home price produced 10000 in the walk and flipped the verdict to buying, and a down payment of 150 silently became 100. Typing your own price is the first real job on the page.
Fix: keep a string draft per field in `NumberField` (client:157-199), commit on blur or on a valid parse, and show an inline range message when a value is out of bounds.
Suggested command: /impeccable harden

[P1] The renting verdict and the renter net worth figure measure 4.44:1 on the rail in light mode.
The sweep and the refuter both measured `--home-signal` #C93F19 on the rail background rgb(243,242,237) at 4.44:1 for "Renting comes out ahead" (22px at weight 600 at 1440, 18.44px at 390, neither large text) and for the renter net worth figure (12px at weight 600). The refuter corrected the scope, since "-$14,240" on page paper measures 4.57:1 and passes, and dark mode passes at 6.51:1, so the failure is light mode on the rail bed.
Fix: darken the light `--home-signal` token at globals.css:255. #BF3B16 gives 4.86:1 on the rail and 5.00:1 on paper, and the same change fixes the Interchange IQ readouts that share the rail class.
Suggested command: /impeccable harden

[P2] The break-even wording reads a year early and has a plural bug.
`formatBreakEven` (client:36-40) turns 18 months into "around year 1, month 6", which most readers take as the sixth month of the first year, and at 1 month it prints "after about 1 months", which the walk hit on screen.
Fix: phrase it as elapsed time, "after 1 year and 6 months" or "during year 2", with singular handling.
Suggested command: /impeccable clarify

## Persona Red Flags

Jordan (first-timer) meets 20 inputs before any explanation, "Monthly P&I" in the rail, an unexplained "Itemize deductions" checkbox, and a break-even sentence they will read literally.

Casey (mobile) edits Home price at the top, has to scroll past about 18 fields to reach the chart and the rail, and cannot clear the field to retype it.

Sam (screen reader) hears labels without units, because the "%", "%/yr" and "/mo" suffixes are aria-hidden (client:175, 192), so "Property tax, 1.1" does not say percent or dollars. The polite live region re-announces the verdict on every keystroke.

An MBA classmate checking the assumptions would see a filing status that changes nothing, an untaxed renter portfolio, no PMI below 20% down, and a "close to a wash" band of max($5,000, 2% of price) (engine.ts:26) that is not disclosed anywhere. The SALT cap of 40,000 and standard deduction of 15,000 and 30,000 (defaults.ts:9-13) are dated 2026-07, and nobody in this run checked them against IRS figures.

## Minor Observations

The chart seeds the buyer at $0 in year 0 (client:53), while by the engine's own definition the buyer is worth $63,000 at purchase on the defaults, which draws a sharp kink, and the chart has no axis, year ticks or end values. The intro and case study both say "rent-vs-buy" and "month-by-month", and WRITING_VOICE.md prefers unhyphenated compounds. "Saved in your browser. No account, no server." (client:441) sits close to the banned "no X, no Y" shape. "re-pinned to a primary source" is internal shorthand for a mixed-fluency reader. The case study and page metadata promise "the exact year buying pulls ahead" (caseStudies.ts:196, page.tsx:8), while the UI says "around year N". Renting shows in Signal Orange and buying in positive green (client:43-47, 108-121), so renting reads like a warning in a tool whose pitch is that other calculators bias toward buying. The Home, Building2 and Landmark icons are decorative Signal Orange (client:268, 291, 306), and the rail has a resting `shadow-sm` (client:351). A code comment calls the defaults "genuinely a toss-up out of the box" (defaults.ts:33-35), but they return renting by $22,513. The h2 plate headings render at the same 29.6px as the h1 at 1440. Dark mode renders correctly with no horizontal overflow at 390px.

Not checked in this run were a real VoiceOver or NVDA pass and current IRS figures for the tax constants.

## Questions to Consider

What if the verdict showed the gap at two appreciation rates, 2% and 4%, so the assumption doing most of the work is visible instead of buried in field 11?

Does a first visit need all 20 fields, or would price, rent, down payment and years staying produce the verdict, with the rest behind "Adjust the assumptions"?
