# Fantasy football redesign

**Date:** 2026-10-13
**Status:** Isaac asked for this on 2026-10-12 ("I want to redesign all of the fantasy football stuff") and again on 2026-10-13. I drew three directions as comps, chose one, and started the build the same night. He had not weighed in on the direction when the build started, so the choice is mine until he says otherwise, and the structure below holds under any of the three.

## What this is

Stage 2 of the project sovereign design (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`) gave fantasy football frame removal only. The poster hero, the plate, and the seams came off, and everything under them stayed. This is the full redesign of all eight routes as one product, meaning the rankings board, the best ball board, the best ball room, the redraft room, the mock draft, the trade calculator, the weekly board, and waivers.

## What I saw on the live site

On 2026-10-13 I looked at all eight routes at 1440 and 390 in both themes, with a draft running in each room, a trade on the desk, and the player drawer open. The pages can only be seen in season today, with ADP signals hidden and Draft Outlook paused, so I also looked at them with the September 8 snapshots served in place of today's and the browser clock set to that day, which is the state the tool is actually used in.

The pages are still Catalog 97 underneath. What is left after frame removal is warm paper with grain, bone plates, a maroon accent, and mono kickers, and the eight pages were built in different passes, so they carry four header styles and three heading faces between them. Position is the main visual code of any fantasy tool and here it is a faint tint on a small chip. Tiers and rounds are bordered plates. Every page opens on one or two bordered notes that repeat what the freshness line above them already says.

The work starts late. At 1440x900 in season the first player row is at 620px on the rankings board, 855px in the redraft room, 932px in the mock room, 1,151px on the best ball board, 1,314px on the weekly board, 1,396px on waivers, and 1,506px in the best ball room. In draft season those are 509, 711, 719, 1,103, 1,314, 1,396, and 1,387.

The redraft room is one 1080px column, so the roster, Draft Outlook, the signals, and the room actions sit under the player list, and Redo sits there too, away from Undo. The room holds every pick and every team's roster in state and shows only the last eight picks. Nothing links the eight tools as one product. Each page has a list of links at its foot, and two have a breadcrumb.

## Direction

I drew three directions as the same two screens, the rankings board and the redraft room at pick 16, on the September 8 data and inside the real site frame. They are on one page at https://claude.ai/artifact/MrukQvPezzfHvRou4cVnyN.

Board is the one I am building from. The idea is the physical draft board and its sticker labels. Position is the colour system, a pick is a solid sticker with the name set heavy and condensed, lists are ruled rows on a cool board with no boxes, and highlighter yellow always means mine or now. It has a light and a dark theme. I think it is the one that makes position readable at draft speed, and it does not look like the Investments terminal or like the site frame around it.

War room is a dark console in the idiom of the Sleeper and Underdog rooms, the same surface in both themes. It is the look people who draft online already know, and it would be the second dark console on the site. Cheat sheet is the printed sheet you mark up with a pen, with position as a coloured code and a thin bar. It is the calmest of the three and the one where position is hardest to pick out against a clock.

Three things come over from the two I did not pick. The spread column draws one standard deviation as well as the range, the pick grid marks which way each round snakes, and a room's tier head can say who is already gone.

## What the earlier briefs settled, and what this changes

The five surface briefs under `.impeccable/surfaces/` hold 32 settled items and about 30 more decisions recorded with the same force. Almost all of them are about data, models, behaviour, and words, and every one of those stands. That covers where board order comes from, what a reach or a steal may be judged against, the mock draft's pause, the trade verdict being withheld, flex and quarterback ranks never reading as one list, the waiver reading and its refusal to invent a bid, the not-published state of the weekly board, and every sentence of honesty text.

The visual ones are what this request reopens, and I have kept the intent of each.

The tracker header split (2026-08-07) said setup keeps a headline and the pitch and a running draft gets one compact line. That split stays. The Anton poster class that carried the headline goes, since the press idiom came off these pages in stage 2.

On 2026-09-12 Isaac was asked whether QB, RB, and TE should move off red, green, and amber onto neutral mixes, and he chose to leave them. The redesign keeps those three hues and gives WR, K, and DST hues of their own, so position colour gets stronger and nothing he kept is taken away.

The trade calculator's deal desk (approved 2026-08-13) stays as a composition, with settings at the left, the Give and Get ledger in the centre, the evaluation pinned at the right, and the balance scale moving as a player is added. It is redrawn in the new kit.

On 2026-09-14 he chose a 3:1 boundary for the fantasy controls. The kit holds that.

My team sits above the weekly board and the waiver list today, which the stage 2 notes call settled, and I could not find the decision itself. I have moved it beside the board on a wide screen and after it on a narrow one, so the board each page is named for is on the first screen. If that order was his call, it is one line to put back.

## The product shell

A layout at `src/app/fantasy-football/layout.tsx` wraps every fantasy route in the product's root. It loads the stylesheet and the typeface and renders the product bar, which is one row naming the product and linking the eight tools, with the current one marked. It replaces the link lists at the foot of each page and the two breadcrumbs. It is not sticky, because every page already has measured sticky bars of its own.

All eight routes join `WIDE_TOOL_ROUTES`, so they share the 1376px column and the site header and footer widen with them. Two of the eight were wide before, which made the page edge jump between sibling pages.

The site frame is untouched, meaning the header, the one `main`, the build-note strip, and the footer.

## The kit

The product has one stylesheet, `src/components/fantasy/fantasy.css`, with its own tokens (`--ffb-*`) on a root class and its own classes (`ffb-`). It lives under `src/components` so the route-stylesheet test treats it as shared, and every rule in it starts from the root or from a class it owns, since a stylesheet stays loaded after in-app navigation.

Colour. A cool board in light and in dark. Six position fills that are the same in both themes and always carry dark text, with a second set of position inks for marks drawn on the board. Highlighter yellow as a fill for mine and now. Three status inks, used with a sign or a word and never alone.

Type. Archivo as a variable font with its width axis, loaded through `next/font` on the fantasy routes only, which is the one added typeface the contract allows. Sticker type is heavy and condensed in capitals, label type is condensed and small, row names are semibold at normal width, and numbers are Archivo's tabular figures. No Newsreader and no Anton inside the product.

Pieces. The sticker, the roster slot, the pick grid, the scorebug (a room's status as one bar), the tier break, the spread plot, the position switch that doubles as the legend, and a notice that is a line of text with a rule at its edge.

Inside the root the Catalog 97 colour and font tokens are redeclared to the kit's values, so any inline style a page has not yet shed already paints in the new palette. That bridge is a safety net, and each page still ends up styled through kit classes.

## The pages

The rankings board follows the comp. The head, the sticky toolbar, and the board, with nothing else above the first row. Rows lead with the rank and the position chip, tiers break on a rule that carries the count, the pick range, and the cliff, and the spread plot shows which rounds the experts put a player in. The drawer's bordered tiles become a definition list. On a phone a row is two lines and the rest lives in the drawer.

The redraft room becomes a working room on the wide column. The scorebug is pinned, the last picks are stickers, the list is the wide column, and a rail beside it holds the roster as slots, a pick grid, Draft Outlook, the signals, and the room actions. The pick grid is new, and it is a view of state the room already holds. Redo moves up beside Undo. Setup puts the form and Start on the first screen.

The mock draft is built from the same pieces as the redraft room, so practice looks like the real thing. Sim to end, which cannot be undone, stops looking like one more harmless button.

The best ball board puts the board on the first screen, with the contest's card in a rail beside it. Rounds break on a rule where they sat in plates.

The best ball room follows the redraft room. The live bar and the status card become one scorebug, the pause prints once, and the rail leads with the build (targets, stacks, byes, the roster) ahead of Draft Outlook and the calculator.

The trade calculator keeps its deal desk and is redrawn without plates inside plates. The method disclaimer comes out of a collapsed disclosure and prints in the open next to the verdict, which is what `STYLING.md` already asks of a disclaimer.

The weekly board and waivers put the board first, with My team beside it on a wide screen. Position gets its colour, the same player reads the same way in both views, and the four different styles of control on the page become one.

The player drawer, the compare tray and modal, and Draft Outlook are rebuilt once on the kit, since several pages share them. Draft Outlook goes from tiles inside tiles to a flat list that fits a 400px rail.

Along the way the build fixes a few things that are wrong on the live pages. Provider names print twice in two best ball sentences, a loading state says ADP is stale, a finished best ball draft says cards stay hidden until your turn, and the trade calculator prints one stamp as two different dates, one of them with a time its source never gave.

## How the work is organised

One agent built the kit, the shell, and a reference sheet of every component. Five agents then rebuild the rankings board, the redraft room, the trade calculator, the weekly board and waivers, and the shared drawer, compare, and Draft Outlook in parallel, each in its own worktree with its own files, working from the kit, a brief, and a map of its slice that lists every state, control, pinned test, and protected sentence. Once those five are merged and reviewed, three more rebuild the mock draft, the best ball board, and the best ball room, so they are built from a redraft room, a board, and a drawer that already exist. All of the branches merge into `design/fantasy-football-redesign`, which is stacked on #596.

The files under `e2e/` do not change. They pin roles, accessible names, and test ids, and all of those stay. Unit tests that pinned the old look (a Catalog 97 class, a Tailwind class, an inline token colour) are re-pinned in the same commit on what they were checking.

## How I will know it worked

Typecheck, lint, the full Jest suite, a production build, the layout sweep on all eight routes from 320 to 2560 wide, the contrast sweep in both themes, and the Chromium e2e set. Then in a browser, in draft season and in season, at 1440 and 390, in both themes, I check every state of every page the capture script reaches, the first working element's position against the numbers above, a keyboard walk of each main path, reduced motion, and a print of each route. The eight pages get read side by side at the end for whether they are one product.

What I will not have checked is a real draft against a real clock, a screen reader, and Safari's and Firefox's engines beyond what the e2e matrix covers in CI.
