---
version: 1
slug: "route-agent-build-index"
primary_target: "route:/agent-build-index"
related_targets: ["src/app/agent-build-index/page.tsx","src/lib/agentBuildIndex.ts","src/components/newsletter/NewsletterSignup.tsx"]
---

# Agent Build Index

**Status note, 2026-09-27.** This route renders inside `Catalog97ToolShell` and reads `--c97-*` tokens directly under `data-c97-surface`. `DESIGN.md` now describes Catalog 97 and governs this route. The old site header was sticky at 73px and was deleted on 2026-09-16, and `Catalog97Header` is `position: relative`, so every measurement below that assumes a 73px sticky header predates that change. Contrast figures below were measured against Working Instrument values carried through the since-removed bridge and may need re-measuring against the shipped `--c97-*` colors.

## Mode

Read. The visitor is here to understand which public AI agent repositories are actually gaining attention this week, and to judge whether the number means anything. Comprehension leads, and the interface stays out of the way. The newsletter band near the bottom is a secondary ask and must never grow back into the loudest thing on the page.

## Audience

Peers and practitioners who already track this space and want a measured read rather than another market map, plus search and AI-answer traffic landing on the term itself. Both groups are skeptical of star counts, which is why the page spends real estate on what the number does and does not mean.

## What the surface is

A server-rendered route at `/agent-build-index` (`page.tsx`, view model in `src/lib/agentBuildIndex.ts`). It is a focused slice of the committed `githubTrendingSnapshot`, filtered to the `topic-agents` segment, sorted by weekly stars then trend score. No fetch happens at request time and the whole page is computed at module scope, so the only client JavaScript is the signup form. There are no images. The header CTA hands off to `/github-trending-pulse?view=topic&segment=topic-agents` for the full table.

## Decisions not to re-litigate

The page is a filtered view of an existing dashboard on purpose, as a focused entry point rather than a second copy of the data; that duplication is the point, not an oversight. Stars measure attention and nothing else, and the snapshot-notes card says so in the visitor's language, so keep it. Every figure carries its window and its measurement status (`measured`, `partial`, `baseline`) rather than presenting a bare number. The list shows the top ten and states the total, so the tile count and the list length can never silently disagree. `SoftwareApplication` is the house schema type for tool and dashboard routes across 34 pages here; this route follows that convention, and changing it is a site-wide decision rather than a fix to this page.

## Verified state, 2026-08-23

First audit. Scored 17/20, and the findings it raised were fixed the same day.

Measured clean and unchanged: no horizontal overflow at 1512 or 390 (resize read back), one `h1`, one `main`, zero console errors, every color a `--home-*` token with no hardcoded hex, and all contrast passing WCAG AA in both themes computed from token values. The tightest pair is signal on paper at 4.57:1 light and 6.50:1 dark. The focus ring resolves through `--color-primary` to `--home-signal` and clears the 3:1 non-text threshold.

Fixed in the same pass: the `SoftwareApplication` block carried `isaacavazquez.com`, a domain with an extra "a" appearing exactly once in a 97-file codebase and resolving to a different host, so it now derives from `siteConfig.url`; the route gained the `error.tsx` that all seven sibling snapshot routes already had; the newsletter `h2` dropped from 44px to 34px so it no longer outranked the page's own primary content heading; the `7d movement` label now reads `windowDays` from the snapshot; `movementLabel` reported any non-positive value as "No gain" and now distinguishes no change from a decline (the snapshot currently holds zero negatives and eight zeros, so nothing was misreported live); the list now states "Showing the top 10 of 12"; the snapshot-notes section, the newsletter section, and the `aside` gained accessible names; repository links announce that they open on GitHub in a new tab; and the signup input ties its error to the field with `aria-invalid` and `aria-describedby`.

Fixed here but shared shell, so it landed for roughly forty routes at once: `ConditionalLayout` was labelling the sole `main` "Portfolio Content", which announced on every self-shell route including this one. The label and the redundant `role="main"` are gone, so `main` announces plainly.

Still open and not this route's code: the site footer's "Now" link measures 35x44, which clears WCAG 2.5.8 at 24x24 but misses the 44px floor this project sets for itself. The global reduced-motion rule is the blanket `0.01ms` kill on `*`, which costs nothing here because every transition on this page is color or border, but it is indiscriminate site-wide. The focus ring still depends on `--color-primary` and `--border-accent`, two legacy aliases marked for retirement.

## Commands worth running

No full critique has scored this surface yet, so `critique` is the natural next evaluate step if it gets real investment. Skip `audit` for now, since the findings above are closed and re-running it would only re-derive them. The bundled `detect.mjs` returns `[]` on this route's files; that is the Tailwind blind spot rather than a clean result, so do not read it as a pass.

## Status, 2026-09-22

This route moved off the bridge. It is composed from Catalog 97 bands inside `Catalog97ToolShell` and reads `--c97-*` directly, so the paragraphs above that describe `--home-*` names, hover-lift cards, radii, or the two-world header describe the state before this date. The contrast figures still need re-measuring against the surfaces the page now declares.

## Redesign, 2026-10-12

Written by the stage 2 G6 agent (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Reference, light). The decisions above that this pass did not reopen are the filtered view on purpose, stars as attention only, every figure carrying its window and status, the top ten with the total stated, and the `SoftwareApplication` schema. The status notes of 2026-09-22 and 2026-09-27 and the 2026-08-23 contrast figures describe the page before this date.

The page reads as a weekly index, like an almanac's top ten. It paints its own paper with `--abi-*` properties on `.abi-root` in the same graphite family as `/github-trending-pulse`, since it is a view of the same data, and redeclares the `--c97-*` tokens the newsletter form's `c97-field`, `c97-btn`, `c97-kicker`, and `c97-prose` read. The title and the repository names are Newsreader, figures are Fragment Mono, and the rest is Archivo. The movement figures print in the diff-addition green, and the agents bar is the only green bar in the topic comparison.

The first screen is the display title, the intro, one source line (source, snapshot time in Pacific, activity window, and how many of the repositories are measured over the full window), the links to the full agent table and to the AI dev tools directory, and the ranked list. The topic comparison and the "What the number does and does not mean" note sit side by side under a rule after the list, and the signup sits at the foot under another rule, two columns from 900px. The topic sentence now carries the agents' total stars. Print leaves the signup out.

A topic total sums every repository in the group, so a row whose group holds repositories on a partial window or a new baseline prints "N partial" under its figure in the ranked rows' status type, and one sentence under the list says what the mark means ("Where a total is marked partial, that many of its repositories were not measured over the full 7 days."). `getAgentBuildIndex` supplies the count as `unmeasuredCount`. Figures print to one decimal from a thousand up, so 3,687 reads +3.7K. A ranked row on a new baseline prints "Baseline" where its gain would be, as the trending board does, since "No change" would claim a measurement. The sentence about the agent group prints only when the snapshot holds that group. Under 640px the topic value column is 4.5rem, which fits "No change" and the partial mark on one line each. A space sits between the figure and the mark in the markup, so a reader without the stylesheet gets "+4.6K 2 partial" and not the count run into the figure. A repository counts as measured only with a reading on the first day of the window and one on the snapshot day, so a repository restored from an earlier run prints "Partial window" (`calculateWeeklyStars`).

Cut, and not to be restored. The four-stat panel (movement, repos, total stars, measured), the kicker labels, the bone and ink-blue sheets with their deckle and torn seams, the Generated, Source, and Activity window definition list (now the source line), and the paper plate with its offset under the form. `NewsletterSignup` was not touched, so the form keeps its labels, its error alert, and the honest 503 message the subscribe route returns while `RESEND_CONTACTS_API_KEY` is unset (`docs/TODO.md`).

Verified on 2026-10-12 against a production build in Chromium. The contrast sweep found no failures in either theme and the layout sweep reported 0 fail, 0 review, and 0 report. The first ranked row sits at y571 at 1440x900 and y834 at 390x844 (y1049 and y1223 before), and the email field at y2311 and y3195 (y3602 and y4092 before). The keyboard walk from the page top runs through the header, the two links, the ten repository links, and then the email field and the Join the list button, and an invalid email stops at the browser's own validation. `e2e/all-projects.spec.ts -g "/agent-build-index"` passed against the dev server and the production build. `src/app/agent-build-index/__tests__/page.test.tsx` holds the partial mark on the topic rows, the note under them with the agent sentence followed by the sentence that explains the mark, "Baseline" beside "New baseline" on a ranked row with no history, and the one-decimal figure, and the route is in `e2e/project-routes.spec.ts`. The partial mark, its sentence, and the 4.5rem column were not run in a browser. I did not check Safari's and Firefox's engines, a screen reader, or touch devices.
