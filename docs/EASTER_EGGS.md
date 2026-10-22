# Easter eggs

This is the running list of every hidden or playful thing on the site, meaning anything a visitor can stumble into that the page doesn't announce. Most of them live in two header components, but a few are spread across the dashboards, and without a list it's easy to break one in a redesign or forget it exists. When a change adds, alters, or removes an easter egg, it updates this file too. Last checked against the code on 2026-10-02, and the Konami code and stamp knock entries were checked again on 2026-10-12. The Konami code, humans.txt, and the two kicker note entries were checked again on 2026-10-13, after the fantasy football redesign took the poster type off the two draft trackers' setup titles, so on a fantasy page the code moves only the footer and the build-note strip, where the page has one. Seven more were added on 2026-10-21, the 404 note, the end mark, the homer note, the drill launch, the worn-in stamp, four search answers, and the future vintage.

Most of them mount from the header, which is on every route. `src/components/catalog97/Catalog97Header.tsx` renders `Catalog97Monet` (the painted hovers) and `Catalog97EasterEggs` (the Konami code, the console note, the stamp and its knock, the proof marks, the safelight, and the tab title). The reduced-motion guard at the end of `src/app/catalog97.css` cuts every transition and animation inside `.c97-page` to 0.01ms, so each entry below says what's left when motion is reduced.

## At a glance

| Easter egg | Where | Trigger | Touch screens | Code |
| --- | --- | --- | --- | --- |
| Visit receipt | Footer, every route | Follow Print receipt | Yes | `discoveries/VisitReceipt.tsx`, `lib/visitReceipt.ts` |
| Site transit map | Site search | Search take me somewhere | Yes | `discoveries/SiteTransitMap.tsx` |
| Isaac's scouting report | Fantasy rankings board | Search Isaac or Isaac Vazquez | Yes | `fantasy/IsaacScoutCard.tsx` |
| After-hours gallery | Home and About portraits | See all five painters, then follow The gallery is open | Yes | `discoveries/PortraitControls.tsx`, `PainterGallery.tsx` |
| Article commentary | Three build articles | Activate the -30- end mark | Yes | `discoveries/ArticlePostscript.tsx`, `lib/articlePostscripts.ts` |
| 1997 homepage | Site search | Search 1997 | Yes | `discoveries/RetroHome.tsx` |
| Registration puzzle | Footer, every route | Activate the printer registration mark | Yes | `discoveries/RegistrationGame.tsx` |
| Website tasting note | Wine Cellar | Inspect the cork three times | Yes | `discoveries/WineCork.tsx` |
| Portrait painters | `/`, `/about` | Hover the portrait's section, click the portrait or Another painter to change painter | Yes, through the button | `Catalog97Monet.tsx`, paint reveal block in `catalog97.css` |
| Monet name by time of day | Header, every route | Hover or focus the name | Only as a stuck hover on `/` | `Catalog97Monet.tsx`, Monet block in `catalog97.css` |
| Painted collage plates | `/` | Hover a dashboard plate | No | `Catalog97Collage.tsx`, `Catalog97Home.tsx` |
| Konami code | Every route but `/arcade` and `/spacex-mission-control` | ↑ ↑ ↓ ↓ ← → ← → B A | No, it needs a keyboard | `Catalog97EasterEggs.tsx`, `konami.ts` |
| Console note | Every route | Open the browser console | Not applicable | `Catalog97EasterEggs.tsx` |
| Footer rubber stamp | Footer, every route | Click the footer wordmark | Yes | `Catalog97EasterEggs.tsx` |
| Stamp knock | Footer, every route but `/arcade` | Stamp the wordmark six times inside three seconds | Yes | `Catalog97EasterEggs.tsx` |
| Worn-in stamp | Footer, every route | Stamp the wordmark a hundred times, counted across visits | Yes | `Catalog97EasterEggs.tsx` |
| Press-proof marks | Every route | Hold Option or Alt | No, it needs a keyboard | `Catalog97EasterEggs.tsx` |
| Darkroom safelight | Every route | Flip the theme toggle five times inside four seconds | Yes | `Catalog97EasterEggs.tsx` |
| Away tab title | Every route | Switch to another tab | Yes | `Catalog97EasterEggs.tsx` |
| Night shift title | Every route | Switch to another tab between midnight and 5am | Yes | `Catalog97EasterEggs.tsx` |
| Hidden search answers | Header search, `/search` | Search one of a few exact phrases | Yes | `src/app/api/search/route.ts` |
| The arcade | `/arcade` | Reached from the Konami or stamp toast, or search | Yes | `src/app/arcade/` |
| 30 lives | `/arcade` | ↑ ↑ ↓ ↓ ← → ← → B A | No, it needs a keyboard | `ArcadeClient.tsx`, `konami.ts` |
| Teapot | `/teapot` | Visit the address | Yes | `src/app/teapot/route.ts` |
| humans.txt | `/humans.txt` | Visit the address | Yes | `public/humans.txt` |
| SpaceX liftoff | `/spacex-mission-control` | Have the page open when the countdown hits T-0 | Yes | `MissionControlHero.tsx`, `liftoff.ts` |
| Drill launch | `/spacex-mission-control` | ↑ ↑ ↓ ↓ ← → ← → B A | No, it needs a keyboard | `MissionControlHero.tsx`, `konami.ts` |
| Early kicker note | `/fantasy-football/draft-tracker` | Draft a kicker or defense in round 1 or 2 | Yes | `src/lib/draftEarlySpecialistNote.ts` |
| Second kicker note | `/fantasy-football/draft-tracker` | Draft a second kicker or a second defense | Yes | `src/lib/draftEarlySpecialistNote.ts` |
| Homer note | `/fantasy-football/draft-tracker` | Draft four players from one NFL team | Yes | `src/lib/draftEarlySpecialistNote.ts` |
| The "-30-" end mark | `/writing/[slug]` | Read to the end of a post, then press the mark | Yes | `ArticleEndMark.tsx`, `catalog97.css` |
| The 404 note | 404 page | Visit `/coffee`, `/admin`, `/dashboard`, `/cv`, or a few others | Yes | `src/components/NotFoundNote.tsx` |
| Future vintage | `/wine-cellar` | Type a vintage later than this year | Yes | `wine-cellar-client.tsx` |
| Halftone split | 404 page, some `/writing` cards | Hover a halftone field | No | `catalog97.css` |

## Portrait painters

Hovering anywhere in the portrait's section on the home page or /about shows a 150px circle of a painted version of the headshot that follows the pointer. Clicking the portrait hands it to the next painter, from Monet (the default), to Van Gogh, to Seurat, to Hopper, to Lichtenstein, and back to Monet. The choice lives on the element, so a reload or a navigation resets it to Monet, and each painting downloads the first time someone hovers it. The pointer-following reveal runs only where hover is real and motion is welcome. The explicit Another painter control shows a still full painting, which also works on touch screens and with reduced motion. Seeing all five painters opens the after-hours gallery link.

The paintings are rendered ahead of time from `public/images/headshot-home.webp` into `public/images/home/headshot-<painter>.webp`, Monet by `scripts/paint_impressionist.py` and the other four by `scripts/paint_headshot.py`. Both renderers were removed on 2026-10-01 and can be restored from git history (commit fa4849574). Adding a painter means a render, an entry in `PAINTERS` in `Catalog97Monet.tsx`, and a `[data-c97-painter]` rule in `catalog97.css`.

## Monet name by time of day

Hovering or tabbing to "Isaac Vazquez" in the header turns the letters into a window onto a Monet, with the edges roughened into brushstrokes by the `#c97-monet-brush` SVG filter and the canvas drifting slowly behind them. The painting depends on the visitor's local hour when the page loaded, from Impression, Sunrise in the morning (5:00 to 10:59), to Water Lilies at midday (11:00 to 16:59, and for anyone without JavaScript), to Houses of Parliament, Sunset in the evening. It doesn't change if the hour turns while the page is open. On a phone, tapping the name goes home, so it only shows as a stuck hover when you're already on `/`. With reduced motion the drift stops and the painted letters stay.

## Painted collage plates

The three dashboard plates in the home collage each reveal a painted version under a hover circle, with the launch pad (to /spacex-mission-control) in Van Gogh, the transit plate (to /bay-area-transit) in Seurat, and the matchday plate (to /premier-league) in Hopper. The painters are set in `Catalog97Home.tsx` and the images came from `scripts/paint_plates.py`, which was removed on 2026-10-01 and is in git history (commit fa4849574). The plates are still links, since the painted layer never takes the pointer, and they don't cycle painters. Hover only, and with reduced motion the plates stay as photographs for the same reason the portrait does.

## Konami code

Typing ↑ ↑ ↓ ↓ ← → ← → B A anywhere except /arcade and /spacex-mission-control, which answer the code themselves (see 30 lives and the drill launch below), throws the page out of register for six seconds. On the pages still printed with the poster classes, meaning the seven designed routes and the 404, the poster type jitters off its overprint, the offset shadows jump, the halftone dots swell, and the sheets shift a few pixels and tilt. The utility pages, the topic pages, and the articles set their titles in display type and carry none of those classes, so there the sheets and bands shift and tilt, the footer with them, and nothing else moves. A project route owns its design and for the most part prints without those classes, so there the footer and the build-note strip, where the route has one, slip and tilt, and little else moves. A saffron toast in the bottom left reads "Out of register" and "You found the code. The press needs a few seconds to line back up, and the arcade is open in the meantime.", with a button to the arcade and a close button. Esc closes it, and it closes itself after 12 seconds unless it's hovered or focused. Keys typed into form fields, modifier combos, and held-down repeats don't count, and /arcade is skipped because the arcade answers the code itself (see 30 lives below). With reduced motion it becomes a still misprint with no movement, which shows on the poster type, the offsets, and the halftone, so on a utility page, a topic page, an article, or a project route that has none of them only the toast shows. The styles are in `Catalog97EasterEggs.module.css`, and they reach `.c97-poster`, `.c97-poster-sm`, `.c97-offset`, `.c97-halftone`, the sheets and bands inside `main`, and the footer.

## Console note

Once per full page load the console gets a styled note that opens with "Hi, thanks for opening the console." and goes on to how the site is built and tested, with a link to the repo. It doesn't repeat on client navigation.

## Footer rubber stamp

Clicking or tapping the wordmark in the footer presses it and stamps a smaller copy in the overprint ink where you clicked, halftoned and tilted at random, fading over 2.4 seconds, with at most five on the sheet at once (`MAX_IMPRINTS`). A pointer cursor on the wordmark is the only hint. With reduced motion the press is skipped and the stamp appears and disappears without animating.

## Stamp knock

Six stamps on the footer wordmark inside three seconds (`KNOCK_STAMPS` and `KNOCK_WINDOW_MS`) knock the page out of register the same way the Konami code does, for the same six seconds, so on a project route it is the footer and the build-note strip that move. The toast reads "Out of register" and "You stamped hard enough to knock the press out of line. It needs a few seconds to settle, and the arcade is open in the meantime.", with the same two buttons. It's the way into that effect for a phone, since the code needs a keyboard. Slower stamps only stamp, and after a knock it takes six fresh stamps to do it again. On /arcade the wordmark still stamps but never knocks the press, since the toast would only point back at the page the visitor is already on.

## Worn-in stamp

Every stamp on the footer wordmark also counts toward a lifetime total kept in localStorage under `c97-stamps-v1` (`STAMPS_KEY`), so it carries across visits and pages in the same browser. The hundredth stamp (`WORN_IN_STAMPS`) gets a toast that reads "Worn in" and "That's your hundredth stamp, counting every visit from this browser. The rubber is worn in now, and it will keep printing.", with only a close button. It fires once, since the count keeps climbing past it. When the hundredth stamp is also the sixth of a knock, the knock's toast keeps its place and the milestone passes quietly. Clearing site data resets the count.

## Press-proof marks

Holding Option or Alt on its own, outside a form field, prints proof marks over the page, meaning crop marks at the corners, registration targets top and bottom, a four-ink colour bar, and a slug line like "Proof 1 · /about · 28 Sep 2026". Letting go, pressing any other key, or leaving the window clears them. They never print on paper.

## Darkroom safelight

Flipping the theme toggle in the header five times inside four seconds (`SAFELIGHT_FLIPS` and `SAFELIGHT_WINDOW_MS`) puts the page under a darkroom safelight for six seconds. It's one sheet of vermilion multiplied over the viewport, so paper prints red and ink stays dark in both themes, and it never takes the pointer, so the page under it still works. A toast reads "Safelight on" and "You flipped the lights enough times to trip the safelight. It turns itself off in a few seconds.", and closing that toast with its button or with Esc turns the light off early.

The flips are read off the `dark` class on the root element, which next-themes sets, because the toggle loads late and lives in the header. Flips made while the light is on don't count toward the next one, so flipping faster can't make it flash. With reduced motion the light comes on and goes off with no fade, and it never prints on paper.

## Away tab title

Switching away from the tab changes its title to "Still on the press…", and coming back restores it, unless the page set a new title in the meantime.

## Night shift title

From midnight until 4:59am on the visitor's own clock, the away title reads "Running the night shift…" instead (`NIGHT_SHIFT_ENDS`). The hour is read when the tab is hidden, so a tab left at 4:59 keeps the night title until someone comes back to it, and the page's own title still returns either way.

## Hidden search answers

A few exact searches in the header search (`/` or Cmd or Ctrl+K) and on /search pin a written answer to the top of an unfiltered search. The match is on the whole query, lower-cased with punctuation turned into spaces, using `Object.hasOwn` so inherited prototype properties like `constructor` never match. The answers live in `HIDDEN_ANSWERS` in `src/app/api/search/route.ts`.

| Search | Answer | Links to |
| --- | --- | --- |
| monet | Monet on the home page | `/` |
| konami, konami code, cheat code, cheat codes | Konami code | `/arcade` |
| hire me, hire isaac | Get in touch | `/contact` |
| easter egg, easter eggs | Easter eggs | `/` |
| darkroom, safelight | Darkroom | `/` |
| stamp, rubber stamp | Rubber stamp | `/` |
| night shift | Night shift | `/` |
| contra, 30 lives, thirty lives | 30 lives | `/arcade` |
| teapot, 418, i'm a teapot | Teapot | `/teapot` |
| humans, humans.txt, colophon | Colophon | `/humans.txt` |
| coffee, espresso | Coffee | `/teapot` |
| hello, hey, howdy | Hello | `/contact` |
| 404, misprint | The misprint | `/404`, which is itself a 404 |
| now, what is isaac doing now, what are you doing now | What I'm doing now | `/now` |

The "Easter eggs" answer promises "a few hidden around the site, from something on the home page, to a note in the browser console, to a couple I'll leave for you to find", so it should stay roughly true as this list changes. The last six rows each hint at one easter egg without giving the whole trigger away, and the Konami answer says the code is worth trying inside the arcade too.

## The arcade

/arcade is Reactor, a standalone neon reflex game with a boot sequence ending "> ready player one.", an insert-coin screen, and a high score kept in localStorage under `arcade-reactor-hiscore-v1`. It isn't in the header, the footer, /dashboards, or /portfolio, so the ways in are the Konami toast, the stamp knock's toast, the Konami and 30 lives search answers, its normal search entry, the June 25 changelog entry, and the sitemap. Its neon palette lives in its own `src/app/arcade/arcade.module.css`, outside the Catalog 97 tokens. It works on touch, and with reduced motion the boot typing is skipped.

## 30 lives

Typing the Konami code on /arcade gives 30 lives, which is what it gave in Contra. The line in the top bar that normally reads "● ● ● INSERT COIN" changes to "> cheat accepted. 30 lives." and the lives readout changes from three hearts to a count. Entered on the boot or game over screen it waits for the next start, and entered in the middle of a run it tops the lives up on the spot. It covers one run, and that run's score stays off the saved high score, with the game over screen reading "You scored 120 with 30 lives, so the cabinet isn't counting it." It needs a keyboard.

## Teapot

/teapot answers with HTTP 418 and a short plain text note, which says the address is a teapot and can't brew coffee, and that the status code comes from RFC 2324, an April Fools' joke from 1998. It's a route handler (`src/app/teapot/route.ts`), so it has no page and no layout, and it stays out of the sitemap, which walks `page.tsx` files only. Nothing links to it except its hidden search answer.

## humans.txt

/humans.txt is a plain text colophon with the stack, the typefaces, the seven riso inks, the host, and the repo, plus a note pointing to the console note. It states facts about the build, so `src/lib/__tests__/humans-txt.test.ts` holds each one to the file it came from, meaning the major versions to `package.json`, the typefaces to the `next/font` imports in `src/app/layout.tsx`, and the inks to the `--c97-riso-*` tokens in `catalog97.css`. A major version bump or a new ink fails that test until the file is brought back in line. It names the five Catalog 97 typefaces and leaves out Instrument Sans, which still loads as a holdover.

## SpaceX liftoff

On /spacex-mission-control, if the page is open and visible when the countdown crosses the scheduled T-0 (within a five-second grace window), a small riso rocket rises up the screen and flies off the top, once per launch, and a status line reads "T-0 by the schedule. The snapshot can't tell me whether it flew." With reduced motion, or in print, the rocket doesn't render but the note still shows.

## Drill launch

Typing the Konami code on /spacex-mission-control flies the same rocket on demand, as many times as the code is typed, and prints a status line under the schedule that reads "That one was a drill. The code can't move the schedule, so the real rocket goes when the countdown does." The hero listens for the code itself through the shared `konami.ts` helpers, and `Catalog97EasterEggs` leaves the code to this route the way it leaves it to the arcade, so the page never goes out of register. Keys typed into a field don't count, and with reduced motion only the note shows. It needs a keyboard.

## Early kicker note

In /fantasy-football/draft-tracker, if your own team takes a kicker or a defense in round 1 or 2, a note you can dismiss says "A kicker in the first two rounds is a bold call. I'd have waited until the last round, but it's your league.", or the same idea for a defense, once per draft. The best ball tracker and the mock draft don't have it.

## Second kicker note

In the same tracker, if your own team takes a second kicker or a second defense in any round, the note says "A second kicker is a bold call. I'd want that roster spot back, but it's your league.", or the same for a defense, once per draft. When the early kicker note already ran in that draft it reads "a bold call too". `getSpecialistNote` in the same file checks the early note first, this one second, and the homer note third, and the tracker calls only that.

## Homer note

In the same tracker, the pick that gives your own team four players from one NFL team says "Four from one team. I respect the loyalty, but that bye week is going to hurt." It fires on the fourth and only the fourth, so a fifth stays quiet, it counts a defense as a player from its team, and a player with no team on the board (an unmatched one) never counts. `getHomerNote` in `src/lib/draftEarlySpecialistNote.ts`.

## The "-30-" end mark

Every post under /writing but the three with commentary ends with "-30-", the old newsroom sign that a story is over, set in poster type with an overprint shadow. It is a button (`src/components/editorial/ArticleEndMark.tsx`, labelled "What the end mark means"), and pressing it opens a note under the mark that explains the sign, says how long it has been since the page loaded by the tab's own clock ("under a minute", "about 3 minutes", "about an hour"), and links to the next post in the chronology, or says the post is the newest one. Pressing again closes it. The note is a status region, so it announces when it opens.

## The 404 note

The misprint reads the address it failed on, and a few addresses get a line under the lead (`src/components/NotFoundNote.tsx`, matched on the lower-cased pathname). /coffee, /cafe, /espresso, and /latte say the press can't brew coffee either and link to the teapot. Anything ending in .php, and /admin, /administrator, /login, /signin, /xmlrpc, and any /wp- address, which are what scanners try, say there is no back room to log in to. /dashboard without the s points at /dashboards, /home, /index, and /index.html point at the root, /cv and /resume.pdf point at /resume, /secret, /hidden, and /easter-eggs say the eggs don't have an address and link to a search for them, and /404 admits it is a real one. Everything else gets the ordinary misprint.

## Future vintage

In /wine-cellar, typing a vintage later than the current year into the form prints "A bottle from the future. I'd open it before the paradox does." under the field while it stays that way. The year is read from the visitor's clock on each keystroke, never on the server, since the draft is empty there. The field still accepts the bottle, since the cap on the input is 2100.

## Halftone split

Hovering a halftone field splits it into blue, vermilion, and saffron dots slightly off register, like a print under a loupe. It shows today on the 404 misprint sheet and on /writing featured cards whose cover isn't a local image. Hover only.

## Close calls that aren't on the list

Text selection prints in the second ink (`catalog97.css`), which is ordinary styling. The 404 page is a themed misprint sheet with a one-time feed-in animation, but that's the page's normal design. `/score-pools/settings` is unlinked and noindexed, but it's a utility page with nothing playful in it. There's nothing playful in robots.txt, llms.txt, or security.txt.

## The back room additions

Added on 2026-10-21. The receipt, map, gallery, retro homepage, and puzzle live under `/back-room/[discovery]`. Each destination is noindexed and absent from the sitemap. They use the normal site shell, and their components load on their own routes.

### Visit receipt

The footer's Print receipt link opens `/back-room/receipt`. `VisitLedger` records visits to known public tools and main pages in this tab's session storage, under `site-visit-receipt-v1`. The receipt combines repeat visits into quantities, lists every item at $0.00, and has a PNG download and a clear button. The list has at most 40 destinations, with quantities capped at 999. Search queries, article addresses, private tools, unknown routes, and back-room routes are excluded. Restored entries are validated against the public route dictionary. Storage failures use memory, and the receipt never sends the list to a server.

### Site transit map

Searching `take me somewhere` in either site search pins a link to `/back-room/transit`. The fictional railway has the Sports Line, the Saturday Line through museums, food, wine, recipes, and travel, and the Orbital Extension through transit, earthquakes, and Mission Control. Every station is a working link, with Dashboard Junction as the shared transfer. On a phone the lines run vertically. No map provider or live transit feed is involved.

### Isaac's scouting report

Searching exactly `Isaac` or `Isaac Vazquez`, ignoring case and repeated spaces, in the redraft rankings board adds a novelty scouting card above the matching real players. It has no player ID, rank, ADP, or roster action. Leave on waivers clears the search and returns focus to the board's search control. The real ranking snapshots and draft state never include the novelty player.

### After-hours portrait gallery

The Another painter button beside the Home and About portraits cycles the same five painters as clicking the image. After all five have appeared, The gallery is open links to `/back-room/gallery`, which shows all five existing paintings with fictional museum labels. The button shows a still painting on touch screens and with reduced motion, and works with a keyboard. Discovery resets when the portrait controls unmount. The original pointer-following reveal stays available on hover-capable devices without reduced motion.

### Article commentary

The end mark is an expandable native details control on `building-a-wine-cellar-app`, `building-a-bart-transit-dashboard`, and `building-a-fantasy-football-rankings-platform`. Its note restates a product decision already described in that article. The text lives in `src/lib/articlePostscripts.ts`. On those three the commentary takes the place of the end mark button, and every other article keeps the button. Each new commentary entry needs an existing source or Isaac's own account of the build.

### Greetings from 1997

Searching `1997` links to `/back-room/1997`, with beveled links, a tiled background, an under-construction sign, and a decorative visitor counter fixed at 000097. Its links lead to the actual site pages. The guestbook stores up to 12 entries, each at most 160 characters, under `site-1997-guestbook-v1` in local storage. Entries stay in that browser, and neither Isaac nor other visitors can read them. Restored strings are validated and rendered as text. A storage failure keeps entries for the open page and says so. Clear guestbook removes the entries.

### Registration puzzle

The printer registration mark in the footer links to `/back-room/registration`. Four labeled sliders move the horizontal and vertical offsets of two colored ink layers relative to the fixed paper. Every offset must be within one unit of zero before a dated souvenir PNG can be downloaded. Arrow keys adjust the sliders. Reset inks restores the starting offsets. It has no timer, animation, or stored score, and reduced motion changes nothing.

### Website tasting note

The cork illustration under the Wine Cellar title reveals a fictional Château Side Project label after three clicks, taps, or keyboard activations. A note after the first inspection hints at the trigger. The label links to Recipe Finder, and Put the cork back closes it and returns focus to the cork. It never adds a bottle to the wine log or changes saved entries.
