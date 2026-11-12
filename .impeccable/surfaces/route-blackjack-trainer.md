---
version: 1
slug: "route-blackjack-trainer"
primary_target: "route:/blackjack-trainer"
related_targets: ["src/app/blackjack-trainer/blackjack-trainer-client.tsx","src/app/blackjack-trainer/TableView.tsx","src/app/blackjack-trainer/StrategyChartView.tsx","src/app/blackjack-trainer/CountingView.tsx","src/app/blackjack-trainer/ProgressView.tsx","src/app/blackjack-trainer/blackjack-trainer.css","src/hooks/useBlackjackProgress.ts","src/lib/blackjack/strategy.ts","src/lib/blackjack/round.ts","src/lib/blackjack/progress.ts"]
---

# Blackjack Trainer surface brief

Written on 2026-11-10, when the trainer was ported from the private `blackjack-mastery` repo (a Vite and React app) into the site as a route of its own.

Scope. The `/blackjack-trainer` route, rendered by `src/app/blackjack-trainer/blackjack-trainer-client.tsx` with its own stylesheet `blackjack-trainer.css`. The record lives in `localStorage` under `blackjack_trainer_progress_v1`, read and written through `useBlackjackProgress` and `src/lib/blackjack/progress.ts`. The game itself is the pure engine in `src/lib/blackjack/`.

Visitor mode. Operate. The visitor deals a hand, makes a decision, reads the verdict, and deals again, and comes back to the chart or the record between hands.

Genre. A strategy trainer at a card table, with the practice modes of blackjack trainer apps and a printed basic strategy card as the references. The page borrows the felt, the cards, and the colour-keyed chart, and none of a casino's branding.

## Decisions

The route keeps its felt in both themes. `.bj-root` declares `--bj-felt`, `--bj-felt-deep`, `--bj-ink`, `--bj-ink-2`, `--bj-rule`, `--bj-gold`, the card colours, and the chart colours, with a mid green by day and a deeper green under `.dark .bj-root`. It redeclares `--c97-surface`, `--c97-field`, `--c97-ink`, `--c97-ink-2`, `--c97-label`, `--c97-rule`, `--c97-accent`, and `--c97-action` from those, so the borrowed `c97-btn`, `c97-btn-ghost`, `c97-field`, and `c97-segmented` print in the table's palette and the focus ring paints gold.

Type is Newsreader for the title, the chart captions, the cards, and the missed plays, Archivo for everything else, and Fragment Mono for totals, counts, and chart cells. No added typeface.

The first screen is a title row (h1, one sentence, and the table rules select), the four views as tabs, and the table. The table waits for a deal on load, because a hand dealt during the server render would not match the one dealt in the browser.

The table view stays mounted while another view is open, so a hand in play survives a look at the chart, and its shortcut keys are quiet until the table is back.

The chart and the grader read one function. `basicStrategyAction` in `src/lib/blackjack/strategy.ts` is the only reader of the chart, `buildStrategyChart` prints from the same rows, and the chart key lists only the plays the chosen table uses.

Every rule set is a shoe game of four to eight decks where the dealer peeks, since that is the chart the engine holds. The footer says so once, beside the storage note.

Results are in betting units, with a double at two, a surrender at minus a half, and a blackjack at 1.5 or 1.2, so the 6 to 5 table shows up in the running total.

The counting drill carries on from the true count after each check, so one slip does not fail every later check in the deck.

Left out of the port, and not to be restored without a source or a reason. The named casino presets (their table rules were claims with no source), the house edge estimate, the achievements and their emoji, the session history charts, the streak, export and import, and the separate rules and tips reading pages.

## Pinned

`src/app/blackjack-trainer/__tests__/blackjack-trainer-client.test.tsx` holds the h1 "Blackjack Trainer", the tabs "Table", "Strategy chart", "Counting drill", and "Progress", the buttons "Deal a hand", "Deal next hand", "Hit", "Stand", "Double", "Split", "Surrender", "Show the play", "Check count", "Next card", "Start counting", "Reset progress", and "Clear the record", the label "Table rules", the verdict and result sentences, and the storage key.

The shortcut keys are H, S, D, P, R for the five actions, N to deal, and ? for the play.

## Verified state, 2026-11-10

Against a production build (`next build --webpack`, served locally) in Chrome, at 1440x900, 390x844, and 320x740 in both themes. The page has one `h1` and one `main`, no console errors, and no horizontal overflow in the empty, dealt, settled, chart, counting, and progress states. `measurePage` from `scripts/contrastSweep.mjs` found no contrast failures in any of those states in either theme. The Deal button sits at y746 at 1440x900, y936 at 390x844, and y1014 at 320x740, page coordinates with the header included. A reload kept the record. A run of 1,500 random shortcut keys with tab switches every 50 produced no errors.

I did not run `scripts/layoutSweep.mjs` or the Playwright suite, and I did not check Safari's or Firefox's engines, touch devices, or a screen reader.
