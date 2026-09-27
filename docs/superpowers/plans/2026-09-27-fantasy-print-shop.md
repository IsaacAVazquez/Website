# Fantasy print shop implementation plan

**Goal:** Ship PR 5 of `docs/superpowers/specs/2026-09-25-project-specific-ui-design.md`, which is unification family 7 for the fantasy suite plus the print shop grammar in a green lead and saffron second press, on branch `design/fantasy-print-shop`, cut from `design/personal-tools-reland` (main plus PR 2, open as #477).

**Architecture:** The suite already has its signatures in the tier plates and cliff lines, the range bars, and the draft rooms, so nothing new gets drawn. Each route moves off the `--home-*` tokens and the Working Instrument helpers onto the `--c97-*` tokens and classes, its regions become sheets, and its headings take poster type. The eight routes read their inks from `PROJECT_PRESS`, so `Catalog97ToolShell` prints the saffron overprint on every sheet.

**Global Constraints:** The decisions the surface briefs and the 2026-09-14 audit made stay closed. The position tints stay (QB on the accent, RB positive, TE warning). The fantasy controls keep the heavier border, which `--home-control-rule` carried and `--c97-ink-2` carries now. The board heroes stay on `/fantasy-football` and `/fantasy-football/best-ball` and stay cut on the trackers, board order is never re-ranked locally, flex and quarterback ranks never merge, the waiver reading stays rank percentile minus rostered percentage, simulated and seeded rooms keep saying so, the trade package table describes only the offered assets, the best ball full PPR against half PPR mismatch stays a documented trade-off, and the `SeasonalScopeNote` freshness framing stays. Drawer and dialog focus traps, live regions, and every role, name, and test id the tests assert stay as they are. `HomeStatsPanel.tsx` and the `.tool-*` CSS stay for the close-out PR. Copy changes are limited to what the new type needs, and any that do change follow `WRITING_VOICE.md`.

## Task 0: Shared groundwork (done before the routes)

The eight fantasy routes join `src/constants/projectPress.ts` as green and saffron, with a test that fails until every `src/app/fantasy-football/**/page.tsx` route has its row. The map stays exact-match, since the redirect stubs under `/fantasy-football` never render a page.

`scripts/migrateHomeTokens.mjs` runs over every fantasy `.tsx`, `.ts`, and `.css` file, `src/lib/fantasyUtils.ts` (which owns the position tints and the shared chip classes), and the fantasy tests that assert token strings, so the tests follow the tokens they check. `var(--font-home-serif)` becomes `var(--c97-font-display)` and `var(--font-home-sans)` becomes `var(--c97-font-body)`. Every `rounded-*` utility comes out, since radius is banned and the bridge only zeroed the token radii. `home-kicker` becomes `c97-kicker` and `home-card` becomes `c97-panel`.

`.home-dash`, which zeroes paragraph and list margins inside a data surface, has no consumer outside fantasy, so its four declarations move to `.c97-dash` in `catalog97.css` inside `@layer components`, where margin and padding utilities still beat it the way they beat the original. `.home-dash` itself stays in `globals.css` for the close-out.

## Task 1: Rankings board and the shared components

`fantasy-football-client.tsx` and everything in `src/components/fantasy/`. The header becomes the green hero sheet with the poster h1 and the standfirst, and the chips move onto a paper plate because every status token on green resolves to the ink. The seasonal note, the sticky controls, the tier board, and the questions print on paper sheets below it with a torn seam where the surface changes. The questions heading takes `.c97-poster-sm`, the sr-only board heading stays sr-only, and player names in the drawer and the compare modal take Newsreader.

## Task 2: Best ball board and its tracker

`best-ball-client.tsx` gets the same hero as the rankings board. The tracker keeps its split header, the display headline on setup and one compact line once a draft is running, and its setup, contest, board, recommendations, and build panels become panels on paper sheets.

## Task 3: Redraft draft tracker

`draft-tracker-client.tsx` and `components/`. The same split header, with the setup headline in poster type. The draft board, analytics, and recap panels move onto `.c97-panel`, and the decision strip keeps its sticky behaviour and inline style.

## Task 4: Mock draft

`mock-draft-client.tsx`. The header takes poster type, and the simulated and seeded labels stay where they are.

## Task 5: Trade calculator

`trade-calculator-client.tsx` and its components. The header takes poster type, the balance scale stays in the evaluation rail with its reduced-motion guard, and the disclaimer on how the estimate works stays the one serif italic line.

## Task 6: Weekly board and waiver targets

`weekly-client.tsx` renders both routes. The header takes poster type, the section headings take `.c97-poster-sm`, and the flex and quarterback rank spaces and the waiver reading stay exactly as they are.

## Task 7: Verification and review

Full Jest to a log, `tsc --noEmit`, and ESLint on the touched directories. `e2e/fantasy-football.spec.ts` and `e2e/fantasy-trade-calculator.spec.ts` against the dev server on port 3300. The contrast sweep over the eight routes, with a draft room and a trade seeded through localStorage for the trackers and the calculator. A probe at 360, 390, 820, and 1440 for horizontal overflow and page errors, and screenshots in both themes at 1440 and 390. One fresh review of the branch diff, fixes for Critical and Important findings, then merge main, rerun Jest and `tsc`, push, and open the PR against `main`.
