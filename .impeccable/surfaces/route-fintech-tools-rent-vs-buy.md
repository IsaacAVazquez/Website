---
version: 1
slug: "route-fintech-tools-rent-vs-buy"
primary_target: "route:/fintech-tools/rent-vs-buy"
related_targets: ["src/app/fintech-tools/rent-vs-buy/rent-vs-buy-client.tsx","src/lib/rentVsBuy/engine.ts","src/lib/rentVsBuy/defaults.ts"]
---

# Rent vs buy surface brief

Scope. The `/fintech-tools/rent-vs-buy` route, rendered by `src/app/fintech-tools/rent-vs-buy/rent-vs-buy-client.tsx` over the engine in `src/lib/rentVsBuy/engine.ts`, with dated tax assumptions in `src/lib/rentVsBuy/defaults.ts`.

Visitor mode. Operate. The visitor is testing a real decision against their own numbers.

Audience. Someone weighing a home purchase who wants to see net worth years from now under both paths, including a careful reader such as an MBA classmate who will check the assumptions and the tax handling first. Output is educational only, and the disclaimer and assumption disclosure are a compliance constraint.

Visual world. Working Instrument, the site-wide `--home-*` palette in light and dark.

## Loop, 2026-09-14

The pre-fix snapshot is `2026-09-14T21-35-55Z__route-fintech-tools-rent-vs-buy.md` at 23/40 (57.5%, Acceptable) with 0 P0 and 5 P1, all ten heuristics scored. It is closed now. The fixes landed in `83807a4f`, and a plural chart label followed in `972f3ac2`. No post-fix critique snapshot was taken, so the evidence below is the post-fix computed-value sweep, where 22 of 24 checks across the four group 3 surfaces passed on the first run and all eight checks on this route passed.

### What was fixed, with measured evidence

Clearing Home price used to snap it to $10,000 on each keystroke. Typing 7, 5, 0, 0, 0, 0 into the emptied field now reads 7, 75, 750, 7500, 75000 and 750000, and 750000 is what gets stored after Tab. The filing status select is gone. The marginal tax rate is disabled while itemizing is unchecked and enabled when it is checked. The line "Educational only, not financial or tax advice." renders outside the details panel and is visible at 390 and 1440 at 5.2:1 in light mode. The assumptions now say investment growth on both sides is untaxed and no longer print a standard deduction or exclusion figure.

Break-even used to stay set after the buyer fell behind again. With appreciation 6%, rent $2,400, 20 years and a 10% return, the page reads "Renting comes out ahead" and "Buying is not ahead at the end of 20 years," the chart label matches, and no dashed break-even line draws. Other seeds read "after about 11 years and 2 months" and "after about 1 year and 2 months," and the defaults read "Buying is not ahead at the end of 7 years." The renting verdict and the renter net worth figure measured 4.44:1 on the rail and measure 4.85:1 light and 6.51:1 dark now through `--home-signal-ink`.

The sweep caught the chart's `aria-label` reading "Net worth over 1 years." at a one-year horizon. `972f3ac2` routes it through the `plural` helper. A live check on 2026-09-14 at a one-year horizon read "Net worth over 1 year. Buying is not ahead at the end of 1 year."

### Decisions not to re-litigate

These were settled by Isaac on 2026-09-14. The tool does not model the standard deduction. Filing status was removed because the engine never used it. The marginal rate only applies when itemizing. Investment growth is untaxed on both sides by design, and the assumptions say so. Separately, `--home-signal-ink` (#BF3B16 light, #FF6B3B dark) carries signal-coloured text on tool rails so the brand accent `--home-signal` stays #C93F19.

### False positives worth not re-deriving

The tool meta chip "·" dividers measure 2.06:1 light and 2.46:1 dark, but they are `aria-hidden` decoration. Aborted `_rsc` requests during in-page navigation on the dev server are prefetch cancellations and not failures. `critique-storage latest` on a `route:` target closes the snapshot it reads, so read snapshots by filename or with `trend`.

### Still open

The assumptions still print "SALT cap $40,000," and the dated 2026-07 figures in `defaults.ts` were not checked against IRS numbers in this loop. The "close to a wash" band of the larger of $5,000 or 2% of price, no PMI below 20% down, and the missing validation messages behind silent clamps were not addressed. Reset still wipes the saved scenario with no confirm or undo. The assumptions summary control is 19.2px tall. Touch devices, a production build and a screen reader were not checked this loop.
