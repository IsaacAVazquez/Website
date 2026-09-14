---
target: "route:/writing/topics/[topic]"
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/isaacvazquez/Website/route:/writing/topics/[topic]"
timestamp: 2026-09-14T20-10-27Z
slug: route-writing-topics-topic
---
Method: re-score after remediation. A: design review subagent (post-fix) · B: computed-value sweep subagent (post-fix), synthesized in the parent. Run 2026-09-14 on branch design/reading-investments-loop.

Mode: Read (unchanged). The baseline for this run is `2026-09-14T19-48-31Z__route-writing-topics-topic.md`, scored 21/40 with 0 P1 after the refuter lowered two of A's P1 findings to P2. A scored the pages at `a3d3d633` on the dev server. Samples were sports-fantasy (91 posts, which triggers the disclosure) and pm-workflows (18 posts, no disclosure).

## Design health score

| # | Heuristic | Score | Baseline | Key issue now |
|---|---|---|---|---|
| 1 | Visibility of system status | 3 | 3 | "91 articles" is accurate and the summary names the rest. The sort order is still never stated. |
| 2 | Match between system and real world | 3 | 2 | The description now names what fills the first screens, though PGA Tour and the sports-tool build posts go unmentioned. |
| 3 | User control and freedom | 3 | 2 | The closed page at 390 is 15,640px against 43,769px before, so the other-topic pills are reachable. There is still no jump or back-to-top control. |
| 4 | Consistency and standards | 2 | 2 | Unchanged. Cards lift on hover without being links, and card meta is uppercase sans where DESIGN.md calls for the mono readout. |
| 5 | Error prevention | 2 | 2 | Unchanged. Each card still has two links to the same URL. |
| 6 | Recognition rather than recall | 2 | 2 | Unchanged. There is no signal of which pieces matter. |
| 7 | Flexibility and efficiency | 1 | 1 | The disclosure shortens the page but does not filter, group or search. |
| 8 | Aesthetic and minimalist design | 2 | 2 | Shorter, but still 30 equal-weight cards with 3 to 4 line excerpts. |
| 9 | Error recovery | 2 | 2 | A bad topic returns 404 with noindex, on the same retro 404 page. |
| 10 | Help and documentation | 2 | 2 | Still no start-here pick and no ordering note. |
| Total | | 22/40 | 21/40 | Acceptable (55%) |

All ten heuristics applied. Open P0 is 0 and open P1 is 0.

## Resolved since the pre-fix snapshot

[P2] Sports & Fantasy rendered all 91 cards. Partly resolved. `topics/[topic]/page.tsx` renders 30 cards and puts 61 inside a closed `<details>`. The sweep measured the page at 7,777px at 1440 (from 20,889) and 15,640px at 390 (from 43,769). Opened, it measured 20,981 and 43,861. The remainder is 30 open cards with no grouping by `category`, still P2.

[P2] The Sports & Fantasy description matched 21 of its 91 cards. Mostly resolved. It now reads "Premier League, La Liga, and World Cup coverage, Formula 1 race notes, and the fantasy football and bracket models." (`blog-config.ts`). It leaves out the PGA Tour and sports-tool build posts in the first screens, and it is the only topic description not written in first person. That remainder is P3, and the wording is Isaac's call.

[P3] Missing-topic metadata merged `index, follow` after hydration. Resolved. A missing topic returns 404 and every robots tag says noindex.

## Remaining priority issues

[P2] The disclosure had no visual affordance and a label that did not change on open. Applied after measurement in `c6c38900`, not re-swept. The `home-inline-link` class sets `display: inline-flex`, which hides the native marker, so the summary now carries the existing ArrowRight icon (16px, `aria-hidden`) that rotates 90 degrees on open, plus a Show or Hide label ("Show the other 61 articles" and "Hide the other 61 articles") that swaps with `group-open`. It stays 44px tall. The parent confirmed this with a targeted check at 390 only.

[P2] 30 open cards with no grouping by `category` and no start-here band. The picks have to come from Isaac.

[P2] Cards lift like links, but only the title and "Read article" are links, so every card is two tab stops. Deliberately not changed.

[P3] The description's omissions and its drop from first person.

[P3] The Writing crumb sits lower and heavier than the current crumb, and the header rule stops short of the grid.

## Deliberate decisions

Hover-lift topic cards are unchanged. The two-world change on arriving from the Catalog 97 index stays, and only the header labels changed.

## False positives

The regression sweep reported 122 hit-test failures on sports-fantasy at 1024 and 1440 and 130 at 390 and 768. They are the links inside the closed disclosure, which have no box to hit, so they are not a defect. The detector reads nothing on this route because `topics/[topic]/page.tsx` is Tailwind utility classes only, and the in-page overlay is blocked by the enforcing CSP in `src/proxy.ts`.

## Regression sweep

Across 56 combinations covering both topic pages, four articles and `/investments` at 390, 768, 1024 and 1440 in light and dark, every page had one `main` and one `h1`, no horizontal overflow, 0 console errors, 0 failed requests and CLS 0.

## What was not checked

A screen reader's announcement of the disclosure state and the other five topics were not checked. The dark disclosure has computed styles but no clean screenshot, because two dark scroll captures caught the sticky header mid-transition. The arrow and label swap from `c6c38900` were not part of the sweep or the re-score.
