---
version: 1
slug: "route-agent-build-index"
primary_target: "route:/agent-build-index"
related_targets: ["src/app/agent-build-index/page.tsx","src/lib/agentBuildIndex.ts","src/components/newsletter/NewsletterSignup.tsx"]
---

# Agent Build Index

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
