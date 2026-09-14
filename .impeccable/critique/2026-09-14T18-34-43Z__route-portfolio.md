---
target: /portfolio
total_score: 20
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 1
target_identity: "file:/Users/isaacvazquez/Website/route:/portfolio"
timestamp: 2026-09-14T18-34-43Z
slug: route-portfolio
closed: true
---
Method: dual-agent (A: design review subagent · B: detector and browser evidence subagent), synthesized in the parent, with one adversarial refuter on every P0 and P1. Run 2026-09-14 against the dev server on branch design/catalog97-loop at 71a015bf, before remediation.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | The ledger header reads "33 projects" above 29 rows, the hero plate stays "33" under the Civic filter where one project shows, and no result count is in a live region. |
| 2 | Match system / real world | 2 | The h1 promises "the decisions behind it" and the CTA says "Each project write-up leads with the problem, and puts the stack last," but every title opens a live tool. "Featured first" names a flag the sort does not read. |
| 3 | User control and freedom | 2 | Every click leaves Catalog 97 for a Working Instrument tool page with no "back to Work" link. "All" clears the category but leaves search text and sort in place, and there is no single reset. |
| 4 | Consistency and standards | 2 | Role labels drift ("Full-Stack Developer & Designer", "Builder", "Product Designer & Developer", "Solo Builder"), and the route is "Work" in the nav but "Projects" in the metadata title, breadcrumbs and the header a visitor lands on after clicking through. |
| 5 | Error prevention | 3 | Every slug is bucketed, so a category filter cannot produce an empty page, and the stakes are low. |
| 6 | Recognition rather than recall | 2 | 29 of 33 entries are a title and a year with no summary, so "Decision Lab", "Job Search" and "Automation Enablement Assistant" have to be opened to be understood. |
| 7 | Flexibility and efficiency | 2 | Scored because the route ships search and sort. Search is broad and works, but "Live first" returns the curated order unchanged because every record has a link. |
| 8 | Aesthetic and minimalist design | 3 | The band sequence and type are disciplined, but a search box, a four-option select and nine filter buttons sit ahead of any work, and at 390 the first title is at 886px against an 844px viewport. |
| 9 | Error recovery | 2 | A search with no match leaves an empty 136px camel stripe above "No projects match that search." with no clear control. |
| 10 | Help and documentation | n/a | A portfolio index in Experience mode has no task that needs documentation. |
| Total | | 20/36 | Acceptable (56%). n/a: 10 |

## Design Specificity Verdict

LLM assessment. The shell is clearly designed for this site. The camel, pine, chocolate and espresso bands, the serif display h1, the Anton plate and the ledger all come from one world that a generic portfolio template would not produce. The content structure is a different story. A search box, a sort select, a row of category chips and a list of 33 titles is the default shape of any tool directory, and the index measures Isaac by volume, with a tool count as the hero number and a list that runs through Wine Cellar, Recipe Finder, Museum Log and eleven Sports entries. `caseStudies.ts` contains zero Civitech entries. PRODUCT.md says positioning "leans on the thinking and the track record, not on the tool count," and this page does the reverse. The verdict is an authored visual language on a generic directory structure.

Deterministic scan. `impeccable detect` exited 2 with 2 findings, both in `src/app/portfolio/[slug]/page.tsx`, a side-tab accent border warning at line 504 and a design-system-font-size advisory at line 184. Neither renders, because the slug route redirects every record to its link. Run on the Catalog 97 components alone, the detector returned `[]` with exit 0. No DEGRADED banner printed. The detector says nothing about this route's own component.

Visual overlays. No user-visible overlay is available. Injection was blocked by the site's enforcing CSP, which fired a securitypolicyviolation on script-src-elem. The computed-value sweep is the fallback signal. It reached 64 of 64 default states (eight surfaces at 390, 768, 1024 and 1440 in light and dark), reproduced the contrast gate at 13.25:1 light and 15.95:1 dark, and found zero AA text contrast failures, zero horizontal overflow, and one main and one h1 on every Catalog 97 route. On this route it measured the search and sort field borders at 1.42:1 against their surround in light and 1.51:1 in dark, zero live regions, and 65 focusables with a visible ring on each.

## Overall Impression

Arrival is confident and the four camel lead entries read like someone explaining their work. The page falls apart at the click. Every title opens a live tool, often an empty one, while the h1 and the closing CTA promise the reasoning, and the counts a precise visitor checks first do not match what is on screen. The single biggest opportunity is to make the title link go to the decision and the tool a secondary link, which makes the h1 and CTA true without redesigning a single band.

## What's Working

The type and band hierarchy is disciplined and was verified live. There is one h1, the h2s draw at one size, the 29 ledger titles are real h3s, and no two pine bands touch. At 1440 the camel lead entries give a scannable title, one first-person sentence and a quiet meta line, which is the right amount for a lead tier.

Keyboard access is solid. The tab walk runs skip link, wordmark, seven nav links, Search, theme, search input, sort select, nine filter buttons, then the lead titles in order, with a 2px solid outline at every stop. Filters are real buttons with `aria-pressed`, and search and sort are wrapped in labels.

The filter never empties the page. Categories come from the real `classifyToolSlug` buckets with visible counts, and a filter that holds only lead entries says "Everything under this filter is already above." rather than rendering a blank ledger.

## Priority Issues

[P1] Every entry opens a live tool, and the CTA promises write-ups that do not exist.
The refuter upheld it. All 33 records in `caseStudies.ts` carry `link`, and `src/app/portfolio/[slug]/page.tsx:101-103` redirects to it, so clicking "Investment Analytics Platform" lands on `/investments`, a dark dashboard showing "$0.00" and "No positions yet". The reasoning lives in a blog post behind a "Read the build notes" link near the bottom of the tool page. The CTA "Each project write-up leads with the problem, and puts the stack last." (`Catalog97Portfolio.tsx:394-395`) describes a write-up the click never reaches, and the route's brief says the job is to "find one project worth opening, and read the decision behind it."
Fix: link the title to the reasoning and show the tool as a secondary link. In `Catalog97Portfolio.tsx:254-257` and `:348-351`, point the title at the article in `src/components/projectBuildNoteLinks.ts` and add an "Open the tool" microlink to the meta line. Only promise a write-up for projects that have one. The alternative is a real Catalog 97 detail page, covered in the /portfolio/[slug] snapshot.
Suggested command: /impeccable shape

[P2] Counts on the page contradict what is on screen.
The pine header reads "33 projects" (`Catalog97Portfolio.tsx:308-310`, `filtered.length`) directly above 29 rows, because it counts the four camel entries too. Under the Civic filter the hero plate still reads "33" (`:138`, `projects.length`) while one project shows. No element carries `aria-live` or `role="status"`, so a result-count change is never announced. The refuter kept the finding and set it at P2.
Fix: label the ledger header with `ledger.length` ("29 more") or move the total to the filter row as "1 of 33". Keep the plate as the unfiltered total and never let a filtered count sit beside it. Put `aria-live="polite"` on whichever element carries the result count.
Suggested command: /impeccable clarify

[P2] The Investment Analytics Platform record overstates its data source.
`caseStudies.ts:61-66` says "Full-stack investment platform with live Yahoo Finance data" and lists "Yahoo Finance API" in `tools`. The destination says "Curated snapshot · <date>" (`InvestmentsDashboard.tsx:308`) and "Market quotes via Finnhub" (`:355`). The refuter corrected the mechanism. The committed snapshots are built by defeatbeta-api over a Yahoo Finance dataset and quotes come from Finnhub, with no Yahoo Finance API call anywhere, so "Yahoo Finance data" is defensible as the origin of the snapshots while "live" and "Yahoo Finance API" are not. The `description` is searchable on the index and becomes the slug route's meta description.
Fix: describe the source as it ships, for example "committed snapshots built from a Yahoo Finance dataset, with quotes from Finnhub," drop "Yahoo Finance API" from `tools`, and sweep `content/blog/building-an-investment-research-platform.mdx` for the same claim.
Suggested command: /impeccable clarify

[P2] The index leads with tool volume and personal utilities.
The hero plate counts tools, Lifestyle holds six personal apps, Sports holds eleven, and nothing from the Civitech record appears. A VC or Haas peer reads breadth, not judgment. None of the settled brief decisions covers which projects appear or what the plate counts.
Fix: keep the four camel lead entries as the curated proof and consider moving Lifestyle and the event dashboards to `/dashboards`, which already exists for the tool fleet. Retarget the plate or drop it. The order lives in `PORTFOLIO_PROJECT_ORDER` (`caseStudies.ts:1153-1187`).
Suggested command: /impeccable distill

[P2] Controls come before the work, and two of the four sort options do nothing.
At 390 the first screen is header, h1, search, sort and four rows of chips, with no project. "Featured first" returns 0 from its comparator (`:108`) and 31 of 33 records are featured anyway, and "Live first" returns the curated order because every record has a link.
Fix: remove the sort select (`Catalog97Portfolio.tsx:176-197`), and move the search below the category row or cut it at this list size, which puts the first camel entry on the phone's first screen.
Suggested command: /impeccable distill

## Persona Red Flags

Jordan (first-timer) sees "Work" in the nav, "Isaac Vazquez Projects" in the tab, and "Projects" in the header after the click, and cannot tell whether those are one place. Clicking "Investment Analytics Platform" opens a page titled "Investments" showing "$0.00" and "No positions yet", which reads as a broken or empty account. "Ask about one" goes to /contact with no preset subject.

Casey (390) sees no project on the first screen, since the nine chips wrap to four rows and push the first title to 886px. Search and sort state is not in the URL, so a filter is lost on the way back. Tap targets on the chips are fine at 50px.

Sam (screen reader, keyboard) gets silent result-count changes and a silent "No projects match that search." Title links have no hover or underline cue, though keyboard focus is outlined. Following a link named "Investment Analytics Platform" lands on an h1 that reads "Investments".

Morgan, a Haas classmate now at a seed fund, opens the portfolio to see how Isaac thinks and meets a count of 33 tools including a wine cellar and a run of sports "Pulse" pages, with no trace of the civic tech work. The top entry opens an empty dashboard, and a cross-check finds "live Yahoo Finance data" on the record against "Market quotes via Finnhub" on the tool.

## Minor Observations

[P3] The search and sort field borders measure 1.42:1 against their surround in light and 1.51:1 in dark, under the 3:1 non-text contrast guideline for a field boundary, so the controls read as floating text at a glance.

[P3] The search placeholder measures 3.02:1 in light only.

The no-match state renders the empty lead band as a blank 136px camel stripe (the section at `:245` renders even when `lead` is empty). Skip that band when `lead.length === 0` and add a "Clear search" button to the empty message. Clicking "All" resets the category but not the search or sort, so "All 33" can show 0 rows. At 1440 the ledger reads row-major, which the brief settled.

Shared Catalog 97 shell findings recorded in full in the / snapshot from this run also apply here, from the Working Instrument focus radius and halo in every focus ring (P2), to the theme toggle shifting the header on mount (P2, CLS 0.016 to 0.065), to search Escape dropping focus, the wordmark hit box overlapping the first nav row at 320 to 768, and smooth scroll under reduced motion (P3 each).

## Questions to Consider

If the title linked to the reasoning and the tool were the proof link, would the h1 finally be true?

What would a six-entry Work index, with the other 27 on /dashboards, say about Isaac's judgment compared with "33"?

What should the plate count so that a peer's first checkable number is one Isaac would want them to check?
