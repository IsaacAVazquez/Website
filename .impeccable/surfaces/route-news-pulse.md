---
version: 1
slug: "route-news-pulse"
primary_target: "route:/news-pulse"
related_targets: ["src/app/news-pulse/news-pulse-client.tsx","src/app/news-pulse/NewsFrontPage.tsx","src/app/news-pulse/news-pulse.css","src/app/news-pulse/news-pulse-state.ts"]
---

# News Pulse surface brief

Written on 2026-10-12 by the project sovereign stage 2 (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Board, group G5).

## What the page is

A broadsheet front page over a media-monitoring desk, borrowing from a newspaper's front, Memeorandum, and Ground News's coverage counts, and none of their branding. The nameplate sits under a heavy rule in Newsreader with one sentence and a dateline row (the pull time, and the headline and outlet counts). The front page follows, the lead cross-outlet story as the banner headline with each outlet's own headline under it in two columns, the next five cross-outlet stories down a ruled right column with their outlet counts and their headlines one disclosure away, and the coverage matrix of outlet against topic. Then "Headlines" with the source filter, in columns by outlet, and "Tone and density", one ruled table of headlines, the tone split, words per headline, and readability by outlet.

## Decisions

The hero sheet, its three readouts, "Jump to the desk", "The desk" band, the Headlines, Coverage map, and Analysis tabs, the Coverage map view (its story clusters are the front page's right column and its topic list repeated the matrix), the Analysis view's three boxed panels, the cluster-by-outlet comparison table, and the bottom "Last fetched" line are cut. With the tabs gone, `view` is no longer a parameter and the state module keeps only `source`; an old `?view=coverage` link lands on the page with its source filter intact. Under 1024px the banner's outlet headlines and the topic coverage open in place, and print follows that narrow layout. The story links are block links padded to 44px.

The route has its own palette as `--np-*` on `.np-root`, a newsprint (#f6f3ec) with near-black ink in light and #141312 in dark, Newsreader for the nameplate, headlines, and section titles, the body face for kickers and tables, and hairline column rules. Outlet colours and the tone colours stay data on swatches and bars, with every figure in ink. No typeface was added.

## Pinned, and kept

`data-testid="news-pulse-shell"` and `news-headlines-grid`; the `source` parameter and the "Source" combobox; the h1 "News Pulse"; article titles as h3; the "Refreshing live feeds" status; "Some feeds did not come through on this refresh." with the error list; the route error state and "Try again"; "No headlines match this filter."; "Show N headlines from N outlets" and the "Coverage by topic" list; "Show more".

The client test's tab cases became section cases (no tabs, an old view link keeps its filter, the tone table, the right column's stories), and the shell case reads the new standfirst and dateline. `e2e/product-surfaces.spec.ts` checks the front page, the Headlines heading, and the source filter instead of clicking the Coverage Map tab.

## Verified state on 2026-10-12

Against a production build, the contrast sweep found no failures in either theme and the layout sweep reported 0 fail (the reviews were last-row counts in the outlet columns, which depend on the pull). The banner headline sits at y392 at 1440x900 and y466 at 390x844, and the coverage matrix at y1365 at 1440 (before, the lead outlet list sat at y1016 and the matrix at y1364 at 1440, and the headlines grid at y1479 at 390). A keyboard walk reaches the lead story's links at the 12th stop and the source filter at the 28th, and Space opens a story's disclosure. Under reduced motion nothing animates. A Chromium print is in the G5 scratchpad.
