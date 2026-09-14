---
target: "route:/writing/topics/[topic]"
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/isaacvazquez/Website/route:/writing/topics/[topic]"
timestamp: 2026-09-14T19-48-31Z
slug: route-writing-topics-topic
closed: true
---
Method: dual-agent (A: design review subagent · B: computed-value sweep subagent), synthesized in the parent, with an adversarial refuter on every P0 and P1. Run 2026-09-14 against the dev server on main at ecd6517d, before remediation.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Breadcrumb current item, active Writing nav and an accurate count ("18 articles", "91 articles"). The sort order is never stated. |
| 2 | Match system / real world | 3 | Plain labels and dates, but the Sports & Fantasy description does not match most of what is listed under it. |
| 3 | User control and freedom | 2 | Breadcrumb back to Writing at the top and other-topic pills at the bottom, which on Sports & Fantasy is 43,769px down at 390 with no back-to-top, jump or filter. |
| 4 | Consistency and standards | 2 | The Writing crumb uses `.home-inline-link` and sits lower and heavier than the current crumb. Cards lift on hover like links but are not links. Card meta is uppercase sans where DESIGN.md calls for the mono readout. |
| 5 | Error prevention | 2 | Two links per card to the same URL, and a whole-card hover lift that implies a click target the card does not have. |
| 6 | Recognition rather than recall | 2 | Every title and excerpt is visible, but with no signal of which pieces matter the visitor has to read and hold 18 or 91 excerpts to choose. |
| 7 | Flexibility and efficiency | 1 | No search, sort, filter, grouping or page limit, while the `/writing` index one click away has all of them. |
| 8 | Aesthetic and minimalist design | 2 | Clean cards, but all at equal weight with 3 to 4 line excerpts, and the sports page is about 52 phone screens. |
| 9 | Error recovery | 2 | Unknown topics call `notFound()`. No empty state is needed for the seven static topics. |
| 10 | Help and documentation | 2 | The description explains the thread, but there is no start-here pick or note on how the list is ordered. |
| Total | | 21/40 | Acceptable (52.5%) |

## Design Specificity Verdict

LLM assessment. This is a standard category-archive template. Kicker, big label, description, count, a two-column grid of identical cards (date, reading time, title, excerpt, "Read article") and a row of other-topic pills could sit on any blog. The one authored element is the first-person description from `blog-config.ts`, for example "The way I use AI across discovery, specs, research synthesis, roadmapping, and stakeholder work when the job is to make the next decision clearer." Nothing tells the visitor this is one person's thread of thinking, from which piece started it, to which he would defend, to how the pieces build on each other. The Working Instrument's signature readout (Fragment Mono with tabular figures) is not used for dates and reading times, so even the system's own identity is thin here.

Deterministic scan. `impeccable detect` exited 2 with 18 findings across the three surfaces in this run, and zero of them are on the topic route, because `src/app/writing/topics/[topic]/page.tsx` is pure Tailwind utility classes with no literal font sizes, radii or inline borders for the detector to read. No DEGRADED banner printed. The zero means the detector cannot see this surface, and every finding below came from source reads and captures.

Visual overlays. No user-visible overlay is available. Injection was blocked by the site's enforcing CSP, which fired a securitypolicyviolation on script-src-elem. The computed-value sweep is the fallback signal, with its contrast gate reproducing 16.29:1 in light and 15.28:1 in dark, and A's captures measured the page heights and card counts used below.

## Overall Impression

The header works. A 67px label over a first-person line reads like someone with a point of view about the topic. Everything under it is a flat, newest-first feed, which PRODUCT.md says the site is not meant to be, and on Sports & Fantasy the feed runs 91 cards deep under a description that names fantasy models while the first screens are Formula 1 and World Cup coverage. The single biggest opportunity is a short start-here band that Isaac picks for each topic, with the dated archive underneath behind the same slice-and-reveal the index already uses.

## What's Working

The descriptions are in his voice and name what each thread is for, which gives a visitor arriving from an AI answer an immediate reason to believe a person owns the page.

The counts are honest and consistent. The header count equals the rendered cards and the index tab counts, 18 for PM Workflows and 91 for Sports & Fantasy.

The touch basics hold. "Read article" links and topic pills measure 44px tall at 390, there is no horizontal scroll at 390, and each card title is an h2, so a screen reader's heading list works as a table of contents for the thread.

## Priority Issues

[P2] Sports & Fantasy renders all 91 cards with no page limit.
`topics/[topic]/page.tsx:118-143` maps every post with no cap, grouping or control, which measured 20,889px at 1440 and 43,769px at 390, about 52 phone screens, with the other-topic pills at the very bottom. The other topics run from 7 to 36 cards. A rated this P1, and the refuter set it at P2. The pieces that show his thinking (the draft tools, the trade calculator, the score pool engine) are mixed in with race recaps a product peer will not scroll past.
Fix: reuse the index's settled pattern, a first slice with one "Show the rest" control, or group by the `category` frontmatter under h2 sub-headings with a jump row at the top, and repeat "Other writing topics" after the first group.
Suggested command: /impeccable layout

[P2] The Sports & Fantasy description matches 21 of its 91 cards.
The description is "Fantasy football models, bracket work, and the sports analytics experiments that still hold up." (`blog-config.ts:77-80`). It matched 21 of the 91 cards. In A's 1440 capture, 25 of the first 32 cards were Formula 1 race notes or World Cup coverage, which the description never names, and "that still hold up" claims a curation the page does not do. A rated this P1, and the refuter set it at P2.
Fix: rewrite the description to name what is in the thread, in his voice, for example "Formula 1 race notes, World Cup coverage, fantasy football models, and the sports dashboards I built alongside them." The wording is Isaac's call.
Suggested command: /impeccable clarify

[P2] Nothing on the page tells a visitor which piece to read first.
Order is newest first at equal weight and the sort is never stated. On PM Workflows seven consecutive cards read "APR 7, 2026", which reads as a batch publish. `blog-config.ts` already holds hand-picked lists like `HOMEPAGE_PROOF_OF_WORK_SLUGS`, but topic pages use nothing like them.
Fix: add an optional `startHere` slug list to each `BLOG_TOPIC_PAGES` entry and render those two or three as a band above the grid, with a one-line "Newest first" label on the grid. Leave the band out on any topic where Isaac has not chosen.
Suggested command: /impeccable layout

[P2] Cards act like links but are not, and each post is linked twice.
`.home-card` lifts 4px and gains a shadow on hover and focus-within (`globals.css:1550-1555`), but only the title and "Read article" are links, both to the same URL. PM Workflows has 36 article links for 18 posts, so a keyboard user tabs twice per card and a screen reader's link list doubles.
Fix: stretch the title link over the card (`relative` on the article, `after:absolute after:inset-0` on the link), drop "Read article" or take it out of the tab order, and keep one focus ring on the card.
Suggested command: /impeccable harden

[P3] The breadcrumb and header rule are slightly off.
The Writing crumb uses `.home-inline-link` (`page.tsx:95`), which brings a 0.5rem top margin and 600 weight, so it sits lower than "/" and the current crumb (top 102px and 33px tall against 105px and 26px at 1440). The header's bottom rule is capped by `max-w-5xl` at 1024px while the grid spans 1312px, so the rule stops short.
Fix: use the article breadcrumb's muted link style and move the border to a full-width element.
Suggested command: /impeccable polish

## Persona Red Flags

A product peer arriving from an AI answer lands on PM Workflows and sees Decision Lab and three portfolio-style posts dated Apr 29, then seven posts dated Apr 7. Nothing marks which of the eighteen Isaac would stand behind, so the page reads like a content feed.

Sam (screen reader, keyboard) gets 36 links for 18 posts, so every card is announced twice, and the card-level lift is a visual-only cue. The date is the first thing read on every card, ahead of the title.

Casey (390, one hand) faces 52 screens on Sports & Fantasy with no back-to-top, no jump list and no sign of how far down the fantasy tools are. Each card is 394 to 417px tall, so a phone screen shows about two.

Jordan (first-timer) is never told the list is newest first, sees "Read article" repeat the title link right above it, and on sports does not find the fantasy models the description names on the first screens.

## Minor Observations

Card meta ("JUN 5, 2026 · 5 MIN READ") is uppercase 12px semibold Instrument Sans with tracking (`page.tsx:121`), where DESIGN.md's readout convention for measured values is Fragment Mono at 400 with tabular figures. Cards carry a resting `--shadow-md` against the Flat-By-Default Rule. Card titles are 34px under a 67px h1 at 1440, but 25px under 35px at 390, which is close. The "Other writing topics" pills are navigation links styled as chips. The topic route has no `error.tsx`, which only matters if it ever fetches data. Arriving from the Catalog 97 index's topic grid carries the same world change as articles, recorded in the `/writing/[slug]` snapshot from this run.

A did not load a bad topic, zoom to 200%, or measure every text node in dark mode, where the captures showed no contrast problems by eye.

## Questions to Consider

If a peer reads only one piece from PM Workflows, which one does Isaac want it to be, and why doesn't the page know?

Is Sports & Fantasy one thread, or three (Formula 1, World Cup, fantasy tools) sharing a label because the archive needed a bucket?

Should a topic page be a short reading list he curates and orders, with the dated archive underneath, which would make it the one place on the site where the order itself shows judgment?
