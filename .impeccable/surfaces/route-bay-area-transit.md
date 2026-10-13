---
version: 1
slug: "route-bay-area-transit"
primary_target: "route:/bay-area-transit"
related_targets: ["src/app/bay-area-transit/bay-area-transit-client.tsx","src/app/bay-area-transit/TransitSignature.tsx","src/app/bay-area-transit/TransitMap.tsx","src/app/bay-area-transit/bay-area-transit.css"]
---

# Bay Area Transit Pulse surface brief

Written on 2026-10-12 by the project sovereign stage 2 (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Board, group G5). The route is wide.

## What the page is

A transit app around a platform display, borrowing from BART's own platform signs, Transit, and Citymapper's station view, and none of their branding. The first screen is a title row with the status strip on its right, three feed badges (Departures, Advisories, Elevators, each Live, Saved copy, Last good copy, or Unavailable in words beside a mark), the Alerts control with its count, the feed and refresh stamp, and one line on where the data comes from. Under it the Leaflet map takes the wide column with the line chips and Nearest station on its top edge, and the station finder sits above the departure board in the right column. The board is one dark display in both themes, warm white destinations and amber minutes in Fragment Mono. Below 1050px the board comes first. Alerts open from the status strip into a ruled list under it.

## Decisions

The hero sheet, "The network" band, the Lines and Stations stat pair, the line-card band, the Lines and Alerts tablist, and the "Data note" band are cut. The map's line chips carry each line's name and route in their labels, which is what the line cards said. Since the tablist went, `?view=advisories` means the alerts strip is open, and no parameter (or an old `?view=lines`) means closed, so the state module did not change. The data note folds into the status strip as one line, the seed sentence where the snapshot is the seed. Station rows in the finder are a ruled list now, held to 22rem with its own scroll, and because that scroll clips an outset focus ring at the list's edges, a station row draws its ring inside the row. The list's one column is `minmax(0, 1fr)`, since an auto column grew to the longest station name and pushed every row's right edge and line swatches past the list, so a long name cuts short with an ellipsis now. The page description says "a street map of every line" where it used to promise a line directory.

The page is served from a cached copy of the checked-in snapshot, so a feed that BART answered reads Live only once this browser's own summary refresh has answered. Before that, and again after a refresh fails, it reads Saved copy with the hollow ring. When a feed is held and there is nothing to list, the alerts strip prints the held-feed sentence alone, with no empty list and no all clear.

The route has its own palette as `--bt-*` on `.bt-root`, a cool grey paper (#f3f4f2) in light and #0f1113 in dark, and the board keeps #0e1012 (#08090a on the dark page) in both themes. The board points `--c97-accent` at its amber and `--c97-ink` at its warm white, which are what the frame's focus ring and selected text read, so text selected on the board is 9.68:1 in light where the page's dark ink gave 1.61:1. Status reads in words with a mark whose shape changes with the state. BART's line hexes stay data. The class names under `TransitSignature` keep their old `c97-transit-` prefix, since the client test and the board's own logic select by them and they live only in this route's CSS.

## Pinned, and kept

The h1 "Bay Area Transit Pulse"; the `station` parameter; "Find a station" with "Show all N stations" and its focus rules; the `.c97-transit-finder`, `.c97-transit-board`, and `.c97-transit-map svg[role="img"] g` hooks; the departure row labels; "Next trains", the station h2, and "Read from BART"; the stale and unavailable board sentences; "Loading departures…", "Try again", and the 404 sentence; "Nearest station" and its notes; the 60-second summary poll with its visibility check; "No delays reported and all elevators in service at the last refresh."; the stale-section sentence; the seed sentence; the feed stamp's exact text; the badge words "Live" and "Saved copy"; a one-car train reading "1 car" on its row and in its spoken sentence.

Five client test cases changed with the cut tabs and line cards, and the "Alerts" control is a button with `aria-expanded` now. The status strip case reads "Saved copy" while no refresh has answered. `__tests__/bay-area-transit-css.test.ts` holds the four rules a unit render cannot see, which are the board's `--c97-ink`, the Saved copy mark, the station row's inset ring, and the station list's column. `e2e/all-projects.spec.ts` drops transit from the tab loop and adds a case that opens and closes the alerts strip.

## Verified state on 2026-10-12

Against a production build, the contrast sweep found no failures in either theme and the layout sweep reported 0 fail and no review for this route. The board sits at y295, the first departure row at y577, and the map at y349 at 1440x900 (before y595, y965, and y670), and the board at y519 and the first departure at y765 at 390x844 (before y567 and y866). A keyboard walk reaches the Alerts control at the 12th stop and Enter opens the strip. Under reduced motion nothing animates and the chevron does not transition. A Chromium print shows the board, the open alerts, and the drawn map.

The Saved copy badge, the board's selection ink, the station row's inset ring, and the alerts strip without its empty list came after that pass. I checked them in Jest and against the cascade, and I have not seen them in a browser.

A browser check of the production build then measured the station rows at 429.6px in a 386px list at 1440 wide and 382.7px in 334px at 390 wide, with the ring's right side and the line swatches cut on all 50 rows. The column rule above is the fix, which that check had tried as an injected style and seen draw the ring on four sides at both widths. I have not seen the committed rule in a browser.
