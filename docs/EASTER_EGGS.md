# Easter eggs

This is the running list of every hidden or playful thing on the site, meaning anything a visitor can stumble into that the page doesn't announce. Most of them live in two header components, but a few are spread across the dashboards, and without a list it's easy to break one in a redesign or forget it exists. When a change adds, alters, or removes an easter egg, it updates this file too. Last checked against the code on 2026-09-28.

Most of them mount from the header, which is on every route. `src/components/catalog97/Catalog97Header.tsx` renders `Catalog97Monet` (the painted hovers) and `Catalog97EasterEggs` (the Konami code, the console note, the stamp and its knock, the proof marks, the safelight, and the tab title). The reduced-motion guard at the end of `src/app/catalog97.css` cuts every transition and animation inside `.c97-page` to 0.01ms, so each entry below says what's left when motion is reduced.

## At a glance

| Easter egg | Where | Trigger | Touch screens | Code |
| --- | --- | --- | --- | --- |
| Portrait painters | `/`, `/about` | Hover the portrait's section, click the portrait to change painter | No | `Catalog97Monet.tsx`, paint reveal block in `catalog97.css` |
| Monet name by time of day | Header, every route | Hover or focus the name | Only as a stuck hover on `/` | `Catalog97Monet.tsx`, Monet block in `catalog97.css` |
| Painted collage plates | `/` | Hover a dashboard plate | No | `Catalog97Collage.tsx`, `Catalog97Home.tsx` |
| Konami code | Every route but `/arcade` | ↑ ↑ ↓ ↓ ← → ← → B A | No, it needs a keyboard | `Catalog97EasterEggs.tsx`, `konami.ts` |
| Console note | Every route | Open the browser console | Not applicable | `Catalog97EasterEggs.tsx` |
| Footer rubber stamp | Footer, every route | Click the footer wordmark | Yes | `Catalog97EasterEggs.tsx` |
| Stamp knock | Footer, every route but `/arcade` | Stamp the wordmark six times inside three seconds | Yes | `Catalog97EasterEggs.tsx` |
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
| Early kicker note | `/fantasy-football/draft-tracker` | Draft a kicker or defense in round 1 or 2 | Yes | `src/lib/draftEarlySpecialistNote.ts` |
| Second kicker note | `/fantasy-football/draft-tracker` | Draft a second kicker or a second defense | Yes | `src/lib/draftEarlySpecialistNote.ts` |
| The "-30-" end mark | `/writing/[slug]` | Read to the end of a post | Yes | `catalog97.css` |
| Halftone split | 404 page, some `/writing` cards | Hover a halftone field | No | `catalog97.css` |

## Portrait painters

Hovering anywhere in the portrait's section on the home page or /about shows a 150px circle of a painted version of the headshot that follows the pointer. Clicking the portrait hands it to the next painter, from Monet (the default), to Van Gogh, to Seurat, to Hopper, to Lichtenstein, and back to Monet. The choice lives on the element, so a reload or a navigation resets it to Monet, and each painting downloads the first time someone hovers it. It only runs where hover is real, since the CSS is gated on `(hover: hover)` and the script returns early without attaching the click either. With reduced motion the reveal still works and only the 0.3s fade goes instant.

The paintings are rendered ahead of time from `public/images/headshot-home.webp` into `public/images/home/headshot-<painter>.webp`, Monet by `scripts/paint_impressionist.py` and the other four by `scripts/paint_headshot.py`. Both renderers were removed on 2026-10-01 and can be restored from git history (commit fa4849574). Adding a painter means a render, an entry in `PAINTERS` in `Catalog97Monet.tsx`, and a `[data-c97-painter]` rule in `catalog97.css`.

## Monet name by time of day

Hovering or tabbing to "Isaac Vazquez" in the header turns the letters into a window onto a Monet, with the edges roughened into brushstrokes by the `#c97-monet-brush` SVG filter and the canvas drifting slowly behind them. The painting depends on the visitor's local hour when the page loaded, from Impression, Sunrise in the morning (5:00 to 10:59), to Water Lilies at midday (11:00 to 16:59, and for anyone without JavaScript), to Houses of Parliament, Sunset in the evening. It doesn't change if the hour turns while the page is open. On a phone, tapping the name goes home, so it only shows as a stuck hover when you're already on `/`. With reduced motion the drift stops and the painted letters stay.

## Painted collage plates

The three dashboard plates in the home collage each reveal a painted version under a hover circle, with the launch pad (to /spacex-mission-control) in Van Gogh, the transit plate (to /bay-area-transit) in Seurat, and the matchday plate (to /premier-league) in Hopper. The painters are set in `Catalog97Home.tsx` and the images came from `scripts/paint_plates.py`, which was removed on 2026-10-01 and is in git history (commit fa4849574). The plates are still links, since the painted layer never takes the pointer, and they don't cycle painters. Hover only.

## Konami code

Typing ↑ ↑ ↓ ↓ ← → ← → B A anywhere except /arcade throws the page out of register for six seconds, with the poster type jittering off its overprint, the offset shadows jumping, the halftone dots swelling, and the sheets shifting a few pixels and tilting. A saffron toast in the bottom left reads "Out of register" and "You found the code. The press needs a few seconds to line back up, and the arcade is open in the meantime.", with a button to the arcade and a close button. Esc closes it, and it closes itself after 12 seconds unless it's hovered or focused. Keys typed into form fields, modifier combos, and held-down repeats don't count, and /arcade is skipped because the arcade answers the code itself (see 30 lives below). With reduced motion it becomes a still misprint with no movement. The styles are in `Catalog97EasterEggs.module.css`.

## Console note

Once per full page load the console gets a styled note that opens with "Hi, thanks for opening the console." and goes on to how the site is built and tested, with a link to the repo. It doesn't repeat on client navigation.

## Footer rubber stamp

Clicking or tapping the wordmark in the footer presses it and stamps a smaller copy in the overprint ink where you clicked, halftoned and tilted at random, fading over 2.4 seconds, with at most five on the sheet at once (`MAX_IMPRINTS`). A pointer cursor on the wordmark is the only hint. With reduced motion the press is skipped and the stamp appears and disappears without animating.

## Stamp knock

Six stamps on the footer wordmark inside three seconds (`KNOCK_STAMPS` and `KNOCK_WINDOW_MS`) knock the page out of register the same way the Konami code does, for the same six seconds. The toast reads "Out of register" and "You stamped hard enough to knock the press out of line. It needs a few seconds to settle, and the arcade is open in the meantime.", with the same two buttons. It's the way into that effect for a phone, since the code needs a keyboard. Slower stamps only stamp, and after a knock it takes six fresh stamps to do it again. On /arcade the wordmark still stamps but never knocks the press, since the toast would only point back at the page the visitor is already on.

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

A few exact searches in the header search (`/` or Cmd or Ctrl+K) and on /search pin a written answer to the top of an unfiltered search. The match is on the whole query, lower-cased with punctuation turned into spaces, and the answers live in `HIDDEN_ANSWERS` in `src/app/api/search/route.ts`.

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

## Early kicker note

In /fantasy-football/draft-tracker, if your own team takes a kicker or a defense in round 1 or 2, a note you can dismiss says "A kicker in the first two rounds is a bold call. I'd have waited until the last round, but it's your league.", or the same idea for a defense, once per draft. The best ball tracker and the mock draft don't have it.

## Second kicker note

In the same tracker, if your own team takes a second kicker or a second defense in any round, the note says "A second kicker is a bold call. I'd want that roster spot back, but it's your league.", or the same for a defense, once per draft. When the early kicker note already ran in that draft it reads "a bold call too". `getSpecialistNote` in the same file checks the early note first and this one second, and the tracker calls only that.

## The "-30-" end mark

Every post under /writing ends with "-30-", the old newsroom sign that a story is over, set in poster type with an overprint shadow. Screen readers skip it.

## Halftone split

Hovering a halftone field splits it into blue, vermilion, and saffron dots slightly off register, like a print under a loupe. It shows today on the 404 misprint sheet and on /writing featured cards whose cover isn't a local image. Hover only.

## Close calls that aren't on the list

Text selection prints in the second ink (`catalog97.css`), which is ordinary styling. The 404 page is a themed misprint sheet with a one-time feed-in animation, but that's the page's normal design. `/design/catalog-pages`, `/analytics-reference`, `/admin`, and `/score-pools/settings` are unlinked and noindexed, but they're utility pages with nothing playful in them. There's nothing playful in robots.txt, llms.txt, or security.txt.
