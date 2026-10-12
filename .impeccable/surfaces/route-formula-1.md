---
version: 1
slug: "route-formula-1"
primary_target: "route:/formula-1"
related_targets: ["src/app/formula-1/formula-1-client.tsx","src/app/formula-1/TimingTowerSignature.tsx","src/app/formula-1/formula-1.module.css","src/app/formula-1/timingTower.ts","src/app/formula-1/formula-1-state.ts","src/lib/formula1Snapshot.ts"]
---

# Formula 1 Pulse surface brief

Written on 2026-10-12 by the stage 2 G2 pass of the project sovereign design (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Board).

Scope. The `/formula-1` route, rendered by `src/app/formula-1/formula-1-client.tsx` with the timing tower in `TimingTowerSignature.tsx` and every style in `formula-1.module.css`. Data comes from the checked-in OpenF1 snapshot through `src/lib/formula1Snapshot.ts`, and a meeting the page was not seeded with loads from `/api/formula-1/meetings/[meetingId]`. Neither was touched.

Visitor mode. Scan. The visitor wants where the championship stands and when lights go out next, then drills into one race weekend.

Genre. F1 TV's timing tower beside the official app's race hub. The references are the broadcast timing tower (position, livery stripe, three-letter code, gap, interval), the F1 app's race hub card (next session, countdown, circuit), and the FIA classification sheet for results.

## Decisions

The first screen is a title row (h1 "Formula 1 Pulse" in caps, one sentence, and a mono status line with the rounds complete and the snapshot time), one sticky view switch (Overview, Drivers, Constructors, Calendar), and the board. From 960px the board is two columns, the tower on the left (22 to 24rem, sticky under the switch) and the race hub on the right. Under 960px the tower comes first and prints its top ten with a "See all" link to the Drivers or Constructors view.

The right column always opens on the next race (or the latest one when the season is over), with the round number, the five start lights, the venue, the race start in Pacific time, the circuit type, the sprint flag, the track's UTC offset, and the countdown as plain mono figures. Under it, Overview holds the constructors table, the last podium as three ruled rows, the race strip, and the selected weekend's schedule and classification. When the selected weekend is the one the masthead already names, its detail prints without repeating the name and venue. Drivers and Constructors hold the full standings in table markup with team, points, last-race gain, gap, and movement. Calendar holds the weekend detail above the season timeline, and a pick in the timeline scrolls the detail into view.

The route paints its own page. `.root` declares `--f1-*` properties with a light story (track grey `#f3f3f0`, carbon ink `#15151e`) and a dark one under `:global(.dark) .root` (`#101015`, `#ececf1`), and points `--c97-surface`, `--c97-ink`, `--c97-ink-2`, `--c97-label`, `--c97-rule`, `--c97-field`, and `--c97-accent` at them so the shell and the focus ring follow. The tower is a carbon broadcast graphic in both themes, which is the display-board allowance, and it drops to paper under print so a print without backgrounds keeps its figures. Liveries come from data and are the only saturated colour besides the start lamps and the movement arrows. Focus is a blue ring. Type is the site's body face (`--c97-font-body`, in caps for names and section labels) and Fragment Mono for figures, with no added face.

Cut, and not to be restored. The vermilion hero sheet and the poster h1, the paper plate around the tower, the hero control plate (the view links and the race lookup form), the three readouts (driver leader, constructor leader, rounds complete), the "Race weekend" band, the view description sentence, the Overview's driver and constructor leaderboards with their bars (they restated the tower), the bordered countdown cells, the podium panels, and the "Data notes" and "Attribution" bands, which are now one source line at the foot. The route stopped reading its `PROJECT_PRESS` row.

## Pinned, and kept

`e2e/product-surfaces.spec.ts` (the h1, one h1, the `Drivers` button with `aria-pressed`, `view=drivers` in the URL, no horizontal overflow). `formula-1-client.test.tsx` keeps the default-route, canonicalization, view switch, venue, race strip URL, deep-linked fetch, and error-state tests. Its two hero tests ("links from the hero into each season view" and "opens a race from the hero lookup") were replaced with one test of the view switch, since the brief cut the plate they pinned. `TimingTowerSignature.test.tsx` holds unchanged. `view` and `meeting` params, `#race-weekend-detail`, the "1 · DRIVER" classification row text, "Loading race weekend detail…", and the alert on a failed fetch all stay.

## Verified state, 2026-10-12

Against a production build (`next build --webpack`, served on 3760) in Chromium. `scripts/contrastSweep.mjs` reported no failures in either theme on the four views. `scripts/layoutSweep.mjs` reported 0 fails; its reviews are the board's 56px `scroll-margin-top`, which clears the sticky switch on an anchor jump, and the tower's `top: 52px`, which seats it under that switch. Widening the tower to 24rem fixed three clipped codes the first sweep found.

First data row (the tower's first driver), page coordinates including the header: y485 at 1440x900 and y526 at 390x844, down from y1140 and y1275. The keyboard order from the page top runs header, then Overview and Drivers. Enter on Drivers set `view=drivers` and `aria-pressed`, Space on Calendar set `view=calendar`, and Enter on a timeline race set `meeting=` and showed its detail. Under reduced motion the start lights hold lit with no animation, and a Chromium print came out with the tower on paper. I did not check Safari's and Firefox's engines, touch devices, or a screen reader.
