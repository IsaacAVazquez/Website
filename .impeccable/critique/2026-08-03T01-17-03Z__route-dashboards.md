---
target: "/dashboards (route:/dashboards)"
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
timestamp: 2026-08-03T01-17-03Z
slug: route-dashboards
---
⚠️ DEGRADED: single-context (session config gates subagent use on an explicit user request; the request to run them was declined, so Assessment A and B ran sequentially in one context)

Assessment A was completed and recorded from source and live browser inspection before any detector output was run, which preserves the ordering rule the command cares about most.

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | The page talks about snapshot freshness in three places and never shows any. The status tile describes a convention instead of reporting a state. |
| 2 | Match System / Real World | 2 | The h1 says all 33 instruments read from a committed snapshot. At least 7 of them do not. |
| 3 | User Control and Freedom | 3 | Nothing traps the visitor. There is no state to undo and browser back always works. |
| 4 | Consistency and Standards | 2 | The status tile is pixel-identical to 33 clickable tiles, and `.c97-tile` is the only interactive primitive in the system with no hover rule. |
| 5 | Error Prevention | 2 | The one error available on this page, clicking the inert status tile, is the one the page's own construction creates and does not prevent. |
| 6 | Recognition Rather Than Recall | 1 | 33 options in one flat run. No search, no filter, no group headings, and color carries no information. |
| 7 | Flexibility and Efficiency | 1 | A returning visitor who knows exactly which tool they want has no faster path than scanning all 33. `/portfolio` has a category filter on the same buckets; this route does not. |
| 8 | Aesthetic and Minimalist Design | 3 | The mosaic is genuinely excellent. The "How the data works" heading renders at 11px and reads as a stray label, and the category kicker repeats 11 times in a row under Sports. |
| 9 | Error Recovery | 3 | `error.tsx` follows the project convention with a bespoke `surfaceName`, and `RouteErrorBoundary` exposes a retry. |
| 10 | Help and Documentation | 2 | The help is real and well written, and it sits below 33 tiles, which is 13 mobile screens down. Almost nobody reaches it. |
| **Total** | | **21/40** | **Acceptable** |

All ten heuristics apply. This is an Operate surface, so 7 and 10 are not eligible for the Persuade/Experience `n/a` exemption, and both are load-bearing here.

#### Design Specificity Verdict

**LLM assessment.** This is authored, and not marginally so. The mosaic renders as inlaid color fields with a hairline of paper between them, no border, no radius, no shadow anywhere in it, each tile declaring its own surface through a data attribute. A category-interchangeable version of this page would be white cards with icons, a drop shadow, and a hover lift. Nothing here could be lifted onto an unrelated product without the product changing to suit it. The Anton plate reading `33` beside an h1 that derives the same 33 from the data is the kind of detail that only happens when someone is paying attention. The tobacco line stating that every panel would rather show a stale number with a date on it than nothing at all is a real engineering position, stated in the product's own voice.

The problem is not the visual world. It is that the visual world is doing Persuade work on a surface whose brief commits to Operate, and whose stated job is to find the right instrument and open it. The four-surface color cycle is the clearest case. It runs `pine, camel, bone, camel` across the tiles in index order, which deliberately cuts across the eight category groups, so two adjacent tiles from different categories often share a color while the eleven Sports tiles are painted three different ways. Color is the loudest signal on the page and it carries no information at all. The only grouping signal that survives is an 11px uppercase kicker that repeats verbatim on every tile in a run.

**Deterministic scan.** `detect.mjs --json` returned `[]` with exit 0 on all three inputs I gave it: the component, `src/components/catalog97/`, and `src/app/catalog97.css`. I am not reporting that as a clean bill of health. This project styles through a shared stylesheet and data attributes, and the CLI detector matches regexes against literal CSS values in source text, so on this codebase a zero means there was nothing for it to match rather than that nothing is wrong. Every finding below came from reading source and measuring the live DOM.

**Visual overlays.** None. No user-visible overlay is available for this run. I served the in-page detector bundle from a scratch directory on port 7391 and injected it, and the site's own enforcing Content Security Policy blocked it: `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://unpkg.com`. That is the site behaving correctly and I would not change it to accommodate the tool. Nothing was written into the repository and the scratch server was stopped.

#### Overall Impression

This is the best-looking index I have seen in this repo and it is the worst-performing one at its own stated job. The craft floor is high, the type scale is respected, the tokens are disciplined, and the contrast holds everywhere I measured. Then it asks a visitor to find one specific instrument among 33 identical-shaped tiles with no search, no filter, and no group headings, and on a phone it makes them scroll 13.3 screens to do it.

The single biggest opportunity is to make the eight categories that already exist in the data do visible work on the page. They are computed, they are correct, they are attached to every tile, and right now they are spent on a repeated 11px label while the color cycle actively works against them.

#### What's Working

The mosaic as a compositional device is the strongest thing on the route. Full-bleed fields with a hairline gap read as inlaid panels rather than as cards, and the decision to have each tile declare its own surface rather than inherit one is what makes the hairline gaps read as paper showing through. The four-wide cycle with one Pine in it is also a considered fix to a real problem, and the reasoning is recorded in the component. I disagree with what the cycle costs, not with the thinking behind it.

The honesty about data is genuine and rare. The component comment states outright that the design called for a last-pull timestamp, that no per-tool timestamp is readable at render time, and that inventing one is barred, so the panel states the convention instead. That is the correct call and most people would have printed a plausible number.

The count is live. `tools.length` drives both the h1 and the Anton plate, so the headline number and the plate can never drift from the data or from each other.

#### Priority Issues

- **[P1] 33 options in one flat run, on a surface whose mode is Operate**
  - **Why it matters**: The brief commits this route to Operate and names the job as finding the right instrument and opening it. Working memory tops out around four items at a decision point. This is 33, presented with no search, no filter, no group headings, and no jump links. The eight categories exist in the data and are attached to every tile, and the only place they surface is an 11px kicker that repeats verbatim, eleven times in a row under Sports. Meanwhile the four-surface color cycle runs across group boundaries, so the loudest visual signal on the page is uncorrelated with the only organizing structure the page has. On a 390px viewport the page measures 11,262px tall, which is 13.3 screens, and the "How the data works" section and the CTA both sit underneath all of it.
  - **Fix**: Break the mosaic into eight labelled runs, one per category, each opening with a real section heading rather than a per-tile kicker, and drop the kicker from the tiles once the run above them names the group. If the color cycle is worth keeping, restart it per group so the first tile of every run shares a color and the eye can find the seams. `/portfolio` already renders a category filter over the same `classifyToolSlug` buckets, so the same control on this route would be consistent rather than novel.
  - **Suggested command**: `/impeccable layout`

- **[P1] The h1 makes a claim about the data that is not true for at least 7 of the 33 tools**
  - **Why it matters**: The h1 reads "33 instruments, all reading from a committed snapshot." Five of the tiles link to browser-persisted localStorage tools, which are Food Map, Museum Log, Wine Cellar, Recipe Finder and Travel Planner at `/travel`, and `CLAUDE.md` documents all five as keeping state in localStorage through dedicated hooks. Two more, Budget Planner and Rent vs. Buy Calculator, are calculators under `/fintech-tools/*` that compute from user input. None of those seven read from a committed snapshot. The same overclaim is repeated in the route's meta description and again in the footer colophon. This matters more here than it would elsewhere because the page's whole argument is that it does not invent data, and the status tile refuses to print a timestamp on exactly that principle. An overclaim in the h1 undercuts the tobacco line four bands below it.
  - **Fix**: Either narrow the claim so it is true, along the lines of naming what the snapshot-backed ones do without saying "all," or split the mosaic so the snapshot-backed instruments and the browser-persisted tools are separate runs and the claim applies to the run it describes. The second option also does real work on the issue above.
  - **Suggested command**: `/impeccable clarify`

- **[P1] The status tile is pixel-identical to 33 clickable tiles and is not clickable**
  - **Why it matters**: I measured the status tile against a real bone tool tile and they match on background, padding, min-height, font family, text decoration, and heading size at 26px. The only computed difference is `cursor: auto` against `cursor: pointer`. Bone is one of the four cycle surfaces, so it is not even a reserved color. It carries a kicker, a serif heading, and a body paragraph in the same arrangement as a tool tile, and it sits in the same grid flow as the 34th item. A mouse user learns it is inert only by hovering, a touch user learns by tapping and getting nothing, and a keyboard user tabs straight past it with no indication it was ever there.
  - **Fix**: Take it out of the mosaic grid and give it its own band, or keep it in the grid and make it visibly not a tile by dropping the tile padding and heading size and setting it on paper rather than on a cycle surface.
  - **Suggested command**: `/impeccable clarify`

- **[P1] `.c97-tile` has no hover state, and it is the only interactive primitive in the system without one**
  - **Why it matters**: `.c97-tile` declares `transition: background-color 160ms ease` and nothing in the codebase ever changes its background color. I grepped every rule in `src/` and `.c97-tile` is defined exactly once, at `src/app/catalog97.css:818`, with no `:hover`. So the transition is dead code and the 33 primary interactive elements of the page give no pointer feedback at all. Every other interactive primitive in the same stylesheet has a hover rule, including `.c97-link`, `.c97-sectionlink`, `.c97-microlink`, `.c97-btn`, `.c97-btn-invert`, `.c97-btn-ghost` and `.c97-btn-outline`. Focus is fine, since `.c97-page a:focus-visible` covers the tiles, so this is a hover gap specifically.
  - **Fix**: Add the hover rule the transition is already waiting for. The stylesheet comments at lines 166 and 191 say the hover token exists and that chocolate on camel is 4.1:1 with espresso keeping hover legible at 5.7:1, so the palette work is already done.
  - **Suggested command**: `/impeccable polish`

- **[P2] The heading outline is 35 flat h2s, and one section head renders smaller than its own children**
  - **Why it matters**: The document outline is one h1, then 35 h2s, then 3 h3s. Thirty-three of those h2s are tool titles and they are siblings with no group headings between them, so a screen reader user navigating by heading gets the same undifferentiated wall the sighted visitor gets, with no way to skip a category. Separately, the "How the data works" h2 carries `.c97-kicker` and renders at 11px while its three h3 children carry `.c97-lead` and render at 22px, so the child is exactly twice its parent. The nesting is announced correctly and is invisible on the page, which is the type-scale-against-outline trap worth checking on any surface where one heading class is shared across levels.
  - **Fix**: The category runs from the first issue supply the missing h2s and demote the tool titles to h3, which fixes the outline and the scanning problem in one change. For the section head, either give "How the data works" a real heading step or make it a `<p class="c97-kicker">` and let the three h3s become h2s.
  - **Suggested command**: `/impeccable layout`

#### Persona Red Flags

**Alex (Power User)**: Knows he wants Formula 1 Pulse. Has no search field, no filter, no keyboard path to it, and no sort. His only option is to scan a 33-item grid in reading order, and Formula 1 Pulse is the 21st tile. He used `/portfolio` last week where a category filter exists over the same buckets, so this reads as a regression rather than as a different surface.

**Sam (Screen Reader, Keyboard)**: Tabs into the mosaic and hits 33 consecutive links whose accessible names are a category, a title and a summary, with the category repeating eleven times through the Sports run. Heading navigation gives 35 sibling h2s with no group structure, so there is no way to skip to Lifestyle. The status tile is skipped silently, since it is not focusable and nothing announces it. Contrast is not a problem anywhere, and I measured the kickers at 5.3:1 on pine, 5.73:1 on camel and 4.67:1 on bone, all clear of 4.5:1. Focus rings are present through `.c97-page a:focus-visible`.

**Casey (Distracted Mobile)**: At 390px the page is 11,262px tall, or 13.3 full screens, and the mosaic collapses to one 319px tile per row. To reach the CTA she scrolls past all 33 tiles. No hover exists on touch anyway, so the status tile is a dead tap with no feedback. If she gets interrupted and comes back, there is no position memory and no way to jump to a category, so she restarts the scan.

**The professional peer (from PRODUCT.md)**: A VC, PM or Haas contact who already has a reason to look Isaac up, deciding whether the judgment on display is sound. The volume genuinely impresses, and 33 shipped things is the argument. Then the h1 tells them all 33 read from a committed snapshot, and if they open Wine Cellar or Recipe Finder they find a localStorage tool. That is a small thing that costs more than it looks like it should on a site whose whole positioning is a practitioner who is precise about how his systems actually work.

#### Minor Observations

The `isExternal` branch in the mosaic is currently dead. Every one of the 33 tools resolves to an internal route, so `target="_blank"` never renders today. The branch is worth keeping, and when the first external tool lands it will need a visible affordance and an accessible-name hint, because right now it would open a new tab with no warning.

The five `<section>` elements in `main` have no accessible names, so none is exposed as a landmark. That is neutral rather than wrong, and if the category runs from the first issue get real headings, `aria-labelledby` on those sections would come nearly free. Where a heading is conditional, prefer a literal `aria-label`, since pointing at a heading that does not always render leaves a dangling reference.

The mobile hero composes well and I want to say so, because the numbers made me expect otherwise. `1fr auto` leaves the h1 214px at 32px and the plate 65px, and because the grid is `align-items: end` the plate baseline sits on the h1's last line. It reads as intentional at 390px.

The tobacco band holds its own rule. The pull quote is `--c97-fs-h2` and there is nothing smaller than that on the band, which is what the brief requires and what keeps 4.36:1 legitimate there.

#### Questions to Consider

What would this page look like if the eight categories were the primary structure and the mosaic were the texture inside them, rather than the categories being a label printed on top of a texture that ignores them?

The status tile is trying to say something the page believes strongly. Does it want to be a tile at all, or does it want to be the tobacco line's neighbour, given those two blocks are making the same argument in different registers?

If a visitor could only ever see nine tiles on this route, which nine, and what happens to the other 24? The answer to that is probably also the answer to what the page should lead with.
