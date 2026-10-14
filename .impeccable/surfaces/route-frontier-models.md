---
version: 1
slug: "route-frontier-models"
primary_target: "route:/frontier-models"
related_targets: ["src/app/frontier-models/frontier-models-client.tsx","src/app/frontier-models/frontier-models.css","src/app/frontier-models/components/FrontierCostContextChart.tsx","src/app/frontier-models/components/FrontierModelsTable.tsx","src/lib/frontierModelsSnapshot.ts"]
---

# Frontier Model Tracker surface brief

Written on 2026-10-12 by the stage 2 G6 agent (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Reference).

Scope. The `/frontier-models` route, rendered by `frontier-models-client.tsx` with `frontier-models.css`, the D3 `FrontierCostContextChart`, and the expandable `FrontierModelsTable`, over the curated snapshot (unverified, facts as of 2026-09-28).

Visitor mode. Compare. The visitor is weighing price against context window across providers before testing a model.

Genre. A model comparison like Artificial Analysis, printed as a spec sheet.

## Decisions

The first screen is a title row (h1, one sentence that also names the cheapest input price and the largest context window, the line in Fragment Mono with the snapshot build date and the fact check, one disclosure sentence that keeps the old meta line's words ("Curated by hand, facts as of <date>, independent review pending."), and "Jump to the spec sheet"), then the scatter chart full width with only a rule above it, then the filter toolbar, then the spec sheet. The long meta line became the snapshot line and the disclosure sentence. Provider stays in the open, and Modality and Price tier stay one action away in a `details` that opens whenever either is set. While either is set the block cannot be closed, so "Fewer filters" does nothing until the filter is cleared. The click on the summary is cancelled, because React would not reopen a `details` the browser had just closed while its `open` prop stayed true. The 45-day review warning prints once, word for word, between the sheet's heading and the table it qualifies.

The route paints its own paper with `--frm-*` properties on `.frm-root`, a white `#fcfcfb` with near-black ink and an orange focus colour in light and `#141416` in dark, and redeclares the `--c97-*` tokens the table, the chips, and the chart's axes read. The dark palette sits inside `@media screen`, so paper takes the light palette in both themes. In the dark theme the ink was `#ededee` on paper, which is 1.17:1 on white once backgrounds are off. Every class and custom property the route's sheet defines for the page starts with `frm-`, and so does the sheet heading's id. The spec table keeps its `c97-frontier-spec` class, and the `frontier-spec-sheet` and `frontier-row-detail-*` ids are unchanged. The prefix was `fm-` until 2026-10-12, which Food Map also uses, and since a route's stylesheet stays loaded through later in-app navigation, seven shared class names let each page restyle the other. `src/app/__tests__/route-stylesheets.test.ts` now fails on a class two route folders share. The chart's axes, axis titles, grid, and dot edges take `--c97-ink-2` and `--c97-rule` as a style on each mark (`var()` inside `.style()`), so they follow the route's palette and a theme change with no redraw. Before that the chart resolved the two tokens with `getComputedStyle` in an effect that ran before the theme class moved on `<html>`, so a manual theme toggle kept the old theme's ink until the next redraw. Provider colours stay data, each dot with an ink edge. Archivo throughout, no added typeface.

Cut, and not to be restored. The pink hero sheet and the poster h1, the "Models tracked" readout (the toolbar's "N of N models shown" carries the count), the other two readouts as tiles (now a sentence), the paper plate and offset around the chart, the torn seam, the poster "The spec sheet" heading (now a plain h2), and the EmptyPanel card, now a plain block. The route stopped reading its `PROJECT_PRESS` row.

## Pinned, and kept

`frontier-models-client.test.tsx` covers the h1, the chart and the table, the Provider group outside the `details` and Modality and Price tier inside it, "Jump to the spec sheet" pointing at the element that holds the table, and the fact-check sentence, and it now also holds that the summary's click is cancelled while a modality or price tier is set and goes through while neither is. The chart suite now holds the token styles on a dot edge, a tick label, and a grid line. `metadata.test.ts` holds the page's modified date to the day the sitemap gives the route. `frontier-models-css.test.ts` holds that the dark palette is declared for the screen only. The table, state, and readouts suites hold unchanged. `e2e/project-workflows.spec.ts` (the Provider restore) holds unchanged, and the `provider`, `modality`, `tier`, and `model` parameters are unchanged.

## Verified state, 2026-10-12

Against a production build in Chromium, the contrast sweep found no failures in either theme on the default view and a filtered view with an open row, and the layout sweep reported 0 fail, 0 review, and 0 report once the sheet's scroll margin came off. The chart starts at y447 at 1440x900 and y608 at 390x844 (y931 and y962 before), the first filter at y875 and y1092 (y1737 before at 1440), and the first spec row at y1169 and y1612 (y2032 and y2159 before). Enter on the Anthropic filter writes `provider=anthropic`, and Enter on More filters opens it. Under reduced motion the switch transition resolves to 1e-05s, and a Chromium print prints the chart, the active filters, the warning, and the sheet across three sheets. I did not check Safari's and Firefox's engines, a screen reader, or touch devices.

The `frm-` rename, the chart's token styles, the held-open filter block, and a print rule that prints the pressed filter as ink text in its outline (its fill does not print with backgrounds off) came after that check, and so did the screen-only dark palette. The Jest suites cover the first three and the palette's scope. A browser pass on a production build measured the dark theme's print before the palette was scoped, and I have not seen the scoped palette in a browser or on paper.
