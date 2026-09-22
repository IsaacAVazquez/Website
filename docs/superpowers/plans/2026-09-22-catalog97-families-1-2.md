# Catalog 97 families 1 and 2 implementation plan

**Status, 2026-09-22.** Shipped in one PR on the branch `iv/pensive-mayer-te59tl`. The boxes below are ticked to match what landed.

**Goal:** Move the three detail pages and the eight utility pages off the token bridge and onto Catalog 97 compositions, and re-tokenize the shared components those eleven routes depend on, so none of them reads a `--home-*` name any more.

**Architecture:** Every route already renders inside `Catalog97ToolShell`, so the page body becomes a sequence of `c97-band` sections that each declare a `data-c97-surface` and use the `catalog97.css` vocabulary. The stylesheet gains the page furniture the families needed and nothing else: a running-prose block for injected HTML, a JSX list, a breadcrumb, a disclosure, a keyboard key, a loading placeholder, and a meter, plus the `--c97-column` width for a prose column. The frozen scales did not grow.

**Spec:** `docs/superpowers/specs/2026-09-16-catalog97-unification-design.md`, part three, families 1 and 2. Family 0 is covered only as far as these routes reach; the dashboard, fantasy, investments, and editorial component sets still go through the bridge.

## What I chose and why

I took families 1 and 2 together rather than family 0 first, which is the order the spec lists. The detail pages are the most visited routes outside the seven designed ones, and the utility pages are small enough that the two families fit one review. Family 0 in full is mostly the football, fantasy, and investments component sets, which no route in these two families renders, so re-tokenizing them here would have been work with nothing on the page to check it against.

The running-prose column is 720px rather than the 54ch wide measure. An article carries tables and code blocks beside its paragraphs, and at 54ch both were cramped. The three measures stay frozen for single paragraphs; `--c97-column` is a layout constant like `--c97-container`.

Code blocks and inline code sit on the field tint rather than on inverted ink. An inverted block flashes a light rectangle into a dark article, and the field reads as the same surface change a panel makes.

Every section heading on a migrated route carries a kicker that names the route family (`Now`, `Accessibility`, `Case study`) rather than repeating the heading. Where the old page had the same words for both, the kicker is the route label.

## File map

| File | Action | Responsibility |
| --- | --- | --- |
| `src/app/catalog97.css` | Modify | `--c97-column`; `.c97-lead` margin reset; `.c97-article`, `.c97-list`, `.c97-breadcrumb`, `.c97-disclosure`, `.c97-kbd`, `.c97-skeleton`, `.c97-meter` |
| `src/app/globals.css` | Modify | Delete `.prose-writing`, `.changelog-prose`, `.skeleton` and its keyframes |
| `src/app/writing/[slug]/page.tsx` | Rewrite | Breadcrumb, display title, meta byline, standfirst, chip tags, `Catalog97Slot` cover with the credit as caption, `.c97-article` body, camel call to action, bone related ledger, author and neighbours |
| `src/app/writing/topics/[topic]/page.tsx` | Rewrite | Hero, archive ledger with a `.c97-disclosure` for the rows past 30, bone topic row |
| `src/app/portfolio/[slug]/page.tsx` | Rewrite | Hero with chips and actions, paper and bone section bands, stats, panels, tradeoff pairs, testimonial, neighbours |
| `src/app/now/page.tsx` | Rewrite | Hero, focus columns, reading ledger, building mosaic, list, keep-up prose |
| `src/app/changelog/page.tsx` | Rewrite | Hero and an entry ledger with `.c97-article` for each entry's HTML |
| `src/app/accessibility/page.tsx` | Rewrite | Hero, conformance prose, feature columns, shortcut table, four-column close |
| `src/app/search/page.tsx`, `src/components/search/*` | Rewrite | Hero, panels, field, segmented filters, result ledger |
| `src/app/analytics-reference/page.tsx`, `src/components/analytics/CodeSample.tsx` | Rewrite | Hero, setup and conventions columns, event ledger with parameter tables |
| `src/app/agent-build-index/page.tsx`, `src/components/newsletter/NewsletterSignup.tsx` | Rewrite | Hero with stat panel, numbered ranking ledger, meters, pine newsletter band |
| `src/app/enablement-assistant/enablement-assistant-client.tsx` | Rewrite | Same sections and state, styling layer swapped to bands, panels, stats, fields, and the table |
| `src/components/catalog97/Catalog97LayoutsCanvas.tsx` | Modify | Drop the nested `.c97-page` scope the tool shell now supplies |
| `src/components/ui/AuthorBio.tsx` | Rewrite | Square stone portrait, name at the h3 step as a paragraph, microlink contacts, no JS hover |
| `src/components/RouteErrorBoundary.tsx`, `src/components/RouteLoadingState.tsx` | Rewrite | One paper band each; the skeleton pulses in place |
| `src/components/ProjectBuildNote.tsx` | Rewrite | Bone band with the section link |
| `src/components/analytics/ArticleCodeCopy.tsx` | Modify | The injected copy button paints in ink-2 on the field |
| `src/components/catalog97/__tests__/Catalog97LayoutsCanvas.test.tsx` | Modify | Asserts the shell owns the token scope |
| `CLAUDE.md`, `AGENTS.md`, `COMPONENTS.md`, `DESIGN_CHECKLIST.md`, the spec, three surface briefs | Modify | Record which routes are off the bridge and the vocabulary a migrated route uses |

## Tasks

- [x] Add the page furniture to `catalog97.css` under the presentation line, with no new token except `--c97-column`.
- [x] Migrate `/writing/[slug]`, `/writing/topics/[topic]`, and `/portfolio/[slug]`.
- [x] Migrate `/now`, `/changelog`, `/accessibility`, `/search`, `/analytics-reference`, `/agent-build-index`, `/enablement-assistant`, and `/design/catalog-pages`.
- [x] Re-tokenize `AuthorBio`, `RouteErrorBoundary`, `RouteLoadingState`, `ProjectBuildNote`, `CodeSample`, `NewsletterSignup`, `ArticleCodeCopy`, and the search components.
- [x] Delete the `globals.css` classes whose last consumer moved.
- [x] Typecheck, lint, and the Jest suites that cover these routes.
- [x] Sweep every migrated route live at 390 and 1440 in both themes for one `main`, one `h1`, no heading skips, no horizontal overflow, and 44px targets.
- [x] Update the docs and the spec status.

## What is left for the next families

`.resume-chip` stays in `globals.css` because the Formula 1, polling, news, and MBA dashboards still render it. The editorial, football, fantasy, investments, and spacex component sets are family 0 work that families 3 through 7 will pull in as they reach each surface. `Chip.tsx` still carries the `.home-chip` classes for the same reason. The `--home-*` `:root` declarations and the bridge stay until the close-out.
