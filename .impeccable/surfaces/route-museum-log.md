---
version: 1
slug: "route-museum-log"
primary_target: "route:/museum-log"
related_targets: ["src/app/museum-log/museum-log-client.tsx","src/app/museum-log/museum-log.css","src/app/museum-log/museum-log-helpers.ts","src/app/museum-log/museum-log-state.ts","src/hooks/useMuseumLog.ts","src/data/museumSnapshot.ts"]
---

# Museum Log surface brief

Written on 2026-10-12 by the stage 2 project sovereign pass (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Log, group G7).

Scope. The `/museum-log` route, rendered by `src/app/museum-log/museum-log-client.tsx` with `museum-log.css`. The catalog, reviews, diary, and lists are the curated `src/data/museumSnapshot.ts`. The reader's visits, watchlist, and likes live in `localStorage` under `museum_log_user_state_v1` through `useMuseumLog`, and the view, museum, list, sort, type, and region live in the URL through `museum-log-state.ts`. None of that changed.

Visitor mode. Browse, then operate. The visitor scans the catalog, opens a museum, and logs a visit with a rating and a note.

Genre. Letterboxd for museums. The catalog grid is the first screen, each museum drawn as its admission ticket the way Letterboxd draws a poster, with the reader's own log as the thing they come back to.

## Decisions

The route paints its own gallery wall. `.ml-root` declares `--ml-wall`, `--ml-ticket`, `--ml-field`, `--ml-ink`, `--ml-ink-2`, `--ml-blue`, and `--ml-rule`, with a light story (gallery white `#f3f1ec`, ticket stock `#fbfaf7`, museum blue `#284785`) and a dark one under `.dark .ml-root` (slate `#14181c`, ticket `#1c2228`, pale blue `#93b3ef`). It redeclares `--c97-surface`, `--c97-panel`, `--c97-field`, `--c97-ink`, `--c97-ink-2`, `--c97-label`, `--c97-rule`, `--c97-accent`, and the three status tokens, so the borrowed field, range, chip, kicker, ghost button, and the journal's `c97-row` read the route's palette. Newsreader for the headings, the museum names on the tickets, and the exhibit titles, Fragment Mono for prices, ratings, and counts, Archivo for the rest. No added typeface.

The title row is the h1, one sentence, and the curator and updated line, and once the reader has logged a visit, their last three visits print beside it as small tickets ("Your last visits") that open the museum. On a first visit nothing prints there.

Under it one ruled bar holds the Discover, Journal, and Lists switch (an underlined tab, still `aria-pressed` buttons inside the "Section navigation" nav) and the catalog's one summary line, which carries the catalog, review, and diary counts, how many museums have an exhibit on view today, how many the reader has visited, and the verify-before-visiting sentence word for word.

Discover is the catalog grid under a toolbar with no box around it, holding the search, the Type and Region selects, and the sort buttons, then the count line. Each museum is its admission ticket (the one box, since the ticket is the object and carries the museum's own name, city, founding year, admission, curator rating, and an On view now chip), then the reader's own visit line, the blurb, and the Log visit, Watchlist, and Like actions, with no panel around the pair. The grid is two columns beside the rail on desktop, since a third column broke the museum names mid-word.

A museum opens in place of the grid as one ruled column, the ticket and the header (type and region, the h2, country and average visit, the curator's and the reader's ratings, the blurb, the actions, and the official site), then Curator review, What to actually see, Exhibition calendar, Your activity (the rate-and-log form), Past visits, and Appears in, each under an h3 and a hairline. The h2 for the active view stays in the DOM as a visually hidden heading while a museum is open, since it is where focus returns on Back to catalog.

The rail is ruled, not boxed, and holds Top liked (or the curator's favorites before the reader likes one) in Discover, Journal, and Lists, or the museum's neighbours in its region while a museum is open, and the one storage note.

## Cut, and not to be restored

The hero sheet and poster h1, the "Browse the catalog" jump link (the catalog is now on the first screen), the plate of stubs with its "Log your first visit" empty ticket, the three readouts (visited, cities, exhibits on now, which the summary line already carries), the torn seams, the filter panel with its Filters kicker, the panel around each museum card and the offset shadow on each ticket, the "Recently visited" rail (it repeated the strip of last visits), the boxed side panel, the six detail panels, the detail's separate band under the catalog, and the second storage sentence in the old standfirst.

## Pinned, and kept

`src/app/museum-log/__tests__/museum-log-client-interactions.test.tsx` and `museum-log-client.test.tsx` cover the h1, the "Section navigation" nav and its pressed buttons, the URL writes for view, sort, type, region, museum, and list, "Filter museums" in Discover only, `Open X detail`, "N museums in the catalog" with its filter suffixes, the empty match line, the actions group names and their pressed states, the damaged-store and cross-tab restores, the storage-unavailable status, the journal's reviews, stamps, and `time[datetime]`, the list preview and catalogue entries, the "X detail" region with its exhibits, chips, Timed entry, official site, and Past visits, "Museum Log side panel" with its fallback lines and neighbours, the rate-and-log form and its focus return to "Your activity", Back to catalog, and focus moving to the detail heading and back to the Discover heading. Assertions changed in this pass, in the same commit, where they read cut parts: the readouts became the summary line's visited count (`data-testid="museum-log-visited"`) and its exhibits sentence, "Log your first visit" became the absence and then the presence of the "Your last visits" strip, the panel's "curator's diary" fallback and its Beacon button became the favorites fallback and its Atlas button, the "Browse the catalog" link check went with the link, and the plain client test's `getAllByText("0")` became the visited count and its "moma" search became "modern", since the old pass only found MoMA through the cut rail. `e2e/persisted-tools.spec.ts` holds unchanged.

## Verified state, 2026-10-12

Filled in after the production pass, below.
