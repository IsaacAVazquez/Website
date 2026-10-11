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

Visual world. Since 2026-10-11 the route owns its design inside the site frame (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Calculator), so judge it against the "Project routes" section of `DESIGN_CHECKLIST.md` and the redesign section at the end of this brief, not against Catalog 97's print shop rules. The header, the footer, and the build-note strip are still the shell's. The 2026-09-14 loop below predates both the close-out and the redesign, so its colours and contrast figures are history.

## Loop, 2026-09-14

The pre-fix snapshot is `2026-09-14T21-35-55Z__route-fintech-tools-rent-vs-buy.md` at 23/40 (57.5%, Acceptable) with 0 P0 and 5 P1, all ten heuristics scored. It is closed now. The fixes landed in `83807a4f`, and a plural chart label followed in `972f3ac2`. No post-fix critique snapshot was taken, so the evidence below is the post-fix computed-value sweep, where 22 of 24 checks across the four group 3 surfaces passed on the first run and all eight checks on this route passed.

### What was fixed, with measured evidence

Clearing Home price used to snap it to $10,000 on each keystroke. Typing 7, 5, 0, 0, 0, 0 into the emptied field now reads 7, 75, 750, 7500, 75000 and 750000, and 750000 is what gets stored after Tab. The filing status select is gone. The marginal tax rate is disabled while itemizing is unchecked and enabled when it is checked. The line "Educational only, not financial or tax advice." renders outside the details panel and is visible at 390 and 1440 at 5.2:1 in light mode. The assumptions now say investment growth on both sides is untaxed and no longer print a standard deduction or exclusion figure.

Break-even used to stay set after the buyer fell behind again. With appreciation 6%, rent $2,400, 20 years and a 10% return, the page reads "Renting comes out ahead" and "Buying is not ahead at the end of 20 years," the chart label matches, and no dashed break-even line draws. Other seeds read "after about 11 years and 2 months" and "after about 1 year and 2 months," and the defaults read "Buying is not ahead at the end of 7 years." The renting verdict and the renter net worth figure measured 4.44:1 on the rail and measure 4.85:1 light and 6.51:1 dark now through `--home-signal-ink`.

The sweep caught the chart's `aria-label` reading "Net worth over 1 years." at a one-year horizon. `972f3ac2` routes it through the `plural` helper. A live check on 2026-09-14 at a one-year horizon read "Net worth over 1 year. Buying is not ahead at the end of 1 year."

### Decisions not to re-litigate

These were settled by Isaac on 2026-09-14. The tool does not model the standard deduction. Filing status was removed because the engine never used it. The marginal rate only applies when itemizing. Investment growth is untaxed on both sides by design, and the assumptions say so. Those four stand. Separately, `--home-signal-ink` (#BF3B16 light, #FF6B3B dark) carries signal-coloured text on tool rails so the brand accent `--home-signal` stays #C93F19. (Stale as of 2026-10-11. Both tokens were deleted in the 2026-09-27 close-out and the route no longer has signal-coloured text; its colours are the `--rvb-*` properties in `rent-vs-buy.css`.)

### False positives worth not re-deriving

The tool meta chip "·" dividers measure 2.06:1 light and 2.46:1 dark, but they are `aria-hidden` decoration. Aborted `_rsc` requests during in-page navigation on the dev server are prefetch cancellations and not failures. `critique-storage latest` on a `route:` target closes the snapshot it reads, so read snapshots by filename or with `trend`.

### Still open

The assumptions still print "SALT cap $40,000," and the dated 2026-07 figures in `defaults.ts` were not checked against IRS numbers in this loop. The "close to a wash" band of the larger of $5,000 or 2% of price, no PMI below 20% down, and the missing validation messages behind silent clamps were not addressed. Reset still wipes the saved scenario with no confirm or undo. The assumptions summary control is 19.2px tall. Touch devices, a production build and a screen reader were not checked this loop.

## Redesign, 2026-10-11

The route left Catalog 97's print shop layout in the project-sovereign pilot (branch `design/rent-vs-buy-redesign`). Its genre is the NYT rent-or-buy calculator, with a one-page financial model as the second reference.

### Decisions

The page is a title row (the h1 in Newsreader, one orienting sentence, and the "Assumptions and limits" link) and then the calculator. At 960px and wider the inputs sit in a 23rem column on the left and the result on the right, sticky at the top of the screen. Below 960px and on paper it is one column with the result first, the inputs next, and the fine print last. The DOM keeps the five headline inputs, then the result, then the other inputs, because the route test pins that order. The phone order is CSS `order`, and the wrapper holding the result and the fine print turns into `display: contents` below 960px so the fine print can follow the inputs there without printing twice.

The five headline inputs are large ruled rows. The other thirteen sit under three native disclosures ("The home you'd buy", "The rent you'd pay", "Returns and taxes"), closed by default. A `beforeprint` listener opens them so a print carries every input. "Itemize deductions" now comes before "Marginal tax rate", since the checkbox is what enables the rate.

Inputs are typed in blue and outputs in black, the financial-model convention, and each input is a tinted cell with no border, its ring drawn around the whole cell. The result is the verdict sentence in Newsreader with the break-even and the lead at the horizon under it, the net-worth chart unframed, and a buyer versus renter table (cash at the start, monthly cost in year 1, mortgage payment, net worth at the horizon) closing on a totals row with a rule above and a double rule below. The table's column heads carry the two line swatches, which replaced the separate legend. The fine print is one paragraph under the table, word for word, printed once.

Cut were the poster hero and long standfirst, the three readouts (the verdict and the table say the same things), both plates, the torn and deckle seams, the "The rest of the model" band with its Anton h2s and icons, the "What the numbers say" band, the chart legend, and the second "Educational only" line under the chart.

Colour is the route's own, as `--rvb-*` custom properties on `.rvb` with a light story (warm near-white paper, near-black ink, input blue #1743c2, buyer green #0b6b50, renter orange #b5520c) and a dark one under `.dark .rvb`. The root redeclares `--c97-ink`, `--c97-ink-2`, `--c97-surface`, `--c97-rule`, and sets `--c97-accent` to input blue for the frame's focus ring. No added typeface; Newsreader for the h1 and verdict, the body face with tabular numerals everywhere else. Fragment Mono and Anton left the page.

The chart now measures its container with a `ResizeObserver` and draws at that pixel width with one 13px type size, which removed the duplicated narrow and wide labels. Its colours come from route CSS classes reading the `--rvb-*` properties, not from `getComputedStyle`, since a stylesheet `stroke` on an SVG element resolves in every engine and follows a theme change on its own. End labels draw only when the chart is at least 480px wide; under that the table heads name the lines.

### Pinned, and kept

The h1 "Rent vs. Buy Calculator". The five headline inputs before the `role="status"` verdict in DOM order, and the verdict before "Loan term" (`rent-vs-buy-client.test.tsx:59-65`). The "Assumptions and limits" link to `#assumptions-and-limits`, whose paragraph holds "Educational only, not financial or tax advice.", the tax-year sentence, and the Freddie Mac sentence (lines 67 to 72). "Home price" and the exact "Reset" button (`e2e/project-workflows.spec.ts:75-85`). The verdict titles as their own text nodes. The storage note and the memory-only status. No opacity on the h1's ancestors (`ssr-first-paint.test.tsx`). `c97-shell c97-frame` on the page column, so the h1 sits on the header's edge. No pinned assertion changed.

### Verified state, 2026-10-11

Route, engine, and first-paint Jest suites pass (4 suites, 43 tests), as do the closeout and constants suites (6 suites, 64 tests); `tsc --noEmit` and eslint on the route are clean. In Chromium against the dev server, the rent-vs-buy workflow test, the two all-projects tests that match the route, and the three project-routes tests pass. Against a production build, `contrastSweep.mjs` reports no failures in either theme and `layoutSweep.mjs` reports 0 fail with 24 review items (scroll margin and sticky offset are informational since the header does not stick, and the "2+1 orphan row" is the intended inputs and result grid) and 4 report items (the 20px itemize checkbox, whose whole 52px row is its label). At 1440x900 the first input sits at y346 and the verdict at y291, and the totals row is on the first screen. At 390x844 the verdict sits at y471 and the first input at y1190, inside the 1266px budget. A keyboard walk from the top reaches the link, Reset, the five inputs, and the first disclosure, which opens on Enter and hands focus to "Loan term". Inputs survive a reload. With reduced motion the chevron transition collapses to 0.01ms. A Chromium print carries every input and the full disclaimer.

Not checked: WebKit and Gecko prints, a screen reader, touch devices.
