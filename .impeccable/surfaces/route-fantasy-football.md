---
version: 1
slug: "route-fantasy-football"
primary_target: "route:/fantasy-football"
related_targets: ["src/app/fantasy-football/fantasy-football-client.tsx","src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx","src/app/fantasy-football/best-ball/draft-tracker/draft-tracker-client.tsx"]
---

# Fantasy Football

## Mode

Operate. The visitor is running a live draft against a clock, so scanability, stable density, and predictable structure outrank expression. Brand lives in precise details rather than in composition.

This holds for every route in the group, including the `/fantasy-football` board itself. The board looks like a landing page but its job is filtering and comparing players, not persuading anyone.

## Audience

Isaac, plus fantasy players arriving from search. PRODUCT.md is explicit that the tool fleet is personal work rather than the headline proof of the site, so this surface stays credible and available without being staged as the pitch. Do not redesign it into a marketing surface.

## Routes in scope

Four real routes, all snapshot-driven with `error.tsx` and `loading.tsx` in place. `/fantasy-football` is the rankings board, `/fantasy-football/draft-tracker` is the redraft tracker, `/fantasy-football/best-ball` is the best ball board, and `/fantasy-football/best-ball/draft-tracker` is the best ball tracker.

`/fantasy-football/tiers/[position]` and `/fantasy-football/rb-tiers` are pure `redirect()` stubs with no data fetching and no UI. They correctly have no error or loading boundary. Do not flag them for one.

## Decisions not to re-litigate

The board order comes from Underdog ADP for standard best ball formats and from a sourced Superflex consensus for Superflex, never from a locally computed adjustment. An Underdog ADP sitting at the undrafted floor is ignored in favor of consensus rank, because roughly a third of the best ball snapshot piles up at the last pick of the draft.

Reach and steal judgments need real market data. A consensus rank past 150 is a board position rather than a pick number, so it returns null and the pick goes unjudged instead of being scored against a number that was never a pick.

Best ball recommendation weights follow published Underdog advance-rate research, including scoring completed Week 17 game stacks, allowing same-team concentration up to four players, and a three-QB standard target. The weights themselves are calibrated judgment rather than measured coefficients.

The draft tracker header splits on whether a draft is running, decided 2026-08-07. Setup keeps the display headline and the pitch paragraph, because that visitor is still deciding whether to use the tool. A running draft gets one compact line of live state. Do not restore the headline to the running state, and do not remove it from setup.

## Three false positives, already investigated

Do not re-raise these. Inputs look unlabeled to a same-line regex, but every one carries `id` on the following line with exactly one matching `htmlFor`. The `h1` looks missing to a `<h1[\s>]` pattern, because the tag sits alone on its line with the attributes below it. The two tiers routes look like data routes missing their boundaries, but they are redirect stubs.

## The detector cannot see this surface at all

Proven 2026-08-07 with a positive control rather than assumed. A planted `.tsx` carrying a `#667eea` to `#764ba2` gradient, `borderRadius: 24px`, a 40px glow, `fontFamily: Inter`, `transition: all`, and `backdropFilter: blur(12px)` returned zero findings, while the identical declarations in a `.css` file and in a styled-components literal each fired `overused-font`. The regex engine does not read JSX inline style objects, and this surface styles entirely through Tailwind utilities plus inline style objects referencing custom properties.

So `detect.mjs` returning an empty array here means nothing matchable, not clean, and it is worth no run time. URL mode does not substitute, because puppeteer is not installed and URL mode then exits 0 with an empty array, which is indistinguishable from a clean scan. The real mechanical check for this codebase is a Playwright assertion on computed values. `globals.css` is the only stylesheet these routes reach, and its five findings all sit in `.prose-writing` selectors that belong to the writing surface.

## A contrast-sweep trap worth knowing

Chrome returns `color(srgb 0.968 0.965 0.951)` for `color-mix()` results, and the Working Instrument palette uses `color-mix` heavily. A luminance parser that only handles `rgb()` reads those 0-1 values as 0-255, computes the limestone paper as near-black, and manufactures a page of 1.17:1 failures on text that is actually around 16:1. Sanity-check any sweep by asserting ink on paper lands near 16.3:1 before believing a single finding.

## Verified state, 2026-08-07 (all six passes done)

Full critique snapshot at `.impeccable/critique/2026-08-07T15-28-23Z__route-fantasy-football.md`, which carries every finding with file and line as it stood before any remediation. It scored Nielsen 25/40, all ten heuristics applicable, two P0 and three P1. The score has not been re-run, so treat 25/40 as the starting point rather than the current state.

An earlier version of this section claimed every named finding was closed. The audit of 2026-08-07 disproved that, so do not trust the claim. The critique's P1 also named `--home-ink-muted` at 4.25:1 on the signal-tinted tile in `DraftAnalyticsPanel.tsx`, and remediation darkened only the three status tokens and never touched `--home-ink-muted`, which still measures exactly 4.25:1. The audit also found a contrast failure the layout pass introduced, where "Your pick is live" renders signal on a signal wash at 3.87:1. Audit report at `.impeccable/audit-2026-08-07-fantasy-football.md`, scoring 17/20 with two P1 open.

All six passes have landed. `audit` and `layout` are on the two branches described below. `adapt`, `harden`, `clarify`, and `polish` are all on `refine/fantasy-draft-tracker-hierarchy`, in commits `7eea9d3d`, `479fa3c6`, `0625a088`, and `d1448e36`. Typecheck is clean and the full Jest suite passes at 1747 tests, 83 of them across `src/app/fantasy-football`, `src/components/fantasy`, and `src/lib/__tests__/fantasyTeamValue.test.ts`.

Theming remains clean across the group. Zero hardcoded hex, zero legacy `--surface-*` or `--color-*` tokens, zero `transition-all`, zero `color-mix` toward literal white or black, zero arbitrary `text-[Npx]`, radii at 8px and below on plates, and all four Framer Motion consumers call `useReducedMotion`.

Correcting an earlier claim in this brief. Touch targets were recorded as verified at `min-h-[48px]`, which was true of the routes that audit measured and false on the draft board, where three row action buttons rendered 36x36. That is fixed now, but the lesson stands, so do not generalize a target sweep from one route to the whole group.

## Two branches, unpushed and unmerged as of 2026-08-07

Both were cut independently from main, so neither contains the other's work. The token change is not present when viewing the tracker branch.

`fix/skip-link-and-status-contrast` carries two site-wide fixes. The skip link was keyboard-reachable and never painted, because an unlayered `.sr-only` in `globals.css` outranked Tailwind's layered `focus:not-sr-only`. Moving it into `@layer utilities` fixed size and overflow, and the second half was that Tailwind v4 resets `clip-path` and never touches the legacy `clip`, so the rule had to switch properties too. Light-mode `--home-positive`, `--home-warning`, and `--home-negative` were darkened until each clears 4.5:1 on paper, paper-alt, and both tinted surfaces. Best ball contrast went from 42 failures to zero.

`refine/fantasy-draft-tracker-hierarchy` now carries five of the six passes. The layout P0 came first, measured at 390px with a draft running, where the first "Log pick" moved from y=2274 to y=1022, the board heading from y=1645 to y=385, the mobile Draft Outlook from y=777 to y=7193, and undersized touch targets from 56 to 6. Undo and Redo now sit in a fixed bottom bar on phones, where Undo had been 9,549px down. The clock takes the signal accent from 15 seconds out rather than only after expiry. "Your pick is live" became `role="status"` with `aria-live="polite"` and lost the pill shape that made it look like a button.

`adapt` (`7eea9d3d`) finished the mobile pass. The rankings-board compare toggle went from 62 in the DOM and 2 visible to 63 and 63, each 44x44. The compare tray collapses to a single pill, which takes the fixed band from 136px to 56px at 390px without touching the pinned ids. The position filter row wraps at every width instead of scrolling with a suppressed scrollbar, so both rows report 0px hidden. Undersized tap targets on the tracker went from 5 to 0.

`harden` (`479fa3c6`) fixed the compare modal. The winning cell carries a checked "Best" token at 12.64:1 in light and 11.82:1 in dark, with the tint only reinforcing it. The grid became a real table with a caption, `th scope="col"` on the player headers, and `th scope="row"` on the metric labels. `MIN_MEANINGFUL_DELTA` sets a floor per row and a winner has to beat the next best player, which took the critique's own case, Trey McBride against Brock Bowers, from 4 banded rows to 2. Six new tests pin the thresholds.

`clarify` (`0625a088`) fixed the copy. Four em dashes acting as sentence connectors are gone, two visible and two spoken through `aria-label`, and the browser now reports zero on the board and both trackers. The board search placeholder reads "Search TE board" instead of "Search te board". The best ball tracker took its own `h1`, "Track every pick and see what your build still needs." Model vocabulary was replaced with the plain description, so "Modeled room rank" became "Your rank in this room, modeled" and "Slots per judged pick" became the sentence that says what the number counts. Nothing computed changed and the honesty framing, as-of stamps, and separate-simulation disclosure are untouched. The room rank itself now holds until a team has `ROOM_RANK_MIN_PICKS` picks and says so, instead of rendering "3 of 3" and "Ahead of 0%" three picks in. Four is exported from `fantasyTeamValue.ts` and is the same boundary `confidenceFor` already used to stop calling a read early, so the two cannot drift.

`polish` (`d1448e36`) closed the rest. The best ball room board's position chip resolves to ink on stone, which retires the last `--home-moss` in the tree and frees the status tokens, measured at 16.47:1 in light and 15.59:1 in dark against a parser sanity-checked at 16.29:1 for ink on paper. Filter state uses `router.replace`, so four position taps leave `history.length` unchanged at 38 and one Back leaves the page. Both tracker shells and the best ball build-panel card carry literal `aria-label` names. The compare tray chip went from `max-w-[8rem]` to `max-w-[12rem]` with the full name on `title`, so "Washington Commanders" renders in full at 148px instead of clipping. The shared drawer takes `compareAvailableBelowSm` and the tracker passes false, which closes the dead end where a phone user could pin players on the tracker into a tray that never appears.

One regression was introduced and caught during that pass. Collapsing the header initially dropped the freshness chips entirely, and the existing client test caught it. Freshness is a credibility feature on this surface, so it is back as a muted line carrying scoring format and source date. Watch for this in any further condensing.

One inversion was introduced deliberately and should be revisited rather than left as a leftover. The running header renders the `h1` at 20.5px against the board `h2` at 30.4px. The document outline is correct and a quiet page title mid-draft is arguably right, but it is a new visual inversion rather than an inherited one.

## `layout` on the shared components and the two boards, 2026-08-07

Run on `audit/fantasy-combined`, two commits, `2055ca12` and `833bd861`. This closes the gap the section below describes. Measured with Playwright at 390, 768, 1024 and 1440 in both themes, on the same already-running dev server.

The spatial thesis it worked to. A player row is one object with three groups in a fixed order, identity, then context, then comparable numbers, with the two row actions as furniture that must never compete with identity for width. Down the page the numbers form columns and the columns are the point. The compare tray is status plus one action rather than a roster editor, so at a width where the names cannot sit on one line the names are what yields. Inside the comparison the metric labels lead, because a value without its label is unreadable, so they are the last thing allowed to leave the viewport. Equivalent rows render at one height, and fixed overlays are sized against the viewport they cover.

Four defects, none of which fails a threshold.

The compare tray was a `max-w-3xl` box centred in the viewport. At 1440 it sat at x=336 in a page whose cards run 32 to 1408, so it aligned with nothing, and its chips wrapped to a second row with 600px of the bar's own width unused. It now wraps in `home-shell home-shell-wide`, which is what both boards and the redraft tracker already use, so its edges land on the board card's left edge and the rail's right edge. Verified at 390 (16 to 374), 768 (24 to 744), 1024 and 1440 (32 to 1408), and on the tracker at 1440. Height 120px to 68px.

At 390 each chip is 44px tall because its remove button is, so three pinned stacked one per row and pushed the minimize button onto a fourth. The bar measured 236px of an 844px viewport, with the board heading and the whole position filter underneath it. Below `sm` it now states a count. 236px to 78px. The names are still in the modal the bar opens and every board row's own compare toggle still removes a player. The brief's earlier "136px to 56px" figure was taken with fewer players pinned, so do not read it as covering the three-pinned case.

The bar is fixed and the page carried no bottom padding, so the last 132px of the page sat under it whenever anything was pinned. A spacer inside `CompareTray` reserves it.

In the rankings row the action pair held a grid column below `md`, costing 100px of a 316px row. That left the name 126px and the descriptor the same 126px, so all 60 rows spent a second line on "CIN, WR1, Avg 1.81". The row's own comment claimed this was already fixed and it was not. Out of flow at the top right, the descriptor gets 226px and one line.

The largest one was the breakpoint itself. The row took its wide inline shape at the `md` viewport breakpoint, but the width it gets is not monotonic in viewport width, because the board card runs the full page at 768 and the list is 670px, and then the rail appears at 1024 and the same list drops to 538px. So the row was widest where the breakpoint said it was narrower. At 1024, 54 of 60 rows rendered 232px tall against 82px on a desktop, with names truncated to "Christian McCaff..." and the position chip and descriptor each on their own line. The row is now a query container at `@2xl`, which is 42rem and is what the inline shape costs. Measured on the overall PPR board, 60 rows: 1024 went from 232px x54 and 209px x6 to 124px x40 and 127px x20, page 10,535px; 768 went from six heights between 82 and 162 with truncated names to 123 and 126, page 11,770px; 1440 unchanged at 82 and 85, page 8,037px; 390 unchanged. Truncated names went from 3 of the first 8 at two widths to zero everywhere. Zero horizontal overflow at all four widths.

The compare table has a 34rem floor, so at 390 it runs 544px inside a 316px box with 228px off screen and the third player entirely out of view. Scrolling to reach him took the row labels with him. The metric column is now sticky at the scroller's left edge, verified through the full 228px scroll in light and dark.

`2055ca12` also declares `adpAvailable` on `CompareTray`. `3ffea108` and `5be12171` both added callers for that prop without ever committing the declaration, so the branch tip did not typecheck on its own. That is worth remembering as a pattern rather than a one-off.

Three things this pass surfaced and deliberately did not act on.

Both board clients carry another session's in-flight work, so editing them would have meant partial staging of somebody else's diff. The rankings board at 390 puts the display controls, meaning density, view, and the "60 of 523 shown" count, between the board heading and the data selectors, so you choose how to look before you choose what to look at, and the count sits about 400px from the rows it counts. On the best ball board below `lg` the "Selected format" aside falls under 12,592px of player rows, so a phone visitor picks a contest at y=600 and reads what that contest is at y=13,563. Both are real and both are a DOM reorder inside a file another session is holding.

The metric values in the row are left-aligned under left-aligned labels, so "6.0" and "11.3" do not line their decimals up in a column you read downward. That is a smaller call than it looks, because right-aligning values under left-aligned labels has its own cost, and it was left for whoever decides the column treatment.

Two things worth knowing for the next run. The Next.js dev-tools portal renders a circular badge at the bottom left that overlaps anything docked there, which looks exactly like a real collision with the compare tray and is not, since it does not exist in a production build. And the detector still returns `[]` here, which the section below already explains; a manual sweep of the same scope found zero `transition-all`, zero hardcoded hex, zero banned tokens, zero arbitrary `text-[Npx]`, and no one-off spacing values, with every bracket value structural (grid templates, transition property lists, touch-target floors, safe-area insets).

## Remaining work, in order

No pass from the 2026-08-07 critique is outstanding. Do not re-run `adapt`, `harden`, `clarify`, or `polish` on these routes without a new reason, because each one has a commit and a measured before and after above. `layout` is now done on the shared components and the boards as well, in the two commits recorded above, so it is no longer the exception this section used to call it.

The paragraphs below record why the gap existed and are kept for the lesson rather than as open work. `layout` ran on the two draft trackers only, never on the two boards and never on the shared components in `src/components/fantasy/`. That gap shipped a real defect. The compare table used the default auto layout, so with three players pinned its columns sized themselves to their own content at 200px, 170px, and 135px, leaving whoever had the shortest name jammed against the table edge with ragged card heights. Fixed in `5be12171`.

Worth knowing why the other passes did not catch it. `audit` measures thresholds, meaning contrast ratios, 44px targets, and overflow booleans, and three columns of different widths pass every one of them. A full audit sweep of that modal came back clean. `harden` had rebuilt the same table and was looking at semantics rather than geometry. `critique` inspected the modal in a browser and wrote a P1 about it that covered only the color-only winner cue and the noise threshold. A proportion defect has no threshold to fail, so only the rendered half of `layout`, meaning the squint test and the grouping and rhythm comparison, reliably catches this class. The 232px rows at 1024 are the same lesson a second time, and they had been shipping through six passes.

What is genuinely still open is smaller and none of it came from a named finding.

The two branches still need merging. `fix/skip-link-and-status-contrast` and `refine/fantasy-draft-tracker-hierarchy` were cut independently from main, so the status-token contrast fix is not present when viewing the tracker branch and the light-mode ADP delta values still fail there. Neither branch is pushed. Whoever merges should re-sweep best ball light-mode contrast afterward, because the 42-failures-to-zero measurement was taken on the other branch.

The heading inversion on the running tracker header is still there, at 20.5px for the `h1` against 30.4px for the board `h2`. It was deliberate and the document outline is correct, but it is a visual inversion someone should decide about rather than inherit.

The shared `getPositionTone` in `src/lib/fantasyUtils.ts` still spends `--home-signal` on QB, `--home-positive` on RB, and `--home-warning` on TE for position identity, which is the same category-versus-status confusion `polish` fixed on the best ball room board. It was left alone on purpose, because it backs the row chips, filter pills, drawer, and compare tray across every fantasy route and the critique did not name it. Changing it is a system-wide visual decision, not a cleanup.

The composition finding from the Design Specificity Verdict is answered as far as it is going to be, and this is a decision rather than an open item. Asked directly on 2026-08-07 whether the landing-page hero ahead of every control was deliberate, Isaac chose to cut it on the trackers only and keep it on the two boards. So the boards opening with a display headline and a pitch paragraph is intended, not a leftover. A search arrival on a board needs the orientation; someone mid-draft does not. Do not re-raise it, and do not remove those heroes.

Four things the critique raised that nobody has picked up. There are still zero keyboard shortcuts on a clock-driven surface, no `Cmd+Z` despite the full undo stack in `useDraftState`, no next or previous in the player drawer, and nothing sticky on the board, so pick number, team on the clock, and timer all leave the screen the moment you scroll. Those are the Flexibility and Recognition heuristics, scored 2 and 3, and they are product work rather than remediation.

## Update, 2026-08-12

The two branches from the section above are both merged. `fix/skip-link-and-status-contrast` landed as `0585de35`, and the five `refine/fantasy-draft-tracker-hierarchy` passes landed under rebased SHAs (`b4a1275c`, `0a028880`, `9a217ed7`, plus `b6fa6e77` and `b96ea02c`), so main now carries all six passes and the local branch refs are gone. Read the branch section as history.

A dual-agent critique re-ran today against main. It scored 31/40, up from 25, with zero P0 and two P1. Snapshot at `.impeccable/critique/2026-08-12T14-59-45Z__route-fantasy-football.md`. The mechanical evidence on main in both themes measured zero AA contrast failures on all four routes (gate verified 16.29:1 light, 15.28:1 dark), zero horizontal overflow at 390, 15 of 15 visible focus indicators including a painting skip link, and clean landmarks. The one remaining sub-44px target is the site footer's "Now" link at 34.8px wide, which is shared shell code rather than fantasy code. The in-page detector cannot inject here at all now for a newly verified reason, the app's CSP blocks the live server's script-src and connect-src, so computed-value sweeps stay the only honest instrument.

The two P1s are both on the best ball room. `best-ball-draft-board.tsx:160` spends signal orange on full rank-provenance sentences down the list, and the best ball tracker never adopted the 2026-08-07 running-header split, keeping its full pitch and no sticky live state mid-room. The P2s are the details/summary disclosure with no visual affordance on the recommendation cards and the deferred 390px control-order item on the rankings board, whose file is no longer held by another session. The keyboard gap stays open and product-shaped.

Separately today, an engine audit fixed a cross-scale compare bug in the shared lookup. Position-only players (absent from the overall board) used to resolve into compare and queue surfaces with position-scale rankEcr, tier, and expert ranges, which could mark the wrong player Best against overall-scale ranks. `getCrossBoardFantasyPlayers` in `src/lib/fantasy.ts` now strips those fields for position-only players, both clients build their lookups from it, and a test in `src/lib/__tests__/fantasy.test.ts` pins it, so a compare row showing "--" for a deep position-only player is correct behavior, not missing data.

## Four passes landed, 2026-08-12

The critique's two P1s and two P2s are fixed in the working tree, verified in one batched Playwright round at 1440 and 390 plus the full fantasy Jest suites (106 tests) and typecheck.

The quieter pass took signal orange back from the best ball room board. The rank-provenance sentences render in muted ink (measured rgb(104,101,90)) behind a single signal dot that marks the adjusted state, and the full sentence rides on `title` past the truncation, which also closes the critique's clipped-text flag. The pick countdown is a decision now, not an open question: it is advisory, nothing fires at zero, so it stays muted while other teams pick (numeral measured at ink-muted with Team 2 on the clock) and takes the accent only in the final 15 seconds of the user's own pick. Do not re-raise the always-on clock as an anxiety finding; quiet-by-default is the recorded answer.

The layout pass ported the running-header contract to the best ball tracker. Setup keeps the display h1 (65.2px measured) and the pitch; an open room collapses to a compact h1 (34px) with the freshness date kept in the muted line, a live bar sticks at top 73px reading round, pick, and who is on the clock (verified still at y=73 after a 2,500px scroll), and the phone's fixed bottom bar now pairs Undo (93x52) with My build (257x52). The room-open signal reaches the page shell through an `onRoomOpenChange` prop from `BestBallDraftRoom`. The mobile bottom-bar Undo is named "Undo", deliberately distinct from the two "Undo last pick" buttons so none shadows the others in tests or screen readers.

The adapt pass reordered the rankings board so DOM order equals visual order at every width: heading, then position, scoring, and search, then density and view with the result count beside them, measured at 390 with the count 36px above the list it describes (previously ~400px away). The sticky heading bar now holds only the h2 at all sizes.

The polish pass gave "Why this player" an explicit chevron that rotates on open (the flex summary strips the native marker), on all three recommendation cards. The critique's "duplicated model explainer" observation did not verify at source level: the recommendations header sentence and the Draft Outlook paragraph are different copy explaining two different scores, both protected honesty framing, and both stay.

Still open from the critique, deliberately unpicked: the keyboard layer (shape-level product work), the site footer's 34.8px "Now" link (shared shell, not fantasy code), the green-encodes-disagreement range bars and NEED chip tint, and the below-sm h1/h2 inversion decision.

## Update, 2026-08-22

The rankings board was rebuilt 2026-08-18 (`5e702541`) into a tier-first design, numbered tier plates, avg-rank cliff separators whose spacing scales with the drop, a windowed 40-row list with an explicit Load more, and a board-owned player drawer that gained a prior-season PPG panel (`6e96eaef`) and metric tooltips (`2a5b031c`). The list/tiers views, density toggle, compare tray, and legend are gone from this page, so the board-specific paragraphs above this section describe the old board and read as history.

A dual-agent critique re-ran today on the rebuilt rankings board alone, not the four-route group the 08-07 and 08-12 runs scored. It came in at 31/40 with zero P0 and four P1. Snapshot at `.impeccable/critique/2026-08-22T00-36-03Z__route-fantasy-football.md`. Mechanical state in both themes: zero AA contrast failures (parser sanity gate reproduced 16.29:1 light and 15.28:1 dark; the floor is the 10px cliff label at 4.57:1), zero horizontal overflow at 390/768/1024/1440, zero board-owned targets under 44px (the footer "Now" link at 34.8px remains the one shared-shell exception), 22 of 22 visible focus indicators with a painting skip link, drawer dialog trap, Esc, and focus restore verified, no entrance motion (the board client no longer imports framer-motion), clean console and network across every interaction, queue and note persistence verified through a reload, and a clean URL contract (replaceState filters, one Back leaves the page, legacy `?view=` still lands and is preserved).

`detect.mjs` fired on this surface for the first time, one finding, `design-system-font-size` on the board h1 at `fantasy-football-client.tsx:1206`, because the clamp endpoints are literal rem values in an inline style. The blindness calibration above otherwise stands unchanged, as does the CSP block on overlay injection.

The four P1s. The row's `absolute inset-0` overlay button (`:1104`) makes the whole row-level title layer dead and blocks text selection, and the sweep found all 249 board titles on non-focusable spans with no `aria-describedby`, the six header hover triggers inside the `aria-hidden` label row. At 768px, 18 of the first 60 rows render the player-name span at 0px width (every chip-bearing row) and 58 truncate, so the row keeps everything except identity. The only column-label row is `hidden md:flex` and non-sticky, so labels vanish mid-scroll on desktop and never exist on phones. The filter bar is `md:sticky` only, so phones lose position, scoring, and search the moment they scroll. The P2 is the queue, write-only on the board (drawer round-trip per player) and color-only (orange rank digit, no sr state, no count, no queued view). Next after those: the position boards render an all-dash vs ADP column because `metricColumns` gates on `adpAvailable` rather than `vsAdpMeaningful` (`:1014`), beside an overall-scale ADP next to position-scale Avg. The drawer's "What is…?" buttons are the correct, verified-reachable tooltip pattern to copy for the header and row layers.

Two decisions surfaced rather than made. The rebuild dropped the pitch paragraph the 2026-08-07 hero decision explicitly kept, so the header is headline plus chips now, restore-or-bless was decided 2026-08-22: restore one orienting sentence under the headline (not yet implemented, slated for the polish pass). And body scroll is not locked behind the open drawer.

Another session held in-flight edits across the fantasy tree at critique time (both draft trackers, best ball, mock draft, `DraftValuePanel`, `useFantasySnapshot`, `fantasyUtils.ts`, `update-fantasy.yml`); `fantasy-football-client.tsx` itself was clean. Measurements ran against the dev server, meaning the working tree. Coordinate before any remediation touches those files. That batch landed 2026-08-22 as the baseline commits on `refine/fantasy-design-pass`, and the passes below sit on top of it.

## Remediation passes on the rebuilt board, 2026-08-22

The harden pass closed the critique's P1 #1, the dead row help layer. The row's content div now sits above the `absolute inset-0` overlay button (`relative z-[2]`) with its own click handler that opens the drawer unless text is selected, so every cell `title` fires on hover (measured 30 of 30 reachable across the first five rows, from 0), player names drag-select cleanly (verified selecting "Ja'Marr Chase" without the drawer opening), and a plain click anywhere on the row still opens the drawer. The overlay button stays as the single tab stop with its 2px focus outline, and Enter still opens the drawer. The column-label row lost its `aria-hidden` and its six definition triggers became real buttons through a new opt-in `focusable` mode on `MetricTooltip` (hover plus focus, `aria-describedby`, Escape to dismiss, an expanded invisible hit area); the default children mode is unchanged for the investments call sites. Keyboard and touch users reach metric definitions through the header buttons and the drawer's "What is…?" buttons; row cells keep native titles for pointer hover plus the existing per-cell sr-only labels.

The adapt pass closed P1 #2 and P1 #4. The player name took a `min-w-[7rem]` floor, the identity line wraps instead of clipping, and the expert spread bar yields below `lg`, measured on the first 60 PPR rows at 768 going from 18 zero-width and 58 truncated names to 0 and 1, with 1440 unchanged (0 and 0, bar still 120px) and zero horizontal overflow at 390, 768, and 1440. The controls bar is now sticky at every width (`top-[4.5rem]`), with the full row `hidden md:flex` and a one-line compact variant below md: a native position `<select>`, the scoring toggle with short labels (`PPR / Half / Std`, full names kept as `aria-label`), and a search icon that expands to a full-line input with autofocus and an explicit "Clear search" X that clears only the query. Measured at 390 after a 2,500px scroll the bar holds at top 72 at 64px tall with the select on screen; the expanded input measures 306px (it was 45px in the first cut before the open state took the whole line); searching "Nacua" filters to Puka Nacua and writes `q=` to the URL; the select drives `position=rb`. The count line ("40 of 520 shown") is desktop-only now, dropped from the compact bar so the scoring toggle stops clipping, and the Value/Reach chips wrap under the name on phones instead of clipping at the plate edge (9 chips, 0 clipped).

The layout pass closed P1 #3. The column-label row moved inside the sticky controls bar at md and up, so the labels ride with the bar and were measured still visible over their columns at 1440 after a 3,000px scroll; the "Expert spread" label hides below lg to match the bar's own breakpoint. Below md every metric value carries its own aria-hidden micro-label (Rng, Avg, ADP, ±ADP) in muted 3xs mono, so a phone row reads "RNG 22–87 AVG 38.7 ADP 56.7 ±ADP +18.7" instead of bare numbers; the cells' fixed right-aligned widths apply only at md and up so the labeled pairs flow naturally when wrapped. The sr-only cell labels stay and the micro-labels are aria-hidden, so screen readers hear each value named once. The label row renders only when the board has rows (`boardReady`), keeping it out of the loading, error, empty, and slice-unavailable states.
