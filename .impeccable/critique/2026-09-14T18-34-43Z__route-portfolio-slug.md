---
target: /portfolio/[slug]
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/isaacvazquez/Website/route:/portfolio/[slug]"
timestamp: 2026-09-14T18-34-43Z
slug: route-portfolio-slug
closed: true
---
Method: dual-agent (A: design review subagent · B: detector and browser evidence subagent), synthesized in the parent, with one adversarial refuter on every P0 and P1. Run 2026-09-14 against the dev server on branch design/catalog97-loop at 71a015bf, before remediation.

Scope note. The route was sampled at `investment-analytics-platform` and `interchange-iq`. Neither renders its own template, since every one of the 33 records has a `link` and `page.tsx:101-103` redirects to it, so the first lands on `/investments` and the second on `/fintech-tools/interchange-iq`, both in the Working Instrument shell. The path was scored as the Read journey the Work index sends a visitor on, with all ten heuristics applying.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Nothing says the visitor was redirected from a case study to a tool, and `aria-current` lands on "Investments" rather than any Work or Projects item. The tools themselves state their data well ("Curated snapshot · Aug 18, 2026"). |
| 2 | Match system / real world | 1 | The visitor clicked for "the decisions behind it" and got an empty portfolio tool ("$0.00", "No positions yet"), with the problem and tradeoffs a blog post away. |
| 3 | User control and freedom | 1 | The template's "Back to Portfolio" link and previous and next cards never render. The site header's "Projects" link does return to /portfolio, but under a different name than the "Work" the visitor clicked from. |
| 4 | Consistency and standards | 1 | The header goes from seven Catalog 97 links to eight Working Instrument links with different words ("Projects", "Resume", "Investments", "Fantasy"), and the palette, type and footer all change. |
| 5 | Error prevention | 3 | Low stakes. Both tools carry their educational disclaimers, and Interchange IQ opens on sensible preset inputs. |
| 6 | Recognition rather than recall | 2 | The link said "Investment Analytics Platform" and the h1 says "Investments". Interchange IQ matches. |
| 7 | Flexibility and efficiency | 2 | No next or previous project, so every project costs a round trip through the index. |
| 8 | Aesthetic and minimalist design | 2 | For a reader the context sits below the whole tool, around 3,480px down a 4,380px page on /investments at 1440 (estimated from captures). |
| 9 | Error recovery | 3 | Empty states explain themselves ("No positions yet. Add your first stock with the Add a holding form."). |
| 10 | Help and documentation | 2 | The only framing of what the project is and why it exists is the build-note aside at the bottom. |
| Total | | 19/40 | Poor (48%) |

## Design Specificity Verdict

LLM assessment. The destinations are specific and the template is generic. Interchange IQ opens on "Verdict at a glance" with a named winner ("Stripe IC+ wins", "$878.50 per month") and a seven-processor breakdown, which is authored for its subject and shows judgment in five seconds. The unrendered case-study template in `[slug]/page.tsx` is the opposite. "Overview, User segments & north star, Problem, Process, Key decisions, Tradeoff analysis, Results, Retrospective", with a "Framework:" meta line, rounded-full tool chips and "Chose / Rejected" cards, is the standard PM-portfolio scaffold any product manager's site could use unchanged. The journey between the Work index and either destination is not designed at all. It is a redirect.

Deterministic scan. `impeccable detect` exited 2 with 2 findings, and both are in this route's own file, a side-tab accent border warning at `src/app/portfolio/[slug]/page.tsx:504` and a design-system-font-size advisory at line 184 on the title's `clamp(2.4rem, 5.5vw, 4rem)`. Neither renders, because the route redirects every record before the template is reached. The detector and the design review agree on what that template is, since the side-tab border is one of the stock moves that makes it read as a generic scaffold, but neither finding is visible to a visitor today and both matter only if the template is revived. Run on the Catalog 97 components alone, the detector returned `[]` with exit 0. No DEGRADED banner printed.

Visual overlays. No user-visible overlay is available. Injection was blocked by the site's enforcing CSP, which fired a securitypolicyviolation on script-src-elem. The computed-value sweep is the fallback signal. It reached 64 of 64 default states (eight surfaces at 390, 768, 1024 and 1440 in light and dark), reproduced the Catalog 97 contrast gate at 13.25:1 light and 15.95:1 dark, and found zero AA text contrast failures, zero horizontal overflow, and one main and one h1 on every Catalog 97 route. This sample is the exception to the contrast result, because it lands on `/investments` in the Working Instrument shell (gate 16.29:1 light and 15.28:1 dark), where the sweep recorded AA failures on the "No data" label at 3.95:1, the empty-state hint at 4.01:1 and the dataset chip divider at 2.46:1. Those belong to the destination tool rather than the slug route and are listed under Minor Observations.

## Overall Impression

There is no case study to critique, because the route is a redirect to a tool in another design world. The tools are good, and Interchange IQ in particular is proof of judgment without any prose, but the visitor arrived expecting the decision behind the project and has to scroll past a full dashboard to find it. The single biggest opportunity is to choose one model, either a short Catalog 97 detail page that leads with the decision or no route at all with index titles linking straight to the build-note post, and delete the other.

## What's Working

Interchange IQ's first screen shows judgment without prose. It picks a winner, shows the savings against the worst and flat options, and explains when interchange-plus never beats flat for the card mix.

The tools are honest about their data. `/investments` states "Curated snapshot", counts delayed histories and keeps its educational disclaimer, and Interchange IQ says "Based on published 2024 interchange rates" and repeats the source in its reference footer (`interchange-iq-client.tsx:701`, `:768`).

The reasoning exists. Both build-note targets resolve to posts in `content/blog/` (`building-an-investment-research-platform.mdx`, `interchange-iq-payment-fee-analyzer.mdx`), linked from `src/components/projectBuildNoteLinks.ts:13`, `:19`.

## Priority Issues

[P1] The case-study template never renders, because all 33 records redirect to their link.
`[slug]/page.tsx:101-103` redirects for every record, which makes the 500-line template below it dead to visitors. The route still exports metadata with `ogType: "article"` and a canonical of `/portfolio/${slug}` (`:36-46`), and it describes itself in breadcrumb and Project structured data (`:118-165`) for a URL that never serves that content. The refuter upheld it. The reasoning a peer came for sits in a post most visitors never scroll down to.
Fix: choose one model and remove the other. Either stop redirecting and render a short Catalog 97 detail page (with a `/portfolio/` prefix match added to `catalog97Nav.ts`) that leads with the problem and decision from the build-note post and ends on an "Open the tool" button, which makes the index CTA true, or delete `[slug]/page.tsx`, link index titles straight to the post, and keep the tool as the secondary link.
Suggested command: /impeccable shape

[P2] Clicking through drops the visitor into another design world with no bridge.
Every click from /portfolio changes the navigation words ("Work" becomes "Projects", "Résumé" becomes "Resume", and "Investments" and "Fantasy" appear), the palette, the typefaces and the footer, and `aria-current` lands on an item the visitor never chose. The refuter set this at P2 rather than P1, because the site header's "Projects" link does return to /portfolio, so the visitor is not stranded.
Fix: rename the Working Instrument nav item from "Projects" to "Work" in `src/constants/navlinks.tsx:26` so both worlds use one word, and add a "Back to Work" link at the top of every build-note route, rendered from `ConditionalLayout` where `projectBuildNoteLinks` is already read (`src/components/ConditionalLayout.tsx:86`, `:109-110`). The fuller fix is option one of the P1.
Suggested command: /impeccable layout

[P2] The route's metadata overstates the Investment Analytics Platform data source.
`generateMetadata` uses `caseStudy.description` ("live Yahoo Finance data", `[slug]/page.tsx:38`), and `tools` at `caseStudies.ts:65` lists "Yahoo Finance API", which feeds `articleTags` and `skillsUsed` in structured data (`:44`, `:152`). The destination says "Market quotes via Finnhub" over a curated snapshot. The refuter corrected the mechanism. The snapshots are built by defeatbeta-api over a Yahoo Finance dataset and quotes come from Finnhub, with no Yahoo Finance API call, so "live" and "Yahoo Finance API" are the parts that are wrong.
Fix: correct `caseStudies.ts:61-66` once, which fixes the index, this route's metadata and the structured data together.
Suggested command: /impeccable clarify

[P2] If the redirect goes away, the template renders empty sections.
The three sampled records (investment-analytics-platform, fantasy-football-analytics, interchange-iq) carry empty `painPoints`, `stakes`, `approach`, `methodology`, `decisions`, `outcomes`, `userSegments` and `northStarMetric`. The template renders "Who was this built for?" (`:315-324`), "North star metric" (`:325-332`), "Pain points" (`:351-360`), "Stakes" (`:362-372`), "Approach" and "Methodology" (`:382-400`) and "Outcomes" (`:488-497`) with no content guard, and "Key decisions" is guarded by an array that is truthy when empty (`:402`). Only three of the 33 records were checked.
Fix: if the template is kept, guard every section on non-empty content and move it to Catalog 97 tokens. If not, delete it along with the empty case-study fields.
Suggested command: /impeccable harden

[P2] The landing title and build-note copy drift from the index and from the voice spec.
The h1 "Investments" does not match "Investment Analytics Platform". The investments build-note copy (`src/components/projectBuildNoteContent.ts:67-72`) uses the vivid compressions WRITING_VOICE.md asks writers to replace with the plain literal thing ("without turning the research into a spreadsheet maze", "instead of being filled with invented precision"), the `impact` line "Turns scattered market data into a faster decision surface" (`caseStudies.ts:75-76`) is the same pattern and not first person, and the record's `description` is a verbless fragment chain.
Fix: make the index title and the landing h1 match, and use plain rewrites such as "without having to build a spreadsheet to compare them" and "instead of being filled with a number I don't actually have".
Suggested command: /impeccable clarify

## Persona Red Flags

Jordan (first-timer) clicks "Investment Analytics Platform" and gets "Investments", "$0.00" and "No positions yet", with no line saying this is a working tool to try. The only explanation is the "Project context" aside near the bottom, and the header now says "Projects" where the previous page said "Work".

Casey (mobile) was not measured on either destination at 390, so there are no phone-specific findings. From the 1440 layouts the build-note link sits below a full tool on both routes, which on a phone is further still, and that is an inference.

Sam (screen reader, keyboard) follows a link named "Investment Analytics Platform" and hears an h1 of "Investments", with `aria-current` moved to "Investments". On `/investments` the sweep reached 49 of 97 focusables by Tab at 390 and 768, recorded an input and the "Add Holding" button with no visible focus indicator, and found focus rings clipped on the section rail and timeframe buttons. Those are destination-tool findings.

Morgan, a Haas classmate at a seed fund, wanted the decision and got an empty dashboard. The reasoning is there after "Read the build notes", but it took three views in two design systems to reach, and the record behind the click overstates the data source. Interchange IQ would impress Morgan in five seconds, if Morgan had clicked that one instead.

## Minor Observations

The destination `/investments` has its own sweep failures, recorded here because this route delivers visitors to it. AA text contrast fails on the "No data" label (3.95:1), the empty-state hint "Add your first stock with the Add a holding form" (4.01:1) and the dataset chip divider dot (2.46:1), and the build-note h2 "What I use it for" (34px) and the contact h2 (44px) outrank the 24px h1 at 1440.

`CASE_STUDY_SEO_DATE = "2026-04-04"` is hard-coded for all 33 records (`[slug]/page.tsx:14`) and published as both `datePublished` and `dateModified`. The unrendered template also breaks Working Instrument rules with `rounded-full` chips (`:216`) and repeated inline style objects, which only matters if it is reused. The build-note aside switches its kicker and heading depending on whether a context entry exists (`ProjectBuildNote.tsx:24`, `:32`), so neighboring projects frame their reasoning differently. The Working Instrument header links came back twice in the DOM read, which suggests a desktop and a mobile nav both present, and whether one is hidden from assistive technology was not checked.

Shared Catalog 97 shell findings recorded in full in the / snapshot from this run apply to the /portfolio index that sends visitors here, not to the Working Instrument destinations.

## Questions to Consider

If the writing post is the case study, what is /portfolio/[slug] for?

What would it take for each tool page to open with two plain sentences naming the decision, above the dashboard rather than under it?

Should Work and its destinations share one visual world, or should leaving the catalog be announced as a deliberate step ("Open the tool")?
