---
target: "route:/fintech-tools/interchange-iq"
total_score: 21
max_score: 36
na_heuristics: 9
p0_count: 1
p1_count: 3
target_identity: "file:/Users/isaacvazquez/Website/route:/fintech-tools/interchange-iq"
timestamp: 2026-09-14T21-34-08Z
slug: route-fintech-tools-interchange-iq
closed: true
---
Method: lighter loop (one design review subagent and one computed-value sweep subagent, synthesized in the parent), with an adversarial refuter on every P0 and P1. Run 2026-09-14 against the dev server before remediation.

This is the first snapshot under the slug `route-fintech-tools-interchange-iq`. Heuristic 9 is scored n/a, so the total is out of 36.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Every slider updates the table and chip live, and the active tab shows in the crumb. |
| 2 | Match system / real world | 2 | The breakeven card inverts the result, the debit row says "Reg E" for a Regulation II cap, and "IC+", "eff." and "tx" go unexplained. |
| 3 | User control and freedom | 3 | Reset returns every input to its default, and nothing is destructive. |
| 4 | Consistency and standards | 2 | The tabs act as both filter and anchor, the "Sliders" and "Card mix" pills scroll to the page title, and font sizes are inline px values. |
| 5 | Error prevention | 2 | Sliders constrain input, but IC+ rows are recommended without the network fees or volume floor that apply to them. |
| 6 | Recognition rather than recall | 3 | Inputs, mix and results are all visible on desktop. |
| 7 | Flexibility and efficiency | 1 | Slider-only entry in $1,000 and $5 steps, with no typed value and no "what I pay today" baseline. |
| 8 | Aesthetic and minimalist design | 2 | Eight hero cells, "588 tx/mo" repeated on all seven rows plus the chip and a cell, and decorative orange gradients. |
| 9 | Error recovery | n/a | Constrained sliders cannot produce an invalid state, and no error path exists. |
| 10 | Help and documentation | 3 | The reference band, the card mix info toggle and the caveats card are good, and the educational line is visible without interaction. |
| Total | | 21/36 | Acceptable (58%) |

## Design Specificity Verdict

LLM assessment. Partly authored, leaning template. The processor ledger rows with model tags and per-transaction readouts belong to payments, and the reference band explains interchange, flat pricing and interchange-plus in plain language. The hero is the same `HomeStatsPanel` used on the budget planner and the homepage, with eight generic cells and a "Stripe IC+ wins" meta line. On mobile the inputs rail only starts at 1,818px of a 4,545px page, so a merchant scrolls past every answer before they can change their own numbers.

Deterministic scan. `impeccable detect` exited 0 with 15 advisory design-system-font-size findings, all in `src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx` (lines 59, 71, 335, 367, 378, 395, 413, 458, 470, 522, 547, 688, 738, 750 and 764), which are the inline 13px, 11.5px and 10.5px values the review also named. No DEGRADED banner printed. The other group 3 files style through utility classes, so the detector had nothing to flag there, and it missed every P0 and P1 below, since those live in engine math, copy and computed contrast.

Visual overlays. No user-visible overlay is available, because injection was blocked by the site's CSP. The computed-value sweep is the fallback signal. Its contrast gate read 16.29:1 in light and 15.28:1 in dark at every width, and on this route it found the four slider readouts at 4.44:1 in light mode, the 18px info button, and the unlabeled Inputs and Card mix preview sections.

## Overall Impression

The top of the page makes a clean promise, "Stripe IC+ wins" with an annual savings figure in green, and the processor table backs it up in one scan. The trust breaks one card later, where the breakeven card tells the merchant the opposite of the table, and it breaks again for anyone who knows payments, since the debit rate on screen is not the rate the math uses, the regulation is misnamed, and the IC+ totals leave out the network fees the flat rates include. The single biggest opportunity is to make every number and sentence on the page read from the engine's own output, so the card, the row labels and the caveats cannot drift from the calculation.

## What's Working

The reference band explains interchange, flat versus interchange-plus, and the real-world caveats in plain prose, and the educational-purposes line is visible without any interaction (client:707-771).

The sliders are native range inputs with `aria-valuetext`, so keyboard and screen reader use works (client:79-96).

Sorting cheapest first with a Cheapest tag and an effective rate on every row lets the main comparison read in one scan.

## Priority Issues

[P0] The breakeven card says the opposite of the table every time it shows.
`calcStripeBreakevenTicket` returns null when Stripe IC+ is cheaper at every ticket size, which its own comment says (interchangeIq.ts:141-149). The client renders that null as "At your current card mix, Stripe IC+ never beats Stripe flat. The markup plus blended interchange exceeds the flat rate at every ticket size." (interchange-iq-client.tsx:542-555). At the defaults the table shows Stripe IC+ at $878.50 a month and Stripe flat at $1,626.47. The refuter tested five volume and mix combinations and the sentence only rendered when IC+ was cheaper at every ticket size, so it was inverted every time it appeared. "Breakeven calc" is a named metric in the case study (caseStudies.ts:134) for a featured portfolio project, so the named analysis gives inverted guidance on the tool's core comparison.
Fix: return a tagged result from the engine (`icAlwaysCheaper`, `flatAlwaysCheaper`, or `crossover` with a ticket) and render "At this card mix Stripe IC+ is cheaper than Stripe's flat rate at every ticket size" for the first case.
Suggested command: /impeccable harden

[P1] The debit card mix row shows a rate the engine does not charge and names the wrong regulation.
The row reads "~0.05% + $0.22" (client:178), but the engine charges 0.25% + $0.22 (interchangeIq.ts:3), so every IC+ fee is computed on a debit rate five times the one displayed. The label and the info copy say "Reg E" (client:178, 646), while the debit interchange cap is Regulation II. The review relied on general knowledge for the regulation names and did not check the Federal Reserve's current cap figures.
Fix: export `INTERCHANGE_RATES` and render the rate strings from it, decide which debit rate is intended, and relabel the row "Regulated debit (Reg II)".
Suggested command: /impeccable harden

[P1] IC+ totals omit network and assessment fees, and the volume caveat never shows at realistic mixes.
IC+ fees are interchange plus markup only (interchangeIq.ts:100-102), with no card-network assessment fees, even though Adyen's note claims "blended scheme fees" (interchangeIq.ts:33) and the reference copy says flat rates bundle "network assessments" (client:722). Every IC+ row is understated against the flat rows it is compared with. The "typically $250k+/year" eligibility caveat (client:539, interchangeIq.ts:32) only renders inside a branch of the breakeven card that does not show at realistic mixes, so at $5,000 a month and a $20 ticket the hero still read "Stripe IC+ wins" with no mention that the volume is about $60,000 a year.
Fix: add an assessments constant to the IC+ formula and disclose it, and move the volume floor out of the breakeven branch so IC+ rows carry "Needs about $250k a year" whenever volume times 12 is under it.
Suggested command: /impeccable harden

[P1] Slider readouts measure 4.44:1 on the tool rail in light mode.
The sweep measured the $50,000, $85, 65% and 18% readouts, 13px at weight 600, in `--home-signal` #C93F19 on the rail background rgb(243,242,237) at 4.44:1 at every width, and the refuter reproduced it. Dark mode passes at 6.51:1. The rail class is shared with rent vs buy, so the same token fails there.
Fix: darken the light `--home-signal` token in globals.css:255. The refuter computed #BF3B16 at 4.86:1 on the rail and 5.00:1 on paper.
Suggested command: /impeccable harden

[P2] Three smaller readouts mislead or miss the floor.
At 0% credit the breakeven legend prints "Breakeven $1" (client:527) for a $0.83 crossover under an axis that starts at $5. "Annual savings" is 12 times the gap between PayPal and the cheapest row (client:143, 183), so it is measured against the most expensive of seven processors without saying so, while the neighboring cell carries "vs PayPal". The card mix info button is 18 by 18px (client:626), under the 44px touch floor.
Fix: print the crossover to the cent or say "under $1", give the savings cell the sub "vs PayPal, over 12 months", and pad the info button to 44px.
Suggested command: /impeccable clarify

## Persona Red Flags

Jordan (first-timer) meets "IC+", "eff.", "tx/mo", "Reg E" and "OptBlue" without definitions. The tabs look like filters but also scroll the page, and the breakeven card contradicts the table, so there is no safe answer to take away.

Casey (mobile) drags four sliders in $1,000 steps to reach a real volume, finds them 1,818px down, and has to hit an 18px info toggle.

Sam (screen reader) gets in-page tabs built as anchors with `aria-current="true"` that also filter content (client:246-250), where buttons with `aria-pressed` would announce correctly. The toggled info paragraph is a `role="region"` with no label (client:634-636), and the sweep found the Inputs and Card mix preview sections unnamed.

A fintech founder or MBA classmate, the peer audience PRODUCT.md is tuned for, would catch the missing network assessments, Reg E for Reg II, a displayed debit rate that does not match the math, Square's card-present 2.6% + $0.10 (interchangeIq.ts:29) compared against online flat rates, and 2024 rate tables on a page reviewed in September 2026. The project is `featured: true` and second in `PORTFOLIO_PROJECT_ORDER` (caseStudies.ts:137, 1155).

## Minor Observations

On mobile the inputs come after the answers, and the quick links go to the wrong places. The "Sliders" and "Card mix" pills link to `#hero`, which is the page title, and "Reference" links to the processor table instead of the reference band (client:322-327). The quick-link pills are 38px tall.

The card mix label falls through to "amex-heavy" whenever credit equals debit, even with 0% Amex (client:155-160). Checkout.com ties Stripe IC+ at $878.50, but only the first row gets the Cheapest tag. The UI copy "Your current avg ticket is $85" at client:484 joins its second clause, "IC+ wins", with an em dash against WRITING_VOICE.md, and "Caveats & real-world nuance" (client:725) uses a word the voice table flags. The reference band has a Signal Orange radial wash (globals.css:2559) and the breakeven bar an orange gradient (client:505-506), both against DESIGN.md's rule on decorative accent washes. The case study says "Real interchange data", while the page's own caveat calls the figures "representative averages". The meta chip dividers measure 2.06:1 light and 2.46:1 dark, which is decorative punctuation. Dark mode and 390px render without horizontal overflow.

Not checked in this run were a real VoiceOver or NVDA pass, current Visa, Mastercard, Amex and processor price sheets, and the Federal Reserve's current Regulation II figures.

## Questions to Consider

What if the first input were "What do you pay today?", so every savings figure had a real base?

Since the ticket-size crossover lands under $5 at every mix the sliders allow, should the breakeven card answer the question merchants actually face, which is at what annual volume interchange-plus becomes both available and worth the contract?
