---
version: 1
slug: "route-fantasy-football"
primary_target: "route:/fantasy-football"
related_targets: ["src/app/fantasy-football/fantasy-football-client.tsx","src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx","src/app/fantasy-football/best-ball/draft-tracker/draft-tracker-client.tsx"]
---

# Fantasy Football

## Mode

Operate. The visitor is running a live draft against a clock, so scanability, stable density, and predictable structure outrank expression. Brand lives in precise details rather than in composition.

This holds for every route in the group, including the `/fantasy-football` board itself. The board looks like a landing page but its job is filtering and comparing players, not persuading anyone.

## Audience

Isaac, plus fantasy players arriving from search. PRODUCT.md is explicit that the tool fleet is personal work rather than the headline proof of the site, so this surface stays credible and available without being staged as the pitch. Do not redesign it into a marketing surface.

## Routes in scope

Four real routes, all snapshot-driven with `error.tsx` and `loading.tsx` in place. `/fantasy-football` is the rankings board, `/fantasy-football/draft-tracker` is the redraft tracker, `/fantasy-football/best-ball` is the best ball board, and `/fantasy-football/best-ball/draft-tracker` is the best ball tracker.

`/fantasy-football/tiers/[position]` and `/fantasy-football/rb-tiers` are pure `redirect()` stubs with no data fetching and no UI. They correctly have no error or loading boundary. Do not flag them for one.

## Decisions not to re-litigate

The board order comes from Underdog ADP for standard best ball formats and from a sourced Superflex consensus for Superflex, never from a locally computed adjustment. An Underdog ADP sitting at the undrafted floor is ignored in favor of consensus rank, because roughly a third of the best ball snapshot piles up at the last pick of the draft.

Reach and steal judgments need real market data. A consensus rank past 150 is a board position rather than a pick number, so it returns null and the pick goes unjudged instead of being scored against a number that was never a pick.

Best ball recommendation weights follow published Underdog advance-rate research, including scoring completed Week 17 game stacks, allowing same-team concentration up to four players, and a three-QB standard target. The weights themselves are calibrated judgment rather than measured coefficients.

## Verified state, 2026-08-06

Static audit scored 17/20, Good. The mechanical detector at `--scope layout` returns empty across the whole tree. Per the machine-level operating notes that means nothing matchable rather than clean, because this surface styles through Tailwind utilities and `globals.css` with no fantasy-specific stylesheet.

Theming is genuinely clean. Across 44 files there are zero hardcoded hex values, zero legacy `--surface-*` or `--color-*` tokens, zero `transition-all`, and zero `will-change`. Touch targets use `min-h-[48px]`. All four Framer Motion consumers call `useReducedMotion`. There are 16 `aria-live` or `role="status"` regions.

## Three false positives, already investigated

Do not re-raise these. Inputs look unlabeled to a same-line regex, but every one carries `id` on the following line with exactly one matching `htmlFor`. The `h1` looks missing to a `<h1[\s>]` pattern, because the tag sits alone on its line with the attributes below it. The two tiers routes look like data routes missing their boundaries, but they are redirect stubs.

## Commands worth running

`adapt` would settle the responsive and performance scores, which are provisional because the 2026-08-06 audit was static only and never booted a browser.

`layout` was requested on 2026-08-06 and deferred rather than run. The mechanical half came back empty and the rendered half, meaning the squint test, grouping, rhythm, and adaptation across viewports, was never performed. Any future layout pass starts there with the dev server up and both viewports captured.
