---
version: 1
slug: "route-github-trending-pulse"
primary_target: "route:/github-trending-pulse"
related_targets: ["src/app/github-trending-pulse/github-trending-client.tsx","src/app/github-trending-pulse/github-trending-pulse.css","src/app/github-trending-pulse/star-log.ts","src/app/github-trending-pulse/github-trending-state.ts","src/lib/githubTrendingSnapshot.ts"]
---

# GitHub Trending Pulse surface brief

Written on 2026-10-12 by the stage 2 G6 agent (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Board).

Scope. The `/github-trending-pulse` route, rendered by `github-trending-client.tsx` with its own stylesheet `github-trending-pulse.css`, over the trimmed client snapshot from `getGitHubTrendingClientSnapshot`. The bar and language-share maths live in `star-log.ts` and its test.

Visitor mode. Read and filter. The visitor wants to see which repositories gained the most stars this week, inside a language or a topic.

Genre. `git log --stat` and GitHub's trending page, with a package registry's sortable list as the third reference. Every repository is one ruled line with its rank, its name in Fragment Mono, a one-line description, the week's gain with its measurement status, and the gain drawn as a bar, then total stars, language, pushed date, and the link from 1024px.

## Decisions

The star log and the table are one list. The board had been a capped twelve-row star log above a separate table that repeated the same names and gains, so the bar moved into the table as its own column from 640px and under the name on a phone, scaled to the biggest gain in the whole filter so unfolding the list never rescales it. A row opens in place on its name button or a pointer click, and the open row carries segments, topics, forks, issues, license, and score, plus stars, language, pushed, and the link under 1024px where those columns are hidden. The fold at 25 rows and "Show all N repositories" stayed.

The first screen is a title row (the h1 in Fragment Mono, one sentence, and one status line with the source, the update time, the activity window, and the measured share, plus the degraded-source line when it applies), then the board's toolbar with the Language and Topic switch, the segment switch, and the sort switch, sticky from 768px, then the language strip and the list. On a phone the segment switch scrolls sideways in one row.

The route paints its own paper with `--gt-*` properties on `.gt-root`, a near-white `#fbfbf9` with graphite ink in light and `#101317` with pale ink in dark, and redeclares `--c97-surface`, `--c97-field`, `--c97-panel`, `--c97-ink`, `--c97-ink-2`, `--c97-label`, `--c97-rule`, `--c97-action`, and `--c97-accent` from them. The focus colour is a blue. The bars are a diff-addition green, solid when measured, hatched when partial, and outlined for a new baseline, with a legend under the strip. The language strip uses the language colours from GitHub's open linguist data, with a 2px paper gap between segments, and the caption names the lead language in words ("JavaScript has 30% of this week's star gain across the 84 repositories in this view"). No typeface was added.

Cut, and not to be restored. The poster hero sheet and its torn seam, the three readouts (repos tracked, seven-day star delta, leading language), the "Snapshot leaders" rail, which repeated the segment switch, "The board" poster heading, the separate `StarLogBoard` component, the Link column's twin in the open row on wide screens, and the EmptyPanel card, which is a plain line now. The route stopped reading its `PROJECT_PRESS` row.

## Pinned, and kept

`src/app/github-trending-pulse/__tests__/github-trending-client.test.tsx` holds the h1, the region "GitHub trending filters" with the "Topic" and "TypeScript" buttons, the group "Sort repositories" with "Stars", the push URLs, the region "Repository table (scrolls sideways)" with 26 rows folded and 31 unfolded, "Show all 30 repositories", and the open row's Stars, Language, Pushed, and Repo. Two assertions changed on 2026-10-12. The filters-before test reads the table region, since the star-log list it read is merged into the table, and the language-share test reads the strip's caption, since the "Leading language" readout is cut. `e2e/product-surfaces.spec.ts` holds unchanged (`^Topic$`, `^Stars$`, `view=topic`, `sort=stars`, no overflow). The `view`, `segment`, `sort`, and `repo` parameters are unchanged.

## Verified state, 2026-10-12

Against a production build (`next build --webpack`, served on 3800) in Chromium, `scripts/contrastSweep.mjs` found no failures in either theme on the default view, an open row, and a topic segment, and `scripts/layoutSweep.mjs` reported 0 fail, 0 review, and 0 report. The first row sits at y588 at 1440x900 and y802 at 390x844, against y1045 and y1030 for the first star-log row before (and y2376 and y2068 for the first table row). The keyboard walk from the page top reaches the kind switch at the 12th stop, right after the eleven header stops, Enter on Topic writes `view=topic`, and Space on the first name opens its row with `aria-expanded="true"`. Under reduced motion the switch transition resolves to 1e-05s. A Chromium print prints the title, the active switches only, the strip, and the list with the bar under each name across four Letter sheets. I did not check Safari's and Firefox's engines, a screen reader, or touch devices.
