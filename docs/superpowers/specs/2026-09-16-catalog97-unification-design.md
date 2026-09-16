# Catalog 97 unification design

**Date:** 2026-09-16
**Status:** Approved in conversation, awaiting written review

## What this is

The site runs two design languages. The Working Instrument has been the site-wide standard since July 2026 and governs 56 routes plus `/admin`. Catalog 97 was drawn for the seven portfolio routes (`/`, `/portfolio`, `/writing`, `/dashboards`, `/about`, `/resume`, `/contact`) and moved onto them on 2026-08-05. This document describes how every route except `/admin` moves onto Catalog 97 and how the Working Instrument is retired at the end.

The approach is to extend the Catalog 97 language with what the dashboards need, land a token bridge and a shared tool shell so every route is coherent on the first day, and then migrate route families one PR at a time, shared components first. I chose this over a pure repaint, which would leave Working Instrument layouts painted in Catalog 97 colours, and over a full rebuild of 56 routes as band compositions, which I would guess is months of work for little gain over this plan.

## Where things stand

| | Catalog 97 | Working Instrument |
| --- | --- | --- |
| Routes | 7 | 56 plus `/admin` |
| Files consuming its tokens | 17 | 179 |
| Stylesheet | `src/app/catalog97.css`, 1,020 lines, scoped under `[data-c97]` | `src/app/globals.css`, 2,937 lines, including the `.tool-*` shell used by 69 files |
| Shell | `Catalog97Shell` owns header, the only `main`, and the footer | `StaticHeader` plus `ConditionalLayout` plus `Footer` |
| Header nav | 7 links, Dashboards in place of Investments and Fantasy | 8 links from `src/constants/navlinks.tsx` |

Most Working Instrument colour usage is Tailwind arbitrary classes of the shape `text-[var(--home-ink)]`, several thousand of them across the tree. A token alias declared in one place changes all of them at once, which is what makes the bridge cheap.

Catalog 97 is band-based with no radii and no shadows, sets Newsreader, Archivo, Anton, and Great Vibes, and declares its tokens under `[data-c97]` and `[data-c97-surface]` only. Its dark mode was derived from the light palette, since the source design shipped one palette. It has no status colours, no chart palette, no mono face, and no table, stat, chip, segmented control, panel, or full form vocabulary. The dashboards need all of those.

The surface briefs have settled several facts this work does not reopen. The type scale is nine steps, the spacing ladder is seven steps plus the gutter, tobacco is a large-text-only field, Anton draws numerals at `--c97-fs-plate` only, and the anchor reset stays at `:where(.c97-page) a`.

## Scope

In scope are all 56 routes that are not already Catalog 97, including the writing and portfolio detail pages the original design scoped out, the ten fantasy football routes, and `/arcade` and `/food-map`, which as of 2026-09-16 run their own palettes. `/admin` is not exempt from the shell and the bridge. It receives both like every other route, since deleting the Working Instrument header would otherwise leave it with none, and no family PR restyles its internals.

## Part one, the shell and the token bridge

This is the first PR. It touches no page component.

The route registry in `src/constants/catalog97Nav.ts` stays an allow list. `isCatalog97Route` returns true only for the seven designed routes, and `catalog97NavLinks` stays as the seven-link header nav. `ConditionalLayout` passes those seven routes through unwrapped and wraps every other route, `/admin` included, in `Catalog97ToolShell`, so the chrome on every route comes from `Catalog97Header` and the espresso footer. The Working Instrument header, its mobile menu, `Footer.tsx`, and `navlinks.tsx` become dead code and are deleted in this PR. `HeaderSearchPanel` already renders inside the Catalog 97 header, so search survives unchanged.

A new `Catalog97ToolShell` in `src/components/catalog97/` wraps every non-portfolio route. It is `Catalog97Shell` plus one paper band carrying a kicker naming the route family, the page `h1`, and an optional standfirst, with the page body rendering below. Routes that draw their own hero pass a flag to suppress the band. The `ProjectBuildNote` that `ConditionalLayout` appends from `projectBuildNoteLinks` moves into this shell so nothing is lost. The shell keeps one `main` and one `h1` per route.

The bridge is a block in `catalog97.css` under `[data-c97]` and each `[data-c97-surface]` scope that redeclares every `--home-*` token as an alias to the Catalog 97 value for the enclosing surface. The mapping is

| Working Instrument token | Catalog 97 value |
| --- | --- |
| `--home-paper`, `--home-paper-alt`, `--home-paper-raised` | the enclosing surface, with alt and raised resolving to the next surface in the same ink family (paper to bone, espresso to pine) |
| `--home-ink` | `--c97-ink` |
| `--home-ink-muted`, `--home-ink-soft` | `--c97-ink-2` and `--c97-label` |
| `--home-rule`, `--home-control-rule`, `--home-stone` | `--c97-rule` |
| `--home-signal`, `--home-signal-ink` | `--c97-accent` |
| `--home-signal-soft`, `--home-overlay` | a measured tint of the accent on the surface, chosen for 3:1 against the surface |
| `--home-positive`, `--home-negative`, `--home-warning` | the new `--c97-positive`, `--c97-negative`, `--c97-warning` from part two |
| `--home-dark-*` | the espresso surface values |
| `--radius-sm` through `--radius-pill` | `0` |
| `--shadow-sm` through `--shadow-xl` | `none` |
| `--font-body`, `--font-heading`, `--font-display`, `--font-home-sans` | `--c97-font-body` |
| `--font-home-serif` | `--c97-font-display` |
| `--font-mono`, `--font-jetbrains-mono` | the new `--c97-font-mono` |

Dark values follow the same mapping through the existing `.dark [data-c97]` overrides, so no second table is needed. The `:root` declarations of `--home-*` in `globals.css` stay in place until the close-out PR, since `/admin` still reads them and the migration must never have a broken middle state.

The `--home-haze`, `--home-acid`, and `--home-moss` legacy tokens are not bridged. They have zero component consumers and are deleted here.

## Part two, extending the language

These additions land in the same PR as the bridge, since the bridge maps onto them. All of them go into `catalog97.css`, declared under the token scopes, inside the frozen scales, with nothing added to the type ladder, the spacing ladder, or the surface list.

Status colours. Each of the eight surfaces (paper, bone, camel, stone, tobacco, chocolate, pine, espresso) gets `--c97-positive`, `--c97-negative`, and `--c97-warning`, one set for the light-ink surfaces and one for the dark-ink surfaces, in both themes. Values are chosen by measurement to clear 4.5:1 as text on their surface, and on tobacco they are only used at `--c97-fs-h2` and above, which is the large-text rule the home brief settled. The standings rows, status chips, and delta readouts across the sports and data dashboards are the first consumers.

A chart ramp. `--c97-chart-1` through `--c97-chart-6`, built from the palette in the order pine, camel, oxblood, chocolate, tobacco, stone, plus `--c97-chart-up` and `--c97-chart-down` aliasing the positive and negative tokens. The eight D3 charts resolve colour at render time through `getComputedStyle`, so they pick these up through the bridge with no chart code change. Adjacent steps are checked for 3:1 against each other on paper and on espresso.

A mono face. Fragment Mono is already loaded in `src/app/layout.tsx` as `--font-fragment-mono`, so `--c97-font-mono` points at it and `.c97-tabular` gains a `.c97-mono` sibling for readouts and code. No new font is downloaded.

Five component classes.

| Class | Replaces | Shape |
| --- | --- | --- |
| `.c97-table` | the ad hoc table markup in the football and data dashboards | hairline rules, tabular numerals, sticky header, label-step column headings |
| `.c97-stat` | `StatCard`, `MetricCard`, `.tool-stat-*` | label, value, delta triplet; value in the body face at `--c97-fs-h2`, never Anton |
| `.c97-chip` | `Badge`, `Chip`, `InfoChip`, `.tool-meta-chip` | label-step uppercase on a surface tint, no radius |
| `.c97-segmented` | `SegmentedTabs`, the fantasy tab rows | pressed buttons drawn the way the `/dashboards` category filter already is, with the `--c97-sp-3` gap that brief settled |
| `.c97-panel` | `WarmCard`, `SurfaceCard`, `.tool-card`, drawers, sidebars | a surface change, so a panel on paper is a bone field with no border and no shadow |

Form controls extend `.c97-field` to select, checkbox, radio, and range, keeping the existing focus rule.

Deliberately not added are a soft accent tint token, a raised elevation mix, and any radius token. Those are Working Instrument ideas this work retires.

## Part three, migration by family

Eight families after the bridge, each its own branch and PR, ordered so shared code moves before the routes that depend on it and the highest-risk routes go last.

| Order | Family | Routes | What changes |
| --- | --- | --- | --- |
| 0 | Shared components | 0 | `ui/*`, `editorial/*`, `home/*`, `football/*`, `fantasy/*`, `investments/*`, `spacex/*`, `RouteErrorBoundary`, `RouteLoadingState`. Re-tokenized to `--c97-*` and the new classes. |
| 1 | Detail pages | 3 | `/writing/[slug]`, `/writing/topics/[topic]`, `/portfolio/[slug]`. Prose moves into `.c97-prose`. |
| 2 | Utility pages | 8 | `/now`, `/changelog`, `/accessibility`, `/search`, `/analytics-reference`, `/agent-build-index`, `/enablement-assistant`, `/design/catalog-pages`. |
| 3 | Sports dashboards | 10 | `/premier-league`, `/la-liga`, `/world-cup-2026`, `/nba`, `/mlb`, `/nfl`, `/golf`, `/formula-1`, `/fantasy-formula-1`, `/march-madness-2026`. Mostly carried by family 0. |
| 4 | Data dashboards | 9 | `/bay-area-transit`, `/earthquake-pulse`, `/spacex-mission-control`, `/news-pulse`, `/github-trending-pulse`, `/polling-aggregator`, `/tech-startup-tracker`, `/frontier-models`, `/ai-dev-tools`. Tables, stat rows, and charts through the ramp. |
| 5 | Tool shell routes | 10 | `/fintech-tools/budget-planner`, `/fintech-tools/interchange-iq`, `/fintech-tools/rent-vs-buy`, `/travel`, `/travel-deals`, `/wine-cellar`, `/museum-log`, `/recipe-finder`, `/decision-lab`, `/mba-internship-notifications`. `.tool-*` is replaced by `Catalog97ToolShell` and `.c97-panel`, and the `.tool-*` block is deleted at the end of this PR. |
| 6 | Investments and score pools | 4 | `/investments`, `/score-pools`, `/score-pools/settings`, `/score-pools/tracker`. |
| 7 | Fantasy suite | 10 | `/fantasy-football` and its nine children. Last because it is the most interactive and its e2e specs are the strongest regression net on the site. |
| 8 | Own-palette routes | 2 | `/arcade` drops the CRT palette and `/food-map` drops `--fm-*` for Catalog 97 surfaces. Leaflet tiles stay as they are. |

Within a family PR the order is shared component, then route, then delete. Any Working Instrument helper class or `ui/` component that the family was the last consumer of is deleted in that PR.

The close-out PR after family 8 deletes the `:root` `--home-*` declarations, the bridge aliases, and the `.home-*` and `.section-*` helpers from `globals.css`, and does the docs and lint work in part four. `/admin` keeps whatever of `globals.css` it still reads.

## Part four, verification and docs

Every family PR runs typecheck, the full Jest suite, and the Playwright specs covering its routes. Per the sitemap drift memory, I merge main and regenerate the sitemap before pushing each one.

Every route in a family is swept live in Playwright at 390 and 1440 in both themes for AA text contrast resolved against the enclosing surface, horizontal overflow, exactly one `main` and one `h1`, no heading skips, and 44px targets with no overlapping pairs. That is the sweep the 2026-09-14 loop ran, and a computed-value parser sanity check of 16.29:1 for ink on paper runs before any finding is believed.

Representative routes in each family get an Impeccable critique and audit. Before any Impeccable command I read `~/.claude/impeccable/OPERATING-NOTES.md`, `LOOP.md`, and `UPSTREAM.md`, and each route gets a surface brief written first so the tool judges against Catalog 97 and not against `DESIGN.md`. The bridge PR writes the brief for `Catalog97ToolShell`.

Three test files pin the Working Instrument chrome today: `src/app/__tests__/layout.test.tsx`, `src/components/__tests__/StaticHeader.test.tsx`, and `e2e/fantasy-football.spec.ts`. The bridge PR rewrites the first two against the Catalog 97 header and updates the fantasy spec's selectors. The design-adherence lint in `eslint.ds-adherence.mjs` flips in the close-out PR from enforcing `--home-*` to banning it and enforcing `--c97-*`, so drift back is a lint failure.

Docs in the close-out PR. `STYLING.md` is rewritten as the Catalog 97 reference, covering the surface contract, the frozen scales, the status and chart tokens, and the component classes, and its Working Instrument sections go. `DESIGN_CHECKLIST.md` drops the sharp-plate, elevation-mix, and signal-accent rules and gains the surface, band, and large-text-on-tobacco rules. `DESIGN.md`, `PRODUCT.md`, and `.impeccable/design.json` are regenerated from the shipped result, and every surface brief loses its "Catalog 97, not Working Instrument" paragraph. The Styling Rules and shell sections of `CLAUDE.md`, plus `AGENTS.md`, `COMPONENTS.md`, and `PAGES.md`, get the same pass.

## Known interim state

The bridge maps signal orange onto oxblood, and the fantasy and sports pages use signal for live dots and active states, so those read quieter than they do today until their family PR lands. That is the intended end state, but it is visible in the interim, and it is why the fantasy family is not first.

The header nav changes on every dashboard from eight links to seven. Investments and Fantasy are reached through `/dashboards`, which is the design's intended way in.
