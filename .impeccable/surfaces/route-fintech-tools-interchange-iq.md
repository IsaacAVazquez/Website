---
version: 1
slug: "route-fintech-tools-interchange-iq"
primary_target: "route:/fintech-tools/interchange-iq"
related_targets: ["src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx","src/lib/interchangeIq.ts"]
---

Updated on 2026-09-28 by the responsive pass. The rates note at the foot of the page sets left like the rest of the page, since centred text inside a left-anchored 54ch box sat off the page's centre, and the view nav's margin reset that swallowed its stack's gap is gone.

# Interchange IQ surface brief

Scope. The `/fintech-tools/interchange-iq` route, rendered by `src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx` over the pricing engine in `src/lib/interchangeIq.ts`.

Visitor mode. Operate. The visitor is working through their own numbers, so scanability and correct math come before expression.

Audience. Someone comparing flat-rate card processing against interchange plus (IC+) pricing for their own monthly volume, ticket size and card mix, who will read the caveats and check whether the totals hold up.

Visual world. Since 2026-10-12 the route owns its design inside the site frame (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Calculator), so judge it against the "Project routes" section of `DESIGN_CHECKLIST.md` and the redesign section at the end of this brief, not against Catalog 97. The header, the footer, and the build-note strip are still the shell's. The 2026-09-14 loop below predates the redesign, so its colours, token names, and contrast figures are history.

## Loop, 2026-09-14

The pre-fix snapshot is `2026-09-14T21-34-08Z__route-fintech-tools-interchange-iq.md` at 21/36 (58%, Acceptable) with 1 P0 and 3 P1, heuristic 9 scored n/a. It is closed now. The fixes landed in `83807a4f`. No post-fix critique snapshot was taken, so the evidence below is the post-fix computed-value sweep, where 22 of 24 checks across the four group 3 surfaces passed on the first run and all four checks on this route passed.

### What was fixed, with measured evidence

The breakeven card contradicted the table every time it showed (the P0). At 390 and 1440 in both themes it now reads "At your current card mix, Stripe IC+ costs less than Stripe flat at every ticket size, so there is no breakeven to find," followed by the volume floor and the fee disclosure, and the old "never beats" wording is gone. The debit row named the wrong regulation and showed a rate the engine does not charge. It reads "Debit (Reg II) / 35.0% / ~0.25% + $0.22" now, and "Reg E" is absent from the page. The caveats card says the IC+ totals leave out network and assessment fees. The slider readouts measured 4.44:1 on the tool rail in light mode, and they measure 4.85:1 light and 6.51:1 dark now at 13px weight 600, because they use the new `--home-signal-ink` token.

### Decisions not to re-litigate

IC+ totals leave out card network and assessment fees, and the page discloses that in the breakeven card and the caveats, so do not add a fee model (Isaac, 2026-09-14). A new `--home-signal-ink` token, #BF3B16 in light and #FF6B3B in dark, carries signal-coloured text on tool rails, so the brand accent `--home-signal` stays #C93F19 and nobody should darken the accent itself to fix rail contrast. (Stale as of 2026-10-12. Both tokens were deleted in the 2026-09-27 close-out, and the route's colours are the `--iq-*` properties in `interchange-iq.css`.)

### False positives worth not re-deriving

The tool meta chip "·" dividers measure 2.06:1 light and 2.46:1 dark, but they are `aria-hidden` decoration and not text a reader needs. Aborted `_rsc` requests during in-page navigation on the dev server are Next.js cancelling prefetches, and they showed on other group 3 routes in the sweep. `critique-storage latest` on a `route:` target closes the snapshot it reads, so read snapshots by filename or with `trend`.

### Still open

The "Learn about card mix" info button measures 18 by 18px, under the 44px project floor. The range inputs are 6px tall, which the sweep measured and left unchanged. The 15 advisory detector findings for inline 13px, 11.5px and 10.5px font sizes in the client are still there. Entry is slider-only, with no typed value and no "what I pay today" baseline. Touch devices, a production build and a screen reader were not checked this loop.

## Redesign, 2026-10-12

The route left Catalog 97's print shop layout in stage 2 of the project-sovereign work (branch `design/g4-fintech-calculators`). Its genre is a processor pricing calculator, with Stripe's pricing calculator and a merchant statement as the references.

### Decisions

The page is a title row (the h1 and one sentence), the calculator, and a short primer at the end. At 960px and wider the four slider and number pairs sit in a 22rem input column headed "Your business" with Reset beside the heading, and the card mix (the three card types with their shares and rates, and the "Learn about card mix" help) sits under the two card-mix sliders, since it is the reading of those two inputs. The info button is now 44 by 44px and each range has a 44px row. On the right the verdict prints first ("Stripe IC+ and Checkout.com tie" at the defaults), with one sentence giving the cheapest monthly fee and what it saves against the priciest processor a month and a year, then the "Monthly fee breakdown" statement, then the Stripe flat versus IC+ breakeven track and its sentence. Under 960px and on paper it is one column with the verdict first, the inputs next, and the statement after them; the DOM keeps the inputs first, and the wrapper around the verdict and statement turns into `display: contents` there.

The statement is the merged breakdown. Every processor is one row on a shared scale with its model tag, its bar, its monthly fee in Fragment Mono, and a "Cheapest" mark on every processor tied for cheapest, and each row is a native disclosure that opens to its per-transaction average, its effective rate, and its pricing note. The meta line "7 options · N transactions a month · sorted cheapest first" prints once above the rows. The primer is three short paragraphs (interchange, flat rate against interchange plus, and the caveats, word for word) and the educational note, word for word, once.

Colour is the route's own `--iq-*` properties on `.iq`, a cool white page with a slate ink, one blue for inputs and focus, a green for cheapest, and an amber for the breakeven marker, with a dark story under `.dark .iq`. The root redeclares `--c97-ink`, `--c97-ink-2`, `--c97-surface`, `--c97-rule`, `--c97-field`, and `--c97-accent`. No added typeface, Archivo with tabular numerals and Fragment Mono for the statement's fees.

### Cut, and not to be restored

The poster hero and standfirst, both plates, the readout trio (the cheapest fee is the statement's top row, the savings moved into the verdict, and each effective rate is in its row), the in-page nav with three links to one anchor and the Flat-rate and Interchange-plus view filter behind it, the separate "Monthly fee breakdown" band, the separate breakeven band, the three bordered primer cards, the role="img" fee statement signature, and the seams.

### Pinned, and kept

`data-testid="interchange-iq-shell"` (now the route root), the h1, "Monthly volume" as the range's label with `aria-valuenow`, the exact-field labels and the out-of-range message, Reset with `aria-label="Reset all inputs to defaults"`, "Learn about card mix" and its help text, "Monthly fee breakdown", the meta line, the two "Cheapest" marks, the verdict text, the no-breakeven sentence settled on 2026-09-14, and the IC+ disclosure and educational note word for word. The route test changed in three places. The view-switch test lost its nav click and is now "expands card-mix help and resets inputs", because the nav and its filter were cut. The order test reads `.iq-verdict` and `.iq-statement` instead of `.c97-stat-value` and `.c97-iq-statement`. And the default render now also checks seven statement rows, each with an effective rate.

### Verified state, 2026-10-12

The route suites pass with the shared suites. `tsc --noEmit` and eslint on the changed files are clean. In Chromium, the fintech test in `e2e/product-surfaces.spec.ts` and the route's `all-projects` and `project-routes` tests pass against the dev server and a production build. `contrastSweep.mjs` reports no failures in either theme and `layoutSweep.mjs` reports 0 fail; its orphan-row reviews are the two cheapest rows, whose bar takes its own line under 640px on purpose. On the production build at 1440x900 the first input sits at y415 against y683 before and the verdict at y329, with the whole statement on the first screen; at 390x844 the verdict is at y425 and the first input at y670 against y761. A keyboard walk from the top reaches Reset, each range and its exact field, "Learn about card mix", and the statement rows; ArrowRight moves the volume by $1,000, and Enter and Space open and close a statement row. Under reduced motion the chevron transition collapses. A Chromium print keeps the inputs' exact values, the statement, and both notes.

Not checked: WebKit and Gecko prints, a screen reader, touch devices. Still open from 2026-09-14 is a "what I pay today" baseline.

### Corrected after the merge, 2026-10-12

The title sentence says six card processors, since the engine prices seven options from six companies and Stripe is two of them, flat rate and IC+. The meta line keeps "7 options", which counts the rows.

Every statement row opens for a print. A closed disclosure prints its summary only, so the paper carried seven fees with no per-transaction cost or effective rate, both of which printed on every row before the redesign. The client listens for `beforeprint`, opens the closed rows, and closes the ones it opened on `afterprint`, so a row the visitor opened stays open. It is the same effect Rent vs. Buy uses for its input groups.

The caption under the breakeven track prints the breakeven to the cent, as the sentence above it does. It used to round to a whole dollar, and a breakeven only exists up to 16% credit and never passes $0.83, so the caption read "$0" or "$1" under a sentence that said "$0.35".

Under 640px the Cheapest mark takes a line of its own under the bar, and the first line is the name, the fee, and the chevron. The mark only has width on the cheapest rows, so on the fee's line it set those fees about 83px left of the rest and left "Checkout.com" about 66px at 320px, which ran it into the fee. The name has about 161px there now. Those widths are computed from the CSS and were not measured in a browser. An empty mark is `display: none` under 640px, so the other rows get no third line.

The route has three suites now, with `interchange-iq-css.test.ts` holding the phone rules, and the client test covers the title count, the caption, and the print rows. None of this was run in a browser or printed, so the statement at 320px and a real print still need a look.
