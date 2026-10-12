---
version: 1
slug: "route-food-map"
primary_target: "route:/food-map"
related_targets: ["src/app/food-map/food-map-client.tsx","src/app/food-map/food-map.css","src/app/food-map/food-map-leaflet.tsx","src/app/food-map/food-map-state.ts","src/app/food-map/food-map-data.ts"]
---

# Food Map surface brief

Written on 2026-10-12 by the stage 2 project sovereign pass (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Log and guide, group G7).

Scope. The `/food-map` route, rendered by `src/app/food-map/food-map-client.tsx` with `food-map.css` and the Leaflet map in `food-map-leaflet.tsx`. The state (city, curators, cuisines, pick) lives in the URL through `food-map-state.ts`, and the places are the curated list in `food-map-data.ts`, reviewed as of `FOOD_MAP_AS_OF`. Nothing is stored in the browser. Leaflet's assets load from unpkg, which is why `src/proxy.ts` allows that host site-wide (a client-side navigation keeps the CSP of the document the visitor landed on).

Visitor mode. Browse and choose. The visitor picks a city, narrows by who is vouching for a place or by cuisine, and opens a stop for what to order.

Genre. A field guide and a city eats map, with the Eater city maps and the Infatuation's guides as the references. The map is the first screen, full width.

## Decisions

Colour stays on the Catalog 97 paper tokens, which suit a field guide, and the route reads them from its own `data-c97-surface="paper"` on the root section. `food-map-css.test.ts` still bans hex and rgb literals, `--fm-*` declarations, radii other than 0 and 50%, and blurred shadows, so this pass did not change that test. The curator colours stay the chart ramp, passed inline as `--fm-accent` and painted only on dots, the ticket's left edge, the pressed stamp's underline, and the detail's top rule. Headings take Newsreader explicitly (the frame's base layer gives headings the body face), place names stay Newsreader, counts and the status line are Fragment Mono, and the rest is Archivo.

The masthead is a title row, the h1, one sentence, and the passport stamp as a 96px mark at the row's end (hidden on phones).

The city tabs are one sticky bar (`top: 0`, z-index 2) between two rules, painted in the paper's own grain so it reads as the page while it rides over the map. On phones and laptops the ten cities scroll sideways inside the bar, and from 1200px they wrap. The map's wrapper sets `isolation: isolate`, so Leaflet's pane z-indexes (400 and up) stay inside the map and the bar passes over it.

The status line ("Showing N of M in City · Reviewed DATE · I would still verify hours before going.") prints once, under the city bar, as the source and as-of line.

The curator stamps, the cuisine pills, and Reset sit on the map's top edge as one chip strip, and the map runs full width under it with no panel or border around it. The chips stay out of the map itself because Leaflet's zoom control and the pins own that space.

Under the map, the stops are ticket stubs in two columns (the stub is the object, a hairline with the first curator's colour on its left edge, the cuisine, the name, the neighbourhood, and the price) beside a sticky rail. The rail holds the three curator cards as ruled entries under an h2, "The curators", or, once a stop is chosen, its detail as one ruled column (cuisine, name, locale, Order, Recommended by, why, and Open in Google Maps).

## Cut, and not to be restored

The vermilion hero sheet and poster h1, the 148px rotated stamp as a masthead feature, the "Choose a city" jump link (the city bar is now at the top), the three readouts (curated stops, in city, cities mapped, each repeating the city tabs' counts or the status line), the word ticker (it repeated the city list), the torn seam, the panel around the map, the panel around the filters with its Filters kicker, the map's curator legend (the curator stamps carry the same dots and names), the box around each curator card, the tinted panel and offset shadow on the stop detail, and the rail's foot line (it repeated the lede).

## Pinned, and kept

`src/app/food-map/__tests__/food-map-client.test.tsx` holds unchanged, covering the h1, "Showing 12 of 12 in Austin", "Reviewed 2026-04-28", "Pins are colored by who recommends them.", the "Choose a city" radiogroup ahead of the map with roving tabindex and wrapping arrow keys, the URL writes for city, curator, and pick, the canonical rewrite, focus to the stop's h2 on select and back to "The stops" on Clear pick, "Go to the list of stops", and "Nothing matches that combination yet.". `page.test.tsx` (one h1, no nested main) and `food-map-css.test.ts` hold unchanged. `e2e/all-projects.spec.ts` (the last city radio, `.fm-ticket`, `.fm-ticket-name`, the level 2 heading after a reload) holds, as do `data-testid="food-map-shell"`, the "Food Map" region, the "Food map side panel" aside, `#food-map-city`, the OpenStreetMap tiles through `.c97-basemap`, and the pin markup.

## Verified state, 2026-10-12

Filled in after the production pass, below.
