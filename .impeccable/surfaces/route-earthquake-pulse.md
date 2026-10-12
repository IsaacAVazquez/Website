---
version: 1
slug: "route-earthquake-pulse"
primary_target: "route:/earthquake-pulse"
related_targets: ["src/app/earthquake-pulse/earthquake-client.tsx","src/app/earthquake-pulse/EarthquakeSignature.tsx","src/app/earthquake-pulse/earthquake-pulse.css"]
---

# Earthquake Pulse surface brief

Written on 2026-10-12 by the project sovereign stage 2 (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Board, group G5).

## What the page is

USGS Latest Earthquakes read as a seismograph record. The first screen is a title row, then the 24-hour trace as a full-width strip between two rules, with the kicker on its left corner, the USGS source and feed time (and the last-saved-snapshot flag) in mono on its right corner, the day's strongest quake labelled on its spike, and one caption line with the 24-hour and 7-day M2.5+ counts and the felt count. Under it the epicentre plot (sticky from 1024px) and the log sit side by side, the log's Recent, Significant, and Regions tabs as its own sticky toolbar. A picked quake opens its detail right under its row as a definition list. One source line at the foot says the page reads USGS on each load and every five minutes after, falls back to a daily snapshot, and is not an emergency alert feed.

## Decisions

The hero sheet, its three readouts, the "Jump to the log" group, "The log" poster heading, the per-tab explainer paragraphs (each tab keeps one short line), the sticky "Selected quake" rail, the six bordered detail tiles, the bordered region boxes, and the "Data note" band are cut. The seismogram and the epicentre plot were one SVG and are two now, `EarthquakeSignature` (the trace) and `EpicentrePlot`, so the trace can run full width. The detail prints inline at every width now that the rail is gone, so nothing is open until a quake is picked; the default selection still marks the newest quake on the trace and the plot. On a phone the trace's strongest-quake label is hidden for size and the caption carries it instead. Unpicked log rows have no fill; the selected row keeps its magnitude tint.

The route has its own palette as `--eq-*` on `.eq-root`, a chart-paper white (#f8f6f1) with graphite in light and #121110 in dark, and points `--c97-warning` and `--c97-negative` at route values that clear 4.5:1 on that paper, so the magnitude ramp stays the only colour that means anything. Fragment Mono carries times, depths, and the trace's stamp and axes. No typeface was added.

## Pinned, and kept

The `view` and `quake` parameters; `role="tab"` tabs with `aria-selected` and a `tabpanel` (the tab loop in `e2e/all-projects.spec.ts`); `quake-inline-detail` right after its row, with the place as an h3; "Coordinates"; "feed updated <time> UTC"; "USGS could not be reached"; times in UTC; the tsunami and felt flags; the distribution bars; "View on USGS"; the trace label and "Older quakes are outside the log".

Four client test cases changed. The feed-time case reads the row's 13:30 UTC clock, since the full date opens with a picked quake's detail now. The counts case reads the trace's caption sentence. The live-read case drops the "Data note" heading and keeps both phrases, which the source line carries. The jump-group case, which queried `.c97-project-hero-readouts`, became a check that the tabs follow the trace and push their view. The signature test reads `.eq-trace-label`.

The build-note write-up in `src/constants/caseStudies.ts` still calls the page "snapshot-backed", built on "checked-in USGS GeoJSON snapshots", while the page polls USGS every five minutes. That file is the lead's, so the correction is a proposal in the G5 ledger.

## Verified state on 2026-10-12

Against a production build, the contrast sweep found no failures in either theme and the layout sweep reported 0 fail (the reviews were the plot's sticky offset and the log rows' 8px inset for the selected tint). The trace sits at y337 and the first log row at y694 at 1440x900 (before y843 and y1874), and at y440 and y946 at 390x844 (before y1005 and y1527). A keyboard walk reaches the first tab at the 12th stop, and Enter on Significant pushes `?view=significant`. Under reduced motion nothing animates. A Chromium print is in the G5 scratchpad.
