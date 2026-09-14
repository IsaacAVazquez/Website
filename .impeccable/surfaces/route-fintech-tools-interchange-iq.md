---
version: 1
slug: "route-fintech-tools-interchange-iq"
primary_target: "route:/fintech-tools/interchange-iq"
related_targets: ["src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx","src/lib/interchangeIq.ts"]
---

# Interchange IQ surface brief

Scope. The `/fintech-tools/interchange-iq` route, rendered by `src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx` over the pricing engine in `src/lib/interchangeIq.ts`.

Visitor mode. Operate. The visitor is working through their own numbers, so scanability and correct math come before expression.

Audience. Someone comparing flat-rate card processing against interchange plus (IC+) pricing for their own monthly volume, ticket size and card mix, who will read the caveats and check whether the totals hold up.

Visual world. Working Instrument, the site-wide `--home-*` palette in light and dark.

## Loop, 2026-09-14

The pre-fix snapshot is `2026-09-14T21-34-08Z__route-fintech-tools-interchange-iq.md` at 21/36 (58%, Acceptable) with 1 P0 and 3 P1, heuristic 9 scored n/a. It is closed now. The fixes landed in `83807a4f`. No post-fix critique snapshot was taken, so the evidence below is the post-fix computed-value sweep, where 22 of 24 checks across the four group 3 surfaces passed on the first run and all four checks on this route passed.

### What was fixed, with measured evidence

The breakeven card contradicted the table every time it showed (the P0). At 390 and 1440 in both themes it now reads "At your current card mix, Stripe IC+ costs less than Stripe flat at every ticket size, so there is no breakeven to find," followed by the volume floor and the fee disclosure, and the old "never beats" wording is gone. The debit row named the wrong regulation and showed a rate the engine does not charge. It reads "Debit (Reg II) / 35.0% / ~0.25% + $0.22" now, and "Reg E" is absent from the page. The caveats card says the IC+ totals leave out network and assessment fees. The slider readouts measured 4.44:1 on the tool rail in light mode, and they measure 4.85:1 light and 6.51:1 dark now at 13px weight 600, because they use the new `--home-signal-ink` token.

### Decisions not to re-litigate

IC+ totals leave out card network and assessment fees, and the page discloses that in the breakeven card and the caveats, so do not add a fee model (Isaac, 2026-09-14). A new `--home-signal-ink` token, #BF3B16 in light and #FF6B3B in dark, carries signal-coloured text on tool rails, so the brand accent `--home-signal` stays #C93F19 and nobody should darken the accent itself to fix rail contrast.

### False positives worth not re-deriving

The tool meta chip "·" dividers measure 2.06:1 light and 2.46:1 dark, but they are `aria-hidden` decoration and not text a reader needs. Aborted `_rsc` requests during in-page navigation on the dev server are Next.js cancelling prefetches, and they showed on other group 3 routes in the sweep. `critique-storage latest` on a `route:` target closes the snapshot it reads, so read snapshots by filename or with `trend`.

### Still open

The "Learn about card mix" info button measures 18 by 18px, under the 44px project floor. The range inputs are 6px tall, which the sweep measured and left unchanged. The 15 advisory detector findings for inline 13px, 11.5px and 10.5px font sizes in the client are still there. Entry is slider-only, with no typed value and no "what I pay today" baseline. Touch devices, a production build and a screen reader were not checked this loop.
