---
version: 1
slug: "route-polling-aggregator"
primary_target: "route:/polling-aggregator"
related_targets: ["src/app/polling-aggregator/polling-aggregator-client.tsx","src/app/polling-aggregator/polling-aggregator.css","src/app/polling-aggregator/polling-aggregator-state.ts"]
---

# Polling Aggregator surface brief

Written on 2026-10-12 by the project sovereign stage 2 (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Board, group G5).

## What the page is

A polling tracker, borrowing conventions from FiveThirtyEight's approval tracker, RealClearPolling's averages tables, and the race pages the newspapers run, and none of their branding. The first screen is a title row (the h1 in Newsreader, one sentence), then the national strip between two rules, where the approval trend chart takes the wide column and the two averages (approval net, generic ballot margin) with the ballot bar sit beside it from 1024px and under it on a phone. One source line closes the strip, holding the VoteHub attribution with its link, the CC BY 4.0 note, both series' newest poll dates, the polls-tracked count, the days to the Nov 3 midterms, and the server-written stale sentence when a series is more than 14 days old. The board follows, a sticky view switch (Senate, Governors, Approval) over the margin-sorted race table with the selected race beside it as a ruled column, or over the two poll tables on the Approval view.

## Decisions

The hero sheet, its three readouts, the chart's paper plate, "The numbers" band, the bordered source box, the Overview view, and the Approval view's kicker and headline pair are cut. Overview is gone, so the default view is Senate, then Governors, then Approval when a race list is empty, and `?view=overview` falls back to the default. A view named in the URL is honoured and says so when it has no polls. Days to the election lives in the source line, not as a figure. The note on how a race row is averaged, and why the rows carry no party colour, sits under the race table, since it qualifies those rows.

The spec's brief asked for an "illustrative sample data" line in the chart caption. The page has carried only VoteHub's live feed since before the brief was written, so the caption is the VoteHub attribution instead.

The route has its own palette as `--pa-*` custom properties on `.pa-root`, a cool newsprint white (#f7f6f2) with graphite ink in light and a blue-black (#131518) in dark. The focus, active tab, and selected-row colour is the graphite ink, so nothing reads as D or R. Party colours stay data and come from the `--c97-party-*-mark` tokens through `DEM_COLOR` and `REP_COLOR`. No typeface was added; Newsreader is the h1 and the race title only. `getRowStyle` was deleted with its test, since nothing reads it.

## Pinned, and kept

The h1 "Polling Aggregator"; the `view` and `race` parameters; the "Senate races" h3 and the "Senate race averages" table name (`e2e/product-surfaces.spec.ts`); the "Show the X Senate race" buttons with `aria-pressed`; the race status announcement; the VoteHub link to `https://votehub.com/polls/api/`; the stale sentence inside the `role="note"` source line; "Average of the N polls from ... that asked about both names."; "for <sponsor>"; the "<name> <n>%" answers; the no-poll sentences.

The client test changed in five places, all with the cut readouts and Overview. The e2e polling case no longer asserts `view=senate` stays in the URL, since Senate is now the default and the page canonicalises it away, and asserts the pressed Senate tab instead.

## Verified state on 2026-10-12

Against a production build, `scripts/contrastSweep.mjs` found no failures in either theme and `scripts/layoutSweep.mjs` reported 0 fail. Its only reviews were the race column's sticky offset (60px, under the sticky toolbar, on purpose). The trend chart sits at y314 and the first race row at y756 at 1440x900 (before y850 and y1755), and at y372 and y922 at 390x844 (before y972 and y1605). A keyboard walk reaches the VoteHub link at the 12th stop and the view switch at the 13th, and Enter on Governors pushes `?view=governors`. Under reduced motion nothing animates. A Chromium print is in the G5 scratchpad.
