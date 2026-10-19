# About, Résumé, and Contact lose the sheet stack

**Date:** 2026-10-18
**Status:** Superseded on 2026-10-19 by `2026-10-19-about-resume-contact-objects-design.md`. Isaac read this build as PR #613 and did not accept it. The branch stays and carries the replacement.

## What this is

The 2026-10-11 project-sovereign spec gave every project route its own design inside the site frame and left the seven designed Catalog 97 pages out of scope. On 2026-10-18 Isaac asked for the same treatment on `/about`, `/resume`, and `/contact`.

I looked at the three on the live site at 1440x900 and 390x844 in both themes. All three run the construction the project pages had before their rework, meaning a poster headline on paper and then a stack of full-bleed ink sheets with torn seams, where most sheets carry one sentence in poster type. About was six bands and 5984px on desktop, the résumé five bands and 4850px, and Contact four bands and 2475px to deliver an email address that sat below the fold. About told the chronology three times (the bio, "The route here", and the résumé), the résumé repeated its download button in a band of its own, and Contact's hero, vermilion line, and peach band were three slogans. The content on each page is fine. The construction is what makes them long and generic.

## The decision

These three keep the print shop language and lose the sheet stack. The projects left Catalog 97 because each has a genre of its own, and the riso frame made them read as themed demos. These pages have no genre other than Isaac, and with Home, Portfolio, Writing, and Dashboards they are the only places the site's own voice shows, so leaving the system here would shrink that voice to the header and the homepage. Paper, the serif, Anton for the one headline that earns it, and the inks stay. What changes is that the project contract's rules now bind these pages too, meaning the first screen holds the real content, nothing appears twice, and a band exists because its content changes and never because the page needed another colour.

## The pages

**About is one profile piece.** The hero is the Home hero's grid, the headline, the opening paragraph, and the two exits on the left with the portrait on the right, so all of it shares the first screen at 1440. The bio continues on the same paper. "How I work" is the one ink sheet, blue, with its three passages in `c97-columns`. The FAQ closes the page on bone with the deckle seam. "The route here" is cut, since the bio and the résumé both already tell it, and the saffron pull quote and the second button pair go with it. The FAQ questions keep the third person a recruiter would use and the answers move to first person, so the page reads as one voice and the FAQ structured data still matches what is on the page. The portrait keeps `Catalog97Slot`, the paint reveal, and the `data-c97-monet` section, which the print spec and the easter egg both read.

**The résumé is one set document.** The hero is the word "Résumé" in poster type with one line under it naming the role, and the Download PDF button beside them, once. Experience starts within the first screen and keeps its subgrid date column and company marks. Education, capabilities, and outside work follow on the same paper under hairline rules, and capabilities print as a two-column ledger (category, then tools) instead of a grid that stranded three of seven groups. The chocolate download band, the blue capabilities sheet, the saffron three-column band, and "References available on request" are gone. The page ends on the sentence that was already there, that I am happy to walk through any project on this site line by line, with the Get in touch link the print test reads. The page is paper only, which is my call, since a document on one sheet is the genre and the saffron header and espresso footer carry the site's colour. The print stylesheet is untouched.

**Contact is one screen.** The headline the footer test pins stays. Under it the address is the largest thing on the page, as a link, with the paragraph about what to write and the response time. One blue sheet holds LinkedIn and GitHub as a ledger and the résumé and work links as a single line. The vermilion slogan band, the peach band, and the Email me button that stood in for the address are gone.

## What changes beside the components

`e2e/print.spec.ts` runs the stacked-gaps check over `.c97-columns` on `/about` and `/resume`. The résumé has no `c97-columns` after this, so the loop drops `/resume` and the reason is in the commit. `/about` keeps its three-column `c97-columns` and its one deckle seam, so its print checks hold. `src/constants/aboutFaq.ts` carries the rewritten answers. `PAGES.md`, `COMPONENTS.md`, their `docs/ai-context` twins, and `STYLING.md` describe the pages as they are after the change. The sitemap dates for the three routes move to 2026-10-18.

## Gates

A production build in the worktree, `scripts/layoutSweep.mjs` with no failures on the three routes, `scripts/contrastSweep.mjs` with no failures on the three routes in both themes, the print spec, the résumé spec, the footer CTA spec, and the portfolio shell spec in Chromium, and before and after screenshots for Isaac at 1440 and 390 in both themes.
