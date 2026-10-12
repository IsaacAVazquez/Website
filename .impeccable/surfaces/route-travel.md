---
version: 1
slug: "route-travel"
primary_target: "route:/travel"
related_targets: ["src/app/travel/travel-planner-client.tsx","src/app/travel/travel.css","src/app/travel/itinerary.ts","src/hooks/useTravelPlanner.ts","src/lib/travelPlanner.ts"]
---

# Travel Planner surface brief

Written on 2026-10-12 by the stage 2 project sovereign pass (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Log, group G7).

Scope. The `/travel` route, rendered by `src/app/travel/travel-planner-client.tsx` with its own stylesheet `travel.css`. Trips live in `localStorage` under `travel_planner_trips_v1`, read and written through `useTravelPlanner` and `src/lib/travelPlanner.ts`, which this redesign did not touch.

Visitor mode. Operate. The visitor makes a trip, files stops under its days, ticks them off on the day, and writes a journal entry at night.

Genre. A trip planner, with TripIt's trip header and Wanderlog's day-by-day itinerary as the references. The page is the trip, read top to bottom as a title row, a trip header, the days, and the journal.

## Decisions

The route paints its own paper inside the site frame. `.tp-root` declares `--tp-paper`, `--tp-field`, `--tp-ink`, `--tp-ink-2`, `--tp-teal`, `--tp-rule`, and `--tp-rule-strong`, with a light story (warm paper `#f5f3ee`, deep teal `#0c6468`) and a dark one under `.dark .tp-root` (blue-black `#0f1619`, pale teal `#74cbc6`). It redeclares `--c97-surface`, `--c97-field`, `--c97-ink`, `--c97-ink-2`, `--c97-label`, `--c97-rule`, `--c97-accent`, and the three status tokens so the borrowed `c97-field`, `c97-btn`, `c97-btn-ghost`, `c97-chip`, `c97-kicker`, and `c97-meta` read the route's palette and the focus ring paints teal. The category swatches stay on the `--c97-chart-*` ramp, since they are data.

The root handles the frame's base layer itself. Headings take Archivo explicitly, and `.tp-root :where(p, ul, li, figure, dl, dd)` resets the paragraph measure, margins, and list padding at one class of weight.

Type is Archivo throughout, with an 800 weight for the h1 and 700 for the destination, and Fragment Mono for times, dates, and counts. No added typeface.

The trip header is the old boarding pass flattened to one ruled strip between two 3px rules. It holds the trip select (only when there are two or more trips; with one trip the trip's name prints as a kicker over the destination), the destination, the dates, a definition list with Countdown and Stops, the New trip button, and a native `details` disclosure, "Trip details and all trips (N)", which holds the trip's fields, Delete trip, and the All trips list. The whole strip is the "Trip management" region the route test reads.

The itinerary is the first screen on a return visit. Each day is a heading rule ("Day N", the date, " · Today" when it is today, and N/M done), then the stops as ruled rows with the time in a mono margin, the done toggle drawn in the category's colour, the title and its category and place, and Edit and Delete at the right edge. On phones the time moves above the title. The time grid (the old timeline chart) sits beside the days from 1024px up as a sticky companion with no border, and after the days on narrower screens.

Add stop is one form, inline at the end of a day. It opens under the day the plan defaults to (today during the trip, else the first or last day). Every other day ends with an "Add a stop" ghost button, named "Add a stop on <day>" so it never matches the submit's "Add stop", which moves the form there, fills the date, and puts the cursor in Title. Editing a stop moves the form to that stop's day. Both moves run inside `flushSync` so the title field exists before focus goes to it. The Date field stays, so a stop can still be filed under another day from the form.

A first visit shows the title row, one trip form, and beside it (under it on a phone) a sample day drawn with the same stop markup and captioned "A sample day, to show what the plan turns into". The sample has no controls and is never stored or counted.

The journal is the second section, with the postcards on the left and the entry form on the right from 1024px up. A postcard is the one box on the page, a hairline with the note on the left and a dotted stamp holding the date and the mood, since the card is the object and carries the entry's own data.

Today is read after mount. `today` comes from `useClientNow()`, which is null on the server and during hydration, and the new-trip draft keeps an empty date to mean "today", so the server HTML and the first client render print the same empty date and the client fills it in. Before this the date was read during render, and a browser whose clock was a day ahead of the server's (Asia/Tokyo from 08:00 Pacific until midnight) failed hydration on the first-trip form's date inputs.

Print hides the forms, the disclosure, the Add a stop buttons, and the row actions, and keeps the trip header, the days, the time grid, and the postcards.

## Cut, and not to be restored

The hero sheet and poster h1, the boarding pass plate with its stub, the blank first-visit pass with "No trip yet", "Nothing planned", and "Start a trip" (the form was already open, so the button only moved focus), the second plate around the first-trip form, the timeline plate, the torn and deckled seams, the "N/M stops checked off" line over the itinerary (it repeated the header's Stops figure), the panel boxes around the stop form, the journal form, and the trip details, the offset shadow on each postcard, and the separate "Manage / Trip" band.

## Pinned, and kept

`src/app/travel/__tests__/travel-planner-client.test.tsx` covers the regions "Day-by-day itinerary", "Trip journal", and "Trip management", the "Create a new trip" form, its fields and "Save trip", "The day-by-day itinerary and the journal open once a trip is saved.", the Stops figure as the next sibling of "Stops", the countdown strings, per-day headings with " · Today", "N/M done", "0 stops", "Nothing planned yet.", "No stops yet. Add the first one with the Add stop form.", the timeline's img label and "Timeline key", "N untimed", "Scroll to see every day", the long-trip note, every alert string, the edit, toggle, and delete names, "Delete trip", "Confirm delete", "Keep it", "New trip" with `aria-expanded`, "All trips (N)", "X (active)", the "Trip" select, the "Amazing" chip's `c97-chip-positive`, and the storage-unavailable status. The test changed in four ways in the same commit as the redesign. The first-visit checks no longer look for the blank pass or Start a trip, the "N/M stops checked off" reads moved to the header's Stops figure, the `.c97-boarding-pass-destination`, `.c97-serif`, and `.c97-panel` selectors became `.tp-destination`, `.tp-postcard-title`, and `.tp-details`, and two tests were added, one for the server render printing no date and one for Add a stop moving the form.

`e2e/all-projects.spec.ts` ("travel saves a trip, a completed stop, and a journal entry") holds unchanged, as does `data-testid="travel-planner-shell"`.

## Verified state, 2026-10-12

First field and first row, page coordinates including the header. On a first visit the Trip name field sits at y416 at 1440x900 and y473 at 390x844, against y914 and y977 before. On a return visit with a four-day trip the trip header sits at y355 and y419 and the first itinerary row at y669 and y782, against y1697 and y1546 before (the phone budget is 1266).

The hydration fault is fixed at its root. With the server one calendar day behind the browser (I ran the server with `TZ=Pacific/Pago_Pago`, since the real window is 08:00 Pacific to midnight and the check ran at about 01:00 Pacific), `e2e/project-routes.spec.ts -g "/travel "` failed on main's code in both Los Angeles and Tokyo with the attribute mismatch on the first-trip form's dates, and passed after the fix on the dev server and on the production build. I did not re-run it inside the real window.

Checked against a production build (`next build --webpack`, served with `next start` on 3810) in Chromium. `scripts/contrastSweep.mjs` reported no failures in either theme, and its `measurePage` run on the seeded states (a saved collection, an opened detail, a filtered view, with every disclosure opened) found none in either theme either. `scripts/layoutSweep.mjs` reported 0 fails across the five G7 routes. The route's e2e specs passed against both the dev server and the production build. A scripted keyboard walk from the page top reached New trip, the disclosure, each stop's toggle, Edit, and Delete, then the stop form's fields in order; Enter on Add a stop on Tue moved focus to Title, Enter in Title added the stop, Space on its toggle marked it done, and Enter on the disclosure opened it. Under `prefers-reduced-motion` the shared button transition collapsed to 1e-05s. A Chromium print with `page.pdf()` of a seeded trip printed the title row, the trip header, the days, the time grid, and the postcard, with the forms, the disclosure, and the row actions hidden. I did not check Safari's and Firefox's engines, touch devices, or a screen reader.
