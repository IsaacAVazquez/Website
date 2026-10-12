---
version: 1
slug: "route-ai-dev-tools"
primary_target: "route:/ai-dev-tools"
related_targets: ["src/app/ai-dev-tools/ai-dev-tools-client.tsx","src/app/ai-dev-tools/ai-dev-tools.css","src/app/ai-dev-tools/SurfaceMap.tsx","src/app/ai-dev-tools/ai-dev-tools-data.ts","src/app/ai-dev-tools/ai-dev-tools-state.ts"]
---

# AI Dev Tool Ecosystem surface brief

Written on 2026-10-12 by the stage 2 G6 agent (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Reference).

Scope. The `/ai-dev-tools` route, rendered by `ai-dev-tools-client.tsx` with its stylesheet `ai-dev-tools.css` and `SurfaceMap.tsx`, over the hand-kept list in `ai-dev-tools-data.ts` (`AI_DEV_TOOLS_VERIFIED` is false).

Visitor mode. Search and compare. The visitor is narrowing a choice of coding assistant or agent by price, model access, source, and release pace.

Genre. A tool directory, like a package registry's search results, with G2's category grid as the second view.

## Decisions

The directory is the page. The first screen is a title row (h1 and one sentence), the toolbar with search, the Category, Pricing, Models, and Source selects, and Reset, then a line with "N of N tools shown", the one curated-as-of disclosure, kept word for word from the old meta line ("Curated by hand · figures as of <date> · not yet independently verified, so directional"), the Sort select, and the List and Map switch, then the rows. Each tool is one ruled row that is a button, with the name and a lifecycle word (Active, In transition, Enterprise) beside it, the category and company under it, then pricing, models, release cadence with the date and a freshness dot, and GitHub stars with a small bar. From 900px the facts line up under one header row and the per-cell labels stay for screen readers only; under 640px each fact carries its label.

The category by pricing map is the directory's Map view, held in component state, and it maps the filtered tools, so the filters and the count apply to both views. Only one layout mounts, chosen by a `matchMedia("(min-width: 960px)")` read through `useSyncExternalStore` (the grid from 960px, the stacked list under that), so each tool has one plate in the DOM. The server and hydration read false, which is safe because the Map view only renders after a click. The drawer is the one box on the page, a sheet from the bottom on a phone and a rail on the right from 640px, with the details as a ruled definition list.

The route paints its own paper with `--adt-*` properties on `.adt-root`, a cool white `#f7f8fa` with near-black ink and a violet accent `#5b3fd1` in light and `#121318` with `#a996ff` in dark, and redeclares the `--c97-*` tokens the map reads. Archivo throughout, Fragment Mono for star counts and dates, no added typeface.

Cut, and not to be restored. The hero sheet and torn seam, the three readouts (tools tracked, open source, most recent release, which restated the count line, the Source filter, and the Recently shipped sort), the long meta line, "Jump to the directory", the map as the hero's signature with its paper plate and offset, "The directory" poster heading, the bordered row cards and their icon boxes, the bordered detail boxes and icon tile in the drawer, and the EmptyPanel card, now a plain block. The route stopped reading its `PROJECT_PRESS` row.

## Pinned, and kept

`ai-dev-tools-client.test.tsx` holds the h1, "tools shown", the labelled selects, "Search tools" with its 250ms URL pause and every reseed rule, Reset, the history replace for filters and push for the drawer, and the drawer named "Cursor detail" with its h2, "Sources", Close, Escape, and focus. Two tests changed on 2026-10-12. The phone-map ordering test became a test that the list opens first and the Map switch shows the grid table, and the drawer test opens from the row and then, after switching to Map, from a plate. `e2e/all-projects.spec.ts` ("Search tools", "No tools match those filters", "Reset") holds unchanged, as do the `category`, `pricing`, `model`, `source`, `q`, and `tool` parameters. The drawer backdrop reads `var(--c97-scrim)`.

## Verified state, 2026-10-12

Against a production build in Chromium, the contrast sweep found no failures in either theme on the list and an open drawer, and `measurePage` found none on the Map view at 1440 and 390 in both themes. The layout sweep reported 0 fail, 0 review, and 0 report after the inputs, selects, and view switch were brought to a full 44px. The search field sits at y334 at 1440x900 and y395 at 390x844 (y2051 and y1078 before), and the first row at y564 and y822 (y2219 and y1451 before). The keyboard walk from the page top reaches search at the 12th stop, right after the header, Enter on the Cursor row opens the drawer with focus on the dialog, Escape returns focus to the row, and Space on Map shows the grid. Under reduced motion the row transition and the drawer's entrance resolve to 1e-05s. I did not check Safari's and Firefox's engines, a screen reader, or touch devices.
