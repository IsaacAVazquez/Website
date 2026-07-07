# Front-End Design Review — July 2026

A follow-up to [`DESIGN_AUDIT_2026-06.md`](./DESIGN_AUDIT_2026-06.md). This review reconciles the June
backlog against the current code, audits everything that changed since then, and takes a harder look at
positioning, because the design system is now in good enough shape that the next real gains come from what
the portfolio says rather than how it is styled. The durable best-practice rules still live in
[`DESIGN_CHECKLIST.md`](../DESIGN_CHECKLIST.md); this file is the point-in-time findings plus the roadmap.

**Date:** 2026-07-07 · **Method:** a live screenshot pass across the flagship surfaces and a sample of
dashboards in light and dark on desktop and mobile, plus a multi-agent verification pass that reconciled
the 28-item June backlog against current code, audited the surfaces changed since June, and adversarially
verified every P0/P1 defect claim before it was allowed into this doc. Corrected severities are the
verified values, not the original June ratings.

---

## 1. Executive verdict

The site is in strong shape, and that is worth saying plainly before the list of what is left, because the
list runs longer than the health of the site actually does. Most of the June audit's structural work is done
and verified in code, not just claimed. The token system is now the real source of truth. The five duplicated
portfolio palettes all alias `--home-*` instead of carrying their own hex mirrors, `/march-madness-2026` was
rebuilt off the token system and adapts to light and dark instead of being a dark-only bypass, the investments
charts resolve their colors from `getComputedStyle` at render time and share one holdings palette, gain and
loss are tokenized across formula-1 and polling, `transition-all` is gone from every shared primitive,
`.prose-writing` and `.changelog-prose` run on `--home-*`, and `PageSummary` finally honors
`useReducedMotion`. The legacy `--color-*` aliases survive only as compatibility definitions with zero usages
in new code. That is most of a design system getting genuinely consolidated.

What is left is almost entirely polish and consistency, not breakage. Several items the June audit filed as
P0 turned out, on verification, to be smaller than their rating. The "MetricTooltip unreachable" P0 is fixed
at the core component and only survives on a couple of sibling `title=` hints, the frontier-models disclosure
is partially present, and the missing `error.tsx`/`loading.tsx` items are a data-fetching-dashboard convention
on routes that mostly do not fetch at runtime. What I think this means is that the June severities were
calibrated when the system was still messy, and now that the structural fixes landed, most of the residue
should be treated as P2 and P3.

The one thing that is not a code defect but matters most is positioning, and it is the headline of section 3.
The design system is doing its job. The open question is whether the portfolio it renders is telling the right
story about Isaac as a product manager, and right now it is not quite.

The genuinely new defects the delta pass surfaced are worth calling out because they land on the
portfolio-first surface directly. One project cover SVG (`travel-deal-lab.svg`) is simply missing, so a
featured card renders a blank plate on the default `/portfolio` view, and the whole 2026 sports writing series
(35 posts) never got its cover-image plan entries. Both are the kind of thing that reads as unfinished on
exactly the surfaces a recruiter looks at first.

---

## 2. Confirmed still-open defects

Grouped by theme. Severity is the corrected value from verification. Nothing that was refuted survives here.
Refuted-and-dropped during verification: `globals.css` `.home-note-card` white-mix (its `.dark` override at
line 1839 already flips it toward black), `MissionImageFrame` (already fixed), and the `ai-dev-tools` /
`frontier` `role="button"` rows (already one interactive element each).

### Portfolio asset gaps — highest visibility

| Sev | What | File |
|-----|------|------|
| P1 | `travel-deal-lab.svg` cover art is missing. It is the only absent SVG among 31 ordered projects, so a `featured:true` card renders a blank `--pf-paper-alt` plate on the default `/portfolio` view | `public/images/projects/travel-deal-lab.svg` (absent); consumed at `PortfolioInstrument.tsx:190,477` |
| P3 | Cover art is slug-derived with no `onError`/placeholder, so any future slug without an SVG degrades to a broken plate rather than a clean fallback | `PortfolioInstrument.tsx:189,476` |

The first is a straight fix, a committed SVG matching the sibling pixel tiles. The second is the mechanism
that lets it recur, so the durable version is a CI check asserting every `PORTFOLIO_PROJECT_ORDER` slug has a
matching file under `public/images/projects/`.

### Touch targets under 44px

Mostly enforced now (portfolio, writing, world-cup rows, budget-planner, fantasy clears all pass), but a
cluster still sit short, and this directly contradicts the `/accessibility` page's own claims.

| Sev | What | File |
|-----|------|------|
| P2 | Search filter chips at `min-h-[36px]` (content-type and category) | `search/SearchFilters.tsx:80,107` |
| P2 | Museum-log filter `<select>` has no min-height (~30px) and sets `focus:outline-none` with no replacement | `museum-log-client.tsx:505` |
| P2 | Museum-log QuickActions `sm` pills at `min-h-[36px]` | `museum-log-client.tsx:205` |
| P2 | Research tabs at `min-h-[40px]` | `investments/StockResearch.tsx:265` |
| P2 | Draft-tracker / DraftBoard controls at `min-h-[40px]` | `draft-tracker-client.tsx:244,491`; `DraftBoard.tsx:188` |
| P2 | TierBreakdown pill at `min-h-[38px]` | `fantasy/TierBreakdown.tsx:192` |
| P3 | Interchange-iq Reset at `minHeight:32` | `interchange-iq-client.tsx:~279` |
| P3 | World-cup clear-team X at `h-9 w-9` (36px) | `world-cup-client.tsx:1041` |
| P2 | `/accessibility` asserts "fully conformant… without exceptions" and "all controls sized (WCAG AAA)," directly contradicted by the rows above | `accessibility/page.tsx:31,135,138` |

The accessibility-page copy is the one I would treat as almost a correctness bug. Overclaiming conformance is
worse than the 36px pills themselves, so either the controls come up to 44px or the copy softens to what is
actually true.

### Dark-mode `color-mix(…, white)`

The guardrail is that raised surfaces mix toward `var(--home-elev-mix)`, never literal white, because white
lightens in both themes. Most routes are clean; these are the survivors (verification refuted one of the eight
originally cited).

| Sev | What | File |
|-----|------|------|
| P2 | Secondary/outline/ghost surfaces mix toward white, base and hovers | `ui/ModernButton.tsx:58,59,67,73` |
| P2 | Always-visible card backgrounds mix `paper-alt 80%, white` | `polling-aggregator-helpers.ts:108,122` |
| P2 | `.home-stats-pill` mixes toward white with no `.dark` override, a genuine dark-mode bug on a shared HomeStatsPanel style | `globals.css:1147` |

### Keyboard and focus reachability

| Sev | What | File |
|-----|------|------|
| P2 | Metric definitions rendered via native `title=` on non-focusable `<span>`, never fire on touch, unreachable by keyboard | `investments/PortfolioStatsGrid.tsx:88-93`; `ResearchAssetHeader.tsx:137-142` |
| P2 | `focus:outline-none` on search input and FilterSelect with no focus-visible replacement | `ai-dev-tools-client.tsx:388,486` |
| P3 | Eight links drive hover color via inline JS `onMouseEnter/Leave` with no `onFocus` equivalent | `AuthorBio.tsx` (8 pairs, 142-366) |
| P3 | Focus-ring strategy not consolidated: global `outline` + `box-shadow` (still on legacy aliases) stacks with ~75 inline `focus-visible:ring-*` usages | `globals.css:56-75` + ~40 files |

The `MetricTooltip` core is fixed (focusable, keyboard-operable, reveals on `group-focus-within`), so the P0
headline is retired. Only the sibling hint spans that never adopted the pattern remain.

### Semantic structure and ARIA

| Sev | What | File |
|-----|------|------|
| P2 | Tier sections use `aria-label` + a `<p>` label, no `<h3>`, so tiers are not heading-navigable | `fantasy/TierBreakdown.tsx:116-127` |
| P2 | `<tr role="button" tabIndex={0}>` wrapping a real `<button>`, duplicate tab stop | `polling-aggregator-client.tsx:205-233` |
| P2 | `<tr role="button" tabIndex={0}>` wrapping a tabbable Repo `<a>`, focusable descendant inside a button role | `github-trending-client.tsx:572-627` |
| P3 | Recipe-finder skips h1 → h3 with no intervening h2 | `recipe-finder-client.tsx:282,664` |
| P3 | Disclosure chevron `›` not `aria-hidden`, announced as a raw glyph | `march-madness-client.tsx:774` |
| P3 | Travel-deals filter pills use an incomplete tab pattern (`role="tablist"`/`role="tab"` with no `tabpanel`, no `aria-controls`) filtering two regions at once; these are toggles, not tabs | `travel-deal-lab-client.tsx:384-397` |

### Content and disclosure

| Sev | What | File |
|-----|------|------|
| P2 | All 35 new 2026 sports posts (9 F1, 13 La Liga, 13 PL) are missing from the cover-image plan, violating the file's own "every slug appears once" invariant and the CLAUDE.md same-change rule. Rendering degrades gracefully to the `opengraph-image` card, but the flagship series shows typographic cards while peer sports content shows real photos | `scripts/data/articleCoverImages.ts` (118 entries vs 153 posts) |
| P2 | Frontier-models snapshot lacks the `verified`/`asOf`/`disclaimer` fields its sibling tech-startup-tracker defines, so the unverified state is not explicitly disclosed on-page | `types/frontierModels.ts:46-52`; `data/frontierModelsSnapshot.ts:5`; `frontier-models-client.tsx:199-205` |

### Mobile navigation and table reflow

| Sev | What | File |
|-----|------|------|
| P2 | Investments section nav (7 jump anchors) is `display:none !important` below 900px with no replacement | `investments.module.css:105-108`; `InvestmentsDashboard.tsx:200-220` |
| P2 | Golf packs 4 StatBlocks into `grid-cols-4` with no mobile variant | `golf-client.tsx:461-478` |
| P2 | HoldingsTable wrapper is a bare `overflow-x-auto` with no `role="region"`/`tabIndex`/label | `HoldingsTable.tsx:292` |
| P3 | World-cup standings tables have no scroll-region wrapper | `world-cup-client.tsx:640,774` |
| P3 | Retirement assumptions table unwrapped | `RetirementAssumptions.tsx:60` |

### Token-fidelity nits

| Sev | What | File |
|-----|------|------|
| P2 | Four `bg-black/20` and `bg-black/10` literals darken in both themes, stamping a heavy grey well on light limestone | `march-madness-client.tsx:186,206,450,803` |
| P2 | Semantic status tokens used as decorative category washes on methodology cards and HERO_TAGS chips, diluting their gain/loss meaning | `march-madness-client.tsx:41-45,932-940` |
| P2 | Frontier chart hardcodes 7 provider hexes (incl. xai `#475569`, low-contrast on dark) that never adapt to theme | `FrontierCostContextChart.tsx:28-36,192,247` |
| P3 | `text-[0.6rem]` (~9.6px) micro-type instead of `text-3xs` | `formula-1-client.tsx:412,574` |
| P3 | Bare `shadow-sm` mixed with `shadow-[var(--shadow-sm)]` | `nfl-client.tsx:629,724,985,1055` |
| P3 | Hardcoded color fallbacks `#e5e5e5` / `#888888` | `bay-area-transit-client.tsx:324,329` |

### Motion and loading/error consistency

| Sev | What | File |
|-----|------|------|
| P3 | Login card `motion.div` entrance does not gate on `useReducedMotion` | `admin/page.tsx:135-154` |
| P3 | Chevron rotations use bare `transition`, not motion-safe | `march-madness-client.tsx:774`; `news-pulse-client.tsx:156` |
| P3 | `march-madness-2026` has neither `error.tsx` nor `loading.tsx`; `fantasy-football`, `draft-tracker`, and `mba-internship-notifications` have `error.tsx` but no `loading.tsx` | those route dirs |

The `error.tsx`/`loading.tsx` gap was the June P0-1. It is corrected to P3 because march-madness does not
fetch at runtime (it imports a committed static module), the app-level `error.tsx` already covers it, and the
missing `loading.tsx` files are skeleton-parity convention, not a real Suspense-for-data fallback. Worth doing
for guardrail consistency, not urgent.

### Documentation drift

| Sev | What | File |
|-----|------|------|
| P3 | `STYLING.md`'s "Writing Archive Cards" locked-pattern names `CuratedWritingCard`/`ArchiveWritingCard`, which no longer exist; the live archive is `WritingInstrument` using the consolidated `Chip` primitive | `STYLING.md:350` |

---

## 3. Strategic and positioning recommendations

This is the headline, and it is worth more than every P2 above combined. The design system is clean. The
problem is that the portfolio it renders tells a different story than the one the site claims in its header.

The site headlines "product manager," but every one of the 31 case studies is a self-built live tool, and the
role labels prove it. Nineteen read "Full-Stack Developer & Designer," seven read "Product Builder & Designer,"
plus a scattering of "Solo Builder" and "Data Analyst." Not one says "Product Manager." Even the pinned
flagship, the Investment Analytics Platform, ships with empty `result.outcomes`, `process`, `tradeoffs`, and
`northStarMetric`. So to a recruiter the site currently proves that Isaac can build a lot of real things
quickly, which is true and valuable, but it does not prove PM judgment, and the QA-to-product and civic-tech
background that CLAUDE.md describes never shows up as a case study anywhere. What I think this is is the single
biggest gap for a portfolio-first PM and MBA job search, and it is a content gap, not a design one.

The volume compounds it rather than helping. The hero and the live-tools badge both lead with "31 live tools,"
a number computed by counting every project with a link, which folds the wine cellar, museum log, food map,
recipe finder, travel planner, and 11 sports dashboards in as peers of the fintech and analytics work. Sports
alone is 11 slugs, more than fintech (3), AI (3), and decision (2) combined, so on `/portfolio` the biggest
category chip literally reads "Sports 11." A recruiter reads "31," scrolls, sees "Wine cellar" sitting next to
the investment platform at equal card weight, and quietly recalibrates the number downward. Breadth that
should signal range instead dilutes the professional signal. The fix is not to delete anything, because "I
ship real things you can actually poke at, running on live data" is a genuine differentiator, and the personal
tools are real evidence of range and personality. The fix is to tier the work so the professional story is the
center of gravity and the hobby tools clearly sit below it.

Concretely, in rough priority:

**Add one to three real professional case studies (effort L, high impact).** Use the civic-tech and
QA-to-product experience, framed as PM work with the problem, process, result, and tradeoffs scaffolding that
already exists in the data model but sits unfilled. Give them a "Product Manager" role and a distinct visual
band so they do not read as another indie tool, and pin one as the homepage "Selected work" lead and the
`/portfolio` featured spotlight instead of a solo-built tool. This is the one lever that changes what the site
can prove.

**Stop leading with the raw 31 (effort S, high impact).** Reframe the claim around the professional subset, or
replace the count with a capability statement, while keeping the genuinely differentiating "runs on real data
that refreshes itself" proof.

**Curate the homepage tool directory (effort M, high impact).** Surface only the top three or four
professional categories (fintech, AI and dev, decision, news and data) and collapse sports plus lifestyle plus
civic behind a single "plus sports and personal tools" line linking to `/portfolio`, where the filter UI
already handles the full sprawl. The homepage is the highest-stakes surface, so it should curate to signal,
not mirror the archive.

**Consolidate the 11 sports dashboards into one entry (effort M, medium impact).** They already share the
football components, so represent them as a single portfolio entry ("Sports data dashboards, 11 leagues on one
shared engine") with the leagues as sub-links. That turns a volume liability into an engineering-leverage
narrative a PM would actually value, and it shrinks the "Sports 11" chip that currently dominates the page.

**Rework the nav and the lifestyle cards (effort S and M, medium impact).** Fantasy in the top nav reads
hobby-first on a job-seeking site and is already reachable through `/portfolio`, so dropping it reclaims the
slot; relabeling Investments to foreground the analytics angle is worth considering too. On `/portfolio`,
subordinate the lifestyle tools into a lower "Also built for myself" strip of compact rows rather than
full image cards with Live-badge parity, so a wine-cellar tracker stops competing head-to-head with the
fintech platform.

**Soften the masthead until the evidence catches up (effort S, medium impact).** The `/portfolio` masthead
claims "product," but with zero employment case studies and empty result fields, that claim is asserted rather
than demonstrated. Once real case studies exist, make the featured spotlight prefer one and add an outcomes
line; until then, match the copy to what the archive actually proves.

There is also a small voice cleanup that belongs here. The live surfaces conform well to `WRITING_VOICE.md`,
so this is light. The one real offender is `content/about.md`, which is not rendered anywhere (`/about` uses
`AboutInstrument.tsx`) but is a dense pile of banned patterns (colon connectors, em dashes, bold-label
bullets, framework and emoji headers, an About-the-Author closer with a dead gmail address and dead `/projects`
and `/blog` links). Delete it or move it under `docs/archive/` so no agent quotes it as current bio copy.
Beyond that, the homepage about-band has one staccato contrast pair the voice says to smooth into a flowing
sentence, and the sitewide contact CTA leads with a rhetorical question that repeats on nearly every page. Both
are within tolerance for marketing register and both are one-line rewrites if you want stricter conformance.

---

## 4. Design-elevation opportunities

These take the Working Instrument from clean-and-restrained to authored-and-alive. None are defects. They are
where craft investment pays off.

**Reconcile the pixel-cover green with the one-signal rule (effort M, high impact).** Every project cover SVG
bakes a hardcoded acid-green `#C9F23B` as its only chromatic mark, which is neither `--home-signal` nor even
the retired `--home-acid` token. `STYLING.md` says "one accent" and that acid has "zero component usages," yet
the covers reintroduce a bespoke third green at the most-repeated branded scale on the site. Make a deliberate
decision instead of leaving an accident. Either retint every mark to `var(--home-signal)` so the site genuinely
runs on one accent, or formally carve out acid as a sanctioned "artifact" color used only inside cover art,
write the exception into `STYLING.md`, and standardize the exact hex. The second option is more distinctive,
but only if it is documented and consistent.

**Give the covers a dark-mode plate (effort L, high impact).** The SVGs hardcode a light limestone paper and
dark ink with no dark story, so in dark mode every card and the featured plate mount a bright bone tile that
floats off the dark surface. Drive the three fills from CSS custom properties resolved on the `<svg>` wrapper,
or ship paired `*-dark.svg` swapped via `prefers-color-scheme`. Dark mode is first-class here and the portfolio
grid is the core deliverable, so this is the most visible remaining break from the otherwise-disciplined system.

**Turn the homepage live-feed into navigation (effort S, high impact).** The hero live-feed is the site's
strongest signature moment (real USGS quake data with a seismograph spark, a ticking SpaceX T-minus, the SPY
day move, with honest provenance), but each readout is an inert `<div>`. Wrap each row in a Link to its source
tool with a 44px target and a focus-visible cue, and the feed becomes a live entry point into three flagship
tools instead of a display-only vignette.

**Extend the live-feed DNA into the tool directory (effort M, medium impact).** Every tool in the directory is
snapshot-driven with an `asOf` timestamp, but none of that liveness surfaces in the directory, so it scans
like a static link list disconnected from the feed's whole thesis. Add a small mono "updated Nh ago" or a
live/stale dot per row, sourced from the snapshots the tools already commit. Breadth then reads as a living
system instead of a wall of links.

**De-templatize the Build notes aside (effort M, medium impact).** The "Why I built it this way" rail is wired
across ~28 routes, which is a genuinely strong signature, but `ProjectBuildNote.tsx` renders identical copy
everywhere. Pass a one-line, tool-specific hook per route (sourced from each case study's `overview.summary`)
so each aside says something true and particular while keeping the shared frame. For a PM portfolio the
build-notes rail shows judgment, so making each one specific turns a repeated component into 28 small proofs
of authorship.

**Design the first-run empty states (effort M, medium impact).** The browser-persisted tools start empty for
every visitor and share one dashed-border `.tool-empty` box. With no seed data, a first-timer lands on a
near-blank tool that cannot demonstrate itself. Ship a couple of read-only sample entries with a "sample, clear
to start yours" affordance, or replace the dashed box with an instrument-styled onboarding panel that previews
the payoff. For tools with zero server state, the empty state is the product demo.

**Resolve the dormant `InstrumentCounter` and consider a freshness colophon (effort S and M).**
`InstrumentCounter` is imported nowhere while the hero renders static counts, so either wire one calibrated
count-up on the hero index behind `useReducedMotion` or delete the dead primitive. Separately, the "runs on
real, self-refreshing data" claim is only ever asserted in prose; a slim Fragment Mono colophon showing the
most-recently-refreshed snapshot across all tools turns that claim from copy into inspectable evidence, which
is the most on-brand kind of delight this system can afford.

---

## 5. Roadmap

Three tiers. Effort is rough (S = under a couple of hours, M = a half-day to a day, L = multi-day).

### Quick wins

| Item | Effort |
|------|--------|
| Commit `travel-deal-lab.svg` (match the sibling pixel tile) | S |
| Fix or soften `/accessibility` conformance copy | S |
| Raise the named sub-44px controls (SearchFilters, museum-log select + QuickActions, StockResearch tabs, TierBreakdown, draft-tracker) | S–M |
| Wrap the live-feed readouts in Links to their source tools | S |
| Fix the three `color-mix(…, white)` survivors (ModernButton, polling-helpers, `.home-stats-pill`) | S |
| `aria-hidden` the march-madness chevron; motion-safe the chevron rotations | S |
| Delete or archive `content/about.md` | S |
| Stop leading the hero with the raw "31" | S |

### Near-term

| Item | Effort |
|------|--------|
| Add the 35 missing cover-image plan entries (editorial-card minimum, wikimedia for the sports series) | M |
| Fix the two `role="button"` on `<tr>` wrapping interactive elements (polling, github-trending) | S |
| Add heading semantics to TierBreakdown; wrap HoldingsTable/world-cup/retirement tables in labeled scroll regions; give golf a mobile grid variant | M |
| Restore the investments section nav on mobile (chip row or `<select>` reusing `navItems`) | M |
| Add focus-visible replacements where `focus:outline-none` has none; make the investments `title=` hints reachable | M |
| Frontier-models disclosure: add `verified`/`asOf`/`disclaimer` fields and a disclosure card mirroring tech-startup-tracker | M |
| Curate the homepage tool directory to the professional categories | M |
| Token-fidelity sweep (march-madness `bg-black` literals, formula-1 `text-[0.6rem]`, nfl `shadow-sm`, frontier chart hexes) | M |
| Gate the admin `motion.div` on `useReducedMotion`; add the missing `error.tsx`/`loading.tsx` for consistency | S |

### Bigger bets

| Item | Effort |
|------|--------|
| Write 1–3 real professional PM case studies and pin one as homepage + `/portfolio` lead | L |
| Consolidate the 11 sports dashboards into one "shared engine" entry; subordinate lifestyle tools; rework nav (drop Fantasy, relabel Investments) | M |
| Reconcile the pixel-cover acid-green with the one-signal rule and give the covers a real dark-mode plate | M + L |
| Extend live-feed freshness into the tool directory; add a freshness colophon; de-templatize the build notes; design the first-run empty states | M each |

The through-line for the bigger bets is the same as the executive verdict. The design system is done enough
that the next real gains come from what the portfolio says, not how it is styled. Fix the story and the polish,
in that order.
