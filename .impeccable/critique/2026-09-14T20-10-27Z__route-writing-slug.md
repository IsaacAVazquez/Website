---
target: "route:/writing/[slug]"
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/isaacvazquez/Website/route:/writing/[slug]"
timestamp: 2026-09-14T20-10-27Z
slug: route-writing-slug
---
Method: re-score after remediation. A: design review subagent (post-fix) · B: computed-value sweep subagent (post-fix), synthesized in the parent. Run 2026-09-14 on branch design/reading-investments-loop.

Mode: Read (unchanged). The baseline for this run is `2026-09-14T19-48-31Z__route-writing-slug.md`, scored 25/40 with 2 P1 before remediation. A scored the pages at `a3d3d633` on the dev server. The remediation commits are `312ee8fc`, `38f698ae` and `a3d3d633`, and `c6c38900` landed after measurement without touching this route.

## Design health score

| # | Heuristic | Score | Baseline | Key issue now |
|---|---|---|---|---|
| 1 | Visibility of system status | 3 | 3 | The copy button is visible and has a `role="status"` node. When the clipboard write fails, nothing is shown. |
| 2 | Match between system and real world | 3 | 3 | Previous and Next still cross topics and never say the order is by date, which was deliberately left. |
| 3 | User control and freedom | 3 | 3 | At 390 the breadcrumb still stacks the topic into a narrow column. |
| 4 | Consistency and standards | 3 | 2 | Labels now agree ("Work" and "Résumé" in both headers), the avatar is round at 56 by 56, and the gradient hero is gone. The two navs still differ in set and order, and tag chips are still inert. |
| 5 | Error prevention | 3 | 3 | Code blocks at 390 still scroll sideways, 551px of content in a 354px box. |
| 6 | Recognition rather than recall | 3 | 3 | Unchanged. |
| 7 | Flexibility and efficiency | 3 | 2 | "Copy code" works, reads clearly and sits clear of the code. There are still no heading anchors. |
| 8 | Aesthetic and minimalist design | 2 | 2 | The duplicate title hero is gone, but the ending is unchanged and photo posts still start the body below the first screen. |
| 9 | Error recovery | 2 | 2 | A bad slug returns 404 with noindex, on the global retro 404 page that matches neither design world. |
| 10 | Help and documentation | 2 | 2 | The byline still has no role, and the credibility frame arrives only in the end bio. |
| Total | | 27/40 | 25/40 | Acceptable (67.5%) |

All ten heuristics applied. Open P0 is 0 and open P1 is 0.

## Resolved since the pre-fix snapshot

[P1] Cover alt text did not describe the image. Resolved by a decision Isaac made on 2026-09-14 after all 57 fetched covers were viewed. The 31 that showed the wrong subject were dropped, so the post shows no hero, its plan entry in `scripts/data/articleCoverImages.ts` is `editorial-card`, and the file and credit are removed. The other 26 were kept with alts written from what is visible, and their plan entries are `manual`. The plan diff adds 26 `manual` and 31 `editorial-card` lines, and 31 cover files were deleted. The sweep loaded 8 dropped-cover posts, and every one returned 200 with no hero, `og:image` still set, and no request for a deleted cover path. It also read 6 kept alts, and each reads as an alt, for example "Satellite view of the Spa-Francorchamps circuit winding through forest and farmland" on the Belgian Grand Prix post. No deleted cover path is referenced on `/writing` or `/`.

[P1] The generated social card rendered as the in-page hero. Resolved. `page.tsx` renders the hero only for a real photo. On the investment platform post, which has no photo, the body starts at y 635 at 1440 and y 745 at 390. Photo posts keep the hero and the credit, and the Belgian Grand Prix post measured a 958 by 502 hero with the Planet Labs credit at 1440.

[P2] The code copy button measured 1.06:1 and was never announced. Resolved. The label reads 16.41:1 in light and 15.49:1 in dark, the button is 44px tall, its bottom edge clears the first code line by 11px, and it announces "Code copied to clipboard" through a status region.

[P3] The article header used Projects and Resume. Resolved. The header and the breadcrumbs read Work and Résumé.

[P3] Headshots rendered as ovals at 56 by 83. Resolved. Both instances measure 56 by 56 with a round radius at 1440 and 390.

[P3] Missing-post metadata merged `index, follow` after hydration. Resolved. A missing post returns 404 and every robots tag says noindex. There are two tags (`noindex` and `noindex, follow`), both before and after hydration.

## Remaining priority issues

[P2] The ending is still five separate what-next blocks before the footer, and the related heading ("If this piece was useful, these should stack on top of it.") and the bio line ("I write to work through ideas, not to summarize them.") break WRITING_VOICE.md. The ending was deliberately not changed in this loop.

[P2] Body type is 16px in muted ink, below DESIGN.md's body token. Deliberately not changed.

[P2] The two headers for one site now share labels, but the nav set and order still differ between the Catalog 97 index and the article. The two-world header itself stays by decision.

[P2] Photo posts still put the first paragraph below the first screen, at y 1183 on a 900px viewport for rb-vs-wr and y 1174 at 1440 for the Belgian Grand Prix post. Capping the hero height would fix it.

[P3] A failed clipboard write gives no feedback, because the catch in `ArticleCodeCopy.tsx` swallows the error.

[P3] Not-found pages carry two robots tags. Both say noindex, so this is harmless, and the source of the second tag was not traced.

[P3] The breadcrumb stacks at 390, tag chips look interactive and do nothing, and the 404 page's tone matches neither world. On `/writing`, `Catalog97Writing.tsx` shows a flat field for any featured post without a photo, which will happen more often with 31 fewer photos.

## Applied after measurement

None of the four polish items in `c6c38900` touch this route.

## Deliberate decisions

The two-world header between Catalog 97 routes and articles stays, and only its labels changed. Body type size and measure are unchanged. The article ending, Previous and Next across topics, and the hover-lift topic cards are unchanged.

## Regression sweep

Across 56 combinations of four articles, two topic pages and `/investments` at 390, 768, 1024 and 1440 in light and dark, every page had one `main` and one `h1`, no horizontal overflow, 0 console errors, 0 failed requests and CLS 0. The 82 console entries were all dev-server warnings about preloaded resources not used in time.

## What was not checked

A screen reader, 200% zoom, hover states, and the author icon hit areas were not checked. The copy status text was read only in a context where the clipboard write failed, and "Copied" was seen on the button with permission granted. Of the 26 kept alts, the sweep read 6 and A compared 2 against their photos. The detector is blind to Tailwind-only markup, and the in-page overlay is blocked by the enforcing CSP in `src/proxy.ts`, so no overlay or detector finding stands behind this score.
