---
version: 1
slug: "route-recipe-finder"
primary_target: "route:/recipe-finder"
related_targets: ["src/app/recipe-finder/recipe-finder-client.tsx","src/app/recipe-finder/recipe-finder.css","src/app/recipe-finder/indexCard.ts","src/lib/recipes.ts","src/data/recipesSnapshot.ts"]
---

# Recipe Finder surface brief

Written on 2026-10-12 by the stage 2 project sovereign pass (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Log and Calculator, group G7).

Scope. The `/recipe-finder` route, rendered by `src/app/recipe-finder/recipe-finder-client.tsx` with `recipe-finder.css`. The pantry lives in `localStorage` under `recipe-finder:pantry:v1`, cleaned on every read and write by the client's own `cleanPantryItems`. The recipes are the hand-built corpus in `src/data/recipesSnapshot.ts`, matched by `searchRecipes` in `src/lib/recipes.ts`, with the staples exemption in `indexCard.ts`. The stage 2 pass changed none of that. Three corrections came after it. `searchRecipes` now puts the text it searches through the same `normalizeIngredient` as the query, so a hyphenated title or tag ("Stir-Fry", "one-pan") finds itself. The empty-pantry order is pinned to the `en` collation, so the server and a browser in any language print the cards in one order. And the mug cake's "2 tbsp neutral oil" is a staple, as the same line already was in the chicken fried rice and the tofu stir-fry.

Visitor mode. Operate. The visitor lists what is in the kitchen and reads down the cards for what to cook.

Genre. A pantry-first recipe app, with SuperCook as the reference and a kitchen recipe box of index cards as the object.

## Decisions

The route paints its own kitchen paper. `.rf-root` declares `--rf-paper`, `--rf-card`, `--rf-field`, `--rf-ink`, `--rf-ink-2`, `--rf-red`, `--rf-blue`, and `--rf-rule`, with a light story (paper `#f6f3ec`, card stock `#fffdf8`, index-card red `#a8321f`, ruled blue) and a dark one under `.dark .rf-root` (`#161312`, card `#221d1a`, `#f2917e`). It redeclares the `--c97-*` tokens the borrowed kicker, skeleton, and ghost button read, and `--c97-accent` is the red, so the focus ring matches. Newsreader for the h1, the section heads, and the recipe titles, Fragment Mono for the pantry labels, the times, and the counts, Archivo for the rest. No added typeface.

The first screen is a title row (the h1 and a lede that carries the staples exemption, worded as "Staples like salt, pepper, cooking oil, and water" because ice is one too and sesame oil is not) and the book under it. From 1024px the pantry shelf is a sticky left column (the Pantry heading, the input with its suggestions and Add ingredient, the pantry labels with Remove and Clear, the quick adds, and one line saying the corpus is hand-built and the pantry is saved in this browser only), and the results are the right column. Under 1024px the shelf comes first.

The shelf sticks only on a window at least 820px tall. There it is capped at the window's height (`max-height: calc(100dvh - 2 * var(--c97-sp-3))`) and scrolls inside itself once the pantry outgrows it, so Clear and the quick adds stay in reach, with inline padding cancelled by a negative margin as room for the focus rings. It sets no `overscroll-behavior`, the same as the stuck column in `world-cup.css`, so the wheel passes on to the page at the shelf's ends. I left it off because a December 2025 CSS working group message says Chrome is moving to apply that property to a scroll container with nothing to scroll, where a shelf that fits would hold the wheel and stop the page under the pointer. I did not confirm that against Chrome's release notes or in a browser. A pantry label wraps (`overflow-wrap: anywhere`), so a pasted link or any other unbroken run of up to 60 characters stays inside the shelf.

Enter and a comma commit the typed ingredient. Tab does not, so it moves on to the suggestions under the field, which a keyboard could not reach while Tab saved the half-typed word.

The results open on "Find something to cook" with the search box, then the filters as chips (the four views, then the eight meal times) and the diet select, then one live count, "N of 26 recipes", which adds ", ranked by how much of each recipe your pantry covers" once the pantry has something in it. That wording follows the sort, which is the share of a recipe's ingredients the pantry covers and not the count still missing. The same line ends with a screen-reader-only ", N in your pantry", so an add or a remove that leaves the visible count as it was still gives the live region something to announce. The number on the "Suggested by pantry" chip is the number of recipes that view lists across the whole corpus, meaning every recipe the pantry matches at least one ingredient of.

Each recipe is an index card, and the card is the one box, since it carries the recipe's own data. It has card stock with a hairline edge, the title with cuisine and meal type, the time and servings in the corner, a red head rule, "Missing N of M ingredients" or "You have every ingredient", and the Ingredients and steps toggle, which opens the ingredient lines on blue rules with tick boxes and the numbered steps. The cards fill a grid of columns at least 19rem wide.

Print hides the pantry form, the quick adds, Clear, the search, the filters, and the card toggles, and keeps the pantry labels and the cards.

## Cut, and not to be restored

The hero sheet and poster h1, the shelf plate with its offset shadow, the three readouts (pantry items, recipes you can make now, and closest match, which restated the first card), the torn and deckled seams, the "About this corpus" band (folded into the one line under the pantry), the meta row ("N recipes · N ingredients in pantry · ranking by pantry match", which became the one count line), the segmented controls' boxed look (now chips), and each card's paper plate and offset shadow.

## Pinned, and kept

`src/app/recipe-finder/__tests__/recipe-finder-client.test.tsx` covers the damaged-store cleanup and another tab's pantry, the h1, All recipes pressed, "Matching recipes", "Add an ingredient", "Add ingredient", "Remove X", the quick adds named "+ item", "Pantry ingredients", Clear and the input keeping focus, the suggestion buttons, "Search recipes", Quick wins, Dinner, "Filter by diet" disabled with "Vegetarian view is active", the first card's toggle, unique ids and titles, the summary count against the opened card's lines with exactly two lists inside an open card, and the empty pantry view with "Show all recipes". One assertion changed in this pass, in the same commit, from the cut meta row's "ingredients in pantry" to the count line's "N of N recipes" status. The suite also covers the pantry chip's number against the cards its view lists, the "ranked by how much of each recipe your pantry covers" suffix, the hidden "N in your pantry" count after an add and a remove, and Tab leaving a half-typed ingredient unsaved and moving to the suggestions. `recipe-finder-css.test.ts` pins the shelf's cap and the label's wrap. `src/lib/__tests__/recipes.test.ts` covers every recipe finding itself by its title, a hyphenated tag, the order holding under another language's collation, and no ingredient being a staple in one recipe and counted in another. `e2e/all-projects.spec.ts` ("recipe finder saves and removes pantry ingredients") holds unchanged.

## Verified state, 2026-10-12

First field and first card, page coordinates including the header. The pantry input sits at y420 at 1440x900 and y485 at 390x844, against y642 and y649 before, and the first card at y702 at 1440 and y1281 at 390 (y1381 with six pantry items), against y1828 and y2046 (y1980 and y2113) before.

Checked against a production build (`next build --webpack`, served with `next start` on 3810) in Chromium. `scripts/contrastSweep.mjs` reported no failures in either theme, and its `measurePage` run on the seeded states (a saved collection, an opened detail, a filtered view, with every disclosure opened) found none in either theme either. `scripts/layoutSweep.mjs` reported 0 fails across the five G7 routes (the sticky-offset review is the shelf's `top`, which only applies on a window at least 820px tall). The route's e2e specs passed against both the dev server and the production build. A scripted keyboard walk from the page top reached the pantry input first; typing egg and Enter added it with focus kept in the input, and Space on a card's toggle opened its ingredients and steps. Under `prefers-reduced-motion` the shared button transition collapsed to 1e-05s. A Chromium print with `page.pdf()` hid the pantry form, quick adds, search, filters, and toggles, and kept the pantry labels and the cards. I did not check Safari's and Firefox's engines, touch devices, or a screen reader.

The shelf's cap, the label's wrap, the count line's wording and hidden pantry count, the chip's number, and Tab in the pantry field came after this check. I pinned them in the Jest suites and reasoned the two CSS changes from the cascade, and I did not run them in a browser. With the mug cake's oil a staple, that card reads "Missing 7 of 9 ingredients" on an empty pantry where it read 8 of 9.
