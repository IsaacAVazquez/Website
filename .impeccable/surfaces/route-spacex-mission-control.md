---
version: 1
slug: "route-spacex-mission-control"
primary_target: "route:/spacex-mission-control"
related_targets: ["src/app/spacex-mission-control/spacex-mission-control-client.tsx","src/app/spacex-mission-control/spacex-mission-control.css","src/components/spacex/MissionControlHero.tsx","src/components/spacex/MissionLaunchBoard.tsx","src/components/spacex/MissionCard.tsx","src/components/spacex/MissionDrawer.tsx"]
---

# SpaceX Mission Control surface brief

Written on 2026-10-12 by the project sovereign stage 2 (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Board, group G5).

## What the page is

A launch operations board, borrowing from Spaceflight Now's launch schedule, NextSpaceflight, and a mission control wall display, and none of their branding. The top band is one dark display surface in both themes, holding the title row with the status line (live state, Launch Library 2 source, snapshot time, served through the site's own routes, not affiliated with SpaceX) and Refresh data, then the masthead row for the next launch (status and flight number, the name, the countdown large in mono beside the schedule label, rocket, pad, and payloads as one line, the four fleet figures as a second line, Inspect mission and the links, and the vehicle photo from 640px), then the launch tape. The manifest follows on the route's paper, the Manifest and Vehicles tabs (Recovery only when the snapshot carries booster records) with the cadence strip on the same rule, then the Upcoming and Past switch and the vehicle filter as a sticky toolbar over the mission cards.

## Decisions

The hero sheet, the quick-actions row, the paper plate, "The launch record" and "Manifest, vehicles, and recovery" bands, the stat fascia (`MissionStatFascia.tsx` is deleted, and its four figures are the masthead's fleet line), the boxed Refresh and status pills, the "Data source" band, the board's explainer heading and paragraph, and the hand-drawn borders on the masthead tiles, the board, the switch, the tape, the empty states, the vehicle spec grid, the recovery panels, and the drawer's sections are cut. The mission card keeps its border, since the card is the object, with its four facts as a definition list. The drawer keeps its edge and reads the route palette now, since its `data-c97-surface="paper"` was dropped. The manifest has an sr-only h2 so the cards' h3 sit in order. The vehicle photo hides under 640px, where it pushed the manifest a screen down, and it loads lazily at every width, since an eager image is preloaded from the document head and a phone then paid for a photo it never painted.

The vehicle filter falls back to All whenever the board's list has no flight of the picked vehicle, so a pick made on Upcoming cannot empty Past, and the "No <vehicle> missions on the board" line is gone because nothing can reach it. Inspect mission from the Past board clears the cards and loads the Upcoming list the way a press on the switch does, and the check that drops a launch missing from the board waits for that board's own list, which also holds for Back and Forward. The countdown is a `role="timer"` with no `aria-live`, so it is not read out every second.

The route's heading and paragraph resets sit in `@layer base`, where one class of weight still beats the frame's element rules and every Tailwind utility on a heading or a paragraph wins again (the mono "T-0 sequence" and "Scale · to height" labels depend on it). The Upcoming and Past switch clips at its rounded border, so its focus ring is drawn 4px inside the button in the button's own text colour, and the tape's scroll region draws its ring inside too. Every width query names `screen` or `print`, so paper takes the one-column page from every engine. On paper the display band is a white sheet in dark ink, since a print with backgrounds off drops the band's fill and left its light type on white, and Inspect mission and the pressed Upcoming or Past button are drawn as outlines for the same reason. Paper leaves the vehicle photo off, as a phone does, because its captions are light type set over the picture. From 640px, where the board tools are sticky, each card carries a 5rem scroll margin, so focus moving up the cards does not land under the bar.

The route has its own palette as `--sx-*` on `.sx-root`, a cool white (#f5f6f8) in light and #0f1216 in dark, and `.sx-console` keeps #0b0f14 in both themes on screen and points the Catalog 97 tokens the shared components read at its own values. Status colours stay data. Fragment Mono for the countdown, flight numbers, and the tape. No typeface was added.

## Pinned, and kept

The test ids `mission-hero`, `mission-board`, `mission-card-*`, `mission-board-visual-*`, `mission-hero-visual`, `mission-detail-panel`, `mission-countdown`, `mission-liftoff-note`, and `mission-vehicle-photo`; the `status`, `launch`, and `panel` parameters; the "Past" button with `aria-pressed`; "Refresh data"; the degraded line with "Countdown timers are intentionally suppressed"; "Scheduled for"; the countdown's format; the T-0 liftoff (`MissionLiftoff.module.css`, the status line, gone under reduced motion and in print); the drawer loaded through `DeferredMissionDrawer`; no opacity 0 in the server markup; the refresh backoff and the launch-time precision rule.

One client test case changed. The quick-actions case became a check that the masthead, the tape, and the manifest come in that order, that the fascia is gone, that there is no Recovery tab without recovery records, and that Inspect mission in the masthead pushes the launch.

## Verified state on 2026-10-12

Against a production build, the contrast sweep found no failures in either theme and the layout sweep reported 0 fail (the reviews were the status line's mark inset and the card grid's last row, which depends on the launch count). The masthead sits at y295 and the first mission card at y923 at 1440x900 (before y749 and y2366), and at y496 and y1236 at 390x844 (before y758 and y3149). A keyboard walk reaches Inspect mission at the 13th stop and the first card at the 25th; Enter on a card opens the drawer, and Escape closes it with focus back on the card and the launch out of the URL. Under reduced motion nothing animates. A Chromium print is in the G5 scratchpad.
