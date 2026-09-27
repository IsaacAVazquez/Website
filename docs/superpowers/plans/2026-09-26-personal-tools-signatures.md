# Personal tools signatures implementation plan

**Goal:** Ship PR 2 of `docs/superpowers/specs/2026-09-25-project-specific-ui-design.md`, the six personal tools rebuilt around their signatures and moved onto the Catalog 97 tokens, on branch `design/personal-tools-signatures`, stacked on `design/data-dashboard-signatures` (PR #471).

**Architecture:** The same shape as PR 1. Each route reads its inks from `PROJECT_PRESS`, opens on `Catalog97ProjectHero`, and passes its signature in as the child. Signature geometry and formatting live in a pure, unit-tested helper beside the route, and the component only draws what the helper returns. Each route keeps its own CSS in a route-local stylesheet, so the six tasks touch no shared file except the ones named below.

**Global Constraints:** Everything under "Global Constraints" in `docs/superpowers/plans/2026-09-25-project-ui-foundation-and-data-dashboards.md` applies. On top of it, the browser-persisted tools keep their localStorage keys, hooks, and hook tests unchanged, and every empty first-visit state gets its own designed placeholder.

## Task 0: Shared groundwork (done before the routes)

The panel fix comes first. `.c97-panel` painted `--c97-field`, which is pale on ink-blue, ink-teal, espresso, and chocolate in light mode, so a panel there printed light text on a light box at 1.16:1. A new `--c97-panel` token is declared on every surface in both themes, as the field tint on the dark-ink sheets and a darker tint of the sheet on the four light-ink ones, and `catalog97-inks.test.ts` holds ink, ink-2, and label at 4.5:1 on it for all 24 surface and theme pairs. The Food Map tile fix from PR #467 is cherry-picked so the two branches don't conflict, and the six PR 2 rows join `src/constants/projectPress.ts`.

## Task 1: Wine Cellar (vermilion, blue)

Helper `src/app/wine-cellar/wineRack.ts`, tested in `__tests__/wineRack.test.ts`. `wineRack(entries)` groups bottles by region (most bottles first, then name), one slot per entry carrying its type, and returns an empty rack for no entries. `WINE_TYPE_MARK` maps each of the seven types onto the six `--c97-chart-*` steps, with the seventh told apart by a hollow mark so no two types look the same. The signature is the rack, a lattice of bottle ends on a paper plate in the hero, and on first visit it shows one marked empty slot that reads "Log your first bottle". Each tasting in the log prints as a bottle label (producer, name, and vintage in Newsreader, then region, varietal, and rating). The form rail becomes "Log a bottle", and the recent five-stars list, the type breakdown bars, and the half-star stepper stay.

## Task 2: Museum Log (pink, blue)

Helpers join `src/app/museum-log/museum-log-helpers.ts` and its test. `admissionStub(museum, today)` returns the stub's lines (admission, founded, curator rating, and whether an exhibit is on now), and `visitStamp(iso)` returns the stamped date parts. The signature is the perforated admission stub, which replaces `MuseumCoverArt`. The Journal becomes a stamped visit record with the rating and note, and Lists read as exhibition catalogues. The exhibit badge, the logging behaviour, the unverified disclosure, and the `e2e/persisted-tools.spec.ts` flow stay.

## Task 3: Recipe Finder (saffron, vermilion)

Helper `src/app/recipe-finder/indexCard.ts`, tested beside it. `indexCardLines(recipe, pantry)` returns each ingredient with a tick when the pantry has it or it is a staple, using the existing matcher in `src/lib/recipes.ts`, so the match reads as ticks on the card. The signature is a ruled index card per recipe with cuisine and meal in the header and time and servings in the corner. The pantry rail becomes a shelf of labelled tags. The matcher, the staples exemption, the quick adds, and the `recipe-finder:pantry:v1` key stay.

## Task 4: Travel Planner (teal, saffron)

Helper `src/app/travel/itinerary.ts`, tested beside it. `itineraryColumns(buckets, conflictIds)` places each timed stop in its day column by time, keeps untimed stops in their own row, and flags overlaps, and `boardingPass(trip, today)` returns the destination, the date range, the days until or elapsed, and stops done. The signature is the boarding pass header over the itinerary timeline. The admin sidebar goes, trip switching moves into the header, journal entries become postcards carrying their mood, and the empty state is a blank boarding pass with "Start a trip".

## Task 5: Travel Deal Lab (blue, saffron)

Helper `src/app/travel-deals/fareGauge.ts`, tested beside it. `fareGauge(quoted, region)` returns the typical band on a scale and the needle position, clamped at the ends with a flag, and `bookingStrip(departure, today, region)` returns the days out and the sweet-spot window on a strip. The signature is the gauge and the strip. The points calculator reads as cents per point against the 1.4 cent baseline, and the unverified disclosure and the dated estimate note stay.

## Task 6: Food Map (vermilion, saffron)

This is a migration. A test reads `src/app/food-map/food-map.css` and fails while it declares any hex literal or `--fm-*` colour, and the stylesheet moves onto the `--c97-*` tokens and surfaces. The masthead, stamp, ribbon, curator legend, and map stay, in the print shop vocabulary.

## Task 7: Verification and review

Full Jest, `tsc --noEmit`, and ESLint on the touched directories. `e2e/persisted-tools.spec.ts` and `e2e/product-surfaces.spec.ts` against the dev server on port 3100. The contrast sweep over the six routes, empty and with seeded localStorage. A probe at 390, 640, 820, and 1440 for horizontal overflow, hero icon size, and rendered SVG text size, and screenshots in both themes at 1440 and 390. One fresh review of the branch diff, fixes for Critical and Important findings, then merge main if it merges cleanly, regenerate the sitemap, push, and open the PR against `design/data-dashboard-signatures`.
