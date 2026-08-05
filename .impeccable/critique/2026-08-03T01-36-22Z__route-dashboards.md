---
target: "/dashboards (route:/dashboards)"
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
timestamp: 2026-08-03T01-36-22Z
slug: route-dashboards
---
⚠️ DEGRADED: single-context (session config gates subagent use on an explicit user request; that request was declined earlier in the session, so Assessment A and B ran sequentially in one context)

Rescore after the 2026-08-03 fix pass. `context.mjs` was not rerun, since it had already run this session against this target.

#### Design Health Score

| # | Heuristic | Score | Δ | Key Issue |
|---|-----------|-------|---|-----------|
| 1 | Visibility of System Status | 2 | — | The index still shows no freshness anywhere. The status band states the convention; the timestamps live on the destination pages. |
| 2 | Match System / Real World | 3 | +1 | The h1 and the route metadata are true now. "Job Search" and "Civic / Polls" are still a little opaque as labels. |
| 3 | User Control and Freedom | 3 | — | Unchanged. Nothing traps the visitor. |
| 4 | Consistency and Standards | 4 | +2 | The decoy tile is gone, all 33 tiles are links, and the tile now has the hover rule every other interactive primitive already had. |
| 5 | Error Prevention | 3 | +1 | The one error the page created, the inert tile that looked openable, no longer exists. |
| 6 | Recognition Rather Than Recall | 3 | +2 | Eight headed runs instead of one flat 33. Sports is still 11 deep inside its run. |
| 7 | Flexibility and Efficiency | 2 | +1 | Heading navigation is a real accelerator for screen reader users. A sighted returning visitor still has no search, filter, or sort. |
| 8 | Aesthetic and Minimalist Design | 4 | +1 | The headless 11px section head is fixed and 33 redundant kickers are gone. The single full-width Civic tile is the weakest moment left. |
| 9 | Error Recovery | 3 | — | Unchanged. `error.tsx` follows the project convention. |
| 10 | Help and Documentation | 3 | +1 | "How the data works" is a real heading now, so it is reachable by heading navigation, and the third note explains the browser-persisted tools. |
| **Total** | | **30/40** | **+9** | **Good** |

All ten heuristics apply, same as the first run, so this is a like-for-like comparison against 21/40.

#### Design Specificity Verdict

**LLM assessment.** The visual world was never the problem and it survived the fix intact. What changed is that it stopped contradicting the page's own structure. The eight category runs give the mosaic a spine, and because each run restarts the field cycle one step further along, the colour rhythm resets where the heading does without Pine taking over the page. Pine is 8 of 33 now, which is the share the four-wide cycle was designed around, and the runs open on pine, camel, bone, camel, pine, camel, bone, camel rather than eight identical pine tiles. Colour is texture again rather than a signal competing with the headings.

The page is still unmistakably this product. Full-bleed inlaid fields, a hairline of paper between them, no border or radius or shadow, Anton on the count and nowhere else. Nothing here reads as a template.

**Deterministic scan.** `detect.mjs --json` again returned `[]` with exit 0 on all four inputs, being the component, `src/components/catalog97/`, `src/app/dashboards/`, and `src/app/catalog97.css`. Same reading as last time: on a codebase that styles through a shared stylesheet and data attributes, an empty result means nothing was matchable rather than that nothing is wrong. It is worth recording that the scan was equally empty before and after a change that fixed four real defects, which is the clearest available evidence of how little it sees here.

**Visual overlays.** None, same as the first run. The site's enforcing CSP blocks an injected script tag, and that is correct behaviour I would not weaken for the tool.

#### Overall Impression

The gap between how good this looked and how badly it worked is closed. It reads as one thing now: a catalog of instruments, organised the way the data was always organised, where the eye lands on a category heading rather than drowning in 33 equal tiles.

What is left is a different and smaller problem. The page is still long, and length is now the honest cost of showing everything rather than a symptom of disorganisation. Fixing that means deciding to show less at once, which is a product decision rather than a design defect.

#### What's Working

The category runs earn their place immediately. Scanning eight 32px headings to find Sports, then eleven tiles inside it, is a different task from scanning 33 undifferentiated tiles, and it is the whole reason heuristics 6 and 7 moved.

The hover fix is the kind that pays twice. One rule mixes each field 8% toward its own ink, which darkens the three light surfaces and lifts Pine, and it does the right thing in dark mode without a second rule, because dark surfaces carry light ink. Measured in both themes.

The copy correction did real work beyond accuracy. Replacing the false "all reading from a committed snapshot" with a third data note explaining that the lifestyle tools and calculators keep state in your browser turned an overclaim into an actual explanation of how the collection is built.

#### Priority Issues

- **[P1] The page is still 12.9 screens on a phone, and nothing shortens it**
  - **Why it matters**: At 390px the page measures 10,900px, down from 11,262px, which is essentially unchanged. The eight headings are waypoints and they genuinely help someone navigating by heading, but a sighted visitor on a phone still scrolls past every one of the 33 tiles to reach the closing bands, because the tiles stack one per row and grouping removed none of them. This is the last thing standing between the route and its stated job.
  - **Fix**: Show less at once. Either a category filter, which `/portfolio` already runs over the same `classifyToolSlug` buckets and which would make the two indexes consistent, or runs that collapse to their heading below a breakpoint so the eight categories fit on roughly one screen and open on tap.
  - **Suggested command**: `/impeccable adapt`

- **[P2] Sports is eleven tiles in one undifferentiated run**
  - **Why it matters**: The grouping fixed the top level and left the largest group untouched. Eleven is still well past what anyone holds at a decision point, and it is a third of the page's tiles. Every other run is between one and six.
  - **Fix**: Either split it into the sub-groups that already exist in the data by nature (league dashboards against fantasy tools), or accept it and let the filter from the issue above carry the weight.
  - **Suggested command**: `/impeccable layout`

- **[P2] The index still reports no freshness of its own**
  - **Why it matters**: The page argues in three places that its data is honest about staleness, and then shows no dates. A visitor takes the claim on trust and only sees it honoured after opening a tool. This was a 2 in the first run and it is the one original finding no part of the fix pass touched.
  - **Fix**: If any per-tool timestamp becomes readable at render time, put it on the tile. Until then this is correctly left alone, because inventing one is barred and the component says so.
  - **Suggested command**: none yet; it is blocked on data rather than on design.

#### Persona Red Flags

**Alex (Power User)**: Materially better. He scans eight headings, finds Sports, and gets to Formula 1 Pulse in one decision instead of scanning 33 tiles. He still has no search, no filter, and no keyboard accelerator beyond browser find, and `/portfolio` still gives him a filter that this route does not.

**Sam (Screen Reader, Keyboard)**: The biggest winner. Heading navigation now yields nine `h2`s naming real categories rather than 35 undifferentiated siblings, so skipping a whole group is one keystroke. Tool titles are `h3` beneath their category, so the outline finally matches the page. Focus is a 2px solid ring on every tile. No inert element in the tab order. Contrast measured 5.73:1 to 11.44:1 in light and 6.74:1 to 14.82:1 in dark.

**Casey (Distracted Mobile)**: Least improved, and the reason the P1 above survives. 12.9 screens against 13.3. She gets category headings as landmarks and a hover state she will never see, and she still cannot jump anywhere or reduce what is on screen.

#### Minor Observations

The single Civic / Polls tile stretches to the full 1080px shell because `auto-fit` collapses the empty tracks. That is correct grid behaviour and it honestly reflects there being one civic tool, but a 1080px tile carrying a 26px title and two lines of summary is the most awkward moment left on the page.

Fintech leaves one tile alone on a second row and Sports leaves two on a fourth. Ragged tails are the price of grouping, and the inlaid-field language absorbs them better than cards would, because the gap is the band's own paper rather than a missing card.

The `isExternal` branch is still dead and still worth keeping. Nothing changed there.

The hero kicker above the `h1` remains the one craft-floor ban this surface carries. It stays because `.c97-kicker` is the committed Catalog 97 device across all seven routes, and removing it is a decision about the visual world rather than a fix for this route.

#### Questions to Consider

If the filter arrives, does the mosaic still want to be eight headed runs, or does it want to be one grid again with the filter doing the work the headings currently do?

Sports being a third of the collection is a fact about what you build, not a layout problem. Is that worth saying out loud on the page rather than smoothing out?
