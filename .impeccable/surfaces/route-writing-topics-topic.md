---
version: 1
slug: "route-writing-topics-topic"
primary_target: "route:/writing/topics/[topic]"
related_targets: ["src/app/writing/topics/[topic]/page.tsx","src/lib/blog-config.ts"]
---

# Writing topic pages surface brief
Checked against the code on 2026-11-02.

The `/writing/topics/[topic]` route, rendered by `src/app/writing/topics/[topic]/page.tsx`, with topic labels, descriptions and membership in `src/lib/blog-config.ts`. There are seven static topics, and on 2026-09-14 Sports & Fantasy held 91 posts and PM Workflows 18.

## Mode and audience

Mode is Read. The audience is a product peer or a visitor from an AI answer who wants one thread of Isaac's thinking and has to pick what to read, including a one-handed phone reader for whom page length is the main cost.

## Visual world

Topic pages are Catalog 97, as shipped. They render inside `Catalog97ToolShell` and their components read `--c97-*` tokens directly. `DESIGN.md` now describes Catalog 97 and governs them. Arriving from the index's topic grid does not change world, since both pages share one shell. Contrast figures below were measured before the 2026-09-27 close-out and may need re-measuring.

## Decisions not to re-litigate (settled 2026-09-14)

Hover-lift topic cards are unchanged, even though only the title and "Read article" are links. The two-world header stays, and only its labels changed. A topic page shows its first 30 cards and puts the rest in a `<details>` disclosure. The `home-inline-link` class sets `display: inline-flex`, which hides the native marker, so the summary carries the existing ArrowRight icon (16px, `aria-hidden`) that rotates 90 degrees on open, plus a Show or Hide label that swaps with `group-open`. It stays 44px tall. Do not remove the arrow on the assumption that the native triangle will show.

## Verified state, with measured evidence

A post-fix computed-value sweep on 2026-09-14 found sports-fantasy showing 30 of 91 cards with 61 in a closed disclosure, at a page height of 7,777px at 1440 (from 20,889) and 15,640px at 390 (from 43,769). Opened, it measured 20,981 and 43,861. The Sports & Fantasy description now reads "Premier League, La Liga, and World Cup coverage, Formula 1 race notes, and the fantasy football and bracket models." A missing topic returns 404 and every robots tag says noindex. Across 56 combinations of these pages, four articles and `/investments` at 390, 768, 1024 and 1440 in light and dark, the regression sweep found one `main` and one `h1`, no overflow, 0 console errors, 0 failed requests and CLS 0.

The arrow and the Show or Hide label landed after measurement in `c6c38900` and were checked by a targeted check in the parent at 390, not by the sweep or the re-score.

## False positives worth not re-deriving

The regression sweep reports 122 hit-test failures on sports-fantasy at 1024 and 1440 and 130 at 390 and 768. They are the links inside the closed disclosure. `impeccable detect` returns nothing on this route because the page is Tailwind utility classes only, so a zero from the detector says nothing about the surface. The in-page overlay is blocked by the enforcing CSP in `src/proxy.ts`. `critique-storage latest` on a `route:` target closes the snapshot it reads, so read snapshots by filename or with `trend`. As of 2026-11-02, outside production the CSP in `src/proxy.ts` has allowed `http://localhost:8400` since 2026-09-24 so Impeccable live mode can load its picker, which means a dev server may now load the overlay. The snapshots under `.impeccable/critique/` were untracked on 2026-10-02 (c6ee4f4ed) and are gitignored, so the snapshot files named in this brief are not in the repository.

## Still open

[P2] 30 open cards with no grouping by `category` and no start-here band, and the picks for a start-here band have to come from Isaac. [P2] Cards lift like links, but each post is two links and two tab stops. [P3] The Sports & Fantasy description leaves out the PGA Tour and sports-tool build posts in the first screens, and it is the only topic description not in first person, so the wording is Isaac's call. [P3] The Writing crumb sits lower and heavier than the current crumb, and the header rule stops short of the grid. The sort order is never stated. A screen reader's announcement of the disclosure state and the other five topics were not checked. As of 2026-11-02 four of the seven topic descriptions are not in first person, Sports & Fantasy, Systems & Quality, Signals & Commentary and Space & Experiments, and the last three have read the same since 2026-04-17, so Sports & Fantasy was not the only one on 2026-09-14 either.

## Scores

Pre-fix snapshot `2026-09-14T19-48-31Z__route-writing-topics-topic.md` scored 21/40 (52.5%, Acceptable) with 0 P1 after the refuter lowered two findings, and it is closed. Post-fix snapshot `2026-09-14T20-10-27Z__route-writing-topics-topic.md` scores 22/40 (55%, Acceptable) with 0 P0 and 0 P1, all ten heuristics applied. The fixes landed in `38f698ae`, `a3d3d633` and `c6c38900`.

## Commands worth running

`layout` for grouping or a start-here band once Isaac has picked, `harden` for the doubled card links if the hover-lift decision is reopened, and `polish` last. Never `document` from here.

## Status, 2026-09-22

This route moved off the bridge. It is composed from Catalog 97 bands inside `Catalog97ToolShell` and reads `--c97-*` directly, so the paragraphs above that describe `--home-*` names, hover-lift cards, radii, or the two-world header describe the state before this date. The contrast figures still need re-measuring against the surfaces the page now declares.

## Status, 2026-11-02

Since 2026-09-22 (46d8bd40d) each post is one ledger row (`c97-row c97-row-stack-sm`) whose only link is its title, so the cards, the "Read article" link, and the two tab stops per post are gone, and the `harden` item for doubled card links has nothing left to fix. The same change moved the disclosure onto `details.c97-disclosure`, which hides the native marker on purpose and swaps the summary between "Show the other N articles" and "Hide the other N articles" through `data-when` spans. The `home-inline-link` class, the ArrowRight icon and `group-open` are gone, so the 2026-09-14 rule about keeping the arrow no longer applies. The page reads `c97-*` classes, so the Tailwind reason given for the empty detector result is out of date. Sports & Fantasy held 92 posts and PM Workflows 18 on 2026-11-02, counted from the `archiveBucket` and `cluster` frontmatter in `content/blog/`. The other six topics print as a `ul.c97-segmented` of `.c97-microlink`s on a bone deckle band headed "Other writing topics", with the row gap set to `--c97-sp-5` inline, because the class's own `--c97-sp-3` lets wrapped 50px links overlap on a phone. `e2e/project-routes.spec.ts` holds `/writing/topics/sports-fantasy` to the header's edges at 390, 1440 and 1920.
