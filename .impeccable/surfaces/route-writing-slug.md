---
version: 1
slug: "route-writing-slug"
primary_target: "route:/writing/[slug]"
related_targets: ["src/app/writing/[slug]/page.tsx","src/components/analytics/ArticleCodeCopy.tsx","src/components/ui/AuthorBio.tsx","scripts/data/articleCoverImages.ts"]
---

# Article reading view surface brief

The `/writing/[slug]` route, rendered by `src/app/writing/[slug]/page.tsx`, with the code copy control in `src/components/analytics/ArticleCodeCopy.tsx`, the end bio in `src/components/ui/AuthorBio.tsx`, and the cover plan in `scripts/data/articleCoverImages.ts`.

## Mode and audience

Mode is Read, so structure for comprehension comes first. The audience is a Haas or product peer arriving from LinkedIn or an AI answer who wants to see how Isaac reasons, plus keyboard, screen reader and one-handed phone readers. The job is to reach the argument quickly and read it.

## Visual world

Articles are Catalog 97 through the bridge as of 2026-09-16. They render inside `Catalog97ToolShell`, their components still read `--home-*` names, and the bridge block in `src/app/catalog97.css` aliases those onto Catalog 97 values with every `--radius-*` token at 0 and every `--shadow-*` token at `none`. `DESIGN.md` still describes the Working Instrument and does not govern them. Before the bridge the header changed world on the click in from `/writing`, and the decision recorded below was about that change. The index and the article now share one shell, so that decision no longer has anything to decide. Contrast figures below were measured before the bridge and need re-measuring.

## Decisions not to re-litigate (settled 2026-09-14)

The two-world header between Catalog 97 routes and articles stays, and only its labels changed, to Work and Résumé. Body type size and measure are unchanged, at 16px in muted ink. The article ending, Previous and Next across topics, and the hover-lift topic cards are unchanged.

Covers follow a decision Isaac made on 2026-09-14 after all 57 fetched covers were viewed. The 31 that showed the wrong subject were dropped, so the post shows no hero, its plan entry is `editorial-card`, and the file and credit are removed. The other 26 were kept with alts written from what is visible, and their plan entries are `manual`. A post without a real photo renders no hero at all, and the generated `/writing/<slug>/opengraph-image` stays as metadata only.

## Verified state, with measured evidence

A post-fix computed-value sweep on 2026-09-14 found that posts without a photo render no hero, with the body starting at y 635 at 1440 and y 745 at 390 on the investment platform post. Photo posts keep the hero and credit. Eight sampled dropped-cover posts returned 200 with no hero and `og:image` still set, and no deleted cover path is referenced or requested on those posts, `/writing` or `/`. Six sampled kept alts read as alts. The copy button reads 16.41:1 in light and 15.49:1 in dark, is 44px tall, clears the first code line by 11px, and announces "Code copied to clipboard". Nav and breadcrumb labels read Work and Résumé. Both headshots are 56 by 56 and round. A missing post returns 404 and every robots tag says noindex.

Across 56 combinations of four articles, two topic pages and `/investments` at 390, 768, 1024 and 1440 in light and dark, the regression sweep found one `main` and one `h1` everywhere, no overflow, 0 console errors, 0 failed requests and CLS 0.

## False positives worth not re-deriving

The in-page detector overlay is blocked by the enforcing CSP in `src/proxy.ts`. The detector reads nothing useful from Tailwind utility markup, and its broken-image warning in `src/app/writing/[slug]/__tests__/page-content.test.tsx` is a test fixture that never ships. Not-found pages carry two robots tags (`noindex` and `noindex, follow`), and both say noindex, so that is not an indexing bug. The regression sweep's console entries on articles are dev-server warnings about preloaded resources, not errors. `critique-storage latest` on a `route:` target closes the snapshot it reads, so read snapshots by filename or with `trend`.

## Still open

[P2] The ending is five separate what-next blocks before the footer, and the related heading ("If this piece was useful, these should stack on top of it.") and the bio line ("I write to work through ideas, not to summarize them.") break WRITING_VOICE.md. [P2] Body type sits below DESIGN.md's body token, kept by decision. [P2] The article nav and the Catalog 97 nav still differ in set and order. [P2] Photo posts put the first paragraph below the first screen, at y 1183 on a 900px viewport for rb-vs-wr. [P3] A failed clipboard write shows nothing. [P3] The breadcrumb stacks at 390, tag chips look interactive and do nothing, and the global 404 page matches neither world. A screen reader, 200% zoom, hover states and the other 20 kept alts were not checked.

## Scores

Pre-fix snapshot `2026-09-14T19-48-31Z__route-writing-slug.md` scored 25/40 (62.5%, Acceptable) with 2 P1, and it is closed. Post-fix snapshot `2026-09-14T20-10-27Z__route-writing-slug.md` scores 27/40 (67.5%, Acceptable) with 0 P0 and 0 P1, all ten heuristics applied. The fixes landed in `312ee8fc`, `38f698ae` and `a3d3d633`.

## Commands worth running

`critique` and `audit` to find, then only what the findings name, then `polish` last. `distill` fits the ending if Isaac decides to change it, and `typeset` fits the body if the size decision is reopened. Never `document` from here.

## Status, 2026-09-22

This route moved off the bridge. It is composed from Catalog 97 bands inside `Catalog97ToolShell` and reads `--c97-*` directly, so the paragraphs above that describe `--home-*` names, hover-lift cards, radii, or the two-world header describe the state before this date. The contrast figures still need re-measuring against the surfaces the page now declares.
