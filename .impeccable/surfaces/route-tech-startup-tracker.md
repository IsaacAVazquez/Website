---
version: 1
slug: "route-tech-startup-tracker"
primary_target: "route:/tech-startup-tracker"
related_targets: ["src/app/tech-startup-tracker/tech-startup-client.tsx","src/app/tech-startup-tracker/tech-startup-tracker.css","src/app/tech-startup-tracker/ValuationTreemap.tsx","src/app/tech-startup-tracker/treemap.ts","src/data/techStartupSnapshot.json"]
---

# Tech Startup Tracker surface brief

Written on 2026-10-12 by the stage 2 G6 agent (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Reference).

Scope. The `/tech-startup-tracker` route, rendered by `tech-startup-client.tsx` with its stylesheet `tech-startup-tracker.css` and the `ValuationTreemap` over the hand-curated `techStartupSnapshot.json` (unverified as of 2026-09-28).

Visitor mode. Read and compare. The visitor wants to see how concentrated private valuations are and then look up one company's round.

Genre. A Crunchbase list and a funding tracker, with Artificial Analysis's chart-then-table layout. The treemap is the comparison instrument and the table is the record.

## Decisions

The first screen is a title row (h1 in Newsreader and one sentence), then the treemap's header, holding the "Group startups by" switch and the segment switch on the left and the source column on the right, then the treemap full width. The source column prints the source, the as-of date, and the update time once (for the live snapshot, "Curated from company announcements · figures as of Sep 28, 2026 · updated" and the age), then the short status line when the figures are unverified or past their review window, then "Read the full notice", which jumps to the notice under the table. Before this, as of printed in the hero meta, in the short notice, and again near the table.

The disclosure, loading, and error semantics `DESIGN_CHECKLIST.md` points at stay. The short status line is the only live region, the full notice prints in the open under the table with the snapshot's disclaimer word for word and the directional sentence, `loading.tsx` stays, and the root error boundary covers the route.

The route paints its own paper with `--ts-*` properties on `.ts-root`, a warm ledger `#f8f6f1` with navy ink `#182132` in light and `#0f141c` in dark, and redeclares the `--c97-*` tokens the borrowed `c97-table`, `c97-chip`, and `c97-stat-label` read, including `--c97-chart-1` to `--c97-chart-6`, which the treemap tiles fill from, with a blue, green, ochre, and plum ramp in each theme. Names are Newsreader, money is Fragment Mono, and the rest is Archivo. The treemap viewBox dropped from 1000x520 to 1000x440 so the table starts higher, and a sector narrower than three letters gets no label, since one letter and an ellipsis ran 3 to 4px past the chart's edge.

Cut, and not to be restored. The poster hero and torn seam, the three readouts (startups tracked, combined valuation, unicorns), the "Snapshot leaders" rail (it repeated the segment switch), "The list" poster heading, the second "Curated figures as of" line, the icons on the open row's labels, and the EmptyPanel card, now a plain block. The route stopped reading its `PROJECT_PRESS` row.

## Pinned, and kept

`tech-startup-client.test.tsx` holds the h1, the groups "Group startups by", "Filter by segment", and "Sort startups" with every label, the region "Startup filters" ahead of the treemap, the momentum default and every sort order, the source line text "Curated research · figures as of Sep 15, 2026 · updated 2h ago" for its fixture, the expandable rows and their facts, "No startups match this filter", "No disclosed valuations in this filter.", the status texts, and the "Read the full notice" link with its target. Three tests changed on 2026-10-12. The first no longer reads the cut readouts and checks they are gone, and the stage-view and empty-segment tests read the segment switch instead of the cut rail. `e2e/project-workflows.spec.ts` (the "Group startups by" restore) holds unchanged, and the `view`, `segment`, `sort`, and `startup` parameters are unchanged.

## Verified state, 2026-10-12

Against a production build in Chromium, the contrast sweep found no failures in either theme on the default view and an open row, and the layout sweep reported 0 fail, 0 review, and 0 report once the edge label and the notice's scroll margin were fixed. The treemap starts at y523 at 1440x900 and y639 at 390x844 (y575 and y699 before), and the first table row sits at y1166 and y1007 (y1895 and y1847 before). Enter on Stage writes `view=stage`, and Space on the first name opens its row. Reduced motion resolves the switch transition to 1e-05s, and a Chromium print prints the active switches, the treemap, the table, and the notice. I did not check Safari's and Firefox's engines, a screen reader, or touch devices.
