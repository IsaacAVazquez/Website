Method: dual-agent (A: /root/audit_core_tools + /root/audit_data_sports · B: /root/audit_technical)

# Site UI/UX audit, October 5, 2026

I think the site needs a substantial workflow pass. I would rework 18 of the 58 static pages, refine 33, and retain seven largely as they are. The Catalog 97 identity holds together, and many interactions work, but several tools make people scroll through repeated summaries, empty output, and explanation before they can start. Some selections update a result far outside the visible area.

Here, rework means changing the primary task sequence and layout while keeping the existing identity, content, calculations, and disclosures. Refine means correcting a narrower part of a working page. Retain means the exercised primary path is a useful reference for the rest of the site. These are design judgments, with confirmed behavior identified separately below.

This is an audit of the local production build with the previously saved fixes. Application code, tests, and data were left unchanged during this audit.

## Coverage and limits

I reviewed every static live page visually on desktop and phone, and exercised a primary task or reading/navigation path on each. The data and sports workflow review used a 390×844 phone viewport; its desktop checks were visual. The core and personal-tool review covered both desktop and phone workflows. External email, application, newsletter, and notification sends were excluded.

The layout sweep covered 63 representative URLs at 12 Chromium sizes from 320×740 to 2560×1440, plus phone and desktop WebKit, for 882 page loads. It found no fail-level document layout failures. Wide tables have their own scroll regions, so fitting the document does not establish that a comparison is easy to use on a phone.

All 248 article URLs and seven topic URLs returned 200 and were checked at phone and desktop sizes, adding 510 rendering checks. Those pages had one main landmark, one h1, and no document horizontal overflow in those checks. Five articles received visual sample review; all 248 articles were rendered and structurally measured, but their prose was not individually read or edited. Including the 404 recovery page, the review covered 314 distinct URLs.

The light/dark contrast batch covered 126 route/theme combinations. It found no confirmed text-contrast failures after resolving three false positives on the light-theme 404 page. The actual painted 404 ink/background contrast is 7.746:1. This is sampled rendered-text evidence and does not certify every interactive state, image overlay, or focus treatment.

True 200% browser zoom, screen-reader engine behavior, throttled-network performance, full bundle profiling, forced external-service failures, and the accuracy of every live dataset remain outside this review. Local source dates describe the build reviewed on October 5, 2026; they do not establish what a production refresh served that day.

## Design assessment

I would preserve Catalog 97. The typography, paper surfaces, color system, and domain-specific graphics give the work an authored identity. The repeated arrangement of a large signature graphic, full summary, and second working list creates the main weakness. A task page should bring the decision or input forward, with the domain graphic helping explain that task.

The two independent design reviews scored the core/personal-tool domain 27/40 and the data/sports domain 25/40. Their equal-weight average is 26/40, in the significant-improvement band. These scores are evaluator judgments, not measurements of user success.

| Criterion | Core and personal tools | Data and sports tools | Main observation |
| --- | --- | --- | --- |
| Status and feedback | 3 | 3 | Saves and dated state usually work; distant detail weakens selection feedback. |
| Familiar language and order | 3 | 2 | Pool terminology assumes expertise; several forms start after their output. |
| Control and recovery | 3 | 3 | Clear, cancel, Escape, and draft undo are useful. |
| Consistency | 3 | 3 | Shared identity holds; neighboring tools use different detail behavior. |
| Error prevention | 2 | 3 | Museum quick logging assigns a personal rating without asking. |
| Visible choices and context | 3 | 2 | Wide comparisons separate the item name from its useful metric. |
| Efficiency | 2 | 2 | Search, inputs, and setup often follow several phone screens of content. |
| Focus and visual hierarchy | 2 | 1 | Repeated summaries and full lists compete with the working area. |
| Error recovery | 3 | 3 | Exercised validation preserves useful state and explains recovery. |
| Help and explanation | 3 | 3 | Sources and model limits are useful; their length and placement need refinement. |
| Total | 27/40 | 25/40 | The shared opportunity is task order and proximity. |

## Technical assessment

The implementation expresses a coherent product-specific system. The technical review scored 16/20. Clean semantics and theme behavior support retaining the system, but the score is not a WCAG conformance certificate or a performance benchmark.

| Dimension | Score | Evidence and limit |
| --- | --- | --- |
| Accessibility | 3/4 | Named controls and landmarks were sound in the inspected states; SVG opener focus return and motion preference need correction. |
| Performance | 3/4 | Bounded source and local runtime inspection found no captured console errors; lab performance and bundle analysis were excluded. |
| Responsive behavior | 3/4 | The layout sweep had no fail-level results; stock search is 37px tall and true browser zoom was unverified. |
| Theming | 4/4 | Tested light/dark text and representative form controls behaved consistently. |
| Implementation integrity | 3/4 | One shell and one page h1 held across checks; isolated interaction defects remain. |
| Total | 16/20 | Good technical foundation with specific corrections. |

The deterministic scan covered 309 markup files in src/app and src/components/catalog97. Its 122 findings were classified into 39 outside the web UI, 53 intentional exceptions, 20 nonblocking source advisories, six false positives, and four contextual visual warnings. Those 122 flags are not 122 confirmed bugs. The literal type-size advisories did not establish 20 additional user-facing defects, and sports/data/arcade color use needs its existing context preserved.

## Findings in priority order

I consolidated repeated observations into 12 issue families, with zero P0, five P1, six P2, and one P3. Counts below describe these families, not the number of affected routes. P1 means substantial difficulty or misleading behavior, P2 means a narrower issue with a workaround, and P3 means optional refinement.

### F1, P1. Selection results appear far from the selected item

This is confirmed in Golf, MLB, NBA, NFL, the development-tools directory, and Bay Area Transit. On Golf, selecting Doug Ghim updates detail at document y40640, 38,696px below the tested viewport top, or about 46 phone screens. The page renders 120 complete player cards before that detail. The tested Celtics detail is 1,933px below its viewport top, and Raiders detail is 3,807px below. Transit updates a departures board 1,365px above the tested station-list viewport. People can complete the selection and still have no visible evidence of its result.

I would put detail in an inline expansion or a named drawer beside the current task, following the working location behavior on Premier League, La Liga, and SpaceX. Preserve the selection URL, close control, and focus return. Golf also needs bounded compact leaderboard rows. Suggested work is `$impeccable layout`, `$impeccable adapt`, and `$impeccable harden`.

Sources are [Golf](/Users/isaacvazquez/Website/src/app/golf/golf-client.tsx:552), [NBA](/Users/isaacvazquez/Website/src/app/nba/nba-client.tsx:383), [NFL](/Users/isaacvazquez/Website/src/app/nfl/nfl-client.tsx:438), [development tools](/Users/isaacvazquez/Website/src/app/ai-dev-tools/ai-dev-tools-client.tsx:374), and [Transit](/Users/isaacvazquez/Website/src/app/bay-area-transit/bay-area-transit-client.tsx:411).

### F2, P1. The input or working task follows several screens of output

This is a design judgment supported by measured positions and successful input changes. On phones, Budget Planner income starts at y1929, Interchange IQ volume at y2200, Rent vs Buy home price at y2098 and rent at y3077, and job search at y3725. Investments stacks holdings, research, and retirement on one page. The inputs work, but the order asks people to interpret defaults before choosing their own situation.

I would give Investments explicit task choices and put the chosen workspace first. Start Budget Planner with month, income, and savings, pair Interchange inputs with one fee comparison, and put the five main Rent vs Buy assumptions beside its result. Put job search before feed-health detail and the empty application funnel. Keep short source/model notices beside the result and the full explanation one direct action away. Fantasy Formula 1 needs the current team and one suggested lineup as its main phone workspace. Suggested work is `$impeccable shape`, then `$impeccable layout` and `$impeccable distill`.

Sources are [Investments](/Users/isaacvazquez/Website/src/components/investments/InvestmentsDashboard.tsx:198), [Budget Planner](/Users/isaacvazquez/Website/src/app/fintech-tools/budget-planner/budget-planner-client.tsx:230), [Interchange IQ](/Users/isaacvazquez/Website/src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx:200), [Rent vs Buy](/Users/isaacvazquez/Website/src/app/fintech-tools/rent-vs-buy/rent-vs-buy-client.tsx:295), and [job search](/Users/isaacvazquez/Website/src/app/mba-internship-notifications/mba-jobs-client.tsx:2137).

### F3, P1. Full catalogs and repeated overviews delay the decision

Recipe Finder renders 26 full recipe cards with ingredient lists in an 18,691px phone document. GitHub Trending, Tech Startups, and News Pulse put an overview before a second working directory or comparison. This is a design judgment about scan cost, with the content length and control positions measured. The remedy is a shorter default scan and details at the point of selection.

I would show recipe name, time, missing-ingredient count, and one next action in the result list, then ingredients and steps for a selected recipe. Give research/news tools one primary working list with compact opening context. Keep full desktop comparison tables where they help. Suggested work is `$impeccable distill` and `$impeccable adapt`.

Sources are [Recipe Finder](/Users/isaacvazquez/Website/src/app/recipe-finder/recipe-finder-client.tsx:570), [GitHub Trending](/Users/isaacvazquez/Website/src/app/github-trending-pulse/github-trending-client.tsx:339), [Tech Startups](/Users/isaacvazquez/Website/src/app/tech-startup-tracker/tech-startup-client.tsx:326), and [News Pulse](/Users/isaacvazquez/Website/src/app/news-pulse/news-pulse-client.tsx:664).

### F4, P1. The professional work needs more context in the default scan

The portfolio has four lead projects with context and 30 secondary rows with title/year and a tool link. Those rows do not meet the repo's default-scan rule for role, problem space, and impact. On the phone homepage, Dashboards starts at y1239, Selected work at y2825, and the Juno/Civitech writing at y4300. The homepage work CTA is already visible and works; I would change the evidence order below it.

I would give each secondary project a short problem/decision statement, role, and verified impact where available, with a visible build-note path where one exists. Move selected work and professional writing ahead of the dashboard run on Home. Keep live tool links and the canonical redirect behavior. Suggested work is `$impeccable clarify` and `$impeccable layout`.

Sources are [Portfolio](/Users/isaacvazquez/Website/src/components/catalog97/Catalog97Portfolio.tsx:425) and [Home](/Users/isaacvazquez/Website/src/components/catalog97/Catalog97Home.tsx:178).

### F5, P1. Two personal-data promises need correction

Museum Log quick logging copies the curator rating into a new personal visit. In the exercised flow, logging Rijksmuseum immediately recorded a personal visit with 5.0 stars without asking for a rating. I would record an unrated visit or open the existing rating form. The fixed curator visit total also needs a clear label separate from the reader's own visits.

Travel Deal Lab displays a saved-state message in a form that includes the quoted fare, but that fare is intentionally ephemeral in the code. Entering $600 for two travelers produced $300 per seat; after reload the fare returned to zero while the date and saved tactic remained. I would persist the fare with the trip or state the saved scope at that field. This is a misleading save contract, and the rest of the saved trip is not lost. Suggested work is `$impeccable harden` and `$impeccable clarify`.

Sources are [Museum quick visit](/Users/isaacvazquez/Website/src/app/museum-log/museum-log-client.tsx:1323), [Museum detail quick visit](/Users/isaacvazquez/Website/src/app/museum-log/museum-log-client.tsx:971), and [Travel Deal Lab](/Users/isaacvazquez/Website/src/app/travel-deals/travel-deal-lab-client.tsx:193).

### F6, P2. Phone tables separate names from useful comparison values

The phone content column is 334px. GitHub and startup tables are 820px wide, Frontier Models is 626px, the Fantasy Formula 1 asset table is 764px, NBA is 509px, NFL is 525px, and News comparisons are 958px/920px. These are contained scroll regions, not document-overflow bugs. They still make readers remember a name while moving sideways to find its metric.

I would keep the desktop tables and show compact phone rows with name and one or two deciding values together, then expand secondary columns inline. Frontier Models already has useful inline expansion and keyboard scrolling to retain. Suggested work is `$impeccable adapt`.

### F7, P2. Closing a chart-opened football drawer loses keyboard position

Keyboard activation of the SVG button Show ARS details opens Arsenal's drawer, but Escape leaves focus on BODY; the next Tab goes to build notes. The shared modal hook only records HTMLElement openers, so it discards an SVG opener. This was runtime-confirmed on Premier League; the same source path applies to La Liga.

I would retain any focusable connected Element, including SVGElement, and restore focus on close. Keep the existing focus trap and scroll lock. This concerns focus order and dialog focus return; it is not a complete keyboard block. Suggested work is `$impeccable harden`. Sources are [useModal](/Users/isaacvazquez/Website/src/hooks/useModal.ts:36) and [PointsLadderChart](/Users/isaacvazquez/Website/src/components/football/PointsLadderChart.tsx:164).

### F8, P2. Shared stock lookup and topic links miss the touch-target rule

StockSearch is 37px tall on the phone layouts and has no enlarged enclosing click target. Topic-page one-line article title links are 26px tall. Both fall below the repo's 44px minimum. The stock field's 37px height alone is not a WCAG AA minimum-target failure, whose size threshold is smaller.

I would apply the shared 44px field treatment to StockSearch and provide a 44px clickable article row or padded title target on all seven topics. Suggested work is `$impeccable adapt`. Sources are [StockSearch](/Users/isaacvazquez/Website/src/components/investments/StockSearch.tsx:257) and [topic listing](</Users/isaacvazquez/Website/src/app/writing/topics/[topic]/page.tsx:42>).

### F9, P2. Pointer-driven motion ignores the motion preference

The painted photo reveal on Home, Portfolio, and About updates mask coordinates through JavaScript when hover is available. It does not read the reduced-motion preference, and the global CSS duration rule does not stop the pointer-following updates. This is source-verified; browser preference emulation was unavailable.

I would gate both tracking and reveal styling on no-preference and retain a static photo or painting for reduced motion. This violates the repo motion rule; it is not an asserted WCAG AA violation. Suggested work is `$impeccable animate`. Sources are [Catalog97Monet](/Users/isaacvazquez/Website/src/components/catalog97/Catalog97Monet.tsx:50) and [reveal CSS](/Users/isaacvazquez/Website/src/app/catalog97.css:2801).

### F10, P2. Three articles begin their section hierarchy at h3

The full content pass found three articles whose first section is h3 before any h2. I would make the opening takeaway section h2 so heading navigation follows a consistent hierarchy. Suggested work is `$impeccable harden`.

The files are [Agentic AI explained](/Users/isaacvazquez/Website/content/blog/agentic-ai-explained-for-product-managers.mdx:32), [Context engineering](/Users/isaacvazquez/Website/content/blog/context-engineering-replacing-prompt-engineering.mdx:23), and [Agent production costs](/Users/isaacvazquez/Website/content/blog/what-an-ai-agent-actually-costs-in-production.mdx:25).

### F11, P2. Limits and setup language need to sit beside the decision

Fantasy Formula 1's projected-points result needs its unofficial-model qualifier beside the number. Polling already distinguishes observation dates, but the stale-source notice should sit beside each headline average. Score Pools setup uses de-vig, moneyline, modal chalk, posture, and variance before a first-time user has established scoring and pool rules.

I would put a short qualified explanation beside each decision and keep the full calculation/source explanation available below it. Use plain descriptions for pool settings and move rival/risk modelling into an advanced section. Preserve the existing stale-source safeguards, archive labels, and completed-tournament context. Suggested work is `$impeccable clarify` and `$impeccable distill`.

### F12, P3. Advanced setup can follow a useful default

Best Ball offers eight contest choices, Frontier Models combines provider and metric filters, and draft setup exposes custom timer/lineup settings before room creation. The choice count is a cue to inspect grouping, not a rule that four choices is always the maximum.

I would keep all choices and make a useful default path short, with advanced settings directly available when needed. Suggested work is `$impeccable onboard`.

## What I would keep

The football standings fit the phone width, and their named drawers keep detail near the current task. SpaceX's mission modal opens with a visible title and closes with Escape. The fantasy tier board already bounds its phone list, and the draft rooms restore selections after reload with undo/redo or Take back. Those are useful patterns to reuse while correcting the shared SVG focus defect.

The site usually distinguishes sample data, completed archives, dated draft boards, and paused model outputs. The trade calculator's stale-source guard worked in the exercised flow. Score Pools Tracker rejected an empty manual result, accepted 1-1, saved it, and showed seven points. Budget validation and reset cancellation worked. The résumé PDF, 404 recovery, search clear/empty recovery, and tested canonical redirects worked.

The seven retained static routes are Résumé, Accessibility, Privacy, Now, Arcade, Score Pools Tracker, and Agent Build Index. The article reading template is also worth retaining based on the sample review and full structural pass.

## Route catalog

Every static live route is listed once below. Phone evidence shows the default state; the assessment JSON files include task-state captures and the exercised workflow. Rework labels describe task/layout scope, and do not imply a broken underlying calculation or API.

| Route | Verdict | Change or retained behavior | Evidence |
| --- | --- | --- | --- |
| / | refine | Move selected work and the Juno/Civitech writing ahead of the dashboard run; keep the visible work CTA. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/home_390x844.png) · [Source](/Users/isaacvazquez/Website/src/components/catalog97/Catalog97Home.tsx:178) |
| /about | refine | Put work and résumé exits beside the opening biography and shorten the repeated chronology. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/about_390x844.png) · [Source](/Users/isaacvazquez/Website/src/components/catalog97/Catalog97About.tsx:194) |
| /portfolio | rework | Give all 34 projects scan context; 30 secondary rows lack the role, problem, and impact context of the four leads. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/portfolio_390x844.png) · [Source](/Users/isaacvazquez/Website/src/components/catalog97/Catalog97Portfolio.tsx:425) |
| /dashboards | refine | Add name search to the 34-tool directory; retain All as the default and every open category run. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/dashboards_390x844.png) · [Source](/Users/isaacvazquez/Website/src/components/catalog97/Catalog97Dashboards.tsx:190) |
| /resume | retain | Retain the reading layout and working PDF download. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/resume_390x844.png) · [Source](/Users/isaacvazquez/Website/src/components/catalog97/Catalog97Resume.tsx:217) |
| /contact | refine | Move email beside the opening invitation; its phone link starts at y865, below the 844px viewport. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/contact_390x844.png) · [Source](/Users/isaacvazquez/Website/src/components/catalog97/Catalog97Contact.tsx:99) |
| /writing | refine | Separate topic and length controls; bring the first featured article forward from y1216 on phones. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/writing_390x844.png) · [Source](/Users/isaacvazquez/Website/src/components/catalog97/Catalog97Writing.tsx:222) |
| /accessibility | retain | Retain the readable statement, navigation, and recovery links. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/accessibility_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/accessibility/page.tsx:111) |
| /privacy | retain | Retain the readable policy and shared navigation. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/privacy_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/privacy/page.tsx:74) |
| /now | retain | Retain the concise dated update and direct reading sequence. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/now_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/now/page.tsx:109) |
| /changelog | refine | Keep recent entries visible and group older entries by date; the phone document is 53,307px tall. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/changelog_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/changelog/page.tsx:99) |
| /search | refine | Move the input above suggested topics; it starts at y855 on phones. Keep the limited search scope clear. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/search_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/search/page.tsx:43) |
| /investments | rework | Separate holdings, company research, and retirement tasks; keep inputs beside their selected result. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/investments_390x844.png) · [Source](/Users/isaacvazquez/Website/src/components/investments/InvestmentsDashboard.tsx:198) |
| /investments/before-you-buy | refine | Place stock, amount, and sample/saved selection beside the scenario; enlarge the 37px stock field. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/investments-before-you-buy_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/investments/before-you-buy/before-you-buy-client.tsx:267) |
| /fintech-tools/budget-planner | rework | Start with month, income, and savings; the income input begins at y1929 after empty envelope output. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/fintech-tools-budget-planner_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/fintech-tools/budget-planner/budget-planner-client.tsx:230) |
| /fintech-tools/interchange-iq | rework | Put business inputs beside one fee comparison; volume starts at y2200. Pair ranges with precise number entry. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/fintech-tools-interchange-iq_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx:200) |
| /fintech-tools/rent-vs-buy | rework | Put home price, rent, horizon, down payment, and rate together; home price starts at y2098 and rent at y3077. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/fintech-tools-rent-vs-buy_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/fintech-tools/rent-vs-buy/rent-vs-buy-client.tsx:295) |
| /decision-lab | refine | Put inputs beside the verdict; the first input starts at y1879 after the explanation. Keep the calculation ledger. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/decision-lab_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/decision-lab/decision-lab-client.tsx:432) |
| /enablement-assistant | refine | Put mode selection and intake near the opening explanation; retain the inspectable recommendation and ledger. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/enablement-assistant_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/enablement-assistant/enablement-assistant-client.tsx:1630) |
| /food-map | refine | Move city selection ahead of the map; city controls begin at y2079. Add a direct mobile list path. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/food-map_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/food-map/food-map-client.tsx:466) |
| /recipe-finder | rework | Use compact matches and selected-recipe detail; 26 full recipe cards produce an 18,691px phone page. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/recipe-finder_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/recipe-finder/recipe-finder-client.tsx:570) |
| /museum-log | refine | Make quick visits unrated or request a rating; it copies the curator rating into a personal visit. Distinguish the two logs. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/museum-log_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/museum-log/museum-log-client.tsx:1323) |
| /wine-cellar | refine | Show Log a bottle first in the empty cellar; introduce filters once there are bottles to organize. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/wine-cellar_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/wine-cellar/wine-cellar-client.tsx:402) |
| /travel | refine | Place trip creation beside the opening pass; reveal itinerary and journal controls after a trip exists. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/travel_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/travel/travel-planner-client.tsx:330) |
| /travel-deals | rework | Lead with the trip and price decision; align the saved-state message with the entered fare, which resets after reload. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/travel-deals_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/travel-deals/travel-deal-lab-client.tsx:193) |
| /mba-internship-notifications | rework | Put role search and results before feed-health detail and the empty funnel; search begins at y3725. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/mba-internship-notifications_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/mba-internship-notifications/mba-jobs-client.tsx:2137) |
| /arcade | retain | Retain the working start, number-key play, game-over, and retry path. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/arcade_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/arcade/ArcadeClient.tsx:363) |
| /formula-1 | refine | Keep the timing tower compact on phones; place view and race selection beside opening readouts. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/formula-1_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/formula-1/formula-1-client.tsx:1025) |
| /fantasy-formula-1 | rework | Lead with the current team and one suggested lineup; show the unofficial-model qualifier beside projected points. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/fantasy-formula-1_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/fantasy-formula-1/fantasy-formula-1-client.tsx:724) |
| /premier-league | refine | Keep fitted standings and the drawer; bring lookup forward and repair focus return from SVG chart buttons. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/premier-league_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/premier-league/premier-league-client.tsx:272) |
| /la-liga | refine | Keep fitted standings and the drawer; bring lookup forward and apply the shared SVG focus-return correction. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/la-liga_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/la-liga/la-liga-client.tsx:301) |
| /mlb | rework | Use one working division board and a nearby team drawer; selected detail follows all six divisions. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/mlb_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/mlb/mlb-client.tsx:208) |
| /nba | rework | Bring standings forward and open nearby team detail; selected Celtics detail is 1,933px below the tested viewport top. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/nba_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/nba/nba-client.tsx:199) |
| /nfl | rework | Choose one primary standings/division surface and a nearby drawer; selected Raiders detail is 3,807px below the tested viewport top. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/nfl_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/nfl/nfl-client.tsx:252) |
| /golf | rework | Replace 120 full cards with bounded leaderboard rows and nearby detail; selected player detail is about 46 phone screens away. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/golf_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/golf/golf-client.tsx:244) |
| /world-cup-2026 | refine | Retain the completed archive; put group/team selection near its summary and bound the phone group list. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/world-cup-2026_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/world-cup-2026/world-cup-client.tsx:208) |
| /march-madness-2026 | refine | Retain the completed archive and working analysis jump; lead returning readers directly into the workspace. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/march-madness-2026_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/march-madness-2026/march-madness-client.tsx:857) |
| /fantasy-football | refine | Keep the tier board, bounded player list, queue, and drawer; shorten opening scope copy and group board controls. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/fantasy-football_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/fantasy-football/fantasy-football-client.tsx:1586) |
| /fantasy-football/best-ball | refine | Put the board after a compact contest summary; make the longer build guidance expandable. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/fantasy-football-best-ball_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/fantasy-football/best-ball/best-ball-client.tsx:744) |
| /fantasy-football/best-ball/draft-tracker | refine | Keep the active room and recovery; put slot and room creation after a shorter contest summary. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/fantasy-football-best-ball-draft-tracker_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/fantasy-football/best-ball/draft-tracker/draft-tracker-client.tsx:201) |
| /fantasy-football/draft-tracker | refine | Keep the active room and saved state; start with teams, slot, scoring, and default lineup, then optional settings. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/fantasy-football-draft-tracker_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx:1213) |
| /fantasy-football/trade-calculator | refine | Keep stale-source safeguards; place both player packages directly after a compact league summary. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/fantasy-football-trade-calculator_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/fantasy-football/trade-calculator/trade-calculator-client.tsx:514) |
| /fantasy-football/mock-draft | refine | Keep dated practice consent and Take back; place Start mock beside the default-room summary. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/fantasy-football-mock-draft_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/fantasy-football/mock-draft/mock-draft-client.tsx:916) |
| /fantasy-football/weekly | refine | Lead returning users with their saved lineup and a direct edit path; retain roster sharing and import. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/fantasy-football-weekly_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/fantasy-football/weekly/weekly-client.tsx:750) |
| /fantasy-football/waivers | refine | Lead configured teams with saved targets; make roster editing a focused secondary task. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/fantasy-football-waivers_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/fantasy-football/weekly/weekly-client.tsx:557) |
| /score-pools | refine | Lead with create/resume and scoring in plain words; keep market mechanics in selected-match detail. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/score-pools_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/score-pools/score-pools-client.tsx:196) |
| /score-pools/tracker | retain | Retain compact entry, inline validation, and saved-result feedback; clarify entered standing versus computed points. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/score-pools-tracker_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/score-pools/tracker/tracker-client.tsx:108) |
| /score-pools/settings | refine | Put scoring and pool identity first; explain risk and rival modelling in an expandable advanced section. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/score-pools-settings_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/score-pools/settings/settings-client.tsx:342) |
| /github-trending-pulse | rework | Move filters above the signature list; show name and seven-day gain together in compact phone rows. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/github-trending-pulse_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/github-trending-pulse/github-trending-client.tsx:181) |
| /agent-build-index | retain | Retain the compact explanation and direct action into the filtered repository table. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/agent-build-index_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/agent-build-index/page.tsx:122) |
| /ai-dev-tools | rework | Put search and directory after the summary; keep selected map/tool detail beside the triggering action. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/ai-dev-tools_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/ai-dev-tools/ai-dev-tools-client.tsx:276) |
| /frontier-models | refine | Retain inline detail and keyboard scrolling; fit model, context, and token prices into compact phone comparisons. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/frontier-models_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/frontier-models/frontier-models-client.tsx:180) |
| /tech-startup-tracker | rework | Put filters beside a compact sector overview; show company and valuation together and condense the verification notice. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/tech-startup-tracker_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/tech-startup-tracker/tech-startup-client.tsx:164) |
| /bay-area-transit | rework | Put station search and departures in one panel; selecting a station updates a board above the list and offscreen. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/bay-area-transit_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/bay-area-transit/bay-area-transit-client.tsx:352) |
| /earthquake-pulse | refine | Keep the seismogram and log; put filters near the summary and expand event detail beside the selected event. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/earthquake-pulse_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/earthquake-pulse/earthquake-client.tsx:581) |
| /news-pulse | rework | Lead with source filters and the chosen desk; use phone story cards with outlet counts and expandable coverage. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/news-pulse_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/news-pulse/news-pulse-client.tsx:133) |
| /spacex-mission-control | refine | Retain the working mission modal and visuals; bring the next-mission action and manifest jump into the opening phone view. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/spacex-mission-control_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/spacex-mission-control/spacex-mission-control-client.tsx:518) |
| /polling-aggregator | refine | Keep separate observation dates; place stale-source status beside each headline average. | [Phone](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/shots/polling-aggregator_390x844.png) · [Source](/Users/isaacvazquez/Website/src/app/polling-aggregator/polling-aggregator-client.tsx:685) |

## Writing and recovery catalog

| Surface | Verdict | Finding and coverage |
| --- | --- | --- |
| 248 article routes | Retain template; three content refinements | All returned 200 at phone/desktop checks, with one main, one h1, and no document overflow. Five received visual sample review. Correct the three opening h3 sections identified in F10. |
| /writing/topics/agentic-ai | Refine | Enlarge one-line title targets to 44px; 16 of 19 desktop title targets were below the floor. |
| /writing/topics/fintech-product-pricing | Refine | Same shared target correction; seven of eight desktop title targets were below the floor. |
| /writing/topics/pm-workflows | Refine | Same shared target correction; 15 of 18 desktop title targets were below the floor. |
| /writing/topics/signals-commentary | Refine | Same shared target correction; 24 of 30 desktop title targets were below the floor. |
| /writing/topics/space-experiments | Refine | Same shared target correction; 17 of 19 desktop title targets were below the floor. |
| /writing/topics/sports-fantasy | Refine | Same shared target correction; 24 of 30 desktop title targets were below the floor. |
| /writing/topics/systems-quality | Refine | Same shared target correction; 18 of 20 desktop title targets were below the floor. |
| 404 recovery | Retain | Recovery links meet the touch floor, Back home works, and no document overflow was found. The contrast flags were false positives. |
| Canonical and sampled legacy redirects | Retain | /projects, /work, /blog, a blog slug, retired fantasy tier links, /release-notes, and four source-verified project aliases reached their expected destinations. |

## Different readers encounter different problems

A professional peer can reach Work from Home, but the 30 secondary portfolio rows make it hard to understand the work without opening each tool. I would make the problem and contribution visible during the first scan.

A returning mobile user sees repeated overview content before station lookup, job search, or a budget input. A Golf reader can select a player without seeing the detail change. I would give these readers a compact workspace whose input and feedback remain close together.

A first-time planner has to interpret default results before entering a situation, and a new pool organizer has to understand market terminology before choosing rules. I would lead with the task and put plain explanations beside the few decisions needed to begin.

A keyboard user can open the football chart drawer but loses their place on close. A reader who requests reduced motion still receives pointer-driven reveal updates in the source implementation. I would correct those shared primitives before copying their interactions elsewhere.

## Rework sequence and acceptance criteria

I would start with F1 and F5 because they affect visible feedback and the meaning of personal data. Confirm that a phone selection shows a named result in the current view, preserves its URL, closes predictably, and returns keyboard focus. Confirm that quick logging never supplies a personal rating without the reader choosing it, and that the Travel Deal Lab save message matches what survives reload.

I would then redesign the primary workspaces in F2 and F3. The initial phone view should expose the main task or one direct action into it, and the main input should sit beside its result. Test both an empty first visit and a saved return visit. Keep the same calculation engines, data provenance, and full explanations accessible.

I would make F4 a separate professional-site pass, with the existing career evidence earlier on Home and a problem/role/verified-impact scan across the portfolio. Keep all seven global navigation links, the Catalog 97 token system, and the settled Dashboard defaults. A name search can shorten lookup without closing category runs or introducing per-tile kind/freshness labels.

Correct the shared focus, touch-target, motion, and heading issues alongside those passes. Use `$impeccable harden`, `$impeccable adapt`, and `$impeccable clarify` for those corrections, then `$impeccable polish` after the task layouts and behaviors have been checked. This audit does not authorize replacing the visual identity or inventing claims about project impact.

## Evidence files

The [desktop and phone contact sheet](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/evidence/sheet.html) links the route captures. The [route catalog JSON](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/route-catalog.json) retains the 58 verdicts with workflow and evidence references. The independent [core/personal-tool assessment](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/core-tools-assessment.json), [data/sports assessment](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/data-sports-assessment.json), and [technical assessment](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/technical-assessment.json) contain the underlying observations. The [coverage record](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/coverage.json), [full content measurements](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/content-rendering.json), and [contrast verification](/Users/isaacvazquez/.codex/visualizations/2026/10/04/01a10907-8a64-7f30-8267-b98513fb3ef8/site-audit/contrast-verification.json) preserve the measured scope and limitations.

## Changes made after the audit, October 5, 2026

I implemented the audit the same day, on top of the saved fixes it was measured against. All 12 issue families have changes. Of the 51 routes marked rework or refine, 50 changed, and the weekly fantasy board already did what its row asked. Of the seven retained routes, only Score Pools Tracker changed, and that was wording. Nothing here is committed yet. The work sits in the working tree as 118 newly modified files, 28 of the 42 previously saved files built on further, and four new files.

The pattern across most routes is the one the audit asked for, which is that the input or the selection now sits beside its result and long detail opens where it was requested. I kept Catalog 97, every calculation engine, and every source, model, and as-of notice. Where a notice moved, the full text is still on the page and one action away at most.

### How I checked it

The whole-project typecheck and lint pass, and the full Jest run passes with 436 suites and 4,082 tests, counted after main was merged in. The production build succeeds, and the Chromium Playwright suite passes with 402 tests and three skipped, run against that build after the last code change. I did not run the Firefox, WebKit, or mobile Playwright projects.

I measured 60 URLs on the production build at the audit's 390×844 phone viewport in Chromium. None has document-level horizontal overflow, and each has one main landmark and one h1. That measurement ran before the last three small edits, the Frontier Models fix, a label on the museum ticket, and the scroll after a transit station pick, none of which moves a control quoted here. Every position quoted below is the element's distance from the top of the document in that viewport, in the default state of a first visit, so a number under 844 means the control is inside the first screen.

The repo's layout sweep covered 63 routes at 12 Chromium sizes from 320×740 to 2560×1440. It found three fail-level results, all on Frontier Models at 320px, where the new phone table squeezed model names into four-character lines. I fixed that and the route re-swept clean. The sweep also printed 242 review-level notes, mostly scroll margins and orphan grid rows, and I did not compare those against a run from before the changes. The contrast sweep covered 53 changed routes in light and dark and found no failures in their default states. Both sweeps ran before those last edits, and only the Frontier Models route was swept again afterwards.

I also exercised the behaviors the audit confirmed as defects, in Chromium at the phone viewport unless noted. A tap on Doug Ghim on Golf, the Celtics on NBA, the Raiders on NFL, the White Sox on MLB, and Cursor in the development-tools directory each opened a named drawer inside the viewport, kept the selection in the URL, closed on Escape, and returned focus to the row that opened it. Keyboard activation of the Arsenal marker on the Premier League ladder and the Atlético marker on La Liga opened the club drawer, and Escape returned focus to the SVG marker. Picking Richmond on Bay Area Transit put its departures heading 222px from the top of the viewport, which I measured again after the street map merged. Logging a quick visit to the Rijksmuseum stored the museum and the date with no rating, and it survived a reload. Entering $600 for two travelers in Travel Deal Lab still read $300 per seat after a reload. With reduced motion requested on a desktop viewport, hovering the Home portrait set no pointer coordinates and showed no painted layer, and with no preference it did both.

I looked at phone screenshots of 52 routes, the 51 marked rework or refine and Score Pools Tracker, and at eight open drawer or selected states, five in light and three in dark. I did not review desktop layouts by eye beyond what the sweeps and the test suite cover, and true 200% zoom, screen readers, printing, and throttled-network performance remain unchecked, as they were in the audit.

### What changed, by finding

F1. Golf, MLB, NBA, and NFL now open the selected player or team in one shared drawer, `DetailDrawer`, built on the same modal hook as the football club drawer. Golf lost its 120 full cards and prints a bounded leaderboard of the first 20 players with a control to show the whole field, which took the phone page to 5,217px from more than 40,640px, the position the audit recorded for the selected player's detail. MLB shows one division board at a time. NFL leads with standings and moved the division grid below it. The development-tools directory opens tool detail in a drawer and no longer selects the first tool by default. Bay Area Transit has station search and departures in one panel at y615, set beside the street map that merged to main as #563 while this work was in progress, and the separate Departures tab is gone, so an old `view=stations` link falls back to the Lines view and keeps its station.

F2. Budget Planner opens on month, income, and savings, with income at y761 where it was y1929. Interchange IQ has its four inputs at the top, each range paired with a number field, with volume at y761 where it was y2200. Rent vs Buy has home price, rent, years, down payment, and rate together at y803, where home price was y2098 and rent was y3077. Decision Lab's first slider is at y763 where it was y1879. Job search prints search and results ahead of feed health and hides the empty funnel until a role is tracked, and its search field is at y1618 where it was y3725, with a Search roles link at y748. Investments has a Start with control at y590 that prints the chosen workspace first. Fantasy Formula 1 leads with the current team and one suggested lineup.

F3. Recipe Finder shows compact matches with the name, time, and missing-ingredient count, and ingredients and steps open for one selected recipe, which took the phone page from 18,691px to 12,715px. GitHub Trending and Tech Startups moved their filters into the hero above the board they redraw. News Pulse prints story cards on phones with outlet counts and expandable coverage, and keeps both desktop comparison tables.

F4. Each of the 30 secondary portfolio rows now carries the same summary and role line as the four leads, and a build-note link where one exists. On Home, Selected work moved from y2825 to y1299 and the Juno and Civitech write-ups from y4300 to y2774, ahead of the dashboards board, which moved from y1239 to y3448.

F5. A quick museum visit records the museum and the date and no rating, and the visit then offers the existing rating form. The curator's fixed visit total is labelled as the curator's diary, and the ticket's stars are labelled as the curator's. Travel Deal Lab now saves the quoted fare with the trip, and its message names what is saved and says the points check is not.

F6. GitHub Trending, Tech Startups, Fantasy Formula 1, NBA, NFL, and Frontier Models print the name with one or two deciding values on a phone and open the other columns in place or in the drawer. News Pulse uses cards. Every desktop table is unchanged.

F7. The modal hook now keeps an SVG opener, so closing a chart-opened club drawer returns focus to the ladder marker on both league pages.

F8. The stock field is 44px tall where it was 37px. On the agentic AI topic page, the one I measured, the 19 article titles are at least 48px tall on a phone and 44px at 1440px, where the audit found 16 of them under the floor at desktop width. The other six topic pages use the same row.

F9. The painted photo reveal on Home, Portfolio, and About now needs both a hover-capable pointer and no reduced-motion preference, in the script and in the stylesheet.

F10. The three articles open their sections on an h2. I set their `updatedAt` to 2026-10-05 and regenerated the sitemap and `llms-full.txt` to match.

F11. Fantasy Formula 1 prints "Unofficial model estimate" beside projected points. Polling prints the newest poll date beside each headline average and says when it is more than 14 days old. Score Pools settings lead with scoring and pool basics in plain words, and risk and rival modelling sit in an advanced section that starts closed.

F12. Draft setup starts on teams, slot, scoring, and lineup, with the remaining settings behind one disclosure. Best Ball keeps all eight contests in one row that scrolls on a phone, with build guidance behind a control. Frontier Models keeps Provider open and folds Modality and Price tier behind More filters.

### Route by route

Positions are from the same phone measurement.

| Route | What changed | Phone position after |
| --- | --- | --- |
| / | Selected work and the job write-ups now come before the dashboards board, which has its own sheet. | Selected work y1299 |
| /about | See the work and Résumé sit under the opening paragraph, and the seven roles before Haas fold behind one disclosure. | See the work y655, page 7,004px from 8,540px |
| /portfolio | Summary, role, and build-note link on every secondary row. | Page 11,443px from 5,980px |
| /dashboards | Name search over the directory, with All still the default and every category run open. | Search y493 |
| /contact | An Email me button under the opening invitation. | y579, from y865 |
| /writing | Featured pair ahead of the filters, filters inside the archive, and length as its own control apart from topic. | Featured label y906, from y1216 |
| /changelog | Newest eight entries in full, older entries grouped by month with the body behind a disclosure. | Page 28,729px from 53,307px |
| /search | Input ahead of the suggested topics. | y574, from y855 |
| /investments | Start with control for Portfolio, Research, or Retirement, which prints that workspace first. | y590 |
| /investments/before-you-buy | Stock, amount, examples, and the sample or saved choice sit in the hero above the scenario. | Stock y625 |
| /fintech-tools/budget-planner | Month, income, and savings first. | Income y761 |
| /fintech-tools/interchange-iq | Inputs first, with a number field beside each range. | Volume y761 |
| /fintech-tools/rent-vs-buy | Five main assumptions together above the verdict, short notice by the chart, full dated notice lower on the page. | y803 |
| /decision-lab | Sliders beside the verdict, ledger below. | First slider y763 |
| /enablement-assistant | Mode choice in the hero under the opening text. | y801 |
| /food-map | City choice ahead of the map, a Choose a city link in the hero, and a jump to the list of stops. | Link y553, city choice y1464 from y2079 |
| /recipe-finder | Compact matches, one open recipe at a time, pantry field ahead of the figures. | Pantry y649 |
| /museum-log | Unrated quick visits, curator totals and stars labelled. | Not measured |
| /wine-cellar | Log a bottle first in an empty cellar, filters once a bottle exists. | Wine name y957 |
| /travel | Trip form open under the pass on a first visit, itinerary and journal after a trip exists. | Trip name y977 |
| /travel-deals | Trip and fare first, fare saved, figures after the fields. | Region y556, fare y747 |
| /mba-internship-notifications | Search and results ahead of feed health, empty funnel hidden, filter groups behind one toggle on phones. | Link y748, search y1618 |
| /formula-1 | View links and race selection ahead of the figures, tower bounded to ten rows on phones. | y650 and y783 |
| /fantasy-formula-1 | Current team and one suggested lineup lead, qualifier beside projected points, compact asset rows. | Current team y838 |
| /premier-league | Find a club lookup ahead of the figures, focus return from the ladder. | y780 |
| /la-liga | The same lookup and focus return. | y675 |
| /mlb | One division board, team drawer, jump link. | Link y651 |
| /nba | Team drawer, compact phone table, jump link. | Link y606 |
| /nfl | Standings first, team drawer, compact phone table, jump link. | Link y606 |
| /golf | Bounded leaderboard, player drawer, jump link. | Link y555, page 5,217px |
| /world-cup-2026 | Find a team link and lookup, phone group list bounded to four groups plus the selected one. | Link y638 |
| /march-madness-2026 | Open the analysis workspace link in the hero. | y573 |
| /fantasy-football | One clause cut from the scope note. | Not measured |
| /fantasy-football/best-ball | Contests in one row, build guidance behind a control. | Contests y525 |
| /fantasy-football/best-ball/draft-tracker | Shorter intro, longer description behind a disclosure. | Not measured |
| /fantasy-football/draft-tracker | Teams, slot, scoring, and lineup first, the rest optional. | Teams y840 |
| /fantasy-football/trade-calculator | League settings collapse to one line on phones so the packages follow. | You give y1555 |
| /fantasy-football/mock-draft | Start mock beside the default-room summary. | y1003 |
| /fantasy-football/weekly | No change needed, since a saved team already opens on the lineup. | Not measured |
| /fantasy-football/waivers | A saved team opens on the add and drop comparison. | Not measured |
| /score-pools | Plain-word intro, default scoring stated in the create panel. | Create y1066 |
| /score-pools/tracker | Wording that separates the entered standing from computed points. | Not measured |
| /score-pools/settings | Scoring and pool basics first, advanced section closed. | Not measured |
| /github-trending-pulse | Filters above the star log, compact phone rows. | Filters y1037 |
| /ai-dev-tools | Tool drawer, directory after the summary on phones, jump link. | Link y891, directory y1253 |
| /frontier-models | Compact phone sheet, extra filters folded, jump link. | Link y600 |
| /tech-startup-tracker | Filters above the treemap, compact phone rows, short notice with the full one below the list. | Filters y995 |
| /bay-area-transit | Search and departures in one panel, beside the street map from #563. | y615 |
| /earthquake-pulse | Event detail opens under the picked row, log jumps ahead of the figures. | Jumps y606 |
| /news-pulse | Phone story cards, jump to the desk. | Link y619 |
| /spacex-mission-control | Inspect the next mission and Jump to the manifest above the card. | y632 |
| /polling-aggregator | Newest poll date and stale status beside each average. | y734 |
| Seven topic pages | 44px article title links. | Not measured |

Two shared pieces came out of this. `Catalog97ProjectHero` has an `action` slot between the as-of line and the figures, which is what puts the jump links and lookups inside the first phone screen, and it exports `Catalog97HeroReadouts` for a route whose inputs should print ahead of its figures. I also updated `docs/EASTER_EGGS.md`, `PERSONAL_INTEREST_TOOLS.md`, and `STYLING.md` for the behavior that changed, and three browser tests whose steps moved.

### What I left, and where it still falls short

Investments reorders its three workspaces and keeps all of them on the page. I did that because hiding two of them would have broken the fragments and the print that include them, so the audit's separate-task version is still open.

The portfolio rows have no impact figures, because the project data holds a purpose sentence for each tool and no measured outcome, and I was not going to write one. The added context also nearly doubled the phone page.

Several first controls are still under the first screen. Food Map's city choice is at y1464 and job search is at y1618, each behind a link that is in view. The development-tools jump link is at y891, which is 47px under the fold, because that route's standfirst is long. GitHub Trending and Tech Startups have their filters at y1037 and y995, directly above the board. The trade packages are at y1555 below the paused-verdict notices, which I kept because they are tested safeguards. Mock draft's Start is at y1003, the Score Pools create button at y1066, and the first fields on Travel and Wine Cellar at y977 and y957.

Job search is still 46,178px tall on a phone, down from 48,849px, and GitHub Trending's default list is still unbounded, since neither row asked for a bound. Budget Planner still shows empty envelopes on a first visit, and Interchange IQ still repeats fees in its detailed processor list, which carries a filter the summary does not.

On NBA, NFL, and MLB the code opens the drawer on load only when the link names a team other than the view's default, since those routes write the default team into the URL themselves. I read that in the code and did not test it in a browser. The World Cup team detail is still an inline card with a lookup above it, and I did not change how a Formula 1 calendar row shows its detail on a phone. Frontier Models scrolls 24px sideways inside its own table region at 320px, and fits from 360px.

The museum rating slider still starts at the curator's rating, with a note beside it, since a range input has no empty state. Visits that were quick-logged before this change keep the rating that was copied onto them, because they cannot be told apart from ratings someone chose. A browser tab still running the old code will drop an unrated visit on its next save.
